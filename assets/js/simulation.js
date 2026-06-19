// 16단계 순차 시뮬레이션의 상태 생성, 화면 표시와 진행을 담당합니다.
function remainText(resolveAt) {
  if (!resolveAt || !seq?.timePoint) return "";
  const diff = timeToSeconds(resolveAt) - timeToSeconds(seq.timePoint);
  if (diff <= 0) return "";
  if (diff >= 60) return `${Math.floor(diff / 60)}m`;
  return `${diff}s`;
}

function addSeqBuff(truth, debuff, resolveStep = null, resolveAt = "", source = "") {
  seq.buffs.push({ truth, debuff, resolveStep, resolveAt, source });
}

function addPersonalGrandCross(data, truth, spreadStep, spreadAt, gazeStep, gazeAt, source) {
  if (data.main === "물" || data.main === "번개") {
    addSeqBuff(truthIcon(truth), mechanicIcon(data.main), spreadStep, spreadAt, source);
  }
  if (data.accel) {
    const accelEvent = ACCEL_TIMING_EVENTS[data.accelTiming];
    addSeqBuff(
      truthIcon(truth),
      mechanicIcon("가속도"),
      accelEvent.step,
      accelEvent.time,
      `${source} · ${data.accelTiming}`
    );
  }
  if (data.main === "마안") {
    addSeqBuff(truthIcon(truth), mechanicIcon("마안"), gazeStep, gazeAt, source);
  }
}

function scheduledEvent(step) {
  return Object.entries(seq.gcSchedule).find(([, event]) => event.step === step)?.[0] || "";
}

function eventLabel(key, schedule = seq?.gcSchedule) {
  if (key === "gc1Gaze") return "빠른 마안";
  if (key === "gc2Gaze") return "느린 마안";
  if (key.endsWith("Spread") && schedule) {
    return `${spreadTimingForEvent(schedule, key)} 물/번개/가속도`;
  }
  return "";
}

function accelAssignmentForEvent(event) {
  if (!event.endsWith("Spread")) return null;
  return accelAssignmentAtTiming(
    seq.gc1Personal,
    seq.gc2Personal,
    seq.gc1,
    seq.gc2,
    spreadTimingForEvent(seq.gcSchedule, event)
  );
}

