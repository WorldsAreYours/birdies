import type { SpeciesRecord } from '../types.js';

/**
 * American Robin — Turdus migratorius.
 *
 * STATUS: PROVISIONAL (`verified: false`). The shipped clip has now been
 * auditioned — one clean robin, and BirdNET agrees — and the dawn figure is
 * re-anchored on it after the previous source turned out to be a Hermit Thrush.
 * The morning and midday rates are still declared simplifications, the song type
 * is unclassified, and the call vocabulary is unwritten. Every unsourced or
 * unconfirmed field is listed in `provisional` and renders as provisional.
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
      durationSeconds: 10.04,
      clipUnit: 'excerpt',
      songTypeName: 'Song (unclassified)',
      description:
        'The first 10 s of Doug Hynes\'s XC570791: an adult male singing, one clean robin with no other species in the excerpt, by ear and by BirdNET (American Robin 0.85 in all three of its windows). The clip stops at 10 s because the recording turns mixed after that — Yellow-rumped Warbler and crows. Not labelled as a named song type: naming one is still ear work we have not done.',
      recordist: 'Doug Hynes',
      license: 'cc-by-sa-4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Turdus_migratorius_-_American_Robin_XC570791.mp3',
      citationId: 'xc570791',
      clipRange: { fromSeconds: 0, toSeconds: 10 },
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
      perMinute: 60,
      unit: 'element',
      method: 'published',
      citationId: 'johnson-2006',
      note:
        'Johnson (2006, p. 344) states that during the pre-dawn chorus an individual typically sings 100 elements in under 100 s, i.e. at least 60 elements/min. That is a floor, not a mean, and it is the only published single-male anchor. The measurements we have are all compromised in different ways: the clean 10 s opening of XC570791 measures 73.2 elements/min but is the densest of four 10 s chunks (73.2, 54.9, 49.4, 65.9); the whole XC570791 file measures 57.0/min after a 150 Hz high-pass but turns mixed with Yellow-rumped Warbler and crows after 10 s; XC128490 measures about 71/min but is a chorus, so an upper bound. The previous 51.2/min was an untreated count over the mixed span; low-frequency rumble pulled it down and the figure is withdrawn. The earlier 67.7/min came from the McGrane recording, whose first 33 s are Hermit Thrush by ear and BirdNET; that figure and every clip cut from it are withdrawn. The count has not been verified by ear beyond confirming a clean single robin in the 10 s opening. Dawn attribution: Johnson recorded pre-dawn song from 42 males in western Massachusetts; this record uses his rate rather than presuming a dawn label on a single Newfoundland recording.',
    },
    morning: {
      perMinute: 30,
      unit: 'element',
      method: 'simplified',
      citationId: null,
      note:
        'Placeholder for the magnitude, not for the shape: Miller 1958 describes robin song as "intermittently throughout the day" outside the dawn and evening peaks. Set at half the published dawn floor (60 → 30). The figure is a declared choice and is not presented as data.',
    },
    midday: {
      perMinute: 10,
      unit: 'element',
      method: 'simplified',
      citationId: null,
      note:
        'Placeholder for the magnitude, not for the shape: Slagsvold 1996 found mated males peaked at dawn and "sang little around noon". A low daytime rate is therefore documented; the figure itself is a declared choice.',
    },
    dusk: {
      perMinute: 43,
      unit: 'element',
      method: 'counted',
      citationId: 'xc132864',
      note:
        'Counted from XC132864 — the recordist\'s note reads "Singing from 15m up at top of spruce tree in campground just before sundown": 144 elements over 200.8 s of active span = 43.0/min. The recordist labels the file "call, song", so this element rate includes calls and is an upper bound on song elements; it is one bird on one evening, enough to replace a placeholder and not enough to be a population figure. It sits where the literature puts evening song: Miller 1958 describes a second, lesser peak before roosting. Auditioned by ear: one clean, prominent robin and no other species; the listener could not tell song from call on this file, so the mix the recordist\'s own label implies is unresolved.',
    },
    night: {
      perMinute: 0,
      unit: 'element',
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
      'Turdus migratorius. Among the earliest singers in the dawn chorus; the song is a rapid, continuous series of discrete repeated units rather than discrete bouts, built from whistle elements (clear, 1.5–4 kHz) and hisselly or whisper elements (wider-band, more complex). Males hold 6–25 whistle element types and combine them into groups of 3–8, singing whistle elements 5–10 times more often than hisselly ones; most elements are invented rather than imitated, so the song varies regionally. Dawn is the peak of song activity and evening a lesser second peak; song largely stops around noon. Song period runs from late February or early March to late July or early August. Usually sings from a high perch in a tree, forages primarily on the ground for soft-bodied invertebrates, locating prey by sight and sometimes by sound. Breeds across most of North America; northern populations largely withdraw in winter, though the species overwinters well into the northern United States, often in flocks feeding on fruit. This record is provisional: the morning and midday rates are declared simplifications, the dawn figure is one male in one Newfoundland recording whose dawn attribution is presumed, the song type is unclassified, and the call vocabulary is unwritten.',
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
      title: 'American Robin (audio recording, 46.2 s) — WITHDRAWN as a robin source: audition and BirdNET place its first 33 s as Hermit Thrush',
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
      id: 'xc570791',
      title: 'American Robin (Turdus migratorius), XC570791 — 43.78 s, adult male song, Goulds, Newfoundland and Labrador',
      authors: 'Doug Hynes',
      publisher: 'Xeno-canto, mirrored on Wikimedia Commons',
      url: 'https://commons.wikimedia.org/wiki/File:Turdus_migratorius_-_American_Robin_XC570791.mp3',
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
    'cadence.dawn — counted mechanically from one male in one recording and not verified by ear beyond the shipped clip; the recordist labels the file "adult, male, song", so the dawn attribution is presumed rather than stated',
    'cadence.morning — magnitude is a declared simplification (its shape is sourced to Miller 1958)',
    'cadence.midday — magnitude is a declared simplification (its shape is sourced to Slagsvold 1996)',
    'cadence.dusk — measured from one bird on one evening, from a file the recordist labels "call, song"; the 2026-11-22 audition confirmed one bird but could not separate song from call, so song alone is below 43/min',
    'repertoire.documented — 6–25 is a published range, not a census; the hisselly repertoire is unquantified',
    'songs — one clip ships and its song type is unclassified; only the first 10 s of its source are usable because the recording turns mixed after that, and the auditioned candidates for named variants were rejected (A08 carries a cardinal and a red-winged blackbird, A10 a blackbird)',
    'calls — empty; A06 carries a call buried in white noise and A19 a robin under a blue jay, and no call type has been named',
    'strata.preferred — secondary source plus recordist notes only; Birds of North America not read',
    'fieldMarks — from general reading, not tied to a single citation',
    'journal.birder — assembled from the sources above, not reviewed by a birder',
  ],
};
