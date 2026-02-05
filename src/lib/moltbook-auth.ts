import { NextRequest, NextResponse } from 'next/server';

interface MoltbookAgent {
  id: string;
  name: string;
  karma: number;
  post_count: number;
  verified: boolean;
  owner: {
    twitter?: string;
  };
}

interface MoltbookVerificationResult {
  success: boolean;
  agent?: MoltbookAgent;
  error?: string;
}

const MOLTBOOK_VERIFY_ENDPOINT = process.env.MOLTBOOK_VERIFY_ENDPOINT || 'https://moltbook.com/api/v1/agents/verify';
const MOLTBOOK_API_KEY = process.env.MOLTBOOK_API_KEY;

// Cache verification results (short TTL)
const verificationCache = new Map<string, { agent: MoltbookAgent; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Verify a Moltbook identity token
 */
export async function verifyMoltbookToken(token: string): Promise<MoltbookVerificationResult> {
  // Check cache first
  const cached = verificationCache.get(token);
  if (cached && cached.expires > Date.now()) {
    return { success: true, agent: cached.agent };
  }

  // If no API key configured, return mock for development
  if (!MOLTBOOK_API_KEY) {
    console.warn('MOLTBOOK_API_KEY not set, using mock verification');
    const mockAgent: MoltbookAgent = {
      id: 'mock_agent_123',
      name: 'TestAgent',
      karma: 100,
      post_count: 10,
      verified: true,
      owner: { twitter: '@test' },
    };
    verificationCache.set(token, { agent: mockAgent, expires: Date.now() + CACHE_TTL_MS });
    return { success: true, agent: mockAgent };
  }

  try {
    const response = await fetch(MOLTBOOK_VERIFY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOLTBOOK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identity_token: token }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { 
        success: false, 
        error: error.error || `Verification failed: ${response.status}` 
      };
    }

    const data = await response.json();
    
    if (data.success && data.agent) {
      // Cache the result
      verificationCache.set(token, { 
        agent: data.agent, 
        expires: Date.now() + CACHE_TTL_MS 
      });
      return { success: true, agent: data.agent };
    }

    return { success: false, error: 'Invalid verification response' };
  } catch (error) {
    console.error('Moltbook verification error:', error);
    return { success: false, error: 'Verification service unavailable' };
  }
}

/**
 * Extract Moltbook token from request headers
 */
export function extractMoltbookToken(request: NextRequest): string | null {
  return request.headers.get('x-moltbook-identity');
}

/**
 * Middleware to require Moltbook authentication
 */
export async function requireMoltbookAuth(
  request: NextRequest
): Promise<{ success: true; agent: MoltbookAgent } | { success: false; response: NextResponse }> {
  const token = extractMoltbookToken(request);
  
  if (!token) {
    return {
      success: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'MOLTBOOK_AUTH_REQUIRED',
            message: 'X-Moltbook-Identity header required. See https://signal-wars.vercel.app/auth.md'
          } 
        },
        { status: 401 }
      ),
    };
  }

  const verification = await verifyMoltbookToken(token);
  
  if (!verification.success) {
    return {
      success: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'MOLTBOOK_AUTH_INVALID',
            message: verification.error || 'Invalid identity token',
            hint: 'Generate a new token: POST https://moltbook.com/api/v1/agents/me/identity-token'
          } 
        },
        { status: 401 }
      ),
    };
  }

  // Attach agent to request for downstream use
  (request as any).moltbookAgent = verification.agent;
  
  return { success: true, agent: verification.agent! };
}

/**
 * Get Moltbook agent from request (after auth middleware)
 */
export function getMoltbookAgent(request: NextRequest): MoltbookAgent | null {
  return (request as any).moltbookAgent || null;
}

/**
 * Clear verification cache (useful for testing)
 */
export function clearMoltbookCache(): void {
  verificationCache.clear();
}
