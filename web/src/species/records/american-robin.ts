import type { SpeciesRecord } from '../types.js';

/**
 * American Robin — Turdus migratorius.
 *
 * STATUS: PROVISIONAL (`verified: false`). Two figures are measured, the
 * repertoire now has a published range, and the singing stratum has a source —
 * but the shipped audio still has not been listened to by anyone, and the call
 * vocabulary is unwritten. Every unsourced or unconfirmed field is listed in
 * `provisional` and renders as provisional in the UI.
 *
 * What is *not* in dispute:
 * - It is among the earliest birds to sing at dawn, and the song is a repeated
 *   series of discrete units (Wikipedia; Johnson 2006).
 * - Dawn is the peak and evening a second, lesser peak (Miller 1958;
 *   Slagsvold 1996).
 * - It forages primarily on the ground, for soft-bodied invertebrates.
 * - It breeds across most of North America; many northern birds migrate south,
 *   but robins also overwinter in the northern United States.
 *
 * Sound curation for this species: `docs/curation/american-robin-audio.md`.
 * Audition still owed: `docs/curation/american-robin-audition.md`.
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

  // Deliberately empty, and the 2026-11-22 audition did not fill it. Nine call
  // recordings were located; two were heard. A06 carries a call but sits in a
  // wash of white noise, and A19 has a blue jay over a prominent robin. Neither
  // yields a name, and naming a call type from a guess is the failure mode this
  // record exists to prevent. See docs/curation/american-robin-audition.md.
  calls: [],

  repertoire: {
    shipped: 1,
    documented: 25,
    note:
      'Males typically have 6–25 whistle element types, plus a larger hisselly ("whisper") set that the sources do not quantify (Johnson 2006, citing Sallabanks & James 1999). 25 is the top of the whistle range: using it makes "we ship 1 of ~25" understate what we have rather than overstate it. Elements are combined into groups typically of 3–8, and whistle elements are sung 5–10 times more often than hisselly ones. 75–82% of elements are invented or improvised rather than imitated, so regional variation in the song is real (Johnson 2006).',
  },

  cadence: {
    dawn: {
      songsPerMinute: 67.7,
      method: 'measured',
      citationId: 'audio-mcgrane-robin',
      note:
        'Counted from the shipped source recording: 43 phrases over 38.1 s of continuous caroling (the file opens with ~8 s of silence; there are no gaps longer than 1.2 s thereafter). Method: 25 ms RMS envelope over 22.05 kHz mono, threshold at 35% of the file\'s own dynamic range, segments merged across gaps under 120 ms, shortest accepted phrase 60 ms. The shipped clip is a 12 s excerpt at average density (14 phrases, 70/min). Corroborated by an independent dawn recording (XC128490, 7 min 21 s of continuous song from a maple tree): 525 phrases over 440.7 s = 71.5/min — auditioned by ear, that file has one prominent bird with other robins audible in the background, so its rate is a chorus figure and an upper bound for a single male; and by Johnson 2006, whose own field recordings give "100 elements in under 100 sec" for a male in the pre-dawn chorus (>=60/min, though an element is not the same unit as an envelope burst). Limits: this source may contain more than one individual — its description says "American Robins", plural — which would inflate the rate; the dawn attribution rests on this being a spring dawn chorus, which the source does not state; and the count has not been verified by ear.',
    },
    morning: {
      songsPerMinute: 34,
      method: 'simplified',
      citationId: null,
      note:
        'Placeholder for the magnitude, not for the shape: Miller 1958 describes robin song as "intermittently throughout the day" outside the dawn and evening peaks. Set at half the measured dawn rate. The figure is a declared choice and is not presented as data.',
    },
    midday: {
      songsPerMinute: 10,
      method: 'simplified',
      citationId: null,
      note:
        'Placeholder for the magnitude, not for the shape: Slagsvold 1996 found mated males peaked at dawn and "sang little around noon". A low daytime rate is therefore documented; the figure itself is a declared choice.',
    },
    dusk: {
      songsPerMinute: 43,
      method: 'measured',
      citationId: 'xc132864',
      note:
        'Counted from XC132864 — the recordist\'s note reads "Singing from 15m up at top of spruce tree in campground just before sundown": 144 bursts over 200.8 s of active span = 43.0/min. The recordist labels the file "call, song", so this is an upper bound on song alone; it is one bird on one evening, enough to replace a placeholder and not enough to be a population figure. It sits where the literature puts evening song: Miller 1958 describes a second, lesser peak before roosting. Auditioned by ear: one clean, prominent robin and no other species; the listener could not tell song from call on this file, so the mix the recordist\'s own label implies is unresolved, and 43/min stays an upper bound on song.',
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
    // Sourced only at secondary level: Wikipedia states "It usually sings from a
    // high perch in a tree", and two recordists describe song from the top of
    // 10 m and 15 m spruces. The Birds of North America account has not been
    // read (paywalled), so this stays listed as provisional.
    preferred: 'canopy',
    tolerated: ['midstory', 'ground'],
  },

  fieldMarks:
    'Rusty-orange breast, dark grey-brown back, yellow bill, white crescents around the eye, and a habit of running a few steps across the lawn, then stopping to listen.',

  journal: {
    child:
      'The robin is the bird hopping on the grass. He tips his head to listen for worms, then pulls one out of the ground. He wakes up early — sometimes before the sun does — and sings and sings.',
    birder:
      'Turdus migratorius. Among the earliest singers in the dawn chorus; the song is a rapid, continuous series of discrete repeated units rather than discrete bouts, built from whistle elements (clear, 1.5–4 kHz) and hisselly or whisper elements (wider-band, more complex). Males hold 6–25 whistle element types and combine them into groups of 3–8, singing whistle elements 5–10 times more often than hisselly ones; most elements are invented rather than imitated, so the song varies regionally. Dawn is the peak of song activity and evening a lesser second peak; song largely stops around noon. Song period runs from late February or early March to late July or early August. Usually sings from a high perch in a tree, forages primarily on the ground for soft-bodied invertebrates, locating prey by sight and sometimes by sound. Breeds across most of North America; northern populations largely withdraw in winter, though the species overwinters well into the northern United States, often in flocks feeding on fruit. This record is provisional: the morning and midday rates are declared simplifications, the dawn figure may include more than one individual, the call vocabulary is unwritten, and the shipped audio has not been verified by ear.',
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
      id: 'johnson-2006',
      title: 'Do American Robins acquire songs by both imitating and inventing?',
      authors: 'Johnson, S. L.',
      publisher: 'The Wilson Journal of Ornithology 118(3): 341–352',
      url: 'https://doi.org/10.1676/05-048.1',
      accessed: '2026-11-22',
    },
    {
      id: 'slagsvold-1996',
      title: 'Dawn and dusk singing of male American Robins in relation to female behavior',
      authors: 'Slagsvold, T.',
      publisher: 'The Wilson Journal of Ornithology 108(3): 507–515',
      url: 'https://doi.org/10.5281/zenodo.16520585',
      accessed: '2026-11-22',
    },
    {
      id: 'miller-1958',
      title: 'Morning and evening song of robins in different latitudes',
      authors: 'Miller, R. C.',
      publisher: 'The Condor 60(2): 105–107',
      url: 'https://doi.org/10.2307/1365267',
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
    {
      id: 'xc128490',
      title: 'American Robin (Turdus migratorius), XC128490 — 441.6 s, "singing before dawn from a maple tree"',
      authors: 'Jonathon Jongsma',
      publisher: 'Xeno-canto, mirrored on Wikimedia Commons',
      url: 'https://commons.wikimedia.org/wiki/File:Turdus_migratorius_-_American_Robin_XC128490.ogg',
      accessed: '2026-11-22',
    },
    {
      id: 'xc132864',
      title: 'American Robin (Turdus migratorius), XC132864 — 207.6 s, "singing from 15m up at top of spruce tree just before sundown"',
      authors: 'Jonathon Jongsma',
      publisher: 'Xeno-canto, mirrored on Wikimedia Commons',
      url: 'https://commons.wikimedia.org/wiki/File:Turdus_migratorius_-_American_Robin_XC132864.ogg',
      accessed: '2026-11-22',
    },
  ],

  verified: false,
  provisional: [
    'cadence.dawn — counted mechanically, not verified by ear; source description says "American Robins", so more than one individual cannot be ruled out; dawn attribution presumed from the recording, not stated by it',
    'cadence.morning — magnitude is a declared simplification (its shape is sourced to Miller 1958)',
    'cadence.midday — magnitude is a declared simplification (its shape is sourced to Slagsvold 1996)',
    'cadence.dusk — measured from one bird on one evening, from a file the recordist labels "call, song"; the 2026-11-22 audition confirmed one bird but could not separate song from call, so song alone is below 43/min',
    'repertoire.documented — 6–25 is a published range, not a census; the hisselly repertoire is unquantified',
    'songs — the one shipped clip\'s song type is unclassified, and the two auditioned candidates for named variants were rejected: A08 has a cardinal and a red-winged blackbird in it, A10 has a blackbird',
    'calls — empty; A06 carries a call buried in white noise and A19 a robin under a blue jay, and no call type has been named',
    'strata.preferred — secondary source plus recordist notes only; Birds of North America not read',
    'fieldMarks — from general reading, not tied to a single citation',
    'journal.birder — assembled from the sources above, not reviewed by a birder',
  ],
};
