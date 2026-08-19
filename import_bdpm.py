#!/usr/bin/env python3
"""Import BDPM robuste avec plusieurs points de téléchargement officiels."""

from pathlib import Path
import csv
import datetime
import json
import ssl
import urllib.error
import urllib.parse
import urllib.request

FILES = {
    "specialites": "CIS_bdpm.txt",
    "presentations": "cis_cip_bdpm.txt",
    "compositions": "CIS_COMPO_bdpm.txt",
}

# Le portail ANSM actuel fonctionne pour les spécialités/compositions.
# Le fichier des présentations peut momentanément être publié sur l'ancien
# portail avec le nom historique en minuscules : on prévoit donc un fallback.
URLS = {
    "specialites": [
        "https://rec-bdm.ansm.integra.fr/telechargement.php?fichier=CIS_bdpm.txt",
        "https://base-donnees-publique.medicaments.gouv.fr/telechargement.php?fichier=cis_bdpm.txt",
    ],
    "presentations": [
        "https://rec-bdm.ansm.integra.fr/telechargement.php?fichier=cis_cip_bdpm.txt",
        "https://rec-bdm.ansm.integra.fr/telechargement.php?fichier=CIS_CIP_bdpm.txt",
        "https://base-donnees-publique.medicaments.gouv.fr/telechargement.php?fichier=cis_cip_bdpm.txt",
    ],
    "compositions": [
        "https://rec-bdm.ansm.integra.fr/telechargement.php?fichier=CIS_COMPO_bdpm.txt",
        "https://base-donnees-publique.medicaments.gouv.fr/telechargement.php?fichier=cis_compo_bdpm.txt",
    ],
}


def fetch(url):
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 Medicalc/1.0",
            "Accept": "*/*",
        },
    )
    with urllib.request.urlopen(
        request,
        timeout=120,
        context=ssl.create_default_context(),
    ) as response:
        return response.read()


def download(key):
    filename = FILES[key]
    last_error = None

    for url in URLS[key]:
        print(f"Téléchargement {filename} : {url}")
        try:
            data = fetch(url)
            if len(data) >= 1000:
                path = Path(filename)
                path.write_bytes(data)
                print(f"  -> {len(data):,} octets")
                return path
            print(f"  -> réponse vide/trop petite ({len(data)} octets), fallback...")
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
            last_error = exc
            print(f"  -> échec : {exc}")

    raise RuntimeError(
        f"Impossible de télécharger {filename}. Dernière erreur : {last_error}"
    )


def read_rows(path):
    with path.open("r", encoding="latin-1", newline="") as handle:
        return list(csv.reader(handle, delimiter="\t"))


def main():
    files = {key: download(key) for key in FILES}

    specialites = read_rows(files["specialites"])
    presentations = read_rows(files["presentations"])
    compositions = read_rows(files["compositions"])

    medicines = {}

    for row in specialites:
        if not row or not row[0].strip():
            continue
        cis = row[0].strip()
        medicines[cis] = {
            "id": f"CIS-{cis}",
            "cis": cis,
            "nom": row[1].strip() if len(row) > 1 else "",
            "forme": row[2].strip() if len(row) > 2 else "",
            "voies": [x.strip() for x in row[3].split(";") if x.strip()] if len(row) > 3 else [],
            "presentations": [],
            "substances": [],
            "source": "BDPM",
            "date_import": datetime.date.today().isoformat(),
            "clinically_validated": False,
        }

    for row in presentations:
        if len(row) > 2 and row[0].strip() in medicines:
            cis = row[0].strip()
            medicines[cis]["presentations"].append({
                "cip7": row[1].strip() if len(row) > 1 else "",
                "libelle": row[2].strip() if len(row) > 2 else "",
                "cip13": row[6].strip() if len(row) > 6 else "",
            })

    for row in compositions:
        if len(row) > 3 and row[0].strip() in medicines:
            cis = row[0].strip()
            substance = row[3].strip()
            if substance and substance not in medicines[cis]["substances"]:
                medicines[cis]["substances"].append(substance)

    output = {
        "source": "BDPM",
        "date_import": datetime.date.today().isoformat(),
        "medicaments": list(medicines.values()),
    }

    Path("medicaments.json").write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Import BDPM terminé : {len(medicines):,} spécialités")
    with_presentations = sum(bool(m["presentations"]) for m in medicines.values())
    print(f"Présentations associées : {with_presentations:,}")


if __name__ == "__main__":
    main()
