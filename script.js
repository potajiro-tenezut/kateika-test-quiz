const STORAGE_KEY = "homeEcMistakes";

const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");
const randomToggle = document.getElementById("randomToggle");
const startButton = document.getElementById("startButton");
const reviewButton = document.getElementById("reviewButton");
const retryButton = document.getElementById("retryButton");
const reviewAgainButton = document.getElementById("reviewAgainButton");
const savedMistakes = document.getElementById("savedMistakes");
const scoreNow = document.getElementById("scoreNow");
const totalNow = document.getElementById("totalNow");
const categoryBadge = document.getElementById("categoryBadge");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const questionImage = document.getElementById("questionImage");
const questionText = document.getElementById("questionText");
const choices = document.getElementById("choices");
const feedback = document.getElementById("feedback");
const nextButton = document.getElementById("nextButton");
const resultTitle = document.getElementById("resultTitle");
const resultDetail = document.getElementById("resultDetail");

let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let answered = false;
let sessionMistakes = [];

function getMistakeIds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveMistakeIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]));
  updateMistakeSummary();
}

function updateMistakeSummary() {
  const count = getMistakeIds().length;
  savedMistakes.textContent = count > 0
    ? `保存中の復習問題: ${count}問`
    : "まだ復習問題はありません。";
  reviewButton.disabled = count === 0;
  reviewAgainButton.disabled = count === 0;
}

function shuffle(items) {
  const copied = [...items];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function sortedQuestions() {
  return [...QUESTIONS].sort((a, b) => Number(b.important) - Number(a.important));
}

function showScreen(screen) {
  startScreen.classList.add("hidden");
  quizScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  screen.classList.remove("hidden");
}

function startQuiz(mode = "all") {
  const mistakeIds = getMistakeIds();
  const source = mode === "review"
    ? QUESTIONS.filter((question) => mistakeIds.includes(question.id))
    : sortedQuestions();

  if (source.length === 0) {
    updateMistakeSummary();
    showScreen(startScreen);
    return;
  }

  currentQuestions = randomToggle.checked ? shuffle(source) : source;
  currentIndex = 0;
  score = 0;
  answered = false;
  sessionMistakes = [];
  scoreNow.textContent = "0";
  totalNow.textContent = currentQuestions.length;
  showScreen(quizScreen);
  renderQuestion();
}

function renderQuestion() {
  const question = currentQuestions[currentIndex];
  answered = false;
  choices.innerHTML = "";
  feedback.className = "feedback hidden";
  feedback.textContent = "";
  nextButton.classList.add("hidden");

  categoryBadge.textContent = question.category;
  progressText.textContent = `${currentIndex + 1} / ${currentQuestions.length}`;
  progressBar.style.width = `${((currentIndex + 1) / currentQuestions.length) * 100}%`;
  questionText.textContent = question.question;

  if (question.image) {
    questionImage.src = question.image;
    questionImage.alt = question.imageAlt || "";
    questionImage.classList.remove("hidden");
  } else {
    questionImage.removeAttribute("src");
    questionImage.alt = "";
    questionImage.classList.add("hidden");
  }

  question.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.type = "button";
    button.textContent = choice;
    button.addEventListener("click", () => chooseAnswer(button, choice));
    choices.appendChild(button);
  });
}

function chooseAnswer(button, choice) {
  if (answered) return;

  const question = currentQuestions[currentIndex];
  const isCorrect = choice === question.answer;
  answered = true;

  [...choices.children].forEach((choiceButton) => {
    choiceButton.disabled = true;
    if (choiceButton.textContent === question.answer) {
      choiceButton.classList.add("correct");
    }
  });

  if (isCorrect) {
    score += 1;
    scoreNow.textContent = score;
    feedback.className = "feedback correct";
    feedback.textContent = `正解！ ${question.explanation}`;
    removeStoredMistake(question.id);
  } else {
    button.classList.add("wrong");
    feedback.className = "feedback wrong";
    feedback.textContent = `不正解。正解は「${question.answer}」。${question.explanation}`;
    sessionMistakes.push(question.id);
    saveMistakeIds([...getMistakeIds(), question.id]);
  }

  feedback.classList.remove("hidden");
  nextButton.classList.remove("hidden");
  nextButton.textContent = currentIndex === currentQuestions.length - 1 ? "結果を見る" : "次の問題";
}

function removeStoredMistake(id) {
  saveMistakeIds(getMistakeIds().filter((mistakeId) => mistakeId !== id));
}

function nextQuestion() {
  if (currentIndex < currentQuestions.length - 1) {
    currentIndex += 1;
    renderQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  const total = currentQuestions.length;
  const rate = Math.round((score / total) * 100);
  const mistakeCount = [...new Set(sessionMistakes)].length;

  resultTitle.textContent = `${score} / ${total}問 正解`;
  resultDetail.textContent = `正答率は${rate}%です。今回まちがえた問題は${mistakeCount}問、復習リストに保存しました。`;
  showScreen(resultScreen);
  updateMistakeSummary();
}

startButton.addEventListener("click", () => startQuiz("all"));
reviewButton.addEventListener("click", () => startQuiz("review"));
retryButton.addEventListener("click", () => startQuiz("all"));
reviewAgainButton.addEventListener("click", () => startQuiz("review"));
nextButton.addEventListener("click", nextQuestion);

updateMistakeSummary();
