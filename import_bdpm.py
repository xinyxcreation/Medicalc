#!/usr/bin/env python3
"""Télécharge les fichiers publics BDPM et construit medicaments.json."""
from pathlib import Path
import csv,json,urllib.request,datetime
BASE="https://base-donnees-publique.medicaments.gouv.fr/telechargement.php?fichier="
FILES=["CIS_bdpm.txt","CIS_CIP_bdpm.txt","CIS_COMPO_bdpm.txt"]
def rows(name):
 p=Path(name)
 if not p.exists(): urllib.request.urlretrieve(BASE+name,p)
 with p.open(encoding="latin-1",newline="") as f:return list(csv.reader(f,delimiter="\t"))
sp,pr,co=[rows(x) for x in FILES]
med={}
for r in sp:
 if r and r[0]:
  med[r[0]]={"id":"CIS-"+r[0],"cis":r[0],"nom":r[1] if len(r)>1 else "","forme":r[2] if len(r)>2 else "","voies":r[3].split(";") if len(r)>3 and r[3] else [],"presentations":[],"substances":[],"source":"BDPM","date_import":datetime.date.today().isoformat(),"clinically_validated":False}
for r in pr:
 if len(r)>2 and r[0] in med:
  med[r[0]]["presentations"].append({"cip7":r[1],"libelle":r[2],"cip13":r[6] if len(r)>6 else None})
for r in co:
 if len(r)>3 and r[0] in med:
  x=r[3].strip()
  if x and x not in med[r[0]]["substances"]:med[r[0]]["substances"].append(x)
Path("medicaments.json").write_text(json.dumps({"source":"BDPM","date_import":datetime.date.today().isoformat(),"medicaments":list(med.values())},ensure_ascii=False,indent=2),encoding="utf-8")
print("Import terminé :",len(med),"spécialités")
if __name__=="__main__": pass
