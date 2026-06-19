const fs = require("fs");
const path = require("path");
const vm = require("vm");

const projectRoot = path.resolve(__dirname, "..");
const mechanicsSource = fs.readFileSync(
  path.join(projectRoot, "assets", "js", "mechanics.js"),
  "utf8"
);
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
const context = {};

vm.createContext(context);
vm.runInContext(
  `const seqPlayers = ${JSON.stringify(seqPlayers)};
  ${mechanicsSource}
  globalThis.mechanicsApi = {
    makeEncounterState,
    accelAssignmentAtTiming,
    slowGazeMarkerFor,
    gazeShortAnswer
  };`,
  context
);

const playerNames = seqPlayers.map((player) => player.name);
const groups = [playerNames.slice(0, 4), playerNames.slice(4)];

const slowGazeCases = [
  ["탱커 1", false, "1"],
  ["힐러 2", true, "2"],
  ["딜러 1", true, "3"],
  ["딜러 4", false, "4"]
];
slowGazeCases.forEach(([player, hasGaze, marker]) => {
  assert(
    context.mechanicsApi.slowGazeMarkerFor(player, hasGaze) === marker,
    `${player}: 느린 마안 위치 계산이 잘못됨`
  );
});
assert(context.mechanicsApi.gazeShortAnswer("진짜") === "안본다", "진짜 마안 행동이 잘못됨");
assert(context.mechanicsApi.gazeShortAnswer("가짜") === "본다", "가짜 마안 행동이 잘못됨");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function verifyGrandCrossDistribution(assignment) {
  groups.forEach((group) => {
    const mechanics = group.map((player) => assignment[player].main).sort();
    assert(
      mechanics.join(",") === "마안,물,번개,없음",
      `잘못된 그랜드 크로스 분배: ${mechanics.join(",")}`
    );
  });
}

function verifyEncounter(encounter) {
  verifyGrandCrossDistribution(encounter.gc1Assign);
  verifyGrandCrossDistribution(encounter.gc2Assign);

  groups.flat().forEach((player) => {
    const first = encounter.gc1Assign[player];
    const second = encounter.gc2Assign[player];
    const bothWaterOrThunder = ["물", "번개"].includes(first.main)
      && ["물", "번개"].includes(second.main);
    assert(first.main !== second.main, `${player}: 같은 디버프가 연속 배정됨`);
    assert(!bothWaterOrThunder, `${player}: 물/번개가 연속 배정됨`);
    assert(first.accel !== second.accel, `${player}: 가속도 처리 횟수가 잘못됨`);
    assert(
      !first.accel || !["물", "번개"].includes(first.main),
      `${player}: 1회차 물/번개와 가속도가 동시에 부여됨`
    );
    assert(
      !second.accel || !["물", "번개"].includes(second.main),
      `${player}: 2회차 물/번개와 가속도가 동시에 부여됨`
    );
    const accelData = first.accel ? first : second;
    assert(
      ["빠른", "느린"].includes(accelData.accelTiming),
      `${player}: 가속도 처리 시간이 배정되지 않음`
    );
  });

  assert(
    playerNames.filter((player) => encounter.gc1Assign[player].accel).length === 4,
    "1회차 가속도 대상자가 4명이 아님"
  );
  assert(
    playerNames.filter((player) => encounter.gc2Assign[player].accel).length === 4,
    "2회차 가속도 대상자가 4명이 아님"
  );
  const allAccelAssignments = playerNames.map((player) => (
    encounter.gc1Assign[player].accel
      ? encounter.gc1Assign[player]
      : encounter.gc2Assign[player]
  ));
  assert(
    allAccelAssignments.filter((assignment) => assignment.accelTiming === "빠른").length === 4,
    "빠른 가속도 대상자가 4명이 아님"
  );
  assert(
    allAccelAssignments.filter((assignment) => assignment.accelTiming === "느린").length === 4,
    "느린 가속도 대상자가 4명이 아님"
  );
  playerNames.forEach((player) => {
    const fast = context.mechanicsApi.accelAssignmentAtTiming(
      encounter.gc1Assign[player],
      encounter.gc2Assign[player],
      encounter.gc1,
      encounter.gc2,
      "빠른"
    );
    const slow = context.mechanicsApi.accelAssignmentAtTiming(
      encounter.gc1Assign[player],
      encounter.gc2Assign[player],
      encounter.gc1,
      encounter.gc2,
      "느린"
    );
    assert(Boolean(fast) !== Boolean(slow), `${player}: 가속도 처리 시간이 하나로 결정되지 않음`);
  });
  assert(
    playerNames.filter((player) => encounter.gc3Assign[player].wound === "산자의 상처").length === 4,
    "산자의 상처 대상자가 4명이 아님"
  );
  assert(
    playerNames.filter((player) => encounter.gc3Assign[player].finalDebuff === "알라그 필드").length === 4,
    "알라그 필드 대상자가 4명이 아님"
  );
  assert(encounter.chaosFirst !== encounter.chaosSecond, "혼돈 디버프 종류가 중복됨");
}

for (let iteration = 0; iteration < 10000; iteration += 1) {
  verifyEncounter(context.mechanicsApi.makeEncounterState());
}

console.log("mechanics.test.js: 10,000개 랜덤 상황 검증 통과");
