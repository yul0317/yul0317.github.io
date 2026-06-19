// 랜덤 퀴즈 상황 생성, 선택지 렌더링과 정답 처리를 담당합니다.
const QUIZ_STAGES = Object.freeze([9, 10, 11, 12, 13, 14, 15]);
const QUIZ_ROLE_ICONS = Object.freeze([
  ["탱커", "TankRole", "Tank"],
  ["힐러", "HealerRole", "Healer"],
  ["딜러", "DPSRole", "DPS"]
]);

function makeQuizScenarioState(playerOverride = "") {
  const encounter = makeEncounterState();
  const player = playerOverride || pick(PARTY_PLAYER_NAMES);
  const gc3Personal = encounter.gc3Assign[player];

  return {
    ...encounter,
    player,
    schedule: encounter.gcSchedule,
    gc1Personal: encounter.gc1Assign[player],
    gc2Personal: encounter.gc2Assign[player],
    wound: gc3Personal.wound,
    finalDebuff: gc3Personal.finalDebuff
  };
}

function quizTruthIcon(value) {
  return icon(value === "진짜" ? "진실.png" : "거짓.png", value);
}

function quizMainIcon(value) {
  if (value === "물") return icon("물.webp", "물");
  if (value === "번개") return icon("번개.webp", "번개");
  if (value === "마안") return icon("저주의 외침.webp", "저주의 외침");
  return "-";
}

function quizPersonalDebuffLine(data, truth, action = null) {
  const debuffs = [];
  if (data.main && data.main !== "없음") {
    debuffs.push(`${quizMainIcon(data.main)} (${quizTruthIcon(truth)})`);
  }
  if (action?.hasAccel) {
    debuffs.push(`${icon("가속도 폭탄.webp", "가속도 폭탄")} ${action.accelRound}회차 (${quizTruthIcon(action.accelTruth)})`);
  }
  return `내 디버프: ${debuffs.length ? debuffs.join(" / ") : "없음"}`;
}

function quizHandlingDebuffLine(debuff, truth) {
  return `처리 디버프: ${debuff} (${quizTruthIcon(truth)})`;
}

function makeFloodSim(state = makeQuizScenarioState()) {
  const woundImg = state.wound === "산자의 상처" ? "산자의 상처.webp" : "죽은자의 상처.webp";
  const finalImg = state.finalDebuff === "알라그 필드" ? "알라그 필드.webp" : "죽음 초월.webp";
  const base = floodBaseFor(state.finalDebuff);
  const answerColor = floodFinalColor(state.finalDebuff, state.flood);
  const answer = floodMarkerFor(state.wound, answerColor);
  return {
    title: "9. 무의 범람",
    time: "01:11",
    prompt: "상처 색상을 기준으로 몇 번을 맞아야 할까?",
    choices: ["1", "2"],
    answer,
    type: "image-marker",
    image: state.flood === "진짜" ? "무의범람_진짜_처리.png" : "무의범람_가짜_처리.png",
    imageAlt: `무의 범람 ${state.flood} 처리`,
    resultPrefixes: [
      `내 디버프: ${icon(woundImg, state.wound)} ${state.wound} / ${icon(finalImg, state.finalDebuff)} ${state.finalDebuff}`
    ],
    explain: `기본은 ${state.finalDebuff} = ${base}. 무의 범람이 ${state.flood}이므로 최종은 ${answerColor}, 정답 위치는 ${answer}번.`
  };
}

