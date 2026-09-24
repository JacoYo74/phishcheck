// lessons.js - all the teaching content and quiz questions.
// To add a lesson or a question, copy an existing one and change the words.
//
// In an example email, a part with a "note" becomes a circled clue people can tap.

const LESSONS = [
  {
    emoji: "🎭",
    title: "The five pressure tricks",
    intro: [
      "Scammers do not need clever technology. They need you to feel something, so you act before you think.",
      "The UK National Cyber Security Centre lists five tell-tale signs: authority, urgency, emotion, scarcity and current events. This email uses four of them."
    ],
    parts: [
      { text: "From: " },
      { text: "HM Revenue & Customs <refunds@hmrc-gov-refund.co>", note: "Authority. It claims to be the government. But real HMRC emails usually come from gov.uk addresses, not .co." },
      { text: "\nSubject: " },
      { text: "You are owed a £412 tax refund", note: "Scarcity and hope. Unexpected money is classic bait." },
      { text: "\n\nDear taxpayer,\n\nOur records show you overpaid. " },
      { text: "Claim within 24 hours", note: "Urgency. A tiny deadline stops you from stopping to check." },
      { text: " or you " },
      { text: "will be fined £200", note: "Emotion. Fear makes people click first and think later." },
      { text: ".\n\nClaim here: http://hmrc-gov-refund.co/claim" }
    ]
  },
  {
    emoji: "🕵️",
    title: "Who really sent it?",
    intro: [
      "The sender's name on screen can say anything. The address underneath is what counts. Scammers copy famous names with small tricks:"
    ],
    tips: [
      "Numbers for letters: app1e, s4msung, paypa1 (a number 1 instead of a letter l)",
      "Extra or missing letters: gooogle, amazom",
      "Brand plus a word: paypal-secure.com, microsoft-support.help",
      "The wrong ending: paypal.co instead of paypal.com",
      "Brand at the front only: paypal.com.login-check.net belongs to login-check.net. Read the part just before the final ending."
    ],
    parts: [
      { text: "From: Microsoft Support <" },
      { text: "micr0soft-help", note: "That is a zero, not the letter o. Scammers swap in look-alike numbers." },
      { text: "@" },
      { text: "gmail.com", note: "Gmail is a free service anyone can sign up to. Microsoft would send from microsoft.com." },
      { text: ">\nSubject: Security notice\n\n" },
      { text: "Dear customer,", note: "A real company usually knows your name. This was sent to thousands of people." },
      { text: "\n\nSomeone tried to sign in to your account. Please review the activity." }
    ]
  },
  {
    emoji: "🔗",
    title: "Links, files and QR codes",
    intro: [
      "A link's words can say one thing while it goes somewhere else. On a computer, hover your mouse over a link to see where it really goes. On a phone, press and hold.",
      "The NCSC also warns that criminals increasingly hide scam links behind QR codes in emails."
    ],
    tips: [
      "Shortened links (bit.ly and friends) hide the real destination",
      "Links made of numbers, like http://192.168.4.20, are not normal websites",
      "Attachments ending in .zip, .exe or asking you to enable macros can install harmful software"
    ],
    parts: [
      { text: "Subject: Parcel on hold\n\nWe could not deliver your parcel. Pay a £1.45 fee: " },
      { text: "http://bit.ly/x8fj2", note: "A shortened link hides where you will land. Never pay through a link like this." },
      { text: "\nor " },
      { text: "scan this QR code", note: "QR codes in emails can hide a scam link. Do not scan them." },
      { text: "\n\nSee attached: " },
      { text: "invoice_4431.zip", note: "A surprise .zip file can contain harmful software. Do not open it." }
    ]
  },
  {
    emoji: "🚫",
    title: "Things a real company never asks",
    intro: [
      "Your bank, the tax office and other real organisations will never ask for your password or PIN by email. They also do not ask for payment in gift cards or bitcoin.",
      "If a message asks for any of these, it is a scam, however friendly it sounds."
    ],
    parts: [
      { text: "From: Bank Security <security@banksecure-team.net>\n\n" },
      { text: "Dear valued customer,", note: "Generic greeting. A real bank knows your name." },
      { text: "\n\nWe have frozen your card. " },
      { text: "Reply to this email with your password and PIN", note: "No real bank asks for your password or PIN, ever, and never by email." },
      { text: " to unlock it. Or pay the £50 release fee using " },
      { text: "gift cards", note: "Nobody legitimate takes payment in gift cards. This is always a scam." },
      { text: "." }
    ]
  },
  {
    emoji: "🛡️",
    title: "What to do: Stop, Check, Report",
    intro: [
      "You do not have to be a computer expert. Three habits protect you almost every time. Tap each card."
    ],
    steps: [
      { emoji: "✋", title: "Stop", text: "Do not click, reply or open attachments. Take a breath. Scammers want you to rush." },
      { emoji: "📞", title: "Check", text: "Contact the company using a phone number or website you already trust, such as one on a bill or bank card. Never use the details inside the message." },
      { emoji: "📣", title: "Report", text: "Forward scam emails to report@phishing.gov.uk (UK) or reportphishing@apwg.org (US). Forward scam texts to 7726. In the US you can also report at ReportFraud.ftc.gov." },
      { emoji: "🔒", title: "If you already clicked", text: "Change the password for that account, tell your bank if you shared card details, and run a security scan if you opened a file." }
    ]
  }
];

