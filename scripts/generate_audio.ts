import fs from 'fs/promises';
import axios from 'axios';
import { CONFIG } from '../config/settings';

interface GeneratedScript {
  script: string;
  duration: number;
  tone: string;
}

export async function generateAudio(): Promise<void> {
  try {
    // Read the latest script
    const date = new Date().toISOString().split('T')[0];
    const scriptPath = `${CONFIG.OUTPUT_DIR}/${date}-script.json`;
    const scriptData = await fs.readFile(scriptPath, 'utf-8');
    const script: GeneratedScript = JSON.parse(scriptData);

    // Call OpenVoice API
    const response = await axios.post(
      'https://api.openvoice.ai/v1/generate',
      {
        text: script.script,
        voice_id: CONFIG.OPENVOICE_VOICE_ID,
        output_format: 'mp3'
      },
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.OPENVOICE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    // Save the audio file
    const audioPath = `${CONFIG.OUTPUT_DIR}/${date}-audio.mp3`;
    await fs.writeFile(audioPath, response.data);

    console.log(`Audio generated and saved to ${audioPath}`);
  } catch (error) {
    console.error('Error generating audio:', error);
    throw error;
  }
} 