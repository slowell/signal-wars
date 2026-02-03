/**
 * Duels API Route
 * 
 * GET /api/duels - Returns active and past duels
 * POST /api/duels - Creates a new duel
 * 
 * GET Query Parameters:
 * - agentId: string - Filter by participating agent
 * - status: 'pending' | 'active' | 'completed' | 'cancelled'
 * - asset: string - Filter by asset
 * - page: number (default: 1)
 * - perPage: number (default: 20, max: 100)
 * 
 * POST Body:
 * - challengerAgentId: string (required)
 * - opponentAgentId: string (required)
 * - asset: string (required) - SOL, BTC, ETH, etc.
 * - stakeAmount: string (required) - Lamports as string
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  handleApiError, 
  getPaginationParams,
  validateRequiredFields,
  checkRateLimit,
  applyRateLimitHeaders,
  withCacheHeaders,
  CACHE_DURATIONS,
  ErrorCodes,
  ApiErrorException,
} from '@/lib/api-utils';
import { fetchDuels, createDuel } from '@/lib/blockchain-sdk';
import { 
  DuelResponse, 
  CreateDuelRequest,
  Duel,
  DuelsQueryParams,
  AssetSymbol,
} from '@/lib/api-types';

export const dynamic = 'force-dynamic';

// Valid assets
const VALID_ASSETS: AssetSymbol[] = ['SOL', 'BTC', 'ETH', 'JUP', 'BONK', 'WIF', 'USDC', 'USDT'];

// Valid duel statuses
const VALID_STATUSES = ['pending', 'active', 'completed', 'cancelled'];

// GET - Fetch duels
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting check
    const clientIp = request.ip || 'unknown';
    const rateLimitKey = `duels:get:${clientIp}`;
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
      status: searchParams.get('status') || undefined,
      asset: searchParams.get('asset') || undefined,
    };

    // Validate status if provided
    if (filters.status && !VALID_STATUSES.includes(filters.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.INVALID_PARAMS,
            message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

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

    // Fetch duels
    const { duels, total } = await fetchDuels(
      pagination.offset,
      pagination.perPage,
      filters
    );

    // Build response
    const response: DuelResponse = {
      duels,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
    };

    // Create success response with caching
    const successResponse = createSuccessResponse(response);
    const cachedResponse = withCacheHeaders(
      successResponse,
      CACHE_DURATIONS.DUELS,
      CACHE_DURATIONS.DUELS * 2
    );
    
    return applyRateLimitHeaders(cachedResponse, rateLimitInfo);

  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Create a new duel
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting check - stricter for writes
    const clientIp = request.ip || 'unknown';
    const rateLimitKey = `duels:post:${clientIp}`;
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
    let body: Partial<CreateDuelRequest>;
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
      'challengerAgentId',
      'opponentAgentId',
      'asset',
      'stakeAmount',
    ]);

    const { 
      challengerAgentId, 
      opponentAgentId, 
      asset, 
      stakeAmount,
    } = body as CreateDuelRequest;

    // Validate agents are different
    if (challengerAgentId === opponentAgentId) {
      throw new ApiErrorException(
        ErrorCodes.INVALID_PARAMS,
        'Challenger and opponent must be different agents',
        400
      );
    }

    // Validate asset
    if (!VALID_ASSETS.includes(asset)) {
      throw new ApiErrorException(
        ErrorCodes.INVALID_PARAMS,
        `Invalid asset. Must be one of: ${VALID_ASSETS.join(', ')}`,
        400,
        { field: 'asset', value: asset }
      );
    }

    // Validate stake amount (basic check - must be a positive number string)
    if (!/^[0-9]+$/.test(stakeAmount) || BigInt(stakeAmount) <= 0) {
      throw new ApiErrorException(
        ErrorCodes.INVALID_PARAMS,
        'stakeAmount must be a positive integer (lamports)',
        400,
        { field: 'stakeAmount', value: stakeAmount }
      );
    }

    // Create duel via blockchain SDK
    const duel = await createDuel(
      challengerAgentId,
      opponentAgentId,
      asset,
      stakeAmount
    );

    // Return created duel
    const successResponse = createSuccessResponse(duel, 201);
    return applyRateLimitHeaders(successResponse, rateLimitInfo);

  } catch (error) {
    return handleApiError(error);
  }
}
