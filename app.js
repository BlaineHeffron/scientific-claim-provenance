const SENSITIVITY = {
  verdict_capable: { label: "Verdict-capable", className: "verdict" },
  precision_only: { label: "Precision only", className: "precision" },
  interpretation_only: { label: "Interpretation only", className: "interpretation" },
  unknown: { label: "Unknown", className: "unknown" },
};

const TYPE_LABELS = {
  root_claim: "Root claim",
  observation: "Observation",
  quantity_definition: "Quantity definition",
  instrument_response: "Instrument response",
  calibration: "Calibration",
  reference_standard: "Reference standard",
  sample_or_source_characterization: "Source / sample",
  entity_identification: "Entity identification",
  data_reduction: "Data reduction",
  statistical_inference: "Statistical inference",
  theoretical_model: "Theoretical model",
  auxiliary_assumption: "Auxiliary assumption",
  interpretation: "Interpretation",
  publication_record: "Publication record",
  artifact: "Artifact",
  unresolved_frontier: "Unresolved frontier",
};

const STATUS_LABELS = {
  verified_primary: "Primary source",
  verified_record: "Verified record",
  reproduced: "Reproduced",
  source_asserted: "Source asserted",
  unresolved: "Unresolved",
  inaccessible: "Inaccessible",
  depth_limited: "Depth limited",
};

const state = {
  data: null,
  claimIndex: 0,
  selectedNodeId: null,
  search: "",
  type: "all",
  sensitivities: new Set(Object.keys(SENSITIVITY)),
  frontiersOnly: false,
  visibleIds: new Set(),
};

const $ = (selector) => document.querySelector(selector);
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function currentClaim() {
  return state.data.claims[state.claimIndex];
}

function setAccent(claim) {
  const colors = { amber: "#e6a54b", cyan: "#5ec6d8", violet: "#b98be8" };
  document.documentElement.style.setProperty("--accent", colors[claim.accent] || colors.amber);
  document.documentElement.style.setProperty("--accent-soft", `${colors[claim.accent] || colors.amber}22`);
}

function renderMetrics() {
  const metrics = [
    ["Claims", state.data.counts.claims],
    ["Dependency nodes", state.data.counts.nodes],
    ["Explicit frontiers", state.data.counts.frontiers],
    ["Reviewed edges", state.data.counts.reverseReviewedEdges],
  ];
  const container = $("#hero-metrics");
  container.replaceChildren();
  for (const [label, value] of metrics) {
    const wrap = el("div");
    wrap.append(el("dt", "", label), el("dd", "", String(value)));
    container.append(wrap);
  }
}

function renderClaimTabs() {
  const container = $("#claim-tabs");
  container.replaceChildren();
  state.data.claims.forEach((claim, index) => {
    const button = el("button", "claim-tab");
    button.type = "button";
    button.role = "tab";
    button.id = `claim-tab-${index}`;
    button.setAttribute("aria-controls", "explorer");
    button.setAttribute("aria-selected", String(index === state.claimIndex));
    button.append(
      el("span", "tab-index", `0${index + 1} · ${claim.year}`),
      el("strong", "", claim.title),
      el("small", "", `${claim.counts.nodes} nodes · ${claim.counts.frontiers} frontiers`),
    );
    button.addEventListener("click", () => selectClaim(index));
    container.append(button);
  });
}

function renderSensitivityFilters() {
  const container = $("#sensitivity-filters");
  container.replaceChildren();
  for (const [key, info] of Object.entries(SENSITIVITY)) {
    const label = el("label", "filter-check");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = state.sensitivities.has(key);
    input.value = key;
    input.addEventListener("change", () => {
      if (input.checked) state.sensitivities.add(key);
      else state.sensitivities.delete(key);
      renderGraph();
    });
    const dot = el("i");
    dot.style.background = `var(--${info.className})`;
    label.append(input, dot, document.createTextNode(info.label));
    container.append(label);
  }
}

function renderTypeFilter() {
  const select = $("#type-filter");
  const types = [...new Set(currentClaim().nodes.map((node) => node.type))]
    .sort((a, b) => (TYPE_LABELS[a] || a).localeCompare(TYPE_LABELS[b] || b));
  select.replaceChildren(new Option("All node types", "all"));
  types.forEach((type) => select.append(new Option(TYPE_LABELS[type] || type, type)));
  select.value = state.type;
}

