/**
 * Predictions API Route
 * 
 * GET /api/predictions - Returns prediction history
 * POST /api/predictions - Creates a new prediction
 * 
 * GET Query Parameters:
 * - agentId: string - Filter by agent
 * - seasonId: string - Filter by season
 * - asset: string - Filter by asset (SOL, BTC, ETH, etc.)
 * - status: string - Filter by status (committed, revealed, resolved, expired)
 * - from: number - Start timestamp (unix ms)
 * - to: number - End timestamp (unix ms)
 * - page: number (default: 1)
 * - perPage: number (default: 20, max: 100)
 * 
 * POST Body:
 * - agentId: string (required)
 * - asset: string (required) - SOL, BTC, ETH, etc.
 * - direction: 'up' | 'down' (required)
 * - targetPrice: number (required)
 * - confidence: number (required) - 0-100
 * - stakeAmount: string (required) - Lamports as string
 * - timeframe: number (required) - Minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  handleApiError, 
  getPaginationParams,
  validateRequiredFields,
  validateNumber,
  checkRateLimit,
  applyRateLimitHeaders,
  withCacheHeaders,
  CACHE_DURATIONS,
  ErrorCodes,
  ApiErrorException,
} from '@/lib/api-utils';
import { fetchPredictions, createPrediction } from '@/lib/blockchain-sdk';
import { 
  PredictionHistoryResponse, 
  CreatePredictionRequest,
  Prediction,
  PredictionsQueryParams,
  AssetSymbol,
} from '@/lib/api-types';

export const dynamic = 'force-dynamic';

// Valid assets
const VALID_ASSETS: AssetSymbol[] = ['SOL', 'BTC', 'ETH', 'JUP', 'BONK', 'WIF', 'USDC', 'USDT'];

// GET - Fetch prediction history
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting check
    const clientIp = request.ip || 'unknown';
    const rateLimitKey = `predictions:get:${clientIp}`;
    const rateLimitInfo = checkRateLimit(rateLimitKey);
    
    if (!rateLimitInfo.allowed) {
      const response = NextResponse.json(
        { 
          success: false, 
          error: { 
            code: ErrorCodes.RATE_LIMITED, 
            message: 'Too many requests. Please try again later.' 
          } 
        },
        { status: 429 }
      );
      return applyRateLimitHeaders(response, rateLimitInfo);
    }

    // Parse query parameters
    const { searchParams } = request.nextUrl;
    const pagination = getPaginationParams(request);
    
    const filters = {
      agentId: searchParams.get('agentId') || undefined,
      seasonId: searchParams.get('seasonId') || undefined,
      asset: searchParams.get('asset') || undefined,
      status: searchParams.get('status') || undefined,
      from: searchParams.get('from') ? parseInt(searchParams.get('from')!, 10) : undefined,
      to: searchParams.get('to') ? parseInt(searchParams.get('to')!, 10) : undefined,
    };

    // Validate asset if provided
    if (filters.asset && !VALID_ASSETS.includes(filters.asset as AssetSymbol)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.INVALID_PARAMS,
            message: `Invalid asset. Must be one of: ${VALID_ASSETS.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Fetch predictions
    const { predictions, total } = await fetchPredictions(
      pagination.offset,
      pagination.perPage,
      filters
    );

    // Build response
    const response: PredictionHistoryResponse = {
      predictions,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
    };

    // Create success response with caching
    const successResponse = createSuccessResponse(response);
    const cachedResponse = withCacheHeaders(
      successResponse,
      CACHE_DURATIONS.PREDICTIONS,
      CACHE_DURATIONS.PREDICTIONS * 2
    );
    
    return applyRateLimitHeaders(cachedResponse, rateLimitInfo);

  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Create a new prediction
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting check - stricter for writes
    const clientIp = request.ip || 'unknown';
    const rateLimitKey = `predictions:post:${clientIp}`;
    const rateLimitInfo = checkRateLimit(rateLimitKey);
    
    if (!rateLimitInfo.allowed) {
      const response = NextResponse.json(
        { 
          success: false, 
          error: { 
            code: ErrorCodes.RATE_LIMITED, 
            message: 'Too many requests. Please try again later.' 
          } 
        },
        { status: 429 }
      );
      return applyRateLimitHeaders(response, rateLimitInfo);
    }

    // Parse request body
    let body: Partial<CreatePredictionRequest>;
    try {
      body = await request.json();
    } catch {
      throw new ApiErrorException(
        ErrorCodes.INVALID_PAYLOAD,
        'Invalid JSON payload',
        400
      );
    }

    // Validate required fields
    validateRequiredFields(body as Record<string, unknown>, [
      'agentId',
      'asset',
      'direction',
      'targetPrice',
      'confidence',
      'stakeAmount',
      'timeframe',
    ]);

    const { 
      agentId, 
      asset, 
      direction, 
      targetPrice, 
      confidence, 
      stakeAmount, 
      timeframe 
    } = body as CreatePredictionRequest;

    // Validate asset
    if (!VALID_ASSETS.includes(asset)) {
      throw new ApiErrorException(
        ErrorCodes.INVALID_PARAMS,
        `Invalid asset. Must be one of: ${VALID_ASSETS.join(', ')}`,
        400,
        { field: 'asset', value: asset }
      );
    }

    // Validate direction
    if (direction !== 'up' && direction !== 'down') {
      throw new ApiErrorException(
        ErrorCodes.INVALID_PARAMS,
        'Direction must be "up" or "down"',
        400,
        { field: 'direction', value: direction }
      );
    }

    // Validate numeric fields
    validateNumber(targetPrice, 'targetPrice', { min: 0 });
    validateNumber(confidence, 'confidence', { min: 0, max: 100 });
    validateNumber(timeframe, 'timeframe', { min: 1, max: 1440, integer: true }); // Max 24 hours

    // Validate stake amount (basic check - must be a positive number string)
    if (!/^[0-9]+$/.test(stakeAmount) || BigInt(stakeAmount) <= 0) {
      throw new ApiErrorException(
        ErrorCodes.INVALID_PARAMS,
        'stakeAmount must be a positive integer (lamports)',
        400,
        { field: 'stakeAmount', value: stakeAmount }
      );
    }

    // Create prediction via blockchain SDK
    const prediction = await createPrediction(
      agentId,
      asset,
      direction,
      targetPrice,
      confidence,
      stakeAmount,
      timeframe
    );

    // Return created prediction
    const successResponse = createSuccessResponse(prediction, 201);
    return applyRateLimitHeaders(successResponse, rateLimitInfo);

  } catch (error) {
    return handleApiError(error);
  }
}
