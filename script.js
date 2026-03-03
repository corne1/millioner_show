const moneyLevels = [
  100,
  200,
  300,
  500,
  1000,
  2000,
  4000,
  8000,
  16000,
  32000,
  64000,
  125000,
  250000,
  500000,
  1000000
];

const safeIndexes = [4, 9];
const ANSWER_REVEAL_DELAY_MS = 3000;
const POST_REVEAL_DELAY_MS = 1200;

const questions = [
  {
    question: "Как называется столица Франции?",
    answers: ["Берлин", "Париж", "Мадрид", "Рим"],
    correct: 1
  },
  {
    question: "Сколько дней в високосном году?",
    answers: ["365", "366", "364", "360"],
    correct: 1
  },
  {
    question: "Какой язык работает в браузере на стороне клиента?",
    answers: ["Python", "Java", "C#", "JavaScript"],
    correct: 3
  },
  {
    question: "Какой океан самый большой?",
    answers: ["Индийский", "Атлантический", "Тихий", "Северный Ледовитый"],
    correct: 2
  },
  {
    question: "Что обозначает HTML?",
    answers: [
      "HyperText Markup Language",
      "HighText Machine Language",
      "Hyper Transfer Main Link",
      "Home Tool Markup Language"
    ],
    correct: 0
  },
  {
    question: "Кто написал роман «1984»?",
    answers: ["Джордж Оруэлл", "Олдос Хаксли", "Рэй Брэдбери", "Эрнест Хемингуэй"],
    correct: 0
  },
  {
    question: "Какой элемент имеет химический символ O?",
    answers: ["Золото", "Кислород", "Серебро", "Олово"],
    correct: 1
  },
  {
    question: "Как называется процесс поиска и исправления ошибок в коде?",
    answers: ["Рефакторинг", "Компиляция", "Дебаггинг", "Деплой"],
    correct: 2
  },
  {
    question: "Какое минимальное значение может вернуть Math.random() в JavaScript?",
    answers: ["0 включительно", "1 включительно", "-1 включительно", "Зависит от браузера"],
    correct: 0
  },
  {
    question: "Какая планета находится ближе всего к Солнцу?",
    answers: ["Марс", "Венера", "Меркурий", "Юпитер"],
    correct: 2
  },
  {
    question: "В какой системе счисления работают компьютеры на уровне битов?",
    answers: ["Десятичной", "Восьмеричной", "Шестнадцатеричной", "Двоичной"],
    correct: 3
  },
  {
    question: "Что из перечисленного является алгоритмом сортировки?",
    answers: ["BFS", "Dijkstra", "Quick Sort", "RSA"],
    correct: 2
  },
  {
    question: "Какой протокол обычно используется для защищенного веб-соединения?",
    answers: ["HTTP", "FTP", "HTTPS", "SMTP"],
    correct: 2
  },
  {
    question: "Сколько континентов обычно выделяют на Земле в школьной географии?",
    answers: ["5", "6", "7", "8"],
    correct: 2
  },
  {
    question: "Как называется структура данных с принципом LIFO?",
    answers: ["Очередь", "Стек", "Дерево", "Граф"],
    correct: 1
  }
];

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
  takeMoneyBtn: document.getElementById("take-money-btn")
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
  hint5050: "audio/hint-5050.mp3",
  hintAudience: "audio/hint-audience.mp3",
  hintCall: "audio/hint-call.mp3",
  gameWin: "audio/game-win.mp3",
  gameLose: "audio/game-lose.mp3"
};

const audioPlayers = {};

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
  player.currentTime = 0;
  player.play().catch(() => {
    // Ignore playback errors if file is absent or autoplay is blocked.
  });
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
  moneyLevels
    .slice()
    .reverse()
    .forEach((amount, reverseIndex) => {
      const originalIndex = moneyLevels.length - 1 - reverseIndex;
      const li = document.createElement("li");
      li.textContent = `${originalIndex + 1}. ${formatMoney(amount)}`;
      li.dataset.index = String(originalIndex);
      if (safeIndexes.includes(originalIndex)) {
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
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.type = "button";
    btn.dataset.idx = String(idx);
    btn.textContent = `${marks[idx]}: ${answer}`;
    btn.addEventListener("click", () => handleAnswer(idx));
    ui.answers.appendChild(btn);
  });

  ui.statusText.textContent = `Вопрос ${state.currentIndex + 1} на ${formatMoney(
    moneyLevels[state.currentIndex]
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
      btn.style.borderColor = "var(--accent)";
      btn.style.opacity = "1";
    }
  });

  ui.statusText.textContent = "Проверка ответа...";

  setTimeout(() => {
    answerButtons.forEach((btn) => {
      const idx = Number(btn.dataset.idx);
      if (idx === current.correct) {
        btn.classList.add("correct");
      }
      if (idx === selectedIdx && selectedIdx !== current.correct) {
        btn.classList.add("wrong");
      }
    });

    if (selectedIdx === current.correct) {
      playSound("answerCorrect");
      if (safeIndexes.includes(state.currentIndex)) {
        state.guaranteed = moneyLevels[state.currentIndex];
      }

      setTimeout(() => {
        state.currentIndex += 1;
        if (state.currentIndex >= questions.length) {
          playSound("gameWin");
          finishGame("Победа! Вы ответили на все вопросы.", moneyLevels[moneyLevels.length - 1]);
          return;
        }
        resetHintOutput();
        renderQuestion();
      }, POST_REVEAL_DELAY_MS);
    } else {
      playSound("answerWrong");
      setTimeout(() => {
        playSound("gameLose");
        finishGame("Неверный ответ.", state.guaranteed);
      }, POST_REVEAL_DELAY_MS);
    }
  }, ANSWER_REVEAL_DELAY_MS);
}

function takeMoney() {
  if (!state.started || state.gameOver) {
    return;
  }
  playSound("takeMoney");
  const won = moneyLevels[state.currentIndex - 1] || 0;
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
  state.started = true;
  state.gameOver = false;
  state.currentIndex = 0;
  state.guaranteed = 0;
  state.used5050 = false;
  state.usedAudience = false;
  state.usedCall = false;
  state.answerLocked = false;
  resetHintOutput();
  playSound("gameStart");
  renderQuestion();
}

ui.startBtn.addEventListener("click", startGame);
ui.takeMoneyBtn.addEventListener("click", takeMoney);
ui.hint5050.addEventListener("click", useHint5050);
ui.hintAudience.addEventListener("click", useHintAudience);
ui.hintCall.addEventListener("click", useHintCall);

buildMoneyLadder();
updateHintButtons();
