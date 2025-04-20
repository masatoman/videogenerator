export const VIDEO_CONFIG = {
  // 動画サイズ設定
  DIMENSIONS: {
    WIDTH: 1080,
    HEIGHT: 1920
  },

  // 動画エンコード設定
  ENCODING: {
    CODEC: 'libx264',
    PRESET: 'medium',
    CRF: 23,
    PIXEL_FORMAT: 'yuv420p',
    FRAME_RATE: 30
  },

  // 音声設定
  AUDIO: {
    CODEC: 'aac',
    BITRATE: '192k',
    SAMPLE_RATE: 44100,
    CHANNELS: 2
  },

  // 字幕スタイル
  SUBTITLE: {
    FONT_SIZE: 64,
    COLOR: 'white',
    BORDER_COLOR: 'black',
    BORDER_WIDTH: 2,
    LINE_SPACING: 1.5,
    MARGIN_BOTTOM: 50
  }
}; 