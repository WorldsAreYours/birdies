import type { CreditEntry } from '../species/credits.js';

/**
 * The credits screen (issue #13). Every line comes from `creditEntries`, the same
 * records that write `public/audio/CREDITS.txt`, so the app and the file cannot
 * disagree about who recorded a clip or under what licence.
 */
export function CreditsView({
  entries,
  onBack,
}: {
  readonly entries: readonly CreditEntry[];
  readonly onBack: () => void;
}) {
  const shareAlike = entries.filter((entry) => entry.shareAlike);

  return (
    <main className="birdie">
      <section className="card" aria-labelledby="credits-heading">
        <h2 className="card__heading" id="credits-heading">
          Credits
        </h2>
        <p className="fineprint">
          Every recording here comes from a public archive. Each clip is changed for Birdie and ships
          under the licence named with it. The app's code has its own licence; the audio does not
          inherit it.
        </p>

        <ul className="credits">
          {entries.map((entry) => (
            <li key={entry.clip} className="credits__item">
              <p>
                <strong>{entry.speciesName}</strong>, recorded by {entry.recordist}
              </p>
              <p>
                Licence:{' '}
                {entry.deed ? (
                  <a href={entry.deed} target="_blank" rel="noopener noreferrer">
                    {entry.licenceLabel}
                  </a>
                ) : (
                  entry.licenceLabel
                )}
              </p>
              <p>
                Source:{' '}
                <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {entry.sourceUrl}
                </a>
              </p>
              <p className="fineprint">Changed for Birdie: {entry.changed}.</p>
            </li>
          ))}
        </ul>

        <p className="fineprint">
          {shareAlike.length > 0
            ? `Share-alike: these clips stay under their licence wherever they are copied: ${shareAlike
                .map((entry) => entry.clip)
                .join(', ')}.`
            : 'None of the clips here is share-alike, so nothing constrains how the app itself is distributed.'}
        </p>
      </section>

      <button type="button" className="chip" onClick={onBack}>
        Back to the yard
      </button>
    </main>
  );
}
