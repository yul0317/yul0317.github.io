// 여러 화면에서 공유하는 아이콘, 결과 표시, 기록과 점수 UI를 관리합니다.
function icon(name, alt = name) {
  return `<img class="icon small" src="img/${name}" alt="${alt}">`;
}

function truthIcon(value) {
  return icon(value === "진짜" ? "진실.png" : "거짓.png", value);
}

function mechanicIcon(name) {
  const icons = {
    "물/번개": `${icon("물.webp", "물")} ${icon("번개.webp", "번개")}`,
    "물": icon("물.webp", "물"),
    "번개": icon("번개.webp", "번개"),
    "가속도": icon("가속도 폭탄.webp", "가속도 폭탄"),
    "마안": icon("저주의 외침.webp", "저주의 외침"),
    "혼돈의 불": icon("혼돈의 불.webp", "혼돈의 불"),
    "혼돈의 물": icon("혼돈의 물.webp", "혼돈의 물"),
    "없음": "-"
  };
  return icons[name] || name;
}

function personalDebuffLine(data, truth, action = null) {
  const debuffs = [];
  if (data.main && data.main !== "없음") {
    debuffs.push(`${mechanicIcon(data.main)} (${truthIcon(truth)})`);
  }
  if (action?.hasAccel) {
    debuffs.push(`${mechanicIcon("가속도")} ${action.accelRound}회차 (${truthIcon(action.accelTruth)})`);
  }
  return `내 디버프: ${debuffs.length ? debuffs.join(" / ") : "없음"}`;
}

function handlingDebuffLine(debuff, truth) {
  return `처리 디버프: ${debuff} (${truthIcon(truth)})`;
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

let stageGuideCache = null;

function getStageGuideCache() {
  if (stageGuideCache) return stageGuideCache;
  const stages = [...document.querySelectorAll(".stage-grid .stage")];
  const byStep = new Map();
  stages.forEach((stage, index) => {
    const title = stage.querySelector(".stage-title")?.textContent.trim() || "";
    const step = Number.parseInt(title, 10);
    const clone = stage.cloneNode(true);
    clone.querySelectorAll("img").forEach((image) => {
      image.loading = "eager";
      image.decoding = "sync";
    });
    const html = clone.outerHTML;
    if (Number.isInteger(step)) byStep.set(step, html);
    if (!byStep.has(index + 1)) byStep.set(index + 1, html);
  });
  stageGuideCache = byStep;
  return stageGuideCache;
}

function stageGuideHtmlForStep(step) {
  if (!step || step < 1) return "";
  return getStageGuideCache().get(step) || "";
}

function resultDetailForStep(step, fallback, prefixLines = []) {
  const guide = stageGuideHtmlForStep(step);
  if (!guide) return fallback;
  const lines = prefixLines.filter(Boolean);
  const prefix = lines.length ? `<div class="seq-result-fixed">${lines.join("<br>")}</div>` : "";
  return `${prefix}<div class="seq-result-stage-scroll">${guide}</div>`;
}

function closeExpansions(container) {
  container.querySelectorAll(".seq-expansion.open").forEach((item) => {
    item.classList.remove("open");
    item.querySelector(".seq-expansion-head")?.setAttribute("aria-expanded", "false");
  });
}

function snapshotPanel(body, panel, snapshotClass) {
  if (!body?.contains(panel)) return false;
  const snapshot = panel.cloneNode(true);
  snapshot.removeAttribute("id");
  snapshot.classList.add(snapshotClass);
  snapshot.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  snapshot.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
  snapshot.querySelector(".seq-inline-next")?.remove();
  body.replaceChildren(snapshot);
  return true;
}

function scrollExpansionIntoView(item, containerSelector, boundKey, shouldScroll = () => true) {
  const container = item.closest(containerSelector);
  if (!container) return;
  const scroll = () => {
    if (!shouldScroll()) return;
    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const top = Math.max(0, container.scrollTop + itemRect.top - containerRect.top - 3);
    container.scrollTo({ top, behavior: "smooth" });
  };
  item.querySelectorAll("img").forEach((image) => {
    if (image.complete || image.dataset[boundKey] === "true") return;
    image.dataset[boundKey] = "true";
    image.addEventListener("load", scroll, { once: true });
  });
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(scroll);
  else scroll();
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
  const activeFilter = target === simLog ? simLogFilter : seqLogFilter;
  item.classList.toggle("hidden", Boolean(activeFilter) && !item.classList.contains(activeFilter));
  target.prepend(item);
}

function setLogFilter(kind, filter) {
  const isQuiz = kind === "sim";
  const quizFilterLocked = isQuiz
    && typeof window.matchMedia === "function"
    && window.matchMedia("(max-width: 860px)").matches
    && !simLog.classList.contains("open");
  if (quizFilterLocked) return;

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
  const mobileLabel = button.querySelector(".quiz-log-mobile-label");
  if (mobileLabel) mobileLabel.textContent = opened ? "기록 숨기기" : "기록 보기";
  else button.textContent = opened ? "기록 숨기기" : "기록 보기";
  if (target === simLog && !opened) {
    simLogFilter = "";
    simCorrectFilter.classList.remove("active");
    simWrongFilter.classList.remove("active");
    applyLogFilter(simLog, "");
  }
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
  return PLAYER_KEY_BY_NAME.get(selectedSeqPlayer) || "--";
}
