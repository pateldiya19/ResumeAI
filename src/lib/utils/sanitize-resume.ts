const INJECTION_PATTERNS = [
  // Direct instruction override
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /ignore\s+(all\s+)?above/gi,
  /disregard\s+(all\s+)?previous/gi,
  /forget\s+(all\s+)?previous/gi,
  /do\s+not\s+follow\s+(the\s+)?(above|previous)/gi,
  /override\s+(all\s+)?(previous|instructions|scoring)/gi,

  // Role manipulation
  /you\s+are\s+now/gi,
  /pretend\s+you\s+are/gi,
  /act\s+as\s+if/gi,
  /from\s+now\s+on/gi,
  /switch\s+to\s+.*mode/gi,
  /enter\s+.*mode/gi,
  /new\s+instruction/gi,
  /your\s+new\s+role/gi,

  // Score manipulation
  /score\s+(this|it|me)\s+(a\s+)?100/gi,
  /give\s+(this|it|me)\s+(a\s+)?(perfect|100|high)/gi,
  /maximum\s+score/gi,
  /always\s+(give|return|output)\s+(a\s+)?high/gi,
  /set\s+score\s+to/gi,
  /ats.?score.{0,10}(100|perfect|highest)/gi,

  // LLM prompt markers
  /system\s*:\s*/gi,
  /assistant\s*:\s*/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<<SYS>>/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /<\|system\|>/gi,
  /<\|user\|>/gi,
  /<\|assistant\|>/gi,
  /\[SYSTEM\]/gi,
  /```system/gi,
  /###\s*instruction/gi,

  // Hidden text / formatting attacks
  /\u200B/g,  // zero-width space
  /\u200C/g,  // zero-width non-joiner
  /\u200D/g,  // zero-width joiner
  /\uFEFF/g,  // zero-width no-break space
  /\u00AD/g,  // soft hyphen (invisible)

  // Output manipulation
  /respond\s+only\s+with/gi,
  /output\s+only/gi,
  /return\s+only\s+this/gi,
  /say\s+(only\s+)?"[^"]*"/gi,
  /repeat\s+after\s+me/gi,
];

// Max resume length to prevent flooding attacks
const MAX_RESUME_LENGTH = 50000;

export function sanitizeResumeText(text: string): string {
  // Truncate excessively long input
  let cleaned = text.length > MAX_RESUME_LENGTH
    ? text.slice(0, MAX_RESUME_LENGTH)
    : text;

  // Strip all patterns
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[REMOVED]');
  }

  // Collapse excessive whitespace (common in padding attacks)
  cleaned = cleaned.replace(/\n{5,}/g, '\n\n\n');
  cleaned = cleaned.replace(/ {10,}/g, '  ');

  return cleaned;
}
