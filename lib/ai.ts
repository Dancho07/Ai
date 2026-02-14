import OpenAI from "openai";

export interface AiProvider {
  generateCopy(prompt: string): Promise<string>;
}

class OpenAiProvider implements AiProvider {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  async generateCopy(prompt: string): Promise<string> {
    const result = await this.client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });
    return result.output_text;
  }
}

class RuleBasedProvider implements AiProvider {
  async generateCopy(prompt: string): Promise<string> {
    return `Template suggestion:\n${prompt.slice(0, 220)}...\nCTA: Shop now and feel the difference.`;
  }
}

export function getAiProvider(): AiProvider {
  if (process.env.OPENAI_API_KEY) return new OpenAiProvider();
  return new RuleBasedProvider();
}
