import { assertFalCredentials, fal } from "./fal";
import {
  buildRealEstateVideoPrompt,
  DEFAULT_REAL_ESTATE_NEGATIVE_PROMPT,
  DEFAULT_VIDEO_ASPECT_RATIO,
  FAL_MULTI_IMAGE_VIDEO_MODEL_ID,
  FAL_MULTI_IMAGE_VIDEO_MODEL_NAME,
  FAL_VIDEO_MODEL_ID,
  FAL_VIDEO_MODEL_NAME,
  getMultiImageScenePlan,
  getPromptTemplate,
  getSceneTemplate,
  MULTI_IMAGE_MAX_IMAGES,
  MULTI_IMAGE_NEGATIVE_PROMPT,
  normalizeAspectRatio,
  VIDEO_GENERATION_DURATION_SECONDS,
  VIDEO_MODE_BASIC,
  VIDEO_MODE_MULTI_IMAGE,
} from "./videoConfig";

export const FAL_VIDEO_MODELS = {
  klingStandard: FAL_VIDEO_MODEL_ID,
  multiImageStandard: FAL_MULTI_IMAGE_VIDEO_MODEL_ID,
};

function getResultUrl(result) {
  const data = result?.data || result;
  return (
    data?.video?.url ||
    data?.video_url ||
    data?.url ||
    data?.output?.url ||
    data?.outputs?.[0]?.url ||
    data?.outputs?.[0] ||
    null
  );
}

export function getVideoUrlFromResult(result) {
  return getResultUrl(result);
}

function normalizeResult(result, fallback = {}) {
  return {
    ...fallback,
    ...result,
    data: result?.data || result,
    url: getResultUrl(result),
  };
}

export function assertPublicImageUrl(imageUrl) {
  try {
    const url = new URL(imageUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Image URL must be an http(s) URL.");
    }
    return url.toString();
  } catch {
    const error = new Error("A valid public imageUrl is required.");
    error.status = 400;
    throw error;
  }
}

export function buildPropertyPrompt(options = {}) {
  const listing = options.listing || {};
  const promptTemplate = getPromptTemplate(options.templateId || options.style);
  const sceneTemplate = getSceneTemplate(options.sceneTemplateId, VIDEO_MODE_BASIC);
  const details = [
    listing.title && `Property title: ${listing.title}`,
    listing.price && `Listing price: ${listing.price}`,
    listing.propertyType && `Property type: ${listing.propertyType}`,
    listing.location && `Location: ${listing.location}`,
    listing.bedrooms && `Bedrooms: ${listing.bedrooms}`,
    listing.bathrooms && `Bathrooms: ${listing.bathrooms}`,
    listing.sqft && `Size: ${listing.sqft} square feet`,
    Array.isArray(listing.features) && listing.features.length ? `Key features: ${listing.features.join(", ")}` : null,
    listing.description && `Listing description: ${listing.description}`,
    Array.isArray(listing.photos) && listing.photos.length ? `Available listing photos: ${listing.photos.length}` : null,
  ].filter(Boolean);

  const userPrompt = typeof options.prompt === "string" ? options.prompt.trim() : "";
  const instructions = [
    promptTemplate?.promptModifier,
    sceneTemplate?.instruction,
    details.length ? `Listing data:\n${details.join("\n")}` : null,
    userPrompt ? `Additional user direction:\n${userPrompt}` : null,
  ].filter(Boolean).join("\n\n");

  return buildRealEstateVideoPrompt(instructions);
}

export function selectBestMultiImageUrls(photos = [], manualUrls = []) {
  const source = Array.isArray(manualUrls) && manualUrls.length ? manualUrls : photos;
  const selected = [];

  for (const photo of Array.isArray(source) ? source : []) {
    if (selected.length >= MULTI_IMAGE_MAX_IMAGES) break;
    try {
      const url = assertPublicImageUrl(photo);
      if (!selected.includes(url)) selected.push(url);
    } catch {
      // Skip invalid or non-public URLs; Fal must be able to fetch every image.
    }
  }

  if (!selected.length) {
    const error = new Error("At least one valid public listing photo is required for Multi Image Video.");
    error.status = 400;
    throw error;
  }

  return selected;
}

