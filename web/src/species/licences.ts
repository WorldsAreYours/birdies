import { LICENSES, licencePolicy, type License } from './types.js';

/**
 * Licence facts, read from `licence-policy.json`.
 *
 * The classifier that *refuses* a new file lives in `tools/curation/licence.py`,
 * because a file is found by a curation tool and not by the browser. This module
 * is the other half: what the app is allowed to name, what it owes for each
 * licence, and the deed URL a credit has to link to. Both read the same JSON, so
 * there is one list of permissible licences rather than two that drift.
 */

export interface LicenceFacts {
  readonly id: License;
  /** `public-domain`, `cc0`, `cc-by` or `cc-by-sa`. Carries the obligations. */
  readonly family: string;
  /** Deed URL for the credit line. `null` for public domain, which has no deed. */
  readonly deed: string | null;
  readonly requiresAttribution: boolean;
  readonly shareAlike: boolean;
  /** What a person reads: "CC BY-SA 4.0", "Public domain". */
  readonly label: string;
}

function labelFor(id: License): string {
  if (id === 'public-domain') return 'Public domain';
  if (id === 'cc0') return 'CC0 1.0';
  // `cc-by-sa-3.0` → `CC BY-SA 3.0`.
  const [prefix = '', ...rest] = id.split('-');
  const version = rest.pop() ?? '';
  const parts = rest.map((part) => part.toUpperCase()).join('-');
  return `${prefix.toUpperCase()} ${parts} ${version}`.replace(/\s+/g, ' ').trim();
}

export function licenceFacts(id: License): LicenceFacts {
  const entry = licencePolicy.licences[id];
  if (!entry) {
    // Reachable when a value arrives as data rather than as a literal: the type
    // cannot save us, so the message says what to do instead of throwing a
    // property access into a stack trace nobody reads.
    throw new Error(`licence ${id} is not in licence-policy.json, so nothing may ship under it`);
  }
  const family = licencePolicy.families[entry.family as keyof typeof licencePolicy.families];
  if (!family) throw new Error(`licence-policy.json: ${id} names unknown family ${entry.family}`);
  return {
    id,
    family: entry.family,
    deed: entry.deed,
    requiresAttribution: family.requiresAttribution,
    shareAlike: family.shareAlike,
    label: labelFor(id),
  };
}

/** True when `value` is a licence the policy permits. Narrows for callers. */
export function isLicence(value: string): value is License {
  return (LICENSES as readonly string[]).includes(value);
}

/** Every licence in the policy, with its obligations resolved. */
export function allLicenceFacts(): readonly LicenceFacts[] {
  return LICENSES.map(licenceFacts);
}

/**
 * The statement that the audio was changed, which CC BY and CC BY-SA require
 * alongside the credit. Trim points are per clip, so the caller supplies them.
 */
export function changeStatement(fromSeconds: number, toSeconds: number): string {
  return `cut from ${fromSeconds.toFixed(1)}–${toSeconds.toFixed(1)} s of the source, ${licencePolicy.changeStatement}`;
}
