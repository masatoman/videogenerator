import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { Logger } from './logger';

interface ExecResult {
  stdout: string;
  stderr: string;
}

const exec = promisify(execCallback) as (command: string) => Promise<ExecResult>;
const logger = Logger.getInstance();

/**
 * ファイルの存在を確認する
 */
export async function validateFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    logger.error(`File does not exist: ${filePath}`, error as Error);
    return false;
  }
}

/**
 * 音声ファイルの情報を取得する
 */
export async function validateAudio(filePath: string): Promise<boolean> {
  try {
    const exists = await validateFileExists(filePath);
    if (!exists) {
      throw new Error(`Audio file not found: ${filePath}`);
    }

    const result = await exec(`ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "${filePath}"`);
    const format = result.stdout.trim().toLowerCase();

    if (!format || !['mp3', 'wav', 'aac'].includes(format)) {
      throw new Error('Invalid audio file format');
    }

    return true;
  } catch (error) {
    logger.error('Audio validation failed:', error as Error);
    return false;
  }
}

/**
 * 画像ファイルの情報を取得する
 */
export async function validateImage(filePath: string): Promise<boolean> {
  try {
    const exists = await validateFileExists(filePath);
    if (!exists) {
      throw new Error(`Image file not found: ${filePath}`);
    }

    const result = await exec(`identify -format "%m" "${filePath}"`);
    const format = result.stdout.trim().toLowerCase();

    if (!format || !['jpeg', 'jpg', 'png'].includes(format)) {
      throw new Error('Invalid image file format');
    }

    return true;
  } catch (error) {
    logger.error('Image validation failed:', error as Error);
    return false;
  }
}

/**
 * 動画ファイルの情報を取得する
 */
export async function validateVideo(filePath: string) {
  try {
    const { stdout } = await exec(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
    );

    const data = JSON.parse(stdout);
    const videoStream = data.streams?.find(
      (stream: any) => stream.codec_type === 'video'
    );
    
    if (!videoStream) {
      throw new Error('Invalid video file');
    }

    const hasAudio = data.streams?.some(
      (stream: any) => stream.codec_type === 'audio'
    );

    const [num, den] = videoStream.r_frame_rate.split('/');
    const frameRate = parseInt(num) / parseInt(den);

    return {
      format: data.format.format_name,
      duration: parseFloat(data.format.duration),
      width: parseInt(videoStream.width),
      height: parseInt(videoStream.height),
      frameRate,
      hasAudio
    };
  } catch (error) {
    logger.error(`Failed to validate video file: ${filePath}`, error as Error);
    throw new Error('Invalid video file');
  }
} 