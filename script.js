const ANSWER_REVEAL_DELAY_MS = 3000;
const POST_REVEAL_DELAY_MS = 1200;

const QUESTIONS_PER_PACK = 3;
const ROUND_MONEY_LEVELS = [100000, 500000, 1000000];
let currentMoneyLevels = ROUND_MONEY_LEVELS.slice();
let currentSafeIndexes = [0, 1, 2];

function buildQuestion(question, answers, correctIndex) {
  return { question, answers, correct: correctIndex };
}

const allQuestions = [
  buildQuestion(
    "Что, согласно народной мудрости, женщина может сделать из ничего?",
    ["Салат, прическу и трагедию", "Котлеты, ремонт и карьеру", "Борщ, отчет и долги", "Генеральную уборку и депрессию"],
    0
  ),
  buildQuestion(
    "Какое кодовое слово использует женщина, когда купила пятое платье за месяц?",
    ["«Это инвестиция»", "«Оно было по акции»", "«Я в нем буду на нашей свадьбе/юбилее»", "Все вышеперечисленное"],
    3
  ),
  buildQuestion(
    "Что такое «мицеллярная вода» в представлении большинства мужчин?",
    ["Святая вода для очищения совести", "Просто вода, но в пять раз дороже", "Жидкость для розжига", "Напиток для детокса"],
    1
  ),
  buildQuestion(
    "Какое средство макияжа способно изменить лицо женщины до неузнаваемости (по мнению мужей, ждущих в машине)?",
    ["Гигиеническая помада", "«Я только брови подкрашу»", "Крем для рук", "Патчи для глаз"],
    1
  ),
  buildQuestion(
    "Какое состояние женщины самое опасное для семейного бюджета?",
    ["«Мне нечего надеть»", "«Я просто посмотрю»", "«Смотри, какая милая вазочка»", "«У меня плохое настроение»"],
    3
  ),
  buildQuestion(
    "Сколько на самом деле времени занимает фраза «Я буду готова через 5 минут» в переводе на «мужской» язык?",
    ["300 секунд", "Время, за которое можно успеть посмотреть футбольный матч", "Вечность", "Зависит от сложности прически"],
    2
  ),
  buildQuestion(
    "Какой цветок считается неофициальным символом 8 Марта в России, хотя его ветки на самом деле — это серебристая акация?",
    ["Роза", "Мимоза", "Ромашка", "Кактус"],
    1
  ),
  buildQuestion(
    "Что, согласно шутке, ищет женщина в своей сумочке дольше всего?",
    ["Смысл жизни", "Паспорт", "Ключи или телефон", "Вторую такую же сумочку"],
    2
  ),
  buildQuestion(
    "Какое из этих слов НЕ является названием оттенка губной помады в каталогах косметики?",
    ["Пыльная роза", "Спелая вишня", "Мокрый асфальт", "Розовый закат"],
    2
  ),
  buildQuestion(
    "Что такое «балетка» в женском понимании?",
    ["Маленькая балерина", "Обувь на плоской подошве", "Диета на одних пачках", "Сумка для пуантов"],
    1
  ),
  buildQuestion(
    "Какая деталь гардероба получила свое название в честь атолла в Тихом океане, где проводились ядерные испытания?",
    ["Шпильки", "Бикини", "Мини-юбка", "Корсет"],
    1
  ),
  buildQuestion(
    "Как называется процедура, которую женщины делают, чтобы ресницы выглядели длиннее, но при этом название звучит как «процесс консервации»?",
    ["Маринование", "Ламинирование", "Копчение", "Тюнингование"],
    1
  )
];

const questionPacks = {
  pack1: [allQuestions[0], allQuestions[1], allQuestions[2]],
  pack2: [allQuestions[3], allQuestions[4], allQuestions[5]],
  pack3: [allQuestions[6], allQuestions[7], allQuestions[8]],
  pack4: [allQuestions[9], allQuestions[10], allQuestions[11]]
};

let questions = questionPacks.pack1;

