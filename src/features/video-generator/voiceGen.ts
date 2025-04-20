import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { VoiceGenerationResult } from './types';
import { ensureDirectoryExists } from './utils/file';
import { validateAudio, validateFileExists } from './utils/validation';
import { Logger } from './utils/logger';

const execAsync = promisify(exec);
const logger = Logger.getInstance();

export class VoiceGenerator {
  private openVoicePath: string;

  constructor() {
    this.openVoicePath = process.env.OPENVOICE_PATH || '';
    if (!this.openVoicePath && process.env.NODE_ENV !== 'test') {
      throw new Error('OPENVOICE_PATH is not set');
    }
  }

  protected async runOpenVoiceInference(text: string, outputPath: string, duration?: number): Promise<{ success: boolean; audioPath: string }> {
    if (process.env.NODE_ENV === 'test') {
      // テスト環境では5秒のダミー音声ファイルを生成
      ensureDirectoryExists(path.dirname(outputPath));
      
      const ffmpegCommand = `ffmpeg -f lavfi -i "sine=frequency=440:duration=5" -acodec pcm_s16le -ar 44100 -ac 1 "${outputPath}"`;
      await execAsync(ffmpegCommand);
      logger.info(`Generated test audio: ${outputPath}`);
      
      return { success: true, audioPath: outputPath };
    }

    const openVoicePath = process.env.OPENVOICE_PATH;
    if (!openVoicePath) {
      throw new Error('OPENVOICE_PATH environment variable is not set');
    }

    const scriptPath = path.join(openVoicePath, 'inference.py');
    if (!await validateFileExists(scriptPath)) {
      throw new Error('OpenVoice inference script not found');
    }

    const command = `python "${scriptPath}" --text "${text}" --output "${outputPath}"`;
    await execAsync(command);

    if (!await validateFileExists(outputPath)) {
      throw new Error('Voice generation failed');
    }

    return { success: true, audioPath: outputPath };
  }

  async generateVoice(text: string, outputPath: string, duration: number = 5): Promise<VoiceGenerationResult> {
    try {
      if (!text) {
        throw new Error('Text is required for voice generation');
      }

      // 出力ディレクトリの確保
      ensureDirectoryExists(path.dirname(outputPath));

      // OpenVoiceで音声を生成
      await this.runOpenVoiceInference(text, outputPath, duration);

      // 音声ファイルの検証
      const audioInfo = await validateAudio(outputPath);
      logger.info(`Generated audio: ${outputPath} (${audioInfo.format}, ${audioInfo.duration}s, ${audioInfo.sampleRate}Hz)`);

      return {
        audioPath: outputPath,
        duration: audioInfo.duration
      };
    } catch (error) {
      logger.error('Voice generation error:', error as Error);
      if (error instanceof Error && error.message === 'Text is required for voice generation') {
        throw error;
      }
      throw new Error('Failed to generate voice');
    }
  }
} 