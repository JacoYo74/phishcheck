// scanner.js - scores an email using warning-sign rules. Runs in the browser.

const MAXSCORE = 100;

// Where each rule's reasoning comes from. Check every link opens, and
// add more sources in RESEARCH.md as you read them.
const SOURCES = {
  NCSC: { name: "UK NCSC: Phishing guidance", url: "https://www.ncsc.gov.uk/collection/phishing-scams" },
  FTC: { name: "US FTC: How to recognize phishing", url: "https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams" },
  CISA: { name: "CISA: Avoiding phishing attacks", url: "https://www.cisa.gov/news-events/news/avoiding-social-engineering-and-phishing-attacks" },
  WEAK: { name: "Weak evidence, see RESEARCH.md", url: "" }
};

// Real domains for companies scammers like to copy.
const BRANDDOMAINS = {
  microsoft: ["microsoft.com", "office.com", "office365.com"],
  paypal: ["paypal.com", "paypal.co.uk"],
  apple: ["apple.com"],
  amazon: ["amazon.com", "amazon.co.uk"],
  netflix: ["netflix.com"],
  google: ["google.com"],
  hmrc: ["hmrc.gov.uk", "gov.uk"],
  dhl: ["dhl.com"],
  barclays: ["barclays.co.uk", "barclays.com"]
};

const FREEMAIL = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "aol.com", "icloud.com"];
const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "cutt.ly"];

// Each rule: a list of words, points added if any are found, and why.
const TEXTRULES = [
  { title: "Urgent or pressuring language", points: 15, source: "NCSC",
    words: ["urgent", "immediately", "within 24 hours", "act now", "final notice", "last warning", "expires today"],
    detail: "Scammers rush you so you do not stop and think." },
  { title: "Threats about your account", points: 15, source: "FTC",
    words: ["account suspended", "account will be closed", "account has been locked", "unusual activity", "unauthorised login"],
    detail: "Scare tactics are used to make you click without checking." },
  { title: "Asks for private details", points: 25, source: "FTC",
    words: ["password", "pin number", "card number", "bank details", "security code", "verify your identity", "confirm your details"],
    detail: "Real companies do not ask for these by email." },
  { title: "Impersonal greeting", points: 10, source: "FTC",
    words: ["dear customer", "dear user", "dear account holder", "dear valued", "dear sir/madam"],
    detail: "Mass-sent scams do not know your name." },
  { title: "Too-good-to-be-true offer", points: 20, source: "FTC",
    words: ["you have won", "lottery", "claim your prize", "inheritance", "free gift"],
    detail: "Unexpected prizes and money are a classic scam hook." },
  { title: "Unusual payment method", points: 25, source: "FTC",
    words: ["gift card", "bitcoin", "wire transfer", "western union"],
    detail: "Scammers prefer payments that are hard to trace or reverse." },
  { title: "Risky attachment wording", points: 20, source: "CISA",
    words: ["enable macros", "enable content", ".exe", ".zip"],
    detail: "Attachments can hide malware." },
  { title: "The word 'kindly'", points: 5, source: "WEAK",
    words: ["kindly"],
    detail: "Often reported as a scam-email habit, but real companies use it too, so it only adds a little." }
];

/**
 * Swaps look-alike digits back to letters.
 *
 * Scammers write micr0soft instead of microsoft. This undoes that so
 * we can spot the real name underneath.
 *
 * Args:
 *   text: the text to clean.
 *
 * Returns:
 *   The text with 0, 1, 3 and 5 changed to o, l, e and s.
 */
function fixDigits(text) {
  return text.replace(/0/g, "o").replace(/1/g, "l").replace(/3/g, "e").replace(/5/g, "s");
}

/**
 * Checks if a domain really belongs to a brand.
 *
 * Args:
 *   domain: the domain to test, e.g. "mail.amazon.co.uk".
 *   brand: a key of BRANDDOMAINS.
 *
 * Returns:
 *   True if the domain is one of the brand's real domains.
 */
function isOfficial(domain, brand) {
  for (const official of BRANDDOMAINS[brand]) {
    if (domain === official || domain.endsWith("." + official)) {
      return true;
    }
  }
  return false;
}

/**
 * Finds a brand that some text pretends to be.
 *
 * Args:
 *   text: text that might contain a brand name.
 *   domain: the domain that text came from.
 *
 * Returns:
 *   The brand name if it is mentioned but the domain is not
 *   official, otherwise an empty string.
 */
