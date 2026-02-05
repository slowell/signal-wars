import { NextResponse } from 'next/server';

// CORS middleware for agent API access
export function withCors(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Agent-ID');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

// Handle OPTIONS requests for CORS preflight
export function handleCorsPreflight(): NextResponse {
  return withCors(new NextResponse(null, { status: 204 }));
}
