import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const maxTokens = options?.maxTokens ?? 4096;
  const temperature = options?.temperature ?? 0.3;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  const firstBlock = response.content[0];
  if (firstBlock.type !== 'text') {
    throw new Error('Unexpected response type from Claude API');
  }

  return firstBlock.text;
}

export async function callClaudeJSON<T>(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<T> {
  const jsonInstruction =
    '\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanations, no code fences.';

  const rawResponse = await callClaude(
    systemPrompt + jsonInstruction,
    userMessage,
    options
  );

  const cleaned = rawResponse
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (firstError) {
    const retryResponse = await callClaude(
      systemPrompt,
      `${userMessage}\n\nYou MUST respond in valid JSON only. No markdown fences, no extra text. Only a single JSON object.`,
      options
    );

    const retryCleaned = retryResponse
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      return JSON.parse(retryCleaned) as T;
    } catch (secondError) {
      throw new Error(
        `Failed to parse Claude response as JSON after retry. Original error: ${
          firstError instanceof Error ? firstError.message : String(firstError)
        }`
      );
    }
  }
}
