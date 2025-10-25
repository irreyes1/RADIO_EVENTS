const canvas = document.getElementById("handoverCanvas");
const ctx = canvas.getContext("2d");
const userProgressInput = document.getElementById("userProgress");
const progressValue = document.getElementById("progressValue");
const coverageStatus = document.getElementById("coverageStatus");
const coverageDetails = document.getElementById("coverageDetails");
const evaluationOutput = document.getElementById("a3-evaluation");

const baseWidth = 900;
const baseHeight = 540;

canvas.width = baseWidth;
canvas.height = baseHeight;

const sites = [
  {
    id: "ARA0319",
    name: "ARA0319",
    x: 260,
    y: 300,
    color: "#1a4f9c",
    coverageRings: [60, 120, 180],
    sectors: [
      { start: toRadians(-150), end: toRadians(-30) },
      { start: toRadians(-30), end: toRadians(90) },
      { start: toRadians(90), end: toRadians(210) }
    ]
  },
  {
    id: "ARA0022",
    name: "ARA0022",
    x: 640,
    y: 240,
    color: "#1f7a50",
    coverageRings: [60, 120, 180],
    sectors: [
      { start: toRadians(-90), end: toRadians(30) },
      { start: toRadians(30), end: toRadians(150) },
      { start: toRadians(150), end: toRadians(270) }
    ]
  }
];

const corridorPath = [
  { x: 260, y: 300 },
  { x: 340, y: 270 },
  { x: 430, y: 260 },
  { x: 520, y: 250 },
  { x: 640, y: 240 }
];

const pathSegments = buildPathSegments(corridorPath);
const totalPathLength = pathSegments.reduce((acc, segment) => acc + segment.length, 0);

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function buildPathSegments(points) {
  const segments = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    segments.push({ start, end, length });
  }
  return segments;
}

function positionAlongPath(progress) {
  const targetDistance = (progress / 100) * totalPathLength;
  let accumulated = 0;
  for (const segment of pathSegments) {
    if (accumulated + segment.length >= targetDistance) {
      const remaining = targetDistance - accumulated;
      const t = segment.length === 0 ? 0 : remaining / segment.length;
      const x = segment.start.x + (segment.end.x - segment.start.x) * t;
      const y = segment.start.y + (segment.end.y - segment.start.y) * t;
      return { x, y };
    }
    accumulated += segment.length;
  }
  return pathSegments[pathSegments.length - 1].end;
}

function evaluateCoverage(position) {
  let bestSite = null;
  let bestDistance = Infinity;

  sites.forEach((site) => {
    const distance = Math.hypot(position.x - site.x, position.y - site.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestSite = { ...site, distance };
    }
  });

  const coverageBand = bestDistance <= 60
    ? "Zona central con 'good coverage'."
    : bestDistance <= 120
      ? "Zona optimizada para mediciones con buena calidad."
      : bestDistance <= 180
        ? "Franja de solape: se recomiendan mediciones inter-frecuencia."
        : "Exterior al radio planificado: prioridad a búsqueda de celdas vecinas.";

  const details = [
    `Distancia estimada a ${bestSite.name}: ${bestDistance.toFixed(1)} m (escala esquemática).`,
    `Sugerencia: ${coverageBand}`
  ];

  return { bestSite, coverageBand, details };
}

