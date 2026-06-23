const presets = {
  gsxr1000k8: {
    name: "Suzuki GSX-R 1000 K7/K8",
    wheelbase: 1405,
    rake: 23.8,
    publishedTrail: 98,
    tripleOffset: 30,
    frontTire: "120/70 ZR17",
    rearTire: "190/50 ZR17",
    baselineFrontSag: 35,
    baselineRearSag: 30,
    forkProtrusion: 0,
    rearRideHeight: 0
  }
};

const tireOptions = [
  "110/70 ZR17",
  "120/60 ZR17",
  "120/70 ZR17",
  "125/70 ZR17",
  "180/55 ZR17",
  "190/50 ZR17",
  "190/55 ZR17",
  "200/55 ZR17",
  "200/60 ZR17"
];

const state = {
  riderWeight: 86,
  frontSag: 38,
  rearSag: 33,
  frontTire: "120/70 ZR17",
  rearTire: "190/50 ZR17",
  forkProtrusion: 0,
  rearRideHeight: 0,
  tripleOffset: 30,
  symptom: "heavy"
};

const els = {
  riderWeight: document.querySelector("#riderWeight"),
  frontSag: document.querySelector("#frontSag"),
  rearSag: document.querySelector("#rearSag"),
  frontTire: document.querySelector("#frontTire"),
  rearTire: document.querySelector("#rearTire"),
  forkProtrusion: document.querySelector("#forkProtrusion"),
  rearRideHeight: document.querySelector("#rearRideHeight"),
  tripleOffset: document.querySelector("#tripleOffset"),
  symptom: document.querySelector("#symptom"),
  diagnosis: document.querySelector("#diagnosis"),
  canvas: document.querySelector("#bikeCanvas")
};

function parseTire(size) {
  const match = size.match(/(\d+)\/(\d+)\s*[A-Z]*R?(\d+)/i);
  if (!match) throw new Error(`Neplatný formát pneumatiky: ${size}`);
  const width = Number(match[1]);
  const aspect = Number(match[2]);
  const rim = Number(match[3]);
  const sidewall = width * (aspect / 100);
  const diameter = rim * 25.4 + sidewall * 2;
  return { width, aspect, rim, radius: diameter / 2, diameter };
}

function trailFromRake(radius, rakeDeg, offset) {
  const rake = (rakeDeg * Math.PI) / 180;
  return (radius * Math.sin(rake) - offset) / Math.cos(rake);
}

function calculate() {
  const p = presets.gsxr1000k8;
  const front = parseTire(state.frontTire);
  const rear = parseTire(state.rearTire);
  const baseFront = parseTire(p.frontTire);
  const baseRear = parseTire(p.rearTire);

  const frontHeightDelta =
    (front.radius - baseFront.radius) -
    (state.frontSag - p.baselineFrontSag) -
    state.forkProtrusion;

  const rearHeightDelta =
    (rear.radius - baseRear.radius) -
    (state.rearSag - p.baselineRearSag) +
    state.rearRideHeight;

  const pitchDeg = Math.atan2(frontHeightDelta - rearHeightDelta, p.wheelbase) * (180 / Math.PI);
  const dynamicRake = p.rake + pitchDeg;
  const trail = trailFromRake(front.radius, dynamicRake, state.tripleOffset);
  const baselineTrail = trailFromRake(baseFront.radius, p.rake, p.tripleOffset);

  const frontSagTarget = state.riderWeight > 100 ? [35, 42] : [30, 38];
  const rearSagTarget = state.riderWeight > 100 ? [30, 38] : [25, 35];

  return {
    front,
    rear,
    frontHeightDelta,
    rearHeightDelta,
    pitchDeg,
    dynamicRake,
    trail,
    baselineTrail,
    trailDelta: trail - baselineTrail,
    frontSagTarget,
    rearSagTarget
  };
}

function fmt(value, unit = "mm", digits = 1) {
  return `${value.toFixed(digits)} ${unit}`;
}

