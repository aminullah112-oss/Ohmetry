import { describe, expect, it } from 'vitest';
import { dcProduct, dcReady } from '../data/site';

describe('data centre sample project listing', () => {
  it('is shown only when both the Gumroad URL and the price are set', () => {
    expect(dcReady).toBe(Boolean(dcProduct.gumroadUrl && dcProduct.price));
  });
  it('has a Gumroad URL on the owner Gumroad account when set', () => {
    if (dcProduct.gumroadUrl) expect(dcProduct.gumroadUrl).toMatch(/^https:\/\/ohmetry\.gumroad\.com\/l\/[\w-]+$/);
  });
  it('has a price like $39 when set', () => {
    if (dcProduct.price) expect(dcProduct.price).toMatch(/^\$\d+(\.\d{2})?$/);
  });
});
