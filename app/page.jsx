"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import dynamic from "next/dynamic"
import { RAGLoader, BaselineLoader, GraphLoader } from "./loading"
import { 
  Search, Sparkles, Database, Network, Clock, Info, 
  BarChart, Filter, Sliders, Award, Film, User, Tag,
  Calendar, DollarSign, Play, Globe, Languages, X
} from "lucide-react"
import ReactMarkdown from 'react-markdown';

// Dynamic import of ForceGraph2D with custom config
const ForceGraph2D = dynamic(() => import("react-force-graph").then((mod) => mod.ForceGraph2D), {
  ssr: false,
  loading: () => <GraphLoader />,
})

// New component for displaying search metrics
const SearchMetrics = ({ metrics, isExpanded, onToggleExpand }) => {
  if (!metrics) return null
  
  return (
    <Card className="mb-4 border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-md flex justify-between">
          <div className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-purple-600" />
            <span>Search Metrics</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggleExpand} className="p-1">
            {isExpanded ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-700 font-medium">Query Time</div>
              <div className="text-lg font-bold">{metrics.queryTime}ms</div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-700 font-medium">Vector Results</div>
              <div className="text-lg font-bold">{metrics.vectorCount || 0}</div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-700 font-medium">Graph Results</div>
              <div className="text-lg font-bold">{metrics.graphCount || 0}</div>
            </div>
            
            <div className="bg-amber-50 p-3 rounded-lg">
              <div className="text-sm text-amber-700 font-medium">Traversal Depth</div>
              <div className="text-lg font-bold">{metrics.traversalDepth || 1}</div>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Weights</h4>
            <div className="flex gap-2">
              <div className="flex-1 bg-gradient-to-r from-blue-100 to-blue-200 rounded-md p-2">
                <div className="text-xs text-blue-700">Vector</div>
                <div className="text-sm font-medium">{(metrics.weights?.vector || 0.6) * 100}%</div>
              </div>
              <div className="flex-1 bg-gradient-to-r from-green-100 to-green-200 rounded-md p-2">
                <div className="text-xs text-green-700">Graph</div>
                <div className="text-sm font-medium">{(metrics.weights?.graph || 0.4) * 100}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Enhanced movie card with richer metadata display
const MovieCard = ({ movie, index }) => {
  const [expanded, setExpanded] = useState(false)
  
  // Format the revenue and budget with commas
  const formatCurrency = (value) => {
    if (value == null) return 'N/A'
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value)
  }

  // Safe number check
  const safeNumber = (value) => {
    if (value && typeof value === 'object' && 'low' in value && 'high' in value) {
      return value.low
    }
    return typeof value === 'number' ? value : null
  }
  
  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 transition-all duration-300 hover:shadow-lg">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 flex items-center gap-1">
          <Film className="w-4 h-4 text-blue-600" />
          {movie.title}
        </h4>
        <Badge variant="outline" className="text-xs">
          {movie.released || movie.year}
        </Badge>
      </div>
      
      {movie.tagline && (
        <p className="text-sm text-gray-600 mb-3 italic">"{movie.tagline}"</p>
      )}
      
      {movie.score && (
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Relevance Score</span>
          {/* Cap the display percentage at 100% */}
          <span>{Math.min((safeNumber(movie.score) * 100), 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(safeNumber(movie.score) * 100, 100)}%` }}
          ></div>
        </div>
      </div>
)}
      
      <div className="space-y-2 text-xs text-gray-600 mb-3">
        {movie.genres?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {movie.genres.map((genre, idx) => (
              <Badge key={idx} variant="secondary" className="bg-indigo-50 text-indigo-700 text-xs">
                {genre}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <Award className="w-3 h-3 text-amber-500" />
          <span className="font-medium">Rating:</span> 
          <span>{safeNumber(movie.imdbRating) ? `${safeNumber(movie.imdbRating)}/10` : 'N/A'}</span>
        </div>
        
        {movie.runtime && (
          <div className="flex items-center gap-1">
            <Play className="w-3 h-3 text-green-600" />
            <span className="font-medium">Runtime:</span> 
            <span>{safeNumber(movie.runtime)} min</span>
          </div>
        )}
      </div>
      
      <div 
        className="text-blue-600 text-xs cursor-pointer font-medium flex items-center mb-2"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'Show less' : 'Show more details'}
      </div>
      
      {expanded && (
        <div className="space-y-3 pt-2 border-t border-blue-100">
          {(movie.budget != null || movie.revenue != null) && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs">
                <DollarSign className="w-3 h-3 text-green-600" />
                <span className="font-medium">Financial:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pl-2">
                <div>Budget: {formatCurrency(safeNumber(movie.budget))}</div>
                <div>Revenue: {formatCurrency(safeNumber(movie.revenue))}</div>
              </div>
            </div>
          )}
          
          {movie.actors?.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs">
                <User className="w-3 h-3 text-blue-600" />
                <span className="font-medium">Cast:</span>
              </div>
              <div className="text-xs pl-2">{movie.actors.join(", ")}</div>
            </div>
          )}
          
          {movie.directors?.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs">
                <Tag className="w-3 h-3 text-purple-600" />
                <span className="font-medium">Directors:</span>
              </div>
              <div className="text-xs pl-2">{movie.directors.join(", ")}</div>
            </div>
          )}
          
          {movie.countries && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs">
                <Globe className="w-3 h-3 text-cyan-600" />
                <span className="font-medium">Countries:</span>
              </div>
              <div className="text-xs pl-2">{movie.countries}</div>
            </div>
          )}
          
          {movie.languages && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs">
                <Languages className="w-3 h-3 text-amber-600" />
                <span className="font-medium">Languages:</span>
              </div>
              <div className="text-xs pl-2">{movie.languages}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Enhanced RAG section with more detailed movie information
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
        
        <div className="mb-6 bg-gradient-to-r from-white to-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm prose max-w-full">
          {/* <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{result.rag.answer}</p> */}
          <ReactMarkdown>{result.rag.answer}</ReactMarkdown>
        </div>

        {result.rag.movies && result.rag.movies.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Retrieved Movies & Context
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {result.rag.movies.map((movie, idx) => (
                <MovieCard key={idx} movie={movie} index={idx} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Enhanced baseline section with formatting
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
        
        <div className="bg-gradient-to-r from-white to-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm prose max-w-full">
          {/* <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{result.baseline.answer}</p> */}
          <ReactMarkdown>{result.baseline.answer}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced graph section with more interactivity
const GraphSection = ({ result, isClient }) => {
  const [graphConfig, setGraphConfig] = useState({
    nodeSize: 1,
    linkWidth: 1,
    chargeStrength: -120,
    highlightLinks: true,
    showLabels: true,
    centerGraph: false
  })
  
  const graphRef = useRef(null)
  
  const handleNodeSizeChange = (value) => {
    setGraphConfig({ ...graphConfig, nodeSize: value[0] })
  }
  
  const handleLinkWidthChange = (value) => {
    setGraphConfig({ ...graphConfig, linkWidth: value[0] })
  }
  
  const handleChargeStrengthChange = (value) => {
    setGraphConfig({ ...graphConfig, chargeStrength: value[0] * -30 })
  }
  
  const handleCenterGraph = () => {
    if (graphRef.current) {
      graphRef.current.centerAt(0, 0, 1000)
      graphRef.current.zoom(1, 1000)
    }
  }
  
  // Color scheme for different node types
  const nodeColors = {
    Movie: "#4CAF50",
    Actor: "#9C27B0",
    Director: "#FF9800",
    Genre: "#2196F3",
    Info: "#AAAAAA"
  }
  
  if (!result?.graph || !isClient) return <GraphLoader />

  // Debug the graph data
  console.log("Graph data:", result.graph);
  
  const renderGraph = () => {
    try {
      // Handle empty or invalid graph data
      if (!result.graph.nodes || !result.graph.links) {
        console.warn("Invalid graph data:", result.graph);
        return (
          <div className="h-[500px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center">
              <p className="text-gray-500 font-medium">No graph data available</p>
              <p className="text-gray-400 text-sm mt-2">Try a different query</p>
            </div>
          </div>
        );
      }
      
      // Fix graph data if needed
      const graphData = {
        nodes: Array.isArray(result.graph.nodes) ? result.graph.nodes : [],
        links: Array.isArray(result.graph.links) ? result.graph.links : []
      };
      
      // Ensure all links have valid source and target
      graphData.links = graphData.links.filter(link => {
        return (
          typeof link.source === 'string' || typeof link.source === 'object' ||
          typeof link.target === 'string' || typeof link.target === 'object'
        );
      });
      
      return (
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeAutoColorBy="type"
          nodeColor={node => nodeColors[node.type] || "#999"}
          nodeVal={node => (node.size || 10) * graphConfig.nodeSize}
          linkWidth={link => (link.width || 1) * graphConfig.linkWidth}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          linkLabel={link => link.label + (link.role ? `: ${link.role}` : '')}
          nodeLabel={node => `${node.type}: ${node.name} ${node.year ? `(${node.year})` : ''} ${node.rating ? `[Rating: ${node.rating}]` : ''}`}
          cooldownTicks={100}
          backgroundColor="#f8fafc"
          linkColor={() => "#999"}
          linkDirectionalParticles={graphConfig.highlightLinks ? 2 : 0}
          linkDirectionalParticleWidth={2}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          d3Force="charge"
          d3ForceCharge={graphConfig.chargeStrength}
          onNodeClick={node => {
            // Highlight connected nodes and links when a node is clicked
            const highlightNodes = new Set();
            const highlightLinks = new Set();
            
            if (graphData.links) {
              graphData.links.forEach(link => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                
                if (sourceId === node.id || targetId === node.id) {
                  highlightLinks.add(link);
                  graphData.nodes.forEach(n => {
                    if (n.id === sourceId || n.id === targetId) {
                      highlightNodes.add(n);
                    }
                  });
                }
              });
            }
            
            // Update visualization
            graphRef.current.nodeColor(n => 
              highlightNodes.has(n) 
                ? nodeColors[n.type] || "#999" 
                : 'rgba(200,200,200,0.3)'
            );
            
            graphRef.current.linkColor(link => 
              highlightLinks.has(link) 
                ? '#666' 
                : 'rgba(200,200,200,0.2)'
            );
          }}
          onBackgroundClick={() => {
            // Reset highlighting
            graphRef.current.nodeColor(node => nodeColors[node.type] || "#999");
            graphRef.current.linkColor(() => "#999");
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            if (!graphConfig.showLabels && globalScale < 1.5) return;
            
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map((n) => n + fontSize * 0.2);

            // Draw node
            ctx.fillStyle = nodeColors[node.type] || "#999";
            ctx.beginPath();
            ctx.arc(node.x, node.y, (node.size || 10) * graphConfig.nodeSize / 2, 0, 2 * Math.PI);
            ctx.fill();

            // Draw text with background (only if showLabels is true)
            if (graphConfig.showLabels) {
              ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
              ctx.fillRect(
                node.x - bckgDimensions[0] / 2,
                node.y - bckgDimensions[1] / 2,
                bckgDimensions[0],
                bckgDimensions[1]
              );
              ctx.fillStyle = "black";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(label, node.x, node.y);
            }
          }}
        />
      );
    } catch (err) {
      console.error("Error rendering graph:", err);
      return (
        <div className="h-[500px] flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-600">Error rendering graph. Please try again.</p>
        </div>
      );
    }
  };

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
        
        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-700">Node Size</label>
            <Slider 
              defaultValue={[1]} 
              max={3} 
              step={0.1} 
              min={0.5}
              onValueChange={handleNodeSizeChange}
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-gray-700">Link Width</label>
            <Slider 
              defaultValue={[1]} 
              max={3} 
              step={0.1} 
              min={0.5}
              onValueChange={handleLinkWidthChange}
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-gray-700">Force Strength</label>
            <Slider 
              defaultValue={[4]} 
              max={10} 
              step={1} 
              min={1}
              onValueChange={handleChargeStrengthChange}
            />
          </div>
          
          <div className="flex items-end gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8"
              onClick={handleCenterGraph}
            >
              Center Graph
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={graphConfig.showLabels ? "default" : "outline"}
                    className="h-8 px-2"
                    onClick={() => setGraphConfig({...graphConfig, showLabels: !graphConfig.showLabels})}
                  >
                    Labels
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle node labels</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={graphConfig.highlightLinks ? "default" : "outline"}
                    className="h-8 px-2"
                    onClick={() => setGraphConfig({...graphConfig, highlightLinks: !graphConfig.highlightLinks})}
                  >
                    Flow
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show link direction flow</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="h-[500px] relative rounded-lg overflow-hidden border border-gray-200 shadow-inner">
          <Suspense fallback={<GraphLoader />}>{renderGraph()}</Suspense>
        </div>
        
        <div className="mt-4 flex justify-center">
          <div className="flex gap-4 text-xs">
            {Object.entries(nodeColors).filter(([type]) => type !== 'Info').map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span>{type}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Home() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [ragLoading, setRagLoading] = useState(false)
  const [baselineLoading, setBaselineLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")
  const [isClient, setIsClient] = useState(false)
  const [searchTime, setSearchTime] = useState(null)
  const [showMetrics, setShowMetrics] = useState(false)
  const [activeTab, setActiveTab] = useState("rag")
  
  // Search history
  const [searchHistory, setSearchHistory] = useState([])
  
  // Suggested queries for demo
  const suggestedQueries = [
    "Action movies with Tom Cruise after 2010",
    "Best sci-fi films of the 90s",
    "Movies directed by Christopher Nolan with Leonardo DiCaprio",
    "Find romantic comedies with high ratings",
    "Who directed Inception and what other movies did they make?"
  ]

  useEffect(() => {
    setIsClient(true)
    
    // Load search history from localStorage
    const history = localStorage.getItem('searchHistory')
    if (history) {
      try {
        setSearchHistory(JSON.parse(history))
      } catch (e) {
        console.error("Error loading search history:", e)
      }
    }
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

      console.log("API response:", data);
      setResult(data)
      setSearchTime(Date.now() - startTime)
      
      // Add to search history
      const newHistory = [query, ...searchHistory.filter(q => q !== query)].slice(0, 5)
      setSearchHistory(newHistory)
      localStorage.setItem('searchHistory', JSON.stringify(newHistory))
      
      // Show metrics by default
      setShowMetrics(true)
    } catch (err) {
      console.error("Search error:", err);
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
  
  const handleSuggestedQuery = (q) => {
    setQuery(q)
    setTimeout(() => handleSearch(), 100)
  }
  
  const handleHistoryQuery = (q) => {
    setQuery(q)
    setTimeout(() => handleSearch(), 100)
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
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
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
            
        {/* Suggested queries and history */}
<div className="mt-4 flex flex-col gap-2">
  {/* Search history */}
  {searchHistory.length > 0 && (
    <div>
      <div className="text-xs text-gray-500 mb-1">Recent searches:</div>
      <div className="flex flex-wrap gap-2 w-full">
        {searchHistory.map((q, i) => (
          <Button 
            key={`history-${i}`} 
            variant="outline" 
            size="sm"
            onClick={() => handleHistoryQuery(q)}
            className="text-xs py-1 h-auto truncate max-w-full sm:max-w-[180px] md:max-w-[200px]"
          >
            <span className="truncate">{q}</span>
          </Button>
        ))}
      </div>
    </div>
  )}
  
  {/* Suggested queries */}
  <div>
    <div className="text-xs text-gray-500 mb-1">Try these examples:</div>
    <div className="flex flex-wrap gap-2 w-full">
      {suggestedQueries.map((q, i) => (
        <Button 
          key={`suggestion-${i}`} 
          variant="secondary" 
          size="sm"
          onClick={() => handleSuggestedQuery(q)}
          className="text-xs py-1 h-auto bg-blue-50 text-blue-700 hover:bg-blue-100 truncate max-w-full sm:max-w-[180px] md:max-w-[220px]"
        >
          <span className="truncate">{q}</span>
        </Button>
      ))}
    </div>
  </div>
</div>
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
        
        {/* Search Metrics */}
        {result?.metrics && (
          <SearchMetrics 
            metrics={result.metrics} 
            isExpanded={showMetrics}
            onToggleExpand={() => setShowMetrics(!showMetrics)} 
          />
        )}

        {/* Results */}
        {(result || loading) && (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="rag" className="text-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Neo4j RAG</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="baseline" className="text-sm">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <span>Baseline LLM</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="graph" className="text-sm">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4" />
                    <span>Knowledge Graph</span>
                  </div>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="rag">
                {/* RAG Section */}
                <Suspense fallback={<RAGLoader />}>
                  <RAGSection result={result} loading={ragLoading} />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="baseline">
                {/* Baseline Section */}
                <Suspense fallback={<BaselineLoader />}>
                  <BaselineSection result={result} loading={baselineLoading} />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="graph">
                {/* Graph Section */}
                {(result?.graph || loading) && (
                  <Suspense fallback={<GraphLoader />}>
                    <GraphSection result={result} isClient={isClient} />
                  </Suspense>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </main>
  )
}