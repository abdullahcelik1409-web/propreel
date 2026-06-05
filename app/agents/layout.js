/**
 * Layout for /agents/* pages.
 * These pages host the AiAgent component full-screen — no studio chrome needed.
 * Legacy agent routes are disabled in the Fal.ai Part 1 setup.
 */
export const metadata = {
  title: "Agent Chat — Open Generative AI",
};

export default function AgentsLayout({ children }) {
  return (
    <div className="h-screen w-full overflow-hidden bg-black">
      {children}
    </div>
  );
}
