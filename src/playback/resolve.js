import { getActiveKeyframe, getNextKeyframe } from '../core/model.js';
import { applyEasing, interpolateElement } from './interpolate.js';

// Resolves the visible, fully-interpolated list of elements for a given
// array of layers at a given frame index. Elements are returned bottom-layer
// first (layers[0] = bottom, matching Animate's stacking where the topmost
// layer in the panel renders on top — callers render in array order).
export function resolveLayersAtFrame(layers, frameIndex) {
  const result = [];
  for (const layer of layers) {
    if (!layer.visible) continue;
    const elements = resolveLayerAtFrame(layer, frameIndex);
    for (const el of elements) result.push({ ...el, layerId: layer.id });
  }
  return result;
}

export function resolveLayerAtFrame(layer, frameIndex) {
  const kf = getActiveKeyframe(layer, frameIndex);
  if (!kf) return [];
  if (!kf.tween) return kf.elements;

  const next = getNextKeyframe(layer, kf);
  if (!next || next.index === kf.index) return kf.elements;

  const span = next.index - kf.index;
  const raw = Math.min(1, Math.max(0, (frameIndex - kf.index) / span));
  const t = applyEasing(raw, kf.tween.easing);

  return kf.elements.map((el) => {
    const target = next.elements.find((e) => e.id === el.id);
    return interpolateElement(el, target, t);
  });
}
