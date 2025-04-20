import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { promisify } from 'util';
import { exec } from 'child_process';
const execAsync = promisify(exec);

// 環境変数の読み込み
dotenv.config();

// 出力ディレクトリの設定
const OUTPUT_DIR = 'output/tests/audio';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

interface AudioMetadata {
  format: {
    duration: string;
    bit_rate: string;
    size: string;
  };
  streams: Array<{
    codec_name: string;
    sample_rate: string;
    channels: number;
    bits_per_sample: number;
  }>;
}

async function validateAudio(audioPath: string, description: string, expectedDuration: number): Promise<void> {
  console.log(`\n音声の検証: ${description}`);
  
  // 1. ファイルの存在確認
  const exists = await fs.access(audioPath).then(() => true).catch(() => false);
  console.log('✓ ファイルの存在:', exists ? '確認' : '未確認');
  if (!exists) throw new Error('音声ファイルが存在しません');

  // 2. ffprobeで音声メタデータを取得
  const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${audioPath}"`);
  const metadata: AudioMetadata = JSON.parse(stdout);
  
  // 3. 音声フォーマットの確認
  const stream = metadata.streams[0];
  console.log('✓ コーデック:', stream.codec_name);
  console.log('✓ サンプルレート:', `${stream.sample_rate}Hz`);
  console.log('✓ チャンネル数:', stream.channels);
  console.log('✓ ビット深度:', `${stream.bits_per_sample}bit`);
  
  // WAV形式の要件確認
  if (stream.codec_name !== 'pcm_s16le') {
    console.warn('⚠️ コーデックが標準的なWAVフォーマット(PCM 16bit)ではありません');
  }
  if (stream.sample_rate !== '44100') {
    console.warn('⚠️ サンプルレートが44.1kHzではありません');
  }

  // 4. 音声の長さ確認
  const duration = parseFloat(metadata.format.duration);
  console.log('✓ 音声の長さ:', `${duration.toFixed(2)}秒`);
  
  if (Math.abs(duration - expectedDuration) > 0.5) {
    console.warn(`⚠️ 音声の長さが期待値(${expectedDuration}秒)と異なります`);
  }

  // 5. 音声の品質確認
  // 無音検出
  const { stdout: silenceInfo } = await execAsync(
    `ffmpeg -i "${audioPath}" -af silencedetect=noise=-50dB:d=0.5 -f null - 2>&1`
  );
  const silenceDuration = (silenceInfo.match(/silence_duration: [\d.]+/g) || [])
    .map(s => parseFloat(s.split(': ')[1]))
    .reduce((a, b) => a + b, 0);
  
  console.log('✓ 無音区間の合計:', `${silenceDuration.toFixed(2)}秒`);
  if (silenceDuration / duration > 0.5) {
    console.warn('⚠️ 無音区間が全体の50%を超えています');
  }

  // 6. 音量レベルの確認
  const { stdout: volumeInfo } = await execAsync(
    `ffmpeg -i "${audioPath}" -af volumedetect -f null - 2>&1`
  );
  const meanVolume = parseFloat((volumeInfo.match(/mean_volume: ([-\d.]+)/) || ['', '0'])[1]);
  const maxVolume = parseFloat((volumeInfo.match(/max_volume: ([-\d.]+)/) || ['', '0'])[1]);
  
  console.log('✓ 平均音量:', `${meanVolume.toFixed(2)}dB`);
  console.log('✓ 最大音量:', `${maxVolume.toFixed(2)}dB`);
  
  if (meanVolume < -30) {
    console.warn('⚠️ 平均音量が小さすぎます');
  }
  if (maxVolume > -1) {
    console.warn('⚠️ 最大音量が0dBに近すぎます（クリッピングの可能性）');
  }

  // 7. 実際の再生テスト
  console.log('\n音声を再生します（3秒間）...');
  try {
    await execAsync(`ffplay -nodisp -autoexit -t 3 "${audioPath}"`);
    console.log('✓ 音声の再生に成功しました');
  } catch (error) {
    console.error('⚠️ 音声の再生に失敗しました:', error);
  }

  console.log('音声の検証が完了しました\n');
}

async function testVoiceValidation(): Promise<void> {
  try {
    console.log('音声検証テストを開始します...\n');

    // テストケース1: こんにちは。
    console.log('テストケース1: こんにちは。');
    await validateAudio('output/tests/audio/konnichiwa.wav', 'こんにちは。（2秒）', 2);

    // テストケース2: おんせい
    console.log('\nテストケース2: おんせい');
    await validateAudio('output/tests/audio/onsei.wav', 'おんせい（1.5秒）', 1.5);

    console.log('\n✅ 全てのテストが完了しました！');

  } catch (error) {
    console.error('エラーが発生しました:', error);
    throw error;
  }
}

// テストの実行
if (require.main === module) {
  testVoiceValidation()
    .then(() => console.log('音声検証テストが完了しました'))
    .catch(error => {
      console.error('音声検証テストに失敗しました:', error);
      process.exit(1);
    });
} 