function nodeMatches(node) {
  if (state.frontiersOnly && node.type !== "unresolved_frontier") return false;
  if (!state.sensitivities.has(node.sensitivity)) return false;
  if (state.type !== "all" && node.type !== state.type) return false;
  const query = state.search.trim().toLowerCase();
  if (!query) return true;
  return [node.id, node.type, node.proposition, node.status, node.sensitivity]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function renderGraph() {
  const claim = currentClaim();
  const visible = claim.nodes.filter(nodeMatches);
  state.visibleIds = new Set(visible.map((node) => node.id));
  $("#visible-count").textContent = String(visible.length);
  $("#graph-empty").hidden = visible.length !== 0;

  const columns = $("#graph-columns");
  columns.replaceChildren();
  for (let depth = 0; depth <= 3; depth += 1) {
    const column = el("div", "depth-column");
    column.dataset.depth = String(depth);
    column.append(el("div", "depth-title", depth === 0 ? "Root" : `Depth ${depth}`));
    const depthNodes = visible.filter((node) => node.depth === depth);
    for (const node of depthNodes) column.append(createNodeButton(node));
    columns.append(column);
  }

  if (state.selectedNodeId && !state.visibleIds.has(state.selectedNodeId)) {
    state.selectedNodeId = null;
    renderInspector();
  }
  requestAnimationFrame(drawEdges);
}

function createNodeButton(node) {
  const button = el("button", "graph-node");
  button.type = "button";
  button.dataset.id = node.id;
  button.dataset.type = node.type;
  button.dataset.sensitivity = node.sensitivity;
  button.setAttribute("aria-label", `${TYPE_LABELS[node.type] || node.type}: ${node.proposition}`);
  if (state.selectedNodeId === node.id) button.classList.add("selected");
  const meta = el("span", "node-meta");
  meta.append(el("span", "", TYPE_LABELS[node.type] || node.type), el("span", "", node.id));
  button.append(meta, el("p", "", node.proposition));
  button.addEventListener("click", () => selectNode(node.id));
  return button;
}

function drawEdges() {
  const claim = currentClaim();
  const stage = $("#graph-stage");
  const svg = $("#edge-layer");
  const stageRect = stage.getBoundingClientRect();
  const width = Math.max(stage.scrollWidth, stage.clientWidth);
  const height = Math.max(stage.scrollHeight, stage.clientHeight);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.replaceChildren();

  for (const edge of claim.edges) {
    if (!state.visibleIds.has(edge.source) || !state.visibleIds.has(edge.target)) continue;
    const source = stage.querySelector(`[data-id="${edge.source}"]`);
    const target = stage.querySelector(`[data-id="${edge.target}"]`);
    if (!source || !target) continue;
    const a = source.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const ax = a.left - stageRect.left + stage.scrollLeft;
    const ay = a.top - stageRect.top + stage.scrollTop + a.height / 2;
    const bx = b.right - stageRect.left + stage.scrollLeft;
    const by = b.top - stageRect.top + stage.scrollTop + b.height / 2;
    const bend = Math.max(30, Math.abs(ax - bx) * 0.42);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${ax} ${ay} C ${ax - bend} ${ay}, ${bx + bend} ${by}, ${bx} ${by}`);
    const sourceNode = claim.nodes.find((node) => node.id === edge.source);
    if (sourceNode?.type === "unresolved_frontier") path.classList.add("frontier-edge");
    if (state.selectedNodeId && [edge.source, edge.target].includes(state.selectedNodeId)) path.classList.add("highlight");
    svg.append(path);
  }
}

function selectNode(nodeId) {
  state.selectedNodeId = nodeId;
  document.querySelectorAll(".graph-node").forEach((node) => {
    node.classList.toggle("selected", node.dataset.id === nodeId);
  });
  renderInspector();
  drawEdges();
}

function renderInspector() {
  const placeholder = $("#inspector-placeholder");
  const content = $("#inspector-content");
  const claim = currentClaim();
  const node = claim.nodes.find((item) => item.id === state.selectedNodeId);
  if (!node) {
    placeholder.hidden = false;
    content.hidden = true;
    content.replaceChildren();
    return;
  }
  placeholder.hidden = true;
  content.hidden = false;
  content.replaceChildren();
  content.append(
    el("span", "inspector-kicker", `${node.id} · depth ${node.depth}`),
    el("h3", "", node.proposition),
  );
  const pills = el("div", "pill-row");
  pills.append(
    el("span", "pill", TYPE_LABELS[node.type] || node.type),
    el("span", "pill", STATUS_LABELS[node.status] || node.status),
    el("span", "pill", SENSITIVITY[node.sensitivity]?.label || node.sensitivity),
  );
  content.append(pills);

  const evidence = el("section", "inspector-section");
  evidence.append(el("h4", "", "Evidence and locators"));
  if (!node.locators.length) {
    evidence.append(el("p", "", "No locator: this node is an explicit frontier."));
  } else {
    node.locators.forEach((locator) => {
      const block = el("div", "locator");
      block.append(
        el("strong", "", locator.sourceId || "Audit record"),
        el("span", "", locator.locator),
        el("p", "", locator.supportScope),
      );
      evidence.append(block);
    });
  }
  content.append(evidence);

  const related = claim.edges.filter((edge) => edge.source === node.id || edge.target === node.id);
  const edgeSection = el("section", "inspector-section");
  edgeSection.append(el("h4", "", `Immediate edges · ${related.length}`));
  const list = el("div", "edge-list");
  related.forEach((edge) => {
    const direction = edge.source === node.id ? `supports ${edge.target}` : `depends on ${edge.source}`;
    const item = el("div", "edge-item");
    const strong = el("strong", "", `${edge.type} · ${direction}`);
    item.append(strong, document.createElement("br"), document.createTextNode(edge.statement));
    list.append(item);
  });
  edgeSection.append(list);
  content.append(edgeSection);
}

function renderShared() {
  const grid = $("#shared-grid");
  grid.replaceChildren();
  state.data.sharedDependencies.forEach((item) => {
    const card = el("article", "shared-card");
    card.append(
      el("span", "risk", `Double-counting risk · ${item.double_counting_risk}`),
      el("h3", "", item.canonical_dependency_id.replace(/^SD-/, "").replaceAll("-", " ")),
      el("p", "", item.correlation_mechanism),
      el("small", "", item.correlation_scope),
    );
    grid.append(card);
  });
}

function selectClaim(index) {
  state.claimIndex = index;
  state.selectedNodeId = null;
  state.search = "";
  state.type = "all";
  state.frontiersOnly = false;
  state.sensitivities = new Set(Object.keys(SENSITIVITY));
  $("#node-search").value = "";
  $("#show-frontiers").setAttribute("aria-pressed", "false");
  const claim = currentClaim();
  setAccent(claim);
  renderClaimTabs();
  renderSensitivityFilters();
  renderTypeFilter();
  $("#claim-citation").textContent = claim.citation;
  $("#explorer-title").textContent = claim.title;
  $("#root-claim").textContent = claim.rootClaim;
  $("#source-link").href = claim.recordUrl;
  $("#survival-text").textContent = claim.survival;
  renderGraph();
  renderInspector();
}

function bindControls() {
  $("#node-search").addEventListener("input", (event) => {
    state.search = event.target.value;
    renderGraph();
  });
  $("#type-filter").addEventListener("change", (event) => {
    state.type = event.target.value;
    renderGraph();
  });
  $("#show-frontiers").addEventListener("click", (event) => {
    state.frontiersOnly = !state.frontiersOnly;
    event.currentTarget.setAttribute("aria-pressed", String(state.frontiersOnly));
    renderGraph();
  });
  $("#reset-filters").addEventListener("click", () => selectClaim(state.claimIndex));
  $("#graph-stage").addEventListener("scroll", () => requestAnimationFrame(drawEdges));
  window.addEventListener("resize", () => requestAnimationFrame(drawEdges));
}

async function init() {
  try {
    const response = await fetch("data/claims.json");
    if (!response.ok) throw new Error(`Dataset request failed: ${response.status}`);
    state.data = await response.json();
    renderMetrics();
    renderShared();
    bindControls();
    selectClaim(0);
  } catch (error) {
    console.error(error);
    $("#explorer-title").textContent = "The derived dataset could not be loaded.";
    $("#root-claim").textContent = "Run this site through a local HTTP server rather than opening index.html directly.";
  }
}

init();
