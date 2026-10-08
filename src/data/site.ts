/**
 * Values only the site owner can supply. The toolkit page stays out of search
 * results (noindex) and shows no purchase link until the Gumroad URL is set.
 * The email form is optional and appears only when emailFormAction is set.
 */
export const site = {
  toolkitName: "Electrical Engineer's Toolkit",
  /** Price shown next to the buy button. Change it here and on Gumroad together. */
  price: '$19',
  /** Gumroad product URL, e.g. https://yourname.gumroad.com/l/toolkit */
  gumroadUrl: '',
  /** POST endpoint of the email service (Buttondown, ConvertKit, Formspree, ...). Receives a field named "email". */
  emailFormAction: '',
};

/** Shown on the home page. Update when the test count changes (`npm test`). */
export const testCount = 191;

export const toolkitReady = Boolean(site.gumroadUrl);
