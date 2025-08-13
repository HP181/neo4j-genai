"use client";

import { Award, Film, Globe, Languages, Play, Tag, User } from "lucide-react";
import { useState } from "react";
import { Badge } from "./ui/badge";

const MovieCard = ({ movie }) => {
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (value) => {
    if (value == null) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const safeNumber = (value) => {
    if (
      value &&
      typeof value === "object" &&
      "low" in value &&
      "high" in value
    ) {
      return value.low;
    }
    return typeof value === "number" ? value : null;
  };

  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 transition-all duration-300 hover:shadow-lg">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 flex items-center gap-1">
          <Film className="w-4 h-4 text-blue-600" />
          {movie.title}
        </h4>
        <Badge variant="outline" className="text-xs">
          {movie.released || movie.year || "—"}
        </Badge>
      </div>

      {movie.tagline && (
        <p className="text-sm text-gray-600 mb-3 italic">"{movie.tagline}"</p>
      )}

      {movie.score != null && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Relevance Score</span>
            <span>
              {Math.min(Number(movie.score) * 100 || 0, 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(Number(movie.score) * 100 || 0, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2 text-xs text-gray-600 mb-3">
        {movie.genres?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {movie.genres.map((genre, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="bg-indigo-50 text-indigo-700 text-xs"
              >
                {genre}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1">
          <Award className="w-3 h-3 text-amber-500" />
          <span className="font-medium">Rating:</span>
          <span>
            {safeNumber(movie.imdbRating)
              ? `${safeNumber(movie.imdbRating)}/10`
              : "N/A"}
          </span>
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
        {expanded ? "Show less" : "Show more details"}
      </div>

      {expanded && (
        <div className="space-y-3 pt-2 border-t border-blue-100">
          {(movie.budget != null || movie.revenue != null) && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs">
                <Tag className="w-3 h-3 text-green-600" />
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
  );
};

export default MovieCard;
