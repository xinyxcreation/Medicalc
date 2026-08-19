let meds=[],exercise=null,deferred=null;
const $=id=>document.getElementById(id);
const n=id=>{const x=parseFloat($(id).value);return Number.isFinite(x)?x:null};
const fmt=x=>Number.isFinite(x)?new Intl.NumberFormat("fr-FR",{maximumFractionDigits:3}).format(x):"—";
const randomItem=a=>a[Math.floor(Math.random()*a.length)];
const rand=(min,max,step=1)=>+(min+Math.floor(Math.random()*(Math.floor((max-min)/step)+1)) * step).toFixed(2);
const closeEnough=(a,b)=>a!==null&&Math.abs(a-b)<=Math.max(.01,Math.abs(b)*.005);

async function init(){
 try{
  const d=await fetch("medicaments.json",{cache:"no-store"}).then(r=>r.json());
  meds=Array.isArray(d.medicaments)?d.medicaments:[];
  const msg=`✅ Base BDPM chargée : <b>${meds.length.toLocaleString("fr-FR")}</b> médicaments • mise à jour : ${d.date_import||"locale"}`;
  if($("bdpmStatus"))$("bdpmStatus").innerHTML=msg;
  if($("medInfo"))$("medInfo").innerHTML=`<p>Concentration : <b>—</b></p><p>Volume : <b>—</b></p><p>Substance : <b>—</b></p>`;
 }catch(e){
  meds=[];
  if($("bdpmStatus"))$("bdpmStatus").textContent="⚠️ Base BDPM indisponible.";
 }
}
init();calc();
