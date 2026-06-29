import { readFile } from "node:fs/promises";
import { DEMO_VIDEO_DEFINITIONS, getPublicSupabaseObjectUrl, DEMO_STORAGE_BUCKET } from "../lib/marketing/demoConfig.js";

function getEnv(name) {
  return String(process.env[name] || "").trim();
}

function getArgValue(flagName) {
  const index = process.argv.indexOf(flagName);
  if (index === -1) return "";
  return String(process.argv[index + 1] || "").trim();
}

function getSupabaseUrl() {
  return getEnv("SUPABASE_URL") || getEnv("NEXT_PUBLIC_SUPABASE_URL") || getEnv("VISEO_SUPABASE_PROJECT_URL");
}

function getServiceRoleKey() {
  return getEnv("SUPABASE_SERVICE_ROLE_KEY");
}

async function uploadVideo({ sourcePath, storagePath, supabaseUrl, serviceRoleKey }) {
  const safePath = storagePath.split("/").map((segment) => encodeURIComponent(segment)).join("/");
  const uploadUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${encodeURIComponent(DEMO_STORAGE_BUCKET)}/${safePath}`;
  const bytes = await readFile(sourcePath);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": "video/mp4",
      "x-upsert": "true",
    },
    body: bytes,
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Upload failed for ${storagePath}: ${response.status}${details ? ` ${details.slice(0, 240)}` : ""}`);
  }
}

const sourceMap = {
  standard_listing: getArgValue("--standard"),
  luxury_property: getArgValue("--luxury"),
  before_after: getArgValue("--before-after"),
};

const supabaseUrl = getSupabaseUrl();
const serviceRoleKey = getServiceRoleKey();

if (!supabaseUrl || !serviceRoleKey) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

for (const video of DEMO_VIDEO_DEFINITIONS) {
  const sourcePath = sourceMap[video.id];
  if (!sourcePath) {
    console.error(`Missing source path for ${video.id}. Use the matching CLI flag.`);
    process.exit(1);
  }
}

for (const video of DEMO_VIDEO_DEFINITIONS) {
  await uploadVideo({
    sourcePath: sourceMap[video.id],
    storagePath: video.storagePath,
    supabaseUrl,
    serviceRoleKey,
  });
  console.log(`${video.id}: ${getPublicSupabaseObjectUrl(video.storagePath, { supabaseUrl })}`);
}
