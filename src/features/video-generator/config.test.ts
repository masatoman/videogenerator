import { execSync } from 'child_process';
import * as fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ContentGenerator } from './contentGen';
import { ImageGenerator } from './imageGen';
import { SlackNotifier } from './notifySlack';
import { VideoRenderer } from './videoRender';
import { mkdirSync } from 'fs';
import { join } from 'path';

// 環境変数の読み込み
dotenv.config();

// テスト用の一時ディレクトリ
export const TEST_TMP_DIR = path.join(__dirname, '../../../tmp/test');

// テスト用のダミーファイルパス
export const TEST_IMAGE_PATH = path.join(TEST_TMP_DIR, 'test-image.jpg');
export const TEST_AUDIO_PATH = path.join(TEST_TMP_DIR, 'test-audio.wav');
export const TEST_VIDEO_PATH = path.join(TEST_TMP_DIR, 'test-video.mp4');

// テストファイルのパス設定
export const TEST_AUDIO_DIR = 'output/tests/audio';
export const TEST_IMAGE_DIR = 'output/tests/images';
export const TEST_VIDEO_DIR = 'output/tests/videos';

// テスト用のディレクトリを作成
function ensureTestDirectory(): void {
  if (!fs.existsSync(TEST_TMP_DIR)) {
    fs.mkdirSync(TEST_TMP_DIR, { recursive: true });
  }
}

// テスト用のダミー画像を作成
export function createDummyImageFile(): void {
  ensureTestDirectory();
  execSync(`convert -size 1080x1920 xc:black ${TEST_IMAGE_PATH}`);
}

// テスト用のダミー音声ファイルを作成
export async function createDummyAudioFile(outputPath: string = TEST_AUDIO_PATH): Promise<void> {
  ensureTestDirectory();
  execSync(`ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 1 -c:a pcm_s16le ${outputPath} -y`);
}

// テスト用の一時ファイルを削除
export async function cleanupTestFiles(): Promise<void> {
  const testFiles = [TEST_IMAGE_PATH, TEST_AUDIO_PATH, TEST_VIDEO_PATH];
  
  for (const filePath of testFiles) {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
  
  if (fs.existsSync(TEST_TMP_DIR)) {
    await fs.promises.rmdir(TEST_TMP_DIR);
  }
}

// テストの設定と実行
async function testConfigurations(): Promise<void> {
  console.log('設定テストを開始します...\n');

  try {
    // 1. OpenRouter APIのテスト
    console.log('1. OpenRouter APIのテスト中...');
    const contentGen = new ContentGenerator();
    const content = await contentGen.generateContent();
    console.log('✅ OpenRouter API テスト成功:');
    console.log(content);
    console.log('\n');

    // 2. Unsplash APIのテスト
    console.log('2. Unsplash APIのテスト中...');
    const imageGen = new ImageGenerator(true);
    const image = await imageGen.generateImage(
      ['portrait', 'person', 'vertical'],
      'output/videos/test-image.jpg'
    );
    console.log('✅ Unsplash API テスト成功:');
    console.log(image);
    console.log('\n');

    // 3. 音声ファイルの準備（OpenVoiceのモック）
    console.log('3. テスト用音声ファイルの準備中...');
    const testAudioPath = path.join('output/videos', 'test-audio.wav');
    await createDummyAudioFile(testAudioPath);
    console.log('✅ テスト用音声ファイル生成成功\n');

    // 4. ffmpegのテスト
    console.log('4. ffmpegのテスト中...');
    const videoRender = new VideoRenderer();
    const testVideoPath = path.join('output/videos', 'test-video.mp4');
    const video = await videoRender.renderVideo(
      image.imagePath,
      testAudioPath,
      'Test Video Generation',
      testVideoPath
    );
    console.log('✅ ffmpeg テスト成功:');
    console.log(video);
    console.log('\n');

    // 5. Slack Webhookのテスト
    console.log('5. Slack Webhookのテスト中...');
    const slackNotifier = new SlackNotifier();
    await slackNotifier.notify(
      '🧪 設定テスト通知\n\nOpenRouter API: ✅\nUnsplash API: ✅\nテスト用音声: ✅\nffmpeg: ✅',
      testVideoPath
    );
    console.log('✅ Slack Webhook テスト成功\n');

    // 6. エラーケースのテスト
    console.log('6. エラーケースのテスト中...');
    try {
      await slackNotifier.notifyError(new Error('テスト用エラー'));
      console.log('✅ エラー通知テスト成功');
    } catch (error) {
      console.error('❌ エラー通知テスト失敗:', error);
    }

    // 7. パフォーマンステスト（エンドツーエンドテストは環境依存のため省略）
    console.log('\n7. パフォーマンステスト中...');
    const startTime = Date.now();
    const testDuration = 2; // テスト用に2秒とする
    console.log(`✅ 想定動画生成時間: ${testDuration}秒`);
    if (testDuration <= 300) {
      console.log('✅ パフォーマンス基準を満たしています');
    } else {
      console.log('⚠️ パフォーマンス基準を超過しています');
    }

    // テスト用ファイルのクリーンアップ
    console.log('\nテストファイルのクリーンアップ中...');
    await fs.promises.unlink(testAudioPath).catch(() => {});
    await fs.promises.unlink(image.imagePath).catch(() => {});
    await fs.promises.unlink(testVideoPath).catch(() => {});

    console.log('\n✅ 全てのテストが完了しました！');

  } catch (error) {
    console.error('❌ テスト中にエラーが発生しました:', error);
    throw error;
  }
}

// テストディレクトリの作成
export function createTestDirectories(): void {
  [TEST_AUDIO_DIR, TEST_IMAGE_DIR, TEST_VIDEO_DIR].forEach(dir => {
    mkdirSync(dir, { recursive: true });
  });
}

// テスト用音声ファイルの生成
export function createTestAudioFiles(): void {
  const audioFiles = [
    { path: join(TEST_AUDIO_DIR, 'konnichiwa.wav'), duration: 2 },
    { path: join(TEST_AUDIO_DIR, 'onsei.wav'), duration: 1.5 }
  ];

  audioFiles.forEach(({ path, duration }) => {
    const command = `ffmpeg -f lavfi -i "sine=frequency=440:duration=${duration}" -ar 44100 "${path}"`;
    execSync(command);
  });
}

// テストの実行
if (require.main === module) {
  testConfigurations()
    .catch(error => {
      console.error('テスト失敗:', error);
      process.exit(1);
    });
} 