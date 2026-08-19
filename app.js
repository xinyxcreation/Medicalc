let meds = [], exercise = null, deferred = null;

const $ = id => document.getElementById(id);
const num = id => {
  const el = $(id);
  if (!el) return null;
  const x = parseFloat(el.value);
  return Number.isFinite(x) ? x : null;
};
const fmt = x => Number.isFinite(x)
  ? new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(x)
  : "—";

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function activatePage(id) {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === id);
  });
  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("active", page.id === id);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupNavigation() {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => activatePage(btn.dataset.page));
  });
  document.querySelectorAll("[data-page-target]").forEach(btn => {
    btn.addEventListener("click", () => activatePage(btn.dataset.pageTarget));
  });
}

function medLabel(m) {
  return `${m.nom || "Médicament sans nom"}${m.forme ? " • " + m.forme : ""}`;
}

function renderSuggestions(inputId, boxId, selectMain = false) {
  const input = $(inputId);
  const box = $(boxId);
  if (!input || !box) return;

  const q = input.value.trim().toLowerCase();
  const list = meds
    .filter(m => {
      const hay = `${m.nom || ""} ${(m.substances || []).join(" ")} ${m.forme || ""}`.toLowerCase();
      return !q || hay.includes(q);
    })
    .sort((a, b) => (a.nom || "").localeCompare(b.nom || "", "fr"))
    .slice(0, 20);

  if (!list.length) {
    box.innerHTML = '<div class="suggestion"><small>Aucun médicament trouvé dans la base locale.</small></div>';
    box.classList.remove("hidden");
    return;
  }

  box.innerHTML = list.map(m => `
    <div class="suggestion" data-med-id="${String(m.id).replace(/"/g, "&quot;")}">
      <b>${medLabel(m)}</b>
      <small>${(m.substances || []).slice(0, 2).join(" • ") || "BDPM"}</small>
    </div>
  `).join("");
  box.classList.remove("hidden");

  box.querySelectorAll("[data-med-id]").forEach(item => {
    item.addEventListener("click", () => {
      const m = meds.find(x => String(x.id) === String(item.dataset.medId));
      if (!m) return;

      if (selectMain) {
        $("med").value = m.id;
        $("medSearch").value = m.nom || "";
        renderPresentation(m);
        box.classList.add("hidden");
      } else {
        const main = $("med");
        const search = $("medSearch");
        if (main && search) {
          main.value = m.id;
          search.value = m.nom || "";
          renderPresentation(m);
        }
        input.value = m.nom || "";
        box.classList.add("hidden");
      }
    });
  });
}

function renderPresentation(m) {
  const box = $("presentationBox");
  const info = $("medInfo");
  if (!box || !info) return;

  if (!m) {
    box.innerHTML = '💊 <span>Sélectionnez un médicament<br>pour voir les présentations disponibles.</span>';
    info.innerHTML = '<p>Concentration : <b>—</b></p><p>Volume : <b>—</b></p><p>Substance : <b>—</b></p>';
    return;
  }

  const presentations = Array.isArray(m.presentations) ? m.presentations : [];
  if (!presentations.length) {
    box.innerHTML = '<span>Aucune présentation renseignée dans la base BDPM.</span>';
  } else {
    box.innerHTML = `
      <select id="presentationSelect" aria-label="Présentation disponible">
        ${presentations.map((p, i) =>
          `<option value="${i}">${p.libelle || "Présentation " + (i + 1)}</option>`
        ).join("")}
      </select>`;
  }

  const show = index => {
    const p = presentations[index] || {};
    const concentration = p.concentration_mg_ml ?? p.concentration ?? "—";
    const volume = p.volume_ml ?? p.volume ?? "—";
    info.innerHTML = `
      <p>Concentration : <b>${concentration}${concentration !== "—" ? " mg/mL" : ""}</b></p>
      <p>Volume : <b>${volume}${volume !== "—" ? " mL" : ""}</b></p>
      <p>Substance : <b>${(m.substances || []).join(", ") || "—"}</b></p>`;
  };

  show(0);
  const select = $("presentationSelect");
  if (select) select.addEventListener("change", () => show(Number(select.value)));
}

