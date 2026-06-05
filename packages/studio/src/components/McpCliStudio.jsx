"use client";

import React from "react";
import { FaPlug, FaTerminal, FaVideo } from "react-icons/fa";

const ITEMS = [
  {
    icon: FaPlug,
    title: "Fal proxy route",
    body: "Browser requests go through /api/fal/proxy so FAL_KEY stays on the server.",
    code: 'import { createRouteHandler } from "@fal-ai/server-proxy/nextjs";',
  },
  {
    icon: FaVideo,
    title: "Image-to-video service",
    body: "Part 1 adds a small service for Kling high-quality and Luma fast image-to-video jobs.",
    code: 'generateVideoFromImages([imageUrl], { speed: "fast", prompt })',
  },
  {
    icon: FaTerminal,
    title: "Queue helpers",
    body: "Job status and result helpers are available for later real estate video workflows.",
    code: "checkJobStatus(requestId); getResult(requestId);",
  },
];

function CodeBlock({ children }) {
  return (
    <pre className="text-[11.5px] font-mono text-[#22d3ee] bg-black/50 border border-white/5 rounded-md px-3 py-2 overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

export default function McpCliStudio() {
  return (
    <div className="w-full h-full overflow-y-auto bg-[#050505] text-white">
      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-10">
        <section className="flex flex-col items-center text-center gap-4">
          <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-white/60">
            Fal.ai foundation
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Proxy &amp; Video Jobs</h1>
          <p className="text-white/60 text-base md:text-lg max-w-2xl">
            The legacy provider tooling is disabled. This project now uses Fal.ai through a server-side Next.js proxy.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
                  <Icon className="text-lg" />
                </div>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="text-[13px] text-white/60 leading-relaxed">{item.body}</p>
                <CodeBlock>{item.code}</CodeBlock>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
