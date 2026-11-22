import { useState } from 'react';

import {
  advance,
  formatDate,
  formatTime,
  setClock,
  toEnvironment,
  type SimulatedClock,
} from '../env/clock.js';
import type { Period } from '../env/types.js';
import { getRecord } from '../species/catalog.js';
import type { VocalizationUnit } from '../species/types.js';
import { vocalizationRate } from '../sim/rate.js';

/**
 * Phase 1 shell. It is deliberately small: it renders the one thing that is
 * finished — the simulated clock (D8) — and states plainly what is not built
 * yet rather than faking a yard.
 */

const PERIOD_LABEL: Record<Period, string> = {
  dawn: 'Dawn chorus',
  morning: 'Morning',
  midday: 'Midday',
  dusk: 'Dusk',
  night: 'Night',
};

const UNIT_PLURAL: Record<VocalizationUnit, string> = {
  element: 'elements',
  song: 'songs',
  bout: 'bouts',
};

const JUMPS: ReadonlyArray<readonly [string, number]> = [
  ['Pre-dawn', 4 * 60],
  ['Dawn', 5 * 60 + 40],
  ['Mid-morning', 9 * 60],
  ['Afternoon', 14 * 60],
  ['Dusk', 18 * 60 + 30],
  ['Night', 23 * 60],
];

export function App() {
  const [clock, setLocalClock] = useState<SimulatedClock>({
    dayOfYear: 121,
    minutes: 5 * 60 + 40,
  });

  const env = toEnvironment(clock, 'suburban-yard');
  const habitat = 'suburban yard';
  const bird = getRecord('american-robin');
  const dawn = bird.cadence.dawn;
  const rate = vocalizationRate(bird, env, 'canopy');
  const unitLabel = rate.unit ? UNIT_PLURAL[rate.unit] : 'events';
  const rateLabel =
    rate.perMinute === 0 ? 'not at all' : `about ${Math.round(rate.perMinute)} ${unitLabel} a minute`;
  const rateBasis =
    rate.confidence === 'sourced'
      ? 'from a sourced figure'
      : rate.confidence === 'counted'
        ? 'from a counted figure, not yet validated'
        : rate.confidence === 'simplified'
          ? 'from a placeholder figure, not data'
          : 'no figure for this time of day';

  return (
    <main className="birdie">
      <header className="birdie__head">
        <h1 className="birdie__title">Birdie</h1>
        <p className="birdie__subtitle">A quiet backyard, a few birds, one at a time.</p>
      </header>

      <section className="card" aria-labelledby="clock-heading">
        <h2 className="card__heading" id="clock-heading">
          Now in the yard
        </h2>

        {/* D8: the simulated hour and season are always on screen. A fact
            asserted without its condition is the kind of lie a birder resents. */}
        <p className="clock__time">
          <time dateTime={`sim-${formatTime(clock)}`}>{formatTime(clock)}</time>
          <span className="clock__date">
            {formatDate(clock)} · {env.season} · {habitat}
          </span>
        </p>

        <p className="clock__period">
          {PERIOD_LABEL[env.period]}
          <span className="clock__daylight">
            {env.daylight.hours.toFixed(1)} h of daylight, sunrise {formatTime({ ...clock, minutes: env.daylight.sunrise * 60 })}, sunset{' '}
            {formatTime({ ...clock, minutes: env.daylight.sunset * 60 })}
          </span>
        </p>

        <label className="dial">
          <span className="dial__label">Set the hour</span>
          <input
            type="range"
            min={0}
            max={1439}
            step={5}
            value={Math.round(clock.minutes)}
            onChange={(event) => setLocalClock(setClock(clock, { minutes: Number(event.target.value) }))}
            aria-describedby="dial-hint"
          />
          <span className="dial__hint" id="dial-hint">
            Move through the day. Seasons come later.
          </span>
        </label>

        <div className="chips">
          {JUMPS.map(([label, minutes]) => (
            <button
              key={label}
              type="button"
              className="chip"
              onClick={() => setLocalClock(setClock(clock, { minutes }))}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className="chip chip--ghost"
            onClick={() => setLocalClock(advance(clock, 60))}
          >
            +1 hour
          </button>
        </div>
      </section>

      <section className="card" aria-labelledby="bird-heading">
        <h2 className="card__heading" id="bird-heading">
          The first bird
        </h2>

        <p className="bird__name">
          {bird.commonName}
          {!bird.verified && <span className="badge">provisional</span>}
        </p>
        <p className="bird__sci">{bird.scientificName}</p>

        <p className="bird__fact">
          Dawn, counted from the recording in this app:{' '}
          <strong>
            {dawn ? `${dawn.perMinute.toFixed(1)} ${UNIT_PLURAL[dawn.unit]} a minute` : 'no figure yet'}
          </strong>
          <span className="bird__method">
            {dawn?.method === 'measured'
              ? 'measured, not guessed — see the note in the record'
              : dawn?.method === 'counted'
                ? 'counted, not yet validated — see the note in the record'
                : ''}
          </span>
        </p>

        <p className="bird__fact">{bird.journal.child}</p>
        <p className="bird__fact">
          At {formatTime(clock)}, this bird in the canopy would sing <strong>{rateLabel}</strong>
          <span className="bird__method">{rateBasis}</span>
        </p>


        <p className="bird__caveat">
          {bird.provisional.length} fields are still unsourced or unconfirmed, including whether this
          recording holds one robin or several. They are listed in the record rather than quietly
          presented as fact.
        </p>
      </section>

      <section className="card card--quiet">
        <h2 className="card__heading">What is real so far</h2>
        <ul className="status">
          <li className="status__done">The simulated clock: sunrise, sunset, season, time of day.</li>
          <li className="status__done">
            One American Robin record — one measured figure, its gaps declared.
          </li>
          <li className="status__todo">The chorus: rate through the day, variants, placement.</li>
          <li className="status__todo">Pieces, rounds, journal screens, the yard itself.</li>
        </ul>
        <p className="fineprint">
          Nothing here reads your device clock. The yard is always the hour you set it to.
        </p>
      </section>
    </main>
  );
}
