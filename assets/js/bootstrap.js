// 모든 기능 파일을 불러온 뒤 이벤트를 연결하고 초기 화면을 실행합니다.
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
    document.body.classList.toggle("simulation-active", id === "simulation");
    if (id === "simulation") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.querySelector(".seq-content")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  });
});

document.getElementById("gradeBtn")?.addEventListener("click", gradeQuiz);
document.getElementById("resetBtn")?.addEventListener("click", resetQuiz);
document.getElementById("nextSimBtn").addEventListener("click", nextSimulation);
document.getElementById("resetSimBtn").addEventListener("click", resetSimulation);
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
bindCheatButtons();
if (questionRoot) renderQuiz();
nextSimulation();
renderSeqPlayerPicker();
renderCheatSheet();
