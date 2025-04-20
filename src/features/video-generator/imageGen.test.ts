import path from 'path';
import dotenv from 'dotenv';
import { ImageGenerator } from './imageGen';
import sharp from 'sharp';
import fs from 'fs/promises';

// 環境変数の読み込み
dotenv.config();

// 出力ディレクトリの設定
const OUTPUT_DIR = 'output/tests/images';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

async function validateImage(imagePath: string, description: string): Promise<void> {
  console.log(`\n画像の検証: ${description}`);
  
  // 1. ファイルの存在確認
  const exists = await fs.access(imagePath).then(() => true).catch(() => false);
  console.log('✓ ファイルの存在:', exists ? '確認' : '未確認');
  if (!exists) throw new Error('画像ファイルが存在しません');

  // 2. 画像メタデータの検証
  const metadata = await sharp(imagePath).metadata();
  
  // サイズとアスペクト比の確認
  const aspectRatio = metadata.width! / metadata.height!;
  console.log('✓ 画像サイズ:', `${metadata.width}x${metadata.height}`);
  console.log('✓ アスペクト比:', aspectRatio.toFixed(3));
  
  if (aspectRatio < 0.5 || aspectRatio > 0.7) {
    console.warn('⚠️ アスペクト比が推奨範囲外です（推奨: 0.5-0.7）');
  }

  // フォーマットの確認
  console.log('✓ フォーマット:', metadata.format);
  if (metadata.format !== 'jpeg') {
    console.warn('⚠️ 推奨フォーマット（JPEG）以外が使用されています');
  }

  // 3. 画像の品質チェック
  const stats = await sharp(imagePath).stats();
  const avgBrightness = (stats.channels[0].mean + stats.channels[1].mean + stats.channels[2].mean) / 3;
  console.log('✓ 平均輝度:', avgBrightness.toFixed(2));
  
  if (avgBrightness < 20 || avgBrightness > 235) {
    console.warn('⚠️ 画像の輝度が極端です（暗すぎるまたは明るすぎる）');
  }

  // 4. Exif情報の確認
  const exif = await sharp(imagePath).metadata();
  console.log('✓ Exifデータ:', exif.exif ? 'あり' : 'なし');

  console.log('画像の検証が完了しました\n');
}

async function testImageGeneration(): Promise<void> {
  try {
    console.log('画像生成テストを開始します...\n');

    // 出力ディレクトリの作成
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // ImageGeneratorのインスタンス作成
    const imageGen = new ImageGenerator(true); // ローカルモード

    // テストケース1: 標準的な画像生成
    console.log('テストケース1: 標準的な画像生成');
    const imagePath1 = path.join(OUTPUT_DIR, `${timestamp}-test1.jpg`);
    const result1 = await imageGen.generateImage(['nature', 'portrait', 'peaceful'], imagePath1);
    await validateImage(result1.imagePath, 'テストケース1');

    // テストケース2: 異なるキーワードでの画像生成
    console.log('\nテストケース2: 異なるキーワードでの画像生成');
    const imagePath2 = path.join(OUTPUT_DIR, `${timestamp}-test2.jpg`);
    const result2 = await imageGen.generateImage(['urban', 'night', 'vertical'], imagePath2);
    await validateImage(result2.imagePath, 'テストケース2');

    console.log('\n✅ 全てのテストが完了しました！');

  } catch (error) {
    console.error('エラーが発生しました:', error);
    throw error;
  }
}

// テストの実行
if (require.main === module) {
  testImageGeneration()
    .then(() => console.log('画像生成テストが完了しました'))
    .catch(error => {
      console.error('画像生成テストに失敗しました:', error);
      process.exit(1);
    });
} 