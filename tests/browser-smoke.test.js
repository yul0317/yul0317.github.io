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
  return {
    add() {},
    remove() {},
    toggle() { return false; },
    contains() { return false; }
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

console.log("browser-smoke.test.js: 스크립트 로드 및 초기화 통과");
