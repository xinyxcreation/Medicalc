let meds=[],exercise=null,deferred=null;
const $=id=>document.getElementById(id);
const n=id=>{const x=parseFloat($(id).value);return Number.isFinite(x)?x:null};
const fmt=x=>Number.isFinite(x)?new Intl.NumberFormat("fr-FR",{maximumFractionDigits:3}).format(x):"—";
const randomItem=a=>a[Math.floor(Math.random()*a.length)];
const rand=(min,max,step=1)=>+(min+Math.floor(Math.random()*(Math.floor((max-min)/step)+1)) * step).toFixed(2);
const closeEnough=(a,b)=>a!==null&&Math.abs(a-b)<=Math.max(.01,Math.abs(b)*.005);

async function init(){
 try{const d=await fetch("medicaments.json",{cache:"no-store"}).then(r=>r.json());meds=d.medicaments||[];renderMeds();$("medInfo").innerHTML=`<small>✅ Base BDPM chargée : <b>${meds.length.toLocaleString("fr-FR")}</b> médicaments • mise à jour : ${d.date_import||"locale"}</small>`;}
 catch(e){$("medInfo").textContent="Impossible de charger medicaments.json."}
}
function renderMeds(filter=""){
 const q=filter.trim().toLowerCase();
 const box=$("medSuggestions");
 const list=meds.filter(m=>!q || (m.nom+" "+(m.substances||[]).join(" ")).toLowerCase().includes(q))
   .sort((a,b)=>a.nom.localeCompare(b.nom,"fr")).slice(0,20);
 if(!list.length){
   box.innerHTML='<div class="suggestion"><small>Aucun médicament trouvé dans la base locale BDPM.</small></div>';
   box.classList.remove("hidden");return;
 }
 box.innerHTML=list.map(m=>{
   const sub=(m.substances||[]).slice(0,2).join(" • ");
   return `<div class="suggestion" data-med-id="${m.id}"><b>${m.nom}</b><small>${sub||m.forme||"Présentation BDPM"}</small></div>`;
 }).join("");
 box.classList.remove("hidden");
 box.querySelectorAll(".suggestion[data-med-id]").forEach(el=>{
   el.onclick=()=>{
     const m=meds.find(x=>x.id===el.dataset.medId);
     if(!m)return;
     $("med").value=m.id;
     $("medSearch").value=m.nom;
     box.classList.add("hidden");
     showMed(m.id);
   };
 });
}
function showMed(id){
 const m=meds.find(x=>x.id===id);
 renderPresentation(m);
 if(!m)return;
 $("medInfo").dataset.fullInfo=`${m.nom}${m.forme?" • "+m.forme:""}${m.voies?.length?" • "+m.voies.join(", "):""}`;
}
}