const ui = {
  moneyList: document.getElementById("money-list"),
  statusText: document.getElementById("status-text"),
  questionText: document.getElementById("question-text"),
  answers: document.getElementById("answers"),
  hintResult: document.getElementById("hint-result"),
  hint5050: document.getElementById("hint-5050"),
  hintAudience: document.getElementById("hint-audience"),
  hintCall: document.getElementById("hint-call"),
  startBtn: document.getElementById("start-btn"),
  takeMoneyBtn: document.getElementById("take-money-btn"),
  readyStartBtn: document.getElementById("ready-start-btn"),
  packSelect: document.getElementById("question-pack"),
  setupControls: document.getElementById("setup-controls"),
  gameCard: document.querySelector(".game-card")
};

const state = {
  started: false,
  currentIndex: 0,
  guaranteed: 0,
  used5050: false,
  usedAudience: false,
  usedCall: false,
  gameOver: false,
  answerLocked: false
};

const audioMap = {
  gameStart: "audio/game-start.mp3",
  questionShown: "audio/question-shown.mp3",
  answerSelected: "audio/answer-selected.mp3",
  answerCorrect: "audio/answer-correct.mp3",
  answerWrong: "audio/answer-wrong.mp3",
  takeMoney: "audio/take-money.mp3",
  hint5050: "audio/khsm_50-50.mp3",
  hintAudience: "audio/hint-audience.mp3",
  hintCall: "audio/hint-call.mp3",
  gameWin: "audio/game-win.mp3",
  gameLose: "audio/answer-wrong.mp3",
  readyStart: "audio/hello-new-punter-2008-long.mp3"
};

const audioPlayers = {};
const audioStopTimers = {};
const audioStopAfterMs = {
  gameStart: 4000
};

function playSound(eventName) {
  const src = audioMap[eventName];
  if (!src) {
    return;
  }

  if (!audioPlayers[eventName]) {
    audioPlayers[eventName] = new Audio(src);
    audioPlayers[eventName].preload = "auto";
  }

  const player = audioPlayers[eventName];
  clearTimeout(audioStopTimers[eventName]);
  player.currentTime = 0;
  player.play().catch(() => {
    // Ignore playback errors if file is absent or autoplay is blocked.
  });

  const stopAfterMs = audioStopAfterMs[eventName];
  if (typeof stopAfterMs === "number" && stopAfterMs > 0) {
    audioStopTimers[eventName] = setTimeout(() => {
      player.pause();
      player.currentTime = 0;
    }, stopAfterMs);
  }
}

window.MillionaireAudio = {
  setAudioMap(partialMap) {
    if (!partialMap || typeof partialMap !== "object") {
      return;
    }
    Object.assign(audioMap, partialMap);
  },
  playSound
};

function formatMoney(value) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

function buildMoneyLadder() {
  ui.moneyList.innerHTML = "";
  currentMoneyLevels
    .slice()
    .reverse()
    .forEach((amount, reverseIndex) => {
      const originalIndex = currentMoneyLevels.length - 1 - reverseIndex;
      const li = document.createElement("li");
      li.textContent = `${originalIndex + 1}. ${formatMoney(amount)}`;
      li.dataset.index = String(originalIndex);
      if (currentSafeIndexes.includes(originalIndex)) {
        li.classList.add("safe");
      }
      ui.moneyList.appendChild(li);
    });
}

function updateMoneyLadder() {
  const items = Array.from(ui.moneyList.querySelectorAll("li"));
  items.forEach((li) => {
    const index = Number(li.dataset.index);
    li.classList.remove("current", "passed");
    if (index < state.currentIndex) {
      li.classList.add("passed");
    }
    if (index === state.currentIndex && !state.gameOver) {
      li.classList.add("current");
    }
  });
}

function resetHintOutput() {
  ui.hintResult.textContent = "";
}

