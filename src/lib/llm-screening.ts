const SYSTEM_PROMPT = `You are a content moderation system for a dating app called PROTOCOL. Users are prohibited from sharing personal contact information to bypass the platform's chat.

Your job: Analyze each message and determine if the user is attempting to share or solicit contact information through creative evasion techniques.

VIOLATIONS include:
- Spelled-out phone numbers ("five five five, zero one nine nine")
- Obfuscated social handles ("find me on the gram", "my insta starts with", "look up JohnDoe on twitter")
- Coded references to external platforms ("blue bird app", "the app with stories", "send me a snap")
- Instructions to search for someone externally ("google my name", "search for me on")
- Attempts to share emails in disguised form ("my name at gmail")
- Any creative circumvention of contact-sharing rules

DO NOT flag:
- Normal conversation about meeting up (the app encourages real meetings)
- References to locations, times, restaurants
- General discussion about social media as a topic
- Mentions of apps/platforms in casual context (not for sharing handles)

Respond with ONLY valid JSON. No markdown, no code fences.
{"flagged": true/false, "reason": "brief explanation if flagged, empty string if clean"}`;

export interface LLMScreeningResult {
  flagged: boolean;
  reason: string;
}

export async function screenWithLLM(messages: string[]): Promise<LLMScreeningResult[]> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return messages.map(() => ({ flagged: false, reason: "" }));

  const isAnthropic = !!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY;

  const results: LLMScreeningResult[] = [];

  // Batch messages into groups of 10 for efficiency
  const batchSize = 10;
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const userContent = batch.map((msg, idx) => `[${idx + 1}] "${msg}"`).join("\n");

    try {
      if (isAnthropic) {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: [{
              role: "user",
              content: `Analyze these ${batch.length} messages. Return a JSON array with one result per message:\n\n${userContent}\n\nRespond ONLY with: [{"flagged": bool, "reason": "..."}, ...]`,
            }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.content?.[0]?.text || "[]";
          const parsed = JSON.parse(text);
          results.push(...(Array.isArray(parsed) ? parsed : batch.map(() => ({ flagged: false, reason: "" }))));
        } else {
          results.push(...batch.map(() => ({ flagged: false, reason: "" })));
        }
      } else {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: `Analyze these ${batch.length} messages. Return a JSON array with one result per message:\n\n${userContent}\n\nRespond ONLY with: [{"flagged": bool, "reason": "..."}, ...]`,
              },
            ],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content || "[]";
          const parsed = JSON.parse(text);
          results.push(...(Array.isArray(parsed) ? parsed : batch.map(() => ({ flagged: false, reason: "" }))));
        } else {
          results.push(...batch.map(() => ({ flagged: false, reason: "" })));
        }
      }
    } catch {
      results.push(...batch.map(() => ({ flagged: false, reason: "" })));
    }
  }

  return results;
}