function renderPresentation(m){
  const box=$("presentationBox");
  const data=$("medInfo");
  const p=m?.presentations?.[0];
  if(!m){
    box.innerHTML='💊 <span>Sélectionnez un médicament<br>pour voir les présentations disponibles.</span>';
    data.innerHTML='<p>Concentration : <b>—</b></p><p>Volume : <b>—</b></p><p>Substance : <b>—</b></p>';
    return;
  }
  const presentations=m.presentations||[];
  box.innerHTML=presentations.length
    ? `<select id="presentationSelect">${presentations.map((x,i)=>`<option value="${i}">${x.libelle||("Présentation "+(i+1))}</option>`).join("")}</select>`
    : '<span>Aucune présentation renseignée dans la base BDPM.</span>';
  const show=i=>{
    const x=presentations[i]||{};
    data.innerHTML=`<p>Concentration : <b>${x.concentration_mg_ml??"—"}${x.concentration_mg_ml!=null?" mg/mL":""}</b></p><p>Volume : <b>${x.volume_ml??"—"}${x.volume_ml!=null?" mL":""}</b></p><p>Substance : <b>${(m.substances||[]).join(", ")||"—"}</b></p>`;
  };
  if(p)show(0);
  const ps=$("presentationSelect");
  if(ps)ps.onchange=()=>show(+ps.value);
}
function calc(){
 const t=$("type").value,v=n("value"),w=n("weight"),f=parseFloat($("freqText")?.value||$("freq")?.value||1),b=n("bsa");
 $("bsaWrap").classList.toggle("hidden",!(t.includes("m²")));
 let d=null,p=null;
 if(v!==null){
  if(t==="mg/kg/jour"&&w!==null){d=v*w;p=f>0?d/f:null}
  if(t==="mg/kg/dose"&&w!==null){p=v*w;d=f>0?p*f:null}
  if(t==="mg/jour"){d=v;p=f>0?v/f:null}
  if(t==="mg/dose"){p=v;d=f>0?v*f:null}
  if(t==="mg/m²/jour"&&b!==null){d=v*b;p=f>0?d/f:null}
  if(t==="mg/m²/dose"&&b!==null){p=v*b;d=f>0?p*f:null}
 }
 $("daily").textContent=fmt(d);$("per").textContent=fmt(p);
 const dose=n("takeDose")??p,c=n("conc");
 $("vol").textContent=fmt(dose!==null&&c>0?dose/c:null); if($("vol2"))$("vol2").textContent=$("vol").textContent;
 const c1=n("c1"),v1=n("v1"),c2=n("c2"),vf=n("vf");
 const v2=c1!==null&&v1!==null&&c2>0?c1*v1/c2:null;
 $("v2").textContent=fmt(v2);$("dil").textContent=fmt(v2!==null&&v1!==null?(vf!==null?vf:v2)-v1:null);
 const iv=n("infVol"),mins=n("mins");$("rate").textContent=fmt(iv!==null&&mins>0?iv*60/mins:null);
 $("summary").innerHTML=d!==null?`Dose quotidienne : <b>${fmt(d)} mg</b><br>Dose par administration : <b>${fmt(p)} mg</b><br>Volume : <b>${fmt(dose!==null&&c>0?dose/c:null)} mL</b>`:"—";
}
function level(){return document.querySelector('input[name="level"]:checked')?.value||"facile"}
function generateCase(lvl){
 const med=randomItem(meds.length?meds:[{id:"SIMULATION",nom:"Médicament de simulation"}]);
 const type=randomItem(lvl==="facile"?["mg/kg/jour","mg/jour","mg/dose"]:["mg/kg/jour","mg/kg/dose","mg/jour","mg/dose"]);
 const f=rand(1,4,1),c=lvl==="facile"?rand(10,50,5):lvl==="intermediaire"?rand(5,100,5):rand(2,200,2);
 let v,w,d,p;
 if(type==="mg/kg/jour"){w=rand(40,90,5);v=rand(5,30,1);d=v*w;p=d/f}
 else if(type==="mg/kg/dose"){w=rand(40,90,5);v=rand(.5,2,.5);p=v*w;d=p*f}
 else if(type==="mg/jour"){v=rand(100,2000,50);d=v;p=d/f}
 else {v=rand(50,1000,50);p=v;d=p*f}
 const vol=p/c;
 let dilution=null,infusion=null;
 if(lvl==="difficile"){const vf=rand(50,500,10),mins=rand(15,120,15);dilution={vf,diluant:Math.max(0,vf-vol)};infusion={vf,mins,rate:vf*60/mins}}
 return {medName:med.nom,type,v,w,f,c,d,p,vol,level:lvl,dilution,infusion};
}
function createExercise(){
 const x=exercise=generateCase(level()),extra=x.level==="difficile"?`<p>Volume final : <b>${fmt(x.infusion.vf)} mL</b></p><p>Durée : <b>${fmt(x.infusion.mins)} min</b></p>`:"";
 $("exerciseResult").textContent="";
 $("quiz").innerHTML=`<div class="question"><b>🎲 Exercice ${x.level}</b><p>Médicament : <b>${x.medName}</b></p><p>Prescription : <b>${fmt(x.v)} ${x.type}</b></p><p>Poids : <b>${fmt(x.w)} kg</b></p><p>Fréquence : <b>${x.f}/jour</b></p><p>Concentration : <b>${fmt(x.c)} mg/mL</b></p>${extra}</div>
 <div class="question"><b>À toi de calculer — correction cachée</b>
 <label>Dose par administration<input id="qDose" type="number" step="0.01" placeholder="mg"></label>
 <label>Dose quotidienne<input id="qDaily" type="number" step="0.01" placeholder="mg/jour"></label>
 <label>Volume à prélever<input id="qVol" type="number" step="0.01" placeholder="mL"></label>
 ${x.level==="difficile"?`<label>Diluant à ajouter<input id="qDil" type="number" step="0.01" placeholder="mL"></label><label>Débit<input id="qRate" type="number" step="0.01" placeholder="mL/h"></label>`:""}
 </div><button id="checkQuiz" class="primary">Vérifier mes réponses</button>`;
 $("quiz").classList.remove("hidden");$("checkQuiz").onclick=checkQuiz;
}
function checkQuiz(){
 const x=exercise;
 const checks=[["Dose par administration",n("qDose"),x.p,"mg"],["Dose quotidienne",n("qDaily"),x.d,"mg/jour"],["Volume à prélever",n("qVol"),x.vol,"mL"]];
 if(x.level==="difficile"){checks.push(["Diluant à ajouter",n("qDil"),x.dilution.diluant,"mL"],["Débit",n("qRate"),x.infusion.rate,"mL/h"])}
 let score=0,html="<h3>Résultat</h3>";
 checks.forEach(([label,ans,cor,u])=>{const ok=closeEnough(ans,cor);if(ok)score++;html+=`<div class="${ok?"ok":"bad"}">${ok?"✅":"❌"} ${label} : <b>${ans??"—"} ${u}</b> — correction <b>${fmt(cor)} ${u}</b></div>`});
 html+=`<div class="result"><span>Score</span><b>${score}/${checks.length}</b><small>${Math.round(score/checks.length*100)}%</small></div>`;
 $("exerciseResult").innerHTML=html;
}