function makeSpreadSim(state = makeQuizScenarioState(), event = pick(["gc1Spread", "gc2Spread"])) {
  const isGc1 = event.startsWith("gc1");
  const data = isGc1 ? state.gc1Personal : state.gc2Personal;
  const truth = isGc1 ? state.gc1 : state.gc2;
  const timing = spreadTimingForEvent(state.schedule, event);
  const accelAssignment = accelAssignmentAtTiming(
    state.gc1Personal,
    state.gc2Personal,
    state.gc1,
    state.gc2,
    timing
  );
  const action = personalGrandCrossAction(data, truth, accelAssignment);
  const eventTime = state.schedule[event].time;
  const marker = spreadMarkerFor(state.player, action.spread);
  const movement = movementAnswerFor(action.accel);
  const hasBlizzard = eventTime === "01:46";
  const blizzardPattern = pick([1, 2]);
  const blizzardGroups = hasBlizzard
    ? blizzardSpreadMarkerGroups(state.player, blizzardPattern, state.blizzardMemory === "가짜", action.spread === "산개")
    : null;
  const markerAnswers = blizzardGroups ? blizzardGroups.markerAnswers : [marker];
  const answer = `${markerAnswers.join(", ")} / ${movement}`;
  const answers = movement === "움직임 상관없음"
    ? markerAnswers.flatMap((answerMarker) => [`${answerMarker} / 움직임`, `${answerMarker} / 안 움직임`, `${answerMarker} / 움직임 상관없음`])
    : markerAnswers.map((answerMarker) => `${answerMarker} / ${movement}`);
  return {
    title: `${timing} 물/번개/가속도`,
    time: eventTime,
    prompt: "부여된 디버프 기준으로 몇 번 위치에서 어떻게 처리할까?",
    answer,
    answers,
    type: "position-move",
    image: hasBlizzard ? `느린_물_번개_가속_블리자가_${state.blizzardMemory}_${blizzardPattern}.webp` : "빠른_물_번개_가속_디버프처리.webp",
    imageAlt: hasBlizzard ? `느린 물 번개 가속 블리자가 ${state.blizzardMemory} ${blizzardPattern} 처리` : "물 번개 가속도 처리",
    markerChoices: hasBlizzard ? ["1", "2", "3", "4", "5", "6", "7", "8"] : ["1", "2", "3", "4"],
    movementChoices: ["움직임", "안 움직임"],
    answerMarker: markerAnswers[0],
    answerMarkers: markerAnswers,
    answerMovement: movement === "움직임 상관없음" ? "움직임" : movement,
    anyMovement: movement === "움직임 상관없음",
    resultPrefixes: [quizPersonalDebuffLine(data, truth, action)],
    explain: hasBlizzard
      ? `물/번개는 진짜면 번개 산개, 가짜면 물 산개. ${blizzardDisplay}는 ${state.blizzardMemory}이므로 ${state.blizzardMemory === "가짜" ? "밟기" : "피하기"}: ${blizzardGroups.blizzardMarkers.join(", ")}번. ${action.spread === "산개" ? "산개 대상자" : "본대 대상자"} 위치는 ${blizzardGroups.spreadMarkers.join(", ")}번. 최종 위치는 ${markerAnswers.join(", ")}번. ${accelAssignment ? `가속도는 ${accelAssignment.round}회차 ${accelAssignment.truth} 판정으로 ${movement}.` : "이 시간에 처리할 가속도는 없음."}`
      : `물/번개는 진짜면 번개 산개, 가짜면 물 산개. ${state.player} 기준 최종 위치는 ${marker}번. ${accelAssignment ? `가속도는 ${accelAssignment.round}회차 ${accelAssignment.truth} 판정으로 ${movement}.` : "이 시간에 처리할 가속도는 없음."}`
  };
}

function makeGazeSim(state = makeQuizScenarioState(), event = pick(["gc1Gaze", "gc2Gaze"])) {
  const isGc1 = event.startsWith("gc1");
  const data = isGc1 ? state.gc1Personal : state.gc2Personal;
  const truth = isGc1 ? state.gc1 : state.gc2;
  const action = personalGrandCrossAction(data, truth);
  const shouldSoakThunder = state.thunderMemory === "가짜";
  const thunderPattern = pick([1, 2]);
  const markerGroups = thunderGazeMarkerGroups(state.player, thunderPattern, shouldSoakThunder, action.hasGaze);
  const markerAnswers = markerGroups.markerAnswers;
  const gazeAnswer = gazeTextAnswer(truth);
  const answers = markerAnswers.map((marker) => `${marker} / ${gazeAnswer}`);
  const answer = answers.join(" 또는 ");
  return {
    title: `저주의 외침 + ${thunderDisplay}`,
    time: state.schedule[event].time,
    prompt: `${thunderDisplay}와 마안 기준으로 몇 번 위치에서 어떻게 처리해야 할까?`,
    answer,
    answers,
    type: "thunder-gaze",
    image: `선더가_${state.thunderMemory}_${thunderPattern}.webp`,
    imageAlt: `선더가 ${state.thunderMemory} ${thunderPattern} 처리`,
    markerAnswers,
    gazeAnswer,
    resultPrefixes: [quizHandlingDebuffLine(icon("저주의 외침.webp", "저주의 외침"), truth)],
    explain: `${thunderDisplay}는 ${state.thunderMemory}이므로 ${shouldSoakThunder ? "밟기" : "피하기"}: ${markerGroups.thunderMarkers.join(", ")}번. 마안 ${action.hasGaze ? "대상자" : "비대상자"} 위치: ${markerGroups.gazeMarkers.join(", ")}번. 마안은 ${truth}이므로 ${gazeAnswer}. 정답 위치는 ${markerAnswers.join(", ")}번.`
  };
}

