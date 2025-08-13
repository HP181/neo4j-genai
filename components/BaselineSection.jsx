import { BaselineLoader } from "@/app/loading";
import React from "react";
import { Card, CardContent } from "./ui/card";
import { Database } from "lucide-react";
import { Badge } from "./ui/badge";
import ReactMarkdown from "react-markdown";

const BaselineSection = ({ result, loading }) => {
  if (loading) return <BaselineLoader />;

  return (
    <Card className="mb-6 border-l-4 border-l-gray-400 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">
            LLM-only Baseline Answer
          </h2>
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            No Context
          </Badge>
        </div>

        <div className="bg-gradient-to-r from-white to-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm prose max-w-full">
          <ReactMarkdown>{result?.baseline?.answer || ""}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
};

export default BaselineSection;
