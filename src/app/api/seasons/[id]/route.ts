/**
 * Season Detail API Route
 * GET /api/seasons/[id] - Returns specific season details
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  handleApiError, 
  checkRateLimit,
  applyRateLimitHeaders,
  withCacheHeaders,
  CACHE_DURATIONS,
  ErrorCodes,
} from '@/lib/api-utils';
import { fetchSeasonStandings } from '@/lib/blockchain-sdk';

export const dynamic = 'force-dynamic';

// GET - Fetch specific season
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;
    
    // Rate limiting check
    const clientIp = request.ip || 'unknown';
    const rateLimitKey = `seasons:detail:${clientIp}:${id}`;
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

    // Fetch season with standings (limited to first page)
    const { season, standings, total } = await fetchSeasonStandings(id, 0, 20);

    // Build response
    const response = {
      season,
      topStandings: standings,
      totalParticipants: total,
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
