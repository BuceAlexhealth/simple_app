import { describe, it, expect, vi } from 'vitest';
import {
  handleAsyncError,
  safeToast,
  getErrorMessage,
  ApiError,
  logStructuredError,
} from '@/lib/error-handling';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('handleAsyncError', () => {
  it('returns result when operation succeeds', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    const result = await handleAsyncError(operation, 'Error');
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('returns null and does not throw when rethrow is false', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Test error'));
    const result = await handleAsyncError(operation, 'Error', { rethrow: false });
    expect(result).toBeNull();
  });

  it('throws error when rethrow is true (default)', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Test error'));
    await expect(handleAsyncError(operation, 'Error')).rejects.toThrow('Test error');
  });

  it('logs error with context', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const operation = vi.fn().mockRejectedValue(new Error('Test error'));
    
    try {
      await handleAsyncError(operation, 'Error', { 
        context: { userId: '123' } 
      });
    } catch (e) {
      // Expected to throw
    }
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('getErrorMessage', () => {
  it('extracts message from Error instance', () => {
    const error = new Error('Test error message');
    expect(getErrorMessage(error)).toBe('Test error message');
  });

  it('returns string as-is', () => {
    expect(getErrorMessage('String error')).toBe('String error');
  });

  it('extracts message from object with message property', () => {
    const error = { message: 'Object error' };
    expect(getErrorMessage(error)).toBe('Object error');
  });

  it('returns default message for unknown error types', () => {
    expect(getErrorMessage(123)).toBe('An unexpected error occurred');
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
  });
});

describe('ApiError', () => {
  it('creates error with default values', () => {
    const error = new ApiError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('ApiError');
  });

  it('creates error with custom status code', () => {
    const error = new ApiError('Not found', 404);
    expect(error.statusCode).toBe(404);
  });

  it('creates error with error code', () => {
    const error = new ApiError('Error', 400, 'INVALID_INPUT');
    expect(error.code).toBe('INVALID_INPUT');
  });

  it('creates error with context', () => {
    const error = new ApiError('Error', 400, 'INVALID_INPUT', { field: 'email' });
    expect(error.context).toEqual({ field: 'email' });
  });
});

describe('logStructuredError', () => {
  it('logs error with default level', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Test error');
    
    logStructuredError(error);
    
    expect(consoleSpy).toHaveBeenCalled();
    const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(loggedData.level).toBe('error');
    expect(loggedData.error.message).toBe('Test error');
    consoleSpy.mockRestore();
  });

  it('logs with warn level', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = new Error('Test error');
    
    logStructuredError(error, {}, 'warn');
    
    expect(consoleSpy).toHaveBeenCalled();
    const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(loggedData.level).toBe('warn');
    consoleSpy.mockRestore();
  });

  it('logs with info level', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const error = new Error('Test error');
    
    logStructuredError(error, {}, 'info');
    
    expect(consoleSpy).toHaveBeenCalled();
    const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(loggedData.level).toBe('info');
    consoleSpy.mockRestore();
  });

  it('includes context in log', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Test error');
    
    logStructuredError(error, { userId: '123', action: 'login' });
    
    const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(loggedData.context).toEqual({ userId: '123', action: 'login' });
    consoleSpy.mockRestore();
  });

  it('includes requestId in log', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Test error');
    
    logStructuredError(error);
    
    const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(loggedData.requestId).toBeDefined();
    consoleSpy.mockRestore();
  });
});
