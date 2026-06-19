// 여러 화면에서 공유하는 아이콘, 결과 표시, 기록과 점수 UI를 관리합니다.
function icon(name, alt = name) {
  return `<img class="icon small" src="img/${name}" alt="${alt}">`;
}

function setResultState(target, correct, html) {
  const labelClass = correct ? "result-correct" : "result-wrong";
  const label = correct ? "정답입니다." : "오답입니다.";
  target.classList.remove("result-correct", "result-wrong");
  target.innerHTML = `<span class="${labelClass}">${label}</span><br>${html}`;
}

function clearResultState(target, text = "") {
  target.classList.remove("result-correct", "result-wrong");
  target.textContent = text;
}

function stageGuideHtmlForStep(step) {
  if (!step || step < 1) return "";
  const stages = [...document.querySelectorAll(".stage-grid .stage")];
  const stage = stages.find((item) => item.querySelector(".stage-title")?.textContent.trim().startsWith(`${step}.`)) || stages[step - 1];
  if (!stage) return "";
  const clone = stage.cloneNode(true);
  clone.querySelectorAll("img").forEach((image) => {
    image.loading = "eager";
    image.decoding = "sync";
  });
  return clone.outerHTML;
}

function resultDetailForStep(step, fallback, prefixLines = []) {
  const guide = stageGuideHtmlForStep(step);
  if (!guide) return fallback;
  const lines = prefixLines.filter(Boolean);
  const prefix = lines.length ? `<div class="seq-result-fixed">${lines.join("<br>")}</div>` : "";
  return `${prefix}<div class="seq-result-stage-scroll">${guide}</div>`;
}

function applyLogFilter(target, filter) {
  [...target.children].forEach((item) => {
    item.classList.toggle("hidden", Boolean(filter) && !item.classList.contains(filter));
  });
}

function addResultLog(target, prefix, selected, answer, correct) {
  const item = document.createElement("li");
  const resultText = correct ? "정답" : "오답";
  const resultClass = correct ? "log-correct" : "log-wrong";
  item.className = correct ? "correct" : "wrong";
  item.innerHTML = `${prefix}: ${selected} → <span class="${resultClass}">${resultText}</span>${correct ? "" : `, 정답은 ${answer}`}`;
  target.prepend(item);
  applyLogFilter(target, target === simLog ? simLogFilter : seqLogFilter);
}

function setLogFilter(kind, filter) {
  const isQuiz = kind === "sim";
  const currentFilter = isQuiz ? simLogFilter : seqLogFilter;
  const nextFilter = currentFilter === filter ? "" : filter;
  const correctButton = isQuiz ? simCorrectFilter : seqCorrectFilter;
  const wrongButton = isQuiz ? simWrongFilter : seqWrongFilter;
  const target = isQuiz ? simLog : seqLog;

  if (isQuiz) simLogFilter = nextFilter;
  else seqLogFilter = nextFilter;

  correctButton.classList.toggle("active", nextFilter === "correct");
  wrongButton.classList.toggle("active", nextFilter === "wrong");
  applyLogFilter(target, nextFilter);
}

function toggleLog(target, button) {
  const opened = target.classList.toggle("open");
  target.closest(".seq-history, .quiz-history")?.classList.toggle("log-open", opened);
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
