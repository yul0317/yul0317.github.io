// 컨닝페이퍼의 선택 상태, 결과 계산, 화면 렌더링을 담당합니다.
function cheatGc2Timing() {
  return cheatState.gc1Timing === "빠른" ? "느린" : "빠른";
}

function cheatSpreadText(truth) {
  return truth === "진짜"
    ? "번개 산개 / 물 본대"
    : "물 산개 / 번개 본대";
}

function cheatSpreadHtml(truth) {
  const spread = truth === "진짜" ? "번개" : "물";
  const stack = truth === "진짜" ? "물" : "번개";
  const color = truth === "진짜" ? "cheat-action-blue" : "cheat-action-red";
  return `${spread} <span class="${color}">산개</span> / ${stack} 본대`;
}

function cheatSpreadTarget(truth) {
  return truth === "진짜" ? "번개" : "물";
}

function cheatTruthHtml(truth) {
  return `<span class="${truth === "진짜" ? "cheat-truth-true" : "cheat-truth-false"}">${truth}</span>`;
}

function cheatAccelText() {
  const truth = cheatAccelTruth();
  if (!truth) return "미선택";
  return truth === "진짜" ? "안 움직임" : "움직임";
}

function cheatAccelTruth() {
  return cheatState.accelRound === "1회차"
    ? cheatState.gc1Truth
    : cheatState.accelRound === "2회차"
      ? cheatState.gc2Truth
      : "";
}

function cheatAccelHtml() {
  const text = cheatAccelText();
  if (text === "미선택") return `<span>${text}</span>`;
  return `<span class="${text === "안 움직임" ? "cheat-action-blue" : "cheat-action-red"}">${text}</span>`;
}

function cheatSoakHtml(action) {
  const soak = action === "밟기" || action === "밟음";
  return `<span class="${soak ? "cheat-truth-false" : "cheat-truth-true"}">${action}</span>`;
}

function cheatGazeText(truth) {
  return truth === "진짜" ? "마안 안본다" : "마안 본다";
}

function cheatGazeHtml(truth) {
  const action = cheatGazeText(truth);
  const keyword = truth === "진짜" ? "안본다" : "본다";
  return `마안 <span class="${truth === "진짜" ? "cheat-action-blue" : "cheat-action-red"}">${keyword}</span>`;
}

function cheatChaosActionHtml(type, truth) {
  const action = chaosAnswerFor(type, truth);
  const blue = (type === "혼돈의 불" && action === "밖") || (type === "혼돈의 물" && action === "안");
  return `히트박스 <span class="${blue ? "cheat-action-blue" : "cheat-action-red"}">${action}</span>`;
}

function cheatResultLine(truth, actionHtml) {
  return `
    <div class="cheat-result-line">
      ${cheatTruthHtml(truth)}
      <span class="cheat-result-action">${actionHtml}</span>
    </div>
  `;
}

function cheatSelectorHtml(title, key, choices = ["진짜", "가짜"]) {
  return `
    <div class="cheat-card">
      <div class="cheat-row">
        <div class="cheat-title">${title}</div>
        <div class="cheat-buttons" data-cheat-key="${key}">
          ${choices.map((choice) => `<button type="button" data-value="${choice}">${choice}</button>`).join("")}
        </div>
      </div>
    </div>
  `;
}

function cheatChoiceIcon(key, value) {
  if (value === "진짜") return ["img/진실.png", "진짜"];
  if (value === "가짜") return ["img/거짓.png", "가짜"];
  if (value === "혼돈의 불") return ["img/혼돈의 불.webp", "혼돈의 불"];
  if (value === "혼돈의 물") return ["img/혼돈의 물.webp", "혼돈의 물"];
  if (key === "accelRound") return ["img/가속도 폭탄.webp", `${value} 가속도`];
  if (key === "gc1Timing" || key === "gc2Timing") {
    return value === "빠른"
      ? ["img/simul/attack_1.png", "빠른 디버프"]
      : ["img/simul/bind_1.png", "느린 디버프"];
  }
  return null;
}

function updateCheatButtonStates(root = document) {
  const gc2Timing = cheatGc2Timing();
  root.querySelectorAll(".cheat-buttons").forEach((group) => {
    const key = group.dataset.cheatKey;
    const value = key === "gc2Timing" ? gc2Timing : cheatState[key];
    group.querySelectorAll("button").forEach((button) => {
      const buttonValue = button.dataset.value;
      const iconData = cheatChoiceIcon(key, buttonValue);
      const label = buttonValue === "혼돈의 불" ? "불" : buttonValue === "혼돈의 물" ? "물" : buttonValue;
      button.innerHTML = iconData
        ? `<img src="${iconData[0]}" alt="${iconData[1]}"><span>${label}</span>`
        : `<span>${label}</span>`;
      button.classList.toggle("active", button.dataset.value === value);
      if (key === "accelRound") {
        button.disabled = Boolean(cheatState.accelRound && button.dataset.value !== cheatState.accelRound);
      }
    });
  });
}

