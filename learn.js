// learn.js - the learning portal: lessons, then a quiz, with saved progress.

const LOCALKEY = "phishcheck-progress";

// lessons = how many lessons are finished. answers = one true/false per quiz question answered.
let progress = { lessons: 0, answers: [] };
let learnState = { mode: "menu", lesson: 0 };

/**
 * Loads saved progress from this browser.
 */
function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCALKEY));
    if (saved && typeof saved.lessons === "number" && Array.isArray(saved.answers)) {
      progress = saved;
    }
  } catch (e) {
    // No saved progress, or storage is blocked. Start fresh.
  }
}

/**
 * Sets progress (for example from the cloud) and keeps a copy in this browser.
 *
 * Args:
 *   newProgress: an object with lessons and answers.
 */
function setProgress(newProgress) {
  progress = newProgress;
  try {
    localStorage.setItem(LOCALKEY, JSON.stringify(progress));
  } catch (e) {
    // Storage blocked. Progress will last until the page closes.
  }
}

/**
 * Saves progress here, and to the account if signed in.
 */
function saveProgress() {
  setProgress(progress);
  if (typeof cloudSaveProgress === "function") {
    cloudSaveProgress(progress);
  }
}

/**
 * Draws whichever learning screen we are on.
 */
function renderLearn() {
  const box = document.getElementById("learnbox");
  clear(box);
  if (learnState.mode === "lesson") {
    renderLesson(box);
  } else if (learnState.mode === "quiz") {
    renderQuiz(box);
  } else {
    renderMenu(box);
  }
}

/**
 * Makes a progress bar.
 *
 * Args:
 *   done: how many steps are done.
 *   total: how many steps there are.
 *
 * Returns:
 *   The bar element.
 */
function makeBar(done, total) {
  const bar = el("div", "meter");
  const fill = el("div", "fill");
  fill.style.width = Math.round((done / total) * 100) + "%";
  bar.appendChild(fill);
  return bar;
}

/**
 * Draws the menu: list of lessons and the quiz.
 *
 * Args:
 *   box: the element to draw into.
 */
function renderMenu(box) {
  const answered = progress.answers.length;
  const total = LESSONS.length + QUESTIONS.length;
  box.appendChild(el("h2", "", "Learn to spot scams"));
  box.appendChild(el("p", "lead", "Short lessons first, then a quiz. Your progress is saved."));
  box.appendChild(makeBar(progress.lessons + answered, total));

  const list = el("div", "menu");
  LESSONS.forEach(function (lesson, i) {
    const done = i < progress.lessons;
    const card = el("button", "menucard" + (done ? " done" : ""));
    card.type = "button";
    card.appendChild(el("span", "bigemoji", lesson.emoji));
    card.appendChild(el("span", "menutitle", "Lesson " + (i + 1) + ": " + lesson.title));
    card.appendChild(el("span", "tick", done ? "Done ✓" : "Start"));
    card.onclick = function () {
      learnState = { mode: "lesson", lesson: i };
      renderLearn();
    };
    list.appendChild(card);
  });

  const unlocked = progress.lessons >= LESSONS.length;
  const quiz = el("button", "menucard quizcard" + (unlocked ? "" : " locked"));
  quiz.type = "button";
  quiz.disabled = !unlocked;
  quiz.appendChild(el("span", "bigemoji", "🏆"));
  let label = "Quiz: " + QUESTIONS.length + " questions";
  let action = "Start";
  if (!unlocked) {
    action = "Finish the lessons to unlock";
  } else if (answered >= QUESTIONS.length) {
    action = "See your result";
  } else if (answered > 0) {
    action = "Continue (question " + (answered + 1) + ")";
  }
  quiz.appendChild(el("span", "menutitle", label));
  quiz.appendChild(el("span", "tick", action));
  quiz.onclick = function () {
    learnState = { mode: "quiz", lesson: 0 };
    renderLearn();
  };
  list.appendChild(quiz);
  box.appendChild(list);
}

/**
 * Draws one lesson page.
 *
 * Args:
 *   box: the element to draw into.
 */
function renderLesson(box) {
  const i = learnState.lesson;
  const lesson = LESSONS[i];
  box.appendChild(el("p", "step", "Lesson " + (i + 1) + " of " + LESSONS.length));
  box.appendChild(makeBar(i, LESSONS.length));
  box.appendChild(el("h2", "", lesson.emoji + " " + lesson.title));

  const teach = el("div", "teach");
  for (const paragraph of lesson.intro) {
    teach.appendChild(el("p", "", paragraph));
  }
  if (lesson.tips) {
    const list = el("ul", "tips");
    for (const tip of lesson.tips) {
      list.appendChild(el("li", "", tip));
    }
    teach.appendChild(list);
  }
  box.appendChild(teach);

  const nextButton = makeButton(i + 1 < LESSONS.length ? "Next lesson" : "Go to the quiz", "big", function () {
    progress.lessons = Math.max(progress.lessons, i + 1);
    saveProgress();
    if (i + 1 < LESSONS.length) {
      learnState = { mode: "lesson", lesson: i + 1 };
    } else {
      learnState = { mode: "quiz", lesson: 0 };
    }
    renderLearn();
    window.scrollTo(0, 0);
  });

  if (lesson.parts) {
    drawClues(box, lesson, nextButton);
  } else {
    drawSteps(box, lesson, nextButton);
  }

  const nav = el("div", "navrow");
  nav.appendChild(makeButton("Back to menu", "ghost", function () {
    learnState = { mode: "menu", lesson: 0 };
    renderLearn();
  }));
  nav.appendChild(nextButton);
  box.appendChild(nav);
}