function setOutputs(model) {
  document.querySelector("#riderWeightOut").textContent = `${state.riderWeight} kg`;
  document.querySelector("#frontSagOut").textContent = `${state.frontSag} mm`;
  document.querySelector("#rearSagOut").textContent = `${state.rearSag} mm`;
  document.querySelector("#forkOut").textContent = `${state.forkProtrusion > 0 ? "+" : ""}${state.forkProtrusion} mm`;
  document.querySelector("#shockOut").textContent = `${state.rearRideHeight > 0 ? "+" : ""}${state.rearRideHeight} mm`;
  document.querySelector("#offsetOut").textContent = `${state.tripleOffset} mm`;
  document.querySelector("#trailValue").textContent = fmt(model.trail);
  document.querySelector("#rakeValue").textContent = `${model.dynamicRake.toFixed(2)}°`;
  document.querySelector("#pitchValue").textContent = `${model.pitchDeg > 0 ? "+" : ""}${model.pitchDeg.toFixed(2)}°`;
}

function diagnosticRules(model) {
  const frontSagLow = state.frontSag < model.frontSagTarget[0];
  const frontSagHigh = state.frontSag > model.frontSagTarget[1];
  const rearSagHigh = state.rearSag > model.rearSagTarget[1];
  const rearSagLow = state.rearSag < model.rearSagTarget[0];
  const highTrail = model.trail > presets.gsxr1000k8.publishedTrail + 5;
  const lowTrail = model.trail < presets.gsxr1000k8.publishedTrail - 5;

  const common = [
    `Ověř rider sag: předek cíl ${model.frontSagTarget[0]}-${model.frontSagTarget[1]} mm, zadek cíl ${model.rearSagTarget[0]}-${model.rearSagTarget[1]} mm.`,
    "Po jedné změně udělej krátký test, zapiš pocit na brzdách, nájezd, apex a výjezd.",
    "Pokud preload nestačí dostat sag do rozsahu, problém je pravděpodobně pružina, ne nastavení klikátkem."
  ];

  const map = {
    heavy: {
      badge: highTrail || rearSagHigh || frontSagLow ? "pravděpodobně moc trailu / vysoký předek" : "zkontrolovat základní měření",
      title: "Těžké řízení v zatáčce",
      points: [
        rearSagHigh ? "Zadek sedí nízko: přidej preload vzadu nebo ride height, tím se motorka ochotněji sklápí." : "Zvaž malé zvednutí zadku o 2-4 mm nebo snížení předku přes vidlice o 2 mm.",
        frontSagLow ? "Předek má málo sagu a stojí vysoko: uber preload předku, pokud zůstane dost zdvihu pro brzdění." : "Přední sag je použitelný, trail řeš hlavně výškami a pneumatikou.",
        highTrail ? `Trail je nyní ${fmt(model.trail)}; zkus cílit blíž k sériovým cca ${presets.gsxr1000k8.publishedTrail} mm.` : "Trail není výrazně vysoký; hledej i zatuhlé řízení, tlak přední pneumatiky a příliš zavřený rebound."
      ].concat(common)
    },
    wide: {
      badge: "držení stopy a výška zadku",
      title: "Motorka se nechce zavřít k apexu",
      points: [
        "Změř zadní sag. Nízký zadek často zvětší rake/trail a motorka jede široce.",
        "Zkus zvednout zadek nebo snížit předek v malých krocích.",
        "Příliš pomalý rebound vzadu může po brzdění držet zadek nízko a zhoršit zatočení."
      ].concat(common)
    },
    nervous: {
      badge: lowTrail ? "možná málo trailu" : "stabilita předku",
      title: "Nervózní předek",
      points: [
        lowTrail ? `Trail je nízko (${fmt(model.trail)}): vrať část snížení předku nebo uber zadní ride height.` : "Trail nevypadá extrémně nízko; zkontroluj tlak, ložiska řízení a tlumení.",
        "Přehnaně otevřený rebound předku může vyvolat rychlé rozkmitání po nerovnosti.",
        "Nedělej velké kroky: 1-2 mm na výšce umí být na sportovní motorce znát."
      ].concat(common)
    },
    harsh: {
      badge: "komfort a využití zdvihu",
      title: "Tvrdý předek bez důvěry",
      points: [
        frontSagLow ? "Přední sag je malý: uber preload, než začneš otevírat kompresi." : "Sag není nízký; sleduj kolik zdvihu reálně používáš při tvrdém brzdění.",
        "Pokud se předek nevrací, otevři rebound po 1-2 kliknutích.",
        "Pokud jde na doraz, nepřidávej jen preload naslepo; může být potřeba pružina nebo olejová hladina."
      ].concat(common)
    }
  };

  return map[state.symptom];
}

