import { NextResponse } from 'next/server';

function disabled() {
  return NextResponse.json(
    { error: 'Legacy upload URL proxy is disabled. Use Fal storage through /api/fal/proxy.' },
    { status: 410 },
  );
}

export const GET = disabled;
export const POST = disabled;
