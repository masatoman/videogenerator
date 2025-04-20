import { OpenAI } from 'openai';
import fs from 'fs/promises';
import { CONFIG } from '../config/settings';

interface Phrase {
  id: number;
  category: string;
  phrase: string;
  context: string;
}

interface PromptTemplate {
  system: string;
  user_template: string;
}

interface GeneratedScript {
  script: string;
  duration: number;
  tone: string;
}

export async function generateScript(): Promise<void> {
  try {
    // Initialize OpenAI client with OpenRouter configuration
    const openai = new OpenAI({
      apiKey: CONFIG.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1'
    });

    // Generate phrases using Shisa V2
    const phrasesCompletion = await openai.chat.completions.create({
      model: CONFIG.OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: 'あなたはShiftWithのAI講師です。' },
        { role: 'user', content: '性格タイプ「ギバー」に適した英語フレーズを3つ教えてください。' }
      ]
    });

    const generatedPhrases = phrasesCompletion.choices[0].message.content;
    if (!generatedPhrases) throw new Error('No phrases generated from Shisa V2');

    // Load prompt template
    const promptTemplate: PromptTemplate = JSON.parse(
      await fs.readFile(CONFIG.PROMPT_TEMPLATE_PATH, 'utf-8')
    );

    // Generate script using OpenAI
    const completion = await openai.chat.completions.create({
      model: CONFIG.OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: promptTemplate.system },
        {
          role: 'user',
          content: promptTemplate.user_template.replace('{phrase}', generatedPhrases.split('\n')[0])
        }
      ]
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error('No response from OpenRouter');

    const generatedScript: GeneratedScript = JSON.parse(response);
    
    // Save the generated script
    const outputPath = `${CONFIG.OUTPUT_DIR}/${new Date().toISOString().split('T')[0]}-script.json`;
    await fs.writeFile(outputPath, JSON.stringify(generatedScript, null, 2));

    console.log(`Script generated and saved to ${outputPath}`);
  } catch (error) {
    console.error('Error generating script:', error);
    throw error;
  }
} 