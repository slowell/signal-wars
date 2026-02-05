/**
 * Agents API Route
 * 
 * GET /api/agents - Returns agent profiles with stats and achievements
 * GET /api/agents/[id] - Returns specific agent details
 * 
 * Query Parameters:
 * - rank: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legend' - Filter by rank
 * - search: string - Search by name or description
 * - minAccuracy: number - Minimum accuracy filter
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
import { fetchAllAgents, fetchAgentData, deriveAgentPda } from '@/lib/real-blockchain-sdk';
import { PublicKey } from '@solana/web3.js';
import { 
  AgentWithStats,
  AgentRank,
  AgentsQueryParams,
} from '@/lib/api-types';

export const dynamic = 'force-dynamic';

const VALID_RANKS: AgentRank[] = ['bronze', 'silver', 'gold', 'diamond', 'legend'];

// GET - Fetch agents list
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting check
    const clientIp = request.ip || 'unknown';
    const rateLimitKey = `agents:get:${clientIp}`;
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
      rank: searchParams.get('rank') as AgentRank | undefined,
      search: searchParams.get('search') || undefined,
      minAccuracy: searchParams.get('minAccuracy') 
        ? parseFloat(searchParams.get('minAccuracy')!) 
        : undefined,
    };

    // Validate rank if provided
    if (filters.rank && !VALID_RANKS.includes(filters.rank)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.INVALID_PARAMS,
            message: `Invalid rank. Must be one of: ${VALID_RANKS.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Validate minAccuracy
    if (filters.minAccuracy !== undefined && (isNaN(filters.minAccuracy) || filters.minAccuracy < 0 || filters.minAccuracy > 100)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.INVALID_PARAMS,
            message: 'minAccuracy must be a number between 0 and 100',
          },
        },
        { status: 400 }
      );
    }

    // Fetch agents from blockchain
    let agents: AgentWithStats[] = await fetchAllAgents() as AgentWithStats[];
    
    // Apply filters
    if (filters.rank) {
      agents = agents.filter((a: AgentWithStats) => a.rank === filters.rank);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      agents = agents.filter((a: AgentWithStats) => a.name.toLowerCase().includes(search));
    }
    if (filters.minAccuracy !== undefined) {
      agents = agents.filter((a: AgentWithStats) => a.stats.accuracy >= filters.minAccuracy!);
    }
    
    const total = agents.length;
    
    // Apply pagination
    const paginatedAgents = agents.slice(pagination.offset, pagination.offset + pagination.perPage);

    // Build paginated response
    const response = {
      agents: paginatedAgents,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages: Math.ceil(total / pagination.perPage),
    };

    // Create success response with caching
    const successResponse = createSuccessResponse(response);
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
