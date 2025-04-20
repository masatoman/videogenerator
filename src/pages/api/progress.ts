import { NextApiRequest, NextApiResponse } from 'next';

// 進捗状況を保持するグローバル変数
const progressMap = new Map<string, {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  step: string;
  error?: string;
}>();

export function updateProgress(id: string, data: {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  step: string;
  error?: string;
}) {
  progressMap.set(id, data);
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Video ID is required' });
  }

  const progress = progressMap.get(id);

  if (!progress) {
    return res.status(404).json({ message: 'Progress not found' });
  }

  res.status(200).json(progress);
} 