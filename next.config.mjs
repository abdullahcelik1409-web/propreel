import path from 'path';
import { fileURLToPath } from 'url';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const createNextConfig = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  const isVercel = Boolean(process.env.VERCEL);

  return {
    transpilePackages: ['studio', 'ai-agent', 'workflow-builder', 'design-agent'],
    outputFileTracingRoot: __dirname,
    distDir: isDev || isVercel ? '.next' : '.next-build',
  };
};

export default createNextConfig;
