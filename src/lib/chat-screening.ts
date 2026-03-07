const PHONE_PATTERNS = [
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  /\b\(\d{3}\)\s?\d{3}[-.\s]?\d{4}\b/g,
  /\b\+\d{1,3}[-.\s]?\d{3,14}\b/g,
];

const SOCIAL_PATTERNS = [
  /\b(?:ig|insta|instagram)\s*[:@]\s*\S+/gi,
  /\b(?:snap|snapchat)\s*[:@]\s*\S+/gi,
  /\b(?:twitter|x\.com)\s*[:@/]\s*\S+/gi,
  /\b(?:tiktok|tt)\s*[:@]\s*\S+/gi,
  /\b(?:fb|facebook)\s*[:@/]\s*\S+/gi,
  /\b(?:linkedin|li)\s*[:@/]\s*\S+/gi,
  /@[a-zA-Z0-9_.]{2,30}\b/g,
];

const LINK_PATTERNS = [
  /https?:\/\/\S+/gi,
  /\b\w+\.(com|net|org|io|co|me|app|xyz|dev)\b/gi,
];

const EMAIL_PATTERN = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;

const REPLACEMENT = "[ EXTERNAL ROUTING BLOCKED ]";

export interface ScreeningResult {
  isClean: boolean;
  sanitizedContent: string;
  violations: string[];
}

export function screenMessage(content: string): ScreeningResult {
  const violations: string[] = [];
  let sanitized = content;

  for (const pattern of PHONE_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      violations.push(`phone number: ${matches.join(", ")}`);
      sanitized = sanitized.replace(pattern, REPLACEMENT);
    }
  }

  for (const pattern of SOCIAL_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      violations.push(`social handle: ${matches.join(", ")}`);
      sanitized = sanitized.replace(pattern, REPLACEMENT);
    }
  }

  for (const pattern of LINK_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      violations.push(`link: ${matches.join(", ")}`);
      sanitized = sanitized.replace(pattern, REPLACEMENT);
    }
  }

  const emailMatches = content.match(EMAIL_PATTERN);
  if (emailMatches) {
    violations.push(`email: ${emailMatches.join(", ")}`);
    sanitized = sanitized.replace(EMAIL_PATTERN, REPLACEMENT);
  }

  return {
    isClean: violations.length === 0,
    sanitizedContent: sanitized,
    violations,
  };
}

export const MAX_STRIKES = 3;
export const SHADOWBAN_HOURS = 48;
