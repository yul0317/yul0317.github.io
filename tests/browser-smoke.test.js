const fs = require("fs");
const path = require("path");
const vm = require("vm");

const projectRoot = path.resolve(__dirname, "..");
const scriptOrder = [
  "core.js",
  "mechanics.js",
  "ui.js",
  "cheatsheet.js",
  "quiz.js",
  "simulation.js",
  "bootstrap.js"
];

function makeClassList() {
  const values = new Set();
  return {
    add(...names) { names.forEach((name) => values.add(name)); },
    remove(...names) { names.forEach((name) => values.delete(name)); },
    toggle(name, force) {
      const active = force === undefined ? !values.has(name) : Boolean(force);
      if (active) values.add(name);
      else values.delete(name);
      return active;
    },
    contains(name) { return values.has(name); }
  };
}

function makeElement() {
  return {
    classList: makeClassList(),
    dataset: {},
    children: [],
    disabled: false,
    innerHTML: "",
    textContent: "",
    addEventListener() {},
    appendChild() {},
    cloneNode() { return makeElement(); },
    closest() { return null; },
    contains() { return false; },
    prepend() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    remove() {},
    removeAttribute() {},
    scrollTo() {},
    setAttribute() {}
  };
}

const elements = new Map();
const document = {
  body: makeElement(),
  createElement() { return makeElement(); },
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, makeElement());
    return elements.get(id);
  },
  querySelector() { return null; },
  querySelectorAll() { return []; }
};
const context = {
  console,
  document,
  window: { scrollTo() {} },
  MutationObserver: class {
    observe() {}
  }
};

vm.createContext(context);
scriptOrder.forEach((fileName) => {
  const source = fs.readFileSync(
    path.join(projectRoot, "assets", "js", fileName),
    "utf8"
  );
  vm.runInContext(source, context, { filename: fileName });
});

vm.runInContext(`
  initializePanel("quiz");
  initializePanel("simulation");
  initializePanel("cheatsheet");

  const correctLog = document.createElement("li");
  const wrongLog = document.createElement("li");
  correctLog.classList.add("correct");
  wrongLog.classList.add("wrong");
  simLog.children = [correctLog, wrongLog];
  setLogFilter("sim", "correct");
  if (correctLog.classList.contains("hidden") || !wrongLog.classList.contains("hidden")) {
    throw new Error("퀴즈 맞춤 필터가 기록을 올바르게 숨기지 못했습니다.");
  }
  setLogFilter("sim", "wrong");
  if (!correctLog.classList.contains("hidden") || wrongLog.classList.contains("hidden")) {
    throw new Error("퀴즈 틀림 필터가 기록을 올바르게 숨기지 못했습니다.");
  }
`, context);

const simulationCss = fs.readFileSync(
  path.join(projectRoot, "assets", "css", "simulation.css"),
  "utf8"
);
if (!/\.sim-log\s+li\.hidden\s*\{\s*display:\s*none;?\s*\}/.test(simulationCss)) {
  throw new Error("필터링된 기록을 숨기는 CSS가 없습니다.");
}

console.log("browser-smoke.test.js: 스크립트 로드 및 초기화 통과");
