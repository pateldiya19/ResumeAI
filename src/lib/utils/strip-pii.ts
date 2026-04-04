export function stripPII(text: string): string {
  let cleaned = text;

  // Phone numbers (US)
  cleaned = cleaned.replace(
    /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    '[PHONE_REMOVED]'
  );
  // Indian phone numbers
  cleaned = cleaned.replace(/(\+91[-.\s]?)?\d{10}/g, '[PHONE_REMOVED]');

  // Email addresses
  cleaned = cleaned.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL_REMOVED]'
  );

  // Street addresses
  cleaned = cleaned.replace(
    /\d{1,5}\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|way|place|pl)\.?/gi,
    '[ADDRESS_REMOVED]'
  );

  // ZIP/Postal codes
  cleaned = cleaned.replace(/\b\d{5}(-\d{4})?\b/g, '[ZIP_REMOVED]');
  // Indian PIN codes
  cleaned = cleaned.replace(/\b\d{6}\b/g, '[PIN_REMOVED]');

  // SSN
  cleaned = cleaned.replace(
    /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g,
    '[SSN_REMOVED]'
  );

  // Aadhaar numbers
  cleaned = cleaned.replace(
    /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
    '[AADHAAR_REMOVED]'
  );

  return cleaned;
}

export function stripPIIFromParsedResume(parsed: Record<string, unknown>): Record<string, unknown> {
  const cleaned = { ...parsed };
  delete cleaned.phone;
  delete cleaned.email;
  delete cleaned.address;
  delete cleaned.ssn;
  delete cleaned.aadhaar;

  if (Array.isArray(cleaned.experience)) {
    cleaned.experience = cleaned.experience.map((exp: Record<string, unknown>) => ({
      ...exp,
      bullets: Array.isArray(exp.bullets)
        ? exp.bullets.map((b: string) => stripPII(b))
        : [],
    }));
  }

  return cleaned;
}
