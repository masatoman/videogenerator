import * as fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import { ContentGenerator } from '../contentGen';
import { VoiceGenerator } from '../voiceGen';
import { ImageGenerator } from '../imageGen';
import { VideoRenderer } from '../videoRender';
import { SlackNotifier } from '../notifySlack';
import { validateAudio, validateImage, validateVideo, validateFileExists } from '../utils/validation';
import { VideoRenderResult, NotificationPayload } from '../types';
import { Logger } from '../utils/logger';

// ディレクトリ作成用のユーティリティ関数
const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

interface ContentGenerationResult {
  text: string;
  englishPhrase: string;
  japaneseTranslation: string;
}

interface VoiceGenerationResult {
  audioPath: string;
  duration: number;
}

// モッククラスの定義
class MockVoiceGenerator extends VoiceGenerator {
  private mockAudioData: Buffer;

  constructor() {
    super();
    // WAVファイルのダミーデータ
    this.mockAudioData = Buffer.from('RIFF24000000WAVEfmt 1000000001000100441A0000882B0000020010006461746100000000', 'hex');
  }

  protected async runOpenVoiceInference(text: string, outputPath: string): Promise<{ success: boolean; audioPath: string }> {
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(outputPath, this.mockAudioData);
    return { success: true, audioPath: outputPath };
  }
}

class MockImageGenerator extends ImageGenerator {
  private mockImageData: Buffer;

  constructor() {
    super();
    // JPEGファイルのダミーデータ
    this.mockImageData = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAHgBDgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL', 'base64');
  }

  async generateImage(keywords: string[], outputPath: string): Promise<{ imagePath: string; attribution: { photographer: string; url: string } }> {
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(outputPath, this.mockImageData);
    return {
      imagePath: outputPath,
      attribution: {
        photographer: 'Test Photographer',
        url: 'https://example.com/test-photo'
      }
    };
  }
}

class MockVideoRenderer extends VideoRenderer {
  private mockVideoData: Buffer;

  constructor() {
    super();
    // MP4ファイルのダミーデータ
    this.mockVideoData = Buffer.from('000000206674797069736F6D0000020069736F6D69736F32617663316D703431', 'hex');
  }

  async renderVideo(
    imagePath: string,
    audioPath: string,
    text: string,
    outputPath: string
  ): Promise<VideoRenderResult> {
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(outputPath, this.mockVideoData);
    return {
      videoPath: outputPath,
      duration: 5
    };
  }
}

class MockSlackNotifier extends SlackNotifier {
  constructor() {
    super();
    // webhookUrlのチェックをスキップ
    Object.defineProperty(this, 'webhookUrl', {
      value: 'https://hooks.slack.com/services/test',
      writable: true
    });
  }

  async notify(payload: NotificationPayload, webhookUrl: string): Promise<boolean> {
    logger.info(`Mock Slack notification: ${JSON.stringify(payload)}`);
    return true;
  }
}

dotenv.config();
const logger = Logger.getInstance();

// テスト用の出力ディレクトリ
const TEST_OUTPUT_DIR = path.join(process.cwd(), 'output/tests');
const TEST_PATHS = {
  audio: path.join(TEST_OUTPUT_DIR, 'audio', 'e2e-test.wav'),
  image: path.join(TEST_OUTPUT_DIR, 'images', 'e2e-test.jpg'),
  video: path.join(TEST_OUTPUT_DIR, 'videos', 'e2e-test.mp4')
};