function renderCheatSheet() {
  if (!cheatResult) return;
  const gc2Timing = cheatGc2Timing();
  const fireTruth = cheatState.chaos1Type === "혼돈의 불" ? cheatState.chaos1Truth : cheatState.chaos2Truth;
  const waterTruth = cheatState.chaos1Type === "혼돈의 물" ? cheatState.chaos1Truth : cheatState.chaos2Truth;
  cheatGc1SpreadTarget.textContent = `산개징: ${cheatSpreadTarget(cheatState.gc1Truth)}`;
  cheatGc2SpreadTarget.textContent = `산개징: ${cheatSpreadTarget(cheatState.gc2Truth)}`;
  const spreadByTiming = {
    [cheatState.gc1Timing]: cheatResultLine(cheatState.gc1Truth, cheatSpreadHtml(cheatState.gc1Truth)),
    [gc2Timing]: cheatResultLine(cheatState.gc2Truth, cheatSpreadHtml(cheatState.gc2Truth))
  };
  const releaseThunder = releasePatternAnswer(cheatState.thunderMemory, cheatState.releaseTop);
  const releaseBlizzard = releasePatternAnswer(cheatState.blizzardMemory, cheatState.releaseBottom);
  const releaseThunderTruth = releaseThunder === "피하기" ? "진짜" : "가짜";
  const releaseBlizzardTruth = releaseBlizzard === "피하기" ? "진짜" : "가짜";
  const chaosBody = (type, truth) => {
    const base = cheatResultLine(truth, cheatChaosActionHtml(type, truth));
    if (type !== "혼돈의 물") return base;
    return [
      base,
      cheatResultLine(releaseThunderTruth, `${thunderDisplay} ${cheatSoakHtml(releaseThunder)}`),
      cheatResultLine(releaseBlizzardTruth, `${blizzardDisplay} ${cheatSoakHtml(releaseBlizzard)}`)
    ].join("");
  };

  const rows = [
    {
      order: -1,
      title: `<span class="cheat-accel-title"><span class="accel-r">가</span><span class="accel-y">속</span><span class="accel-b">도</span></span>`,
      body: cheatAccelTruth()
        ? cheatResultLine(cheatAccelTruth(), cheatAccelHtml())
        : `<div class="cheat-result-line"><span></span><span class="cheat-result-action">미선택</span></div>`,
      className: "cheat-accel"
    },
    {
      order: 0,
      title: "빠른 물/번개/가속도",
      body: spreadByTiming["빠른"]
    },
    {
      order: 1,
      title: "빠른 마안",
      body: cheatResultLine(cheatState.gc1Truth, cheatGazeHtml(cheatState.gc1Truth))
    },
    {
      order: 1.5,
      selector: cheatSelectorHtml(`${thunderDisplay}`, "thunderMemory")
    },
    {
      order: 2,
      title: "혼돈의 불",
      body: chaosBody("혼돈의 불", fireTruth)
    },
    {
      order: 3,
      title: "느린 물/번개/가속도",
      body: spreadByTiming["느린"]
    },
    {
      order: 3.5,
      selector: cheatSelectorHtml(`${blizzardDisplay}`, "blizzardMemory")
    },
    {
      order: 4,
      title: "느린 마안",
      body: cheatResultLine(cheatState.gc2Truth, cheatGazeHtml(cheatState.gc2Truth))
    },
    {
      order: 4.2,
      selector: cheatSelectorHtml(`마력방출 위(${thunderDisplay})`, "releaseTop")
    },
    {
      order: 4.4,
      selector: cheatSelectorHtml(`마력방출 밑(${blizzardDisplay})`, "releaseBottom")
    },
    {
      order: 5,
      title: "혼돈의 물",
      body: chaosBody("혼돈의 물", waterTruth)
    }
  ];

  cheatResult.innerHTML = rows
    .sort((a, b) => a.order - b.order)
    .map((row) => row.selector || `
      <div class="cheat-result-card ${row.className || ""}">
        <b>${row.title}</b>
        <div class="cheat-result-body">${row.body}</div>
      </div>
    `).join("");

  bindCheatButtons(cheatResult);
  updateCheatButtonStates();
}

function bindCheatButtons(root = document) {
  root.querySelectorAll(".cheat-buttons:not(.locked) button").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.closest(".cheat-buttons");
      const key = group.dataset.cheatKey;
      cheatState[key] = key === "accelRound" && cheatState[key] === button.dataset.value
        ? ""
        : button.dataset.value;
      renderCheatSheet();
    });
  });
}
