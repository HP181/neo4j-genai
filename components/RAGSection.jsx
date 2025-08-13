import React from "react";
import MovieCard from "./MovieCard";
import { RAGLoader } from "@/app/loading";
import { Card, CardContent } from "./ui/card";
import { AlertTriangle, Database, Sparkles } from "lucide-react";
import { Badge } from "./ui/badge";
import ReactMarkdown from "react-markdown";

const RAGSection = ({ result, loading }) => {
  if (loading) return <RAGLoader />;

  const ragAnswer = result?.rag?.answer || "";
  const isUnavailable =
    typeof ragAnswer === "string" &&
    ragAnswer.toLowerCase().includes("not available in the movie dataset");

  return (
    <Card className="mb-6 border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">
            Neo4j-assisted RAG Answer
          </h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Vector + Graph
          </Badge>
        </div>

        {isUnavailable && (
          <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <span>
              This question appears to be outside the movie dataset or not
              present in the retrieved context. No graph or results are shown.
            </span>
          </div>
        )}

        <div className="mb-6 bg-gradient-to-r from-white to-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm prose max-w-full">
          <ReactMarkdown>{ragAnswer}</ReactMarkdown>
        </div>

        {!isUnavailable &&
          result?.rag?.movies &&
          result.rag.movies.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Retrieved Movies & Context
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {result.rag.movies.map((movie, idx) => (
                  <MovieCard key={idx} movie={movie} />
                ))}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
};

export default RAGSection;
