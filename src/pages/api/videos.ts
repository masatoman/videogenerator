import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

interface VideoInfo {
  id: string;
  filename: string;
  path: string;
  createdAt: string;
  status: 'completed' | 'failed';
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const outputDir = path.join(process.cwd(), 'output/videos');

  try {
    const files = await fs.readdir(outputDir);
    const videoFiles = files.filter(file => file.endsWith('.mp4'));
    
    const videos: VideoInfo[] = await Promise.all(
      videoFiles.map(async (filename) => {
        const filePath = path.join(outputDir, filename);
        const stats = await fs.stat(filePath);
        
        return {
          id: filename.replace('.mp4', ''),
          filename,
          path: `/videos/${filename}`,
          createdAt: stats.birthtime.toISOString(),
          status: 'completed'
        };
      })
    );

    // 作成日時の新しい順にソート
    videos.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.status(200).json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ message: 'Failed to fetch videos' });
  }
} 