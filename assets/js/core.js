// 공통 DOM 요소, 애플리케이션 상태와 플레이어 정보를 관리합니다.
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");
const simPrompt = document.getElementById("simPrompt");
const simChoices = document.getElementById("simChoices");
const simResult = document.getElementById("simResult");
const simScore = document.getElementById("simScore");
const simCount = document.getElementById("simCount");
const simCorrectCount = document.getElementById("simCorrectCount");
const simWrongCount = document.getElementById("simWrongCount");
const simCorrectFilter = document.getElementById("simCorrectFilter");
const simWrongFilter = document.getElementById("simWrongFilter");
const simLogToggle = document.getElementById("simLogToggle");
const simLog = document.getElementById("simLog");
const quizAccordion = document.getElementById("quizAccordion");
const quizActivePanel = document.getElementById("quizActivePanel");
const quizNextBtn = document.getElementById("quizNextBtn");
const seqTitle = document.getElementById("seqTitle");
const seqTime = document.getElementById("seqTime");
const seqPrompt = document.getElementById("seqPrompt");
const seqBuffs = document.getElementById("seqBuffs");
const seqChoices = document.getElementById("seqChoices");
const seqResult = document.getElementById("seqResult");
const seqStep = document.getElementById("seqStep");
const seqPlayerBadge = document.getElementById("seqPlayerBadge");
const seqCorrectCount = document.getElementById("seqCorrectCount");
const seqWrongCount = document.getElementById("seqWrongCount");
const seqCorrectFilter = document.getElementById("seqCorrectFilter");
const seqWrongFilter = document.getElementById("seqWrongFilter");
const seqLogToggle = document.getElementById("seqLogToggle");
const seqLog = document.getElementById("seqLog");
const seqNextBtn = document.getElementById("seqNextBtn");
const seqInlineNextBtn = document.getElementById("seqInlineNextBtn");
const seqAccordion = document.getElementById("seqAccordion");
const seqActivePanel = document.getElementById("seqActivePanel");
const cheatResult = document.getElementById("cheatResult");
const cheatGc1SpreadTarget = document.getElementById("cheatGc1SpreadTarget");
const cheatGc2SpreadTarget = document.getElementById("cheatGc2SpreadTarget");
let currentQuiz = null;
let currentQuizState = null;
let quizQuestions = [];
let currentQuizIndex = -1;
let simStats = { correct: 0, total: 0 };
let selectedQuizPlayer = "";
let seqStats = { correct: 0, wrong: 0 };
let simLogFilter = "";
let seqLogFilter = "";
let seq = null;
let selectedSeqPlayer = "";
let seqChoiceHandler = null;
const cheatState = {
  accelRound: "1회차",
  gc1Truth: "진짜",
  gc1Timing: "빠른",
  chaos1Truth: "진짜",
  chaos1Type: "혼돈의 불",
  gc2Truth: "진짜",
  chaos2Truth: "진짜",
  thunderMemory: "진짜",
  blizzardMemory: "진짜",
  releaseTop: "진짜",
  releaseBottom: "진짜"
};
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
const PLAYER_KEY_BY_NAME = new Map(seqPlayers.map((player) => [player.name, player.key]));
const thunderDisplay = "썬더가(직선)";
const blizzardDisplay = "블리자가(부채꼴)";
const seqStepMeta = [
  { step: 0, title: "0. 직업 선택", time: "--:--" },
  { step: 1, title: "1. 알쏭달쏭 마법", time: "00:25" },
  { step: 2, title: "2. 그랜드 크로스 1회차", time: "00:29" },
  { step: 3, title: "3. 카오스 화염 또는 해일", time: "00:35" },
  { step: 4, title: "4. 알쏭달쏭 마법 2회차", time: "00:40" },
  { step: 5, title: "5. 그랜드 크로스 2회차", time: "00:44" },
  { step: 6, title: "6. 카오스 반대 공격", time: "00:49" },
  { step: 7, title: "7. 알쏭달쏭 마법 3회차", time: "00:55" },
  { step: 8, title: "8. 그랜드 크로스 3회차", time: "00:59" },
  { step: 9, title: "9. 무의 범람", time: "01:11" },
  { step: 10, title: "10. 물/번개/가속도 처리", time: "01:21" },
  { step: 11, title: "11. 빠른 마안 + 썬더가(직선)", time: "01:28" },
  { step: 12, title: "12. 혼돈의 불 + 알테마", time: "01:41" },
  { step: 13, title: "13. 물/번개/가속도 + 블리자가(부채꼴)", time: "01:46" },
  { step: 14, title: "14. 느린 마안 / 물·번개·가속도 처리", time: "01:54" },
  { step: 15, title: "15. 마력 방출 + 혼돈의 물", time: "02:00" },
  { step: 16, title: "16. 전멸기 / 5페이즈 전환", time: "02:09" }
];

function jobIcon(key, alt = key) {
  return `<img src="img/job/${key}.png" alt="${alt}">`;
}

function playerIconForKey(key) {
  return key && key !== "--" ? jobIcon(key, key) : "--";
}
