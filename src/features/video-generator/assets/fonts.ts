import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// フォントファイルの絶対パスを取得
const FONT_DIR = path.resolve(__dirname, 'fonts');

export const FONTS = {
  // デフォルトフォント設定
  DEFAULT: {
    path: path.resolve(FONT_DIR, 'NotoSansJP-Regular.ttf'),
    family: 'Noto Sans JP',
    weight: 'Regular'
  }
};

// フォントサイズ設定
export const FONT_SIZES = {
  SMALL: 32,
  MEDIUM: 48,
  LARGE: 64,
  EXTRA_LARGE: 80
};

// テキスト位置設定
export const TEXT_POSITIONS = {
  TOP: { y: '10%' },
  CENTER: { y: '50%' },
  BOTTOM: { y: '90%' }
}; 