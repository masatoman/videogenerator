import fs from 'fs';
import path from 'path';
import {
  generateTimestampedFilename,
  ensureDirectoryExists,
  getTestOutputPath
} from '../file';

describe('File Utilities', () => {
  describe('generateTimestampedFilename', () => {
    it('タイムスタンプ付きのファイル名を生成する', () => {
      const prefix = 'test';
      const extension = '.txt';
      const result = generateTimestampedFilename(prefix, extension);
      
      expect(result).toMatch(/^test-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.txt$/);
    });

    it('異なるプレフィックスと拡張子で生成できる', () => {
      const result1 = generateTimestampedFilename('video', '.mp4');
      const result2 = generateTimestampedFilename('audio', '.wav');
      
      expect(result1).toMatch(/^video-.*\.mp4$/);
      expect(result2).toMatch(/^audio-.*\.wav$/);
    });
  });

  describe('ensureDirectoryExists', () => {
    const testDir = path.join(process.cwd(), 'output/tests/utils-test');
    
    afterEach(() => {
      // テストディレクトリの削除
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    });

    it('存在しないディレクトリを作成する', () => {
      const dirPath = path.join(testDir, 'new-dir');
      ensureDirectoryExists(dirPath);
      expect(fs.existsSync(dirPath)).toBe(true);
    });

    it('既存のディレクトリを保持する', () => {
      const dirPath = path.join(testDir, 'existing-dir');
      fs.mkdirSync(dirPath, { recursive: true });
      
      // 2回目の呼び出し
      ensureDirectoryExists(dirPath);
      expect(fs.existsSync(dirPath)).toBe(true);
    });

    it('ネストされたディレクトリを作成する', () => {
      const dirPath = path.join(testDir, 'nested/dir/structure');
      ensureDirectoryExists(dirPath);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });

  describe('getTestOutputPath', () => {
    const baseTestDir = path.join(process.cwd(), 'output/tests');
    
    afterEach(() => {
      // テストディレクトリの削除
      if (fs.existsSync(baseTestDir)) {
        fs.rmSync(baseTestDir, { recursive: true, force: true });
      }
    });

    it('画像用の出力パスを生成する', () => {
      const result = getTestOutputPath('images', 'test.jpg');
      expect(result).toBe(path.join('output', 'tests', 'images', 'test.jpg'));
      expect(fs.existsSync(path.dirname(result))).toBe(true);
    });

    it('音声用の出力パスを生成する', () => {
      const result = getTestOutputPath('audio', 'test.wav');
      expect(result).toBe(path.join('output', 'tests', 'audio', 'test.wav'));
      expect(fs.existsSync(path.dirname(result))).toBe(true);
    });

    it('動画用の出力パスを生成する', () => {
      const result = getTestOutputPath('videos', 'test.mp4');
      expect(result).toBe(path.join('output', 'tests', 'videos', 'test.mp4'));
      expect(fs.existsSync(path.dirname(result))).toBe(true);
    });
  });
}); 