// learn.js - the learning portal.

// The fake email. Parts with a flag number get circled.
const LESSONPARTS = [
  { text: "From: " },
  { text: "micr0soft-support@gmail.com", flag: 1 },
  { text: "\nSubject: " },
  { text: "URGENT: Your account will be closed", flag: 2 },
  { text: "\n\n" },
  { text: "Dear customer,", flag: 3 },
  { text: "\n\nWe noticed unusual activity. " },
  { text: "Kindly verify your password within 24 hours", flag: 4 },
  { text: " or your account will be closed.\n\nClick here: " },
  { text: "http://bit.ly/x8fj2", flag: 5 }
];

const LESSONNOTES = [
  "The sender is not Microsoft. It is a free Gmail address, and the 0 in 'micr0soft' is a number pretending to be a letter.",
  "Scary, urgent subject lines are designed to make you panic.",
  "A real company usually uses your name. 'Dear customer' means it was sent to thousands of people.",
  "Real companies never ask for your password by email, and short deadlines are a pressure tactic.",
  "Shortened links hide where you will really end up. Never click them in a message like this."
];

const QUESTIONS = [
  { from: "HMRC <refunds@hmrc-tax-gov.co>",
    text: "You are owed a tax refund of £412. Claim within 24 hours: http://hmrc-tax-gov.co/claim",
    isScam: true,
    why: "The real HMRC uses gov.uk addresses. This one is a copy, and the 24 hour deadline is pressure." },
  { from: "Amazon <order-update@amazon.co.uk>",
    text: "Your order has shipped. You can track it any time in Your Orders on the Amazon website or app.",
    isScam: false,
    why: "The address is really Amazon's, it asks for nothing, and it tells you to go to the site yourself." },
  { from: "Mr Adebayo <barrister.adebayo@yahoo.com>",
    text: "You have been named in an inheritance of 4.5 million pounds. Send your bank details to claim it.",
    isScam: true,
    why: "Unexpected money plus a request for bank details is a classic scam." },
  { from: "Barclays <alerts@barclays.co.uk>",
    text: "We spotted a payment on your card. If it was not you, call the number on the back of your card. We will never ask for your PIN.",
    isScam: false,
    why: "It does not ask for details, and it sends you to a number you already trust." }
];

let quizIndex = 0;
let quizScore = 0;

/**
 * Makes a button with text and a click action.
 *
 * Args:
 *   label: the text on the button.
 *   action: the function to run when clicked.
 *
 * Returns:
 *   The button element.
 */
function makeButton(label, action) {
  const button = document.createElement("button");
  button.textContent = label;
  button.onclick = action;
  return button;
}

/**
 * Draws the fake email with circles and the numbered notes below it.
 */
function startLesson() {
  const lesson = document.getElementById("lesson");
  const email = document.createElement("div");
  email.className = "fakeemail";
  for (const part of LESSONPARTS) {
    const span = document.createElement("span");
    span.textContent = part.text;
    if (part.flag) {
      span.className = "flagged";
      const badge = document.createElement("sup");
      badge.className = "badge";
      badge.textContent = part.flag;
      email.appendChild(span);
      email.appendChild(badge);
    } else {
      email.appendChild(span);
    }
  }
  lesson.appendChild(email);

  const list = document.createElement("ol");
  for (const note of LESSONNOTES) {
    const item = document.createElement("li");
    item.textContent = note;
    list.appendChild(item);
  }
  lesson.appendChild(list);
}

/**
 * Shows the current quiz question, or the final score.
 */
function showQuestion() {
  const box = document.getElementById("quiz");
  box.textContent = "";
  box.className = "quizbox";

  if (quizIndex >= QUESTIONS.length) {
    box.textContent = "Finished! You got " + quizScore + " out of " + QUESTIONS.length + ". ";
    box.appendChild(makeButton("Try again", function () {
      quizIndex = 0;
      quizScore = 0;
      showQuestion();
    }));
    return;
  }

  const q = QUESTIONS[quizIndex];
  const info = document.createElement("p");
  info.style.whiteSpace = "pre-wrap";
  info.textContent = "Question " + (quizIndex + 1) + " of " + QUESTIONS.length + "\n\nFrom: " + q.from + "\n\n" + q.text;
  box.appendChild(info);

  const feedback = document.createElement("p");

  function answer(saidScam) {
    const right = saidScam === q.isScam;
    if (right) {
      quizScore++;
    }
    feedback.className = right ? "good" : "bad";
    feedback.textContent = (right ? "Correct! " : "Not quite. ") + q.why;
    box.appendChild(makeButton("Next question", function () {
      quizIndex++;
      showQuestion();
    }));
  }

  box.appendChild(makeButton("Scam", function () { answer(true); }));
  box.appendChild(makeButton("Legit", function () { answer(false); }));
  box.appendChild(feedback);
}