export function buildMultiImagePropertyPrompt(options = {}) {
  const listing = options.listing || {};
  const promptTemplate = getPromptTemplate(options.templateId);
  const sceneTemplate = getSceneTemplate(options.sceneTemplateId, VIDEO_MODE_MULTI_IMAGE);
  const clipFocus = options.clipFocus;
  const details = [
    listing.title && `Title: ${listing.title}`,
    listing.location && `Location: ${listing.location}`,
    listing.price && `Price: ${listing.price}`,
    listing.propertyType && `Property type: ${listing.propertyType}`,
    listing.bedrooms && `Bedrooms: ${listing.bedrooms}`,
    listing.bathrooms && `Bathrooms: ${listing.bathrooms}`,
    listing.sqft && `Size: ${listing.sqft} square feet`,
    Array.isArray(listing.features) && listing.features.length ? `Features: ${listing.features.join(", ")}` : null,
    listing.description && `Description: ${listing.description}`,
    `Selected image count: ${options.selectedImageCount || 0}`,
    `Video duration: ${options.durationSeconds || 10} seconds`,
  ].filter(Boolean);

  const userPrompt = typeof options.prompt === "string" ? options.prompt.trim() : "";
  const instructions = [
    "Create a cinematic real estate promotional video using the provided property reference images. Use the images as different areas of the same property, such as exterior, living room, kitchen, balcony, garden, bedroom, or interior details. Preserve the architecture, layout, materials, and realistic appearance of the property. Create smooth camera movement, elegant real estate advertising style, natural lighting, and premium visual quality. Do not invent new rooms, do not change the property structure, and do not distort the reference images.",
    promptTemplate?.promptModifier,
    sceneTemplate?.instruction,
    clipFocus ? `Clip focus:\n${clipFocus}` : null,
    details.length ? `Property details:\n${details.join("\n")}` : null,
    userPrompt ? `Additional user direction:\n${userPrompt}` : null,
  ].filter(Boolean).join("\n\n");

  return instructions;
}

export function buildFalVideoInput({ imageUrl, prompt, aspectRatio = DEFAULT_VIDEO_ASPECT_RATIO }) {
  const normalizedAspectRatio = normalizeAspectRatio(aspectRatio || DEFAULT_VIDEO_ASPECT_RATIO);
  return {
    image_url: assertPublicImageUrl(imageUrl),
    prompt,
    duration: String(VIDEO_GENERATION_DURATION_SECONDS),
    aspect_ratio: normalizedAspectRatio,
    negative_prompt: DEFAULT_REAL_ESTATE_NEGATIVE_PROMPT,
  };
}

export function buildFalMultiImageVideoInput({
  imageUrl,
  imageUrls,
  prompt,
  durationSeconds = 10,
}) {
  const selectedImageUrl = assertPublicImageUrl(imageUrl || imageUrls?.[0]);
  return {
    prompt,
    image_url: selectedImageUrl,
    duration: durationSeconds === 30 ? "10" : String(durationSeconds),
    negative_prompt: MULTI_IMAGE_NEGATIVE_PROMPT,
  };
}

export async function generatePropertyVideo(photos, options = {}) {
  assertFalCredentials();

  if (!Array.isArray(photos) || photos.length === 0) {
    const error = new Error("At least one listing photo is required.");
    error.status = 400;
    throw error;
  }

  const imageUrl = assertPublicImageUrl(photos[0]);
  const prompt = options.prompt || buildPropertyPrompt(options);
  const input = buildFalVideoInput({
    imageUrl,
    prompt,
    aspectRatio: options.aspectRatio || options.format || DEFAULT_VIDEO_ASPECT_RATIO,
  });

  const result = await fal.queue.submit(FAL_VIDEO_MODEL_ID, {
    input,
    webhookUrl: options.webhookUrl,
  });

  return {
    jobId: result.request_id || result.requestId,
    model: FAL_VIDEO_MODEL_ID,
    modelName: FAL_VIDEO_MODEL_NAME,
    imageUrl,
    prompt,
    negativePrompt: DEFAULT_REAL_ESTATE_NEGATIVE_PROMPT,
    input,
    raw: result,
  };
}

export async function submitMultiImageVideoClip({
  imageUrl,
  imageUrls,
  prompt,
  durationSeconds = 10,
  webhookUrl,
}) {
  assertFalCredentials();
  const input = buildFalMultiImageVideoInput({ imageUrl, imageUrls, prompt, durationSeconds });
  const result = await fal.queue.submit(FAL_MULTI_IMAGE_VIDEO_MODEL_ID, {
    input,
    webhookUrl,
  });
  const requestId = result.request_id || result.requestId;
  const immediateStatus = await fal.queue.status(FAL_MULTI_IMAGE_VIDEO_MODEL_ID, {
    requestId,
    logs: true,
  }).catch(() => null);

  const normalizedStatus = String(immediateStatus?.status || immediateStatus?.state || "").toLowerCase();
  if (["failed", "failure", "error", "cancelled", "canceled"].includes(normalizedStatus)) {
    const message =
      immediateStatus?.error ||
      immediateStatus?.logs?.map((log) => log.message).filter(Boolean).join(" ") ||
      "Fal.ai rejected the Kling 2.1 video input.";
    throw new Error(`Fal.ai Kling 2.1 validation failed: ${message}`);
  }

  return {
    jobId: requestId,
    model: FAL_MULTI_IMAGE_VIDEO_MODEL_ID,
    modelName: FAL_MULTI_IMAGE_VIDEO_MODEL_NAME,
    input,
    immediateStatus,
    raw: result,
  };
}

