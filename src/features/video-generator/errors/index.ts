export class VideoGenerationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'VideoGenerationError';
  }
}

export class ContentGenerationError extends VideoGenerationError {
  constructor(message: string) {
    super(message, 'CONTENT_GENERATION_ERROR');
    this.name = 'ContentGenerationError';
  }
}

export class VoiceGenerationError extends VideoGenerationError {
  constructor(message: string) {
    super(message, 'VOICE_GENERATION_ERROR');
    this.name = 'VoiceGenerationError';
  }
}

export class ImageGenerationError extends VideoGenerationError {
  constructor(message: string) {
    super(message, 'IMAGE_GENERATION_ERROR');
    this.name = 'ImageGenerationError';
  }
}

export class VideoRenderError extends VideoGenerationError {
  constructor(message: string) {
    super(message, 'VIDEO_RENDER_ERROR');
    this.name = 'VideoRenderError';
  }
}

export class NotificationError extends VideoGenerationError {
  constructor(message: string) {
    super(message, 'NOTIFICATION_ERROR');
    this.name = 'NotificationError';
  }
}

export class ValidationError extends VideoGenerationError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ConcurrencyError extends VideoGenerationError {
  constructor(message: string) {
    super(message, 'CONCURRENCY_ERROR');
    this.name = 'ConcurrencyError';
  }
}

export class ResourceError extends VideoGenerationError {
  constructor(message: string) {
    super(message, 'RESOURCE_ERROR');
    this.name = 'ResourceError';
  }
}

export class ConfigurationError extends VideoGenerationError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
} 