function drawScene(position, bestSite) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  sites.forEach((site) => {
    site.coverageRings.forEach((radius, index) => {
      ctx.beginPath();
      ctx.arc(site.x, site.y, radius, 0, Math.PI * 2);
      const isPrimary = bestSite && site.id === bestSite.id;
      ctx.strokeStyle = site.color;
      ctx.lineWidth = isPrimary ? 3 : 2;
      ctx.globalAlpha = isPrimary ? 0.55 - index * 0.12 : 0.3 - index * 0.08;
      ctx.stroke();
    });
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 8;
    site.sectors.forEach((sector) => {
      ctx.beginPath();
      ctx.arc(site.x, site.y, 200, sector.start, sector.end);
      ctx.strokeStyle = site.color;
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(site.x, site.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = site.color;
    ctx.stroke();
    ctx.fillStyle = site.color;
    ctx.font = "600 16px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(site.name, site.x, site.y - 18);
  });

  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(244, 185, 66, 0.8)";
  ctx.beginPath();
  ctx.moveTo(corridorPath[0].x, corridorPath[0].y);
  for (let i = 1; i < corridorPath.length; i += 1) {
    ctx.lineTo(corridorPath[i].x, corridorPath[i].y);
  }
  ctx.stroke();

  ctx.fillStyle = "#f4b942";
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(position.x, position.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#203047";
  ctx.stroke();

  ctx.fillStyle = "#203047";
  ctx.font = "600 14px 'Inter', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Usuario en trayecto", position.x + 14, position.y - 12);
}

function updateSimulation() {
  const progress = Number(userProgressInput.value);
  progressValue.textContent = `${progress}%`;

  const position = positionAlongPath(progress);
  const { bestSite, coverageBand, details } = evaluateCoverage(position);

  coverageStatus.textContent = `Celda dominante: ${bestSite.name}. ${coverageBand}`;
  coverageDetails.innerHTML = "";
  details.forEach((detail) => {
    const li = document.createElement("li");
    li.textContent = detail;
    coverageDetails.appendChild(li);
  });

  drawScene(position, bestSite);
}

userProgressInput.addEventListener("input", updateSimulation);
window.addEventListener("resize", () => updateSimulation());

updateSimulation();

function collectFormulaValues() {
  return {
    rsrpTarget: Number(document.getElementById("rsrpTarget").value),
    rsrpSource: Number(document.getElementById("rsrpSource").value),
    a3offset: Number(document.getElementById("a3offset").value),
    freqOffset: Number(document.getElementById("freqOffset").value),
    qciOffset: Number(document.getElementById("qciOffset").value),
    hysteresis: Number(document.getElementById("hysteresis").value),
    cellOffset: Number(document.getElementById("cellOffset").value)
  };
}

function updateFormulaResult() {
  const values = collectFormulaValues();
  const lhs = values.rsrpTarget - values.rsrpSource;
  const rhs =
    values.a3offset / 10 +
    values.freqOffset / 10 +
    values.qciOffset / 10 +
    values.hysteresis / 10 -
    values.cellOffset;

  const difference = lhs - rhs;
  const meetsCondition = difference > 0;
  const formatter = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  evaluationOutput.textContent = `Resultado actual: ${formatter.format(lhs)} dB ${meetsCondition ? ">" : "≤"} ${formatter.format(rhs)} dB → ${meetsCondition ? "Se cumple la condición A3" : "No se cumple la condición A3"}. Δ = ${formatter.format(difference)} dB.`;
}

const formulaInputs = document.querySelectorAll("#a3-form input");
formulaInputs.forEach((input) => input.addEventListener("input", updateFormulaResult));
updateFormulaResult();

const fallbackEvents = [
  ["A1", "Servidora vuelve \"buena\"", "serving > umbral", "Absoluta", "Finalizar mediciones inter o IRAT"],
  ["A2", "Servidora se vuelve \"mala\"", "serving < umbral", "Absoluta", "Activar mediciones inter-freq o IRAT"],
  ["A3", "Vecina mejor que servidora", "neighbor > serving + offset", "Relativa", "Handover intra-frecuencia"],
  ["A4", "Vecina supera nivel fijo", "neighbor > umbral", "Absoluta", "Medición de nuevas vecinas o SCells"],
  ["A5", "Servidora cae + vecina mejora", "serving < Th1 & neighbor > Th2", "Doble", "Handover inter-freq o IRAT"],
  ["A6", "Vecina mejor en misma RAT/capa", "neighbor > serving + offset", "Relativa", "Movilidad dual layer"],
  ["B1", "Vecina IRAT supera umbral", "IRAT neighbor > umbral", "Absoluta", "Preparar transición LTE/3G/5G"],
  ["B2", "Servidora cae + IRAT vecina mejora", "serving < Th1 & IRAT neighbor > Th2", "Doble", "Handover IRAT"],
];

const tableBody = document.querySelector("#eventsTable tbody");

function renderTable(rows) {
  tableBody.innerHTML = "";
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cellText) => {
      const td = document.createElement("td");
      td.textContent = cellText;
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });
}

fetch("data/event_table.csv")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`No se pudo cargar la tabla (${response.status})`);
    }
    return response.text();
  })
  .then((text) => {
    const rows = text
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((cell) => cell.replaceAll('"', "")));
    renderTable(rows);
  })
  .catch(() => {
    renderTable(fallbackEvents);
  });