document.querySelectorAll("input,select").forEach(x=>x.addEventListener("input",calc));
document.querySelectorAll("select").forEach(x=>x.addEventListener("change",calc));

function activatePage(id){
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));
}
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>activatePage(b.dataset.page));
document.querySelectorAll("[data-page-target]").forEach(b=>b.onclick=()=>activatePage(b.dataset.pageTarget));

function renderSuggestions(inputId,boxId){
  const q=$(inputId).value.trim().toLowerCase();
  const box=$(boxId);
  const list=meds.filter(m=>!q || (m.nom+" "+(m.substances||[]).join(" ")).toLowerCase().includes(q))
    .sort((a,b)=>a.nom.localeCompare(b.nom,"fr")).slice(0,20);
  box.innerHTML=list.length?list.map(m=>`<div class="suggestion" data-id="${m.id}"><b>${m.nom}</b><small>${(m.substances||[]).slice(0,2).join(" • ")||m.forme||"BDPM"}</small></div>`).join("")
  :'<div class="suggestion"><small>Aucun résultat dans la base locale.</small></div>';
  box.classList.remove("hidden");
  box.querySelectorAll("[data-id]").forEach(el=>el.onclick=()=>{
    const m=meds.find(x=>x.id===el.dataset.id);
    if(!m)return;
    $("med").value=m.id;
    $("medSearch").value=m.nom;
    box.classList.add("hidden");
    showMed(m.id);
  });
}
$("medSearch").addEventListener("focus",()=>renderSuggestions("medSearch","medSuggestions"));
$("medSearch").addEventListener("input",()=>renderSuggestions("medSearch","medSuggestions"));
$("medSearch2").addEventListener("focus",()=>renderSuggestions("medSearch2","medSuggestions2"));
$("medSearch2").addEventListener("input",()=>renderSuggestions("medSearch2","medSuggestions2"));

document.addEventListener("click",e=>{
  if(!e.target.closest(".autocomplete")){
    document.querySelectorAll(".suggestions").forEach(x=>x.classList.add("hidden"));
  }
});

$("calculateBtn").onclick=calc;
$("createExercise").onclick=createExercise;
$("clearFooter").onclick=()=>$("clear").click();

$("clear").onclick=()=>{
  document.querySelectorAll("input:not([type=hidden]):not([name='level'])").forEach(x=>x.value="");
  if($("freqText"))$("freqText").value="1";
  if($("med"))$("med").value="";
  if($("medSearch"))$("medSearch").value="";
  if($("presentationBox"))$("presentationBox").innerHTML='💊 <span>Sélectionnez un médicament<br>pour voir les présentations disponibles.</span>';
  calc();
};

window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();deferred=e;if($("install"))$("install").hidden=false;
});
if($("install"))$("install").onclick=async()=>{
  if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;$("install").hidden=true;}
};
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");

async function init(){
  try{
    const d=await fetch("medicaments.json",{cache:"no-store"}).then(r=>r.json());
    meds=d.medicaments||[];
    if($("bdpmStatus"))$("bdpmStatus").innerHTML=`✅ Base BDPM chargée : <b>${meds.length.toLocaleString("fr-FR")}</b> médicaments • mise à jour : ${d.date_import||"locale"}`;
  }catch(e){
    meds=[];
    if($("bdpmStatus"))$("bdpmStatus").textContent="⚠️ Base BDPM indisponible.";
  }
}
init();calc();
