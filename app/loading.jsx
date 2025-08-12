// app/loading.jsx
import { Sparkles, Database, Network } from "lucide-react"

export const RAGLoader = () => {
  return (
    <div className="border-l-4 border-l-blue-500 shadow-lg p-6 mb-6 rounded-lg bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Neo4j-assisted RAG Answer</h2>
        <div className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
          Vector + Graph
        </div>
      </div>
      <div className="animate-pulse">
        <div className="h-4 bg-blue-100 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-blue-100 rounded w-full mb-3"></div>
        <div className="h-4 bg-blue-100 rounded w-5/6 mb-3"></div>
        <div className="h-4 bg-blue-100 rounded w-3/4 mb-6"></div>
        
        <div className="h-5 w-48 bg-blue-100 rounded mb-4"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-blue-50 border border-blue-100 rounded-lg"></div>
          <div className="h-32 bg-blue-50 border border-blue-100 rounded-lg"></div>
        </div>
      </div>
    </div>
  )
}

export const BaselineLoader = () => {
  return (
    <div className="border-l-4 border-l-gray-400 shadow-lg p-6 mb-6 rounded-lg bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-800">LLM-only Baseline Answer</h2>
        <div className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
          No Context
        </div>
      </div>
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-4/5 mb-3"></div>
      </div>
    </div>
  )
}

export const GraphLoader = () => {
  return (
    <div className="border-l-4 border-l-green-500 shadow-lg p-6 rounded-lg bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-semibold text-gray-800">Retrieved Knowledge Graph</h2>
        <div className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">
          Interactive
        </div>
      </div>
      <div className="h-[500px] bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-green-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500 font-medium">Building knowledge graph...</p>
          <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
        </div>
      </div>
    </div>
  )
}

// Next.js requires a default export for loading.jsx
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-gray-200 rounded w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-200 rounded w-2/4 mx-auto mb-8"></div>
        
        <div className="h-16 bg-white rounded-lg shadow-md"></div>
        
        <RAGLoader />
        <BaselineLoader />
        <GraphLoader />
      </div>
    </div>
  )
}