// gmail.js - connect a Gmail account and check the latest emails.
// Emails go from Google straight to this page in your browser. They are not sent to any server of ours.
// Needs a Google client ID in config.js. See README for setup.

const GMAILSCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const GMAILCOUNT = 10;
let gmailToken = "";
let gmailChecked = [];

/**
 * Shows a message under the Gmail button.
 *
 * Args:
 *   text: the message.
 */
function gmailStatus(text) {
  document.getElementById("gmailstatus").textContent = text;
}

/**
 * Asks Google for permission to read the inbox (read only).
 */
function connectGmail() {
  if (GOOGLECLIENTID.indexOf(".apps.googleusercontent.com") === -1) {
    gmailStatus("Gmail is not switched on yet. The site owner needs to add a Google client ID in config.js.");
    return;
  }
  if (typeof google === "undefined") {
    gmailStatus("Google sign-in has not loaded yet. Wait a moment and try again.");
    return;
  }
  const client = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLECLIENTID,
    scope: GMAILSCOPE,
    callback: function (response) {
      if (response.error) {
        gmailStatus("Google said no: " + response.error);
        return;
      }
      gmailToken = response.access_token;
      scanInbox();
    },
    error_callback: function (err) {
      gmailStatus("Could not connect: " + (err.type || "unknown problem"));
    }
  });
  client.requestAccessToken({ prompt: "consent" });
}

/**
 * Asks the Gmail service for something.
 *
 * Args:
 *   path: the part of the address after users/me/.
 *
 * Returns:
 *   The answer as an object.
 */
async function gmailGet(path) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/" + path, {
    headers: { Authorization: "Bearer " + gmailToken }
  });
  if (!response.ok) {
    throw new Error("Gmail answered with error " + response.status);
  }
  return response.json();
}

/**
 * Turns Gmail's web-safe base64 into text.
 *
 * Args:
 *   data: base64url text.
 *
 * Returns:
 *   The decoded text.
 */
function fromBase64Url(data) {
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return bytesToText(base64ToBytes(b64), "utf-8");
}

/**
 * Finds the text of a given type inside a Gmail message.
 *
 * Args:
 *   part: a message part.
 *   mime: like "text/plain".
 *
 * Returns:
 *   The text, or "" if there is none.
 */
function findPart(part, mime) {
  if (part.mimeType === mime && part.body && part.body.data) {
    return fromBase64Url(part.body.data);
  }
  for (const child of part.parts || []) {
    const text = findPart(child, mime);
    if (text !== "") {
      return text;
    }
  }
  return "";
}

/**
 * Collects the file names of attachments in a Gmail message.
 *
 * Args:
 *   part: a message part.
 *
 * Returns:
 *   A list of file names.
 */
function findFiles(part) {
  let files = part.filename ? [part.filename] : [];
  for (const child of part.parts || []) {
    files = files.concat(findFiles(child));
  }
  return files;
}

/**
 * Turns a Gmail message into the same shape the scanner uses.
 *
 * Args:
 *   msg: a message from the Gmail service.
 *
 * Returns:
 *   An object with from, replyTo, subject, body and authResults.
 */
function parseGmail(msg) {
  const headers = {};
  for (const h of msg.payload.headers || []) {
    const name = h.name.toLowerCase();
    headers[name] = headers[name] ? headers[name] + " " + h.value : h.value;
  }
  let body = findPart(msg.payload, "text/plain");
  if (body === "") {
    body = stripHtml(findPart(msg.payload, "text/html"));
  }
  const files = findFiles(msg.payload);
  if (files.length > 0) {
    body += "\n\nAttachments: " + files.join(", ");
  }
  return {
    from: decodeWords(headers["from"] || ""),
    replyTo: decodeWords(headers["reply-to"] || ""),
    subject: decodeWords(headers["subject"] || ""),
    body: body.trim(),
    authResults: headers["authentication-results"] || ""
  };
}

/**
 * Reads the latest inbox emails, scores each one, and lists them worst first.
 */
async function scanInbox() {
  gmailStatus("Reading your latest " + GMAILCOUNT + " emails...");
  document.getElementById("gmaildisconnect").hidden = false;
  try {
    const list = await gmailGet("messages?maxResults=" + GMAILCOUNT + "&labelIds=INBOX");
    gmailChecked = [];
    for (const item of list.messages || []) {
      const full = await gmailGet("messages/" + item.id + "?format=full");
      const message = parseGmail(full);
      gmailChecked.push({ message: message, result: analyse(message) });
    }
    gmailChecked.sort(function (a, b) { return b.result.score - a.result.score; });
    gmailStatus(gmailChecked.length === 0 ? "No emails found in your inbox." : "Checked " + gmailChecked.length + " emails, riskiest first. Tap one to see why.");
    drawGmailList();
  } catch (err) {
    gmailStatus("Something went wrong: " + err.message + ". Try connecting again.");
  }
}

/**
 * Draws the list of checked Gmail emails.
 */
function drawGmailList() {
  const box = document.getElementById("gmaillist");
  clear(box);
  for (const item of gmailChecked) {
    const row = el("button", "mailrow " + item.result.level);
    row.type = "button";
    row.appendChild(el("span", "chip " + item.result.level, item.result.score + "%"));
    row.appendChild(el("span", "mailfrom", item.message.from || "(no sender)"));
    row.appendChild(el("span", "mailsubject", item.message.subject || "(no subject)"));
    row.onclick = function () {
      loadIntoForm(item.message);
      runCheck();
      document.getElementById("result").scrollIntoView({ behavior: "smooth" });
    };
    box.appendChild(row);
  }
}

/**
 * Disconnects Gmail and forgets the emails.
 */
function disconnectGmail() {
  if (gmailToken !== "" && typeof google !== "undefined") {
    google.accounts.oauth2.revoke(gmailToken, function () {});
  }
  gmailToken = "";
  gmailChecked = [];
  clear(document.getElementById("gmaillist"));
  document.getElementById("gmaildisconnect").hidden = true;
  gmailStatus("Disconnected. Your emails were not stored anywhere.");
}
