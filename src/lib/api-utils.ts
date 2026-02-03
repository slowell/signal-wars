/**
 * API Utilities for Signal Wars
 * Shared utilities for caching, rate limiting, and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, ApiError } from './api-types';

// ============================================================================
// Error Handling
// ============================================================================

export class ApiErrorException extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiErrorException';
  }
}

export const ErrorCodes = {
  // 400 Bad Request
  INVALID_PARAMS: 'INVALID_PARAMS',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // 401 Unauthorized
  UNAUTHORIZED: 'UNNAUTHORIZED',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  
  // 403 Forbidden
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // 404 Not Found
  NOT_FOUND: 'NOT_FOUND',
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  SEASON_NOT_FOUND: 'SEASON_NOT_FOUND',
  PREDICTION_NOT_FOUND: 'PREDICTION_NOT_FOUND',
  DUEL_NOT_FOUND: 'DUEL_NOT_FOUND',
  
  // 409 Conflict
  CONFLICT: 'CONFLICT',
  DUPLICATE_PREDICTION: 'DUPLICATE_PREDICTION',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  
  // 500 Internal Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BLOCKCHAIN_ERROR: 'BLOCKCHAIN_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  
  // 501 Not Implemented
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
} as const;

export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: Record<string, unknown>
): NextResponse<ApiResponse<never>> {
  const error: ApiError = { code, message, details };
  return NextResponse.json(
    { success: false, error },
    { status: statusCode }
  );
}

export function handleApiError(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof ApiErrorException) {
    return createErrorResponse(
      error.code,
      error.message,
      error.statusCode,
      error.details
    );
  }

  if (error instanceof Error) {
    console.error('API Error:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      error.message || 'An unexpected error occurred',
      500
    );
  }

  console.error('Unknown API Error:', error);
  return createErrorResponse(
    ErrorCodes.INTERNAL_ERROR,
    'An unexpected error occurred',
    500
  );
}

// ============================================================================
// Success Response Helper
// ============================================================================

export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
  cached: boolean = false
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: Date.now(),
        requestId: crypto.randomUUID(),
        cached,
      },
    },
    { status: statusCode }
  );
}

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter(field => !(field in body) || body[field] === undefined || body[field] === null);
  
  if (missing.length > 0) {
    throw new ApiErrorException(
      ErrorCodes.MISSING_REQUIRED_FIELD,
      `Missing required fields: ${missing.join(', ')}`,
      400,
      { missingFields: missing }
    );
  }
}

export function validatePublicKey(key: string, fieldName: string): void {
  // Basic validation - 32-44 character base58 string
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (!key || key.length < 32 || key.length > 44 || !base58Regex.test(key)) {
    throw new ApiErrorException(
      ErrorCodes.INVALID_PARAMS,
      `Invalid public key format for ${fieldName}: ${key}`,
      400,
      { field: fieldName, value: key }
    );
  }
}

export function validateNumber(
  value: unknown,
  fieldName: string,
  options?: { min?: number; max?: number; integer?: boolean }
): number {
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new ApiErrorException(
      ErrorCodes.INVALID_PARAMS,
      `${fieldName} must be a valid number`,
      400,
      { field: fieldName, value }
    );
  }

  if (options?.integer && !Number.isInteger(num)) {
    throw new ApiErrorException(
      ErrorCodes.INVALID_PARAMS,
      `${fieldName} must be an integer`,
      400,
      { field: fieldName, value }
    );
  }

  if (options?.min !== undefined && num < options.min) {
    throw new ApiErrorException(
      ErrorCodes.INVALID_PARAMS,
      `${fieldName} must be at least ${options.min}`,
      400,
      { field: fieldName, value, min: options.min }
    );
  }

  if (options?.max !== undefined && num > options.max) {
    throw new ApiErrorException(
      ErrorCodes.INVALID_PARAMS,
      `${fieldName} must be at most ${options.max}`,
      400,
      { field: fieldName, value, max: options.max }
    );
  }

  return num;
}

// ============================================================================
// Pagination Helpers
// ============================================================================

export interface PaginationResult {
  page: number;
  perPage: number;
  offset: number;
}

export function getPaginationParams(request: NextRequest): PaginationResult {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') || '20', 10)));
  
  return {
    page,
    perPage,
    offset: (page - 1) * perPage,
  };
}

export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  pagination: PaginationResult
) {
  return {
    items,
    total,
    page: pagination.page,
    perPage: pagination.perPage,
    totalPages: Math.ceil(total / pagination.perPage),
  };
}

// ============================================================================
// Rate Limiting (Simple In-Memory)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    // Reset window
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetTime: entry.resetTime,
  };
}

export function applyRateLimitHeaders(
  response: NextResponse,
  rateLimitInfo: { remaining: number; resetTime: number }
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
  response.headers.set('X-RateLimit-Remaining', String(rateLimitInfo.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimitInfo.resetTime / 1000)));
  return response;
}

// ============================================================================
// Caching Helpers
// ============================================================================

export const CACHE_DURATIONS = {
  LEADERBOARD: 60,      // 1 minute
  AGENT_PROFILE: 300,   // 5 minutes
  PREDICTIONS: 30,      // 30 seconds
  DUELS: 30,            // 30 seconds
  SEASONS: 300,         // 5 minutes
  STANDINGS: 60,        // 1 minute
} as const;

export function withCacheHeaders(
  response: NextResponse,
  maxAge: number,
  staleWhileRevalidate: number = maxAge
): NextResponse {
  response.headers.set(
    'Cache-Control',
    `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  );
  return response;
}
