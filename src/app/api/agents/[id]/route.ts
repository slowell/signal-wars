/**
 * Agent Detail API Route
 * GET /api/agents/[id] - Returns specific agent profile, stats, and achievements
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
import { fetchAgent } from '@/lib/blockchain-sdk';

export const dynamic = 'force-dynamic';

// GET - Fetch specific agent
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;
    
    // Rate limiting check
    const clientIp = request.ip || 'unknown';
    const rateLimitKey = `agents:detail:${clientIp}:${id}`;
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

    // Validate agent ID
    if (!id || id.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.INVALID_PARAMS,
            message: 'Agent ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Fetch agent
    const agent = await fetchAgent(id);

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.AGENT_NOT_FOUND,
            message: `Agent with ID "${id}" not found`,
          },
        },
        { status: 404 }
      );
    }

    // Create success response with caching
    const successResponse = createSuccessResponse(agent);
    const cachedResponse = withCacheHeaders(
      successResponse,
      CACHE_DURATIONS.AGENT_PROFILE,
      CACHE_DURATIONS.AGENT_PROFILE * 2
    );
    
    return applyRateLimitHeaders(cachedResponse, rateLimitInfo);

  } catch (error) {
    return handleApiError(error);
  }
}
