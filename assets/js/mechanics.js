// 퀴즈와 시뮬레이션에서 공유하는 순수 기믹 판정과 상황 생성 로직입니다.
const TRUTH_VALUES = Object.freeze(["진짜", "가짜"]);
const CHAOS_TYPES = Object.freeze(["혼돈의 불", "혼돈의 물"]);
const GRAND_CROSS_MECHANICS = Object.freeze(["물", "번개", "마안", "없음"]);
const PARTY_PLAYER_NAMES = Object.freeze(seqPlayers.map((player) => player.name));
const GRAND_CROSS_GROUPS = Object.freeze([
  Object.freeze(PARTY_PLAYER_NAMES.slice(0, 4)),
  Object.freeze(PARTY_PLAYER_NAMES.slice(4))
]);

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  const shuffled = [...list];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function permutations(list) {
  if (list.length <= 1) return [list];
  return list.flatMap((item, index) => (
    permutations([...list.slice(0, index), ...list.slice(index + 1)])
      .map((rest) => [item, ...rest])
  ));
}

const GRAND_CROSS_ASSIGNMENT_OPTIONS = Object.freeze(
  permutations(GRAND_CROSS_MECHANICS).map((assignment) => Object.freeze(assignment))
);

function isSupportPlayer(player) {
  return player.startsWith("탱커") || player.startsWith("힐러");
}

function isSpreadTarget(main, truth) {
  return (main === "번개" && truth === "진짜") || (main === "물" && truth === "가짜");
}

function flipColor(color) {
  return color === "같은 색" ? "다른 색" : "같은 색";
}

function floodBaseFor(finalDebuff) {
  return finalDebuff === "알라그 필드" ? "다른 색" : "같은 색";
}

function floodFinalColor(finalDebuff, floodTruth) {
  const base = floodBaseFor(finalDebuff);
  return floodTruth === "가짜" ? flipColor(base) : base;
}

function floodMarkerFor(wound, finalColor) {
  const sameColorMarker = wound === "산자의 상처" ? "1" : "2";
  const differentColorMarker = wound === "산자의 상처" ? "2" : "1";
  return finalColor === "같은 색" ? sameColorMarker : differentColorMarker;
}

function spreadMarkerFor(player, spread) {
  if (spread === "산개") return isSupportPlayer(player) ? "1" : "3";
  return isSupportPlayer(player) ? "2" : "4";
}

function movementAnswerFor(accel) {
  if (accel === "멈춤") return "안 움직임";
  if (accel === "움직임") return "움직임";
  return "움직임 상관없음";
}

function gazeActionAnswer(truth) {
  return truth === "진짜" ? "뒤돌기" : "바라보기";
}

function gazeTextAnswer(truth) {
  return gazeActionAnswer(truth) === "바라보기" ? "마안 본다" : "마안 안본다";
}

function thunderGazeMarkerGroups(player, thunderPattern, shouldSoakThunder, hasGaze) {
  const support = isSupportPlayer(player);
  const firstSide = support
    ? (thunderPattern === 1 ? "far" : "near")
    : (thunderPattern === 1 ? "near" : "far");
  const thunderMarkers = firstSide === "near"
    ? (shouldSoakThunder ? ["1", "3"] : ["2", "4"])
    : (shouldSoakThunder ? ["5", "7"] : ["6", "8"]);
  const gazeMarkers = firstSide === "near"
    ? (hasGaze ? ["3", "4"] : ["1", "2"])
    : (hasGaze ? ["5", "6"] : ["7", "8"]);
  return {
    thunderMarkers,
    gazeMarkers,
    markerAnswers: thunderMarkers.filter((marker) => gazeMarkers.includes(marker))
  };
}

function blizzardSpreadMarkerGroups(player, blizzardPattern, shouldSoakBlizzard, spreadTarget) {
  const support = isSupportPlayer(player);
  const firstPattern = Number(blizzardPattern) === 1;
  const blizzardMarkers = support
    ? (shouldSoakBlizzard
      ? (firstPattern ? ["1", "3"] : ["2", "4"])
      : (firstPattern ? ["2", "4"] : ["1", "3"]))
    : (shouldSoakBlizzard
      ? (firstPattern ? ["5", "7"] : ["6", "8"])
      : (firstPattern ? ["6", "8"] : ["5", "7"]));
  const spreadMarkers = support
    ? (spreadTarget ? ["3", "4"] : ["1", "2"])
    : (spreadTarget ? ["7", "8"] : ["5", "6"]);
  return {
    blizzardMarkers,
    spreadMarkers,
    markerAnswers: blizzardMarkers.filter((marker) => spreadMarkers.includes(marker))
  };
}

function makeGrandCrossMainAssignment() {
  const result = {};

  GRAND_CROSS_GROUPS.forEach((group) => {
    shuffle(group).forEach((player, index) => {
      result[player] = { main: GRAND_CROSS_MECHANICS[index], accel: false };
    });
  });

  return result;
}

