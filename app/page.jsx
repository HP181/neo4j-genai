"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import dynamic from "next/dynamic"
import { RAGLoader, BaselineLoader, GraphLoader } from "./loading"
import { Search, Sparkles, Database, Network, Clock } from "lucide-react"

const ForceGraph2D = dynamic(() => import("react-force-graph").then((mod) => mod.ForceGraph2D), {
  ssr: false,
  loading: () => <GraphLoader />,
})
const RAGSection = ({ result, loading }) => {
  if (loading) return <RAGLoader />

  return (
    <Card className="mb-6 border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Neo4j-assisted RAG Answer</h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Vector + Graph
          </Badge>
        </div>
        <p className="mb-6 text-gray-700 leading-relaxed whitespace-pre-wrap">{result.rag.answer}</p>

        {result.rag.movies && result.rag.movies.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Retrieved Movies & Context
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {result.rag.movies.map((m, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{m.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {m.released}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 italic">{m.tagline}</p>
                  {m.score && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Similarity Score</span>
                        <span>{(m.score * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${m.score * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>
                      <strong>Actors:</strong> {m.actors?.join(", ") || "N/A"}
                    </div>
                    <div>
                      <strong>Genres:</strong> {m.genres?.join(", ") || "N/A"}
                    </div>
                    <div>
                      <strong>Directors:</strong> {m.directors?.join(", ") || "N/A"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const BaselineSection = ({ result, loading }) => {
  if (loading) return <BaselineLoader />

  return (
    <Card className="mb-6 border-l-4 border-l-gray-400 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">LLM-only Baseline Answer</h2>
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            No Context
          </Badge>
        </div>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{result.baseline.answer}</p>
      </CardContent>
    </Card>
  )
}

const GraphSection = ({ result, isClient }) => {
  if (!result?.graph || !isClient) return <GraphLoader />

  const renderGraph = () => {
    try {
      return (
        <ForceGraph2D
          graphData={result.graph}
          nodeAutoColorBy="type"
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          nodeLabel={(node) => `${node.type}: ${node.name}`}
          linkLabel={(link) => link.label}
          cooldownTicks={100}
          backgroundColor="#f8fafc"
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name
            const fontSize = 12 / globalScale
            ctx.font = `${fontSize}px Sans-Serif`
            const textWidth = ctx.measureText(label).width
            const bckgDimensions = [textWidth, fontSize].map((n) => n + fontSize * 0.2)

            // Draw node
            ctx.fillStyle = node.color
            ctx.beginPath()
            ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI)
            ctx.fill()

            // Draw text with background
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
            ctx.fillRect(
              node.x - bckgDimensions[0] / 2,
              node.y - bckgDimensions[1] / 2,
              bckgDimensions[0],
              bckgDimensions[1],
            )
            ctx.fillStyle = "black"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText(label, node.x, node.y)
          }}
        />
      )
    } catch (err) {
      console.error("Error rendering graph:", err)
      return (
        <div className="h-[500px] flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-600">Error rendering graph. Please try again.</p>
        </div>
      )
    }
  }

  return (
    <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Network className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-800">Retrieved Knowledge Graph</h2>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Interactive
          </Badge>
        </div>
        <div className="h-[500px] relative rounded-lg overflow-hidden border border-gray-200">
          <Suspense fallback={<GraphLoader />}>{renderGraph()}</Suspense>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Home() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [ragLoading, setRagLoading] = useState(false)
  const [baselineLoading, setBaselineLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")
  const [isClient, setIsClient] = useState(false)
  const [searchTime, setSearchTime] = useState(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSearch = async () => {
    if (!query.trim()) return

    const startTime = Date.now()
    setLoading(true)
    setRagLoading(true)
    setBaselineLoading(true)
    setError("")
    setResult(null)
    setSearchTime(null)

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      setResult(data)
      setSearchTime(Date.now() - startTime)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRagLoading(false)
      setBaselineLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Neo4j RAG vs Baseline Comparison
          </h1>
          <p className="text-gray-600 text-lg">Compare Vector + Graph Traversal against LLM-only responses</p>
        </div>

        {/* Search Interface */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Ask about movies, actors, directors, or genres..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                size="lg"
                className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>

            {searchTime && (
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Search completed in {searchTime}ms</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-red-600 font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {(result || loading) && (
          <div className="space-y-6">
            {/* RAG Section */}
            <Suspense fallback={<RAGLoader />}>
              <RAGSection result={result} loading={ragLoading} />
            </Suspense>

            {/* Baseline Section */}
            <Suspense fallback={<BaselineLoader />}>
              <BaselineSection result={result} loading={baselineLoading} />
            </Suspense>

            {/* Graph Section */}
            {(result?.graph || loading) && (
              <Suspense fallback={<GraphLoader />}>
                <GraphSection result={result} isClient={isClient} />
              </Suspense>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
