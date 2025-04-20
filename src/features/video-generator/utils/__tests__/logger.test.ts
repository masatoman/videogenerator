import { Logger, LogLevel } from '../logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = Logger.getInstance();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('シングルトンインスタンスを返す', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('ログメッセージのフォーマット', () => {
    it('タイムスタンプとログレベルを含む', () => {
      logger.info('テストメッセージ');
      
      const logCall = consoleInfoSpy.mock.calls[0][0];
      expect(logCall).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] テストメッセージ$/);
    });
  });

  describe('ログレベル別のメソッド', () => {
    it('debug: デバッグメッセージを出力', () => {
      const message = 'デバッグメッセージ';
      logger.debug(message);
      
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy.mock.calls[0][0]).toMatch(new RegExp(`\\[${LogLevel.DEBUG}\\] ${message}$`));
    });

    it('info: 情報メッセージを出力', () => {
      const message = '情報メッセージ';
      logger.info(message);
      
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy.mock.calls[0][0]).toMatch(new RegExp(`\\[${LogLevel.INFO}\\] ${message}$`));
    });

    it('warn: 警告メッセージを出力', () => {
      const message = '警告メッセージ';
      logger.warn(message);
      
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy.mock.calls[0][0]).toMatch(new RegExp(`\\[${LogLevel.WARN}\\] ${message}$`));
    });

    it('error: エラーメッセージを出力', () => {
      const message = 'エラーメッセージ';
      const error = new Error('テストエラー');
      logger.error(message, error);
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy.mock.calls[0][0]).toMatch(new RegExp(`\\[${LogLevel.ERROR}\\] ${message}$`));
      expect(consoleErrorSpy.mock.calls[1][0]).toBe(error);
    });

    it('error: エラーオブジェクトなしでも出力', () => {
      const message = 'エラーメッセージのみ';
      logger.error(message);
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toMatch(new RegExp(`\\[${LogLevel.ERROR}\\] ${message}$`));
    });
  });
}); 