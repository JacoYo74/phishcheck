// scanner.js - scores an email using warning-sign rules.
// Runs in the browser. Also runs in Node so it can be tested.
// Every rule names its source. See RESEARCH.md for what each source says.

const MAXSCORE = 100;

const SOURCES = {
  NCSCSPOT: { name: "UK NCSC: How to spot a scam email, text or call", url: "https://www.ncsc.gov.uk/collection/phishing-scams/spot-scams" },
  NCSC: { name: "UK NCSC: Phishing scams", url: "https://www.ncsc.gov.uk/collection/phishing-scams" },
  FTC: { name: "US FTC: How to recognize and avoid phishing scams", url: "https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams" },
  NETCRAFT: { name: "Netcraft: What is typosquatting?", url: "https://www.netcraft.com/resources/glossary/typosquatting" },
  OWN: { name: "Our own judgement (common advice, no single source yet)", url: "" },
  WEAK: { name: "Weak evidence, see RESEARCH.md", url: "" }
};

// Companies scammers copy, with their real website names.
const BRANDS = {
  microsoft: ["microsoft.com", "microsoftonline.com", "office.com", "office365.com"],
  apple: ["apple.com"],
  samsung: ["samsung.com"],
  google: ["google.com"],
  amazon: ["amazon.com", "amazon.co.uk", "amazon.de", "amazon.fr", "amazon.es", "amazon.it", "amazon.ca"],
  paypal: ["paypal.com", "paypal.co.uk"],
  netflix: ["netflix.com"],
  facebook: ["facebook.com", "facebookmail.com"],
  instagram: ["instagram.com"],
  whatsapp: ["whatsapp.com"],
  linkedin: ["linkedin.com"],
  ebay: ["ebay.com", "ebay.co.uk"],
  spotify: ["spotify.com"],
  dropbox: ["dropbox.com"],
  docusign: ["docusign.com", "docusign.net"],
  adobe: ["adobe.com"],
  coinbase: ["coinbase.com"],
  binance: ["binance.com"],
  revolut: ["revolut.com"],
  monzo: ["monzo.com"],
  dhl: ["dhl.com", "dhl.de", "dhl.co.uk"],
  fedex: ["fedex.com"],
  ups: ["ups.com"],
  evri: ["evri.com"],
  royalmail: ["royalmail.com"],
  hmrc: ["hmrc.gov.uk", "gov.uk"],
  dvla: ["dvla.gov.uk", "gov.uk"],
  irs: ["irs.gov"],
  barclays: ["barclays.co.uk", "barclays.com"],
  hsbc: ["hsbc.co.uk", "hsbc.com"],
  lloyds: ["lloydsbank.co.uk", "lloydsbank.com", "lloydsbankinggroup.com"]
};

// Free email services. A real company does not send official mail from these.
const FREEMAIL = ["gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "hotmail.co.uk", "yahoo.com", "yahoo.co.uk", "aol.com", "icloud.com", "proton.me", "protonmail.com", "mail.com"];
const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "cutt.ly", "rebrand.ly", "shorturl.at"];

// Words scammers add next to a brand name, like paypalsecure.com
const PHISHWORDS = ["secure", "security", "support", "login", "signin", "verify", "verification", "account", "accounts", "service", "services", "help", "billing", "update", "alert", "alerts", "team", "care", "customer", "online", "mail", "pay", "payment", "refund", "delivery", "notice", "official", "center", "centre", "bank", "id", "web", "app"];

// Real words or names that are one letter away from a brand. Never flag these.
const SAFEWORDS = ["apply", "ample", "lloyd", "barclay", "revolt", "apples"];

