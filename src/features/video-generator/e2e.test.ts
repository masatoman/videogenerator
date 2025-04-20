import { execSync } from 'child_process';
import * as fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { ContentGenerator } from './contentGen';
import { VoiceGenerator } from './voiceGen';
import { ImageGenerator } from './imageGen';
import { VideoRenderer } from './videoRender';
import { SlackNotifier } from './notifySlack';
import { ContentGenerationResult, VoiceGenerationResult, ImageGenerationResult, VideoRenderResult, NotificationPayload } from './types';
import dotenv from 'dotenv';

dotenv.config();

const exec = promisify(require('child_process').exec);

// テスト用の一時ディレクトリ
const TEST_TMP_DIR = path.join(__dirname, '../../../tmp/test-e2e');
const TEST_OUTPUT_DIR = {
  audio: path.join(TEST_TMP_DIR, 'audio'),
  image: path.join(TEST_TMP_DIR, 'image'),
  video: path.join(TEST_TMP_DIR, 'video')
};

// テストディレクトリの作成
function ensureTestDirectories(): void {
  Object.values(TEST_OUTPUT_DIR).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// テストファイルのクリーンアップ
async function cleanup(): Promise<void> {
  for (const dir of Object.values(TEST_OUTPUT_DIR)) {
    if (fs.existsSync(dir)) {
      const files = await fs.promises.readdir(dir);
      await Promise.all(files.map(file => 
        fs.promises.unlink(path.join(dir, file))
      ));
      await fs.promises.rmdir(dir);
    }
  }
  
  if (fs.existsSync(TEST_TMP_DIR)) {
    await fs.promises.rmdir(TEST_TMP_DIR);
  }
}

describe('動画生成 E2Eテスト', () => {
  let contentGen: ContentGenerator;
  let voiceGen: VoiceGenerator;
  let imageGen: ImageGenerator;
  let videoRenderer: VideoRenderer;
  let slackNotifier: SlackNotifier;
  
  let content: ContentGenerationResult;
  let audioResult: VoiceGenerationResult;
  let imageResult: ImageGenerationResult;
  let videoPath: string;
  
  beforeAll(async () => {
    ensureTestDirectories();
    
    contentGen = new ContentGenerator();
    voiceGen = new VoiceGenerator();
    imageGen = new ImageGenerator();
    videoRenderer = new VideoRenderer();
    slackNotifier = new SlackNotifier();
    
    videoPath = path.join(TEST_OUTPUT_DIR.video, 'test-output.mp4');
  });
  
  afterAll(async () => {
    await cleanup();
  });
  
  test('基本フロー：英語フレーズの生成', async () => {
    content = await contentGen.generateContent();
    expect(content).toBeDefined();
    expect(content.englishPhrase).toBeTruthy();
    expect(content.japaneseTranslation).toBeTruthy();
    console.log('生成されたコンテンツ:', content);
  }, 30000);
  
  test('基本フロー：音声合成', async () => {
    const audioPath = path.join(TEST_OUTPUT_DIR.audio, 'test-output.wav');
    audioResult = await voiceGen.generateVoice(content.englishPhrase, audioPath);
    expect(audioResult).toBeDefined();
    expect(audioResult.audioPath).toBe(audioPath);
    expect(audioResult.duration).toBeGreaterThan(0);
    expect(fs.existsSync(audioPath)).toBe(true);
    console.log('生成された音声:', audioResult);
  }, 30000);
  
  test('基本フロー：背景画像の取得', async () => {
    const imagePath = path.join(TEST_OUTPUT_DIR.image, 'test-output.jpg');
    imageResult = await imageGen.generateImage([content.englishPhrase], imagePath);
    expect(imageResult).toBeDefined();
    expect(imageResult.imagePath).toBe(imagePath);
    expect(imageResult.attribution).toBeDefined();
    expect(fs.existsSync(imagePath)).toBe(true);
    console.log('取得された画像:', imageResult);
  }, 30000);
  
  test('基本フロー：動画の生成', async () => {
    const result = await videoRenderer.renderVideo(
      imageResult.imagePath,
      audioResult.audioPath,
      content.englishPhrase,
      videoPath
    );
    expect(result).toBeDefined();
    expect(result.videoPath).toBe(videoPath);
    expect(result.duration).toBeGreaterThanOrEqual(audioResult.duration);
    expect(fs.existsSync(videoPath)).toBe(true);
    
    // 動画のメタデータを確認
    const { stdout } = await exec(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json "${videoPath}"`);
    const metadata = JSON.parse(stdout as string);
    expect(metadata.streams[0].width).toBe(1080);
    expect(metadata.streams[0].height).toBe(1920);
    
    console.log('生成された動画:', result);
  }, 60000);
  
  test('基本フロー：Slack通知', async () => {
    const payload: NotificationPayload = {
      status: 'success',
      message: '動画が正常に生成されました',
      videoPath,
      content,
      imageAttribution: imageResult.attribution
    };
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('SLACK_WEBHOOK_URL is not set');
    }
    const notificationResult = await slackNotifier.notify(payload, webhookUrl);
    expect(notificationResult).toBe(true);
    console.log('Slack通知結果:', notificationResult);
  }, 10000);
}); 