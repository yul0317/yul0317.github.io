// 랜덤 퀴즈 상황 생성, 선택지 렌더링과 정답 처리를 담당합니다.
function makeQuizScenarioState() {
  const encounter = makeEncounterState();
  const player = pick(PARTY_PLAYER_NAMES);
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

function makeFloodSim() {
  const state = makeQuizScenarioState();
  const woundImg = state.wound === "산자의 상처" ? "산자의 상처.webp" : "죽은자의 상처.webp";
  const finalImg = state.finalDebuff === "알라그 필드" ? "알라그 필드.webp" : "죽음 초월.webp";
  const base = floodBaseFor(state.finalDebuff);
  const answerColor = floodFinalColor(state.finalDebuff, state.flood);
  const answer = floodMarkerFor(state.wound, answerColor);
  return {
    title: "9. 무의 범람",
    time: "01:11",
    prompt: "상처 색상을 기준으로 몇 번을 맞아야 할까?",
    facts: [
      fact("상처", `${icon(woundImg, state.wound)} ${state.wound}`),
      fact("디버프", `${icon(finalImg, state.finalDebuff)} ${state.finalDebuff}`),
      fact("무의 범람", `${quizTruthIcon(state.flood)} ${state.flood}`)
    ],
    choices: ["1", "2"],
    answer,
    type: "image-marker",
    image: state.flood === "진짜" ? "무의범람_진짜_처리.png" : "무의범람_가짜_처리.png",
    imageAlt: `무의 범람 ${state.flood} 처리`,
    explain: `기본은 ${state.finalDebuff} = ${base}. 무의 범람이 ${state.flood}이므로 최종은 ${answerColor}, 정답 위치는 ${answer}번.`
  };
}

function makeSpreadSim() {
  const state = makeQuizScenarioState();
  const event = pick(["gc1Spread", "gc2Spread"]);
  const isGc1 = event.startsWith("gc1");
  const data = isGc1 ? state.gc1Personal : state.gc2Personal;
  const truth = isGc1 ? state.gc1 : state.gc2;
  const action = personalGrandCrossAction(data, truth);
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
    title: `${hasBlizzard ? "느린" : "빠른"} 물/번개/가속도`,
    time: eventTime,
    prompt: "부여된 디버프 기준으로 몇 번 위치에서 어떻게 처리할까?",
    facts: [
      fact("플레이어", state.player),
      fact("판정", `${quizTruthIcon(truth)} ${truth}`),
      fact("디버프", `${quizMainIcon(data.main)} ${data.accel ? icon("가속도 폭탄.webp", "가속도 폭탄") : ""}`)
    ],
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
    explain: hasBlizzard
      ? `물/번개는 진짜면 번개 산개, 가짜면 물 산개. ${blizzardDisplay}는 ${state.blizzardMemory}이므로 ${state.blizzardMemory === "가짜" ? "밟기" : "피하기"}: ${blizzardGroups.blizzardMarkers.join(", ")}번. ${action.spread === "산개" ? "산개 대상자" : "본대 대상자"} 위치는 ${blizzardGroups.spreadMarkers.join(", ")}번. 최종 위치는 ${markerAnswers.join(", ")}번. 가속도 처리는 ${movement}.`
      : `물/번개는 진짜면 번개 산개, 가짜면 물 산개. ${state.player} 기준 최종 위치는 ${marker}번. 가속도 처리는 ${movement}.`
  };
}

