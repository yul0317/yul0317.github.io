// 고정 문제 방식의 기존 퀴즈 렌더링과 채점을 담당합니다.
function renderQuiz() {
  totalEl.textContent = quiz.length;
  questionRoot.innerHTML = quiz.map((item, index) => `
    <article class="question" data-index="${index}">
      <h3>${index + 1}. ${item.q}</h3>
      <div class="choices">
        ${item.choices.map((choice, choiceIndex) => `
          <button class="choice" type="button" data-choice="${choiceIndex}">${choice}</button>
        `).join("")}
      </div>
      <div class="explain">${item.explain}</div>
    </article>
  `).join("");

  document.querySelectorAll(".choice").forEach((button) => {
    button.addEventListener("click", () => {
      const question = button.closest(".question");
      question.querySelectorAll(".choice").forEach((choice) => {
        choice.classList.remove("selected");
      });
      button.classList.add("selected");
    });
  });
}

function gradeQuiz() {
  let score = 0;
  document.querySelectorAll(".question").forEach((question) => {
    const index = Number(question.dataset.index);
    const selected = question.querySelector(".choice.selected");
    const explain = question.querySelector(".explain");
    question.querySelectorAll(".choice").forEach((choice) => {
      const choiceIndex = Number(choice.dataset.choice);
      choice.classList.remove("correct", "wrong");
      if (choiceIndex === quiz[index].answer) {
        choice.classList.add("correct");
      }
    });

    if (selected) {
      const selectedIndex = Number(selected.dataset.choice);
      if (selectedIndex === quiz[index].answer) {
        score += 1;
      } else {
        selected.classList.add("wrong");
      }
    }
    explain.classList.add("show");
  });

  scoreEl.textContent = score;
  const percent = Math.round((score / quiz.length) * 100);
  scoreText.textContent = percent >= 80
    ? "실전 콜을 맡겨도 될 만큼 안정적입니다."
    : percent >= 50
      ? "핵심 흐름은 잡혔고, 가속도와 혼돈 판정을 더 보면 좋습니다."
      : "01:11 이후 처리 순서를 다시 한 번 훑어보면 금방 올라옵니다.";
}

function resetQuiz() {
  document.querySelectorAll(".choice").forEach((choice) => {
    choice.classList.remove("selected", "correct", "wrong");
  });
  document.querySelectorAll(".explain").forEach((explain) => {
    explain.classList.remove("show");
  });
  scoreEl.textContent = "0";
  scoreText.textContent = "문제를 풀면 결과가 표시됩니다.";
}
