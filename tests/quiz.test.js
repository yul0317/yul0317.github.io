const fs = require("fs");
const path = require("path");
const vm = require("vm");

const projectRoot = path.resolve(__dirname, "..");
const seqPlayers = [
  { key: "T1", name: "탱커 1" },
  { key: "T2", name: "탱커 2" },
  { key: "H1", name: "힐러 1" },
  { key: "H2", name: "힐러 2" },
  { key: "D1", name: "딜러 1" },
  { key: "D2", name: "딜러 2" },
  { key: "D3", name: "딜러 3" },
  { key: "D4", name: "딜러 4" }
];
const context = {
  console,
  document: {
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  }
};
const mechanicsSource = fs.readFileSync(
  path.join(projectRoot, "assets", "js", "mechanics.js"),
  "utf8"
);
const quizSource = fs.readFileSync(
  path.join(projectRoot, "assets", "js", "quiz.js"),
  "utf8"
);

vm.createContext(context);
vm.runInContext(`
  const seqPlayers = ${JSON.stringify(seqPlayers)};
  const simTitle = {};
  const simTime = {};
  const simPrompt = {};
  const simFacts = {};
  const simChoices = {};
  const simResult = {};
  const simLog = {};
  let currentQuiz = null;
  let currentQuizState = null;
  let selectedQuizPlayer = "";
  const thunderDisplay = "썬더가(직선)";
  const blizzardDisplay = "블리자가(부채꼴)";
  function icon(name) { return name; }
  ${mechanicsSource}
  ${quizSource}
  globalThis.quizApi = {
    makeQuizScenarioState,
    makeStageQuiz,
    quizGrandCrossEntries,
    quizChaosEntries,
    quizThirdGrandCrossEntries
  };
`, context);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (let iteration = 0; iteration < 3000; iteration += 1) {
  const state = context.quizApi.makeQuizScenarioState();

  seqPlayers.forEach((player) => {
    assert(
      context.quizApi.quizGrandCrossEntries(state, 1, player.name).length <= 2,
      `${player.key}: 그랜드크로스 1회차 디버프가 2개를 초과함`
    );
    assert(
      context.quizApi.quizGrandCrossEntries(state, 2, player.name).length <= 2,
      `${player.key}: 그랜드크로스 2회차 디버프가 2개를 초과함`
    );
    assert(
      context.quizApi.quizThirdGrandCrossEntries(state, player.name).length === 2,
      `${player.key}: 그랜드크로스 3회차 디버프 수가 잘못됨`
    );
  });

  assert(context.quizApi.quizChaosEntries(state, 1).length === 1, "카오스 1회차 디버프 수가 잘못됨");
  assert(context.quizApi.quizChaosEntries(state, 2).length === 1, "카오스 2회차 디버프 수가 잘못됨");

  for (let stage = 9; stage <= 15; stage += 1) {
    const quiz = context.quizApi.makeStageQuiz(state, stage);
    assert(quiz.title.startsWith(`${stage}.`), `${stage}단계 제목이 잘못됨`);
    assert(Boolean(quiz.answer), `${stage}단계 정답이 없음`);
    assert(Boolean(quiz.prompt), `${stage}단계 질문이 없음`);
    assert(
      Array.isArray(quiz.resultPrefixes) && quiz.resultPrefixes.length > 0,
      `${stage}단계 결과의 내 디버프/처리 디버프 표시가 없음`
    );
  }
}

console.log("quiz.test.js: 3,000개 상태의 9~15단계 퀴즈 검증 통과");
