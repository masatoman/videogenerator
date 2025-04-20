import { createApi } from 'unsplash-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { ImageGenerationResult } from './types';
import { ensureDirectoryExists } from './utils/file';
import { validateImage } from './utils/validation';
import { Logger } from './utils/logger';

const execAsync = promisify(exec);
const logger = Logger.getInstance();

export class ImageGenerator {
  private unsplash: ReturnType<typeof createApi>;

  constructor() {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY || '';
    if (!accessKey && process.env.NODE_ENV !== 'test') {
      throw new Error('UNSPLASH_ACCESS_KEY is not set');
    }
    this.unsplash = createApi({ accessKey });
  }

  async generateImage(keywords: string[], outputPath: string): Promise<ImageGenerationResult> {
    try {
      // 出力ディレクトリの確保
      ensureDirectoryExists(path.dirname(outputPath));

      if (process.env.NODE_ENV === 'test') {
        // テスト用のカラフルな背景画像を生成（グラデーション）
        const command = `ffmpeg -f lavfi -i "gradients=s=1080x1920:c0=purple:c1=pink:n=3" -frames:v 1 "${outputPath}" -y`;
        await execAsync(command);
        logger.info(`Generated test image: ${outputPath}`);
        return {
          imagePath: outputPath,
          attribution: {
            photographer: 'Test Cat Photographer',
            url: 'https://example.com/cat-photo'
          }
        };
      }

      // Unsplashから画像を検索
      const result = await this.unsplash.search.getPhotos({
        query: keywords.join(' '),
        orientation: 'portrait'
      });

      if (!result.response) {
        throw new Error('Failed to search images');
      }

      const photos = result.response.results;
      if (photos.length === 0) {
        throw new Error('No images found');
      }

      // 最適な画像を選択（アスペクト比を考慮）
      const photo = photos.find(p => {
        const ratio = p.width / p.height;
        return ratio <= 0.6; // 縦型動画に適したアスペクト比
      });

      if (!photo) {
        throw new Error('Image aspect ratio is not suitable for vertical video');
      }

      // 画像をダウンロード
      const response = await fetch(photo.urls.regular);
      const buffer = await response.arrayBuffer();
      await fs.promises.writeFile(outputPath, Buffer.from(buffer));

      // 画像の検証
      const imageInfo = await validateImage(outputPath);
      logger.info(`Generated image: ${outputPath} (${imageInfo.width}x${imageInfo.height}, ${imageInfo.format})`);

      return {
        imagePath: outputPath,
        attribution: {
          photographer: photo.user.name,
          url: photo.links.html
        }
      };
    } catch (error) {
      logger.error('Image generation error:', error as Error);
      throw new Error('Failed to generate image');
    }
  }
} 