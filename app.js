// app.js - connects the page to everything else.

let lastMessage = null;
let lastResult = null;
let authText = "";

/**
 * Shows one page ("home", "check", "learn" or "saved") and hides the others.
 *
 * Args:
 *   name: the page name.
 */
function showView(name) {
  for (const v of ["home", "check", "learn", "saved"]) {
    document.getElementById("view-" + v).hidden = v !== name;
  }
  document.querySelectorAll(".navbtn").forEach(function (b) {
    b.classList.toggle("active", b.dataset.view === name);
  });
  if (name === "learn") {
    renderLearn();
  }
  if (name === "saved") {
    renderSaved();
  }
  window.scrollTo(0, 0);
}

/**
 * Gets the text in a form box.
 *
 * Args:
 *   id: the element id.
 *
 * Returns:
 *   The text.
 */
function val(id) {
  return document.getElementById(id).value;
}

/**
 * Puts an email into the form boxes.
 *
 * Args:
 *   message: an object with from, replyTo, subject, body, authResults.
 */
function loadIntoForm(message) {
  document.getElementById("fromfield").value = message.from || "";
  document.getElementById("replyfield").value = message.replyTo || "";
  document.getElementById("subjectfield").value = message.subject || "";
  document.getElementById("bodyfield").value = message.body || "";
  authText = message.authResults || "";
}

/**
 * Reads the form and scores the email.
 */
function runCheck() {
  const message = {
    from: val("fromfield"),
    replyTo: val("replyfield"),
    subject: val("subjectfield"),
    body: val("bodyfield"),
    authResults: authText
  };
  const hint = document.getElementById("checkhint");
  if (message.from.trim() === "" && message.subject.trim() === "" && message.body.trim() === "") {
    hint.textContent = "Paste an email into the boxes first, or drop a saved email file above.";
    return;
  }
  hint.textContent = "";
  lastMessage = message;
  lastResult = analyse(message);
  renderResult(lastResult);
}

/**
 * Advice for each risk level.
 *
 * Args:
 *   level: "high", "medium" or "low".
 *
 * Returns:
 *   A list of sentences.
 */
function adviceFor(level) {
  const report = "Report it: forward scam emails to report@phishing.gov.uk (UK) or reportphishing@apwg.org (US), then delete it.";
  if (level === "low") {
    return [
      "Few warning signs were found, but scams are getting smarter and a low score is not a guarantee.",
      "If it asks for money or details you did not expect, contact the company directly using a number or website you already trust."
    ];
  }
  return [
    "Do not click links, open attachments or reply.",
    "If you think it could be real, contact the company using a phone number or website you already trust. Never use the ones in the email.",
    report
  ];
}

/**
 * Draws the score, the reasons and the advice.
 *
 * Args:
 *   result: the result from analyse.
 */
function renderResult(result) {
  const box = document.getElementById("result");
  box.hidden = false;
  box.className = "result " + result.level;
  document.getElementById("scorebutton").textContent = result.score + "%";
  document.getElementById("verdict").textContent = riskLabel(result.score);
  document.getElementById("meterfill").style.width = result.score + "%";
  document.getElementById("savestatus").textContent = "";

  const reasons = document.getElementById("reasons");
  clear(reasons);
  reasons.hidden = true;
  drawFindings(reasons, result.findings);

  const todo = document.getElementById("todo");
  clear(todo);
  for (const line of adviceFor(result.level)) {
    todo.appendChild(el("li", "", line));
  }
  box.scrollIntoView({ behavior: "smooth" });
}

/**
 * Draws a list of reasons into an element.
 *
 * Args:
 *   target: the element to draw into.
 *   findings: a list of findings.
 */
function drawFindings(target, findings) {
  if (findings.length === 0) {
    target.appendChild(el("p", "", "No warning signs found. That does not guarantee the email is safe."));
    return;
  }
  for (const f of findings) {
    const item = el("div", "reason");
    item.appendChild(el("strong", "", f.title + " (+" + f.points + ")"));
    item.appendChild(el("p", "", f.detail));
    const source = SOURCES[f.source];
    if (source && source.url !== "") {
      const link = el("a", "", "Source: " + source.name);
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener";
      item.appendChild(link);
    } else if (source) {
      item.appendChild(el("em", "", source.name));
    }
    target.appendChild(item);
  }
}

/**
 * Reads an email file the person chose or dropped.
 *
 * Args:
 *   file: a File object.
 */
function readEmlFile(file) {
  const hint = document.getElementById("checkhint");
  if (!file) {
    return;
  }
  if (file.size > 3000000) {
    hint.textContent = "That file is too big. Email files are usually under 1 MB.";
    return;
  }
  const reader = new FileReader();
  reader.onload = function () {
    loadIntoForm(parseEml(String(reader.result)));
    runCheck();
  };
  reader.onerror = function () {
    hint.textContent = "Could not read that file.";
  };
  reader.readAsText(file);
}

/**
 * Saves the current check to the account, or asks the person to sign in.
 */
async function saveCurrent() {
  const status = document.getElementById("savestatus");
  if (!lastResult) {
    return;
  }
  if (!cloudUser) {
    openAuth("Sign in to save this check.");
    return;
  }
  status.textContent = "Saving...";
  const error = await cloudSaveCheck(lastMessage, lastResult);
  status.textContent = error === "" ? "Saved. Find it under My saved checks." : "Could not save: " + error;
}

/**
 * Draws the "My saved checks" page.
 */