function hasGrandCrossConflict(before, after) {
  if (before === after) return true;
  return (before === "물" || before === "번개") && (after === "물" || after === "번개");
}

function makeNextGrandCrossMainAssignment(previous) {
  const result = {};

  GRAND_CROSS_GROUPS.forEach((group) => {
    const validAssignments = GRAND_CROSS_ASSIGNMENT_OPTIONS.filter((assignment) => (
      assignment.every((mechanic, index) => (
        !hasGrandCrossConflict(previous[group[index]].main, mechanic)
      ))
    ));
    const next = pick(validAssignments);

    group.forEach((player, index) => {
      result[player] = { main: next[index], accel: false };
    });
  });

  return result;
}

function makeGrandCrossAssignments() {
  const first = makeGrandCrossMainAssignment();
  const second = makeNextGrandCrossMainAssignment(first);
  const firstNoMain = PARTY_PLAYER_NAMES.filter((player) => first[player].main === "없음");
  const secondNoMain = PARTY_PLAYER_NAMES.filter((player) => second[player].main === "없음");
  const firstAccel = new Set(firstNoMain);
  const blockedFirstAccel = new Set(secondNoMain);
  const candidates = PARTY_PLAYER_NAMES.filter((player) => (
    !firstAccel.has(player) && !blockedFirstAccel.has(player)
  ));
  const accelTargetCount = PARTY_PLAYER_NAMES.length / 2;

  shuffle(candidates)
    .slice(0, accelTargetCount - firstAccel.size)
    .forEach((player) => firstAccel.add(player));
  PARTY_PLAYER_NAMES.forEach((player) => {
    first[player].accel = firstAccel.has(player);
    second[player].accel = !first[player].accel;
  });

  return { first, second };
}

function makeGrandCrossThirdAssignment() {
  const halfParty = PARTY_PLAYER_NAMES.length / 2;
  const wounds = shuffle([
    ...Array(halfParty).fill("산자의 상처"),
    ...Array(halfParty).fill("죽은자의 상처")
  ]);
  const finalDebuffs = shuffle([
    ...Array(halfParty).fill("알라그 필드"),
    ...Array(halfParty).fill("죽음 초월")
  ]);

  return Object.fromEntries(PARTY_PLAYER_NAMES.map((player, index) => [
    player,
    { wound: wounds[index], finalDebuff: finalDebuffs[index] }
  ]));
}

function personalGrandCrossAction(data, truth) {
  const spread = isSpreadTarget(data.main, truth) ? "산개" : "본대";
  const accel = data.accel ? (truth === "진짜" ? "멈춤" : "움직임") : "가속도 없음";
  return { spread, accel, main: data.main, hasGaze: data.main === "마안" };
}

function makeGrandCrossSchedule() {
  const firstSpread = pick(["gc1Spread", "gc2Spread"]);
  const secondSpread = firstSpread === "gc1Spread" ? "gc2Spread" : "gc1Spread";
  const order = [firstSpread, "gc1Gaze", secondSpread, "gc2Gaze"];
  const times = [
    { step: 10, time: "01:21" },
    { step: 11, time: "01:30" },
    { step: 13, time: "01:46" },
    { step: 14, time: "01:54" }
  ];

  return Object.fromEntries(order.map((key, index) => [key, times[index]]));
}

function makeEncounterState() {
  const grandCrossAssignments = makeGrandCrossAssignments();
  const gc3Assign = makeGrandCrossThirdAssignment();
  const chaosFirst = pick(CHAOS_TYPES);
  const chaosSecond = CHAOS_TYPES.find((type) => type !== chaosFirst);
  const chaos1Truth = pick(TRUTH_VALUES);
  const chaos2Truth = pick(TRUTH_VALUES);

  return {
    gcSchedule: makeGrandCrossSchedule(),
    gc1Assign: grandCrossAssignments.first,
    gc2Assign: grandCrossAssignments.second,
    gc3Assign,
    gc1: pick(TRUTH_VALUES),
    gc2: pick(TRUTH_VALUES),
    gc3: pick(TRUTH_VALUES),
    chaosFirst,
    chaosSecond,
    chaos1Truth,
    chaos2Truth,
    fireTruth: chaosFirst === "혼돈의 불" ? chaos1Truth : chaos2Truth,
    waterTruth: chaosFirst === "혼돈의 물" ? chaos1Truth : chaos2Truth,
    flood: pick(TRUTH_VALUES),
    thunderMemory: pick(TRUTH_VALUES),
    blizzardMemory: pick(TRUTH_VALUES),
    releaseTop: pick(TRUTH_VALUES),
    releaseBottom: pick(TRUTH_VALUES)
  };
}

function chaosAnswerFor(chaos, truth) {
  if (chaos === "혼돈의 불") return truth === "진짜" ? "밖" : "안";
  return truth === "진짜" ? "안" : "밖";
}

function releasePatternAnswer(memory, release) {
  return memory === release ? "피하기" : "밟기";
}

function releaseTruthFileName(value) {
  return value === "진짜" ? "진실" : "거짓";
}