function renderSeqBuffs() {
  const empty = `<span class="buff-personal-empty">-</span>`;
  const memoryLabels = [
    ["그랜드크로스 1", "gc1"],
    ["카오스 1", "chaos1"],
    ["그랜드크로스 2", "gc2"],
    ["카오스 2", "chaos2"],
    ["그랜드크로스 3", "gc3"],
    [thunderDisplay, "thunder"],
    [blizzardDisplay, "blizzard"]
  ];
  if (!seq) {
    seqBuffs.innerHTML = `
      <div class="buff-panel" aria-label="부여된 디버프">
        <div class="buff-split">
          <div class="buff-party">
            ${seqPlayers.map((player) => `
              <div class="buff-party-row">
                <div class="buff-job">${jobIcon(player.key, player.key)}</div>
                <div class="buff-personal-list">${empty}</div>
              </div>
            `).join("")}
          </div>
          <div class="buff-divider" aria-hidden="true"></div>
          <div class="buff-memory">
            ${memoryLabels.map(([label]) => `
              <div class="buff-memory-row">
                <div class="buff-memory-label">${label}</div>
              </div>
            `).join("")}
          </div>
          <div class="buff-truths">
            ${memoryLabels.map(() => `
              <div class="buff-truth-row">
                <div class="buff-memory-truth">${empty}</div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
    return;
  }

  const playerDebuffItem = (iconHtml, resolveStep, resolveAt) => {
    const resolved = resolveStep ? (seq.step > resolveStep || seq.completedSteps.has(resolveStep)) : false;
    const remain = resolveAt && (!resolveStep || seq.step <= resolveStep) ? remainText(resolveAt) : "";
    return `
      <span class="buff-personal-item ${resolved ? "resolved" : ""}">
        ${iconHtml}
        <span>${remain || "&nbsp;"}</span>
      </span>
    `;
  };

  const playerItemsFor = (playerName) => {
    const items = [];
    const addItem = (order, html) => items.push({ order, html });
    const addGcItems = (data, assigned, spreadEvent, gazeEvent) => {
      if (!assigned || !data) return;
      if (data.main === "마안") {
        addItem(10, playerDebuffItem(mechanicIcon("마안"), gazeEvent.step, gazeEvent.time));
      }
      if (data.main === "물" || data.main === "번개") {
        addItem(20, playerDebuffItem(mechanicIcon(data.main), spreadEvent.step, spreadEvent.time));
      }
      if (data.accel) {
        const accelEvent = ACCEL_TIMING_EVENTS[data.accelTiming];
        addItem(30, playerDebuffItem(mechanicIcon("가속도"), accelEvent.step, accelEvent.time));
      }
    };
    addGcItems(seq.gc1Assign?.[playerName], seq.step >= 2, seq.gcSchedule.gc1Spread, seq.gcSchedule.gc1Gaze);
    if (seq.step >= 3) {
      addItem(40, playerDebuffItem(mechanicIcon(seq.chaosFirst), seq.chaosFirst === "혼돈의 불" ? 12 : 15, seq.chaosFirst === "혼돈의 불" ? "01:41" : "02:04"));
    }
    addGcItems(seq.gc2Assign?.[playerName], seq.step >= 5, seq.gcSchedule.gc2Spread, seq.gcSchedule.gc2Gaze);
    if (seq.step >= 6) {
      addItem(40, playerDebuffItem(mechanicIcon(seq.chaosSecond), seq.chaosSecond === "혼돈의 불" ? 12 : 15, seq.chaosSecond === "혼돈의 불" ? "01:41" : "02:04"));
    }
    if (seq.step >= 8) {
      const third = seq.gc3Assign?.[playerName];
      if (third) {
        addItem(50, playerDebuffItem(icon(third.wound === "산자의 상처" ? "산자의 상처.webp" : "죽은자의 상처.webp", third.wound), 9, "01:11"));
        addItem(51, playerDebuffItem(icon(third.finalDebuff === "알라그 필드" ? "알라그 필드.webp" : "죽음 초월.webp", third.finalDebuff), 9, "01:11"));
      }
    }
    return items.length ? items.sort((a, b) => a.order - b.order).map((item) => item.html).join("") : empty;
  };

  const truthOrEmpty = (available, truth) => available ? truthIcon(truth) : empty;
  const memoryRows = [
    ["그랜드크로스 1", seq.step >= 2, seq.gc1],
    ["카오스 1", seq.step >= 3, seq.chaos1Truth],
    ["그랜드크로스 2", seq.step >= 5, seq.gc2],
    ["카오스 2", seq.step >= 6, seq.chaos2Truth],
    ["그랜드크로스 3", seq.step >= 8, seq.gc3],
    [thunderDisplay, seq.step >= 11, seq.thunderMemory],
    [blizzardDisplay, seq.step >= 13, seq.blizzardMemory]
  ];

  seqBuffs.innerHTML = `
    <div class="buff-panel" aria-label="부여된 디버프">
      <div class="buff-split">
        <div class="buff-party">
          ${seqPlayers.map((player) => `
            <div class="buff-party-row">
              <div class="buff-job">${jobIcon(player.key, player.key)}</div>
              <div class="buff-personal-list">${playerItemsFor(player.name)}</div>
            </div>
          `).join("")}
        </div>
        <div class="buff-divider" aria-hidden="true"></div>
        <div class="buff-memory">
          ${memoryRows.map(([label, available, truth]) => `
            <div class="buff-memory-row">
              <div class="buff-memory-label">${label}</div>
            </div>
          `).join("")}
        </div>
        <div class="buff-truths">
          ${memoryRows.map(([, available, truth]) => `
            <div class="buff-truth-row">
              <div class="buff-memory-truth">${truthOrEmpty(available, truth)}</div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function seqResultDetail(fallback, options = {}) {
  if (!seq || seq.step < 9) return fallback;
  return resultDetailForStep(seq.step, fallback, [options.myDebuff, options.handlingDebuff]);
}

function seqChoiceButtons(selector = ".sim-choice") {
  return seqChoices.querySelectorAll(selector);
}

function setSeqChoiceGuideState(enabled) {
  seqActivePanel.classList.toggle("has-choice-guide", enabled);
}

function setSeqChoices(choices, answer, explain, options = {}) {
  seqChoiceHandler = null;
  seqNextBtn.disabled = true;
  seqNextBtn.textContent = "선택 필요";
  const guide = options.image
    ? `<div class="sim-choice-guide"><img loading="eager" decoding="sync" src="img/${options.image}" alt="${options.imageAlt || ""}"></div>`
    : options.placeholder
      ? `<div class="sim-choice-guide"><div class="sim-choice-placeholder" aria-hidden="true"></div></div>`
      : "";
  setSeqChoiceGuideState(Boolean(guide));
  seqChoices.innerHTML = guide + `
    <div class="seq-choice-controls seq-choice-list">
      <div class="sim-choice-label">${options.choiceLabel || "어떻게 처리할까요?"}</div>
      ${choices.map((choice) => `<button class="sim-choice" type="button" data-answer="${choice}">${choice}</button>`).join("")}
    </div>
  `;
  const handleChoice = (button) => {
    const selected = button.dataset.answer;
    const correct = selected === answer;
    seqChoiceButtons().forEach((choice) => {
      choice.disabled = true;
      if (choice.dataset.answer === answer) choice.classList.add("correct");
    });
    if (!correct) button.classList.add("wrong");
    setResultState(
      seqResult,
      correct,
      seqResultDetail(`정답: ${answer}.<br>${explain}`, { handlingDebuff: options.handlingDebuff })
    );
    seq.completedSteps.add(seq.step);
    renderSeqBuffs();
    updateSeqStats(correct);
    seqNextBtn.disabled = false;
    addResultLog(seqLog, `${seq.time} ${seq.title}`, selected, answer, correct);
    seqNextBtn.textContent = seq.step >= 16 ? "완료" : "다음 단계";
    updateSeqAccordionState();
    syncSeqInlineNext();
  };
  seqChoiceHandler = handleChoice;
}

function setSeqPositionMoveChoices(config) {
  seqChoiceHandler = null;
  seqNextBtn.disabled = true;
  seqNextBtn.textContent = "선택 필요";
  const state = { marker: "", movement: "" };
  const answerMarkers = config.answerMarkers || [config.answerMarker];
  setSeqChoiceGuideState(true);
  seqChoices.innerHTML = `
    <div class="sim-choice-guide">
      <img loading="eager" decoding="sync" src="img/simul/${config.image}" alt="${config.imageAlt || ""}">
    </div>
    <div class="seq-choice-controls">
    <div class="sim-choice-board">
      <div class="sim-choice-group" data-group="marker">
        <div class="sim-choice-label">어디로 갈까요?</div>
        ${config.markerChoices.map((choice) => `<button class="sim-choice" type="button" data-part="marker" data-answer="${choice}">${choice}</button>`).join("")}
      </div>
      <div class="sim-choice-group" data-group="movement">
        <div class="sim-choice-label">해당 위치에서?</div>
        ${config.movementChoices.map((choice) => `<button class="sim-choice" type="button" data-part="movement" data-answer="${choice}">${choice}</button>`).join("")}
      </div>
    </div>
    </div>
  `;

  const handleChoice = (button) => {
    const part = button.dataset.part;
    state[part] = button.dataset.answer;
    seqChoiceButtons(`.sim-choice[data-part="${part}"]`).forEach((choice) => {
      choice.classList.remove("selected");
    });
    button.classList.add("selected");

    if (!state.marker || !state.movement) return;

    const movementCorrect = config.anyMovement || state.movement === config.answerMovement;
    const correct = answerMarkers.includes(state.marker) && movementCorrect;
    seqChoiceButtons().forEach((choice) => {
      choice.disabled = true;
      if (
        (choice.dataset.part === "marker" && answerMarkers.includes(choice.dataset.answer)) ||
        (choice.dataset.part === "movement" && (config.anyMovement || choice.dataset.answer === config.answerMovement))
      ) {
        choice.classList.add("correct");
      }
    });
    seqChoiceButtons(".sim-choice.selected").forEach((choice) => {
      const isCorrect =
        (choice.dataset.part === "marker" && answerMarkers.includes(choice.dataset.answer)) ||
        (choice.dataset.part === "movement" && (config.anyMovement || choice.dataset.answer === config.answerMovement));
      if (!isCorrect) choice.classList.add("wrong");
    });
    const answer = `${answerMarkers.join(", ")} / ${config.anyMovement ? "움직임 상관없음" : config.answerMovement}`;
    const selected = `${state.marker} / ${state.movement}`;
    setResultState(
      seqResult,
      correct,
      seqResultDetail(`정답: ${answer}.<br>${config.explain}`, { myDebuff: config.myDebuff })
    );
    seq.completedSteps.add(seq.step);
    renderSeqBuffs();
    updateSeqStats(correct);
    seqNextBtn.disabled = false;
    seqNextBtn.textContent = seq.step >= 16 ? "완료" : "다음 단계";
    updateSeqAccordionState();
    syncSeqInlineNext();
    addResultLog(seqLog, `${seq.time} ${seq.title}`, selected, answer, correct);
  };
  seqChoiceHandler = handleChoice;
}

function setSeqImageMarkerChoices(config) {
  seqChoiceHandler = null;
  seqNextBtn.disabled = true;
  seqNextBtn.textContent = "선택 필요";
  const overlay = config.overlay
    ? `<span class="sim-overlay-icon">${config.overlay}</span>`
    : "";
  setSeqChoiceGuideState(true);
  seqChoices.innerHTML = `
    <div class="sim-choice-guide ${config.overlay ? "layered" : ""}">
      <img loading="eager" decoding="sync" src="img/simul/${config.image}" alt="${config.imageAlt || ""}">
      ${overlay}
    </div>
    <div class="seq-choice-controls">
    <div class="sim-choice-group">
      <div class="sim-choice-label">${config.choiceLabel || "어디로 갈까요?"}</div>
      ${config.choices.map((choice) => `<button class="sim-choice" type="button" data-answer="${choice}">${choice}번</button>`).join("")}
    </div>
    </div>
  `;

  const handleChoice = (button) => {
    const selected = button.dataset.answer;
    const correct = selected === config.answer;
    seqChoiceButtons().forEach((choice) => {
      choice.disabled = true;
      if (choice.dataset.answer === config.answer) choice.classList.add("correct");
    });
    if (!correct) button.classList.add("wrong");
    setResultState(
      seqResult,
      correct,
      seqResultDetail(`정답: ${config.answer}.<br>${config.explain}`, { myDebuff: config.myDebuff, handlingDebuff: config.handlingDebuff })
    );
    seq.completedSteps.add(seq.step);
    renderSeqBuffs();
    updateSeqStats(correct);
    seqNextBtn.disabled = false;
    seqNextBtn.textContent = seq.step >= 16 ? "완료" : "다음 단계";
    updateSeqAccordionState();
    syncSeqInlineNext();
    addResultLog(seqLog, `${seq.time} ${seq.title}`, selected, config.answer, correct);
  };
  seqChoiceHandler = handleChoice;
}

function setSeqSpreadChoices(event, action, options = {}) {
  const answer = `${action.spread} / ${action.accel}`;
  if (event.endsWith("Spread") && options.blizzardImage) {
    const data = event.startsWith("gc1") ? seq.gc1Personal : seq.gc2Personal;
    const truth = event.startsWith("gc1") ? seq.gc1 : seq.gc2;
    const blizzardPattern = pick([1, 2]);
    const shouldSoakBlizzard = seq.blizzardMemory === "가짜";
    const markerGroups = blizzardSpreadMarkerGroups(seq.player, blizzardPattern, shouldSoakBlizzard, action.spread === "산개");
    const movement = movementAnswerFor(action.accel);
    const answerMovement = movement === "움직임 상관없음" ? "움직임" : movement;
    setSeqPositionMoveChoices({
      image: `느린_물_번개_가속_블리자가_${seq.blizzardMemory}_${blizzardPattern}.webp`,
      imageAlt: `느린 물 번개 가속 블리자가 ${seq.blizzardMemory} ${blizzardPattern} 처리`,
      markerChoices: ["1", "2", "3", "4", "5", "6", "7", "8"],
      movementChoices: ["움직임", "안 움직임"],
      answerMarker: markerGroups.markerAnswers[0],
      answerMarkers: markerGroups.markerAnswers,
      answerMovement,
      anyMovement: action.accel === "가속도 없음",
      myDebuff: personalDebuffLine(data, truth, action),
      explain: [
        `${blizzardDisplay}는 ${seq.blizzardMemory}입니다.`,
        shouldSoakBlizzard
          ? `${blizzardDisplay}를 밟아야 하므로 ${markerGroups.blizzardMarkers.join(", ")}번을 봅니다.`
          : `${blizzardDisplay}를 피해야 하므로 ${markerGroups.blizzardMarkers.join(", ")}번을 봅니다.`,
        action.spread === "산개"
          ? `산개 대상자이므로 ${markerGroups.spreadMarkers.join(", ")}번을 봅니다.`
          : `본대 대상자이므로 ${markerGroups.spreadMarkers.join(", ")}번을 봅니다.`,
        `최종 위치는 ${markerGroups.markerAnswers.join(", ")}번입니다.`,
        action.accel === "가속도 없음"
          ? "가속도 폭탄이 없으므로 움직임 여부는 정답에 영향을 주지 않습니다."
          : `가속도 폭탄은 ${action.accelRound}회차 ${action.accelTruth} 판정이라 ${action.accel === "멈춤" ? "안 움직임" : "움직임"} 처리입니다.`
      ].join("<br>")
    });
    return;
  }
  if (event.endsWith("Spread") && options.fastImage) {
    const isSupport = isSupportPlayer(seq.player);
    const data = event.startsWith("gc1") ? seq.gc1Personal : seq.gc2Personal;
    const truth = event.startsWith("gc1") ? seq.gc1 : seq.gc2;
    const spreadTarget = truth === "진짜" ? "번개" : "물";
    const roleText = isSupport ? "탱/힐" : "딜러";
    const rolePositionText = isSupport
      ? "탱/힐은 산개면 1번, 본대면 2번"
      : "딜러는 산개면 3번, 본대면 4번";
    const spreadReason = data.main === "물" || data.main === "번개"
      ? `${truth} 판정에서는 ${spreadTarget} 대상자가 산개합니다. 현재 ${data.main} 디버프이므로 ${action.spread} 처리입니다.`
      : `현재 물/번개 디버프가 없으므로 쉐어 본대 처리입니다.`;
    const accelReason = action.hasAccel
      ? `가속도 폭탄은 ${action.accelRound}회차 ${action.accelTruth} 판정이라 ${action.accel === "멈춤" ? "안 움직임" : "움직임"} 처리입니다.`
      : "가속도 폭탄이 없으므로 움직임 여부는 정답에 영향을 주지 않습니다.";
    const answerMarker = spreadMarkerFor(seq.player, action.spread);
    const answerMovement = movementAnswerFor(action.accel) === "움직임 상관없음" ? "움직임" : movementAnswerFor(action.accel);
    setSeqPositionMoveChoices({
      image: "빠른_물_번개_가속_디버프처리.webp",
      imageAlt: "빠른 물 번개 가속 디버프처리",
      markerChoices: ["1", "2", "3", "4"],
      movementChoices: ["움직임", "안 움직임"],
      answerMarker,
      answerMovement,
      anyMovement: action.accel === "가속도 없음",
      myDebuff: personalDebuffLine(data, truth, action),
      explain: [
        `선택 직업: ${seq.player} (${roleText}).`,
        spreadReason,
        rolePositionText + `이므로 최종 위치는 ${answerMarker}번입니다.`,
        accelReason
      ].join("<br>")
    });
  } else {
    setSeqChoices(
      ["산개 / 멈춤", "산개 / 움직임", "산개 / 가속도 없음", "본대 / 멈춤", "본대 / 움직임", "본대 / 가속도 없음"],
      answer,
      `${eventLabel(event)} 최종 처리는 ${answer}.`,
      { placeholder: options.placeholder }
    );
  }
}

function setSeqThunderGazeChoices(config) {
  seqChoiceHandler = null;
  seqNextBtn.disabled = true;
  seqNextBtn.textContent = "선택 필요";
  const state = { marker: "", gaze: "" };
  const markerChoices = config.markerChoices || ["1", "2", "3", "4", "5", "6", "7", "8"];
  const gazeChoices = config.gazeChoices || ["마안 본다", "마안 안본다"];
  setSeqChoiceGuideState(true);
  seqChoices.innerHTML = `
    <div class="sim-choice-guide">
      <img loading="eager" decoding="sync" src="img/simul/${config.image}" alt="${config.imageAlt || ""}">
    </div>
    <div class="seq-choice-controls">
    <div class="sim-choice-board">
      <div class="sim-choice-group">
        <div class="sim-choice-label">${config.markerLabel || "어디로 갈까요?"}</div>
        ${markerChoices.map((choice) => `<button class="sim-choice" type="button" data-part="marker" data-answer="${choice}">${choice}</button>`).join("")}
      </div>
      <div class="sim-choice-group">
        <div class="sim-choice-label">${config.gazeLabel || "마안을 어떻게 할까요?"}</div>
        ${gazeChoices.map((choice) => `<button class="sim-choice" type="button" data-part="gaze" data-answer="${choice}">${choice}</button>`).join("")}
      </div>
    </div>
    </div>
  `;

  const handleChoice = (button) => {
    const part = button.dataset.part;
    state[part] = button.dataset.answer;
    seqChoiceButtons(`.sim-choice[data-part="${part}"]`).forEach((choice) => {
      choice.classList.remove("selected");
    });
    button.classList.add("selected");

    if (!state.marker || !state.gaze) return;

    const markerCorrect = config.markerAnswers.includes(state.marker);
    const gazeCorrect = state.gaze === config.gazeAnswer;
    const correct = markerCorrect && gazeCorrect;
    seqChoiceButtons().forEach((choice) => {
      choice.disabled = true;
      if (
        (choice.dataset.part === "marker" && config.markerAnswers.includes(choice.dataset.answer)) ||
        (choice.dataset.part === "gaze" && choice.dataset.answer === config.gazeAnswer)
      ) {
        choice.classList.add("correct");
      }
    });
    seqChoiceButtons(".sim-choice.selected").forEach((choice) => {
      const isCorrect =
        (choice.dataset.part === "marker" && config.markerAnswers.includes(choice.dataset.answer)) ||
        (choice.dataset.part === "gaze" && choice.dataset.answer === config.gazeAnswer);
      if (!isCorrect) choice.classList.add("wrong");
    });
    setResultState(
      seqResult,
      correct,
      seqResultDetail(`정답 위치: ${config.markerAnswers.join(", ")}번 / ${config.gazeAnswer}.<br>${config.explain}`, { handlingDebuff: config.handlingDebuff })
    );
    seq.completedSteps.add(seq.step);
    renderSeqBuffs();
    updateSeqStats(correct);
    seqNextBtn.disabled = false;
    seqNextBtn.textContent = seq.step >= 16 ? "완료" : "다음 단계";
    updateSeqAccordionState();
    syncSeqInlineNext();
    addResultLog(seqLog, `${seq.time} ${seq.title}`, `${state.marker}번 / ${state.gaze}`, `${config.markerAnswers.join(", ")}번 / ${config.gazeAnswer}`, correct);
  };
  seqChoiceHandler = handleChoice;
}

function setSeqReleaseWaterChoices(config) {
  seqChoiceHandler = null;
  seqNextBtn.disabled = true;
  seqNextBtn.textContent = "선택 필요";
  const overlay = `마력방출_${releaseTruthFileName(config.releaseTop)}_${releaseTruthFileName(config.releaseBottom)}.png`;
  const correctWater = config.waterLabel;
  const correctThunder = releaseActionShortLabel(config.thunderLabel);
  const correctBlizzard = releaseActionShortLabel(config.blizzardLabel);
  const answer = `히트박스 ${correctWater} / ${thunderDisplay} ${correctThunder} / ${blizzardDisplay} ${correctBlizzard}`;
  const state = { water: "", thunder: "", blizzard: "" };
  setSeqChoiceGuideState(true);
  seqChoices.innerHTML = `
    <div class="sim-choice-guide release-water-image">
      <img loading="eager" decoding="sync" src="img/simul/${config.image}" alt="마력 방출 혼돈의 물 처리 이미지">
      <img loading="eager" decoding="sync" class="release-water-center" src="img/simul/${overlay}" alt="마력 방출 ${config.releaseTop} ${config.releaseBottom}">
    </div>
    <div class="seq-choice-controls">
    <div class="release-choice-row" data-row="1">
      <div class="sim-choice-label release-choice-label">히트박스?</div>
      <button type="button" class="sim-choice" data-part="water" data-answer="안">안</button>
      <button type="button" class="sim-choice" data-part="water" data-answer="밖">밖</button>
    </div>
    <div class="release-choice-row" data-row="2">
      <div class="sim-choice-label release-choice-label">${thunderDisplay}?</div>
      <button type="button" class="sim-choice" data-part="thunder" data-answer="피함">피함</button>
      <button type="button" class="sim-choice" data-part="thunder" data-answer="밟음">밟음</button>
    </div>
    <div class="release-choice-row" data-row="3">
      <div class="sim-choice-label release-choice-label">${blizzardDisplay}?</div>
      <button type="button" class="sim-choice" data-part="blizzard" data-answer="피함">피함</button>
      <button type="button" class="sim-choice" data-part="blizzard" data-answer="밟음">밟음</button>
    </div>
    </div>
  `;

  const handleChoice = (choice) => {
    if (choice.disabled) return;
    const part = choice.dataset.part;
    state[part] = choice.dataset.answer;
    seqChoices.querySelectorAll(`.sim-choice[data-part="${part}"]`).forEach((item) => {
      item.classList.toggle("selected", item === choice);
    });
    if (!state.water || !state.thunder || !state.blizzard) return;
    const correct =
      state.water === correctWater &&
      state.thunder === correctThunder &&
      state.blizzard === correctBlizzard;
    seqChoices.querySelectorAll(".sim-choice").forEach((item) => {
      item.disabled = true;
      const isCorrect =
        (item.dataset.part === "water" && item.dataset.answer === correctWater) ||
        (item.dataset.part === "thunder" && item.dataset.answer === correctThunder) ||
        (item.dataset.part === "blizzard" && item.dataset.answer === correctBlizzard);
      if (isCorrect) item.classList.add("correct");
    });
    seqChoices.querySelectorAll(".sim-choice.selected").forEach((item) => {
      const isCorrect =
        (item.dataset.part === "water" && item.dataset.answer === correctWater) ||
        (item.dataset.part === "thunder" && item.dataset.answer === correctThunder) ||
        (item.dataset.part === "blizzard" && item.dataset.answer === correctBlizzard);
      if (!isCorrect) item.classList.add("wrong");
    });
    setResultState(
      seqResult,
      correct,
      seqResultDetail(`정답: ${answer}.`, { handlingDebuff: config.handlingDebuff })
    );
    seq.completedSteps.add(seq.step);
    renderSeqBuffs();
    updateSeqStats(correct);
    seqNextBtn.disabled = false;
    seqNextBtn.textContent = seq.step >= 16 ? "완료" : "다음 단계";
    updateSeqAccordionState();
    syncSeqInlineNext();
    addResultLog(seqLog, `${seq.time} ${seq.title}`, `히트박스 ${state.water} / ${thunderDisplay} ${state.thunder} / ${blizzardDisplay} ${state.blizzard}`, answer, correct);
  };
  seqChoiceHandler = handleChoice;
}

function releaseActionShortLabel(label) {
  return label === "피하기" ? "피함" : "밟음";
}

function syncSeqInlineNext() {
  if (!seqInlineNextBtn || !seqNextBtn) return;
  seqInlineNextBtn.disabled = seqNextBtn.disabled;
  seqInlineNextBtn.textContent = seqNextBtn.textContent;
}

function seqStepUnlocked(step) {
  if (step === 0) return true;
  if (!seq) return false;
  return step <= seq.step || seq.completedSteps.has(step);
}

function renderSeqAccordion() {
  seqAccordion.innerHTML = seqStepMeta.map((item) => `
    <section class="seq-expansion" data-step="${item.step}">
      <button class="seq-expansion-head" type="button" data-step="${item.step}" aria-expanded="false">
        <span class="seq-expansion-chevron">›</span>
        <span class="seq-expansion-title">${item.title}</span>
        <span class="seq-expansion-state">${item.time}</span>
      </button>
      <div class="seq-expansion-body">
        <div class="seq-expansion-placeholder">아직 진행 전입니다.</div>
      </div>
    </section>
  `).join("");

  seqAccordion.querySelectorAll(".seq-expansion-head").forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(button.dataset.step);
      if (!seqStepUnlocked(step)) return;
      const item = button.closest(".seq-expansion");
      const wasOpen = item.classList.contains("open");
      closeSeqExpansions();
      if (!wasOpen) openSeqExpansion(step, { keepOthersClosed: true });
    });
  });
  mountSeqPanel(0);
  updateSeqAccordionState();
}