function renderDiagnosis(model) {
  const d = diagnosticRules(model);
  els.diagnosis.innerHTML = `
    <article>
      <span class="badge">${d.badge}</span>
      <h3>${d.title}</h3>
      <p>Model ukazuje trail ${fmt(model.trail)} a změnu proti sérii ${model.trailDelta >= 0 ? "+" : ""}${model.trailDelta.toFixed(1)} mm.</p>
      <ul>${d.points.map((point) => `<li>${point}</li>`).join("")}</ul>
    </article>
  `;
}

function drawBike(model) {
  const canvas = els.canvas;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#111827");
  bg.addColorStop(0.55, "#090d14");
  bg.addColorStop(1, "#05070b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = "#1f3148";
  ctx.lineWidth = 1;
  for (let x = 30; x < w; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 26; y < h; y += 34) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();

  const ground = 350;
  const rearX = 150;
  const frontX = 615;
  const scale = (frontX - rearX) / presets.gsxr1000k8.wheelbase;
  const rearR = model.rear.radius * scale;
  const frontR = model.front.radius * scale;
  const rearY = ground - rearR;
  const frontY = ground - frontR;
  const swingPivot = { x: 365, y: 244 + model.rearHeightDelta * -0.06 };

  const horizon = ctx.createLinearGradient(54, ground, 710, ground);
  horizon.addColorStop(0, "rgba(50, 213, 255, 0)");
  horizon.addColorStop(0.5, "rgba(50, 213, 255, 0.9)");
  horizon.addColorStop(1, "rgba(255, 67, 95, 0)");
  ctx.strokeStyle = horizon;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(54, ground);
  ctx.lineTo(710, ground);
  ctx.stroke();

  drawReferenceLine(ctx, rearX, 42, rearX, ground + 34, "#ff435f", "rear axle");
  drawReferenceLine(ctx, frontX, 42, frontX, ground + 34, "#ff435f", "front axle");
  drawDimension(ctx, rearX, ground + 34, frontX, ground + 34, `${presets.gsxr1000k8.wheelbase} mm`, "WHEELBASE");

  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  drawWheel(ctx, rearX, rearY, rearR);
  drawWheel(ctx, frontX, frontY, frontR);

  const frameGradient = ctx.createLinearGradient(rearX, rearY, frontX, frontY);
  frameGradient.addColorStop(0, "#b6c7dd");
  frameGradient.addColorStop(0.48, "#32d5ff");
  frameGradient.addColorStop(1, "#f7fbff");

  ctx.strokeStyle = "rgba(50, 213, 255, 0.18)";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(rearX, rearY);
  ctx.lineTo(swingPivot.x, swingPivot.y);
  ctx.lineTo(frontX - 86, frontY - 128);
  ctx.lineTo(rearX + 84, rearY - 90);
  ctx.lineTo(rearX, rearY);
  ctx.stroke();

  ctx.strokeStyle = frameGradient;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(rearX, rearY);
  ctx.lineTo(swingPivot.x, swingPivot.y);
  ctx.lineTo(frontX - 86, frontY - 128);
  ctx.lineTo(rearX + 84, rearY - 90);
  ctx.lineTo(rearX, rearY);
  ctx.stroke();

  const rakeRad = (model.dynamicRake * Math.PI) / 180;
  const axisDx = Math.sin(rakeRad);
  const axisDy = Math.cos(rakeRad);
  const stemTop = { x: frontX - 78, y: frontY - 190 };
  const stemBottom = { x: stemTop.x + axisDx * 112, y: stemTop.y + axisDy * 112 };
  const groundAxisX = stemTop.x + axisDx * ((ground - stemTop.y) / axisDy);
  const upperClamp = { x: stemTop.x + axisDx * 30, y: stemTop.y + axisDy * 30 };
  const lowerClamp = { x: stemTop.x + axisDx * 78, y: stemTop.y + axisDy * 78 };
  const forkTop = { x: stemTop.x + 28, y: stemTop.y + 4 };
  const forkBottom = { x: frontX, y: frontY };

  drawSwingarm(ctx, rearX, rearY, swingPivot);
  drawMarker(ctx, swingPivot.x, swingPivot.y, "#ffb020", "SWINGARM PIVOT");
  drawMarker(ctx, rearX, rearY, "#ff435f", "REAR AXLE");
  drawMarker(ctx, frontX, frontY, "#ff435f", "FRONT AXLE");
  drawAngleArc(ctx, swingPivot.x, swingPivot.y, rearX, rearY, "SWINGARM ANGLE");

  ctx.strokeStyle = "#ff435f";
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(stemTop.x, stemTop.y);
  ctx.lineTo(groundAxisX, ground);
  ctx.stroke();
  ctx.setLineDash([]);

  drawReferenceLine(ctx, stemTop.x, stemTop.y, groundAxisX, ground + 28, "#ff435f", "steering axis");

  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(upperClamp.x - 28, upperClamp.y + 8);
  ctx.lineTo(upperClamp.x + 38, upperClamp.y - 8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(lowerClamp.x - 24, lowerClamp.y + 8);
  ctx.lineTo(lowerClamp.x + 34, lowerClamp.y - 7);
  ctx.stroke();

  ctx.strokeStyle = "#d7e3f3";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(upperClamp.x - 28, upperClamp.y + 8);
  ctx.lineTo(upperClamp.x + 38, upperClamp.y - 8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(lowerClamp.x - 24, lowerClamp.y + 8);
  ctx.lineTo(lowerClamp.x + 34, lowerClamp.y - 7);
  ctx.stroke();

  drawMarker(ctx, upperClamp.x, upperClamp.y, "#32d5ff", "UPPER TRIPLE CLAMP");
  drawMarker(ctx, lowerClamp.x, lowerClamp.y, "#32d5ff", "LOWER TRIPLE CLAMP");
  drawTechnicalCallout(ctx, upperClamp.x + 42, upperClamp.y - 56, "Upper clamp", "#d7e3f3");
  drawTechnicalCallout(ctx, lowerClamp.x + 50, lowerClamp.y + 22, "Lower clamp", "#d7e3f3");
  drawTechnicalCallout(ctx, stemTop.x - 122, stemTop.y - 4, "Steering head / neck", "#32d5ff");

  ctx.strokeStyle = "#32d5ff";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(forkTop.x, forkTop.y);
  ctx.lineTo(stemBottom.x + 18, stemBottom.y + 28);
  ctx.stroke();

  ctx.strokeStyle = "#d7e3f3";
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(stemBottom.x + 16, stemBottom.y + 20);
  ctx.lineTo(forkBottom.x, forkBottom.y);
  ctx.stroke();

  ctx.strokeStyle = "#ffb020";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(groundAxisX, ground + 12);
  ctx.lineTo(frontX, ground + 12);
  ctx.stroke();

  drawLabel(ctx, "TRAIL", `${model.trail.toFixed(1)} mm`, Math.min(groundAxisX, frontX) + 14, ground - 62, "#ffb020");
  drawLabel(ctx, "RAKE", `${model.dynamicRake.toFixed(2)}°`, stemTop.x - 98, stemTop.y + 72, "#32d5ff");
  drawTechnicalCallout(ctx, rearX + 64, rearY - 16, "Rear swingarm", "#ffb020");
}

function drawWheel(ctx, x, y, r) {
  ctx.save();
  ctx.shadowColor = "rgba(50, 213, 255, 0.22)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#07090d";
  ctx.strokeStyle = "#e8eef7";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(50, 213, 255, 0.72)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(232, 238, 247, 0.78)";
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.66);
    ctx.stroke();
  }

  ctx.fillStyle = "#ff435f";
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLabel(ctx, label, value, x, y, color) {
  ctx.save();
  ctx.fillStyle = "rgba(7, 9, 13, 0.72)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, 96, 46, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = "800 11px system-ui";
  ctx.fillText(label, x + 10, y + 17);
  ctx.fillStyle = "#f7f8fb";
  ctx.font = "900 16px system-ui";
  ctx.fillText(value, x + 10, y + 36);
  ctx.restore();
}

function drawSwingarm(ctx, rearX, rearY, pivot) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(255, 176, 32, 0.22)";
  ctx.lineWidth = 19;
  ctx.beginPath();
  ctx.moveTo(rearX, rearY);
  ctx.lineTo(pivot.x, pivot.y);
  ctx.stroke();

  ctx.strokeStyle = "#ffb020";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(rearX, rearY);
  ctx.lineTo(pivot.x, pivot.y);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.38)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rearX + 4, rearY - 12);
  ctx.lineTo(pivot.x - 6, pivot.y - 12);
  ctx.stroke();
  ctx.restore();
}

