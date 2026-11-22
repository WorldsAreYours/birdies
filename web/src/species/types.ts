import type { Period, Season } from '../env/types.js';

/**
 * The species record is the unit of authenticity.
 *
 * The plan's rule: anything hard-coded about a bird's behaviour is a bug in the
 * model. Every sound, cadence, season and habitat claim lives here as data, so
 * adding a sixth bird is a data edit rather than a code change.
 *
 * Two structures exist for honesty, not bureaucracy:
 * - `Citation` per claim, not per bird, so a birder can trace any single number.
 * - `verified` / `provisional`, so an unsourced claim renders as provisional in
 *   the UI instead of being asserted with the same confidence as a sourced one.
 */

export type SpeciesId =
  | 'american-robin'
  | 'northern-cardinal'
  | 'blue-jay'
  | 'black-capped-chickadee'
  | 'mourning-dove';

/**
 * Where in a yard a bird sits and sings. Defined here because species records
 * declare strata preference; `backyard/strata.ts` owns the geometry.
 */
export type Stratum = 'canopy' | 'midstory' | 'shrub' | 'ground' | 'feeder' | 'bath';

/** Audio licences we will ship under. NC is absent on purpose: it would block a paid tier. */
export type License =
  | 'public-domain'
  | 'cc0'
  | 'cc-by-2.5'
  | 'cc-by-4.0'
  | 'cc-by-sa-3.0'
  | 'cc-by-sa-4.0';

export interface Citation {
  /** Stable key, referenced by claims as `citationId`. */
  readonly id: string;
  readonly title: string;
  readonly authors: string;
  readonly publisher: string;
  readonly url: string;
  /** ISO date the source was read. Documentation only; never used on the play path. */
  readonly accessed: string;
}

/**
 * A recording we ship. Calls are not songs — birders care about the difference,
 * children do not yet — so they are separate arrays rather than one list with a flag.
 */
export interface SongVariant {
  readonly id: string;
  /** Path under `public/audio/<speciesId>/`. Every clip is precached for offline play. */
  readonly clip: string;
  readonly durationSeconds: number;
  /** The name a birder would use: "cheer-up", "whinny", "fee-bee". */
  readonly songTypeName: string;
  readonly description: string;
  readonly recordist: string;
  readonly license: License;
  readonly sourceUrl: string;
  readonly citationId: string;
  /** Trim points within the source recording, so the clip is reproducible. */
  readonly clipRange: { readonly fromSeconds: number; readonly toSeconds: number };
}

/**
 * A cadence figure and how we came by it.
 *
 * - `measured`   counted in a recording we ship; the note must say what was
 *                counted, over what window, and by what method.
 * - `published`  a literature figure.
 * - `simplified` a declared engineering choice standing in for missing data. It
 *                must have no citation, because inventing a source is worse than
 *                admitting the simplification. A record containing one is never
 *                `verified`, and the UI shows it as provisional.
 *
 * There is no `'guessed'`, because that describes the other two.
 */
export interface CadenceClaim {
  readonly songsPerMinute: number;
  readonly method: 'measured' | 'published' | 'simplified';
  /** Source for the figure. `null` is legal only when `method` is `simplified`. */
  readonly citationId: string | null;
  readonly note: string;
}

/**
 * Cadence by period, with periods we hold no figure for simply absent.
 *
 * Absent is not zero: zero means "we know this bird is silent then", absence
 * means "we do not know". The simulation must treat them differently, so the
 * type does too.
 */
export type CadenceTable = Readonly<Partial<Record<Period, CadenceClaim>>>;

export interface SpeciesRecord {
  readonly id: SpeciesId;
  readonly commonName: string;
  readonly scientificName: string;

  readonly songs: readonly SongVariant[];
  readonly calls: readonly SongVariant[];

  /**
   * Honesty about repertoire size. A cardinal has dozens of song types; we ship a
   * subset, and the UI says so rather than implying a complete repertoire.
   */
  readonly repertoire: {
    readonly shipped: number;
    /** `null` when no published count could be located. Never a guess. */
    readonly documented: number | null;
    readonly note: string;
  };

  /** Vocalisation rate by time-of-day bucket. `absent` seasons never reach this. */
  readonly cadence: CadenceTable;

  readonly seasonality: Readonly<Record<Season, 'breeding' | 'present' | 'absent'>>;

  readonly strata: {
    readonly preferred: Stratum;
    readonly tolerated: readonly Stratum[];
  };

  readonly fieldMarks: string;

  /** One dataset, two depths. Neither is a dumbed-down copy of the other. */
  readonly journal: {
    readonly child: string;
    readonly birder: string;
  };

  readonly sources: readonly Citation[];

  /** True only when every claim above carries a citation. */
  readonly verified: boolean;
  /** Field paths still lacking a source. Empty iff `verified` is true. */
  readonly provisional: readonly string[];
}

/** Month/habitat display helpers shared by UI and journal. */
export interface RecordSummary {
  readonly id: SpeciesId;
  readonly commonName: string;
  readonly scientificName: string;
  readonly verified: boolean;
}

export function summarise(record: SpeciesRecord): RecordSummary {
  return {
    id: record.id,
    commonName: record.commonName,
    scientificName: record.scientificName,
    verified: record.verified,
  };
}
