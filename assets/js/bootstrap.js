// 모든 기능 파일을 불러온 뒤 이벤트를 연결하고 초기 화면을 실행합니다.
const initializedPanels = new Set(["guide"]);

function initializePanel(id) {
  if (initializedPanels.has(id)) return;
  if (id === "quiz") {
    bindQuizPlayerPicker();
    resetQuiz();
  } else if (id === "simulation") {
    renderSeqPlayerPicker();
  } else if (id === "cheatsheet") {
    bindCheatButtons();
    bindCheatPager();
    renderCheatSheet();
  }
  initializedPanels.add(id);
}

seqChoices.addEventListener("click", (event) => {
  if (!seqChoiceHandler) return;
  const button = event.target.closest(".sim-choice");
  if (!button || !seqChoices.contains(button) || button.disabled) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  seqChoiceHandler(button);
}, true);

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const id = tab.dataset.tab;
    tabs.forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
    panels.forEach((panel) => panel.classList.toggle("active", panel.id === id));
    document.body.classList.toggle("quiz-active", id === "quiz");
    document.body.classList.toggle("simulation-active", id === "simulation");
    document.body.classList.toggle("cheatsheet-active", id === "cheatsheet");
    initializePanel(id);
    if (id === "simulation") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.querySelector(".seq-content")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  });
});

document.getElementById("resetSimBtn").addEventListener("click", resetQuiz);
quizNextBtn.addEventListener("click", nextQuizQuestion);
simCorrectFilter.addEventListener("click", () => setLogFilter("sim", "correct"));
simWrongFilter.addEventListener("click", () => setLogFilter("sim", "wrong"));
seqCorrectFilter.addEventListener("click", () => setLogFilter("seq", "correct"));
seqWrongFilter.addEventListener("click", () => setLogFilter("seq", "wrong"));
simLogToggle.addEventListener("click", () => toggleLog(simLog, simLogToggle));
seqLogToggle.addEventListener("click", () => toggleLog(seqLog, seqLogToggle));
seqNextBtn.addEventListener("click", () => {
  if (!seq || seq.step >= 16) initSequential();
  else advanceSequential();
});
seqInlineNextBtn.addEventListener("click", () => {
  if (!seq || seq.step >= 16) initSequential();
  else advanceSequential();
});
new MutationObserver(syncSeqInlineNext).observe(seqNextBtn, {
  attributes: true,
  childList: true,
  subtree: true
});
document.getElementById("seqResetBtn").addEventListener("click", renderSeqPlayerPicker);
