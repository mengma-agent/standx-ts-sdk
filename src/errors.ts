/**
 * StandX SDK Error Classes
 */

/**
 * Base error class for all StandX SDK errors
 */
export class StandXError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'StandXError';
    Error.captureStackTrace(this, StandXError);
  }
}

/**
 * Error during API requests
 */
export class APIError extends StandXError {
  constructor(
    message: string,
    statusCode?: number,
    details?: any
  ) {
    super(message, 'API_ERROR', statusCode, details);
    this.name = 'APIError';
  }
}

/**
 * Error during WebSocket connections
 */
export class WebSocketError extends StandXError {
  constructor(
    message: string,
    details?: any
  ) {
    super(message, 'WEBSOCKET_ERROR', undefined, details);
    this.name = 'WebSocketError';
  }
}

/**
 * Authentication related errors
 */
export class AuthError extends StandXError {
  constructor(
    message: string,
    details?: any
  ) {
    super(message, 'AUTH_ERROR', undefined, details);
    this.name = 'AuthError';
  }
}

/**
 * Validation errors (invalid parameters, etc.)
 */
export class ValidationError extends StandXError {
  constructor(
    message: string,
    details?: any
  ) {
    super(message, 'VALIDATION_ERROR', undefined, details);
    this.name = 'ValidationError';
  }
}

/**
 * Network timeout errors
 */
export class TimeoutError extends StandXError {
  constructor(
    message: string = 'Request timeout',
    details?: any
  ) {
    super(message, 'TIMEOUT_ERROR', undefined, details);
    this.name = 'TimeoutError';
  }
}