function makeChaosSim(state = makeQuizScenarioState(), chaos = pick(["혼돈의 불", "혼돈의 물"])) {
  const truth = chaos === "혼돈의 불" ? state.fireTruth : state.waterTruth;
  const answer = chaosAnswerFor(chaos, truth);
  const fireMarkerAnswer = answer === "안" ? "1" : "2";
  return {
    title: chaos,
    time: chaos === "혼돈의 불" ? "01:41" : "02:04",
    prompt: "히트박스 기준 어디서 피해야 할까?",
    choices: chaos === "혼돈의 불" ? ["1", "2"] : ["안", "밖"],
    answer: chaos === "혼돈의 불" ? fireMarkerAnswer : answer,
    type: chaos === "혼돈의 불" ? "image-marker" : "text",
    image: "혼돈의_불.webp",
    imageAlt: "혼돈의 불 처리",
    resultPrefixes: [quizHandlingDebuffLine(icon(chaos === "혼돈의 불" ? "혼돈의 불.webp" : "혼돈의 물.webp", chaos), truth)],
    explain: chaos === "혼돈의 불"
      ? `혼돈의 불은 진짜면 히트박스 밖, 가짜면 안쪽입니다. 1번은 안쪽, 2번은 히트박스 밖이므로 정답은 ${fireMarkerAnswer}번.`
      : "혼돈의 물은 진짜 안, 가짜 밖."
  };
}

function makeReleaseSim(state = makeQuizScenarioState()) {
  const line = releasePatternAnswer(state.thunderMemory, state.releaseTop);
  const cone = releasePatternAnswer(state.blizzardMemory, state.releaseBottom);
  const water = chaosAnswerFor("혼돈의 물", state.waterTruth);
  const thunder = line === "피하기" ? "피함" : "밟음";
  const blizzard = cone === "피하기" ? "피함" : "밟음";
  const pattern = pick([1, 2, 3, 4, 5, 6, 7, 8]);
  return {
    title: "15. 마력 방출 + 혼돈의 물",
    time: "02:00 / 02:04",
    prompt: "마력 방출과 혼돈의 물을 어떻게 처리해야 할까?",
    type: "release-water",
    image: `마력방출_혼돈의_물_${pattern}.webp`,
    imageAlt: "마력 방출과 혼돈의 물 처리",
    overlay: `마력방출_${releaseTruthFileName(state.releaseTop)}_${releaseTruthFileName(state.releaseBottom)}.png`,
    thunderMemory: state.thunderMemory,
    blizzardMemory: state.blizzardMemory,
    correctWater: water,
    correctThunder: thunder,
    correctBlizzard: blizzard,
    answer: `히트박스 ${water} / ${thunderDisplay} ${thunder} / ${blizzardDisplay} ${blizzard}`,
    resultPrefixes: [quizHandlingDebuffLine(icon("혼돈의 물.webp", "혼돈의 물"), state.waterTruth)],
    explain: `${thunderDisplay}와 위 고리가 같으면 피하고 다르면 밟는다. ${blizzardDisplay}와 밑 고리도 같은 방식으로 처리한다. 혼돈의 물은 진짜면 안, 가짜면 밖이다.`
  };
}

function quizEventAtStep(state, step) {
  return Object.entries(state.schedule).find(([, event]) => event.step === step)?.[0] || "";
}

