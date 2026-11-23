import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';

import { americanRobin, catalogue } from '../species/catalog.js';
import { creditEntries, type CreditEntry } from '../species/credits.js';
import { CreditsView } from './CreditsView.js';

const strip = (html: string) => html.replace(/<!--[\s\S]*?-->/g, '');

describe('credit entries', () => {
  it('has one entry for every shipped clip, so none goes uncredited', () => {
    const shipped = americanRobin.songs.length + americanRobin.calls.length;
    expect(creditEntries(catalogue)).toHaveLength(shipped);
  });

  it('carries the licence deed only when the licence has one', () => {
    for (const entry of creditEntries(catalogue)) {
      if (entry.licenceLabel === 'Public domain') expect(entry.deed).toBeNull();
      else expect(entry.deed).toMatch(/^https:\/\/creativecommons\.org\//);
    }
  });
});

describe('credits screen', () => {
  const html = strip(renderToString(<CreditsView entries={creditEntries(catalogue)} onBack={() => {}} />));

  it('names each recordist, licence and source from the records', () => {
    for (const entry of creditEntries(catalogue)) {
      expect(html).toContain(entry.recordist);
      expect(html).toContain(entry.licenceLabel);
      expect(html).toContain(entry.sourceUrl);
    }
  });

  it('states that the clip was changed for Birdie', () => {
    expect(html).toContain('Changed for Birdie');
  });

  it('links external sources with noopener', () => {
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('explains the share-alike boundary when a share-alike clip is shown', () => {
    const shareAlike: CreditEntry = { ...creditEntries(catalogue)[0]!, shareAlike: true, clip: 'audio/x/y.mp3' };
    const text = strip(renderToString(<CreditsView entries={[shareAlike]} onBack={() => {}} />));
    expect(text).toContain('stay under their licence');
    expect(text).toContain('audio/x/y.mp3');
  });

  it('shows a licence without a link when there is no deed', () => {
    const noDeed: CreditEntry = { ...creditEntries(catalogue)[0]!, deed: null, licenceLabel: 'Public domain' };
    const text = strip(renderToString(<CreditsView entries={[noDeed]} onBack={() => {}} />));
    expect(text).toContain('Public domain');
    expect(text).not.toContain('creativecommons.org');
  });
});