function closeSeqExpansions() {
  closeExpansions(seqAccordion);
}

function mountSeqPanel(step) {
  const body = seqAccordion.querySelector(`.seq-expansion[data-step="${step}"] .seq-expansion-body`);
  if (!body || !seqActivePanel) return;
  if (body.contains(seqActivePanel)) return;
  body.innerHTML = "";
  body.appendChild(seqActivePanel);
}

function snapshotSeqStep(step) {
  const body = seqAccordion.querySelector(`.seq-expansion[data-step="${step}"] .seq-expansion-body`);
  snapshotPanel(body, seqActivePanel, "seq-step-snapshot");
}

function scrollSeqExpansionIntoView(item) {
  scrollExpansionIntoView(
    item,
    ".seq-content",
    "seqScrollBound",
    () => item.classList.contains("open")
  );
}

function openSeqExpansion(step, options = {}) {
  const item = seqAccordion.querySelector(`.seq-expansion[data-step="${step}"]`);
  if (!item || !seqStepUnlocked(step)) return;
  if (!options.keepOthersClosed) closeSeqExpansions();
  const isLiveStep = (!seq && step === 0) || (seq && seq.step === step);
  if (isLiveStep) mountSeqPanel(step);
  item.classList.add("open");
  item.querySelector(".seq-expansion-head")?.setAttribute("aria-expanded", "true");
  updateSeqAccordionState();
  scrollSeqExpansionIntoView(item);
}

