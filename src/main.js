import { createDocument, createShape, getContextFrameCount } from './core/model.js';
import { createEditorState, subscribe, notify } from './state.js';
import { createHistory } from './history.js';
import { createStage } from './stage/Stage.js';
import { mountToolbar } from './ui/Toolbar.js';
import { mountTimeline } from './ui/Timeline.js';
import { mountLibraryPanel } from './ui/LibraryPanel.js';
import { mountPropertiesPanel } from './ui/PropertiesPanel.js';
import { mountMenuBar } from './ui/MenuBar.js';
import { getPref, setPref } from './util/prefs.js';
import { ICONS } from './ui/icons.js';

const doc = createDocument({ name: 'Sans titre' });
// Un petit contenu de départ pour ne pas ouvrir sur une scène totalement vide.
doc.layers[0].keyframes[0].elements.push(
  createShape('rect', { x: doc.width / 2, y: doc.height / 2, width: 120, height: 90, fill: '#cb4b16', stroke: '#073642', strokeWidth: 3 }),
);

const state = createEditorState(doc);

// Créé tôt : createHistory() s'abonne immédiatement à state, et doit voir
// chaque notify() AVANT le rendu (voir plus bas) pour que les boutons
// annuler/rétablir reflètent l'état à jour dès ce même passage.
const rawHistory = createHistory(state);

// Doit être déclaré avant renderAll() (appelé plus bas dès le montage) car
// il y est référencé.
let tick = 0;

const toolbarCtl = mountToolbar(document.getElementById('toolbar'), state);
const timelineCtl = mountTimeline(document.getElementById('timeline'), state);
const propertiesCtl = mountPropertiesPanel(document.getElementById('properties-panel'), state);

const stageContainer = document.getElementById('stage-container');
const stage = createStage({
  container: stageContainer,
  state,
  // Une sélection ne change pas le document : on ne redessine que les
  // panneaux qui en dépendent, jamais la scène elle-même (voir Stage.js).
  onSelectionChange: () => {
    propertiesCtl.update();
    timelineCtl.update();
  },
});

const banner = document.createElement('div');
banner.className = 'edit-path-banner';
banner.style.display = 'none';
banner.addEventListener('click', () => {
  state.editPath = state.editPath.slice(0, -1);
  state.selectedElementIds = [];
  state.currentFrame = 0;
  notify(state);
});
document.getElementById('stage-wrap').appendChild(banner);

const libraryCtl = mountLibraryPanel(document.getElementById('library-panel'), state, {
  addInstanceAt: stage.addInstanceAt,
});

// Un undo/redo remplace state.doc en bloc — la taille de scène peut avoir
// changé (ex. on annule un redimensionnement), donc on redimensionne le
// Konva.Stage en plus du re-rendu déjà déclenché par notify().
const history = {
  undo: () => { rawHistory.undo(); stage.resize(); },
  redo: () => { rawHistory.redo(); stage.resize(); },
  canUndo: rawHistory.canUndo,
  canRedo: rawHistory.canRedo,
};

const menuBarCtl = mountMenuBar(document.getElementById('menubar'), state, {
  onDocReplaced: () => {},
  onStageResize: () => stage.resize(),
  history,
});

function updateBanner() {
  if (state.editPath.length) {
    const symbolId = state.editPath[state.editPath.length - 1];
    const symbol = state.doc.symbols[symbolId];
    banner.innerHTML = `${ICONS.pencil} <span>Édition de « ${symbol ? symbol.name : '?'} » — cliquer pour revenir à la scène</span>`;
    banner.style.display = 'block';
  } else {
    banner.style.display = 'none';
  }
}

// ------------------------------------------------ redimensionnement latéral
// Le panneau bibliothèque, le panneau propriétés et tout futur panneau
// empilé dans #sidebar partagent la même colonne de grille : élargir cette
// colonne les élargit tous ensemble (voir Panel.js pour l'empilement).
const mainEl = document.getElementById('main');
const sidebarEl = document.getElementById('sidebar');
const sidebarResizer = document.getElementById('sidebar-resizer');

const sidebarToggleBtn = document.createElement('button');
sidebarToggleBtn.id = 'sidebar-toggle-btn';
sidebarToggleBtn.title = 'Afficher / masquer le panneau latéral';
sidebarResizer.appendChild(sidebarToggleBtn);

function applySidebarWidth(px) {
  mainEl.style.gridTemplateColumns = `44px 1fr 5px ${px}px`;
}

let sidebarWidth = getPref('sidebarWidth', 260);
let sidebarCollapsed = getPref('sidebarFullyCollapsed', false);

function applySidebarCollapse() {
  sidebarEl.style.display = sidebarCollapsed ? 'none' : '';
  applySidebarWidth(sidebarCollapsed ? 0 : sidebarWidth);
  sidebarToggleBtn.innerHTML = ICONS[sidebarCollapsed ? 'chevronLeft' : 'chevronRight'];
}
applySidebarCollapse();

sidebarToggleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  sidebarCollapsed = !sidebarCollapsed;
  setPref('sidebarFullyCollapsed', sidebarCollapsed);
  applySidebarCollapse();
});

let resizingSidebar = false;
sidebarResizer.addEventListener('mousedown', (e) => {
  if (e.target === sidebarToggleBtn || sidebarCollapsed) return;
  resizingSidebar = true;
  sidebarResizer.classList.add('dragging');
  e.preventDefault();
});
window.addEventListener('mousemove', (e) => {
  if (!resizingSidebar) return;
  const rect = mainEl.getBoundingClientRect();
  sidebarWidth = Math.max(200, Math.min(600, rect.right - e.clientX));
  applySidebarWidth(sidebarWidth);
});
window.addEventListener('mouseup', () => {
  if (!resizingSidebar) return;
  resizingSidebar = false;
  sidebarResizer.classList.remove('dragging');
  setPref('sidebarWidth', sidebarWidth);
});

function renderAll() {
  stage.render(tick);
  toolbarCtl.update();
  timelineCtl.update();
  libraryCtl.update();
  propertiesCtl.update();
  menuBarCtl.update();
  updateBanner();
}

subscribe(state, renderAll);
renderAll();

// ---------------------------------------------------------------- playback
let lastTime = null;
let acc = 0;
let wasPlaying = false;

function loop(time) {
  requestAnimationFrame(loop);

  if (state.playing && !wasPlaying) { lastTime = time; acc = 0; }
  wasPlaying = state.playing;
  if (!state.playing) return;

  if (lastTime === null) lastTime = time;
  const dt = time - lastTime;
  lastTime = time;
  const frameDuration = 1000 / state.doc.frameRate;
  acc += dt;
  let advanced = false;
  while (acc >= frameDuration) {
    acc -= frameDuration;
    const fc = getContextFrameCount(state.doc, state.editPath);
    state.currentFrame = (state.currentFrame + 1) % fc;
    tick++;
    advanced = true;
  }
  if (advanced) {
    stage.render(tick);
    timelineCtl.update();
  }
}
requestAnimationFrame(loop);
