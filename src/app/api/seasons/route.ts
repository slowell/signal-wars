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
import { fetchAllSeasons } from '@/lib/real-blockchain-sdk';
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

    // Fetch seasons from blockchain
    const allSeasons = await fetchAllSeasons();
    
    const now = Date.now();
    const current = allSeasons.find(s => s.startTime <= now && s.endTime > now) || null;
    const upcoming = allSeasons.filter(s => s.startTime > now);
    const past = allSeasons.filter(s => s.endTime <= now);

    // Build response
    const response = {
      current,
      upcoming,
      past,
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
