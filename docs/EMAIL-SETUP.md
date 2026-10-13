# Email list setup (Brevo)

The sign-up form is built but hidden. It appears on every chart, calculator and guide page and on the toolkit page the moment `emailFormAction` in `src/data/site.ts` is set.

## 1. Create the form in Brevo

1. Brevo > Contacts > Lists > create a list called "Ohmetry".
2. Brevo > Contacts > Forms > Create a subscription form > pick the list. Turn on **double opt-in** (it protects deliverability and is the safer choice for EU/UK visitors). Keep only the email field.
3. Open the form's **Share > Embed** code. Copy these from it:
   - the form `action` URL (starts with `https://` and ends in `.sibforms.com/serve/...`)
   - the name of the email input (usually `EMAIL`)
   - the hidden inputs (usually `locale` = `en` and `html_type` = `simple`)
   - the honeypot input name (usually `email_address_check`)

## 2. Paste them into `src/data/site.ts`

```ts
emailFormAction: 'https://....sibforms.com/serve/....',
emailFieldName: 'EMAIL',
emailHidden: { locale: 'en', html_type: 'simple' },
emailHoneypot: 'email_address_check',
```

Check the names against what Brevo shows; they differ between form versions. Commit and push. The forms and the privacy-page paragraph that names Brevo switch on together.

## 3. Welcome email (Brevo > Automations)

Trigger: contact added to the "Ohmetry" list (after double opt-in confirmation). Send:

> Subject: Your Ohmetry sample sheet
>
> Thanks for subscribing. The sample sheet is here:
> https://ohmetry.com/downloads/ohmetry-sample-sheet.xlsx
>
> It checks one circuit: minimum breaker under the 125 % continuous-load rule, the next standard rating, and voltage drop with the longest run for your limit. It has its own self-test sheet. It does not check wire ampacity, so check that against the code you work to.
>
> I will email when there are new calculators or corrections, and not otherwise. Reply to this message with any error you find. You can unsubscribe from any email.

The file is at `public/downloads/ohmetry-sample-sheet.xlsx`. `robots.txt` asks crawlers to skip `/downloads/`, but the link is not secret: anyone with the URL can fetch it. If you want a hard gate, attach it in a Brevo transactional email instead.

## 4. Test

Subscribe with a second address, confirm the double opt-in email arrives, then the welcome email, then open the file in Excel and check the Self-Test shows ALL PASS.

## Rebuilding the sample sheet

`python3 docs/build_sample_sheet.py` from the repo root regenerates it. Open it in LibreOffice or Excel after changing the script and confirm the self-test.