function getClipImageUrl(imageUrls, sceneIndex) {
  const publicImageUrls = imageUrls.map(assertPublicImageUrl).slice(0, MULTI_IMAGE_MAX_IMAGES);
  if (!publicImageUrls.length) {
    const error = new Error("At least one valid public image URL is required for Kling 2.1 video generation.");
    error.status = 400;
    throw error;
  }
  return publicImageUrls[sceneIndex % publicImageUrls.length];
}

export async function submitMultiImageVideoGeneration({
  listing,
  imageUrls,
  templateId,
  sceneTemplateId,
  prompt,
  durationSeconds,
  aspectRatio,
}) {
  const scenePlan = getMultiImageScenePlan(durationSeconds);
  const normalizedAspectRatio = normalizeAspectRatio(aspectRatio || DEFAULT_VIDEO_ASPECT_RATIO);
  const publicImageUrls = imageUrls.map(assertPublicImageUrl).slice(0, MULTI_IMAGE_MAX_IMAGES);
  const providerRequests = [];

  for (let index = 0; index < scenePlan.length; index += 1) {
    const scene = scenePlan[index];
    const clipImageUrl = getClipImageUrl(publicImageUrls, index);
    const continuityDirection = [
      scene.direction,
      `Continuity direction: this is clip ${scene.clip} of ${scenePlan.length} in one continuous ${durationSeconds}-second property marketing video. Keep the same visual style, lighting, color grade, camera language, property identity, and realistic architecture so it cuts naturally with the previous and next clip.`,
      `Reference image usage: animate the current reference photo as this clip's primary scene. Do not create unrelated rooms or a different property.`,
      normalizedAspectRatio === "1:1" ? "Composition direction: favor a balanced square composition with the main property features centered and protected from edge cropping." : null,
    ].filter(Boolean).join("\n");
    const clipPrompt = buildMultiImagePropertyPrompt({
      listing,
      templateId,
      sceneTemplateId,
      prompt,
      durationSeconds: scene.durationSeconds,
      selectedImageCount: publicImageUrls.length,
      clipFocus: continuityDirection,
    });
    const clip = await submitMultiImageVideoClip({
      imageUrl: clipImageUrl,
      imageUrls: publicImageUrls,
      prompt: clipPrompt,
      durationSeconds: scene.durationSeconds,
    });
    providerRequests.push({
      clip: scene.clip,
      status: "pending",
      requestId: clip.jobId,
      model: FAL_MULTI_IMAGE_VIDEO_MODEL_ID,
      imageUrl: clipImageUrl,
      requestedAspectRatio: normalizedAspectRatio,
      input: clip.input,
      raw: clip.raw,
      videoUrl: null,
    });
  }

  return {
    model: FAL_MULTI_IMAGE_VIDEO_MODEL_ID,
    modelName: FAL_MULTI_IMAGE_VIDEO_MODEL_NAME,
    scenePlan,
    providerRequests,
    primaryJobId: providerRequests[0]?.requestId,
  };
}

export async function generateVideoFromImages(images, options = {}) {
  assertFalCredentials();

  if (!Array.isArray(images) || images.length === 0) {
    const error = new Error("At least one image URL is required for Fal image-to-video generation.");
    error.status = 400;
    throw error;
  }

  const imageUrl = assertPublicImageUrl(images[0]);
  const prompt = options.prompt || buildRealEstateVideoPrompt("");
  const input = buildFalVideoInput({
    imageUrl,
    prompt,
    aspectRatio: options.aspectRatio || options.aspect_ratio || DEFAULT_VIDEO_ASPECT_RATIO,
  });

  if (options.submitOnly) {
    const queued = await fal.queue.submit(FAL_VIDEO_MODEL_ID, {
      input,
      webhookUrl: options.webhookUrl,
    });

    return normalizeResult(queued, {
      model: FAL_VIDEO_MODEL_ID,
      requestId: queued.request_id || queued.requestId,
    });
  }

  const result = await fal.subscribe(FAL_VIDEO_MODEL_ID, {
    input,
    logs: !!options.logs,
    pollInterval: options.pollInterval || 2000,
    onEnqueue: options.onRequestId,
    onQueueUpdate: options.onQueueUpdate,
  });

  return normalizeResult(result, { model: FAL_VIDEO_MODEL_ID });
}

export async function checkJobStatus(requestId, options = {}) {
  assertFalCredentials();
  if (!requestId) throw new Error("requestId is required.");
  const model = options.model || FAL_VIDEO_MODEL_ID;

  return fal.queue.status(model, {
    requestId,
    logs: !!options.logs,
  });
}

export async function getResult(requestId, options = {}) {
  assertFalCredentials();
  if (!requestId) throw new Error("requestId is required.");
  const model = options.model || FAL_VIDEO_MODEL_ID;

  const result = await fal.queue.result(model, { requestId });
  return normalizeResult(result, { model, requestId });
}