const QUESTIONS = [
  {
    email: { from: "HMRC <refunds@hmrc-tax-gov.co>", subject: "Tax refund", text: "You are owed £412. Claim within 24 hours: http://hmrc-tax-gov.co/claim" },
    prompt: "Scam or real?",
    options: ["Scam", "Real"], answer: 0,
    why: "HMRC uses gov.uk addresses. This is a copy with a .co ending, and the 24 hour deadline is pressure."
  },
  {
    email: { from: "Amazon <order-update@amazon.co.uk>", subject: "Your order has shipped", text: "Your order is on its way. You can track it any time in Your Orders on the Amazon website or app." },
    prompt: "Scam or real?",
    options: ["Scam", "Real"], answer: 1,
    why: "The address really is Amazon's, it asks for nothing, and it tells you to go to the site yourself."
  },
  {
    email: null,
    prompt: "One of these sender addresses is fake. Which one?",
    options: ["help@paypal.com", "help@paypa1.com", "help@paypal.co.uk"], answer: 1,
    why: "paypa1.com has a number 1 instead of the letter l. The other two are real PayPal addresses."
  },
  {
    email: { from: "Mr Adebayo <barrister.adebayo@yahoo.com>", subject: "Inheritance", text: "You have been named in an inheritance of 4.5 million pounds. Send your bank details to claim it." },
    prompt: "Scam or real?",
    options: ["Scam", "Real"], answer: 0,
    why: "Unexpected money plus a request for bank details is a classic scam."
  },
  {
    email: { from: "Barclays <alerts@barclays.co.uk>", subject: "Card payment", text: "We spotted a payment on your card. If it was not you, call the number on the back of your card. We will never ask for your PIN." },
    prompt: "Scam or real?",
    options: ["Scam", "Real"], answer: 1,
    why: "It asks for nothing and sends you to a number you already trust, on your own card."
  },
  {
    email: null,
    prompt: "An email worries you. What should you do first?",
    options: ["Click the link to check", "Reply with your details", "Contact the company using a number or website you already trust", "Forward it to friends"], answer: 2,
    why: "Break contact and check directly. Never use the phone number or link inside the message."
  },
  {
    email: { from: "Netflix <billing@netflix-billing.support>", subject: "Payment failed", text: "Your payment failed. Update your card at http://netflix-billing.support/login today or your account will be closed." },
    prompt: "Scam or real?",
    options: ["Scam", "Real"], answer: 0,
    why: "The real Netflix is netflix.com. This is a lookalike with extra words, plus a threat."
  },
  {
    email: null,
    prompt: "Which link is safest to trust?",
    options: ["https://gov.uk.tax-refund-check.com", "http://bit.ly/gov-refund", "https://www.gov.uk", "https://192.168.4.20/gov"], answer: 2,
    why: "Read the part just before the ending. The first link really belongs to tax-refund-check.com. The others are shortened or made of numbers."
  },
  {
    email: { from: "Microsoft <account-security@microsoft.com>", subject: "Your subscription renews soon", text: "Your Microsoft 365 subscription renews next month. You can manage it any time from the Microsoft account page you normally use. We never ask for your password by email." },
    prompt: "Scam or real?",
    options: ["Scam", "Real"], answer: 1,
    why: "The address is really microsoft.com, there is no threat, no deadline, and nothing is asked of you."
  },
  {
    email: { from: "Evri <delivery@evri-parcel-fee.top>", subject: "Parcel on hold", text: "Pay a £1.45 redelivery fee: http://evri-parcel-fee.top/pay or scan the QR code below." },
    prompt: "Scam or real?",
    options: ["Scam", "Real"], answer: 0,
    why: "It is a lookalike website (.top), asks for a small fee, and pushes a QR code. Small fees are a common trick to steal card details."
  },
  {
    email: null,
    prompt: "Which of these is a pressure trick?",
    options: ["Reply within 24 hours or your account is closed", "Your order has shipped", "Your receipt is attached", "The meeting has moved to 3pm"], answer: 0,
    why: "Tiny deadlines and threats are urgency and fear, two of the five pressure tricks."
  },
  {
    email: null,
    prompt: "An email asks you to buy gift cards and send the codes. This is:",
    options: ["A normal way for companies to be paid", "Definitely a scam", "Only a scam if it comes from Gmail", "Fine if they say please"], answer: 1,
    why: "No real company or government body takes payment in gift card codes. It is always a scam."
  }
];
