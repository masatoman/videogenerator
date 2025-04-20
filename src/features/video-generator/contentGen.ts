import axios from 'axios';
import { ContentGenerationResult } from './types';
import { Logger } from './utils/logger';

const logger = Logger.getInstance();

export class ContentGenerator {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.model = process.env.OPENROUTER_MODEL || 'shisa-ai/shisa-v2-llama3.3-70b:free';

    if (!this.apiKey && process.env.NODE_ENV !== 'test') {
      throw new Error('OPENROUTER_API_KEY is not set');
    }
  }

  private validateContent(content: any): void {
    if (!content.englishPhrase || !content.japaneseTranslation) {
      throw new Error('Invalid response format');
    }
  }

  async generateContent(): Promise<ContentGenerationResult> {
    logger.info('Generating content...');

    // テスト環境ではモックレスポンスを返す
    if (process.env.NODE_ENV === 'test') {
      logger.info('Using mock response for test environment');
      const mockContent = {
        englishPhrase: "Helping others brings joy to everyone's life",
        japaneseTranslation: "人を助けることは、みんなの人生に喜びをもたらします"
      };
      return {
        text: `${mockContent.englishPhrase}\n\n${mockContent.japaneseTranslation}`,
        englishPhrase: mockContent.englishPhrase,
        japaneseTranslation: mockContent.japaneseTranslation
      };
    }

    const prompt = `
Generate a short English phrase and its Japanese translation for givers (altruistic personality type).
Requirements:
- One simple sentence about helping or supporting others
- Length: 15-30 seconds when spoken
- Use intermediate level English
- Keep it positive and encouraging

Respond ONLY with a JSON object in this exact format:
{
  "englishPhrase": "your English phrase here",
  "japaneseTranslation": "Japanese translation here"
}`;

    try {
      logger.info('Sending request to OpenRouter API...');
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: this.model,
        messages: [
          { 
            role: 'system', 
            content: 'You are an English learning content creator. Always respond in valid JSON format.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://shiftwith.app',
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10秒でタイムアウト
      });

      logger.info('Received response from OpenRouter API');
      const responseContent = response.data.choices[0].message.content.trim();
      let content;
      
      try {
        content = JSON.parse(responseContent);
      } catch (e) {
        logger.error('Failed to parse response as JSON:', e instanceof Error ? e : new Error(String(e)));
        const jsonMatch = responseContent.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) {
          throw new Error('Invalid response format');
        }
        content = JSON.parse(jsonMatch[0]);
      }

      this.validateContent(content);
      logger.info('Content validation successful');
      
      return {
        text: `${content.englishPhrase}\n\n${content.japaneseTranslation}`,
        englishPhrase: content.englishPhrase,
        japaneseTranslation: content.japaneseTranslation
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        logger.error('API request timed out');
        throw new Error('API request timed out');
      }
      logger.error('Content generation error:', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Failed to generate content');
    }
  }
} 