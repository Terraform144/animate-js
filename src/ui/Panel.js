import { getPref, setPref } from '../util/prefs.js';
import { ICONS } from './icons.js';

// Construit l'enveloppe standard d'un panneau réductible (barre de titre +
// bouton replier/déplier + corps scrollable), utilisée par tous les
// panneaux empilés dans #sidebar. `container` devient le panneau lui-même
// (classe .panel) ; le contenu propre à chaque panneau se monte dans le
// `.panel-body` retourné.
export function createPanel(container, { key, label, actions = [] }) {
  container.innerHTML = '';
  container.classList.add('panel');

  const titleBar = document.createElement('div');
  titleBar.className = 'panel-title';

  const collapseBtn = document.createElement('button');
  collapseBtn.className = 'panel-collapse-btn';
  collapseBtn.title = 'Réduire / agrandir le panneau';

  const labelEl = document.createElement('span');
  labelEl.className = 'panel-label';
  labelEl.textContent = label;

  titleBar.append(collapseBtn, labelEl, ...actions);

  const body = document.createElement('div');
  body.className = 'panel-body';

  container.append(titleBar, body);

  let collapsed = getPref(key, false);
  function apply() {
    container.classList.toggle('collapsed', collapsed);
    collapseBtn.innerHTML = ICONS[collapsed ? 'chevronRight' : 'chevronDown'];
  }
  collapseBtn.addEventListener('click', () => {
    collapsed = !collapsed;
    setPref(key, collapsed);
    apply();
  });
  apply();

  return { titleBar, body };
}
