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

## GitHub Actions — branche master

Les workflows sont prêts pour la branche **master** :

- `update-bdpm.yml` : mise à jour automatique de `medicaments.json` depuis la BDPM, avec possibilité de lancement manuel.
- `deploy-pages.yml` : déploiement automatique de la PWA sur GitHub Pages à chaque push sur `master`.

Pour GitHub Pages, sélectionner **GitHub Actions** comme source de déploiement dans les paramètres Pages du dépôt.

## Recherche médicament
Le champ médicament utilise une autocomplétion : les suggestions proviennent directement de `medicaments.json`, qui est alimenté par l'import BDPM. La recherche n'affiche que les premiers résultats correspondants et permet une sélection tactile sur mobile.


## Téléchargement automatique BDPM

La GitHub Action `.github/workflows/update-bdpm.yml` télécharge automatiquement les fichiers publics BDPM et reconstruit `medicaments.json`.

Elle se lance :
- automatiquement lors d'un push sur `master` (hors modification de `medicaments.json`) ;
- automatiquement chaque mois ;
- manuellement avec **Actions → 🔄 Téléchargement automatique BDPM → Run workflow**.

La PWA charge ensuite automatiquement le `medicaments.json` mis à jour à l'ouverture. La BDPM est une base de référence ; les règles de calcul clinique restent séparées et doivent être validées.


### Correctif BDPM
Le téléchargement utilise les noms officiels et sensibles à la casse :
`CIS_bdpm.txt`, `CIS_CIP_bdpm.txt`, `CIS_COMPO_bdpm.txt`.
L'erreur 404 venait de l'utilisation de `cis_bdpm.txt`.


## Nouveau template
Interface recentrée avec une largeur maximale d'environ 1008 px, cartes larges, en-tête rose et navigation en onglets, inspirée du gabarit fourni tout en conservant l'identité Médicalc.


## Correctif BDPM v9
La source de téléchargement utilise désormais la plateforme officielle ANSM actuelle :
`rec-bdm.ansm.integra.fr/telechargement.php`.
Le champ Médicament affiche les suggestions dès le clic/focus et les filtre pendant la saisie.


## Template corrigé
Interface alignée sur le nouveau modèle fourni :
- conteneur central fixe d'environ 900 px sur desktop ;
- barre supérieure et navigation alignées sur la même largeur ;
- navigation multi-onglets ;
- carte de calcul de prescription avec recherche BDPM ;
- présentations disponibles et données de présentation ;
- boutons Réinitialiser / Calculer ;
- sections Prélèvement, Perfusion, Entraînement, Médicaments et Réglages ;
- pied de page centré et aligné sur le même conteneur.