function makeSlowGazeSim(state) {
  const data = state.gc2Personal;
  const truth = state.gc2;
  const action = personalGrandCrossAction(data, truth);
  const markerAnswer = slowGazeMarkerFor(state.player, action.hasGaze);
  const gazeAnswer = gazeShortAnswer(truth);

  return {
    title: "14. 느린 마안",
    time: "01:54",
    prompt: "몇 번 위치에서 마안을 어떻게 처리해야 할까?",
    answer: `${markerAnswer} / ${gazeAnswer}`,
    answers: [`${markerAnswer} / ${gazeAnswer}`],
    type: "thunder-gaze",
    image: "느린_마안.webp",
    imageAlt: "느린 마안 처리 위치",
    markerChoices: ["1", "2", "3", "4"],
    markerLabel: "어디로 가야 하나요?",
    gazeChoices: ["본다", "안본다"],
    gazeLabel: "마안을?",
    markerAnswers: [markerAnswer],
    gazeAnswer,
    resultPrefixes: [quizHandlingDebuffLine(icon("저주의 외침.webp", "저주의 외침"), truth)],
    explain: `${isSupportPlayer(state.player) ? "탱커/힐러" : "딜러"} ${action.hasGaze ? "마안 대상자" : "마안 비대상자"} 위치는 ${markerAnswer}번. ${truth} 마안이므로 ${gazeAnswer}.`
  };
}

function makeStageQuiz(state, stage) {
  if (stage === 9) return makeFloodSim(state);
  if (stage === 10) {
    const event = quizEventAtStep(state, 10);
    const quiz = makeSpreadSim(state, event);
    quiz.title = `10. ${quiz.title}`;
    return quiz;
  }
  if (stage === 11) {
    const event = quizEventAtStep(state, 11);
    const quiz = makeGazeSim(state, event);
    quiz.title = `11. 빠른 마안 + ${thunderDisplay}`;
    quiz.time = "01:28~01:30";
    return quiz;
  }
  if (stage === 12) {
    const quiz = makeChaosSim(state, "혼돈의 불");
    quiz.title = "12. 혼돈의 불";
    return quiz;
  }
  if (stage === 13) {
    const event = quizEventAtStep(state, 13);
    const quiz = makeSpreadSim(state, event);
    quiz.title = `13. ${quiz.title} + ${blizzardDisplay}`;
    return quiz;
  }
  if (stage === 14) return makeSlowGazeSim(state);
  return makeReleaseSim(state);
}

function quizSeconds(time) {
  const [minutes, seconds] = time.split(":").map(Number);
  return (minutes * 60) + seconds;
}

