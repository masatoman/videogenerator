import axios from 'axios';
import { NotificationPayload, SlackBlock, SlackMessage } from './types';

export class SlackNotifier {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
    if (!this.webhookUrl) {
      throw new Error('SLACK_WEBHOOK_URL is not set');
    }
  }

  async notify(payload: NotificationPayload, webhookUrl: string): Promise<boolean> {
    try {
      const blocks: SlackBlock[] = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: payload.status === 'success' ? '🎥 新しい動画が生成されました' : '⚠️ エラーが発生しました',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: payload.message
          }
        }
      ];

      if (payload.videoPath) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*ファイルパス:*\n\`${payload.videoPath}\``
          }
        });
      }

      if (payload.content) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*英語フレーズ:*\n${payload.content.englishPhrase}\n*日本語訳:*\n${payload.content.japaneseTranslation}`
          }
        });
      }

      if (payload.imageAttribution) {
        blocks.push({
          type: 'context',
          elements: [{
            type: 'mrkdwn',
            text: `*画像提供:* <${payload.imageAttribution.url}|${payload.imageAttribution.photographer}>`
          }]
        });
      }

      if (payload.error) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*エラー詳細:*\n\`\`\`${payload.error.message}\`\`\``
          }
        });
      }

      const message: SlackMessage = { blocks };
      await axios.post(webhookUrl, message);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      console.error('Slack通知エラー:', errorMessage);
      throw new Error(`Slack通知の送信に失敗しました: ${errorMessage}`);
    }
  }

  async notifyError(error: Error): Promise<void> {
    try {
      await axios.post(this.webhookUrl, {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '⚠️ エラーが発生しました',
              emoji: true
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*エラー内容:*\n\`\`\`${error.message}\`\`\``
            }
          }
        ]
      });
    } catch (notifyError) {
      console.error('エラー通知の送信に失敗しました:', notifyError);
    }
  }
} 