function drawReferenceLine(ctx, x1, y1, x2, y2, color, label) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.78;
  ctx.setLineDash([9, 8]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.font = "800 10px system-ui";
  ctx.translate(x2 + 8, y1 + 4);
  ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
  ctx.fillText(label.toUpperCase(), 0, 0);
  ctx.restore();
}

function drawDimension(ctx, x1, y, x2, y2, value, label) {
  ctx.save();
  ctx.strokeStyle = "rgba(50, 213, 255, 0.8)";
  ctx.fillStyle = "#9ba8bc";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y - 7);
  ctx.lineTo(x1, y + 7);
  ctx.moveTo(x2, y2 - 7);
  ctx.lineTo(x2, y2 + 7);
  ctx.stroke();
  drawLabel(ctx, label, value, x1 + (x2 - x1) / 2 - 48, y + 16, "#9ba8bc");
  ctx.restore();
}

function drawMarker(ctx, x, y, color, label) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(247, 248, 251, 0.92)";
  ctx.font = "800 10px system-ui";
  ctx.fillText(label, x + 14, y - 12);
  ctx.restore();
}

function drawTechnicalCallout(ctx, x, y, text, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "850 12px system-ui";
  ctx.fillText(text.toUpperCase(), x, y);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 6);
  ctx.lineTo(x + Math.min(118, text.length * 7), y + 6);
  ctx.stroke();
  ctx.restore();
}

