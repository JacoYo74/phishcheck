// eml.js - reads saved email files (.eml) and turns them into plain text.
// Also used to clean up HTML emails from Gmail.

/**
 * Turns bytes into text.
 *
 * Args:
 *   bytes: a Uint8Array.
 *   charset: like "utf-8", or "" for the default.
 *
 * Returns:
 *   The text.
 */
function bytesToText(bytes, charset) {
  try {
    return new TextDecoder(charset || "utf-8").decode(bytes);
  } catch (e) {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

/**
 * Turns base64 into bytes.
 *
 * Args:
 *   b64: base64 text (spaces and new lines are fine).
 *
 * Returns:
 *   A Uint8Array.
 */
function base64ToBytes(b64) {
  const bin = atob(b64.replace(/\s+/g, ""));
  return Uint8Array.from(bin, function (c) { return c.charCodeAt(0); });
}

/**
 * Decodes quoted-printable text (the =3D and =E2=80=99 style).
 *
 * Args:
 *   text: the encoded text.
 *   charset: like "utf-8".
 *
 * Returns:
 *   The decoded text.
 */
function decodeQuoted(text, charset) {
  const joined = text.replace(/=\n/g, "");
  return joined.replace(/(?:=[0-9A-Fa-f]{2})+/g, function (run) {
    const bytes = [];
    for (let i = 0; i < run.length; i += 3) {
      bytes.push(parseInt(run.slice(i + 1, i + 3), 16));
    }
    return bytesToText(Uint8Array.from(bytes), charset);
  });
}

/**
 * Decodes header words like =?UTF-8?B?...?=
 *
 * Args:
 *   value: a header value.
 *
 * Returns:
 *   The readable text.
 */
function decodeWords(value) {
  const tight = value.replace(/\?=\s+=\?/g, "?==?");
  return tight.replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g, function (all, charset, kind, text) {
    try {
      if (kind.toLowerCase() === "b") {
        return bytesToText(base64ToBytes(text), charset);
      }
      return decodeQuoted(text.replace(/_/g, " "), charset);
    } catch (e) {
      return all;
    }
  });
}

/**
 * Reads header lines into an object with lowercase names.
 *
 * Args:
 *   headText: the header block.
 *
 * Returns:
 *   An object like { "from": "...", "subject": "..." }.
 */
function parseHeaders(headText) {
  const unfolded = headText.replace(/\n[ \t]+/g, " ");
  const headers = {};
  for (const line of unfolded.split("\n")) {
    const at = line.indexOf(":");
    if (at < 1) {
      continue;
    }
    const name = line.slice(0, at).trim().toLowerCase();
    const value = line.slice(at + 1).trim();
    headers[name] = headers[name] ? headers[name] + " " + value : value;
  }
  return headers;
}

/**
 * Splits a message into headers and body at the first blank line.
 *
 * Args:
 *   text: the message text with \n line endings.
 *
 * Returns:
 *   An object with headers and body.
 */
function splitMessage(text) {
  const at = text.indexOf("\n\n");
  if (at === -1) {
    return { headers: parseHeaders(text), body: "" };
  }
  return { headers: parseHeaders(text.slice(0, at)), body: text.slice(at + 2) };
}

/**
 * Decodes a body using its transfer encoding.
 *
 * Args:
 *   headers: the part's headers.
 *   raw: the raw body text.
 *
 * Returns:
 *   The readable text.
 */
function decodeBody(headers, raw) {
  const encoding = (headers["content-transfer-encoding"] || "").toLowerCase().trim();
  const charsetMatch = (headers["content-type"] || "").match(/charset="?([^";\s]+)/i);
  const charset = charsetMatch ? charsetMatch[1] : "utf-8";
  try {
    if (encoding === "base64") {
      return bytesToText(base64ToBytes(raw), charset);
    }
    if (encoding === "quoted-printable") {
      return decodeQuoted(raw, charset);
    }
  } catch (e) {
    return raw;
  }
  return raw;
}

/**
 * Turns an HTML email into plain text, keeping link addresses.
 *
 * A link shows up as: text [https://real-address]
 *
 * Args:
 *   html: the HTML text.
 *
 * Returns:
 *   Plain text.
 */
function stripHtml(html) {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "$2 [$1]")
    .replace(/<(br|\/p|\/div|\/tr|\/li|\/h\d)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

/**
 * Finds the plain and HTML text inside a message, including nested parts.
 *
 * Args:
 *   headers: the headers of this part.
 *   raw: the raw body of this part.
 *
 * Returns:
 *   An object with plain, html and files (attachment names).
 */
function getBodies(headers, raw) {
  const typeHeader = headers["content-type"] || "text/plain";
  const type = typeHeader.toLowerCase();
  const result = { plain: "", html: "", files: [] };

  if (type.indexOf("multipart/") === 0) {
    const boundary = typeHeader.match(/boundary="?([^";]+)"?/i);
    if (!boundary) {
      return result;
    }
    const pieces = raw.split("--" + boundary[1]);
    for (let i = 1; i < pieces.length; i++) {
      const piece = pieces[i].replace(/^\n/, "");
      if (piece.indexOf("--") === 0) {
        continue;
      }
      const part = splitMessage(piece);
      const inner = getBodies(part.headers, part.body);
      if (result.plain === "") {
        result.plain = inner.plain;
      }
      if (result.html === "") {
        result.html = inner.html;
      }
      result.files = result.files.concat(inner.files);
    }
    return result;
  }

  const nameMatch = ((headers["content-disposition"] || "") + " " + typeHeader).match(/name="?([^";]+)"?/i);
  if (nameMatch && type.indexOf("text/") !== 0) {
    result.files.push(nameMatch[1]);
  } else if (type.indexOf("text/html") === 0) {
    result.html = decodeBody(headers, raw);
  } else if (type.indexOf("text/plain") === 0) {
    result.plain = decodeBody(headers, raw);
  }
  return result;
}

/**
 * Reads the text of a saved .eml file.
 *
 * Args:
 *   text: the whole file as text.
 *
 * Returns:
 *   An object with from, replyTo, subject, body and authResults.
 */
function parseEml(text) {
  const normal = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const top = splitMessage(normal);
  const bodies = getBodies(top.headers, top.body);
  let body = bodies.plain !== "" ? bodies.plain : stripHtml(bodies.html);
  body = body.trim();
  if (bodies.files.length > 0) {
    body += "\n\nAttachments: " + bodies.files.join(", ");
  }
  return {
    from: decodeWords(top.headers["from"] || ""),
    replyTo: decodeWords(top.headers["reply-to"] || ""),
    subject: decodeWords(top.headers["subject"] || ""),
    body: body,
    authResults: top.headers["authentication-results"] || ""
  };
}

if (typeof module !== "undefined") {
  module.exports = { parseEml, stripHtml };
}
