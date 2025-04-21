import axios from 'axios';
import { NotificationError, ConfigurationError } from './errors';
import { Logger, LogContext } from './utils/logger';
import { SlackMessage, SlackBlock } from './types/index';

export class NotifySlack {
  private readonly logger: Logger;
  private readonly webhookUrl: string;

  constructor(logger?: Logger) {
    this.logger = logger || Logger.getInstance();

    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new ConfigurationError('SLACK_WEBHOOK_URL is not set');
    }

    this.webhookUrl = webhookUrl;
  }

  public async notifyVideoGenerated(videoPath: string, duration: number): Promise<void> {
    if (!videoPath) {
      throw new ConfigurationError('動画パスが指定されていません');
    }

    try {
      const blocks: SlackBlock[] = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎥 動画の生成が完了しました'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*パス:* \`${videoPath}\`\n*長さ:* ${duration.toFixed(1)}秒`
          }
        }
      ];

      const message: SlackMessage = { blocks };
      
      const response = await axios.post(this.webhookUrl, message);

      if (response.status !== 200) {
        throw new NotificationError('Slack通知の送信に失敗しました');
      }

      const logContext: LogContext = { videoPath, duration };
      this.logger.info('Slack通知を送信しました', logContext);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      const logContext: LogContext = { errorMessage };
      this.logger.error('Slack通知の送信に失敗しました', logContext);
      throw new NotificationError(`Slack通知の送信に失敗しました: ${errorMessage}`);
    }
  }

  public async notifyError(error: Error): Promise<void> {
    try {
      const blocks: SlackBlock[] = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '❌ エラーが発生しました'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*エラー:* ${error.message}`
          }
        }
      ];

      // スタックトレースがある場合は追加
      if (error.stack) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*スタックトレース:*\n\`\`\`${error.stack}\`\`\``
          }
        });
      }

      const message: SlackMessage = { blocks };
      await axios.post(this.webhookUrl, message);

      const logContext: LogContext = { errorMessage: error.message };
      this.logger.info('エラー通知を送信しました', logContext);
    } catch (notifyError) {
      const errorMessage = notifyError instanceof Error ? notifyError.message : '不明なエラー';
      const logContext: LogContext = {
        originalErrorMessage: error.message,
        notifyErrorMessage: errorMessage
      };
      this.logger.error('エラー通知の送信に失敗しました', logContext);
    }
  }
} 