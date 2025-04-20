import { ContentGenerator } from '../contentGen';
import dotenv from 'dotenv';
import { Logger } from '../utils/logger';

// 環境変数の読み込み
dotenv.config();
const logger = Logger.getInstance();

describe('ContentGenerator', () => {
  let contentGen: ContentGenerator;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    contentGen = new ContentGenerator();
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('APIキーが設定されているか確認', () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe('');
  });

  describe('generateContent', () => {
    it('正常系 - コンテンツが生成される', async () => {
      const content = await contentGen.generateContent();
      
      expect(content).toBeDefined();
      expect(content.englishPhrase).toBe("Helping others brings joy to everyone's life");
      expect(content.japaneseTranslation).toBe("人を助けることは、みんなの人生に喜びをもたらします");
      expect(content.text).toBe("Helping others brings joy to everyone's life\n\n人を助けることは、みんなの人生に喜びをもたらします");
    });

    it('Giverコンテキストに沿った内容が生成される', async () => {
      const content = await contentGen.generateContent();
      expect(content.englishPhrase.toLowerCase()).toContain('help');
    });

    it('エラーハンドリング - 無効なAPIキー', async () => {
      process.env.NODE_ENV = 'production';
      process.env.OPENROUTER_API_KEY = '';
      
      expect(() => new ContentGenerator()).toThrow('OPENROUTER_API_KEY is not set');
    });

    test('英語フレーズの生成', async () => {
      const content = await contentGen.generateContent();
      
      // 基本的な構造の確認
      expect(content).toBeDefined();
      expect(content.englishPhrase).toBeDefined();
      expect(content.japaneseTranslation).toBeDefined();
      
      // 内容の検証
      expect(typeof content.englishPhrase).toBe('string');
      expect(content.englishPhrase.length).toBeGreaterThan(0);
      expect(typeof content.japaneseTranslation).toBe('string');
      expect(content.japaneseTranslation.length).toBeGreaterThan(0);
      
      // フレーズの長さ制限の確認
      expect(content.englishPhrase.length).toBeLessThanOrEqual(100);
      expect(content.japaneseTranslation.length).toBeLessThanOrEqual(100);
      
      logger.info(`Generated content: ${content.englishPhrase} (${content.japaneseTranslation})`);
    }, 30000);

    test('生成されたフレーズがギバー向けの内容である', async () => {
      const content = await contentGen.generateContent();
      
      // ギバー向けのキーワードや表現が含まれているか確認
      const giverKeywords = [
        'help', 'support', 'give', 'share', 'assist',
        'volunteer', 'contribute', 'care', 'kindness', 'generous'
      ];
      
      const hasGiverContext = giverKeywords.some(keyword => 
        content.englishPhrase.toLowerCase().includes(keyword) ||
        content.japaneseTranslation.includes(keyword)
      );
      
      expect(hasGiverContext).toBe(true);
      logger.info(`Giver context validation: ${content.englishPhrase}`);
    }, 30000);
  });
});
