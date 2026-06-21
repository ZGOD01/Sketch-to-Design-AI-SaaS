import { combinedSlug } from "../lib/utils";

export type ConvexUserRaw = {
  _creationTime: number;
  _id: string;
  email: string;
  emailVerificationTime?: number;
  image?: string;
  name?: string;
};

export type Profile = {
  id: string;           // normalized from _id
  createdAtMs: number;  // from _creationTime
  email: string;
  emailVerifiedAtMs?: number;
  image?: string;
  name?: string;        // URL slug (used for routing)
  displayName?: string; // Human-readable display name
};

/**
 * Converts an email to a readable display name.
 * e.g. "rute.gadhave@gmail.com" → "Rute Gadhave"
 */
const displayNameFromEmail = (email: string): string => {
  const username = email.split("@")[0];
  return username
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Converts a raw name into a readable display name.
 * Preserves spaces and capitalisation.
 * e.g. "john doe" → "John Doe"
 */
const toDisplayName = (raw: string): string =>
  raw
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

export const normalizeProfile = (raw: ConvexUserRaw | null): Profile | null => {
  if (!raw) return null;

  // URL slug for routing (kept for backward compat)
  const name = combinedSlug(raw.name ?? "") || combinedSlug(displayNameFromEmail(raw.email));

  // Human-readable display name (never shows "untitled")
  const displayName = raw.name
    ? toDisplayName(raw.name)
    : displayNameFromEmail(raw.email);

  return {
    id: raw._id,
    createdAtMs: raw._creationTime,
    email: raw.email,
    emailVerifiedAtMs: raw.emailVerificationTime,
    image: raw.image,
    name,
    displayName,
  };
};