// Look-alike characters scammers swap in.
const LOOKALIKES = { "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "$": "s", "@": "a" };

// Word rules. Each adds its points once, however many words match.
const TEXTRULES = [
  { title: "Claims to be someone official", points: 10, source: "NCSCSPOT",
    words: ["tax office", "fraud department", "security team", "legal action", "court order", "police", "customs", "hmrc", "support team", "your bank"],
    detail: "Scammers pretend to be banks, government or support teams so you trust them." },
  { title: "Urgent or pressuring language", points: 15, source: "NCSCSPOT",
    words: ["urgent", "immediately", "within 24 hours", "within 48 hours", "act now", "final notice", "last warning", "expires today", "as soon as possible", "right away", "limited time", "respond now", "today only"],
    detail: "A tiny deadline stops you from thinking or checking." },
  { title: "Fear and threats", points: 15, source: "NCSCSPOT",
    words: ["account suspended", "account will be closed", "account has been locked", "account will be suspended", "unusual activity", "suspicious activity", "unauthorised", "unauthorized", "security alert", "will be fined", "will be terminated", "permanently deleted", "been compromised", "been hacked"],
    detail: "Scary messages make people click first and think later." },
  { title: "Too-good-to-be-true offer", points: 20, source: "NCSCSPOT",
    words: ["you have won", "you've won", "winner", "lottery", "claim your prize", "cash prize", "inheritance", "free gift", "tax refund", "you are owed", "unclaimed funds"],
    detail: "Unexpected prizes and money are classic bait." },
  { title: "Asks for private details", points: 20, source: "FTC",
    words: ["your password", "pin number", "card number", "bank details", "security code", "cvv", "verify your identity", "confirm your details", "verify your account", "confirm your account", "social security", "national insurance number", "sort code", "login details", "update your payment", "update your billing"],
    detail: "Real companies do not ask for these by email." },
  { title: "Impersonal greeting", points: 10, source: "OWN",
    words: ["dear customer", "dear user", "dear account holder", "dear valued", "dear sir/madam", "dear sir or madam", "dear client", "dear member", "dear friend", "dear taxpayer"],
    detail: "Mass-sent scams do not know your name." },
  { title: "Unusual way to pay", points: 25, source: "OWN",
    words: ["gift card", "bitcoin", "wire transfer", "western union", "moneygram", "itunes card", "google play card", "crypto"],
    detail: "Scammers prefer payments that are hard to trace or reverse." },
  { title: "Risky attachment or file type", points: 20, source: "FTC",
    words: ["enable macros", "enable content", "enable editing", "attached invoice", "open the attachment", ".exe", ".scr", ".iso", ".docm", ".xlsm", ".zip"],
    detail: "Clicking links or opening attachments can install harmful software." },
  { title: "Asks you to scan a QR code", points: 15, source: "NCSCSPOT",
    words: ["scan the qr", "scan this qr", "qr code", "scan the code"],
    detail: "Criminals increasingly hide scam links behind QR codes in emails." },
  { title: "The word 'kindly'", points: 5, source: "WEAK",
    words: ["kindly"],
    detail: "Often reported as a scam habit, but real people use it too, so it adds very little." }
];

/**
 * Swaps look-alike digits and symbols back to letters.
 *
 * Scammers write micr0soft, app1e or s4msung. This undoes that.
 *
 * Args:
 *   text: the text to fix.
 *
 * Returns:
 *   The text with 0 1 3 4 5 7 8 $ @ changed to o l e a s t b s a.
 */
function fixChars(text) {
  let out = "";
  for (const ch of text) {
    out += LOOKALIKES[ch] || ch;
  }
  return out;
}

/**
 * Counts how many single-letter edits turn one word into another.
 *
 * Args:
 *   a: the first word.
 *   b: the second word.
 *
 * Returns:
 *   The number of inserts, deletes or swaps needed.
 */
function distance(a, b) {
  const rows = [];
  for (let i = 0; i <= a.length; i++) {
    rows.push([i]);
  }
  for (let j = 1; j <= b.length; j++) {
    rows[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
    }
  }
  return rows[a.length][b.length];
}

/**
 * Splits text into lowercase letter-and-number words.
 *
 * Args:
 *   text: any text, like an address.
 *
 * Returns:
 *   A list of words.
 */
function splitWords(text) {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(function (w) { return w.length > 0; });
}

/**
 * Checks if a word is a brand, or a brand plus a scam word.
 *
 * Args:
 *   word: the word to test.
 *   brand: a key of BRANDS.
 *
 * Returns:
 *   True for "paypal" or "paypalsecure", false otherwise.
 */
function matchesBrand(word, brand) {
  if (word === brand) {
    return true;
  }
  if (brand.length < 5) {
    return false;
  }
  if (word.startsWith(brand) && PHISHWORDS.includes(word.slice(brand.length))) {
    return true;
  }
  if (word.endsWith(brand) && PHISHWORDS.includes(word.slice(0, word.length - brand.length))) {
    return true;
  }
  return false;
}

/**
 * Finds a brand that a word is copying.
 *
 * Catches the plain name, look-alike digits (app1e, s4msung), rn for m,
 * and one or two letters changed (gooogle, amazom).
 *
 * Args:
 *   word: one word from an address or name.
 *
 * Returns:
 *   An object with brand and kind ("plain", "disguised" or "close"),
 *   or null if the word does not copy a brand.
 */
function findBrand(word) {
  const w = word.toLowerCase();
  if (w.length < 3) {
    return null;
  }
  const fixed = fixChars(w);
  const variants = [fixed, fixed.replace(/rn/g, "m").replace(/vv/g, "w")];

  for (const brand in BRANDS) {
    if (matchesBrand(w, brand)) {
      return { brand: brand, kind: "plain" };
    }
  }
  for (const brand in BRANDS) {
    for (const v of variants) {
      if (matchesBrand(v, brand)) {
        return { brand: brand, kind: "disguised" };
      }
    }
  }
  if (SAFEWORDS.includes(w)) {
    return null;
  }
  for (const brand in BRANDS) {
    if (brand.length < 5) {
      continue;
    }
    const limit = brand.length >= 8 ? 2 : 1;
    for (const v of [w].concat(variants)) {
      const d = distance(v, brand);
      if (d > 0 && d <= limit && Math.abs(v.length - brand.length) <= limit) {
        return { brand: brand, kind: "close" };
      }
    }
  }
  return null;
}

/**
 * Checks if a website name really belongs to a brand.
 *
 * Args:
 *   domain: like "mail.amazon.co.uk".
 *   brand: a key of BRANDS.
 *
 * Returns:
 *   True if it is one of the brand's real websites.
 */
function isOfficial(domain, brand) {
  for (const official of BRANDS[brand]) {
    if (domain === official || domain.endsWith("." + official)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if two website names belong to the same site.
 *
 * Args:
 *   a: the first domain.
 *   b: the second domain.
 *
 * Returns:
 *   True if they match or one is a sub-part of the other.
 */
function sameSite(a, b) {
  return a === b || a.endsWith("." + b) || b.endsWith("." + a);
}

/**
 * Capitalises the first letter.
 *
 * Args:
 *   word: any word.
 *
 * Returns:
 *   The word with a capital first letter.
 */
function capital(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Checks the sender details.
 *
 * Args:
 *   from: the From text, like "Name <name@example.com>".
 *   replyTo: the Reply-To text, or "".
 *   authResults: the Authentication-Results header, or "".
 *
 * Returns:
 *   A list of findings (points, title, detail, source).
 */
function checkSender(from, replyTo, authResults) {
  const findings = [];
  if (from.trim() !== "") {
    const match = from.match(/([^\s<>"',;()]+)@([^\s<>"',;()]+\.[^\s<>"',;()]+)/);
    if (!match) {
      findings.push({ points: 10, title: "No readable sender address", detail: "We could not find an email address in the From box.", source: "NCSC" });
    } else {
      addSenderFindings(findings, from, match);
    }
  }

  if (replyTo.trim() !== "" && from.trim() !== "") {
    const a = from.match(/@([^\s<>"',;()]+)/);
    const b = replyTo.match(/@([^\s<>"',;()]+)/);
    if (a && b && !sameSite(a[1].toLowerCase(), b[1].toLowerCase())) {
      findings.push({ points: 15, title: "Replies go to a different address", detail: "The email is from " + a[1].toLowerCase() + " but replies would go to " + b[1].toLowerCase() + ".", source: "OWN" });
    }
  }

  const failed = authResults.match(/\b(spf|dkim|dmarc)=(fail|softfail|permerror)/i);
  if (failed) {
    findings.push({ points: 25, title: "Failed the sender check", detail: "The email's own security headers say " + failed[1].toUpperCase() + " " + failed[2].toLowerCase() + ". That usually means the sender is not who they claim to be.", source: "OWN" });
  }
  return findings;
}

/**
 * Adds findings about the sender name and address.
 *
 * Args:
 *   findings: the list to add to.
 *   from: the From text.
 *   match: the address match (local part and domain).
 */
function addSenderFindings(findings, from, match) {
  const local = match[1].toLowerCase();
  const domain = match[2].toLowerCase();
  const address = local + "@" + domain;
  const name = from.slice(0, from.indexOf(match[0])).replace(/[<>"']/g, " ");

  if (/[^\x00-\x7f]/.test(domain) || domain.includes("xn--")) {
    findings.push({ points: 25, title: "Letters from another alphabet in the address", detail: address + " may use look-alike letters from another alphabet (for example a Cyrillic o instead of a normal o).", source: "NETCRAFT" });
  }

  const places = [
    { where: "sender name", words: splitWords(name).concat([name.toLowerCase().replace(/[^a-z0-9]/g, "")]) },
    { where: "address", words: splitWords(local) },
    { where: "website part of the address", words: splitWords(domain) }
  ];

  let hit = null;
  for (const place of places) {
    for (const word of place.words) {
      const found = findBrand(word);
      if (found && !isOfficial(domain, found.brand)) {
        // Keep the first hit, but a disguised spelling is more telling than a plain name.
        if (hit === null || (hit.kind === "plain" && found.kind !== "plain")) {
          hit = { brand: found.brand, kind: found.kind, word: word, where: place.where };
        }
      }
    }
  }
  if (hit === null) {
    return;
  }

  const how = hit.kind === "plain" ? "the name" : "a disguised version of the name";
  let detail = "The " + hit.where + ' contains "' + hit.word + '", which is ' + how + " " + capital(hit.brand) + ". But " + address + " is not a real " + capital(hit.brand) + " address.";
  if (FREEMAIL.includes(domain)) {
    detail += " Real companies do not send official emails from free services like " + domain + ".";
  }
  findings.push({ points: 35, title: "Sender pretends to be a known company", detail: detail, source: "NETCRAFT" });

  if (hit.kind !== "plain") {
    findings.push({ points: 25, title: "Disguised spelling of a company name", detail: 'Scammers swap letters for look-alike numbers (0 for o, 1 for l) or change a letter or two, like "' + hit.word + '", hoping you will not notice.', source: "NETCRAFT" });
  }
}

/**
 * Makes a copy of the text with disguised words un-disguised.
 *
 * Only words that mix letters with digits or symbols are changed,
 * so p@ssword becomes password but 2024 stays 2024.
 *
 * Args:
 *   text: lowercase text.
 *
 * Returns:
 *   The cleaned text.
 */
function cleanText(text) {
  return text.replace(/[a-z0-9@$]+/g, function (token) {
    if (/[a-z]/.test(token) && /[0-9@$]/.test(token)) {
      return fixChars(token);
    }
    return token;
  });
}

/**
 * Counts how many times a phrase appears.
 *
 * Args:
 *   text: the text to search.
 *   word: the phrase to count.
 *
 * Returns:
 *   The number of times it appears.
 */
function countWord(text, word) {
  return text.split(word).length - 1;
}

/**
 * Checks the subject and body for warning phrases.
 *
 * Args:
 *   subject: the email subject.
 *   body: the email text.
 *
 * Returns:
 *   A list of findings.
 */
function checkText(subject, body) {
  const plain = (subject + " " + body).toLowerCase();
  const cleaned = cleanText(plain);
  const findings = [];
  const disguised = [];

  for (const rule of TEXTRULES) {
    const found = [];
    for (const word of rule.words) {
      const inPlain = countWord(plain, word);
      const inCleaned = countWord(cleaned, word);
      if (inCleaned > 0) {
        found.push('"' + word + '" (' + inCleaned + "x)");
      }
      if (inCleaned > inPlain) {
        disguised.push(word);
      }
    }
    if (found.length > 0) {
      findings.push({ points: rule.points, title: rule.title, detail: rule.detail + " Found: " + found.join(", ") + ".", source: rule.source });
    }
  }

  if (disguised.length > 0) {
    findings.push({ points: 15, title: "Disguised spelling in the text", detail: "Words like \"" + disguised[0] + "\" were spelled with numbers or symbols, a trick to slip past spam filters.", source: "OWN" });
  }

  const shouting = (subject + " " + body).match(/\b[A-Z]{4,}\b/g) || [];
  const bangs = (subject + " " + body).match(/!/g) || [];
  if (shouting.length >= 3 || bangs.length >= 4) {
    findings.push({ points: 5, title: "SHOUTING or lots of exclamation marks", detail: "Pressure tactics often use capital letters and exclamation marks.", source: "OWN" });
  }
  return findings;
}

/**
 * Gets the website name from a link.
 *
 * Args:
 *   link: a full link starting with http.
 *
 * Returns:
 *   The lowercase website name, without any port or username.
 */
function hostOf(link) {
  const part = link.split("/")[2] || "";
  return part.split("@").pop().split(":")[0].toLowerCase();
}

/**
 * Checks the links in the email.
 *
 * Args:
 *   body: the email text (links from HTML look like "text [link]").
 *
 * Returns:
 *   A list of findings.
 */
function checkLinks(body) {
  const findings = [];
  const links = body.match(/https?:\/\/[^\s"'<>)\]]+/gi) || [];
  const seen = {};

  for (const link of links.slice(0, 30)) {
    const host = hostOf(link);
    if (host === "" || seen[host]) {
      continue;
    }
    seen[host] = true;

    if ((link.split("/")[2] || "").includes("@")) {
      findings.push({ points: 30, title: "Link hides its real address", detail: link + " puts a fake name before an @ sign. The real website is " + host + ".", source: "OWN" });
    } else if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      findings.push({ points: 30, title: "Link goes to a number address", detail: link + " uses numbers instead of a website name.", source: "OWN" });
    } else if (SHORTENERS.includes(host)) {
      findings.push({ points: 15, title: "Shortened link hides the destination", detail: link + " is shortened, so you cannot see where it really goes.", source: "OWN" });
    } else {
      addBrandLinkFinding(findings, link, host);
    }
  }

  const shownLinks = /([a-z0-9-]+(?:\.[a-z0-9-]+)+)\s*\[(https?:\/\/[^\]\s]+)\]/gi;
  let m = shownLinks.exec(body);
  while (m !== null) {
    const shown = m[1].toLowerCase().replace(/^www\./, "");
    const real = hostOf(m[2]);
    if (!sameSite(shown, real) && !sameSite(shown, real.replace(/^www\./, ""))) {
      findings.push({ points: 30, title: "Link text does not match where it goes", detail: "The text says " + shown + " but the link really goes to " + real + ".", source: "OWN" });
      break;
    }
    m = shownLinks.exec(body);
  }
  return findings;
}

/**
 * Adds a finding if a link's website copies a brand.
 *
 * Args:
 *   findings: the list to add to.
 *   link: the full link.
 *   host: the website name from the link.
 */
function addBrandLinkFinding(findings, link, host) {
  for (const word of splitWords(host)) {
    const found = findBrand(word);
    if (found && !isOfficial(host, found.brand)) {
      findings.push({ points: 30, title: "Link imitates a known company", detail: host + " looks like " + capital(found.brand) + " but is not their real website.", source: "NETCRAFT" });
      return;
    }
  }
}

/**
 * Turns a score into a level.
 *
 * Args:
 *   score: number from 0 to 100.
 *
 * Returns:
 *   "high", "medium" or "low".
 */
function riskLevel(score) {
  if (score >= 60) {
    return "high";
  }
  if (score >= 30) {
    return "medium";
  }
  return "low";
}

/**
 * Turns a score into a sentence.
 *
 * Args:
 *   score: number from 0 to 100.
 *
 * Returns:
 *   A short sentence.
 */
function riskLabel(score) {
  const level = riskLevel(score);
  if (level === "high") {
    return "High risk: this looks like a scam. Do not click anything.";
  }
  if (level === "medium") {
    return "Medium risk: be careful and check with the company directly.";
  }
  return "Low risk: few warning signs found, but stay alert.";
}

/**
 * Runs every check and adds up the score.
 *
 * Args:
 *   message: an object with from, replyTo, subject, body, authResults.
 *
 * Returns:
 *   An object with score (0 to 100), level and findings.
 */
function analyse(message) {
  const from = message.from || "";
  const replyTo = message.replyTo || "";
  const subject = message.subject || "";
  const body = message.body || "";
  const authResults = message.authResults || "";

  const findings = checkSender(from, replyTo, authResults)
    .concat(checkText(subject, body), checkLinks(body));

  let score = 0;
  for (const f of findings) {
    score += f.points;
  }
  if (score > MAXSCORE) {
    score = MAXSCORE;
  }
  return { score: score, level: riskLevel(score), findings: findings };
}

if (typeof module !== "undefined") {
  module.exports = { analyse, findBrand, riskLevel };
}