function makeGazeSim() {
  const state = makeQuizScenarioState();
  const event = pick(["gc1Gaze", "gc2Gaze"]);
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
    facts: [
      fact("플레이어", state.player),
      fact("마안", action.hasGaze ? `${icon("저주의 외침.webp", "저주의 외침")} 대상자` : "대상 아님"),
      fact("그랜드 크로스", `${quizTruthIcon(truth)} ${truth}`),
      fact(`${thunderDisplay} 기억`, `${quizTruthIcon(state.thunderMemory)} ${state.thunderMemory}`)
    ],
    answer,
    answers,
    type: "thunder-gaze",
    image: `선더가_${state.thunderMemory}_${thunderPattern}.webp`,
    imageAlt: `선더가 ${state.thunderMemory} ${thunderPattern} 처리`,
    markerAnswers,
    gazeAnswer,
    explain: `${thunderDisplay}는 ${state.thunderMemory}이므로 ${shouldSoakThunder ? "밟기" : "피하기"}: ${markerGroups.thunderMarkers.join(", ")}번. 마안 ${action.hasGaze ? "대상자" : "비대상자"} 위치: ${markerGroups.gazeMarkers.join(", ")}번. 마안은 ${truth}이므로 ${gazeAnswer}. 정답 위치는 ${markerAnswers.join(", ")}번.`
  };
}

function makeChaosSim() {
  const state = makeQuizScenarioState();
  const chaos = pick(["혼돈의 불", "혼돈의 물"]);
  const truth = chaos === "혼돈의 불" ? state.fireTruth : state.waterTruth;
  const answer = chaosAnswerFor(chaos, truth);
  const fireMarkerAnswer = answer === "안" ? "1" : "2";
  return {
    title: chaos,
    time: chaos === "혼돈의 불" ? "01:41" : "02:04",
    prompt: "히트박스 기준 어디서 피해야 할까?",
    facts: [
      fact("디버프", `${icon(chaos === "혼돈의 불" ? "혼돈의 불.webp" : "혼돈의 물.webp", chaos)} ${chaos}`),
      fact("판정", `${quizTruthIcon(truth)} ${truth}`)
    ],
    choices: chaos === "혼돈의 불" ? ["1", "2"] : ["안", "밖"],
    answer: chaos === "혼돈의 불" ? fireMarkerAnswer : answer,
    type: chaos === "혼돈의 불" ? "image-marker" : "text",
    image: "혼돈의_불.webp",
    imageAlt: "혼돈의 불 처리",
    explain: chaos === "혼돈의 불"
      ? `혼돈의 불은 진짜면 히트박스 밖, 가짜면 안쪽입니다. 1번은 안쪽, 2번은 히트박스 밖이므로 정답은 ${fireMarkerAnswer}번.`
      : "혼돈의 물은 진짜 안, 가짜 밖."
  };
}

function makeReleaseSim() {
  const state = makeQuizScenarioState();
  const line = releasePatternAnswer(state.thunderMemory, state.releaseTop);
  const cone = releasePatternAnswer(state.blizzardMemory, state.releaseBottom);
  return {
    title: "15. 마력 방출",
    time: "02:00",
    prompt: "직선과 부채꼴을 어떻게 처리해야 할까?",
    facts: [
      fact(`저장 ${thunderDisplay}`, `${quizTruthIcon(state.thunderMemory)} ${state.thunderMemory}`),
      fact(`저장 ${blizzardDisplay}`, `${quizTruthIcon(state.blizzardMemory)} ${state.blizzardMemory}`),
      fact("방출 위", `${quizTruthIcon(state.releaseTop)} ${state.releaseTop}`),
      fact("방출 밑", `${quizTruthIcon(state.releaseBottom)} ${state.releaseBottom}`)
    ],
    choices: [
      "직선 피하기 / 부채꼴 피하기",
      "직선 피하기 / 부채꼴 밟기",
      "직선 밟기 / 부채꼴 피하기",
      "직선 밟기 / 부채꼴 밟기"
    ],
    answer: `직선 ${line} / 부채꼴 ${cone}`,
    explain: `${thunderDisplay}는 저장과 위 고리가 같으면 피하기, 다르면 밟기. ${blizzardDisplay}는 저장과 밑 고리가 같으면 피하기, 다르면 밟기.`
  };
}

