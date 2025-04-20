import { schedule } from 'node-cron';
import { generateScript } from './generate_script';
import { generateAudio } from './generate_audio';
import { generateVideo } from './generate_video';
import { sendSlackNotification } from './send_slack';
import { CONFIG } from '../config/settings';

async function runVideoGeneration() {
  try {
    console.log('Starting video generation process...');
    
    // Generate script
    await generateScript();
    console.log('Script generation completed');
    
    // Generate audio
    await generateAudio();
    console.log('Audio generation completed');
    
    // Generate video
    await generateVideo();
    const date = new Date().toISOString().split('T')[0];
    const videoPath = `${CONFIG.OUTPUT_DIR}/${date}.mp4`;
    console.log('Video generation completed');
    
    // Send Slack notification
    await sendSlackNotification(videoPath);
    console.log('Process completed successfully');
  } catch (error) {
    console.error('Error in video generation process:', error);
  }
}

// Start the scheduler
schedule(CONFIG.GENERATION_CRON, runVideoGeneration);
console.log('Video generation scheduler started'); 