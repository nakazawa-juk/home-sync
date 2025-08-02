export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Next.js Development Template
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            TypeScript + Tailwind CSS + AI Development Tools
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Next.js 15
              </h2>
              <p className="text-gray-600">
                App Router with TypeScript support
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Tailwind CSS
              </h2>
              <p className="text-gray-600">Utility-first CSS framework</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                AI Tools
              </h2>
              <p className="text-gray-600">
                Claude Code + Serena MCP configured
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
