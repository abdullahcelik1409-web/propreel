import { NextResponse } from "next/server";

export function ok(data, init) {
  return NextResponse.json(data, init);
}

export function fail(error, fallbackStatus = 500) {
  const status = error?.status || fallbackStatus;
  return NextResponse.json(error?.payload || { error: error?.message || "Unexpected error" }, { status });
}

export function toInt(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