function updateHintButtons() {
  ui.hint5050.classList.toggle("hint-disabled", state.used5050 || !state.started || state.gameOver);
  ui.hintAudience.classList.toggle("hint-disabled", state.usedAudience || !state.started || state.gameOver);
  ui.hintCall.classList.toggle("hint-disabled", state.usedCall || !state.started || state.gameOver);
}

function renderQuestion() {
  const current = questions[state.currentIndex];
  state.answerLocked = false;
  ui.questionText.textContent = current.question;
  ui.answers.innerHTML = "";
  const marks = ["A", "B", "C", "D"];

  current.answers.forEach((answer, idx) => {
    const wrapper = document.createElement("div");
    wrapper.className = "answer-btn-wrapper";
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.type = "button";
    btn.dataset.idx = String(idx);
    btn.textContent = `${marks[idx]}: ${answer}`;
    btn.addEventListener("click", () => handleAnswer(idx));
    wrapper.appendChild(btn);
    ui.answers.appendChild(wrapper);
  });

  ui.statusText.textContent = `Вопрос ${state.currentIndex + 1} на ${formatMoney(
    currentMoneyLevels[state.currentIndex]
  )}`;
  ui.takeMoneyBtn.disabled = state.currentIndex === 0;
  updateHintButtons();
  updateMoneyLadder();
  playSound("questionShown");
}

function disableAllAnswers() {
  Array.from(ui.answers.querySelectorAll(".answer-btn")).forEach((btn) => {
    btn.disabled = true;
  });
}

function finishGame(text, finalAmount) {
  state.gameOver = true;
  state.started = false;
  state.answerLocked = false;
  disableAllAnswers();
  ui.statusText.textContent = `${text} Итог: ${formatMoney(finalAmount)}`;
  ui.questionText.textContent = "Нажмите «Начать игру», чтобы сыграть снова.";
  ui.takeMoneyBtn.disabled = true;
  ui.setupControls?.classList.remove("hidden");
  ui.gameCard?.classList.remove("game-active");
  updateHintButtons();
  updateMoneyLadder();
}

function handleAnswer(selectedIdx) {
  if (!state.started || state.gameOver || state.answerLocked) {
    return;
  }

  state.answerLocked = true;
  const current = questions[state.currentIndex];
  const answerButtons = Array.from(ui.answers.querySelectorAll(".answer-btn"));
  disableAllAnswers();
  playSound("answerSelected");

  answerButtons.forEach((btn) => {
    const idx = Number(btn.dataset.idx);
    if (idx === selectedIdx) {
      btn.style.opacity = "1";
    }
  });

  ui.statusText.textContent = "Проверка ответа...";

  setTimeout(() => {
    answerButtons.forEach((btn) => {
      const wrapper = btn.closest(".answer-btn-wrapper");
      const idx = Number(btn.dataset.idx);
      if (idx === current.correct) {
        btn.classList.add("correct");
        wrapper?.classList.add("correct");
      }
      if (idx === selectedIdx && selectedIdx !== current.correct) {
        btn.classList.add("wrong");
        wrapper?.classList.add("wrong");
      }
    });

    if (selectedIdx === current.correct) {
      playSound("answerCorrect");
      if (currentSafeIndexes.includes(state.currentIndex)) {
        state.guaranteed = currentMoneyLevels[state.currentIndex];
      }
    } else {
      playSound("gameLose");
    }

    setTimeout(() => {
      state.currentIndex += 1;
      if (state.currentIndex >= questions.length) {
        playSound("gameWin");
        const isWin = selectedIdx === current.correct;
        finishGame(
          isWin ? "Победа! Вы ответили на все вопросы." : "Раунд завершён.",
          isWin ? currentMoneyLevels[currentMoneyLevels.length - 1] : state.guaranteed
        );
        return;
      }
      resetHintOutput();
      renderQuestion();
    }, POST_REVEAL_DELAY_MS);
  }, ANSWER_REVEAL_DELAY_MS);
}

function takeMoney() {
  if (!state.started || state.gameOver) {
    return;
  }
  playSound("takeMoney");
  const won = currentMoneyLevels[state.currentIndex - 1] || 0;
  finishGame("Вы решили забрать деньги.", won);
}

