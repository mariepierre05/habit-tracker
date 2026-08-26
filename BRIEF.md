# Brief pour Claude Code — App de suivi d'habitudes

## Contexte
Ce composant React (`HabitTracker.jsx`) a été construit progressivement dans Claude.ai
sous forme d'artifact. Il fonctionne et le design est validé — l'objectif maintenant
est de le transformer en vraie PWA autonome, hébergeable en dehors de Claude.

## Ce que fait déjà l'app (à conserver tel quel)
- Suivi d'habitudes quotidiennes avec 3 types : case à cocher, objectif chiffré
  (ex : boire de l'eau, marcher), et "multi-périodes" (ex : grignotage réparti en
  4 moments de la journée : matin / début d'aprèm / fin d'aprèm / soirée).
- Ajout et suppression d'habitudes personnalisées (avec confirmation à la suppression).
- Calcul de streaks (jours consécutifs) par habitude.
- Visualisation "plante qui pousse" (SVG) : une par jour, colorée selon les habitudes
  tenues, plus une vue de la semaine (7 mini-plantes).
- En-tête avec illustration de montagnes en pastel, heure en direct, date du jour,
  et la fête du jour (calendrier français des prénoms, données statiques dans le
  fichier, tableau `FETE_DATA`).
- Palette de couleurs pastel assignée par habitude (tableau `PALETTE`), carte qui
  se colore progressivement à mesure que l'habitude est validée.
- Petit message + illustration "bouquet" quand toutes les habitudes du jour sont faites.

## Ce qu'il faut changer pour la rendre autonome

1. **Stockage : remplacer `window.storage` par `localStorage`.**
   Le fichier utilise actuellement l'API `window.storage.get/set` (spécifique aux
   artifacts Claude.ai). Cette API n'existe pas en dehors de Claude — il faut la
   remplacer par `localStorage.getItem` / `localStorage.setItem` (clés `habits` et
   `entries`, valeurs JSON stringifiées, exactement comme aujourd'hui). Garder la
   même logique de migration (l'ancienne habitude "nosnack" en check → multi-périodes).

2. **Mettre en projet Vite + React** (ou CRA), avec Tailwind configuré normalement
   (le fichier actuel suppose des classes Tailwind "de base" sans config JIT avancée,
   donc ça devrait passer sans souci avec une config Tailwind standard).

3. **Ajouter un vrai PWA manifest** (`manifest.json`) + icônes (192x192, 512x512,
   et `apple-touch-icon.png` pour iOS) inspirées du thème de l'app (une feuille /
   une plante stylisée, sur fond de la couleur "paper" #FBF7F1 ou une teinte de la
   palette). Objectif : que l'icône sur l'écran d'accueil iPhone soit propre à l'app,
   pas le logo Claude (c'est le problème actuel qu'on essaie de résoudre).

4. **Préparer pour un déploiement Netlify** (ou Vercel/GitHub Pages) : build statique,
   pas de backend nécessaire.

5. Les polices utilisées (Fraunces, Inter, IBM Plex Mono) sont chargées via
   `@import` Google Fonts dans le composant — à garder ou déplacer proprement dans
   le CSS global du projet.

## Point d'attention
Les données actuellement enregistrées dans l'artifact Claude (habitudes ajoutées,
historique, streaks) ne se transféreront PAS automatiquement vers le localStorage
de la nouvelle version — ce sont deux stockages différents. Si l'historique compte,
prévoir un export/import manuel avant de basculer définitivement.

## Prochaine étape suggérée pour Claude Code
Démarrer un projet Vite + React + Tailwind, y intégrer `HabitTracker.jsx` en
adaptant le stockage, ajouter le manifest + icônes, puis préparer le déploiement
Netlify.
