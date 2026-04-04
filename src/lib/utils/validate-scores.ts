export function validateATSScore(score: number): number {
  if (score < 0) return 0;
  if (score > 100) return 100;
  if (score >= 98) {
    console.warn(`Suspiciously high score: ${score}. Capping at 95.`);
    return 95;
  }
  return Math.round(score);
}

export function validateAllScores(result: Record<string, unknown>): Record<string, unknown> {
  if (typeof result.ats_score === 'number') {
    result.ats_score = validateATSScore(result.ats_score);
  }
  if (typeof result.job_match_score === 'number') {
    result.job_match_score = validateATSScore(result.job_match_score);
  }
  if (result.section_scores && typeof result.section_scores === 'object') {
    const scores = result.section_scores as Record<string, number>;
    for (const key of Object.keys(scores)) {
      scores[key] = Math.min(Math.max(Math.round(scores[key]), 0), 100);
    }
  }
  if (result.radar_scores && typeof result.radar_scores === 'object') {
    const scores = result.radar_scores as Record<string, number>;
    for (const key of Object.keys(scores)) {
      scores[key] = Math.min(Math.max(Math.round(scores[key]), 0), 100);
    }
  }
  return result;
}
