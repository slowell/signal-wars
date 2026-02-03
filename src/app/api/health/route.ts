/**
 * Health Check API Route
 * GET /api/health - Returns API status and version
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, handleApiError, checkRateLimit, applyRateLimitHeaders } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting check
    const clientIp = request.ip || 'unknown';
    const rateLimitKey = `health:${clientIp}`;
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

    const healthData = {
      status: 'healthy',
      version: '0.1.0',
      timestamp: Date.now(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      features: {
        blockchain: !!process.env.SIGNAL_WARS_PROGRAM_ID,
        rpc: !!process.env.SOLANA_RPC_URL,
      },
    };

    const successResponse = createSuccessResponse(healthData);
    
    // Add cache headers - short cache for health check
    successResponse.headers.set('Cache-Control', 'public, s-maxage=10');
    
    return applyRateLimitHeaders(successResponse, rateLimitInfo);

  } catch (error) {
    return handleApiError(error);
  }
}
