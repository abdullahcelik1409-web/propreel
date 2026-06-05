export async function generateMetadata() {
  return {
    title: 'Agent disabled - Open Generative AI',
  };
}

export default function AgentPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-3">Agent chat is disabled</h1>
        <p className="text-sm text-white/50">
          The legacy agent backend has been disabled for Part 1. Fal.ai video generation is available through the studio foundation.
        </p>
      </div>
    </main>
  );
}
