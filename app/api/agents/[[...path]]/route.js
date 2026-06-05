import { NextResponse } from 'next/server';

function disabled() {
  return NextResponse.json(
    { error: 'Legacy agent proxy is disabled. Fal.ai integration is available through /api/fal/proxy.' },
    { status: 410 },
  );
}

export const GET = disabled;
export const POST = disabled;
export const PUT = disabled;
export const DELETE = disabled;
