import { normalizeAspectRatio } from "./videoConfig.js";

export const IMAGE_ORIENTATION = Object.freeze({
  PORTRAIT: "portrait",
  LANDSCAPE: "landscape",
  SQUARE: "square",
});

const DEFAULT_SQUARE_TOLERANCE = 0.04;

export function classifyImageDimensions(width, height, { squareTolerance = DEFAULT_SQUARE_TOLERANCE } = {}) {
  const safeWidth = Number(width);
  const safeHeight = Number(height);
  if (!Number.isFinite(safeWidth) || !Number.isFinite(safeHeight) || safeWidth <= 0 || safeHeight <= 0) {
    throw new Error("Image dimensions must be positive finite numbers.");
  }

  const ratio = safeWidth / safeHeight;
  if (Math.abs(ratio - 1) <= squareTolerance) return IMAGE_ORIENTATION.SQUARE;
  return ratio < 1 ? IMAGE_ORIENTATION.PORTRAIT : IMAGE_ORIENTATION.LANDSCAPE;
}

export function getReferenceOutputStrategy({ format, width, height, orientation }) {
  const normalizedFormat = normalizeAspectRatio(format);
  const resolvedOrientation = orientation || classifyImageDimensions(width, height);
  const requiresVerticalCanvas = normalizedFormat === "9:16" && resolvedOrientation !== IMAGE_ORIENTATION.PORTRAIT;

  return Object.freeze({
    outputAspectRatio: normalizedFormat,
    providerAspectRatio: requiresVerticalCanvas ? "16:9" : normalizedFormat,
    orientation: resolvedOrientation,
    requiresVerticalCanvas,
  });
}
