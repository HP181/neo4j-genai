import { Loader2, Brain, Database, Network } from "lucide-react"

const LoadingSpinner = ({ size = "w-4 h-4", className = "" }) => (
  <Loader2 className={`animate-spin ${size} ${className}`} />
)

const SectionLoader = ({ icon: Icon, title, description }) => (
  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
    <div className="relative">
      <Icon className="w-6 h-6 text-blue-600" />
      <div className="absolute -top-1 -right-1">
        <LoadingSpinner size="w-3 h-3" className="text-blue-500" />
      </div>
    </div>
    <div>
      <h3 className="font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </div>
)

export const RAGLoader = () => (
  <SectionLoader
    icon={Brain}
    title="Generating RAG Answer"
    description="Processing with Neo4j vector search and graph traversal..."
  />
)

export const BaselineLoader = () => (
  <SectionLoader
    icon={Database}
    title="Generating Baseline Answer"
    description="Processing with LLM-only approach..."
  />
)

export const GraphLoader = () => (
  <SectionLoader
    icon={Network}
    title="Loading Graph Visualization"
    description="Rendering interactive network graph..."
  />
)

const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <div
            className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-indigo-400 rounded-full animate-spin mx-auto"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          ></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Loading Neo4j RAG System</h2>
        <p className="text-gray-600">Initializing vector search and graph traversal...</p>
      </div>
    </div>
  )
}

export default Loading
