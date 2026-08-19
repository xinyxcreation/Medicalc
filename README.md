# Médicalc

PWA de calcul et d'entraînement médical, avec recherche médicament alimentée par la BDPM.

## BDPM
La GitHub Action `.github/workflows/update-bdpm.yml` :
- travaille sur `master` ;
- lit la page officielle BDPM pour découvrir les liens actuels ;
- télécharge les spécialités obligatoirement ;
- essaie les présentations et compositions avec plusieurs solutions de secours ;
- génère `medicaments.json` ;
- vérifie que la base contient plus de 1000 spécialités ;
- commit automatiquement la nouvelle base.

La BDPM est actualisée mensuellement. La page officielle indique aussi les dates de mise à jour de chaque fichier.

## Interface
Conteneur desktop de 900 px centré, thème rose, navigation Calcul / Prélèvement-Dilution / Perfusion / Entraînement / Médicaments / Réglages, autocomplétion BDPM dès le focus du champ.

## Sécurité
L'application est un outil d'aide au calcul et ne remplace pas la prescription, le RCP, les protocoles locaux ni la validation clinique.


## Correctif navigation v12
Le fichier `app.js` a été entièrement reconstruit. Les six onglets sont maintenant reliés
à une navigation fonctionnelle, avec activation/désactivation des sections, recherche BDPM,
calcul, prélèvement/dilution, perfusion et exercices.


## Template V13
Retour au template simple de la version précédente pour la présentation du médicament,
avec un conteneur strictement centré à 900 px. La logique JavaScript fonctionnelle V12
est conservée.