function selectedMedicine() {
  const id = $("med")?.value;
  return meds.find(m => String(m.id) === String(id)) || null;
}

function selectedConcentration() {
  const m = selectedMedicine();
  if (!m) return null;
  const select = $("presentationSelect");
  const p = (m.presentations || [])[select ? Number(select.value) : 0] || {};
  const candidates = [p.concentration_mg_ml, p.concentration, p.dose_mg_ml];
  for (const c of candidates) {
    const x = parseFloat(c);
    if (Number.isFinite(x) && x > 0) return x;
  }
  return null;
}

function calc() {
  const value = num("value");
  const weight = num("weight");
  const freq = parseFloat($("freqText")?.value || "1");
  const type = $("type")?.value || "mg/dose";

  let daily = null;
  if (value !== null) {
    if (type === "mg/kg/jour") daily = weight !== null ? value * weight : null;
    else if (type === "mg/jour") daily = value;
    else if (type === "mg/kg/dose") daily = weight !== null ? value * weight * freq : null;
    else daily = value * freq;
  }

  const per = daily !== null && freq > 0 ? daily / freq : null;
  const concentration = selectedConcentration();
  const volume = per !== null && concentration ? per / concentration : null;

  setText("daily", fmt(daily));
  setText("per", fmt(per));
  setText("vol", fmt(volume));
  setText("vol2", fmt(volume));
  return { daily, per, volume };
}

function calcPrelevement() {
  const concentration = num("conc");
  const dose = num("takeDose");
  const v = concentration && dose !== null ? dose / concentration : null;
  setText("vol2", fmt(v));

  const c1 = num("c1");
  const v1 = num("v1");
  const c2 = num("c2");
  const vf = num("vf");
  const v2 = c1 && v1 !== null && c2 ? (c1 * v1) / c2 : null;
  const dil = v2 !== null && vf !== null ? vf - v2 : null;
  setText("v2", fmt(v2));
  setText("dil", fmt(dil));
}

function calcPerfusion() {
  const volume = num("infVol");
  const minutes = num("mins");
  const rate = volume !== null && minutes > 0 ? volume / minutes * 60 : null;
  setText("rate", fmt(rate));
}

function resetAll() {
  document.querySelectorAll("input").forEach(input => {
    if (input.type !== "hidden" && input.type !== "radio") input.value = "";
  });
  if ($("freqText")) $("freqText").value = "1";
  if ($("type")) $("type").value = "mg/dose";
  if ($("med")) $("med").value = "";
  if ($("medSearch")) $("medSearch").value = "";
  renderPresentation(null);
  calc();
  calcPrelevement();
  calcPerfusion();
}

function createExercise() {
  if (!meds.length) {
    setText("exerciseResult", "⚠️ La base BDPM n'est pas encore disponible.");
    return;
  }

  const m = meds[Math.floor(Math.random() * meds.length)];
  const person = {
    prenom: ["Camille", "Alex", "Lina", "Noah", "Emma", "Hugo"][Math.floor(Math.random() * 6)],
    age: Math.floor(Math.random() * 70) + 18,
    poids: Math.floor(Math.random() * 65) + 45
  };
  const dose = [250, 500, 750, 1000][Math.floor(Math.random() * 4)];
  const freq = [1, 2, 3, 4][Math.floor(Math.random() * 4)];
  const answer = dose * freq;

  exercise = { m, person, dose, freq, answer };

  const quiz = $("quiz");
  if (!quiz) return;
  quiz.classList.remove("hidden");
  quiz.innerHTML = `
    <div class="exercise-case">
      <h3>Personne ${person.prenom}</h3>
      <p><b>Âge :</b> ${person.age} ans &nbsp; • &nbsp; <b>Poids :</b> ${person.poids} kg</p>
      <p><b>Médicament :</b> ${m.nom || "Médicament BDPM"}</p>
      <p><b>Prescription :</b> ${dose} mg, ${freq} fois/jour</p>
      <label>Ta réponse — dose totale par jour (mg)
        <input id="exerciseAnswer" type="number" step="0.01" inputmode="decimal">
      </label>
      <button id="checkExercise" class="primary-action">✓ Vérifier</button>
      <button id="newExercise" class="secondary-action">🎲 Nouvel exercice</button>
    </div>`;
  $("checkExercise").onclick = checkExercise;
  $("newExercise").onclick = createExercise;
  setText("exerciseResult", "");
}

