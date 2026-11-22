import type { SpeciesRecord } from '../types.js';

/**
 * American Robin — Turdus migratorius.
 *
 * STATUS: PROVISIONAL (`verified: false`). One figure is measured, several are
 * declared simplifications, and one thing that matters most — what these
 * recordings actually contain — could not be confirmed without ears. Every
 * unsourced or unconfirmed field is listed in `provisional` and renders as
 * provisional in the UI.
 *
 * What is *not* in dispute:
 * - It is among the earliest birds to sing at dawn, and the song is a repeated
 *   series of discrete units.
 * - It forages primarily on the ground, for soft-bodied invertebrates.
 * - It breeds across most of North America; many northern birds migrate south,
 *   but robins also overwinter in the northern United States.
 */
export const americanRobin: SpeciesRecord = {
  id: 'american-robin',
  commonName: 'American Robin',
  scientificName: 'Turdus migratorius',

  songs: [
    {
      id: 'pillar-carol-01',
      clip: 'audio/american-robin/pillar-carol-01.mp3',
      durationSeconds: 12.06,
      songTypeName: 'Continuous carol (unclassified)',
      description:
        'A 12 s excerpt of continuous, fast repeated whistled phrases — the "cheerily, cheer-up" caroling delivery. Deliberately not labelled as a named song type: naming one requires an audition we have not done.',
      recordist: 'G. McGrane',
      license: 'public-domain',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:American_Robin.ogg',
      citationId: 'audio-mcgrane-robin',
      clipRange: { fromSeconds: 23.5, toSeconds: 35.5 },
    },
  ],

  // Deliberately empty. Two further public-domain recordings were located (NPS
  // Yellowstone, 3.5 s and 37 s) but cannot be classified as song vs call without
  // listening, and guessing is the failure mode this record exists to prevent.
  calls: [],

  repertoire: {
    shipped: 1,
    documented: null,
    note:
      'No published count of distinct song types was located, so none is stated. The song is described as "several discrete units that are repeated"; we ship one recorded excerpt, which is not a repertoire.',
  },

  cadence: {
    dawn: {
      songsPerMinute: 67.7,
      method: 'measured',
      citationId: 'audio-mcgrane-robin',
      note:
        'Counted from the shipped source recording: 43 phrases over 38.1 s of continuous caroling (the file opens with ~8 s of silence; there are no gaps longer than 1.2 s thereafter). Method: 25 ms RMS envelope over 22.05 kHz mono, threshold at 35% of the dynamic range, segments merged across gaps under 120 ms, shortest accepted phrase 60 ms. The shipped clip is a 12 s excerpt at average density (14 phrases, 70/min). Limits: the recording may contain more than one individual, which would inflate the rate; the dawn attribution rests on this being a spring dawn chorus, which the source does not state; and the count has not been verified by ear.',
    },
    morning: {
      songsPerMinute: 34,
      method: 'simplified',
      citationId: null,
      note:
        'Placeholder, not data. Robins sing most at dawn and less through the day, which is well attested, but no figure was located for this period. Set at half the measured dawn rate.',
    },
    midday: {
      songsPerMinute: 10,
      method: 'simplified',
      citationId: null,
      note: 'Placeholder, not data. Occasional daytime song only; figure is a declared choice.',
    },
    dusk: {
      songsPerMinute: 20,
      method: 'simplified',
      citationId: null,
      note: 'Placeholder, not data. Some evening song; figure is a declared choice.',
    },
    night: {
      songsPerMinute: 0,
      method: 'published',
      citationId: 'wiki-american-robin',
      note:
        'The species is described as active mostly during the day; night song is not modelled. Zero here means "known silent", not "unknown".',
    },
  },

  seasonality: {
    spring: 'breeding',
    summer: 'breeding',
    fall: 'present',
    winter: 'present',
  },

  strata: {
    // PROVISIONAL: that robins sing from treetops is everyday birding knowledge,
    // but the source read covers foraging, not song perches. Marked, not assumed.
    preferred: 'canopy',
    tolerated: ['midstory', 'ground'],
  },

  fieldMarks:
    'Rusty-orange breast, dark grey-brown back, yellow bill, white crescents around the eye, and a habit of running a few steps across the lawn, then stopping to listen.',

  journal: {
    child:
      'The robin is the bird hopping on the grass. He tips his head to listen for worms, then pulls one out of the ground. He wakes up early — sometimes before the sun does — and sings and sings.',
    birder:
      'Turdus migratorius. Among the earliest singers in the dawn chorus; the song is a rapid, continuous series of discrete repeated units rather than discrete bouts. Forages primarily on the ground for soft-bodied invertebrates, locating prey by sight and sometimes by sound. Breeds across most of North America; northern populations largely withdraw in winter, though the species overwinters well into the northern United States, often in flocks. This record is provisional: the cadence figures outside dawn are declared simplifications, the singing stratum is unsourced, and the shipped audio has not been verified by ear.',
  },

  sources: [
    {
      id: 'wiki-american-robin',
      title: 'American robin',
      authors: 'Wikipedia contributors',
      publisher: 'Wikipedia, The Free Encyclopedia',
      url: 'https://en.wikipedia.org/wiki/American_robin',
      accessed: '2026-11-22',
    },
    {
      id: 'audio-mcgrane-robin',
      title: 'American Robin (audio recording, 46.2 s)',
      authors: 'G. McGrane',
      publisher: 'Wikimedia Commons',
      url: 'https://commons.wikimedia.org/wiki/File:American_Robin.ogg',
      accessed: '2026-11-22',
    },
  ],

  verified: false,
  provisional: [
    'cadence.dawn — counted mechanically, not verified by ear; may include more than one individual; dawn attribution presumed from the recording, not stated by it',
    'cadence.morning — declared simplification, no source',
    'cadence.midday — declared simplification, no source',
    'cadence.dusk — declared simplification, no source',
    'repertoire.documented — no published count of song types located',
    'strata.preferred — singing perch not covered by the source read',
    'fieldMarks — from general reading, not tied to a single citation',
    'journal.birder — same',
    'calls — empty; two further public-domain recordings await audition',
  ],
};
