# PhishCheck

A free website that scores how risky an email looks, explains why in plain English, and teaches
people to spot scams with short lessons and a quiz.

- Paste an email, or drop a saved `.eml` file, and get a risk score with reasons and sources
- Optional: connect Gmail (read only) to score the latest 10 inbox emails
- Learning portal: 5 lessons with tap-the-clue examples, then a 12 question quiz
- Optional accounts: save checks and quiz progress

## How it works

The score is made from named warning-sign rules (see `RESEARCH.md`). It is a **risk score, not a
probability**, and a clean-looking scam can score low. Checking happens in the visitor's browser.
If someone signs in and presses Save, only the sender, subject, score and reasons are stored,
never the email text.

## Files

| File | Job |
|---|---|
| `index.html`, `style.css` | the page and how it looks |
| `config.js` | your own settings (Supabase and Google) |
| `scanner.js` | the scoring rules |
| `eml.js` | reads saved email files |
| `lessons.js` | lessons and quiz questions (edit this to add more) |
| `learn.js` | lesson and quiz screens |
| `cloud.js` | accounts and saved data (Supabase) |
| `gmail.js` | Gmail connection |
| `app.js` | joins it together |
| `supabase.sql` | database setup, run once |

## Never commit

Real emails, or secret keys. Only the Supabase *publishable* key and the Google *client ID* go in
`config.js`. They are designed to be public. Never paste a Supabase `service_role` key anywhere.
