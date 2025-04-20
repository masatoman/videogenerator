import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { generateVideo } from '../../features/video-generator/video-generator';
import { updateProgress } from './progress';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { audioPath } = req.body;

  if (!audioPath) {
    return res.status(400).json({ message: 'Audio path is required' });
  }

  try {
    const id = uuidv4();
    
    // 初期進捗状況を設定
    updateProgress(id, {
      status: 'pending',
      progress: 0,
      step: '準備中...'
    });

    // 非同期で動画生成を開始
    generateVideo(path.join(process.cwd(), audioPath), id, updateProgress)
      .then(() => {
        updateProgress(id, {
          status: 'completed',
          progress: 100,
          step: '完了'
        });
      })
      .catch((error) => {
        console.error('Video generation failed:', error);
        updateProgress(id, {
          status: 'failed',
          progress: 0,
          step: 'エラー',
          error: error.message
        });
      });

    // 生成IDを返す
    res.status(200).json({ id });
  } catch (error) {
    console.error('Error starting video generation:', error);
    res.status(500).json({ message: 'Failed to start video generation' });
  }
} 