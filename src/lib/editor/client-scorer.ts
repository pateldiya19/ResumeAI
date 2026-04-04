const STRONG_VERBS = ['led', 'built', 'architected', 'designed', 'shipped', 'scaled', 'automated', 'reduced', 'increased', 'launched', 'managed', 'developed', 'engineered', 'implemented', 'optimized', 'delivered', 'created', 'established', 'transformed', 'spearheaded', 'orchestrated', 'pioneered', 'streamlined', 'accelerated'];
const WEAK_VERBS = ['helped', 'worked on', 'assisted', 'participated', 'was responsible', 'contributed to', 'involved in', 'supported', 'handled', 'dealt with'];

export interface ClientScore {
  atsEstimate: number;
  breakdown: { keywords: number | null; structure: number; actionVerbs: number; metrics: number; formatting: number };
  keywordMatches: Array<{ keyword: string; found: boolean }>;
  weakVerbs: string[];
  metricCount: number;
  wordCount: number;
}

export function clientSideScore(resumeText: string, jdKeywords?: string[]): ClientScore {
  const text = resumeText.toLowerCase();

  let keywordMatches: Array<{ keyword: string; found: boolean }> = [];
  let keywordScore: number | null = null;
  if (jdKeywords && jdKeywords.length > 0) {
    keywordMatches = jdKeywords.map(kw => ({ keyword: kw, found: text.includes(kw.toLowerCase()) }));
    keywordScore = Math.round((keywordMatches.filter(k => k.found).length / jdKeywords.length) * 100);
  }

  const sections = {
    hasSummary: /summary|objective|profile|about/i.test(text),
    hasExperience: /experience|work\s*history|employment/i.test(text),
    hasEducation: /education|academic|university|college|degree/i.test(text),
    hasSkills: /skills|technologies|tech\s*stack|proficiencies/i.test(text),
    hasContact: /email|phone|linkedin|github/i.test(text),
  };
  const structureScore = Math.round((Object.values(sections).filter(Boolean).length / 5) * 100);

  const strongCount = STRONG_VERBS.filter(v => text.includes(v)).length;
  const weakCount = WEAK_VERBS.filter(v => text.includes(v)).length;
  const verbScore = Math.min(100, Math.round((strongCount / Math.max(strongCount + weakCount, 1)) * 100));

  const metricMatches = text.match(/\d+%|\$\d+|\d+x|\d+\+|\d{1,3},\d{3}|\d+\s*(users|clients|revenue|team|engineers|projects|requests)/gi) || [];
  const bulletCount = (text.match(/^[\s]*[-•●▪]/gm) || []).length || 10;
  const metricsScore = Math.min(100, Math.round((metricMatches.length / Math.max(bulletCount * 0.6, 1)) * 100));

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const formattingChecks = {
    rightLength: wordCount >= 150 && wordCount <= 1200,
    noBigParagraphs: !/[^\n]{500,}/g.test(text),
    hasBullets: /[-•●▪]/g.test(text),
    notAllCaps: !/^[A-Z\s]{50,}$/m.test(text),
  };
  const formattingScore = Math.round((Object.values(formattingChecks).filter(Boolean).length / 4) * 100);

  const atsEstimate = Math.round(
    structureScore * 0.25 + verbScore * 0.20 + metricsScore * 0.25 + formattingScore * 0.15 + ((keywordScore ?? 70) * 0.15)
  );

  return {
    atsEstimate,
    breakdown: { keywords: keywordScore, structure: structureScore, actionVerbs: verbScore, metrics: metricsScore, formatting: formattingScore },
    keywordMatches,
    weakVerbs: WEAK_VERBS.filter(v => text.includes(v)),
    metricCount: metricMatches.length,
    wordCount,
  };
}

export function extractKeywordsFromJD(jdText: string): string[] {
  const known = ['python', 'javascript', 'typescript', 'java', 'go', 'rust', 'c++', 'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring boot', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'github actions', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'kafka', 'machine learning', 'deep learning', 'nlp', 'tensorflow', 'pytorch', 'pandas', 'spark', 'airflow', 'rest api', 'graphql', 'grpc', 'microservices', 'distributed systems', 'agile', 'scrum', 'git', 'linux', 'sql', 'html', 'css', 'tailwind', 'swift', 'kotlin', 'flutter', 'react native', 'blockchain', 'solidity'];
  const lower = jdText.toLowerCase();
  return known.filter(kw => lower.includes(kw));
}
