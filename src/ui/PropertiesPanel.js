import { getContextLayers, getActiveKeyframe, getKeyframeAt, insertKeyframe } from '../core/model.js';
import { notify } from '../state.js';
import { createPanel } from './Panel.js';

export function mountPropertiesPanel(container, state) {
  const { body } = createPanel(container, { key: 'propertiesCollapsed', label: 'Propriétés' });

  function layers() { return getContextLayers(state.doc, state.editPath); }
  function selectedLayer() { return layers().find((l) => l.id === state.selectedLayerId); }

  function mutateSelectedElement(fn) {
    const layer = selectedLayer();
    if (!layer) return;
    const kf = insertKeyframe(layer, state.currentFrame);
    const el = kf.elements.find((e) => e.id === state.selectedElementIds[0]);
    if (!el) return;
    fn(el);
    notify(state);
  }

  function numberRow(label, value, onChange, opts = {}) {
    const row = document.createElement('div');
    row.className = 'prop-row';
    const l = document.createElement('label');
    l.textContent = label;
    const input = document.createElement('input');
    input.type = 'number';
    if (opts.step) input.step = opts.step;
    input.value = Math.round(value * 100) / 100;
    input.addEventListener('change', () => onChange(parseFloat(input.value) || 0));
    row.append(l, input);
    body.appendChild(row);
    return input;
  }

  function colorRow(label, value, onChange) {
    const row = document.createElement('div');
    row.className = 'prop-row';
    const l = document.createElement('label');
    l.textContent = label;
    const input = document.createElement('input');
    input.type = 'color';
    input.value = value || '#000000';
    input.addEventListener('input', () => onChange(input.value));
    row.append(l, input);
    body.appendChild(row);
  }

  function textRow(label, value, onChange) {
    const row = document.createElement('div');
    row.className = 'prop-row';
    const l = document.createElement('label');
    l.textContent = label;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value || '';
    input.addEventListener('change', () => onChange(input.value));
    row.append(l, input);
    body.appendChild(row);
  }

  function renderTweenSection() {
    const layer = selectedLayer();
    if (!layer) return;
    const kf = getKeyframeAt(layer, state.currentFrame);
    if (!kf || !kf.tween) return;
    const row = document.createElement('div');
    row.className = 'prop-row';
    const l = document.createElement('label');
    l.textContent = 'Interpolation';
    const select = document.createElement('select');
    for (const [value, text] of [['linear', 'Linéaire'], ['easeIn', 'Accél.'], ['easeOut', 'Décél.'], ['easeInOut', 'Accél./Décél.']]) {
      const opt = document.createElement('option');
      opt.value = value; opt.textContent = text;
      if (kf.tween.easing === value) opt.selected = true;
      select.appendChild(opt);
    }
    select.addEventListener('change', () => { kf.tween.easing = select.value; notify(state); });
    row.append(l, select);
    body.appendChild(row);

    const hint = document.createElement('div');
    hint.className = 'prop-empty';
    hint.style.marginTop = '-4px';
    hint.textContent = "Astuce : une courbe (plume) avec le même nombre de points sur les deux images clés sera morphée point à point ; sinon elle bouge en bloc.";
    body.appendChild(hint);
  }

  function renderDocSection() {
    const group = document.createElement('div');
    group.className = 'prop-group';
    body.appendChild(group);
    const info = document.createElement('div');
    info.className = 'prop-empty';
    info.textContent = state.editPath.length
      ? `Édition du symbole. Sélectionne un objet sur la scène.`
      : 'Aucune sélection. Sélectionne un objet sur la scène.';
    group.appendChild(info);
  }

  function render() {
    body.innerHTML = '';
    renderTweenSection();

    if (state.selectedElementIds.length !== 1) {
      renderDocSection();
      return;
    }

    const layer = selectedLayer();
    if (!layer) { renderDocSection(); return; }
    const active = getActiveKeyframe(layer, state.currentFrame);
    const el = active && active.elements.find((e) => e.id === state.selectedElementIds[0]);
    if (!el) { renderDocSection(); return; }

    numberRow('X', el.x, (v) => mutateSelectedElement((e) => (e.x = v)));
    numberRow('Y', el.y, (v) => mutateSelectedElement((e) => (e.y = v)));
    if (el.kind === 'shape' && el.shapeType !== 'line' && el.shapeType !== 'path') {
      numberRow('Largeur', el.width, (v) => mutateSelectedElement((e) => (e.width = Math.max(1, v))));
      numberRow('Hauteur', el.height, (v) => mutateSelectedElement((e) => (e.height = Math.max(1, v))));
    }
    numberRow('Rotation', el.rotation, (v) => mutateSelectedElement((e) => (e.rotation = v)));
    numberRow('Échelle X', el.scaleX, (v) => mutateSelectedElement((e) => (e.scaleX = v)), { step: 0.1 });
    numberRow('Échelle Y', el.scaleY, (v) => mutateSelectedElement((e) => (e.scaleY = v)), { step: 0.1 });
    numberRow('Opacité', el.opacity, (v) => mutateSelectedElement((e) => (e.opacity = Math.max(0, Math.min(1, v)))), { step: 0.1 });

    if (el.kind === 'shape') {
      colorRow('Remplissage', el.fill, (v) => mutateSelectedElement((e) => (e.fill = v)));
      colorRow('Contour', el.stroke, (v) => mutateSelectedElement((e) => (e.stroke = v)));
      numberRow('Ép. contour', el.strokeWidth, (v) => mutateSelectedElement((e) => (e.strokeWidth = Math.max(0, v))));
      if (el.shapeType === 'text') {
        textRow('Texte', el.text, (v) => mutateSelectedElement((e) => (e.text = v)));
        numberRow('Taille police', el.fontSize, (v) => mutateSelectedElement((e) => (e.fontSize = Math.max(1, v))));
      }
    } else if (el.kind === 'instance') {
      const symbol = state.doc.symbols[el.symbolId];
      const row = document.createElement('div');
      row.className = 'prop-row';
      row.innerHTML = `<label>Symbole</label><div>${symbol ? symbol.name : '(manquant)'}</div>`;
      body.appendChild(row);
      textRow('Nom instance', el.name, (v) => mutateSelectedElement((e) => (e.name = v)));
    }

    const delRow = document.createElement('div');
    delRow.className = 'prop-row';
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Supprimer l\'objet';
    delBtn.addEventListener('click', () => {
      const kf = insertKeyframe(layer, state.currentFrame);
      kf.elements = kf.elements.filter((e) => e.id !== el.id);
      state.selectedElementIds = [];
      notify(state);
    });
    delRow.appendChild(delBtn);
    body.appendChild(delRow);
  }

  render();
  return { update: render };
}