function updateSeqAccordionState() {
  seqAccordion.querySelectorAll(".seq-expansion").forEach((item) => {
    const step = Number(item.dataset.step);
    const meta = seqStepMeta[step];
    const head = item.querySelector(".seq-expansion-head");
    const title = item.querySelector(".seq-expansion-title");
    const state = item.querySelector(".seq-expansion-state");
    const unlocked = seqStepUnlocked(step);
    const done = step === 0 ? Boolean(selectedSeqPlayer) : Boolean(seq && (step < seq.step || seq.completedSteps?.has(step)));
    const active = Boolean(seq && seq.step === step);
    item.classList.toggle("done", done);
    item.classList.toggle("active", active);
    if (head) head.disabled = !unlocked;
    if (title) title.textContent = active && seq?.title ? seq.title : meta.title;
    if (state) {
      if (!unlocked) state.textContent = "잠김";
      else if (active) state.textContent = seq?.time || meta.time;
      else if (done) state.textContent = "완료";
      else state.textContent = meta.time;
    }
  });
}

function renderSeqPlayerPicker() {
  seq = null;
  selectedSeqPlayer = "";
  seqChoiceHandler = null;
  renderSeqAccordion();
  seqTitle.textContent = "시뮬레이션 직업 선택";
  seqTime.textContent = "--:--";
  seqStep.textContent = "0";
  seqPlayerBadge.textContent = "--";
  seqPrompt.textContent = "시작하기 전에 본인 자리를 선택하세요.";
  clearResultState(seqResult, "");
  seqLog.innerHTML = "";
  seqLog.classList.remove("open");
  seqLog.closest(".seq-history")?.classList.remove("log-open");
  seqLogToggle.textContent = "기록 보기";
  seqStats = { correct: 0, wrong: 0 };
  seqLogFilter = "";
  seqCorrectFilter.classList.remove("active");
  seqWrongFilter.classList.remove("active");
  updateSeqStats();
  setSeqChoiceGuideState(false);
  seqChoices.innerHTML = seqPlayers.map((player) => (
    `<button class="sim-choice job-choice" type="button" data-player="${player.name}" data-key="${player.key}" aria-label="${player.key}">${jobIcon(player.key, player.key)} ${player.name}</button>`
  )).join("");
  seqNextBtn.disabled = true;
  seqNextBtn.textContent = "직업 선택 필요";
  renderSeqBuffs();
  updateSeqAccordionState();
  syncSeqInlineNext();
  openSeqExpansion(0);

  document.querySelectorAll("#seqChoices .sim-choice").forEach((button) => {
    button.addEventListener("click", () => {
      selectedSeqPlayer = button.dataset.player;
      document.querySelectorAll("#seqChoices .sim-choice").forEach((choice) => {
        choice.classList.remove("selected");
      });
      button.classList.add("selected");
      seqNextBtn.disabled = false;
      seqNextBtn.textContent = "시작";
      seqPlayerBadge.innerHTML = playerIconForKey(button.dataset.key);
      clearResultState(seqResult, `${button.dataset.key} 선택됨. 시작을 누르면 1단계부터 진행합니다.`);
      updateSeqAccordionState();
      syncSeqInlineNext();
    });
  });
}

