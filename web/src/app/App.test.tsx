import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';

import { App } from './App.js';
import { DEFAULT_CLOCK, formatDate, formatTime, toEnvironment } from '../env/clock.js';

// A smoke test for the shell. No DOM needed: renderToString proves the component
// tree mounts, and the assertions pin the two things the plan says must always be
// on screen — the simulated time (D8) and an honest statement of what is real.
describe('App shell', () => {
  // renderToString injects <!-- --> between adjacent text nodes; strip them so
  // assertions can match the text a reader would actually see.
  const html = renderToString(<App />).replace(/<!--[\s\S]*?-->/g, '');

  it('renders the simulated time and date that D8 requires to be visible', () => {
    expect(html).toContain(formatTime(DEFAULT_CLOCK));
    expect(html).toContain(formatDate(DEFAULT_CLOCK));
    expect(html).toContain('spring');
  });

  it('names the period for the default spring dawn', () => {
    expect(toEnvironment(DEFAULT_CLOCK, 'suburban-yard').period).toBe('dawn');
    expect(html).toContain('Dawn chorus');
  });

  it('shows the computed daylight window rather than a hard-coded one', () => {
    const { daylight } = toEnvironment(DEFAULT_CLOCK, 'suburban-yard');
    expect(html).toContain(`${daylight.hours.toFixed(1)} h of daylight`);
  });

  it('states that no device clock is read', () => {
    expect(html).toContain('Nothing here reads your device clock');
  });

  it('does not claim unbuilt features are finished', () => {
    expect(html).toContain('What is real so far');
    expect(html).toContain('The chorus');
  });

  it('shows the bird with its measured figure and its provisional flag', () => {
    expect(html).toContain('American Robin');
    expect(html).toContain('Turdus migratorius');
    expect(html).toContain('51.2 elements a minute');
    expect(html).toContain('provisional');
    expect(html).not.toContain('verified by ear');
  });
});