/**
 * Draws the example email with tappable circled clues.
 *
 * Args:
 *   box: the element to draw into.
 *   lesson: the lesson object.
 *   nextButton: the Next button, unlocked when all clues are found.
 */
function drawClues(box, lesson, nextButton) {
  const total = lesson.parts.filter(function (p) { return p.note; }).length;
  let found = 0;
  nextButton.disabled = true;

  box.appendChild(el("p", "instruction", "Tap the red circles to see what is suspicious."));
  const email = el("div", "fakeemail");
  const counter = el("p", "counter", "Clues found: 0 of " + total);
  const bubble = el("div", "bubble", "🦉 Tap a circle and I will explain it.");
  bubble.setAttribute("aria-live", "polite");

  function reveal(button, part) {
    if (!button.classList.contains("found")) {
      button.classList.add("found");
      found++;
      counter.textContent = "Clues found: " + found + " of " + total;
    }
    bubble.textContent = "🦉 " + part.note;
    if (found >= total) {
      nextButton.disabled = false;
      counter.textContent = "You found all " + total + " clues. Well done!";
    }
  }

  const buttons = [];
  for (const part of lesson.parts) {
    if (part.note) {
      const clue = el("button", "clue", part.text);
      clue.type = "button";
      clue.onclick = function () { reveal(clue, part); };
      buttons.push({ button: clue, part: part });
      email.appendChild(clue);
    } else {
      email.appendChild(el("span", "", part.text));
    }
  }
  box.appendChild(email);
  box.appendChild(counter);
  box.appendChild(bubble);
  box.appendChild(makeButton("Show me all the clues", "ghost", function () {
    for (const b of buttons) {
      reveal(b.button, b.part);
    }
  }));
}

/**
 * Draws the tappable step cards (for the Stop, Check, Report lesson).
 *
 * Args:
 *   box: the element to draw into.
 *   lesson: the lesson object.
 *   nextButton: the Next button, unlocked when all cards are opened.
 */
function drawSteps(box, lesson, nextButton) {
  let opened = 0;
  nextButton.disabled = true;
  const grid = el("div", "steps");
  for (const step of lesson.steps) {
    const card = el("button", "stepcard");
    card.type = "button";
    card.appendChild(el("span", "bigemoji", step.emoji));
    card.appendChild(el("strong", "", step.title));
    const text = el("span", "steptext", "Tap to open");
    card.appendChild(text);
    card.onclick = function () {
      if (!card.classList.contains("open")) {
        card.classList.add("open");
        text.textContent = step.text;
        opened++;
        if (opened >= lesson.steps.length) {
          nextButton.disabled = false;
        }
      }
    };
    grid.appendChild(card);
  }
  box.appendChild(grid);
}

/**
 * Draws the current quiz question, or the result if all are answered.
 *
 * Args:
 *   box: the element to draw into.
 */
function renderQuiz(box) {
  const index = progress.answers.length;
  if (index >= QUESTIONS.length) {
    renderQuizResult(box);
    return;
  }
  const q = QUESTIONS[index];
  box.appendChild(el("p", "step", "Question " + (index + 1) + " of " + QUESTIONS.length));
  box.appendChild(makeBar(index, QUESTIONS.length));

  if (q.email) {
    const card = el("div", "fakeemail plain");
    card.textContent = "From: " + q.email.from + "\nSubject: " + q.email.subject + "\n\n" + q.email.text;
    box.appendChild(card);
  }
  box.appendChild(el("h2", "", q.prompt));

  const feedback = el("div", "bubble hidden");
  const choices = [];
  q.options.forEach(function (option, n) {
    const choice = makeButton(option, "choice", function () {
      const right = n === q.answer;
      progress.answers.push(right);
      saveProgress();
      for (const c of choices) {
        c.disabled = true;
      }
      choices[q.answer].classList.add("right");
      if (!right) {
        choice.classList.add("wrong");
      }
      feedback.classList.remove("hidden");
      feedback.textContent = (right ? "🦉 Correct! " : "🦉 Not quite. ") + q.why;
      nextRow.classList.remove("hidden");
    });
    choices.push(choice);
    box.appendChild(choice);
  });
  box.appendChild(feedback);

  const nextRow = el("div", "navrow hidden");
  nextRow.appendChild(makeButton("Next", "big", function () {
    renderLearn();
    window.scrollTo(0, 0);
  }));
  box.appendChild(nextRow);
}

/**
 * Draws the final result and badge.
 *
 * Args:
 *   box: the element to draw into.
 */
function renderQuizResult(box) {
  const score = progress.answers.filter(function (a) { return a; }).length;
  const percent = Math.round((score / QUESTIONS.length) * 100);
  let badge = "🌱 Keep practising";
  let message = "Go back over the lessons, then try again. Everyone starts somewhere.";
  if (percent >= 90) {
    badge = "🥇 Scam Spotter";
    message = "Brilliant. You can spot the tricks that fool most people.";
  } else if (percent >= 70) {
    badge = "🥈 Sharp Eyes";
    message = "Very good. Try again to catch the ones you missed.";
  }
  box.appendChild(el("h2", "", "Quiz finished"));
  box.appendChild(el("div", "badge", badge));
  box.appendChild(el("p", "lead", "You got " + score + " out of " + QUESTIONS.length + " (" + percent + "%). " + message));
  box.appendChild(makeBar(score, QUESTIONS.length));

  const nav = el("div", "navrow");
  nav.appendChild(makeButton("Try the quiz again", "big", function () {
    progress.answers = [];
    saveProgress();
    renderLearn();
  }));
  nav.appendChild(makeButton("Back to menu", "ghost", function () {
    learnState = { mode: "menu", lesson: 0 };
    renderLearn();
  }));
  box.appendChild(nav);
}