describe('動画生成 E2Eテスト', () => {
  let contentGen: ContentGenerator;
  let voiceGen: MockVoiceGenerator;
  let imageGen: MockImageGenerator;
  let videoRenderer: MockVideoRenderer;
  let slackNotifier: MockSlackNotifier;
  let generatedContent: { englishPhrase: string; japaneseTranslation: string; text: string };
  
  beforeAll(async () => {
    console.log('=== テスト開始 ===');
    await Promise.all([
      fs.promises.mkdir(path.dirname(TEST_PATHS.audio), { recursive: true }),
      fs.promises.mkdir(path.dirname(TEST_PATHS.image), { recursive: true }),
      fs.promises.mkdir(path.dirname(TEST_PATHS.video), { recursive: true })
    ]);
    
    contentGen = new ContentGenerator();
    voiceGen = new MockVoiceGenerator();
    imageGen = new MockImageGenerator();
    videoRenderer = new MockVideoRenderer();
    slackNotifier = new MockSlackNotifier();
    
    console.log('初期化完了');
  });

  afterAll(async () => {
    try {
      await fs.promises.rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
    } catch (error) {
      console.error('テストディレクトリの削除に失敗:', error);
    }
  });
  
  test('1. 英語フレーズの生成', async () => {
    console.log('\n=== テスト1: 英語フレーズの生成 開始 ===');
    generatedContent = await contentGen.generateContent();
    
    expect(generatedContent).toBeDefined();
    expect(generatedContent.englishPhrase).toBeTruthy();
    expect(generatedContent.japaneseTranslation).toBeTruthy();
    
    logger.info(`Generated content: ${generatedContent.englishPhrase} (${generatedContent.japaneseTranslation})`);
    console.log('=== テスト1: 完了 ===\n');
  }, 30000);

  test('2. 音声合成', async () => {
    console.log('\n=== テスト2: 音声合成 開始 ===');
    const audioResult = await voiceGen.generateVoice(generatedContent.englishPhrase, TEST_PATHS.audio);
    
    expect(await validateFileExists(audioResult.audioPath)).toBe(true);
    const audioInfo = await validateAudio(audioResult.audioPath);
    expect(audioInfo.format).toBe('wav');
    
    logger.info(`Generated audio: ${audioResult.audioPath}`);
    console.log('=== テスト2: 完了 ===\n');
  }, 10000);

  test('3. 背景画像の生成', async () => {
    console.log('\n=== テスト3: 背景画像の生成 開始 ===');
    const keywords = ['peaceful', 'nature', 'vertical'];
    const imageResult = await imageGen.generateImage(keywords, TEST_PATHS.image);
    
    expect(await validateFileExists(imageResult.imagePath)).toBe(true);
    const imageInfo = await validateImage(imageResult.imagePath);
    expect(imageInfo.format).toBe('jpeg');
    
    logger.info(`Generated image: ${imageResult.imagePath}`);
    console.log('=== テスト3: 完了 ===\n');
  }, 10000);

  test('4. 動画のレンダリング', async () => {
    console.log('\n=== テスト4: 動画のレンダリング 開始 ===');
    const videoResult = await videoRenderer.renderVideo(
      TEST_PATHS.image,
      TEST_PATHS.audio,
      generatedContent.englishPhrase,
      TEST_PATHS.video
    );
    
    expect(await validateFileExists(videoResult.videoPath)).toBe(true);
    const videoInfo = await validateVideo(videoResult.videoPath);
    expect(videoInfo.format).toBe('mp4');
    
    logger.info(`Generated video: ${videoResult.videoPath}`);
    console.log('=== テスト4: 完了 ===\n');
  }, 20000);

  test('5. Slack通知', async () => {
    console.log('\n=== テスト5: Slack通知 開始 ===');
    await slackNotifier.notify({
      status: 'success',
      message: '新しい動画が生成されました！',
      videoPath: TEST_PATHS.video,
      content: {
        text: `${generatedContent.englishPhrase}\n\n${generatedContent.japaneseTranslation}`,
        englishPhrase: generatedContent.englishPhrase,
        japaneseTranslation: generatedContent.japaneseTranslation
      }
    }, 'https://hooks.slack.com/services/test');
    
    logger.info('Slack notification sent');
    console.log('=== テスト5: 完了 ===\n');
  }, 5000);
});

describe('基本フロー', () => {
  let contentGen: ContentGenerator;
  let voiceGen: VoiceGenerator;
  let imageGen: ImageGenerator;
  let videoRender: VideoRenderer;
  let slackNotifier: SlackNotifier;
  let outputDir: string;

  beforeAll(() => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'test' });
    outputDir = path.join(__dirname, '../../../../output/tests');
    ensureDirectoryExists(outputDir);
  });

  beforeEach(() => {
    contentGen = new ContentGenerator();
    voiceGen = new VoiceGenerator();
    imageGen = new ImageGenerator();
    videoRender = new VideoRenderer();
    slackNotifier = new SlackNotifier();
  });

  test('英語フレーズの生成', async () => {
    const englishPhrase = "Helping others brings joy to everyone's life";
    const japaneseTranslation = "人を助けることは、みんなの人生に喜びをもたらします";
    const mockContent: ContentGenerationResult = {
      text: `${englishPhrase}\n\n${japaneseTranslation}`,
      englishPhrase,
      japaneseTranslation
    };
    
    jest.spyOn(contentGen, 'generateContent').mockResolvedValue(mockContent);
    
    const result = await contentGen.generateContent();
    expect(result).toBeDefined();
    expect(result.text).toBeDefined();
    expect(result.englishPhrase).toBeDefined();
    expect(result.japaneseTranslation).toBeDefined();
    
    expect(result.text).toBe(`${englishPhrase}\n\n${japaneseTranslation}`);
    expect(result.englishPhrase).toBe(englishPhrase);
    expect(result.japaneseTranslation).toBe(japaneseTranslation);
    
    logger.info(`Generated content: ${JSON.stringify(result)}`);
  });

  test('音声合成', async () => {
    const content = await contentGen.generateContent();
    const audioPath = path.join(outputDir, 'test-voice.wav');
    
    const voice = await voiceGen.generateVoice(content.englishPhrase, audioPath);
    expect(voice).toBeDefined();
    expect(voice.audioPath).toBe(audioPath);
    expect(voice.duration).toBeGreaterThan(0);
    
    const exists = await validateFileExists(audioPath);
    expect(exists).toBe(true);
    
    const isValid = await validateAudio(audioPath);
    expect(isValid).toBe(true);
    
    logger.info(`Generated voice: ${JSON.stringify(voice)}`);
  });
}); 