function checkExercise() {
  if (!exercise) return;
  const answer = parseFloat($("exerciseAnswer")?.value);
  const result = $("exerciseResult");
  if (!result) return;
  if (!Number.isFinite(answer)) {
    result.textContent = "Entre une réponse avant de vérifier.";
    return;
  }
  const ok = Math.abs(answer - exercise.answer) <= Math.max(0.01, exercise.answer * 0.005);
  result.innerHTML = ok
    ? "✅ <b>Correct.</b> Le résultat attendu est " + fmt(exercise.answer) + " mg/jour."
    : "❌ <b>À revoir.</b> Le résultat attendu pour cet exercice est " + fmt(exercise.answer) + " mg/jour.";
}

function setupEvents() {
  setupNavigation();

  $("medSearch")?.addEventListener("focus", () => renderSuggestions("medSearch", "medSuggestions", true));
  $("medSearch")?.addEventListener("input", () => renderSuggestions("medSearch", "medSuggestions", true));
  $("medSearch2")?.addEventListener("focus", () => renderSuggestions("medSearch2", "medSuggestions2", false));
  $("medSearch2")?.addEventListener("input", () => renderSuggestions("medSearch2", "medSuggestions2", false));

  document.addEventListener("click", e => {
    if (!e.target.closest(".autocomplete")) {
      document.querySelectorAll(".suggestions").forEach(x => x.classList.add("hidden"));
    }
  });

  document.querySelectorAll("#calcul input,#calcul select").forEach(el => {
    el.addEventListener("input", calc);
    el.addEventListener("change", calc);
  });
  document.querySelectorAll("#prelevement input").forEach(el => el.addEventListener("input", calcPrelevement));
  document.querySelectorAll("#perfusion input").forEach(el => el.addEventListener("input", calcPerfusion));

  $("calculateBtn")?.addEventListener("click", calc);
  $("clear")?.addEventListener("click", resetAll);
  $("clearFooter")?.addEventListener("click", resetAll);
  $("createExercise")?.addEventListener("click", createExercise);
}

async function init() {
  setupEvents();
  renderPresentation(null);
  try {
    const response = await fetch("medicaments.json", { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data = await response.json();
    meds = Array.isArray(data.medicaments) ? data.medicaments : [];
    const msg = `✅ Base BDPM chargée : <b>${meds.length.toLocaleString("fr-FR")}</b> médicaments • mise à jour : ${data.date_import || "locale"}`;
    if ($("bdpmStatus")) $("bdpmStatus").innerHTML = msg;
    if ($("medInfo")) $("medInfo").innerHTML = '<p>Concentration : <b>—</b></p><p>Volume : <b>—</b></p><p>Substance : <b>—</b></p>';
  } catch (error) {
    meds = [];
    if ($("bdpmStatus")) $("bdpmStatus").textContent = "⚠️ Base BDPM indisponible.";
  }
  calc();
  calcPrelevement();
  calcPerfusion();
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferred = event;
  if ($("install")) $("install").hidden = false;
});

$("install")?.addEventListener("click", async () => {
  if (!deferred) return;
  deferred.prompt();
  await deferred.userChoice;
  deferred = null;
  $("install").hidden = true;
});

init();
