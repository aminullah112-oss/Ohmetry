/**
 * Values only the site owner can supply. The toolkit page stays out of search
 * results (noindex) and shows no purchase link until the Gumroad URL is set.
 * The email form is optional and appears only when emailFormAction is set.
 */
export const site = {
  toolkitName: "Electrical Engineer's Toolkit",
  /** Price shown next to the buy button. Change it here and on Gumroad together. */
  price: '$19',
  /** Gumroad product URL, e.g. https://ohmetry.gumroad.com/l/toolkit */
  gumroadUrl: 'https://ohmetry.gumroad.com/l/hdauo',
  /** POST endpoint of the email service (Brevo, Buttondown, ConvertKit, ...). Leave empty to hide every sign-up form. */
  emailFormAction: '',
  /** Name of the email service, shown on the privacy page once the form is live. */
  emailProvider: 'Brevo',
  /** Name of the email input the service expects ("EMAIL" for Brevo, "email" for most others). */
  emailFieldName: 'email',
  /** Extra hidden fields the service asks for, copied from its embed code (for Brevo: locale, html_type). */
  emailHidden: {} as Record<string, string>,
  /** Name of the empty honeypot field some services add to block bots (Brevo: email_address_check). Leave empty if none. */
  emailHoneypot: '',
  /** What the subscriber gets. Shown on the form. Say only what the welcome email actually delivers. */
  emailOffer: 'a free sample sheet from the workbook, plus new calculators and corrections as they are published',
};

/**
 * Second product on the toolkit page: the 2 MW data centre electrical sample project (educational, sold on Gumroad as one ZIP).
 * The section stays hidden until BOTH the Gumroad URL and the price are set. Change the price here and on Gumroad together.
 */
export const dcProduct = {
  name: '2 MW Data Centre Electrical Sample Project',
  /** e.g. '$39'. Owner's decision. */
  price: '',
  /** e.g. https://ohmetry.gumroad.com/l/ohm-dc-2000 */
  gumroadUrl: '',
};

export const dcReady = Boolean(dcProduct.gumroadUrl && dcProduct.price);

/** Shown on the home page. Update when the test count changes (`npm test`). */
export const testCount = 279;

export const toolkitReady = Boolean(site.gumroadUrl);

export const emailReady = Boolean(site.emailFormAction);
