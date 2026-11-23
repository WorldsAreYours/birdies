import { changeStatement, licenceFacts } from './licences.js';
import type { SongVariant, SpeciesRecord } from './types.js';

/**
 * The credits, generated from the records.
 *
 * Issue #5 is the rule this file exists to satisfy: the attribution is derived
 * from `recordist`, `license` and `sourceUrl`, never typed into a second file that
 * can drift from them. The same text is written beside the audio
 * (`web/public/audio/CREDITS.txt`, by `scripts/make-credits.mjs`) and, when the
 * UI lands, rendered by the app from this function. One source, two destinations.
 */

function creditBlock(variant: SongVariant): string[] {
  const facts = licenceFacts(variant.license);
  const lines = [
    variant.clip,
    `  Recorded by ${variant.recordist}.`,
    `  Licence: ${facts.label}${facts.deed ? ` — ${facts.deed}` : ''}`,
    `  Source: ${variant.sourceUrl}`,
    `  Changed for Birdie: ${changeStatement(variant.clipRange.fromSeconds, variant.clipRange.toSeconds)}.`,
  ];
  return lines;
}

/** One clip's credit, as structured data for the in-app credits screen. */
export interface CreditEntry {
  readonly speciesName: string;
  readonly clip: string;
  readonly recordist: string;
  readonly licenceLabel: string;
  readonly deed: string | null;
  readonly sourceUrl: string;
  /** Without the trailing full stop: "trimmed to 10.0 s from the start of the recording". */
  readonly changed: string;
  readonly shareAlike: boolean;
}

/** Every shipped clip's credit, built from the same fields as `creditsText`. */
export function creditEntries(records: readonly SpeciesRecord[]): CreditEntry[] {
  return records.flatMap((record) =>
    [...record.songs, ...record.calls].map((variant: SongVariant) => {
      const facts = licenceFacts(variant.license);
      return {
        speciesName: record.commonName,
        clip: variant.clip,
        recordist: variant.recordist,
        licenceLabel: facts.label,
        deed: facts.deed,
        sourceUrl: variant.sourceUrl,
        changed: changeStatement(variant.clipRange.fromSeconds, variant.clipRange.toSeconds),
        shareAlike: facts.shareAlike,
      };
    }),
  );
}

export function creditsText(records: readonly SpeciesRecord[]): string {
  const out: string[] = [
    'Birdie — audio credits',
    '======================',
    '',
    'Every recording below comes from a public archive, and each clip ships under the',
    'licence named with it. The Birdie source code has its own licence; the audio does',
    'not inherit it, and a clip\'s licence does not extend to the code.',
    '',
  ];

  const shareAlike: string[] = [];

  for (const record of records) {
    const variants = [...record.songs, ...record.calls];
    out.push(`${record.commonName} (${record.scientificName})`);
    out.push('-'.repeat(`${record.commonName} (${record.scientificName})`.length));
    out.push('');
    for (const variant of variants) {
      out.push(...creditBlock(variant), '');
      if (licenceFacts(variant.license).shareAlike) shareAlike.push(variant.clip);
    }
  }

  out.push(
    'Share-alike',
    '-----------',
    shareAlike.length > 0
      ? `The clips marked CC BY-SA stay CC BY-SA wherever they are copied, and this notice and the credit above must travel with them: ${shareAlike.join(', ')}. They are licensed separately from the app code, which may be sold or closed without affecting them.`
      : 'None of the shipped clips is share-alike, so nothing here constrains how the app itself is distributed.',
    '',
  );

  return out.join('\n');
}
