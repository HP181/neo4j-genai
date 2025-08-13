"use client";

import { useState, useEffect, Suspense, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RAGLoader, BaselineLoader, GraphLoader } from "./loading";
import { Search, Sparkles, Database, Network, Clock } from "lucide-react";
import BaselineSection from "@/components/BaselineSection";
import GraphSection from "@/components/GraphSection";
import RAGSection from "@/components/RAGSection";
import SearchMetrics from "@/components/SearchMetrics";

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [ragLoading, setRagLoading] = useState(false);
  const [baselineLoading, setBaselineLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [searchTime, setSearchTime] = useState(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [activeTab, setActiveTab] = useState("rag");
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    setIsClient(true);
    const history = localStorage.getItem("searchHistory");
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        console.error("Error loading search history:", e);
      }
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    const startTime = Date.now();
    setLoading(true);
    setRagLoading(true);
    setBaselineLoading(true);
    setError("");
    setResult(null);
    setSearchTime(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data);
      setSearchTime(Date.now() - startTime);

      const newHistory = [
        query,
        ...searchHistory.filter((q) => q !== query),
      ].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));

      setShowMetrics(true);

      // If backend cleared graph & movies because query is out-of-dataset, auto-switch to RAG tab
      const isUnavailable =
        typeof data?.rag?.answer === "string" &&
        data.rag.answer
          .toLowerCase()
          .includes("not available in the movie dataset");
      const hasGraph =
        !!data?.graph &&
        Array.isArray(data.graph.nodes) &&
        data.graph.nodes.length > 0;
      if (isUnavailable || !hasGraph) setActiveTab("rag");
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRagLoading(false);
      setBaselineLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSuggestedQuery = (q) => {
    setQuery(q);
    setTimeout(() => handleSearch(), 100);
  };

  const handleHistoryQuery = (q) => {
    setQuery(q);
    setTimeout(() => handleSearch(), 100);
  };

  const ragAnswerStr = result?.rag?.answer || "";
  const isUnavailable =
    typeof ragAnswerStr === "string" &&
    ragAnswerStr.toLowerCase().includes("not available in the movie dataset");
  const hasGraph =
    !!result?.graph &&
    Array.isArray(result.graph.nodes) &&
    result.graph.nodes.length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Neo4j RAG vs Baseline Comparison
          </h1>
          <p className="text-gray-600 text-lg">
            Compare Vector + Graph Traversal against LLM-only responses
          </p>
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
              {searchHistory.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    Recent searches:
                  </div>
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
              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Try these examples:
                </div>
                <div className="flex flex-wrap gap-2 w-full">
                  {[
                    "Action movies with Tom Cruise after 2010",
                    "Best sci-fi films of the 90s",
                    "Movies directed by Christopher Nolan with Leonardo DiCaprio",
                    "Find romantic comedies with high ratings",
                    "Who directed Inception and what other movies did they make?",
                  ].map((q, i) => (
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
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
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
                <TabsTrigger
                  value="graph"
                  className="text-sm"
                  disabled={isUnavailable || !hasGraph}
                >
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4" />
                    <span>Knowledge Graph</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="rag">
                <Suspense fallback={<RAGLoader />}>
                  <RAGSection result={result} loading={ragLoading} />
                </Suspense>
              </TabsContent>

              <TabsContent value="baseline">
                <Suspense fallback={<BaselineLoader />}>
                  <BaselineSection result={result} loading={baselineLoading} />
                </Suspense>
              </TabsContent>

              <TabsContent value="graph">
                <Suspense fallback={<GraphLoader />}>
                  <GraphSection result={result} isClient={isClient} />
                </Suspense>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </main>
  );
}
