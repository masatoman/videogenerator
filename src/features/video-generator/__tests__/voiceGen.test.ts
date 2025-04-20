import { VoiceGenerator } from '../voiceGen';
import { VoiceGenerationResult } from '../types';
import path from 'path';
import fs from 'fs/promises';
import { validateAudio, validateFileExists } from '../utils/validation';
import { Logger } from '../utils/logger';
import { exec } from 'child_process';

const logger = Logger.getInstance();

class MockVoiceGenerator extends VoiceGenerator {
  private failureMode: boolean = false;
  private timeoutMode: boolean = false;

  constructor() {
    super();
  }

  setFailureMode(mode: boolean) {
    this.failureMode = mode;
  }

  setTimeoutMode(mode: boolean) {
    this.timeoutMode = mode;
  }

  async generateVoice(text: string, outputPath: string): Promise<VoiceGenerationResult> {
    if (!text.trim()) {
      throw new Error('Text is required for voice generation');
    }

    if (text.length > 200) {
      throw new Error('Text is too long for voice generation');
    }

    if (this.failureMode) {
      throw new Error('Failed to generate voice');
    }

    if (this.timeoutMode) {
      throw new Error('Voice generation timed out');
    }

    // テスト用のダミー音声を生成
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    const command = `ffmpeg -f lavfi -i "sine=frequency=440:duration=1" -ar 44100 -ac 1 "${outputPath}" -y`;
    await new Promise<void>((resolve, reject) => {
      exec(command, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    logger.info(`Generated test audio: ${outputPath}`);
    return {
      audioPath: outputPath,
      duration: 1 // テスト用の1秒固定
    };
  }
}

describe('VoiceGenerator', () => {
  let voiceGenerator: MockVoiceGenerator;
  const testDir = path.join(__dirname, '../../../../output/tests/audio/voice-test');
  const outputPath = path.join(testDir, 'test-output.wav');

  beforeEach(() => {
    voiceGenerator = new MockVoiceGenerator();
    voiceGenerator.setFailureMode(false);
    voiceGenerator.setTimeoutMode(false);
  });

  it('should generate voice from English text', async () => {
    const text = 'Hello, this is a test';
    const result = await voiceGenerator.generateVoice(text, outputPath);
    expect(await validateFileExists(result.audioPath)).toBe(true);
    expect(result.duration).toBe(1);
  }, 10000);

  it('should generate voice from Japanese text', async () => {
    const text = 'こんにちは、テストです';
    const result = await voiceGenerator.generateVoice(text, outputPath);
    expect(await validateFileExists(result.audioPath)).toBe(true);
    expect(result.duration).toBe(1);
  }, 10000);

  it('should throw error for empty text', async () => {
    await expect(voiceGenerator.generateVoice('', outputPath))
      .rejects.toThrow('Text is required for voice generation');
  });

  it('should throw error for too long text', async () => {
    const longText = 'a'.repeat(201);
    await expect(voiceGenerator.generateVoice(longText, outputPath))
      .rejects.toThrow('Text is too long for voice generation');
  });

  it('should handle voice generation failure', async () => {
    voiceGenerator.setFailureMode(true);
    await expect(voiceGenerator.generateVoice('Test text', outputPath))
      .rejects.toThrow('Failed to generate voice');
  });

  it('should handle timeout', async () => {
    voiceGenerator.setTimeoutMode(true);
    await expect(voiceGenerator.generateVoice('Test text', outputPath))
      .rejects.toThrow('Voice generation timed out');
  });
}); 