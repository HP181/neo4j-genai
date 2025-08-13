"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Network } from "lucide-react";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";
import { Button } from "./ui/button";
import { GraphLoader } from "@/app/loading";
import dynamic from "next/dynamic";

const GraphSection = ({ result, isClient }) => {

  const [graphConfig, setGraphConfig] = useState({
    nodeSize: 1,
    linkWidth: 1,
    chargeStrength: -120,
    highlightLinks: true,
    showLabels: true, // node labels
    showRelLabels: false, // relationship labels (always-visible)
    centerGraph: false,
  });

  // NEW: label filters
  const [nodeFilters, setNodeFilters] = useState({
    Movie: true,
    Actor: true,
    Director: true,
    Genre: true,
  });
  const [relFilters, setRelFilters] = useState({
    ACTED_IN: true,
    DIRECTED: true,
    IN_GENRE: true,
  });

  const graphRef = useRef(null);

  const handleNodeSizeChange = (value) => {
    setGraphConfig({ ...graphConfig, nodeSize: value[0] });
  };

  const handleLinkWidthChange = (value) => {
    setGraphConfig({ ...graphConfig, linkWidth: value[0] });
  };

  const handleChargeStrengthChange = (value) => {
    setGraphConfig({ ...graphConfig, chargeStrength: value[0] * -30 });
  };

  const handleCenterGraph = () => {
    if (graphRef.current) {
      graphRef.current.centerAt(0, 0, 1000);
      graphRef.current.zoom(1, 1000);
    }
  };

  // Color scheme for different node types
  const nodeColors = {
    Movie: "#4CAF50",
    Actor: "#9C27B0",
    Director: "#FF9800",
    Genre: "#2196F3",
    Info: "#AAAAAA",
  };

  // Build a filtered view based on label/relationship filters
  const filteredGraph = useMemo(() => {
    const g = result?.graph || { nodes: [], links: [] };
    if (!g.nodes || !g.links) return { nodes: [], links: [] };

    // 1) Filter nodes by label/type
    const allowedNodes = new Map();
    g.nodes.forEach((n) => {
      if (nodeFilters[n.type] !== false) {
        allowedNodes.set(n.id, n);
      }
    });

    // 2) Filter links by relationship AND node availability
    const allowedLinks = [];
    g.links.forEach((l) => {
      const label = l.label || "";
      if (relFilters[label] === false) return;

      const sId = typeof l.source === "object" ? l.source.id : l.source;
      const tId = typeof l.target === "object" ? l.target.id : l.target;
      if (!allowedNodes.has(sId) || !allowedNodes.has(tId)) return;

      allowedLinks.push(l);
    });

    // 3) Keep only nodes that are connected OR are Movie nodes (so isolated Movies still show)
    const connected = new Set();
    allowedLinks.forEach((l) => {
      const sId = typeof l.source === "object" ? l.source.id : l.source;
      const tId = typeof l.target === "object" ? l.target.id : l.target;
      connected.add(sId);
      connected.add(tId);
    });
    const nodes = [...allowedNodes.values()].filter(
      (n) => connected.has(n.id) || n.type === "Movie"
    );

    return { nodes, links: allowedLinks };
  }, [result?.graph, nodeFilters, relFilters]);

  if (!isClient) return <GraphLoader />;
  if (!result?.graph || filteredGraph.nodes.length === 0) {
    return (
      <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              Retrieved Knowledge Graph
            </h2>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Interactive
            </Badge>
          </div>
          <div className="h-[200px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center">
              <p className="text-gray-500 font-medium">
                No graph data with current filters
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Try enabling more labels or relationships
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderGraph = () => {

    const ForceGraph2D = dynamic(
  () => import("react-force-graph").then((mod) => mod.ForceGraph2D),
  {
    ssr: false,
    loading: () => <GraphLoader />,
  }
);


    try {
      const graphData = {
        nodes: Array.isArray(filteredGraph.nodes) ? filteredGraph.nodes : [],
        links: Array.isArray(filteredGraph.links) ? filteredGraph.links : [],
      };

      // Ensure links have valid endpoints
      graphData.links = graphData.links.filter((link) => {
        return (
          (typeof link.source === "string" ||
            typeof link.source === "object") &&
          (typeof link.target === "string" || typeof link.target === "object")
        );
      });

      return (
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeAutoColorBy="type"
          nodeColor={(node) => nodeColors[node.type] || "#999"}
          nodeVal={(node) => (node.size || 10) * graphConfig.nodeSize}
          linkWidth={(link) => (link.width || 1) * graphConfig.linkWidth}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          linkLabel={(link) => link.label + (link.role ? `: ${link.role}` : "")}
          nodeLabel={(node) =>
            `${node.type}: ${node.name} ${node.year ? `(${node.year})` : ""} ${node.rating ? `[Rating: ${node.rating}]` : ""}`
          }
          cooldownTicks={100}
          backgroundColor="#f8fafc"
          linkColor={() => "#999"}
          linkDirectionalParticles={graphConfig.highlightLinks ? 2 : 0}
          linkDirectionalParticleWidth={2}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          d3Force="charge"
          d3ForceCharge={graphConfig.chargeStrength}
          onNodeClick={(node) => {
            const highlightNodes = new Set();
            const highlightLinks = new Set();

            graphData.links.forEach((link) => {
              const sourceId =
                typeof link.source === "object" ? link.source.id : link.source;
              const targetId =
                typeof link.target === "object" ? link.target.id : link.target;
              if (sourceId === node.id || targetId === node.id) {
                highlightLinks.add(link);
                graphData.nodes.forEach((n) => {
                  if (n.id === sourceId || n.id === targetId)
                    highlightNodes.add(n);
                });
              }
            });

            graphRef.current.nodeColor((n) =>
              highlightNodes.has(n)
                ? nodeColors[n.type] || "#999"
                : "rgba(200,200,200,0.3)"
            );
            graphRef.current.linkColor((link) =>
              highlightLinks.has(link) ? "#666" : "rgba(200,200,200,0.2)"
            );
          }}
          onBackgroundClick={() => {
            graphRef.current.nodeColor(
              (node) => nodeColors[node.type] || "#999"
            );
            graphRef.current.linkColor(() => "#999");
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            if (!graphConfig.showLabels && globalScale < 1.5) {
              // draw node only
              ctx.fillStyle = nodeColors[node.type] || "#999";
              ctx.beginPath();
              ctx.arc(
                node.x,
                node.y,
                ((node.size || 10) * graphConfig.nodeSize) / 2,
                0,
                2 * Math.PI
              );
              ctx.fill();
              return;
            }

            // draw node
            ctx.fillStyle = nodeColors[node.type] || "#999";
            ctx.beginPath();
            ctx.arc(
              node.x,
              node.y,
              ((node.size || 10) * graphConfig.nodeSize) / 2,
              0,
              2 * Math.PI
            );
            ctx.fill();

            // draw label
            const label = `${node.type}: ${node.name}`;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(
              (n) => n + fontSize * 0.2
            );
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
          }}
          // NEW: always-visible relationship labels (when enabled)
          linkCanvasObjectMode={() =>
            graphConfig.showRelLabels ? "after" : undefined
          }
          linkCanvasObject={(link, ctx, globalScale) => {
            if (!graphConfig.showRelLabels) return;
            const label = link.label || "";
            if (!label) return;

            const start = typeof link.source === "object" ? link.source : null;
            const end = typeof link.target === "object" ? link.target : null;
            if (!start || !end) return;

            const textPos = {
              x: (start.x + end.x) / 2,
              y: (start.y + end.y) / 2,
            };
            const fontSize = 10 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(
              (n) => n + fontSize * 0.2
            );

            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.fillRect(
              textPos.x - bckgDimensions[0] / 2,
              textPos.y - bckgDimensions[1] / 2,
              bckgDimensions[0],
              bckgDimensions[1]
            );
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#333";
            ctx.fillText(label, textPos.x, textPos.y);
          }}
        />
      );
    } catch (err) {
      console.error("Error rendering graph:", err);
      return (
        <div className="h-[500px] flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-600">
            Error rendering graph. Please try again.
          </p>
        </div>
      );
    }
  };

  // Small pill button component
  const Pill = ({ active, onClick, children }) => (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      className={`h-8 px-3 ${active ? "" : "bg-white"}`}
      onClick={onClick}
    >
      {children}
    </Button>
  );

  return (
    <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Network className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-800">
            Retrieved Knowledge Graph
          </h2>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Interactive
          </Badge>
        </div>

        {/* NEW: Filters */}
        <div className="mb-3 grid gap-3 md:grid-cols-2">
          <div className="bg-green-50 p-3 rounded-md border border-green-100">
            <div className="text-xs font-semibold text-green-800 mb-2">
              Node Labels
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(nodeFilters).map((type) => (
                <Pill
                  key={type}
                  active={nodeFilters[type]}
                  onClick={() =>
                    setNodeFilters({
                      ...nodeFilters,
                      [type]: !nodeFilters[type],
                    })
                  }
                >
                  {type}
                </Pill>
              ))}
            </div>
          </div>

          <div className="bg-sky-50 p-3 rounded-md border border-sky-100">
            <div className="text-xs font-semibold text-sky-800 mb-2">
              Relationship Types
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(relFilters).map((rt) => (
                <Pill
                  key={rt}
                  active={relFilters[rt]}
                  onClick={() =>
                    setRelFilters({ ...relFilters, [rt]: !relFilters[rt] })
                  }
                >
                  {rt}
                </Pill>
              ))}
            </div>
          </div>
        </div>

        {/* Existing controls */}
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
          <div className="flex items-end flex-wrap gap-4">
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={handleCenterGraph}
            >
              Center Graph
            </Button>

            <Button
              size="sm"
              variant={graphConfig.showLabels ? "default" : "outline"}
              className="h-8 px-2"
              onClick={() =>
                setGraphConfig({
                  ...graphConfig,
                  showLabels: !graphConfig.showLabels,
                })
              }
            >
              Node Labels
            </Button>

            <Button
              size="sm"
              variant={graphConfig.showRelLabels ? "default" : "outline"}
              className="h-8 px-2"
              onClick={() =>
                setGraphConfig({
                  ...graphConfig,
                  showRelLabels: !graphConfig.showRelLabels,
                })
              }
            >
              Rel Labels
            </Button>

            {/* Flow particles */}
            <Button
              size="sm"
              variant={graphConfig.highlightLinks ? "default" : "outline"}
              className="h-8 px-2"
              onClick={() =>
                setGraphConfig({
                  ...graphConfig,
                  highlightLinks: !graphConfig.highlightLinks,
                })
              }
            >
              Flow
            </Button>
          </div>
        </div>

        <div className="h-[500px] relative rounded-lg overflow-hidden border border-gray-200 shadow-inner">
          <Suspense fallback={<GraphLoader />}>{renderGraph()}</Suspense>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="flex gap-4 text-xs">
            {Object.entries(nodeColors)
              .filter(([type]) => type !== "Info")
              .map(([type, color]) => (
                <div key={type} className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span>{type}</span>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


export default GraphSection