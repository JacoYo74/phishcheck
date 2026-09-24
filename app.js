// app.js - connects the page to the scanner and the learning portal.

function showTab(name) {
  document.getElementById("checkpage").hidden = name !== "check";
  document.getElementById("learnpage").hidden = name !== "learn";
  document.getElementById("tabcheck").classList.toggle("active", name === "check");
  document.getElementById("tablearn").classList.toggle("active", name === "learn");
}

function showResult(result) {
  document.getElementById("result").hidden = false;
  document.getElementById("scorebutton").textContent = result.score + "%";
  document.getElementById("label").textContent = riskLabel(result.score);

  const box = document.getElementById("reasons");
  box.textContent = "";
  box.hidden = true;

  if (result.findings.length === 0) {
    box.textContent = "No warning signs found. That does not guarantee the email is safe.";
  }

  for (const f of result.findings) {
    const item = document.createElement("div");
    item.className = "reason";

    const title = document.createElement("strong");
    title.textContent = f.title + " (+" + f.points + ")";
    item.appendChild(title);

    const detail = document.createElement("p");
    detail.textContent = f.detail;
    item.appendChild(detail);

    const source = SOURCES[f.source];
    if (source.url !== "") {
      const link = document.createElement("a");
      link.href = source.url;
      link.textContent = "Source: " + source.name;
      link.target = "_blank";
      link.rel = "noopener";
      item.appendChild(link);
    } else {
      const note = document.createElement("em");
      note.textContent = source.name;
      item.appendChild(note);
    }
    box.appendChild(item);
  }
}

document.getElementById("tabcheck").onclick = function () { showTab("check"); };
document.getElementById("tablearn").onclick = function () { showTab("learn"); };

document.getElementById("checkbutton").onclick = function () {
  const from = document.getElementById("fromfield").value;
  const subject = document.getElementById("subjectfield").value;
  const body = document.getElementById("bodyfield").value;
  showResult(analyse(from, subject, body));
};

document.getElementById("scorebutton").onclick = function () {
  const box = document.getElementById("reasons");
  box.hidden = !box.hidden;
};

startLesson();
showQuestion();