async function renderSaved() {
  const box = document.getElementById("savedbox");
  clear(box);
  if (!cloudUser) {
    box.appendChild(el("p", "lead", cloudReady ? "Sign in to see the emails you saved." : "Accounts are not switched on yet."));
    box.appendChild(makeButton("Sign in or create an account", "big", function () { openAuth(""); }));
    return;
  }
  box.appendChild(el("p", "", "Loading..."));
  const rows = await cloudLoadChecks();
  clear(box);
  if (rows.length === 0) {
    box.appendChild(el("p", "lead", "Nothing saved yet. Check an email, then press Save this check."));
    return;
  }
  for (const row of rows) {
    const level = riskLevel(row.score);
    const card = el("div", "savedcard " + level);
    const head = el("div", "savedhead");
    head.appendChild(el("span", "chip " + level, row.score + "%"));
    head.appendChild(el("span", "mailfrom", row.sender || "(no sender)"));
    head.appendChild(el("span", "mailsubject", row.subject || "(no subject)"));
    head.appendChild(el("span", "date", new Date(row.created_at).toLocaleDateString()));
    card.appendChild(head);

    const details = el("div", "reasons");
    details.hidden = true;
    drawFindings(details, row.findings || []);
    const buttons = el("div", "navrow");
    buttons.appendChild(makeButton("Show reasons", "ghost", function () { details.hidden = !details.hidden; }));
    buttons.appendChild(makeButton("Delete", "ghost", async function () {
      await cloudDeleteCheck(row.id);
      renderSaved();
    }));
    card.appendChild(buttons);
    card.appendChild(details);
    box.appendChild(card);
  }
}

/**
 * Opens the sign in box.
 *
 * Args:
 *   message: a line to show at the top, or "".
 */
function openAuth(message) {
  const text = document.getElementById("authmessage");
  if (!cloudReady || !db) {
    text.textContent = "Accounts are not switched on yet. The site owner needs to add Supabase settings in config.js.";
  } else {
    text.textContent = message;
  }
  openDialog(document.getElementById("authdialog"));
}

/**
 * Handles the sign in and create account buttons.
 *
 * Args:
 *   creating: true to create an account, false to sign in.
 */
async function submitAuth(creating) {
  const text = document.getElementById("authmessage");
  if (!db) {
    openAuth("");
    return;
  }
  const email = val("authemail").trim();
  const password = val("authpassword");
  if (email === "" || password.length < 6) {
    text.textContent = "Enter your email and a password of at least 6 characters.";
    return;
  }
  text.textContent = "One moment...";
  const result = creating ? await cloudSignUp(email, password) : await cloudSignIn(email, password);
  text.textContent = result.message;
  if (result.ok && cloudUser) {
    closeDialog(document.getElementById("authdialog"));
  }
}

/**
 * Updates the top-right account area.
 */
function updateAccountUI() {
  document.getElementById("whoami").textContent = cloudUser ? cloudUser.email : "";
  document.getElementById("accountbtn").textContent = cloudUser ? "Sign out" : "Sign in";
}

/**
 * Called when someone signs in or out. Also joins up quiz progress.
 *
 * Args:
 *   user: the user, or null when signed out.
 */
async function onAccountChange(user) {
  updateAccountUI();
  if (user) {
    const cloud = await cloudLoadProgress();
    const cloudSteps = cloud ? cloud.lessons + cloud.answers.length : -1;
    if (cloud && cloudSteps > progress.lessons + progress.answers.length) {
      setProgress(cloud);
    } else {
      cloudSaveProgress(progress);
    }
  }
  if (!document.getElementById("view-learn").hidden) {
    renderLearn();
  }
  if (!document.getElementById("view-saved").hidden) {
    renderSaved();
  }
}

// ---- wire everything up ----

document.querySelectorAll("[data-view]").forEach(function (b) {
  b.onclick = function () { showView(b.dataset.view); };
});
document.getElementById("checkbutton").onclick = runCheck;
document.getElementById("clearbutton").onclick = function () {
  loadIntoForm({});
  document.getElementById("result").hidden = true;
  document.getElementById("checkhint").textContent = "";
};
document.getElementById("scorebutton").onclick = function () {
  const reasons = document.getElementById("reasons");
  reasons.hidden = !reasons.hidden;
};
document.getElementById("savebutton").onclick = saveCurrent;

["fromfield", "bodyfield"].forEach(function (id) {
  document.getElementById(id).oninput = function () { authText = ""; };
});

const dropzone = document.getElementById("dropzone");
const emlInput = document.getElementById("eml");
emlInput.onchange = function () { readEmlFile(emlInput.files[0]); emlInput.value = ""; };
dropzone.ondragover = function (e) { e.preventDefault(); dropzone.classList.add("over"); };
dropzone.ondragleave = function () { dropzone.classList.remove("over"); };
dropzone.ondrop = function (e) {
  e.preventDefault();
  dropzone.classList.remove("over");
  readEmlFile(e.dataTransfer.files[0]);
};

document.getElementById("gmailbutton").onclick = connectGmail;
document.getElementById("gmaildisconnect").onclick = disconnectGmail;

document.getElementById("accountbtn").onclick = function () {
  if (cloudUser) {
    cloudSignOut();
  } else {
    openAuth("");
  }
};
document.getElementById("signinbutton").onclick = function () { submitAuth(false); };
document.getElementById("signupbutton").onclick = function () { submitAuth(true); };
document.getElementById("authclose").onclick = function () { closeDialog(document.getElementById("authdialog")); };

loadProgress();
startCloud();
