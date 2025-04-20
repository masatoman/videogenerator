import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const dataDir = path.join(process.cwd(), 'data');
    const files = await fs.readdir(dataDir);
    
    const audioFiles = files
      .filter(file => file.endsWith('.wav') || file.endsWith('.mp3'))
      .map(file => ({
        name: file,
        path: path.join('data', file)
      }));

    res.status(200).json(audioFiles);
  } catch (error) {
    console.error('Error reading audio files:', error);
    res.status(500).json({ message: 'Failed to fetch audio files' });
  }
} 