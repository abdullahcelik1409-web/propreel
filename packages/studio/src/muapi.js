function providerDisabled(feature = "This feature") {
  throw new Error(`${feature} is disabled. Fal.ai integration is active for the Part 1 video foundation.`);
}

export async function generateImage() {
  providerDisabled("Image generation");
}

export async function generateI2I() {
  providerDisabled("Image-to-image generation");
}

export async function generateVideo() {
  providerDisabled("Text-to-video generation");
}

export async function generateI2V() {
  providerDisabled("Image-to-video generation");
}

export async function generateMarketingStudioAd() {
  providerDisabled("Marketing video generation");
}

export async function processV2V() {
  providerDisabled("Video-to-video generation");
}

export async function processLipSync() {
  providerDisabled("Lip sync generation");
}

export async function generateAudio() {
  providerDisabled("Audio generation");
}

export function uploadFile() {
  providerDisabled("File upload");
}

export async function getTemplateWorkflows() {
  return [];
}

export async function getUserWorkflows() {
  return [];
}

export async function getPublishedWorkflows() {
  return [];
}

export async function getTemplateAgents() {
  return [];
}

export async function getUserAgents() {
  return [];
}

export async function getPublishedAgents() {
  return [];
}

export async function getUserConversations() {
  return [];
}

export async function createWorkflow() {
  providerDisabled("Workflow creation");
}

export async function updateWorkflowName() {
  providerDisabled("Workflow rename");
}

export async function deleteWorkflow() {
  providerDisabled("Workflow deletion");
}

export async function getWorkflowInputs() {
  return [];
}

export async function executeWorkflow() {
  providerDisabled("Workflow execution");
}

export async function getAllNodeSchemas() {
  return [];
}

export async function getWorkflowData() {
  return null;
}

export async function getNodeSchemas() {
  return [];
}

export async function runSingleNode() {
  providerDisabled("Node execution");
}

export async function deleteNodeRun() {
  providerDisabled("Node run deletion");
}

export async function getNodeStatus() {
  return { status: "disabled" };
}

export async function handleProxyRequest() {
  providerDisabled("Legacy proxy");
}

export async function handleServerSideProxy() {
  providerDisabled("Legacy server proxy");
}

export async function calculateDynamicCost() {
  return { cost: null };
}

export async function registerAppInterest() {
  return { ok: false, disabled: true };
}

export async function getAppInterests() {
  return [];
}

export async function runClipping() {
  providerDisabled("Clipping");
}

export async function runMotionGraphics() {
  providerDisabled("Motion graphics");
}

export async function runMotionGraphicsEdit() {
  providerDisabled("Motion graphics edit");
}
