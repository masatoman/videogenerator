import winston from 'winston';

/**
 * ログレベルの定義
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogContext {
  [key: string]: unknown;
}

/**
 * ロガークラス
 */
export class Logger {
  private static instance: Logger;
  private logger: winston.Logger;

  private constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console()
      ]
    });
  }

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
  public debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }

  /**
   * 情報ログ
   */
  public info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  /**
   * 警告ログ
   */
  public warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }

  /**
   * エラーログ
   */
  public error(message: string, context?: LogContext): void {
    this.logger.error(message, context);
  }
} 