export const CONFIG = {
  // OpenAI Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: 'gpt-4-turbo-preview',
  
  // OpenRouter Configuration
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  OPENROUTER_MODEL: 'shisa-ai/shisa-v2-llama3.3-70b:free',
  
  // OpenVoice Configuration
  OPENVOICE_API_KEY: process.env.OPENVOICE_API_KEY || '',
  OPENVOICE_VOICE_ID: 'en-US-female-1',
  
  // Slack Configuration
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || '',
  SLACK_CHANNEL: '#video-notifications',
  
  // File Paths
  PHRASES_PATH: './data/phrases.json',
  PROMPT_TEMPLATE_PATH: './templates/prompt-giver.json',
  OUTPUT_DIR: './output',
  
  // Video Settings
  VIDEO_WIDTH: 1920,
  VIDEO_HEIGHT: 1080,
  FONT_SIZE: 48,
  FONT_COLOR: 'white',
  BACKGROUND_COLOR: 'black',
  
  // Schedule Settings
  GENERATION_CRON: '0 0 * * *' // Run daily at midnight
} as const; 