function useHint5050() {
  if (state.used5050 || !state.started || state.gameOver) {
    return;
  }
  state.used5050 = true;
  resetHintOutput();

  const current = questions[state.currentIndex];
  const wrongIndexes = [0, 1, 2, 3].filter((idx) => idx !== current.correct);
  const toDisable = wrongIndexes.sort(() => Math.random() - 0.5).slice(0, 2);
  const answerButtons = Array.from(ui.answers.querySelectorAll(".answer-btn"));

  answerButtons.forEach((btn) => {
    const idx = Number(btn.dataset.idx);
    if (toDisable.includes(idx)) {
      btn.disabled = true;
      btn.style.opacity = "0.45";
    }
  });

  ui.hintResult.textContent = "Подсказка 50:50 использована.";
  playSound("hint5050");
  updateHintButtons();
}

function weightedPoll(correctIndex) {
  const votes = [0, 0, 0, 0];
  const correctVotes = 42 + Math.floor(Math.random() * 30);
  let remaining = 100 - correctVotes;
  votes[correctIndex] = correctVotes;

  const wrong = [0, 1, 2, 3].filter((i) => i !== correctIndex);
  wrong.forEach((idx, i) => {
    if (i === wrong.length - 1) {
      votes[idx] = remaining;
    } else {
      const part = Math.floor(Math.random() * (remaining + 1));
      votes[idx] = part;
      remaining -= part;
    }
  });

  return votes;
}

function useHintAudience() {
  if (state.usedAudience || !state.started || state.gameOver) {
    return;
  }
  state.usedAudience = true;
  resetHintOutput();

  const current = questions[state.currentIndex];
  const votes = weightedPoll(current.correct);
  const labels = ["A", "B", "C", "D"];
  ui.hintResult.textContent = labels
    .map((label, idx) => `${label}: ${votes[idx]}%`)
    .join(" | ");
  playSound("hintAudience");
  updateHintButtons();
}

function useHintCall() {
  if (state.usedCall || !state.started || state.gameOver) {
    return;
  }
  state.usedCall = true;
  resetHintOutput();

  const current = questions[state.currentIndex];
  const labels = ["A", "B", "C", "D"];
  const confidence = 65 + Math.floor(Math.random() * 26);
  const maybeWrong = Math.random() < 0.18;
  const suggestedIndex = maybeWrong
    ? [0, 1, 2, 3].filter((i) => i !== current.correct)[Math.floor(Math.random() * 3)]
    : current.correct;

  ui.hintResult.textContent = `Друг считает, что это вариант ${labels[suggestedIndex]} (${confidence}% уверенности).`;
  playSound("hintCall");
  updateHintButtons();
}

function startGame() {
  const packKey = ui.packSelect?.value || "pack1";
  if (questionPacks[packKey]) {
    questions = questionPacks[packKey];
  }
  currentMoneyLevels = ROUND_MONEY_LEVELS.slice(0, questions.length);
  currentSafeIndexes = currentMoneyLevels.map((_, i) => i);
  buildMoneyLadder();
  state.started = true;
  state.gameOver = false;
  state.currentIndex = 0;
  state.guaranteed = 0;
  state.used5050 = false;
  state.usedAudience = false;
  state.usedCall = false;
  state.answerLocked = false;
  resetHintOutput();
  ui.setupControls?.classList.add("hidden");
  ui.gameCard?.classList.add("game-active");
  playSound("gameStart");
  renderQuestion();
}

ui.startBtn.addEventListener("click", startGame);
ui.takeMoneyBtn.addEventListener("click", takeMoney);
ui.hint5050.addEventListener("click", useHint5050);
ui.hintAudience.addEventListener("click", useHintAudience);
ui.hintCall.addEventListener("click", useHintCall);
ui.readyStartBtn?.addEventListener("click", () => playSound("readyStart"));

buildMoneyLadder();
updateHintButtons();
