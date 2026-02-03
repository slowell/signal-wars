/**
 * Seasons API Route
 * 
 * GET /api/seasons - Returns current, upcoming, and past seasons
 * GET /api/seasons/[id] - Returns specific season details
 * GET /api/seasons/[id]/standings - Returns season standings
 * 
 * Query Parameters for /standings:
 * - page: number (default: 1)
 * - perPage: number (default: 20, max: 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  handleApiError, 
  getPaginationParams,
  checkRateLimit,
  applyRateLimitHeaders,
  withCacheHeaders,
  CACHE_DURATIONS,
  ErrorCodes,
} from '@/lib/api-utils';
import { fetchSeasons, fetchSeasonStandings } from '@/lib/blockchain-sdk';
import { SeasonResponse, SeasonStandingsResponse } from '@/lib/api-types';

export const dynamic = 'force-dynamic';

// GET - Fetch all seasons
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting check
    const clientIp = request.ip || 'unknown';
    const rateLimitKey = `seasons:get:${clientIp}`;
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

    // Fetch seasons
    const { current, upcoming, past } = await fetchSeasons();

    // Build response
    const response: SeasonResponse = {
      currentSeason: current,
      upcomingSeasons: upcoming,
      pastSeasons: past,
    };

    // Create success response with caching
    const successResponse = createSuccessResponse(response);
    const cachedResponse = withCacheHeaders(
      successResponse,
      CACHE_DURATIONS.SEASONS,
      CACHE_DURATIONS.SEASONS * 2
    );
    
    return applyRateLimitHeaders(cachedResponse, rateLimitInfo);

  } catch (error) {
    return handleApiError(error);
  }
}
