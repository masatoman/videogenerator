/**
 * ログレベルの定義
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * ロガークラス
 */
export class Logger {
  private static instance: Logger;
  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * ログメッセージのフォーマット
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  /**
   * デバッグログ
   */
  public debug(message: string): void {
    console.debug(this.formatMessage(LogLevel.DEBUG, message));
  }

  /**
   * 情報ログ
   */
  public info(message: string): void {
    console.info(this.formatMessage(LogLevel.INFO, message));
  }

  /**
   * 警告ログ
   */
  public warn(message: string): void {
    console.warn(this.formatMessage(LogLevel.WARN, message));
  }

  /**
   * エラーログ
   */
  public error(message: string, error?: Error): void {
    console.error(this.formatMessage(LogLevel.ERROR, message));
    if (error) {
      console.error(error);
    }
  }
} 