import axios from 'axios';
import { CONFIG } from '../config/settings';

export async function sendSlackNotification(videoPath: string): Promise<void> {
  try {
    const message = {
      text: '新しい動画が生成されました！',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*新しい動画が生成されました！* :movie_camera:\nファイル: \`${videoPath}\``
          }
        }
      ]
    };

    await axios.post(CONFIG.SLACK_WEBHOOK_URL, message, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Slack notification sent successfully');
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    throw error;
  }
} 