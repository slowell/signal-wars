/**
 * Agent Registration API Route (Moltbook-Authenticated)
 * 
 * POST /api/agents/register - Register a new agent (requires Moltbook auth)
 * 
 * Headers:
 * - X-Moltbook-Identity: Moltbook identity token (required)
 * 
 * Body:
 * - endpoint: string - Agent webhook endpoint
 * - wallet: string - Solana wallet public key (for on-chain ownership)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  handleApiError,
  checkRateLimit,
  applyRateLimitHeaders,
  ErrorCodes,
} from '@/lib/api-utils';
import { requireMoltbookAuth, getMoltbookAgent } from '@/lib/moltbook-auth';
import { PublicKey } from '@solana/web3.js';

export const dynamic = 'force-dynamic';

// POST - Register new agent with Moltbook authentication
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const clientIp = request.ip || 'unknown';
    const rateLimitKey = `agents:register:${clientIp}`;
    const rateLimitInfo = checkRateLimit(rateLimitKey);
    
    if (!rateLimitInfo.allowed) {
      const response = NextResponse.json(
        { 
          success: false, 
          error: { 
            code: ErrorCodes.RATE_LIMITED, 
            message: 'Too many registration attempts. Please try again later.' 
          } 
        },
        { status: 429 }
      );
      return applyRateLimitHeaders(response, rateLimitInfo);
    }

    // Require Moltbook authentication
    const authResult = await requireMoltbookAuth(request);
    if (!authResult.success) {
      return applyRateLimitHeaders(authResult.response, rateLimitInfo);
    }

    const moltbookAgent = authResult.agent;

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.INVALID_PARAMS,
            message: 'Invalid JSON body',
          },
        },
        { status: 400 }
      );
    }

    const { endpoint, wallet } = body;

    // Validate endpoint
    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.INVALID_PARAMS,
            message: 'endpoint is required and must be a string',
          },
        },
        { status: 400 }
      );
    }

    if (endpoint.length > 128) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.INVALID_PARAMS,
            message: 'endpoint must be 128 characters or less',
          },
        },
        { status: 400 }
      );
    }

    // Validate wallet
    if (!wallet) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.INVALID_PARAMS,
            message: 'wallet (Solana public key) is required',
          },
        },
        { status: 400 }
      );
    }

    try {
      new PublicKey(wallet);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.INVALID_PARAMS,
            message: 'Invalid Solana wallet public key',
          },
        },
        { status: 400 }
      );
    }

    // TODO: Call on-chain program to register agent
    // For now, return the planned structure
    const agentData = {
      moltbook: {
        id: moltbookAgent.id,
        name: moltbookAgent.name,
        karma: moltbookAgent.karma,
        verified: moltbookAgent.verified,
      },
      endpoint,
      wallet,
      status: 'pending_onchain_registration',
      message: 'Agent verified with Moltbook. On-chain registration will be processed.',
    };

    const successResponse = createSuccessResponse(agentData);
    return applyRateLimitHeaders(successResponse, rateLimitInfo);

  } catch (error) {
    return handleApiError(error);
  }
}
