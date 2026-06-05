import { NextResponse } from 'next/server';

function disabled() {
  return NextResponse.json(
    { error: 'Legacy v1 proxy is disabled. Use /api/fal/proxy for Fal.ai requests.' },
    { status: 410 },
  );
}

export const GET = disabled;
export const POST = disabled;
export const PUT = disabled;
export const DELETE = disabled;
