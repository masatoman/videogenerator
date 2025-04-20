import fs from 'fs';
import path from 'path';

/**
 * タイムスタンプ付きのファイル名を生成
 */
export const generateTimestampedFilename = (prefix: string, extension: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${timestamp}${extension}`;
};

/**
 * 出力ディレクトリの作成（存在しない場合）
 */
export const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * テスト出力用のパスを生成
 */
export const getTestOutputPath = (type: 'images' | 'audio' | 'videos', filename: string): string => {
  const basePath = path.join('output', 'tests', type);
  ensureDirectoryExists(basePath);
  return path.join(basePath, filename);
}; 