// Seuils partagés entre le CSS (style.css, media queries "(pointer:
// coarse), (max-width: 1024px)") et le JS qui doit calculer des tailles en
// pixels de façon cohérente avec ce que le CSS affiche réellement (largeur
// de colonnes de grille, hauteur des lignes de la timeline...).
export const OVERLAY_BREAKPOINT = 1024;
export const PHONE_BREAKPOINT = 640;

export function isNarrowViewport() {
  return window.innerWidth <= OVERLAY_BREAKPOINT;
}

export function isTouchLike() {
  return isNarrowViewport() || window.matchMedia('(pointer: coarse)').matches;
}

// Seuil plus strict que isNarrowViewport(), utilisé uniquement pour choisir
// des défauts d'affichage sensés au tout premier chargement (ex. replier la
// timeline sur téléphone) — pas pour le dimensionnement des contrôles.
export function isPhoneSize() {
  return window.innerWidth <= PHONE_BREAKPOINT;
}

// Très grand écran (moniteur 4K, TV) — voir aussi les media queries
// (min-width: 1920px)/(min-width: 2600px) dans style.css, à garder
// synchronisées avec ce seuil.
export const LARGE_SCREEN_BREAKPOINT = 1920;

export function isLargeScreen() {
  return window.innerWidth >= LARGE_SCREEN_BREAKPOINT;
}
