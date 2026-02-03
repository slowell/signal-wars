/**
 * Season Standings API Route
 * GET /api/seasons/[id]/standings - Returns season standings/rankings
 * 
 * Query Parameters:
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
import { fetchSeasonStandings } from '@/lib/blockchain-sdk';
import { SeasonStandingsResponse } from '@/lib/api-types';

export const dynamic = 'force-dynamic';

// GET - Fetch season standings
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;
    
    // Rate limiting check
    const clientIp = request.ip || 'unknown';
    const rateLimitKey = `seasons:standings:${clientIp}:${id}`;
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

    // Validate season ID
    if (!id || id.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.INVALID_PARAMS,
            message: 'Season ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Parse pagination
    const pagination = getPaginationParams(request);

    // Fetch season standings
    const { standings, season, total } = await fetchSeasonStandings(
      id,
      pagination.offset,
      pagination.perPage
    );

    // Build response
    const response: SeasonStandingsResponse = {
      season,
      standings,
      totalParticipants: total,
      page: pagination.page,
      perPage: pagination.perPage,
    };

    // Create success response with caching
    const successResponse = createSuccessResponse(response);
    const cachedResponse = withCacheHeaders(
      successResponse,
      CACHE_DURATIONS.STANDINGS,
      CACHE_DURATIONS.STANDINGS * 2
    );
    
    return applyRateLimitHeaders(cachedResponse, rateLimitInfo);

  } catch (error) {
    return handleApiError(error);
  }
}
