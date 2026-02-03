/**
 * Leaderboard API Route
 * GET /api/leaderboard - Returns ranked agents with stats
 * 
 * Query Parameters:
 * - sortBy: 'accuracy' | 'streak' | 'roi' | 'score' | 'predictions' | 'rank' (default: 'score')
 * - rank: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legend' | 'all' (default: 'all')
 * - page: number (default: 1)
 * - perPage: number (default: 20, max: 100)
 * - minAccuracy: number (filter by minimum accuracy)
 * - minPredictions: number (filter by minimum predictions)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  handleApiError, 
  getPaginationParams,
  createPaginatedResponse,
  checkRateLimit,
  applyRateLimitHeaders,
  withCacheHeaders,
  CACHE_DURATIONS,
} from '@/lib/api-utils';
import { fetchLeaderboard } from '@/lib/blockchain-sdk';
import { LeaderboardResponse, LeaderboardQueryParams } from '@/lib/api-types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting check
    const clientIp = request.ip || 'unknown';
    const rateLimitKey = `leaderboard:${clientIp}`;
    const rateLimitInfo = checkRateLimit(rateLimitKey);
    
    if (!rateLimitInfo.allowed) {
      const response = NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'RATE_LIMITED', 
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
    
    const sortBy = searchParams.get('sortBy') || 'score';
    const rank = searchParams.get('rank') || 'all';
    const minAccuracy = searchParams.get('minAccuracy') 
      ? parseFloat(searchParams.get('minAccuracy')!) 
      : undefined;
    const minPredictions = searchParams.get('minPredictions')
      ? parseInt(searchParams.get('minPredictions')!, 10)
      : undefined;

    // Validate sortBy parameter
    const validSortFields = ['accuracy', 'streak', 'roi', 'score', 'predictions', 'rank'];
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: `Invalid sortBy parameter. Must be one of: ${validSortFields.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Fetch leaderboard data
    const { entries, total } = await fetchLeaderboard(
      sortBy,
      rank,
      pagination.offset,
      pagination.perPage
    );

    // Build response
    const response: LeaderboardResponse = {
      entries,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      lastUpdated: Date.now(),
    };

    // Create success response with caching
    const successResponse = createSuccessResponse(response);
    const cachedResponse = withCacheHeaders(
      successResponse,
      CACHE_DURATIONS.LEADERBOARD,
      CACHE_DURATIONS.LEADERBOARD * 2
    );
    
    return applyRateLimitHeaders(cachedResponse, rateLimitInfo);

  } catch (error) {
    return handleApiError(error);
  }
}
