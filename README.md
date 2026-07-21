# Animate JS

Éditeur d'animation vectorielle image par image, inspiré d'Adobe Animate,
en JavaScript vanilla (ES modules, sans framework UI). Konva.js est utilisé
comme moteur de rendu Canvas 2D pour la scène ; le reste (état, timeline,
bibliothèque, panneau de propriétés, export) est écrit à la main.

Thème Solarisé clair (fond crème, texte quasi-noir adouci, un seul accent
bleu) ; toutes les icônes de l'interface sont des SVG au trait dessinés à la
main dans `src/ui/icons.js` (voir cette section plus bas).

## Démarrer

```bash
npm install
npm run dev
```

Ouvrir l'URL affichée (http://localhost:5173).

## Fonctionnalités

- **Annuler / rétablir** (Ctrl+Z / Ctrl+Y) : 15 niveaux, boutons ↩/↪ dans la
  barre de menu. Ne suit que les changements du document (formes, calques,
  images clés, symboles...), pas la sélection ni le défilement.
- **Panneaux réductibles** : bouton ▾/▸ sur la timeline, la bibliothèque et
  le panneau propriétés pour les réduire à leur barre de titre. Le conteneur
  latéral entier (bibliothèque + propriétés + futurs panneaux) se replie
  aussi d'un clic sur le bouton ◂/▸ au milieu de la poignée de
  redimensionnement. Cette poignée permet aussi de glisser pour élargir/
  rétrécir toute la colonne (tous les panneaux empilés en partagent la
  largeur). Tous ces réglages sont mémorisés (localStorage) d'une session à
  l'autre.
- **Scène** : outils Sélection, Sous-sélection, Rectangle, Ellipse, Ligne,
  Plume, Texte. Déplacement / redimensionnement / rotation via poignées.
  Suppr pour effacer la sélection.
- **Plume Bézier** : clic = point anguleux, clic-glissé = point lisse
  (poignées symétriques), clic près du premier point = fermer le tracé,
  Entrée/double-clic = terminer un tracé ouvert, Échap = annuler.
- **Sous-sélection (touche A)** : sélectionner une courbe existante affiche
  ses points d'ancrage et leurs poignées, déplaçables individuellement pour
  retoucher la forme après coup.
- **Morphing** : si une image clé tweenée contient une courbe avec
  exactement le même nombre de points que sur l'image clé suivante, ses
  points sont interpolés un à un (la forme se déforme) ; sinon elle bouge
  comme un bloc rigide (position/rotation/échelle) comme les autres formes.
- **Timeline** : calques (ajout, suppression, visibilité, verrouillage,
  renommage), images clés (F6), images clés vides (F7), lecture/pause
  (Espace), défilement (scrub) en cliquant sur la règle ou une cellule.
- **Tween de mouvement** : bouton "⇄" sur une image clé pour interpoler
  vers la suivante (position, rotation, échelle, opacité, couleurs), avec
  4 courbes d'accélération choisies dans le panneau Propriétés.
- **Symboles / bibliothèque** : sélectionner des objets puis "Convertir en
  symbole" (F8) crée un symbole Graphic ou MovieClip réutilisable ; double-
  clic sur une instance (ou un élément de la bibliothèque) pour éditer le
  symbole en mode isolé.
- **Labels de frame** : champ "Étiquette" dans la timeline pour nommer une
  image (ex. "walk", "jump"), affichée sous forme de 🏷 sur la règle —
  utilisable avec `gotoAndPlay('walk')` une fois exporté.
- **Export "objet de jeu"** : bouton 🎮 sur un symbole dans la bibliothèque —
  télécharge `animate-runtime.js` (runtime `MovieClip` partagé, aucune
  dépendance) + `<NomDuSymbole>.js` (une classe `extends MovieClip` qui
  embarque les données du symbole et de ses dépendances). Utilisable dans
  n'importe quelle boucle de jeu :
  `import { MonPersoClip } from './MonPerso.js'; const c = new MonPersoClip();
  c.gotoAndPlay('walk'); /* boucle */ c.update(dt); c.draw(ctx);`
- **Export scène complète** : "Exporter HTML" génère un fichier HTML
  autonome (aucune dépendance, aucun build) qui rejoue toute l'animation
  avec un runtime Canvas 2D minimal embarqué. "Enregistrer JSON" / "Ouvrir…"
  permettent de sauvegarder et recharger le projet.

## Structure

```
src/
  core/model.js           modèle de document (calques, images clés, formes, symboles, labels)
  playback/                interpolation + résolution d'une image (utilisé par l'éditeur)
  stage/Stage.js            rendu Konva + outils de dessin + sélection
  ui/                       Toolbar, Timeline, LibraryPanel, PropertiesPanel, MenuBar
  ui/Panel.js               enveloppe standard d'un panneau réductible (titre + corps) — à réutiliser pour tout nouveau panneau du conteneur latéral
  ui/icons.js               jeu d'icônes SVG au trait partagé (currentColor — suit automatiquement la couleur du bouton)
  export/exportHTML.js      export de toute la scène en HTML autonome (runtime Canvas 2D inline)
  export/animateRuntime.js  runtime MovieClip partagé (play/stop/gotoAndPlay/update/draw)
  export/exportSymbol.js    export d'un symbole en classe JS réutilisable (objet de jeu)
  util/download.js          petit utilitaire de téléchargement de fichier texte
  util/prefs.js              petites préférences UI persistées (localStorage) : largeur/repli des panneaux
  state.js                  état central + pub/sub
  history.js                 annuler/rétablir (15 niveaux)
  main.js                   assemblage de l'application
```

## Limites connues (v1)

- Pas d'undo/redo.
- La rotation des rectangles/ellipses/texte pivote autour du centre ; les
  tracés (ligne/plume) pivotent autour de leur premier point.
- Pas de dégradés, pas d'import d'images bitmap.
- Le morphing apparie les points par index (1er avec 1er, 2e avec 2e, ...),
  pas de "shape hints" pour guider l'appariement comme dans Animate — deux
  courbes très différentes peuvent donc morpher de façon étrange.
- Pas moyen d'ajouter une poignée à un point anguleux existant depuis l'outil
  sous-sélection (seul le clic-glissé à la création en crée une).
- Le contenu imbriqué dans une instance n'est pas éditable directement sur
  la scène parente : il faut double-cliquer pour entrer dans le symbole.
- Pas de zoom/pan de la scène.