function nextSimulation() {
  const makers = [makeFloodSim, makeSpreadSim, makeGazeSim, makeChaosSim, makeReleaseSim];
  currentSim = pick(makers)();
  simTitle.textContent = currentSim.title;
  simTime.textContent = currentSim.time;
  simPrompt.textContent = currentSim.prompt;
  simFacts.innerHTML = currentSim.facts.join("");
  clearResultState(simResult, "선택지를 고르면 판정이 표시됩니다.");
  renderSimulationChoices();
}

function finishSimulationAnswer(selected, correct) {
  simStats.total += 1;
  if (correct) simStats.correct += 1;
  updateSimStats();
  simScoreText.textContent = correct ? "좋아요. 다음 상황으로 넘어가도 됩니다." : "틀린 판정을 바로 다시 보면 좋아요.";
  setResultState(
    simResult,
    correct,
    `정답: ${currentSim.answer}.<br>${currentSim.explain}`
  );
  addResultLog(simLog, `${currentSim.time} ${currentSim.title}`, selected, currentSim.answer, correct);
}

function renderSimulationChoices() {
  if (currentSim.type === "image-marker") {
    simChoices.innerHTML = `
      <div class="sim-choice-guide">
        <img loading="lazy" decoding="async" src="img/simul/${currentSim.image}" alt="${currentSim.imageAlt || ""}">
      </div>
      <div class="sim-choice-group">
        ${currentSim.choices.map((choice) => `<button class="sim-choice" type="button" data-answer="${choice}">${choice}번</button>`).join("")}
      </div>
    `;
    document.querySelectorAll("#simChoices .sim-choice").forEach((button) => {
      button.addEventListener("click", () => answerSimulation(button));
    });
    return;
  }

  if (currentSim.type === "position-move") {
    const state = { marker: "", movement: "" };
    const answerMarkers = currentSim.answerMarkers || [currentSim.answerMarker];
    simChoices.innerHTML = `
      <div class="sim-choice-guide">
        <img loading="lazy" decoding="async" src="img/simul/${currentSim.image}" alt="${currentSim.imageAlt || ""}">
      </div>
      <div class="sim-choice-board">
        <div class="sim-choice-group" data-group="marker">
          <div class="sim-choice-label">어디로 갈까요?</div>
          ${currentSim.markerChoices.map((choice) => `<button class="sim-choice" type="button" data-part="marker" data-answer="${choice}">${choice}</button>`).join("")}
        </div>
        <div class="sim-choice-group" data-group="movement">
          <div class="sim-choice-label">해당 위치에서?</div>
          ${currentSim.movementChoices.map((choice) => `<button class="sim-choice" type="button" data-part="movement" data-answer="${choice}">${choice}</button>`).join("")}
        </div>
      </div>
    `;
    document.querySelectorAll("#simChoices .sim-choice").forEach((button) => {
      button.addEventListener("click", () => {
        const part = button.dataset.part;
        state[part] = button.dataset.answer;
        document.querySelectorAll(`#simChoices .sim-choice[data-part="${part}"]`).forEach((choice) => choice.classList.remove("selected"));
        button.classList.add("selected");
        if (!state.marker || !state.movement) return;

        const movementCorrect = currentSim.anyMovement || state.movement === currentSim.answerMovement;
        const correct = answerMarkers.includes(state.marker) && movementCorrect;
        document.querySelectorAll("#simChoices .sim-choice").forEach((choice) => {
          choice.disabled = true;
          if (
            (choice.dataset.part === "marker" && answerMarkers.includes(choice.dataset.answer)) ||
            (choice.dataset.part === "movement" && (currentSim.anyMovement || choice.dataset.answer === currentSim.answerMovement))
          ) {
            choice.classList.add("correct");
          }
        });
        document.querySelectorAll("#simChoices .sim-choice.selected").forEach((choice) => {
          const isCorrect =
            (choice.dataset.part === "marker" && answerMarkers.includes(choice.dataset.answer)) ||
            (choice.dataset.part === "movement" && (currentSim.anyMovement || choice.dataset.answer === currentSim.answerMovement));
          if (!isCorrect) choice.classList.add("wrong");
        });
        finishSimulationAnswer(`${state.marker} / ${state.movement}`, correct);
      });
    });
    return;
  }

  if (currentSim.type === "thunder-gaze") {
    const state = { marker: "", gaze: "" };
    simChoices.innerHTML = `
      <div class="sim-choice-guide">
        <img loading="lazy" decoding="async" src="img/simul/${currentSim.image}" alt="${currentSim.imageAlt || ""}">
      </div>
      <div class="sim-choice-board">
        <div class="sim-choice-group">
          <div class="sim-choice-label">어디로 갈까요?</div>
          ${["1", "2", "3", "4", "5", "6", "7", "8"].map((choice) => `<button class="sim-choice" type="button" data-part="marker" data-answer="${choice}">${choice}</button>`).join("")}
        </div>
        <div class="sim-choice-group">
          <div class="sim-choice-label">마안을 어떻게 할까요?</div>
          ${["마안 본다", "마안 안본다"].map((choice) => `<button class="sim-choice" type="button" data-part="gaze" data-answer="${choice}">${choice}</button>`).join("")}
        </div>
      </div>
    `;
    document.querySelectorAll("#simChoices .sim-choice").forEach((button) => {
      button.addEventListener("click", () => {
        const part = button.dataset.part;
        state[part] = button.dataset.answer;
        document.querySelectorAll(`#simChoices .sim-choice[data-part="${part}"]`).forEach((choice) => choice.classList.remove("selected"));
        button.classList.add("selected");
        if (!state.marker || !state.gaze) return;

        const correct = currentSim.markerAnswers.includes(state.marker) && state.gaze === currentSim.gazeAnswer;
        document.querySelectorAll("#simChoices .sim-choice").forEach((choice) => {
          choice.disabled = true;
          if (
            (choice.dataset.part === "marker" && currentSim.markerAnswers.includes(choice.dataset.answer)) ||
            (choice.dataset.part === "gaze" && choice.dataset.answer === currentSim.gazeAnswer)
          ) {
            choice.classList.add("correct");
          }
        });
        document.querySelectorAll("#simChoices .sim-choice.selected").forEach((choice) => {
          const isCorrect =
            (choice.dataset.part === "marker" && currentSim.markerAnswers.includes(choice.dataset.answer)) ||
            (choice.dataset.part === "gaze" && choice.dataset.answer === currentSim.gazeAnswer);
          if (!isCorrect) choice.classList.add("wrong");
        });
        finishSimulationAnswer(`${state.marker} / ${state.gaze}`, correct);
      });
    });
    return;
  }

  simChoices.innerHTML = currentSim.choices.map((choice) => (
    `<button class="sim-choice" type="button" data-answer="${choice}">${choice}</button>`
  )).join("");
  document.querySelectorAll("#simChoices .sim-choice").forEach((button) => {
    button.addEventListener("click", () => answerSimulation(button));
  });
}

function answerSimulation(button) {
  if (!currentSim || button.disabled) return;
  const selected = button.dataset.answer;
  const answers = currentSim.answers || [currentSim.answer];
  const correct = answers.includes(selected);

  document.querySelectorAll("#simChoices .sim-choice").forEach((choice) => {
    choice.disabled = true;
    if (answers.includes(choice.dataset.answer)) choice.classList.add("correct");
  });
  if (!correct) button.classList.add("wrong");
  finishSimulationAnswer(selected, correct);
}

function resetSimulation() {
  simStats = { correct: 0, total: 0 };
  simLogFilter = "";
  simCorrectFilter.classList.remove("active");
  simWrongFilter.classList.remove("active");
  updateSimStats();
  simScoreText.textContent = "랜덤 상황을 빠르게 판단해 보세요.";
  simLog.innerHTML = "";
  simLog.classList.remove("open");
  simLogToggle.textContent = "기록 보기";
  nextSimulation();
}