function noSeqChoice(message) {
  seqChoiceHandler = null;
  setSeqChoiceGuideState(false);
  seqChoices.innerHTML = "";
  clearResultState(seqResult, message);
  seqNextBtn.disabled = false;
  seqNextBtn.textContent = seq.step >= 16 ? "완료" : "다음 단계";
  updateSeqAccordionState();
  syncSeqInlineNext();
}

function initSequential() {
  if (!selectedSeqPlayer) {
    renderSeqPlayerPicker();
    return;
  }
  const encounter = makeEncounterState();
  seq = {
    ...encounter,
    step: 0,
    completedSteps: new Set(),
    buffs: [],
    player: selectedSeqPlayer
  };
  seq.gc1Personal = seq.gc1Assign[seq.player];
  seq.gc2Personal = seq.gc2Assign[seq.player];
  seq.gc3Personal = seq.gc3Assign[seq.player];
  seq.wound = seq.gc3Personal.wound;
  seq.finalDebuff = seq.gc3Personal.finalDebuff;
  seqLog.innerHTML = "";
  seqLog.classList.remove("open");
  seqLog.closest(".seq-history")?.classList.remove("log-open");
  seqLogToggle.textContent = "기록 보기";
  seqStats = { correct: 0, wrong: 0 };
  seqLogFilter = "";
  seqCorrectFilter.classList.remove("active");
  seqWrongFilter.classList.remove("active");
  updateSeqStats();
  seqPlayerBadge.innerHTML = playerIconForKey(seqPlayerKey());
  advanceSequential();
}