function drawAngleArc(ctx, pivotX, pivotY, rearX, rearY, label) {
  const angle = Math.atan2(rearY - pivotY, rearX - pivotX);
  ctx.save();
  ctx.strokeStyle = "#ffb020";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 34, Math.PI, angle, true);
  ctx.stroke();
  ctx.fillStyle = "#ffb020";
  ctx.font = "800 10px system-ui";
  ctx.fillText(label, pivotX - 96, pivotY + 34);
  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function update() {
  const model = calculate();
  setOutputs(model);
  renderDiagnosis(model);
  drawBike(model);
}

function bindRange(id, key, parser = Number) {
  els[id].value = state[key];
  els[id].addEventListener("input", (event) => {
    state[key] = parser(event.target.value);
    update();
  });
}

function initSelect(select, value) {
  select.innerHTML = tireOptions.map((option) => `<option value="${option}">${option}</option>`).join("");
  select.value = value;
}

function init() {
  initSelect(els.frontTire, state.frontTire);
  initSelect(els.rearTire, state.rearTire);

  bindRange("riderWeight", "riderWeight");
  bindRange("frontSag", "frontSag");
  bindRange("rearSag", "rearSag");
  bindRange("forkProtrusion", "forkProtrusion");
  bindRange("rearRideHeight", "rearRideHeight");
  bindRange("tripleOffset", "tripleOffset");

  ["frontTire", "rearTire", "symptom"].forEach((id) => {
    els[id].value = state[id];
    els[id].addEventListener("change", (event) => {
      state[id] = event.target.value;
      update();
    });
  });

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("is-active"));
      document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("is-active"));
      button.classList.add("is-active");
      document.querySelector(`#${button.dataset.tab}Panel`).classList.add("is-active");
    });
  });

  document.querySelector("#resetButton").addEventListener("click", () => {
    Object.assign(state, {
      riderWeight: 86,
      frontSag: 38,
      rearSag: 33,
      frontTire: "120/70 ZR17",
      rearTire: "190/50 ZR17",
      forkProtrusion: 0,
      rearRideHeight: 0,
      tripleOffset: 30,
      symptom: "heavy"
    });
    Object.keys(els).forEach((key) => {
      if (els[key] && state[key] !== undefined) els[key].value = state[key];
    });
    update();
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }

  update();
}

init();
