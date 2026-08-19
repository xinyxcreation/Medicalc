#!/usr/bin/env python3
"""Import automatique des fichiers publics de la BDPM dans medicaments.json.

Source officielle :
https://base-donnees-publique.medicaments.gouv.fr/telechargement
"""
from pathlib import Path
import csv, json, urllib.request, datetime, ssl

BASE = "https://base-donnees-publique.medicaments.gouv.fr/telechargement.php?fichier="
# Noms officiels des fichiers BDPM (respecter la casse).\nFILE_NAMES_OFFICIELS = True\nFILES = {
    "specialites": "CIS_bdpm.txt",
    "presentations": "CIS_CIP_bdpm.txt",
    "compositions": "CIS_COMPO_bdpm.txt",
}

def download(name):
    path = Path(name)
    url = BASE + name
    print("Téléchargement :", url)
    req = urllib.request.Request(url, headers={"User-Agent": "Medicalc/1.0"})
    with urllib.request.urlopen(req, timeout=60, context=ssl.create_default_context()) as r:
        data = r.read()
    if len(data) < 1000:
        raise RuntimeError(f"Fichier BDPM trop petit ou invalide : {name} ({len(data)} octets)")
    path.write_bytes(data)
    return path

def read_rows(path):
    with path.open("r", encoding="latin-1", newline="") as f:
        return list(csv.reader(f, delimiter="\t"))

def main():
    files = {k: download(v) for k, v in FILES.items()}
    sp, pr, co = [read_rows(files[k]) for k in ("specialites","presentations","compositions")]

    meds = {}
    for r in sp:
        if not r or not r[0]:
            continue
        cis = r[0].strip()
        meds[cis] = {
            "id": "CIS-" + cis,
            "cis": cis,
            "nom": r[1].strip() if len(r)>1 else "",
            "forme": r[2].strip() if len(r)>2 else "",
            "voies": [x.strip() for x in r[3].split(";") if x.strip()] if len(r)>3 else [],
            "presentations": [],
            "substances": [],
            "source": "BDPM",
            "date_import": datetime.date.today().isoformat(),
            "clinically_validated": False
        }

    for r in pr:
        if len(r)>2 and r[0] in meds:
            meds[r[0]]["presentations"].append({
                "cip7": r[1].strip() if len(r)>1 else "",
                "libelle": r[2].strip() if len(r)>2 else "",
                "cip13": r[6].strip() if len(r)>6 else ""
            })

    for r in co:
        if len(r)>3 and r[0] in meds:
            sub = r[3].strip()
            if sub and sub not in meds[r[0]]["substances"]:
                meds[r[0]]["substances"].append(sub)

    output = {
        "source": "BDPM",
        "date_import": datetime.date.today().isoformat(),
        "medicaments": list(meds.values())
    }
    Path("medicaments.json").write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print("Import BDPM terminé :", len(meds), "spécialités")

if __name__ == "__main__":
    main()
