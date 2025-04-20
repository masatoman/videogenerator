import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { CONFIG } from '../config/settings';

const execAsync = promisify(exec);

interface GeneratedScript {
  script: string;
  duration: number;
  tone: string;
}

export async function generateVideo(): Promise<void> {
  try {
    const date = new Date().toISOString().split('T')[0];
    const scriptPath = `${CONFIG.OUTPUT_DIR}/${date}-script.json`;
    const audioPath = `${CONFIG.OUTPUT_DIR}/${date}-audio.mp3`;
    const outputPath = `${CONFIG.OUTPUT_DIR}/${date}.mp4`;

    // Read the script to get duration
    const scriptData = await fs.readFile(scriptPath, 'utf-8');
    const script: GeneratedScript = JSON.parse(scriptData);

    // Create subtitle file
    const srtPath = `${CONFIG.OUTPUT_DIR}/${date}.srt`;
    const srtContent = `1\n00:00:00,000 --> 00:${String(script.duration).padStart(2, '0')}:00,000\n${script.script}`;
    await fs.writeFile(srtPath, srtContent);

    // Generate video with ffmpeg
    const ffmpegCommand = `ffmpeg -y \
      -f lavfi -i color=c=${CONFIG.BACKGROUND_COLOR}:s=${CONFIG.VIDEO_WIDTH}x${CONFIG.VIDEO_HEIGHT} \
      -i "${audioPath}" \
      -vf "subtitles=${srtPath}:force_style='FontSize=${CONFIG.FONT_SIZE},PrimaryColour=${CONFIG.FONT_COLOR}'" \
      -c:a aac \
      -shortest \
      "${outputPath}"`;

    await execAsync(ffmpegCommand);
    console.log(`Video generated and saved to ${outputPath}`);

    // Clean up temporary files
    await fs.unlink(srtPath);
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
} 