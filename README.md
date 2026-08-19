# Médicalc

**Calcul • Vérification • Entraînement**

PWA mobile-first au thème rose.

## Contenu
- `index.html`, `styles.css`, `app.js` : application.
- `medicaments.json` : base locale utilisée par la PWA.
- `schema_medicament.json` : structure des fiches.
- `import_bdpm.py` : import des fichiers publics BDPM.
- `manifest.webmanifest`, `sw.js` : installation et hors-ligne.
- `icon-192.png`, `icon-512.png` : icônes PWA.

## BDPM
L'importeur utilise les fichiers publics de la Base de Données Publique des Médicaments. Après import, vérifier et compléter séparément les règles cliniques nécessaires : une base administrative/scientifique ne constitue pas à elle seule une règle universelle de prescription, reconstitution ou dilution.

## Mode exercice
Les exercices sont générés automatiquement en trois niveaux :
- Facile : dose + volume.
- Intermédiaire : plusieurs formes de prescription.
- Difficile : dose + prélèvement + dilution + débit.

Les valeurs d'exercice sont pédagogiques et ne constituent pas des posologies réelles.

## Déploiement
Déposer le contenu du dossier sur un hébergement HTTPS. Le service worker permet l'utilisation hors connexion après le premier chargement.

## Sécurité
Pour un usage clinique réel, validation pharmaceutique/médicale, contrôle des unités, limites, arrondis, RCP/protocoles, traçabilité et tests de sécurité sont indispensables.


## Logo
L'icône PWA active utilise maintenant le concept n°2 (goutte rose + croix + symbole =). `logo-concept-medicalc.png` reste uniquement une planche de référence.
