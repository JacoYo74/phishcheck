# Research behind PhishCheck

Every warning sign PhishCheck looks for is listed here with where it comes from.
"Strong" means a named source says it directly. "Own judgement" means it is common advice
that I have not yet tied to one source. Read each source yourself and improve this table.

**The point values are judgement calls informed by these sources.** Nobody has validated them
as real probabilities, so PhishCheck shows a *risk score*, not a "chance of being a scam".

## Sources checked

| Short name | Source | Link |
|---|---|---|
| NCSCSPOT | UK National Cyber Security Centre: How to spot a scam email, text or call | https://www.ncsc.gov.uk/collection/phishing-scams/spot-scams |
| NCSC | UK National Cyber Security Centre: Phishing scams | https://www.ncsc.gov.uk/collection/phishing-scams |
| FTC | US Federal Trade Commission: How to recognize and avoid phishing scams | https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams |
| NETCRAFT | Netcraft: What is typosquatting? | https://www.netcraft.com/resources/glossary/typosquatting |
| CISA | US CISA: Avoiding social engineering and phishing attacks | https://www.cisa.gov/news-events/news/avoiding-social-engineering-and-phishing-attacks |
| BRANDEFENSE | Brandefense: Lookalike domains (examples such as paypa1.com and gooogle.com) | https://brandefense.io/blog/lookalike-domains-brand-impersonation/ |

## Rules and their support

| Rule in PhishCheck | Points | What the source says (paraphrased) | Support |
|---|---|---|---|
| Claims to be someone official | 10 | NCSC lists "authority" as a tell-tale sign: scams pretend to be a bank, doctor, solicitor or government department. | Strong (NCSCSPOT) |
| Urgent or pressuring language | 15 | NCSC lists "urgency": limited time to respond, such as "within 24 hours" or "immediately". FTC says scammers pressure you to act now. | Strong (NCSCSPOT, FTC) |
| Fear and threats | 15 | NCSC lists "emotion": threats, panic and fear are used to push you. | Strong (NCSCSPOT) |
| Too-good-to-be-true offer | 20 | NCSC lists "scarcity" and hope: offering money or something in short supply so you respond quickly. | Strong (NCSCSPOT) |
| Asks for private details | 20 | NCSC: a bank or official source will never ask for personal information by email. FTC: phishing tries to steal passwords and account numbers. | Strong (NCSCSPOT, FTC) |
| Risky attachment or file type | 20 | FTC: clicking a link or opening an attachment can download harmful software. NCSC: links can lead to sites that download viruses. | Strong (FTC, NCSC) |
| Asks you to scan a QR code | 15 | NCSC: criminals increasingly use QR codes in phishing emails and you should be wary of scanning them. | Strong (NCSCSPOT) |
| Sender pretends to be a known company | 35 | FTC: phishing emails look like they come from a company you know. NCSC: scammers pretend to be someone you trust. Netcraft: lookalike domains imitate a brand. | Strong |
| Disguised spelling of a company name | 25 | Netcraft lists misspellings, missing or added characters, character substitution and lookalike characters. Brandefense gives paypa1.com (1 for l) and gooogle.com (extra o). | Strong (NETCRAFT) |
| Brand plus a word (paypal-secure.com) | included in the sender rule | Netcraft describes brand names combined with other words; also different endings (.co instead of .com) and brand names placed in sub-domains. | Strong (NETCRAFT) |
| Letters from another alphabet | 25 | Netcraft lists "homoglyphs": characters from another alphabet that look like Latin letters. | Strong (NETCRAFT) |
| Link imitates a known company | 30 | Same lookalike-domain evidence, applied to links. | Strong (NETCRAFT) |
| Impersonal greeting | 10 | Widely repeated advice. Not yet tied to one source. NCSC also warns that old tells such as poor spelling are less reliable now. | Own judgement |
| Unusual way to pay (gift cards, bitcoin) | 25 | Widely repeated advice. Find an FTC or Action Fraud page that says this directly. | Own judgement |
| Shortened link, link made of numbers, @ trick, link text does not match | 15 to 30 | Standard advice in most phishing guides. Find a source. | Own judgement |
| Replies go to a different address | 15 | Common signal, and legitimate mail sometimes does this too. Find a source. | Own judgement |
| Failed SPF, DKIM or DMARC check (only when the email file has headers) | 25 | These are the email system's own sender checks. Find a source. | Own judgement |
| Disguised spelling in the text (p@ssword) | 15 | Common filter-dodging trick. Find a source. | Own judgement |
| SHOUTING or many exclamation marks | 5 | Common but weak. | Own judgement |
| The word "kindly" | 5 | Often repeated online, but I could not find solid research, and real people use it too. Kept tiny on purpose. | Weak |

## An important honest limit

The NCSC says scams used to be easier to spot (bad spelling, odd addresses) but are getting
smarter and some even fool experts. A clean-looking scam can score low. PhishCheck says so on
every result. It is a helper, not a guarantee.

## To do for you (this is the part that makes it "proper research")

1. Open each source above and check my paraphrases. Correct anything I got wrong.
2. Find a real source for each "Own judgement" row and change the row.
3. Add sources such as Action Fraud (UK), the Anti-Phishing Working Group (apwg.org) and
   Google's phishing guidance.
4. If a source contradicts a point value, change the value in scanner.js and note why here.
