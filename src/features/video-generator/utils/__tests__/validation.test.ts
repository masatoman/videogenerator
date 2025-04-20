import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import {
  validateFileExists,
  validateAudio,
  validateImage,
  validateVideo
} from '../validation';
import { ensureDirectoryExists } from '../file';

jest.mock('child_process');
jest.mock('fs');

type ExecCallback = (error: Error | null, result: { stdout: string; stderr: string }) => void;
type MockExec = jest.MockedFunction<(command: string, callback: ExecCallback) => { kill?: () => void }>;

const mockExec = exec as unknown as MockExec;
const mockFsExists = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

describe('Validation Utilities', () => {
  const testDir = path.join(__dirname, '../../../../output/tests/validation-test');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateFileExists', () => {
    it('存在するファイルの場合はtrueを返す', () => {
      const testFile = path.join(testDir, 'test.txt');
      mockFsExists.mockReturnValue(true);
      
      expect(validateFileExists(testFile)).toBe(true);
      expect(mockFsExists).toHaveBeenCalledWith(testFile);
    });

    it('存在しないファイルの場合はfalseを返す', () => {
      const testFile = path.join(testDir, 'non-existent.txt');
      mockFsExists.mockReturnValue(false);
      
      expect(validateFileExists(testFile)).toBe(false);
      expect(mockFsExists).toHaveBeenCalledWith(testFile);
    });
  });

  describe('validateAudio', () => {
    const testAudio = path.join(testDir, 'test.wav');

    it('音声ファイルの情報を正しく取得する', async () => {
      mockFsExists.mockReturnValue(true);
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        const stdout = JSON.stringify({
          streams: [{
            codec_type: 'audio',
            sample_rate: '44100',
            bits_per_sample: '16'
          }],
          format: {
            format_name: 'wav',
            duration: '10.0'
          }
        });
        callback(null, { stdout, stderr: '' });
        return {};
      });

      const result = await validateAudio(testAudio);
      expect(result).toEqual({
        format: 'wav',
        sampleRate: 44100,
        bitDepth: 16,
        duration: 10.0
      });
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('ffprobe'),
        expect.any(Function)
      );
    });

    it('無効な音声ファイルでエラーを投げる', async () => {
      mockFsExists.mockReturnValue(true);
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        callback(new Error('Invalid audio file'), { stdout: '', stderr: '' });
        return {};
      });

      await expect(validateAudio(testAudio)).rejects.toThrow('Invalid audio file');
    });
  });

  describe('validateImage', () => {
    const testImage = path.join(testDir, 'test.jpg');

    it('画像ファイルの情報を正しく取得する', async () => {
      mockFsExists.mockReturnValue(true);
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        callback(null, { stdout: '1920 1080 JPEG', stderr: '' });
        return {};
      });

      const result = await validateImage(testImage);
      expect(result).toEqual({
        width: 1920,
        height: 1080,
        format: 'JPEG'
      });
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('identify'),
        expect.any(Function)
      );
    });

    it('無効な画像ファイルでエラーを投げる', async () => {
      mockFsExists.mockReturnValue(true);
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        callback(new Error('Invalid image file'), { stdout: '', stderr: '' });
        return {};
      });

      await expect(validateImage(testImage)).rejects.toThrow('Invalid image file');
    });
  });

  describe('validateVideo', () => {
    const testVideo = path.join(testDir, 'test.mp4');

    it('動画ファイルの情報を正しく取得する', async () => {
      mockFsExists.mockReturnValue(true);
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        const stdout = JSON.stringify({
          streams: [
            {
              codec_type: 'video',
              width: 1920,
              height: 1080,
              r_frame_rate: '30/1'
            },
            {
              codec_type: 'audio',
              sample_rate: '44100'
            }
          ],
          format: {
            format_name: 'mp4',
            duration: '60.0'
          }
        });
        callback(null, { stdout, stderr: '' });
        return {};
      });

      const result = await validateVideo(testVideo);
      expect(result).toEqual({
        format: 'mp4',
        width: 1920,
        height: 1080,
        frameRate: 30,
        duration: 60.0,
        hasAudio: true
      });
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('ffprobe'),
        expect.any(Function)
      );
    });

    it('音声なし動画ファイルの情報を正しく取得する', async () => {
      mockFsExists.mockReturnValue(true);
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        const stdout = JSON.stringify({
          streams: [
            {
              codec_type: 'video',
              width: 1920,
              height: 1080,
              r_frame_rate: '30/1'
            }
          ],
          format: {
            format_name: 'mp4',
            duration: '60.0'
          }
        });
        callback(null, { stdout, stderr: '' });
        return {};
      });

      const result = await validateVideo(testVideo);
      expect(result).toEqual({
        format: 'mp4',
        width: 1920,
        height: 1080,
        frameRate: 30,
        duration: 60.0,
        hasAudio: false
      });
    });

    it('無効な動画ファイルでエラーを投げる', async () => {
      mockFsExists.mockReturnValue(true);
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        callback(new Error('Invalid video file'), { stdout: '', stderr: '' });
        return {};
      });

      await expect(validateVideo(testVideo)).rejects.toThrow('Invalid video file');
    });
  });
}); 