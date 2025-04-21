import { i18n } from './utils/i18n';

export class VideoGenerationError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * エラーメッセージを指定された言語で取得
   */
  getLocalizedMessage(locale: string = 'ja'): string {
    return i18n.translate(this.message, locale);
  }

  /**
   * エラー詳細を指定された言語で取得
   */
  getLocalizedDetails(locale: string = 'ja'): Record<string, unknown> | undefined {
    if (!this.details) return undefined;

    const localizedDetails: Record<string, unknown> = {};
    Object.entries(this.details).forEach(([key, value]) => {
      if (typeof value === 'string') {
        localizedDetails[key] = i18n.translate(value as string, locale);
      } else {
        localizedDetails[key] = value;
      }
    });
    return localizedDetails;
  }
}

export class ContentGenerationError extends VideoGenerationError {
  constructor(message: string, details?: Record<string, unknown>, locale: string = 'ja') {
    super(message, 'CONTENT_GENERATION_ERROR');
    this.details = details;
  }
}

export class VoiceGenerationError extends VideoGenerationError {
  constructor(message: string, details?: Record<string, unknown>, locale: string = 'ja') {
    super(message, 'VOICE_GENERATION_ERROR');
    this.details = details;
  }
}

export class ImageGenerationError extends VideoGenerationError {
  constructor(message: string, details?: Record<string, unknown>, locale: string = 'ja') {
    super(message, 'IMAGE_GENERATION_ERROR');
    this.details = details;
  }
}

export class VideoRenderError extends VideoGenerationError {
  constructor(message: string, details?: Record<string, unknown>, locale: string = 'ja') {
    super(message, 'VIDEO_RENDER_ERROR');
    this.details = details;
  }
}

export class NotificationError extends VideoGenerationError {
  constructor(message: string) {
    super(message, 'NOTIFICATION_ERROR');
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends VideoGenerationError {
  constructor(message: string, details?: Record<string, unknown>, locale: string = 'ja') {
    super(message, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class ConcurrencyError extends VideoGenerationError {
  constructor(message: string, details?: Record<string, unknown>, locale: string = 'ja') {
    super(message, 'CONCURRENCY_ERROR');
    this.details = details;
  }
}

export class ResourceError extends VideoGenerationError {
  constructor(message: string, details?: Record<string, unknown>, locale: string = 'ja') {
    super(message, 'RESOURCE_ERROR');
    this.details = details;
  }
}

export class ConfigurationError extends VideoGenerationError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NetworkError extends VideoGenerationError {
  constructor(message: string, details?: Record<string, unknown>, locale: string = 'ja') {
    super(message, 'NETWORK_ERROR');
    this.details = details;
  }
} 