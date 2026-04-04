const KNOWN_SKILLS = ['python', 'javascript', 'typescript', 'java', 'go', 'rust', 'c++', 'c#', 'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring boot', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'github actions', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'kafka', 'machine learning', 'deep learning', 'nlp', 'tensorflow', 'pytorch', 'pandas', 'spark', 'airflow', 'rest api', 'graphql', 'microservices', 'distributed systems', 'agile', 'scrum', 'git', 'linux', 'sql', 'html', 'css', 'tailwind', 'swift', 'kotlin', 'flutter', 'react native', 'figma'];

export function scoreJobMatch(userSkills: string[], jobDescription: string) {
  const jdLower = jobDescription.toLowerCase();
  const userLower = userSkills.map(s => s.toLowerCase());
  const jdSkills = KNOWN_SKILLS.filter(kw => jdLower.includes(kw));
  const matched = jdSkills.filter(kw => userLower.some(s => s.includes(kw) || kw.includes(s)));
  const missing = jdSkills.filter(kw => !userLower.some(s => s.includes(kw) || kw.includes(s)));
  const matchScore = jdSkills.length > 0 ? Math.round((matched.length / jdSkills.length) * 100) : 50;
  return { matchScore, matchedSkills: matched, missingSkills: missing };
}
