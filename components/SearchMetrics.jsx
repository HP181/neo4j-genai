"use client";

import { BarChart, Info, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

const SearchMetrics = ({ metrics, isExpanded, onToggleExpand }) => {
  if (!metrics) return null;

  return (
    <Card className="mb-4 border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-md flex justify-between">
          <div className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-purple-600" />
            <span>Search Metrics</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="p-1"
          >
            {isExpanded ? (
              <X className="w-4 h-4" />
            ) : (
              <Info className="w-4 h-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-700 font-medium">
                Query Time
              </div>
              <div className="text-lg font-bold">{metrics.queryTime}ms</div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-700 font-medium">
                Vector Results
              </div>
              <div className="text-lg font-bold">
                {metrics.vectorCount || 0}
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-700 font-medium">
                Graph Results
              </div>
              <div className="text-lg font-bold">{metrics.graphCount || 0}</div>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg">
              <div className="text-sm text-amber-700 font-medium">
                Traversal Depth
              </div>
              <div className="text-lg font-bold">
                {metrics.traversalDepth || 1}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Weights</h4>
            <div className="flex gap-2">
              <div className="flex-1 bg-gradient-to-r from-blue-100 to-blue-200 rounded-md p-2">
                <div className="text-xs text-blue-700">Vector</div>
                <div className="text-sm font-medium">
                  {(metrics.weights?.vector || 0.6) * 100}%
                </div>
              </div>
              <div className="flex-1 bg-gradient-to-r from-green-100 to-green-200 rounded-md p-2">
                <div className="text-xs text-green-700">Graph</div>
                <div className="text-sm font-medium">
                  {(metrics.weights?.graph || 0.4) * 100}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default SearchMetrics;
