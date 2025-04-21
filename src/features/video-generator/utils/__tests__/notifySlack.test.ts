import { NotifySlack } from '../../notifySlack';
import { NotificationError, ConfigurationError } from '../../errors';
import { Logger, LogContext } from '../logger';
import axios from 'axios';

jest.mock('axios');
jest.mock('../logger');

describe('NotifySlack', () => {
  let notifySlack: NotifySlack;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // 環境変数の設定
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/test';

    // Loggerのモック
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as jest.Mocked<Logger>;
    (Logger.getInstance as jest.Mock).mockReturnValue(mockLogger);

    // axiosのモック
    (axios.post as jest.Mock).mockResolvedValue({ status: 200 });

    notifySlack = new NotifySlack(mockLogger);
  });

  afterEach(() => {
    delete process.env.SLACK_WEBHOOK_URL;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('SLACK_WEBHOOK_URLが設定されていない場合エラーを投げる', () => {
      delete process.env.SLACK_WEBHOOK_URL;
      expect(() => new NotifySlack(mockLogger)).toThrow(ConfigurationError);
    });

    it('loggerが未指定の場合デフォルトのloggerを使用する', () => {
      const defaultLogger = Logger.getInstance();
      const slack = new NotifySlack();
      expect(Logger.getInstance).toHaveBeenCalled();
      expect(slack).toBeDefined();
    });
  });

  describe('notifyVideoGenerated', () => {
    const videoPath = '/path/to/video.mp4';
    const duration = 10.5;

    it('正常に通知を送信する', async () => {
      await notifySlack.notifyVideoGenerated(videoPath, duration);

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          blocks: expect.arrayContaining([
            expect.objectContaining({
              type: 'header',
              text: expect.objectContaining({
                text: expect.stringContaining('動画の生成が完了しました')
              })
            })
          ])
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Slack通知を送信しました',
        expect.objectContaining({ videoPath, duration })
      );
    });

    it('動画パスが空の場合エラーを投げる', async () => {
      await expect(notifySlack.notifyVideoGenerated('', duration))
        .rejects
        .toThrow(ConfigurationError);
    });

    it('Slack APIがエラーを返した場合エラーを投げる', async () => {
      (axios.post as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      await expect(notifySlack.notifyVideoGenerated(videoPath, duration))
        .rejects
        .toThrow(NotificationError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Slack通知の送信に失敗しました',
        expect.objectContaining({ errorMessage: 'API error' })
      );
    });
  });

  describe('notifyError', () => {
    const testError = new Error('Test error');

    it('正常にエラー通知を送信する', async () => {
      await notifySlack.notifyError(testError);

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          blocks: expect.arrayContaining([
            expect.objectContaining({
              type: 'header',
              text: expect.objectContaining({
                text: expect.stringContaining('エラーが発生しました')
              })
            })
          ])
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'エラー通知を送信しました',
        expect.objectContaining({ errorMessage: testError.message })
      );
    });

    it('エラー通知の送信に失敗した場合もエラーをスローしない', async () => {
      (axios.post as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      await notifySlack.notifyError(testError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'エラー通知の送信に失敗しました',
        expect.objectContaining({
          originalErrorMessage: testError.message,
          notifyErrorMessage: 'API error'
        })
      );
    });

    it('スタックトレースを含むエラー通知を送信する', async () => {
      const errorWithStack = new Error('Test error');
      errorWithStack.stack = 'Error: Test error\n    at Test.test';

      await notifySlack.notifyError(errorWithStack);

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          blocks: expect.arrayContaining([
            expect.objectContaining({
              type: 'section',
              text: expect.objectContaining({
                text: expect.stringContaining('スタックトレース')
              })
            })
          ])
        })
      );
    });
  });
}); 