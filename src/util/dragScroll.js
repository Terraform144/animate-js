// Le scroll horizontal natif (overflow-x: auto) ne répond qu'au geste tactile
// et à la molette : sur mobile avec une souris connectée (pas de doigt, pas de
// molette horizontale sur la plupart des souris), les barres qui débordent
// (menubar, timeline) devenaient impossibles à faire défiler. On ajoute donc
// un cliquer-glisser générique, actif uniquement pour un pointeur "souris" —
// le tactile garde son scroll natif, plus fluide, sans double gestion.
export function enableDragScroll(el) {
  let dragging = false;
  let startX = 0;
  let startScroll = 0;

  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    // Un clic sur un contrôle interactif ne doit jamais démarrer un glissé :
    // seul le fond de la barre (entre les boutons) sert de poignée de scroll.
    if (e.target.closest('button, input, select, textarea, label')) return;
    dragging = true;
    startX = e.clientX;
    startScroll = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    el.scrollLeft = startScroll - (e.clientX - startX);
  });

  function stop(e) {
    if (!dragging) return;
    dragging = false;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  }
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointercancel', stop);

  el.classList.add('drag-scroll');
}
