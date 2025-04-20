import ffmpeg from 'fluent-ffmpeg';
import { VideoRenderResult } from './types';
import path from 'path';
import { ensureDirectoryExists } from './utils/file';
import { validateVideo } from './utils/validation';
import { Logger } from './utils/logger';
import { VIDEO_CONFIG } from './assets/config';
import { FONTS, FONT_SIZES, TEXT_POSITIONS } from './assets/fonts';

const logger = Logger.getInstance();

export class VideoRenderer {
  async renderVideo(
    imagePath: string,
    audioPath: string,
    text: string,
    outputPath: string
  ): Promise<VideoRenderResult> {
    return new Promise((resolve, reject) => {
      // 出力ディレクトリの確保
      ensureDirectoryExists(path.dirname(outputPath));

      // 動画設定の準備
      const { WIDTH, HEIGHT } = VIDEO_CONFIG.DIMENSIONS;
      const { CODEC, PRESET, CRF, PIXEL_FORMAT, FRAME_RATE } = VIDEO_CONFIG.ENCODING;
      const { FONT_SIZE, COLOR, BORDER_COLOR, BORDER_WIDTH, LINE_SPACING } = VIDEO_CONFIG.SUBTITLE;

      // フォント設定
      const font = FONTS.DEFAULT;
      const fontSize = FONT_SIZES.LARGE;
      const textPosition = TEXT_POSITIONS.CENTER;

      // テキストとフォントパスのエスケープ
      const escapedText = text.replace(/(['"\\])/g, '\\\\$1');
      const escapedFontPath = font.path.replace(/(['"\\])/g, '\\\\$1');

      const commonOptions = [
        `-c:v ${CODEC}`,
        `-preset ${PRESET}`,
        `-crf ${CRF}`,
        `-pix_fmt ${PIXEL_FORMAT}`,
        `-r ${FRAME_RATE}`,
        `-c:a ${VIDEO_CONFIG.AUDIO.CODEC}`,
        `-b:a ${VIDEO_CONFIG.AUDIO.BITRATE}`,
        `-ar ${VIDEO_CONFIG.AUDIO.SAMPLE_RATE}`,
        `-ac ${VIDEO_CONFIG.AUDIO.CHANNELS}`,
        '-vf',
        `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},` +
        `drawtext=text='${escapedText}':` +
        `fontfile='${escapedFontPath}':` +
        `fontsize=${fontSize}:` +
        `fontcolor=${COLOR}:` +
        `x=(w-text_w)/2:` +
        `y=${textPosition.y}:` +
        `shadowcolor=${BORDER_COLOR}:` +
        `shadowx=${BORDER_WIDTH}:` +
        `shadowy=${BORDER_WIDTH}:` +
        `line_spacing=${LINE_SPACING}`
      ];

      if (process.env.NODE_ENV === 'test') {
        // テスト環境では5秒の動画を生成
        ffmpeg()
          .input(imagePath)
          .input(audioPath)
          .outputOptions(commonOptions)
          .duration(5)
          .output(outputPath)
          .on('start', (commandLine) => {
            logger.info(`FFmpeg command: ${commandLine}`);
          })
          .on('end', async () => {
            try {
              const videoInfo = await validateVideo(outputPath);
              logger.info(`Generated test video: ${outputPath} (${videoInfo.width}x${videoInfo.height}, ${videoInfo.duration}s)`);
              
              resolve({
                videoPath: outputPath,
                duration: videoInfo.duration
              });
            } catch (error) {
              logger.error('Failed to validate test video:', error as Error);
              reject(new Error('Failed to validate test video'));
            }
          })
          .on('error', (err) => {
            logger.error('Video rendering error:', err);
            reject(new Error('Failed to render video'));
          })
          .run();
      } else {
        // 本番環境では通常の動画生成
        ffmpeg()
          .input(imagePath)
          .input(audioPath)
          .outputOptions([...commonOptions, '-shortest'])
          .output(outputPath)
          .on('end', async () => {
            try {
              const videoInfo = await validateVideo(outputPath);
              logger.info(`Generated video: ${outputPath} (${videoInfo.width}x${videoInfo.height}, ${videoInfo.duration}s)`);
              
              resolve({
                videoPath: outputPath,
                duration: videoInfo.duration
              });
            } catch (error) {
              logger.error('Failed to validate video:', error as Error);
              reject(new Error('Failed to validate video'));
            }
          })
          .on('error', (err) => {
            logger.error('Video rendering error:', err);
            reject(new Error('Failed to render video'));
          })
          .run();
      }
    });
  }
} 