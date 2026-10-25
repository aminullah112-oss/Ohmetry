# Sender mailbox (Zoho Mail)

`hello@ohmetry.com` is a Zoho Mail mailbox on the free plan, India data centre (`zoho.in`). Cloudflare Email Routing was turned off first, because its MX and SPF records conflict with Zoho's. Checked 2026-10-25: SPF, DKIM and DMARC pass, the From line reads `Ohmetry <hello@ohmetry.com>`, and the `Date` header ends in `+0000`.

DNS records in Cloudflare (all DNS only, none proxied):

| Type | Name | Content |
|---|---|---|
| MX | `@` | `mx.zoho.in` 10, `mx2.zoho.in` 20, `mx3.zoho.in` 50 |
| TXT | `@` | one SPF record: `v=spf1 include:zoho.in ~all` |
| TXT | `zoho._domainkey` | DKIM value shown in Zoho Mail Admin |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:hello@ohmetry.com; ruf=mailto:hello@ohmetry.com; sp=none; adkim=r; aspf=r; pct=100` |
| TXT | `@` | the Zoho and Google verification records |

Zoho Mail Admin offers a one-time "Log in to my DNS" authorize button for MX, SPF and DKIM; it shows the records before adding them.

Anonymity checks, run after any mailbox change:
1. Send a test to a mailbox you control and use Show original. Read SPF, DKIM, DMARC, the From line and the `Date:` line. The `Date` offset follows the Zoho time zone (Calendar > Time Zone, and the Accounts profile). Keep both on GMT.
2. The Zoho Accounts profile shows the recovery email, which is private to the account. Do not use "Link Accounts" with a personal Google account.
3. Turn on multi-factor authentication for the Zoho account.

Later: change DMARC to `p=quarantine` after a few weeks of clean sends.

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
