import path from 'path';
import dotenv from 'dotenv';
import { ContentGenerator } from './contentGen';
import { VoiceGenerator } from './voiceGen';
import { ImageGenerator } from './imageGen';
import { VideoRenderer } from './videoRender';
import { SlackNotifier } from './notifySlack';
import { VideoGenerationConfig, NotificationPayload } from './types';
import fs from 'fs/promises';
import { Logger } from './utils/logger';
import { validateFileExists } from './utils/validation';
import {
  VideoGenerationError,
  ContentGenerationError,
  VoiceGenerationError,
  ImageGenerationError,
  VideoRenderError,
  NotificationError,
  ConcurrencyError,
  ResourceError,
  ConfigurationError
} from './errors';

// 環境変数の読み込み
dotenv.config();

const logger = Logger.getInstance();

type ProgressCallback = (id: string, data: {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  step: string;
  error?: string;
}) => void;

interface GenerationJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  abortController: AbortController;
  tempFiles: string[];
}

export class VideoGenerator {
  private config: VideoGenerationConfig;
  private contentGen: ContentGenerator;
  private voiceGen: VoiceGenerator;
  private imageGen: ImageGenerator;
  private videoRender: VideoRenderer;
  private slackNotifier: SlackNotifier;
  private activeJobs: Map<string, GenerationJob>;
  private maxConcurrentJobs: number;

  constructor(maxConcurrentJobs = 3) {
    // 環境変数のバリデーション
    if (!process.env.OPENROUTER_API_KEY) {
      throw new ConfigurationError('OPENROUTER_API_KEY is not set');
    }
    if (!process.env.SLACK_WEBHOOK_URL) {
      throw new ConfigurationError('SLACK_WEBHOOK_URL is not set');
    }

    this.config = {
      outputDir: process.env.OUTPUT_DIR || 'output/videos',
      tempDir: process.env.TEMP_DIR || 'temp',
      videoFormat: 'mp4',
      resolution: {
        width: 1080,
        height: 1920
      },
      duration: {
        min: 15,
        max: 30
      }
    };

    this.contentGen = new ContentGenerator();
    this.voiceGen = new VoiceGenerator();
    this.imageGen = new ImageGenerator();
    this.videoRender = new VideoRenderer();
    this.slackNotifier = new SlackNotifier();
    this.activeJobs = new Map();
    this.maxConcurrentJobs = maxConcurrentJobs;

    // 一時ディレクトリの作成
    this.ensureDirectories().catch(error => {
      throw new ResourceError(`Failed to create directories: ${error.message}`);
    });
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.config.outputDir, { recursive: true });
      await fs.mkdir(this.config.tempDir, { recursive: true });
    } catch (error) {
      throw new ResourceError(`Failed to create directories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async cleanup(jobId: string): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    // 一時ファイルの削除
    for (const file of job.tempFiles) {
      try {
        if (await validateFileExists(file)) {
          await fs.unlink(file);
          logger.info(`Cleaned up temporary file: ${file}`);
        }
      } catch (error) {
        logger.error(`Failed to cleanup file ${file}:`, error);
      }
    }

    this.activeJobs.delete(jobId);
  }

  public async cancelGeneration(jobId: string): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new ResourceError(`Job ${jobId} not found`);
    }

    job.abortController.abort();
    job.status = 'cancelled';
    await this.cleanup(jobId);
    logger.info(`Job ${jobId} cancelled`);
  }

  public async generate(
    id: string,
    onProgress: ProgressCallback
  ): Promise<void> {
    if (this.activeJobs.size >= this.maxConcurrentJobs) {
      throw new ConcurrencyError('Maximum number of concurrent jobs reached');
    }

    const abortController = new AbortController();
    const job: GenerationJob = {
      id,
      status: 'pending',
      abortController,
      tempFiles: []
    };
    this.activeJobs.set(id, job);

    try {
      // 一時ファイルのパスを設定
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const audioPath = path.join(this.config.tempDir, `${timestamp}-${id}-audio.wav`);
      const imagePath = path.join(this.config.tempDir, `${timestamp}-${id}-image.jpg`);
      job.tempFiles.push(audioPath, imagePath);

      // 進捗通知
      onProgress(id, {
        status: 'processing',
        progress: 10,
        step: '英語フレーズを生成中...'
      });

      // コンテンツ生成
      let content;
      try {
        content = await this.contentGen.generateContent();
        if (abortController.signal.aborted) throw new Error('Operation cancelled');
      } catch (error) {
        throw new ContentGenerationError(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // 音声生成
      onProgress(id, {
        status: 'processing',
        progress: 30,
        step: 'OpenVoiceで音声を合成中...'
      });
      let voice;
      try {
        voice = await this.voiceGen.generateVoice(content.englishPhrase, audioPath);
        if (abortController.signal.aborted) throw new Error('Operation cancelled');
      } catch (error) {
        throw new VoiceGenerationError(`Failed to generate voice: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // 画像生成
      onProgress(id, {
        status: 'processing',
        progress: 50,
        step: '背景画像を生成中...'
      });
      let image;
      try {
        image = await this.imageGen.generateImage(
          content.englishPhrase.split(' '),
          imagePath
        );
        if (abortController.signal.aborted) throw new Error('Operation cancelled');
      } catch (error) {
        throw new ImageGenerationError(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // 動画レンダリング
      onProgress(id, {
        status: 'processing',
        progress: 70,
        step: '動画を合成中...'
      });
      let video;
      try {
        const videoPath = path.join(this.config.outputDir, `${id}.mp4`);
        video = await this.videoRender.renderVideo(
          image.imagePath,
          voice.audioPath,
          content.text,
          videoPath
        );
        if (abortController.signal.aborted) throw new Error('Operation cancelled');
      } catch (error) {
        throw new VideoRenderError(`Failed to render video: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Slack通知
      onProgress(id, {
        status: 'processing',
        progress: 90,
        step: 'Slackに通知中...'
      });
      try {
        const notificationPayload: NotificationPayload = {
          status: 'success',
          message: `新しい動画が生成されました！\n\n${content.englishPhrase}\n${content.japaneseTranslation}`,
          videoPath: video.videoPath,
          content,
          imageAttribution: image.attribution
        };
        await this.slackNotifier.notify(notificationPayload, process.env.SLACK_WEBHOOK_URL || '');
      } catch (error) {
        throw new NotificationError(`Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // 完了通知
      onProgress(id, {
        status: 'completed',
        progress: 100,
        step: '完了'
      });

      job.status = 'completed';

    } catch (error) {
      job.status = abortController.signal.aborted ? 'cancelled' : 'failed';
      const errorMessage = error instanceof VideoGenerationError ? 
        `${error.name} (${error.code}): ${error.message}` : 
        error instanceof Error ? error.message : '不明なエラー';
      
      onProgress(id, {
        status: job.status,
        progress: 0,
        step: job.status === 'cancelled' ? 'キャンセルされました' : 'エラー',
        error: errorMessage
      });

      logger.error(`Video generation ${job.status}:`, error);
      throw error;

    } finally {
      await this.cleanup(id);
    }
  }
}

// スクリプトが直接実行された場合のエントリーポイント
if (require.main === module) {
  const generator = new VideoGenerator();
  const id = Date.now().toString();
  generator.generate(id, (_, data) => console.log(data))
    .then(() => console.log('Video generation completed'))
    .catch(error => {
      if (error instanceof VideoGenerationError) {
        console.error(`${error.name} (${error.code}):`, error.message);
      } else {
        console.error('Video generation failed:', error);
      }
      process.exit(1);
    });
} 