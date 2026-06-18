// 퀴즈와 시뮬레이션에서 공유하는 기믹 판정과 점수·기록 기능입니다.
function icon(name, alt = name) {
  return `<img class="icon small" src="img/${name}" alt="${alt}">`;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Shared mechanic helpers used by both random quiz and sequential simulation.
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

function thunderMarkerAnswersFor(player, thunderPattern, shouldSoakThunder, hasGaze) {
  return thunderGazeMarkerGroups(player, thunderPattern, shouldSoakThunder, hasGaze).markerAnswers;
}

function blizzardSpreadMarkerGroups(player, blizzardPattern, shouldSoakBlizzard, isSpreadTarget) {
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
    ? (isSpreadTarget ? ["3", "4"] : ["1", "2"])
    : (isSpreadTarget ? ["7", "8"] : ["5", "6"]);
  return {
    blizzardMarkers,
    spreadMarkers,
    markerAnswers: blizzardMarkers.filter((marker) => spreadMarkers.includes(marker))
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

function fact(label, value, options = {}) {
  const cls = options.resolved ? "sim-fact resolved" : "sim-fact";
  const remain = options.remain ? `<small>${options.remain}</small>` : "";
  return `<div class="${cls}"><span>${label}</span><b>${value}${remain}</b></div>`;
}

function setResultState(target, correct, html) {
  target.classList.remove("result-correct", "result-wrong");
  const labelClass = correct ? "result-correct" : "result-wrong";
  const label = correct ? "정답입니다." : "오답입니다.";
  target.innerHTML = `<span class="${labelClass}">${label}</span><br>${html}`;
}

function clearResultState(target, text = "") {
  target.classList.remove("result-correct", "result-wrong");
  target.textContent = text;
}

function addResultLog(target, prefix, selected, answer, correct) {
  const item = document.createElement("li");
  item.className = correct ? "correct" : "wrong";
  const resultText = correct ? "정답" : "오답";
  const resultClass = correct ? "log-correct" : "log-wrong";
  item.innerHTML = `${prefix}: ${selected} → <span class="${resultClass}">${resultText}</span>${correct ? "" : `, 정답은 ${answer}`}`;
  target.prepend(item);
  applyLogFilter(target, target === simLog ? simLogFilter : seqLogFilter);
}

function applyLogFilter(target, filter) {
  [...target.children].forEach((item) => {
    item.classList.toggle("hidden", Boolean(filter) && !item.classList.contains(filter));
  });
}

function setLogFilter(kind, filter) {
  if (kind === "sim") {
    simLogFilter = simLogFilter === filter ? "" : filter;
    simCorrectFilter.classList.toggle("active", simLogFilter === "correct");
    simWrongFilter.classList.toggle("active", simLogFilter === "wrong");
    applyLogFilter(simLog, simLogFilter);
  } else {
    seqLogFilter = seqLogFilter === filter ? "" : filter;
    seqCorrectFilter.classList.toggle("active", seqLogFilter === "correct");
    seqWrongFilter.classList.toggle("active", seqLogFilter === "wrong");
    applyLogFilter(seqLog, seqLogFilter);
  }
}

function toggleLog(target, button) {
  const opened = target.classList.toggle("open");
  target.closest(".seq-history")?.classList.toggle("log-open", opened);
  button.textContent = opened ? "기록 숨기기" : "기록 보기";
}

function updateSimStats() {
  const wrong = simStats.total - simStats.correct;
  simScore.textContent = simStats.correct;
  simCount.textContent = simStats.total;
  simCorrectCount.textContent = simStats.correct;
  simWrongCount.textContent = wrong;
}

function updateSeqStats(correct) {
  if (typeof correct === "boolean") {
    if (correct) seqStats.correct += 1;
    else seqStats.wrong += 1;
  }
  seqCorrectCount.textContent = seqStats.correct;
  seqWrongCount.textContent = seqStats.wrong;
}

function seqPlayerKey() {
  return seqPlayers.find((player) => player.name === selectedSeqPlayer)?.key || "--";
}