function quizRemainText(grantedAt, resolveAt) {
  const seconds = quizSeconds(resolveAt) - quizSeconds(grantedAt);
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m${seconds % 60 || ""}` : `${seconds}s`;
}

function quizDebuffEntry(image, alt, grantedAt, resolveAt) {
  return `
    <span class="quiz-debuff-entry" title="${alt} · ${resolveAt} 처리">
      ${icon(image, alt)}
      <small>${quizRemainText(grantedAt, resolveAt)}</small>
    </span>
  `;
}

function quizGrandCrossEntries(state, round, player) {
  const assignment = round === 1 ? state.gc1Assign[player] : state.gc2Assign[player];
  const truth = round === 1 ? state.gc1 : state.gc2;
  const grantedAt = round === 1 ? "00:29" : "00:44";
  const entries = [];

  if (assignment.main === "물" || assignment.main === "번개") {
    const event = state.schedule[`gc${round}Spread`];
    entries.push(quizDebuffEntry(
      assignment.main === "물" ? "물.webp" : "번개.webp",
      assignment.main,
      grantedAt,
      event.time
    ));
  }
  if (assignment.main === "마안") {
    const event = state.schedule[`gc${round}Gaze`];
    entries.push(quizDebuffEntry("저주의 외침.webp", "저주의 외침", grantedAt, event.time));
  }
  if (assignment.accel) {
    const event = ACCEL_TIMING_EVENTS[assignment.accelTiming];
    entries.push(quizDebuffEntry("가속도 폭탄.webp", "가속도 폭탄", grantedAt, event.time));
  }

  return entries;
}

function quizChaosEntries(state, round) {
  const type = round === 1 ? state.chaosFirst : state.chaosSecond;
  const truth = round === 1 ? state.chaos1Truth : state.chaos2Truth;
  const grantedAt = round === 1 ? "00:35" : "00:49";
  const resolveAt = type === "혼돈의 불" ? "01:41" : "02:04";
  return [quizDebuffEntry(
    type === "혼돈의 불" ? "혼돈의 불.webp" : "혼돈의 물.webp",
    type,
    grantedAt,
    resolveAt
  )];
}

function quizThirdGrandCrossEntries(state, player) {
  const assignment = state.gc3Assign[player];
  return [
    quizDebuffEntry(
      assignment.wound === "산자의 상처" ? "산자의 상처.webp" : "죽은자의 상처.webp",
      assignment.wound,
      "00:59",
      "01:11"
    ),
    quizDebuffEntry(
      assignment.finalDebuff === "알라그 필드" ? "알라그 필드.webp" : "죽음 초월.webp",
      assignment.finalDebuff,
      "00:59",
      "01:11"
    )
  ];
}

function renderQuizDebuffGrid(state) {
  [state.gc1, state.chaos1Truth, state.gc2, state.chaos2Truth, state.gc3].forEach((truth, index) => {
    const verdict = document.querySelector(`.quiz-debuff-verdict[data-round="${index + 1}"]`);
    if (verdict) verdict.innerHTML = quizTruthIcon(truth);
  });

  seqPlayers.forEach((player) => {
    const rounds = [
      quizGrandCrossEntries(state, 1, player.name),
      quizChaosEntries(state, 1),
      quizGrandCrossEntries(state, 2, player.name),
      quizChaosEntries(state, 2),
      quizThirdGrandCrossEntries(state, player.name)
    ];

    rounds.forEach((entries, index) => {
      const cell = document.querySelector(`.quiz-debuff-cell[data-player="${player.key}"][data-round="${index + 1}"]`);
      if (!cell) return;
      cell.innerHTML = entries.length ? entries.join("") : `<span class="quiz-debuff-empty">-</span>`;
      cell.classList.toggle("selected-player", player.name === state.player);
    });
  });
}

function closeQuizQuestions() {
  quizAccordion.querySelectorAll(".seq-expansion").forEach((item) => {
    item.classList.remove("open");
    item.querySelector(".seq-expansion-head")?.setAttribute("aria-expanded", "false");
  });
}

function scrollQuizQuestionIntoView(item) {
  const container = item.closest(".quiz-question-scroll");
  if (!container) return;
  const scroll = () => {
    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const top = Math.max(0, container.scrollTop + itemRect.top - containerRect.top - 3);
    container.scrollTo({ top, behavior: "smooth" });
  };
  item.querySelectorAll("img").forEach((image) => {
    if (image.complete || image.dataset.quizScrollBound === "true") return;
    image.dataset.quizScrollBound = "true";
    image.addEventListener("load", scroll, { once: true });
  });
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(scroll);
  else scroll();
}

function openQuizQuestion(index) {
  const record = quizQuestions[index];
  const item = quizAccordion.querySelector(`.seq-expansion[data-quiz-index="${index}"]`);
  if (!record || !item) return;
  closeQuizQuestions();
  item.classList.add("open");
  item.querySelector(".seq-expansion-head")?.setAttribute("aria-expanded", "true");
  renderQuizDebuffGrid(record.state);
  scrollQuizQuestionIntoView(item);
}

function snapshotCurrentQuizQuestion() {
  if (currentQuizIndex < 0) return;
  const item = quizAccordion.querySelector(`.seq-expansion[data-quiz-index="${currentQuizIndex}"]`);
  const body = item?.querySelector(".seq-expansion-body");
  if (!body?.contains(quizActivePanel)) return;
  const snapshot = quizActivePanel.cloneNode(true);
  snapshot.removeAttribute("id");
  snapshot.classList.add("quiz-question-snapshot");
  snapshot.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  snapshot.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
  snapshot.querySelector(".seq-inline-next")?.remove();
  body.innerHTML = "";
  body.appendChild(snapshot);
}

function appendQuizQuestion(record) {
  const index = quizQuestions.length;
  const item = document.createElement("section");
  item.className = "seq-expansion";
  item.dataset.quizIndex = String(index);
  item.innerHTML = `
    <button class="seq-expansion-head" type="button" aria-expanded="false">
      <span class="seq-expansion-chevron">›</span>
      <span class="seq-expansion-title">${record.sim.title}</span>
      <span class="seq-expansion-state">${record.sim.time}</span>
    </button>
    <div class="seq-expansion-body"></div>
  `;
  item.querySelector(".seq-expansion-head")?.addEventListener("click", () => {
    const wasOpen = item.classList.contains("open");
    closeQuizQuestions();
    if (!wasOpen) openQuizQuestion(index);
  });
  quizAccordion.appendChild(item);
  item.querySelector(".seq-expansion-body")?.appendChild(quizActivePanel);
  quizQuestions.push(record);
  currentQuizIndex = index;
  return item;
}

function updateCurrentQuizQuestionState() {
  const item = quizAccordion.querySelector(`.seq-expansion[data-quiz-index="${currentQuizIndex}"]`);
  if (!item) return;
  item.classList.toggle("done", Boolean(quizQuestions[currentQuizIndex]?.answered));
  const state = item.querySelector(".seq-expansion-state");
  if (state) state.textContent = quizQuestions[currentQuizIndex]?.answered ? "완료" : currentQuiz.time;
}

function nextQuizQuestion() {
  if (currentQuizIndex >= 0) snapshotCurrentQuizQuestion();
  currentQuizState = makeQuizScenarioState(selectedQuizPlayer);
  const stage = pick(QUIZ_STAGES);
  currentQuiz = makeStageQuiz(currentQuizState, stage);
  const item = appendQuizQuestion({
    state: currentQuizState,
    sim: currentQuiz,
    answered: false
  });
  renderQuizDebuffGrid(currentQuizState);
  simPrompt.textContent = currentQuiz.prompt;
  clearResultState(simResult, "선택지를 고르면 판정이 표시됩니다.");
  quizNextBtn.disabled = true;
  quizNextBtn.textContent = "다음 문제";
  renderQuizChoices();
  openQuizQuestion(currentQuizIndex);
  scrollQuizQuestionIntoView(item);
}

function bindQuizPlayerPicker() {
  const picker = document.getElementById("quizPlayerPicker");
  const toggle = document.getElementById("quizRoleToggle");
  if (!picker || !toggle) return;
  const buttons = [...picker.querySelectorAll("button[data-player]")];

  const roleForPlayer = (player) => {
    const role = QUIZ_ROLE_ICONS.find(([prefix]) => player.startsWith(prefix));
    return role ? role.slice(1) : null;
  };

  const update = () => {
    buttons.forEach((button) => {
      const active = button.dataset.player === selectedQuizPlayer;
      button.classList.toggle("active", active);
      button.disabled = Boolean(selectedQuizPlayer) && !active;
      button.setAttribute("aria-pressed", String(active));
    });
    const role = roleForPlayer(selectedQuizPlayer);
    toggle.innerHTML = role ? jobIcon(role[0], role[1]) : "-";
  };

  toggle.addEventListener("click", () => {
    const opened = picker.hidden;
    picker.hidden = !opened;
    toggle.setAttribute("aria-expanded", String(opened));
    toggle.setAttribute("aria-label", opened ? "직업 선택 닫기" : "직업 선택 열기");
  });

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedQuizPlayer = selectedQuizPlayer === button.dataset.player
        ? ""
        : button.dataset.player;
      update();
      resetQuiz();
    });
  });

  update();
}

function finishQuizAnswer(selected, correct) {
  simStats.total += 1;
  if (correct) simStats.correct += 1;
  updateSimStats();
  simScoreText.textContent = correct ? "좋아요. 다음 상황으로 넘어가도 됩니다." : "틀린 판정을 바로 다시 보면 좋아요.";
  const step = Number.parseInt(currentQuiz.title, 10);
  setResultState(
    simResult,
    correct,
    resultDetailForStep(
      step,
      currentQuiz.explain,
      currentQuiz.resultPrefixes || []
    )
  );
  addResultLog(simLog, `${currentQuiz.time} ${currentQuiz.title}`, selected, currentQuiz.answer, correct);
  const record = quizQuestions[currentQuizIndex];
  if (record) record.answered = true;
  quizNextBtn.disabled = false;
  updateCurrentQuizQuestionState();
}

function quizChoiceButtons(selector = ".sim-choice") {
  return [...simChoices.querySelectorAll(selector)];
}

function bindQuizChoices(handler) {
  quizChoiceButtons().forEach((button) => {
    button.addEventListener("click", () => handler(button));
  });
}

function selectQuizPartChoice(button) {
  const part = button.dataset.part;
  quizChoiceButtons(`.sim-choice[data-part="${part}"]`).forEach((choice) => {
    choice.classList.toggle("selected", choice === button);
  });
  return part;
}

function gradeQuizPartChoices(isCorrectChoice) {
  quizChoiceButtons().forEach((choice) => {
    choice.disabled = true;
    if (isCorrectChoice(choice)) choice.classList.add("correct");
  });
  quizChoiceButtons(".sim-choice.selected").forEach((choice) => {
    if (!isCorrectChoice(choice)) choice.classList.add("wrong");
  });
}

function bindQuizPartAnswer(config) {
  const selected = {};
  bindQuizChoices((button) => {
    const part = selectQuizPartChoice(button);
    selected[part] = button.dataset.answer;
    if (!config.parts.every((key) => selected[key])) return;

    const correct = config.isCorrect(selected);
    gradeQuizPartChoices(config.isCorrectChoice);
    finishQuizAnswer(config.selectedText(selected), correct);
  });
}

function renderQuizChoices() {
  if (currentQuiz.type === "release-water") {
    simChoices.innerHTML = `
      <div class="sim-choice-guide release-water-image">
        <img loading="eager" decoding="sync" src="img/simul/${currentQuiz.image}" alt="${currentQuiz.imageAlt}">
        <img loading="eager" decoding="sync" class="release-water-center" src="img/simul/${currentQuiz.overlay}" alt="마력 방출 판정">
      </div>
      <div class="seq-choice-controls">
        <div class="quiz-memory-row">
          <span class="quiz-memory-item">저장</span>
          <span class="quiz-memory-item">${thunderDisplay} ${quizTruthIcon(currentQuiz.thunderMemory)}</span>
          <span class="quiz-memory-divider">|</span>
          <span class="quiz-memory-item">${blizzardDisplay} ${quizTruthIcon(currentQuiz.blizzardMemory)}</span>
        </div>
        <div class="release-choice-row">
          <div class="sim-choice-label release-choice-label">히트박스?</div>
          <button type="button" class="sim-choice" data-part="water" data-answer="안">안</button>
          <button type="button" class="sim-choice" data-part="water" data-answer="밖">밖</button>
        </div>
        <div class="release-choice-row">
          <div class="sim-choice-label release-choice-label">${thunderDisplay}?</div>
          <button type="button" class="sim-choice" data-part="thunder" data-answer="피함">피함</button>
          <button type="button" class="sim-choice" data-part="thunder" data-answer="밟음">밟음</button>
        </div>
        <div class="release-choice-row">
          <div class="sim-choice-label release-choice-label">${blizzardDisplay}?</div>
          <button type="button" class="sim-choice" data-part="blizzard" data-answer="피함">피함</button>
          <button type="button" class="sim-choice" data-part="blizzard" data-answer="밟음">밟음</button>
        </div>
      </div>
    `;
    const answers = {
      water: currentQuiz.correctWater,
      thunder: currentQuiz.correctThunder,
      blizzard: currentQuiz.correctBlizzard
    };
    bindQuizPartAnswer({
      parts: Object.keys(answers),
      isCorrect: (selected) => Object.entries(answers).every(([part, answer]) => selected[part] === answer),
      isCorrectChoice: (choice) => answers[choice.dataset.part] === choice.dataset.answer,
      selectedText: (selected) =>
        `히트박스 ${selected.water} / ${thunderDisplay} ${selected.thunder} / ${blizzardDisplay} ${selected.blizzard}`
    });
    return;
  }

  if (currentQuiz.type === "image-marker") {
    simChoices.innerHTML = `
      <div class="sim-choice-guide">
        <img loading="eager" decoding="sync" src="img/simul/${currentQuiz.image}" alt="${currentQuiz.imageAlt || ""}">
      </div>
      <div class="seq-choice-controls">
      <div class="sim-choice-group">
        <div class="sim-choice-label">어디로 갈까요?</div>
        ${currentQuiz.choices.map((choice) => `<button class="sim-choice" type="button" data-answer="${choice}">${choice}번</button>`).join("")}
      </div>
      </div>
    `;
    bindQuizChoices(answerQuizChoice);
    return;
  }

  if (currentQuiz.type === "position-move") {
    const answerMarkers = currentQuiz.answerMarkers || [currentQuiz.answerMarker];
    simChoices.innerHTML = `
      <div class="sim-choice-guide">
        <img loading="eager" decoding="sync" src="img/simul/${currentQuiz.image}" alt="${currentQuiz.imageAlt || ""}">
      </div>
      <div class="seq-choice-controls">
      <div class="sim-choice-board">
        <div class="sim-choice-group" data-group="marker">
          <div class="sim-choice-label">어디로 갈까요?</div>
          ${currentQuiz.markerChoices.map((choice) => `<button class="sim-choice" type="button" data-part="marker" data-answer="${choice}">${choice}</button>`).join("")}
        </div>
        <div class="sim-choice-group" data-group="movement">
          <div class="sim-choice-label">해당 위치에서?</div>
          ${currentQuiz.movementChoices.map((choice) => `<button class="sim-choice" type="button" data-part="movement" data-answer="${choice}">${choice}</button>`).join("")}
        </div>
      </div>
      </div>
    `;
    const isCorrectChoice = (choice) =>
      (choice.dataset.part === "marker" && answerMarkers.includes(choice.dataset.answer)) ||
      (choice.dataset.part === "movement" && (currentQuiz.anyMovement || choice.dataset.answer === currentQuiz.answerMovement));
    bindQuizPartAnswer({
      parts: ["marker", "movement"],
      isCorrect: (selected) =>
        answerMarkers.includes(selected.marker) &&
        (currentQuiz.anyMovement || selected.movement === currentQuiz.answerMovement),
      isCorrectChoice,
      selectedText: (selected) => `${selected.marker} / ${selected.movement}`
    });
    return;
  }

  if (currentQuiz.type === "thunder-gaze") {
    const markerChoices = currentQuiz.markerChoices || ["1", "2", "3", "4", "5", "6", "7", "8"];
    const gazeChoices = currentQuiz.gazeChoices || ["마안 본다", "마안 안본다"];
    simChoices.innerHTML = `
      <div class="sim-choice-guide">
        <img loading="eager" decoding="sync" src="img/simul/${currentQuiz.image}" alt="${currentQuiz.imageAlt || ""}">
      </div>
      <div class="seq-choice-controls">
      <div class="sim-choice-board">
        <div class="sim-choice-group">
          <div class="sim-choice-label">${currentQuiz.markerLabel || "어디로 갈까요?"}</div>
          ${markerChoices.map((choice) => `<button class="sim-choice" type="button" data-part="marker" data-answer="${choice}">${choice}</button>`).join("")}
        </div>
        <div class="sim-choice-group">
          <div class="sim-choice-label">${currentQuiz.gazeLabel || "마안을 어떻게 할까요?"}</div>
          ${gazeChoices.map((choice) => `<button class="sim-choice" type="button" data-part="gaze" data-answer="${choice}">${choice}</button>`).join("")}
        </div>
      </div>
      </div>
    `;
    const isCorrectChoice = (choice) =>
      (choice.dataset.part === "marker" && currentQuiz.markerAnswers.includes(choice.dataset.answer)) ||
      (choice.dataset.part === "gaze" && choice.dataset.answer === currentQuiz.gazeAnswer);
    bindQuizPartAnswer({
      parts: ["marker", "gaze"],
      isCorrect: (selected) =>
        currentQuiz.markerAnswers.includes(selected.marker) &&
        selected.gaze === currentQuiz.gazeAnswer,
      isCorrectChoice,
      selectedText: (selected) => `${selected.marker} / ${selected.gaze}`
    });
    return;
  }

  simChoices.innerHTML = `
    <div class="seq-choice-controls seq-choice-list">
      <div class="sim-choice-label">어떻게 처리할까요?</div>
      ${currentQuiz.choices.map((choice) => (
        `<button class="sim-choice" type="button" data-answer="${choice}">${choice}</button>`
      )).join("")}
    </div>
  `;
  bindQuizChoices(answerQuizChoice);
}

function answerQuizChoice(button) {
  if (!currentQuiz || button.disabled) return;
  const selected = button.dataset.answer;
  const answers = currentQuiz.answers || [currentQuiz.answer];
  const correct = answers.includes(selected);

  quizChoiceButtons().forEach((choice) => {
    choice.disabled = true;
    if (answers.includes(choice.dataset.answer)) choice.classList.add("correct");
  });
  if (!correct) button.classList.add("wrong");
  finishQuizAnswer(selected, correct);
}

function resetQuiz() {
  simStats = { correct: 0, total: 0 };
  simLogFilter = "";
  simCorrectFilter.classList.remove("active");
  simWrongFilter.classList.remove("active");
  updateSimStats();
  simScoreText.textContent = "랜덤 상황을 빠르게 판단해 보세요.";
  simLog.innerHTML = "";
  simLog.classList.remove("open");
  simLog.closest(".quiz-history")?.classList.remove("log-open");
  simLogToggle.textContent = "기록 보기";
  quizQuestions = [];
  currentQuizIndex = -1;
  currentQuiz = null;
  currentQuizState = null;
  quizAccordion.innerHTML = "";
  nextQuizQuestion();
}
