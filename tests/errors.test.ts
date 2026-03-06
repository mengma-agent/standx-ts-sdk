import { describe, it, expect } from 'vitest';
import {
  StandXError,
  APIError,
  WebSocketError,
  AuthError,
  ValidationError,
  TimeoutError,
} from '../src/errors';

describe('Errors', () => {
  describe('StandXError', () => {
    it('should create error with message', () => {
      const error = new StandXError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('StandXError');
      expect(error.code).toBeUndefined();
      expect(error.statusCode).toBeUndefined();
    });

    it('should create error with all properties', () => {
      const error = new StandXError('API Error', 'ERROR_CODE', 500, { details: 'test' });
      expect(error.message).toBe('API Error');
      expect(error.code).toBe('ERROR_CODE');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ details: 'test' });
    });
  });

  describe('APIError', () => {
    it('should create API error', () => {
      const error = new APIError('Bad Request', 400, { field: 'symbol' });
      expect(error.name).toBe('APIError');
      expect(error.code).toBe('API_ERROR');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('WebSocketError', () => {
    it('should create WebSocket error', () => {
      const error = new WebSocketError('Connection failed', { reason: 'network' });
      expect(error.name).toBe('WebSocketError');
      expect(error.code).toBe('WEBSOCKET_ERROR');
    });
  });

  describe('AuthError', () => {
    it('should create auth error', () => {
      const error = new AuthError('Invalid token');
      expect(error.name).toBe('AuthError');
      expect(error.code).toBe('AUTH_ERROR');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid symbol', { symbol: '' });
      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error with default message', () => {
      const error = new TimeoutError();
      expect(error.message).toBe('Request timeout');
      expect(error.name).toBe('TimeoutError');
      expect(error.code).toBe('TIMEOUT_ERROR');
    });

    it('should create timeout error with custom message', () => {
      const error = new TimeoutError('Custom timeout message');
      expect(error.message).toBe('Custom timeout message');
    });
  });
});