function pretendsToBe(text, domain) {
  const cleaned = fixDigits(text.toLowerCase());
  for (const brand in BRANDDOMAINS) {
    if (cleaned.includes(brand) && !isOfficial(domain, brand)) {
      return brand;
    }
  }
  return "";
}

/**
 * Checks the sender address.
 *
 * Args:
 *   from: whatever was typed in the From box.
 *
 * Returns:
 *   A list of findings, each with points, title, detail and source.
 */
function checkSender(from) {
  const findings = [];
  const match = from.match(/([\w.+-]+)@([\w.-]+\.[a-z]{2,})/i);
  if (!match) {
    findings.push({ points: 10, title: "No readable sender address",
      detail: "We could not find an email address in the From box.", source: "NCSC" });
    return findings;
  }
  const local = match[1].toLowerCase();
  const domain = match[2].toLowerCase();
  const displayName = from.split("<")[0];
  const brand = pretendsToBe(displayName + " " + local + " " + domain, domain);

  if (brand !== "") {
    let detail = "The sender uses the name " + brand + ", but " + local + "@" + domain + " does not belong to " + brand + ".";
    if (FREEMAIL.includes(domain)) {
      detail += " Real companies do not send official emails from free services like " + domain + ".";
    }
    findings.push({ points: 40, title: "Sender pretends to be a known company", detail: detail, source: "NCSC" });

    if (fixDigits(local + domain) !== local + domain) {
      findings.push({ points: 20, title: "Numbers swapped in for letters",
        detail: "The address uses digits that look like letters (like 0 for o) to look real.", source: "NCSC" });
    }
  }
  return findings;
}

/**
 * Counts how many times a word appears in some text.
 *
 * Args:
 *   text: the text to search.
 *   word: the word or phrase to count.
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
  const text = (subject + " " + body).toLowerCase();
  const findings = [];
  for (const rule of TEXTRULES) {
    const found = [];
    for (const word of rule.words) {
      const count = countWord(text, word);
      if (count > 0) {
        found.push('"' + word + '" (' + count + "x)");
      }
    }
    if (found.length > 0) {
      findings.push({ points: rule.points, title: rule.title,
        detail: rule.detail + " Found: " + found.join(", ") + ".", source: rule.source });
    }
  }
  return findings;
}

/**
 * Checks the links inside the email text.
 *
 * Args:
 *   body: the email text.
 *
 * Returns:
 *   A list of findings.
 */
function checkLinks(body) {
  const findings = [];
  const links = body.match(/https?:\/\/[^\s"'<>)]+/gi) || [];
  for (const link of links) {
    const host = link.split("/")[2].toLowerCase();
    if (/^\d+\.\d+\.\d+\.\d+/.test(host)) {
      findings.push({ points: 30, title: "Link goes to a number address",
        detail: link + " uses an IP address instead of a website name.", source: "NCSC" });
    } else if (SHORTENERS.includes(host)) {
      findings.push({ points: 15, title: "Shortened link hides the destination",
        detail: link + " is a shortened link, so you cannot see where it really goes.", source: "NCSC" });
    } else if (pretendsToBe(host, host) !== "") {
      findings.push({ points: 30, title: "Link imitates a known company",
        detail: host + " looks like " + pretendsToBe(host, host) + " but is not their real website.", source: "NCSC" });
    }
  }
  return findings;
}

/**
 * Runs every check and adds up the score.
 *
 * Args:
 *   from: the sender text.
 *   subject: the subject text.
 *   body: the email text.
 *
 * Returns:
 *   An object with score (0 to 100) and findings (a list).
 */
function analyse(from, subject, body) {
  const findings = checkSender(from).concat(checkText(subject, body), checkLinks(body));
  let score = 0;
  for (const f of findings) {
    score += f.points;
  }
  if (score > MAXSCORE) {
    score = MAXSCORE;
  }
  return { score: score, findings: findings };
}

/**
 * Turns a score into a short label.
 *
 * Args:
 *   score: number from 0 to 100.
 *
 * Returns:
 *   A sentence describing the risk.
 */
function riskLabel(score) {
  if (score >= 60) return "High risk: very likely a scam. Do not click anything.";
  if (score >= 30) return "Medium risk: be careful and check with the company directly.";
  return "Low risk: few warning signs found, but stay alert.";
}