function advanceSequential() {
  if (!seq) initSequential();
  if (seq.step >= 16) return;
  snapshotSeqStep(seq.step);
  seq.step += 1;
  seqStep.textContent = seq.step;
  seqChoiceHandler = null;
  setSeqChoiceGuideState(false);
  seqChoices.innerHTML = "";
  clearResultState(seqResult);

  const spreadAnswer = (truth) => truth === "진짜" ? "번개 산개" : "물 산개";
  const accelAnswer = (truth) => truth === "진짜" ? "멈춤" : "움직임";
  const gazeAnswer = gazeActionAnswer;
  const gazePosition = (hasGaze) => hasGaze ? "안으로 들어가서" : "밖에서";
  const gazeChoices = (hasGaze) => [`${gazePosition(hasGaze)} 마안 바라보기`, `${gazePosition(hasGaze)} 마안 뒤돌기`];
  const gazeChoiceAnswer = (hasGaze, truth) => `${gazePosition(hasGaze)} 마안 ${gazeAnswer(truth)}`;
  const floodAnswer = floodFinalColor(seq.finalDebuff, seq.flood);
  const fireAnswer = chaosAnswerFor("혼돈의 불", seq.fireTruth);
  const waterAnswer = chaosAnswerFor("혼돈의 물", seq.waterTruth);
  const line = releasePatternAnswer(seq.thunderMemory, seq.releaseTop);
  const cone = releasePatternAnswer(seq.blizzardMemory, seq.releaseBottom);

  const stages = {
    1: () => {
      seq.title = "1. 알쏭달쏭 마법";
      seq.time = "00:25";
      seq.timePoint = "00:25";
      seqPrompt.textContent = "참/거짓을 확인해서 직선장판과 부채꼴 장판을 피합니다.";
      renderSeqBuffs();
      noSeqChoice("처리 완료: 직선장판과 부채꼴 장판을 피했습니다.");
    },
    2: () => {
      seq.title = "2. 그랜드 크로스 1회차";
      seq.time = "00:29";
      seq.timePoint = "00:29";
      addPersonalGrandCross(seq.gc1Personal, seq.gc1, seq.gcSchedule.gc1Spread.step, seq.gcSchedule.gc1Spread.time, seq.gcSchedule.gc1Gaze.step, seq.gcSchedule.gc1Gaze.time, "그랜드 크로스 1회차");
      seqPrompt.textContent = "1회차 물/번개/마안/가속도 폭탄이 부여됩니다.";
      renderSeqBuffs();
      noSeqChoice("디버프가 부여되었습니다. 남은 시간 기준으로 빠른/느린 처리를 봅니다.");
    },
    3: () => {
      seq.title = "3. 카오스 화염 또는 해일";
      seq.time = "00:35";
      seq.timePoint = "00:35";
      addSeqBuff(truthIcon(seq.chaos1Truth), icon(seq.chaosFirst === "혼돈의 불" ? "혼돈의 불.webp" : "혼돈의 물.webp", seq.chaosFirst), seq.chaosFirst === "혼돈의 불" ? 12 : 15, seq.chaosFirst === "혼돈의 불" ? "01:41" : "02:04", "카오스 1회차");
      seqPrompt.textContent = "첫 번째 혼돈 디버프가 부여됩니다.";
      renderSeqBuffs();
      noSeqChoice("카오스 디버프를 기억합니다. 실제 실행은 혼돈의 불 → 혼돈의 물 순서입니다.");
    },
    4: () => {
      seq.title = "4. 알쏭달쏭 마법 2회차";
      seq.time = "00:40";
      seq.timePoint = "00:40";
      seqPrompt.textContent = "두 번째 직선/부채꼴 패턴을 피합니다.";
      renderSeqBuffs();
      noSeqChoice("처리 완료: 참/거짓을 보고 장판을 피했습니다.");
    },
    5: () => {
      seq.title = "5. 그랜드 크로스 2회차";
      seq.time = "00:44";
      seq.timePoint = "00:44";
      addPersonalGrandCross(seq.gc2Personal, seq.gc2, seq.gcSchedule.gc2Spread.step, seq.gcSchedule.gc2Spread.time, seq.gcSchedule.gc2Gaze.step, seq.gcSchedule.gc2Gaze.time, "그랜드 크로스 2회차");
      seqPrompt.textContent = "2회차 물/번개/마안/가속도 폭탄이 부여됩니다.";
      renderSeqBuffs();
      noSeqChoice("디버프가 추가되었습니다. 처리 순서는 회차가 아니라 남은 시간 기준입니다.");
    },
    6: () => {
      seq.title = "6. 카오스 반대 공격";
      seq.time = "00:49";
      seq.timePoint = "00:49";
      addSeqBuff(truthIcon(seq.chaos2Truth), icon(seq.chaosSecond === "혼돈의 불" ? "혼돈의 불.webp" : "혼돈의 물.webp", seq.chaosSecond), seq.chaosSecond === "혼돈의 불" ? 12 : 15, seq.chaosSecond === "혼돈의 불" ? "01:41" : "02:04", "카오스 2회차");
      seqPrompt.textContent = "앞쪽과 다른 혼돈 디버프가 부여됩니다.";
      renderSeqBuffs();
      noSeqChoice("혼돈의 불과 혼돈의 물이 모두 준비되었습니다.");
    },
    7: () => {
      seq.title = "7. 알쏭달쏭 마법 3회차";
      seq.time = "00:55";
      seq.timePoint = "00:55";
      seqPrompt.textContent = "세 번째 직선/부채꼴 패턴을 피합니다.";
      renderSeqBuffs();
      noSeqChoice("처리 완료: 참/거짓을 보고 장판을 피했습니다.");
    },
    8: () => {
      seq.title = "8. 그랜드 크로스 3회차";
      seq.time = "00:59";
      seq.timePoint = "00:59";
      addSeqBuff(truthIcon(seq.gc3), icon(seq.wound === "산자의 상처" ? "산자의 상처.webp" : "죽은자의 상처.webp", seq.wound), 9, "01:11", "그랜드 크로스 3회차");
      addSeqBuff(truthIcon(seq.gc3), icon(seq.finalDebuff === "알라그 필드" ? "알라그 필드.webp" : "죽음 초월.webp", seq.finalDebuff), 9, "01:11", "그랜드 크로스 3회차");
      seqPrompt.textContent = "상처 색상과 알라그 필드/죽음 초월이 부여됩니다.";
      renderSeqBuffs();
      noSeqChoice("상처 색상과 해제 디버프 종류를 기억합니다.");
    },
    9: () => {
      seq.title = "9. 무의 범람";
      seq.time = "01:11";
      seq.timePoint = "01:11";
      seqPrompt.textContent = "무의 범람에서 어떤 색을 맞아야 할까요?";
      renderSeqBuffs();
      const floodMarkerAnswer = floodMarkerFor(seq.wound, floodAnswer);
      const woundIcon = icon(seq.wound === "산자의 상처" ? "산자의 상처.webp" : "죽은자의 상처.webp", seq.wound);
      const finalDebuffIcon = icon(seq.finalDebuff === "알라그 필드" ? "알라그 필드.webp" : "죽음 초월.webp", seq.finalDebuff);
      setSeqImageMarkerChoices({
        image: seq.flood === "진짜" ? "무의범람_진짜_처리.png" : "무의범람_가짜_처리.png",
        imageAlt: `무의 범람 ${seq.flood} 처리`,
        choices: ["1", "2"],
        answer: floodMarkerAnswer,
        myDebuff: `내 디버프: ${woundIcon} ${seq.wound} / ${finalDebuffIcon} ${seq.finalDebuff}`,
        explain: ""
      });
    },
    10: () => {
      const event = scheduledEvent(10);
      const isGc1 = event.startsWith("gc1");
      const isGaze = event.endsWith("Gaze");
      const data = isGc1 ? seq.gc1Personal : seq.gc2Personal;
      const truth = isGc1 ? seq.gc1 : seq.gc2;
      seq.title = `10. ${eventLabel(event)}`;
      seq.time = "01:21";
      seq.timePoint = "01:21";
      const accelAssignment = accelAssignmentForEvent(event);
      const action = personalGrandCrossAction(data, truth, accelAssignment);
      seqPrompt.textContent = `${eventLabel(event)}를 어떻게 처리할까요?`;
      renderSeqBuffs();
      if (isGaze) {
        setSeqChoices(gazeChoices(action.hasGaze), gazeChoiceAnswer(action.hasGaze, truth), `${eventLabel(event)}은 ${truth}이므로 ${gazeChoiceAnswer(action.hasGaze, truth)}.`);
      } else {
        setSeqSpreadChoices(event, action, { fastImage: true });
      }
    },
    11: () => {
      const event = scheduledEvent(11);
      const isGc1 = event.startsWith("gc1");
      const isGaze = event.endsWith("Gaze");
      const data = isGc1 ? seq.gc1Personal : seq.gc2Personal;
      const truth = isGc1 ? seq.gc1 : seq.gc2;
      seq.title = `11. ${eventLabel(event)} + ${thunderDisplay}`;
      seq.time = "01:28";
      seq.timePoint = "01:28";
      addSeqBuff(truthIcon(seq.thunderMemory), thunderDisplay, 15, "02:00", "마력 방출 기억");
      const accelAssignment = accelAssignmentForEvent(event);
      const action = personalGrandCrossAction(data, truth, accelAssignment);
      seqPrompt.textContent = `${thunderDisplay}를 기억하고, ${eventLabel(event)}를 처리합니다.`;
      renderSeqBuffs();
      if (isGaze) {
        const thunderPattern = pick([1, 2]);
        const shouldSoakThunder = seq.thunderMemory === "가짜";
        const markerGroups = thunderGazeMarkerGroups(seq.player, thunderPattern, shouldSoakThunder, action.hasGaze);
        const markerAnswers = markerGroups.markerAnswers;
        const gazeAnswerText = gazeTextAnswer(truth);
        setSeqThunderGazeChoices({
          image: `선더가_${seq.thunderMemory}_${thunderPattern}.webp`,
          imageAlt: `선더가 ${seq.thunderMemory} ${thunderPattern} 처리`,
          markerAnswers,
          gazeAnswer: gazeAnswerText,
          handlingDebuff: handlingDebuffLine(icon("저주의 외침.webp", "저주의 외침"), truth),
          explain: [
            `${thunderDisplay}는 ${seq.thunderMemory}입니다.`,
            shouldSoakThunder
              ? `${thunderDisplay}를 밟아야 하므로 ${markerGroups.thunderMarkers.join(", ")}번을 봅니다.`
              : `${thunderDisplay}를 피해야 하므로 ${markerGroups.thunderMarkers.join(", ")}번을 봅니다.`,
            action.hasGaze ? `마안 대상자이므로 보스 히트박스 안으로 들어갑니다.` : `마안 대상자가 아니므로 보스 히트박스 밖에서 처리합니다.`,
            `마안 ${action.hasGaze ? "대상자" : "비대상자"} 위치는 ${markerGroups.gazeMarkers.join(", ")}번입니다.`,
            `마안은 ${truth}이므로 ${gazeAnswerText}가 정답입니다.`
          ].join("<br>")
        });
      } else {
        setSeqSpreadChoices(event, action);
      }
    },
    12: () => {
      seq.title = "12. 혼돈의 불 + 알테마";
      seq.time = "01:41";
      seq.timePoint = "01:41";
      seqPrompt.textContent = "혼돈의 불은 히트박스 기준 어디서 피할까요?";
      renderSeqBuffs();
      const fireMarkerAnswer = fireAnswer === "안" ? "1" : "2";
      setSeqImageMarkerChoices({
        image: "혼돈의_불.webp",
        imageAlt: "혼돈의 불 처리",
        choices: ["1", "2"],
        answer: fireMarkerAnswer,
        handlingDebuff: handlingDebuffLine(icon("혼돈의 불.webp", "혼돈의 불"), seq.fireTruth),
        explain: `혼돈의 불은 진짜면 히트박스 밖, 가짜면 안쪽입니다. 1번은 안쪽, 2번은 히트박스 밖이므로 정답은 ${fireMarkerAnswer}번.`
      });
    },
    13: () => {
      const event = scheduledEvent(13);
      const isGc1 = event.startsWith("gc1");
      const isGaze = event.endsWith("Gaze");
      const data = isGc1 ? seq.gc1Personal : seq.gc2Personal;
      const truth = isGc1 ? seq.gc1 : seq.gc2;
      seq.title = `13. ${eventLabel(event)} + ${blizzardDisplay}`;
      seq.time = "01:46";
      seq.timePoint = "01:46";
      addSeqBuff(truthIcon(seq.blizzardMemory), blizzardDisplay, 15, "02:00", "마력 방출 기억");
      const accelAssignment = accelAssignmentForEvent(event);
      const action = personalGrandCrossAction(data, truth, accelAssignment);
      seqPrompt.textContent = `${eventLabel(event)}를 어떻게 처리할까요?`;
      renderSeqBuffs();
      if (isGaze) {
        setSeqChoices(gazeChoices(action.hasGaze), gazeChoiceAnswer(action.hasGaze, truth), `${eventLabel(event)}은 ${truth}이므로 ${gazeChoiceAnswer(action.hasGaze, truth)}. ${blizzardDisplay}도 기억합니다.`);
      } else {
        setSeqSpreadChoices(event, action, { blizzardImage: true });
      }
    },
    14: () => {
      const event = scheduledEvent(14);
      const isGc1 = event.startsWith("gc1");
      const isGaze = event.endsWith("Gaze");
      const data = isGc1 ? seq.gc1Personal : seq.gc2Personal;
      const truth = isGc1 ? seq.gc1 : seq.gc2;
      seq.title = `14. ${eventLabel(event)}`;
      seq.time = "01:54";
      seq.timePoint = "01:54";
      seqPrompt.textContent = `${eventLabel(event)}를 어떻게 처리할까요?`;
      const accelAssignment = accelAssignmentForEvent(event);
      const action = personalGrandCrossAction(data, truth, accelAssignment);
      renderSeqBuffs();
      if (isGaze) {
        const markerAnswer = slowGazeMarkerFor(seq.player, action.hasGaze);
        const gazeAnswerText = gazeShortAnswer(truth);
        setSeqThunderGazeChoices({
          image: "느린_마안.webp",
          imageAlt: "느린 마안 처리 위치",
          markerChoices: ["1", "2", "3", "4"],
          markerLabel: "어디로 가야 하나요?",
          markerAnswers: [markerAnswer],
          gazeChoices: ["본다", "안본다"],
          gazeLabel: "마안을?",
          gazeAnswer: gazeAnswerText,
          handlingDebuff: handlingDebuffLine(icon("저주의 외침.webp", "저주의 외침"), truth),
          explain: [
            isSupportPlayer(seq.player)
              ? `탱커/힐러는 1, 2번을 사용하며 마안 ${action.hasGaze ? "대상자는 2번" : "비대상자는 1번"}입니다.`
              : `딜러는 3, 4번을 사용하며 마안 ${action.hasGaze ? "대상자는 3번" : "비대상자는 4번"}입니다.`,
            `마안은 ${truth}이므로 ${gazeAnswerText}가 정답입니다.`
          ].join("<br>")
        });
      } else {
        setSeqSpreadChoices(event, action, { placeholder: true });
      }
    },
    15: () => {
      seq.title = "15. 마력 방출 + 혼돈의 물";
      seq.time = "02:00 / 02:04";
      seq.timePoint = "02:00";
      seqPrompt.textContent = "마력 방출과 혼돈의 물을 같이 처리합니다.";
      renderSeqBuffs();
      const releaseWaterPattern = pick([1, 2, 3, 4, 5, 6, 7, 8]);
      setSeqReleaseWaterChoices({
        image: `마력방출_혼돈의_물_${releaseWaterPattern}.webp`,
        releaseTop: seq.releaseTop,
        releaseBottom: seq.releaseBottom,
        thunderLabel: line,
        blizzardLabel: cone,
        waterLabel: waterAnswer,
        handlingDebuff: handlingDebuffLine(icon("혼돈의 물.webp", "혼돈의 물"), seq.waterTruth)
      });
    },
    16: () => {
      seq.title = "16. 전멸기 / 5페이즈 전환";
      seq.time = "02:09~02:14";
      seq.timePoint = "02:09";
      seqPrompt.textContent = "25% 미만이면 5페이즈로 전환합니다.";
      renderSeqBuffs();
      noSeqChoice("시뮬레이션 완료. 처음부터 다시 하려면 초기화 후 시작하세요.");
    }
  };

  stages[seq.step]();
  seqTitle.textContent = seq.title;
  seqTime.textContent = seq.time;
  openSeqExpansion(seq.step);
  updateSeqAccordionState();
  syncSeqInlineNext();
}
