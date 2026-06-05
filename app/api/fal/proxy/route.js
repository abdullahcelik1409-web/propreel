import { createRouteHandler } from "@fal-ai/server-proxy/nextjs";
import { assertFalCredentials } from "@/lib/fal";
import { requireUser } from "@/lib/session";
import { FAL_MULTI_IMAGE_VIDEO_MODEL_ID, FAL_VIDEO_MODEL_ID } from "@/lib/videoConfig";

const proxy = createRouteHandler({
  allowedEndpoints: [FAL_VIDEO_MODEL_ID, FAL_MULTI_IMAGE_VIDEO_MODEL_ID],
  allowUnauthorizedRequests: false,
  isAuthenticated: async () => true,
  resolveFalAuth: async () => `Key ${assertFalCredentials()}`,
});

async function withAuth(handler, request) {
  await requireUser();
  return handler(request);
}

export function GET(request) {
  return withAuth(proxy.GET, request);
}

export function POST(request) {
  return withAuth(proxy.POST, request);
}

export function PUT(request) {
  return withAuth(proxy.PUT, request);
}
