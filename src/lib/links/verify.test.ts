import { describe, it, expect } from 'vitest';
import { extractLinks, findLink, normalizeUrl, relSummary, isBlockedHost, isCheckableUrl, looksJsRendered, verifyLink, type Fetcher } from './verify';

const page = (html: string, status = 200, finalUrl = 'https://blog.example.org/post'): Fetcher => async () => ({ status, finalUrl, html });
const target = 'https://ohmetry.com/voltage-drop-calculator/';

describe('extractLinks', () => {
  it('resolves relative links, lowercases rel, strips tags from anchor text and skips mailto and fragments', () => {
    const l = extractLinks('<a href="/a" rel="NoFollow Sponsored">Click <b>here</b></a><a href="mailto:x@y.z">m</a><a href="#top">t</a><a href=\'https://ohmetry.com/x\'>x</a>', 'https://blog.example.org/post');
    expect(l.map((x) => x.href)).toEqual(['https://blog.example.org/a', 'https://ohmetry.com/x']);
    expect(l[0].rel).toEqual(['nofollow', 'sponsored']);
    expect(l[0].text).toBe('Click here');
  });
});

describe('matching', () => {
  it('normalises www, trailing slash, fragment and query', () => {
    expect(normalizeUrl('https://www.Ohmetry.com/a/?x=1#y')).toBe('ohmetry.com/a');
  });
  it('prefers an exact URL over a domain match', () => {
    const links = extractLinks('<a href="https://ohmetry.com/">home</a><a href="https://www.ohmetry.com/voltage-drop-calculator">calc</a>', 'https://s.org/');
    expect(findLink(links, target)?.matchType).toBe('exact_url');
    expect(findLink(links, target)?.link.text).toBe('calc');
  });
  it('falls back to a link to the same domain, and finds nothing for other sites or look-alike hosts', () => {
    expect(findLink(extractLinks('<a href="https://ohmetry.com/about/">a</a>', 'https://s.org/'), target)?.matchType).toBe('domain_match');
    expect(findLink(extractLinks('<a href="https://notohmetry.com/">a</a><a href="https://ohmetry.com.evil.io/">b</a>', 'https://s.org/'), target)).toBeNull();
  });
  it('reports follow when no qualifying rel is present, and only the qualifying values otherwise', () => {
    expect(relSummary([])).toEqual(['follow']);
    expect(relSummary(['noopener'])).toEqual(['follow']);
    expect(relSummary(['noopener', 'nofollow'])).toEqual(['nofollow']);
  });
});

describe('address safety', () => {
  it('blocks loopback, private, link-local and internal names, and allows public hosts', () => {
    for (const h of ['localhost', '127.0.0.1', '10.0.0.5', '172.16.1.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'router.local', 'intranet', '999.1.1.1']) expect(isBlockedHost(h), h).toBe(true);
    for (const h of ['ohmetry.com', 'blog.example.org', '172.32.0.1', '8.8.8.8']) expect(isBlockedHost(h), h).toBe(false);
    expect(isCheckableUrl('https://user:pw@example.org/')).toBe(false);
    expect(isCheckableUrl('ftp://example.org/')).toBe(false);
    expect(isCheckableUrl('https://example.org/page')).toBe(true);
  });
});

describe('verifyLink', () => {
  it('verifies a live nofollow link and reports the anchor text', async () => {
    const r = await verifyLink('https://blog.example.org/post', target, page('<p>x</p><a rel="nofollow" href="https://ohmetry.com/voltage-drop-calculator/">voltage drop tool</a>'));
    expect(r).toMatchObject({ status: 'verified', matchType: 'exact_url', rel: ['nofollow'], anchorText: 'voltage drop tool' });
  });
  it('reports a removed link, a lost page, an unexpected status and a blocked source', async () => {
    expect((await verifyLink('https://blog.example.org/post', target, page('<p>nothing here</p>'))).status).toBe('link_removed');
    expect((await verifyLink('https://blog.example.org/post', target, page('', 404))).status).toBe('lost');
    const e = await verifyLink('https://blog.example.org/post', target, page('', 503));
    expect(e).toMatchObject({ status: 'error', httpStatus: 503 });
    expect((await verifyLink('http://127.0.0.1/admin', target, page('x'))).status).toBe('error');
  });
  it('does not call a JavaScript shell a removed link', async () => {
    expect(looksJsRendered('<div id="root"></div><script src="app.js"></script>')).toBe(true);
    expect((await verifyLink('https://blog.example.org/post', target, page('<div id="root"></div>'))).status).toBe('unverifiable_js');
  });
  it('notes a redirect and still checks the final page', async () => {
    const r = await verifyLink('http://blog.example.org/post', target, page('<a href="https://ohmetry.com/voltage-drop-calculator/">x</a>', 200, 'https://blog.example.org/post'));
    expect(r.status).toBe('verified');
    expect(r.redirectedTo).toBe('https://blog.example.org/post');
  });
  it('returns the fetcher error text instead of throwing', async () => {
    const f: Fetcher = async () => ({ status: null, finalUrl: 'https://blog.example.org/post', html: '', error: 'timeout' });
    expect(await verifyLink('https://blog.example.org/post', target, f)).toMatchObject({ status: 'error', note: 'timeout' });
  });
});
