export interface ContentGenerationResult {
  text: string;
  englishPhrase: string;
  japaneseTranslation: string;
}

export interface VoiceGenerationResult {
  audioPath: string;
  duration: number;
}

export interface ImageGenerationResult {
  imagePath: string;
  attribution: {
    photographer: string;
    url: string;
  };
}

export interface VideoRenderResult {
  videoPath: string;
  duration: number;
}

export interface VideoGenerationConfig {
  outputDir: string;
  tempDir: string;
  videoFormat: 'mp4';
  resolution: {
    width: number;
    height: number;
  };
  duration: {
    min: number;
    max: number;
  };
}

export interface NotificationPayload {
  status: 'success' | 'error';
  message: string;
  videoPath?: string;
  content?: ContentGenerationResult;
  imageAttribution?: ImageGenerationResult['attribution'];
  error?: Error;
}

export interface SlackBlockText {
  type: 'plain_text' | 'mrkdwn';
  text: string;
}

export interface SlackBlockElement {
  type: string;
  text?: string;
}

export interface SlackBlock {
  type: 'header' | 'section' | 'context';
  text?: SlackBlockText;
  elements?: SlackBlockElement[];
}

export interface SlackMessage {
  blocks: SlackBlock[];
} 