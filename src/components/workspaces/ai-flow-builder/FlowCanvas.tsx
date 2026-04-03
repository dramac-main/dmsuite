"use client";

// =============================================================================
// DMSuite — AI Flow Builder — Flow Canvas
// ReactFlow-based visual canvas with drag-drop, connections, minimap.
// =============================================================================

import React, { useCallback, useRef, useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type Node,
  type Edge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type IsValidConnection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import FlowNodeComponent from "./FlowNode";
import { useAIFlowBuilderEditor, type FlowNode, type FlowEdge } from "@/stores/ai-flow-builder-editor";
import { getNodeDefinition } from "@/lib/ai-flow-builder/node-registry";
import { PORT_COLORS } from "@/types/flow-builder";
import type { PortDataType } from "@/types/flow-builder";

const nodeTypes = {
  flowNode: FlowNodeComponent,
};

export default function FlowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodes = useAIFlowBuilderEditor((s) => s.form.nodes);
  const edges = useAIFlowBuilderEditor((s) => s.form.edges);
  const setNodes = useAIFlowBuilderEditor((s) => s.setNodes);
  const setEdges = useAIFlowBuilderEditor((s) => s.setEdges);
  const addEdge = useAIFlowBuilderEditor((s) => s.addEdge);
  const addNode = useAIFlowBuilderEditor((s) => s.addNode);
  const selectNode = useAIFlowBuilderEditor((s) => s.selectNode);
  const setViewport = useAIFlowBuilderEditor((s) => s.setViewport);

  // Convert store nodes/edges to ReactFlow format
  const rfNodes: Node[] = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
        selected: false,
      })),
    [nodes]
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        animated: e.animated ?? false,
        style: { stroke: "#6b7280", strokeWidth: 2 },
      })),
    [edges]
  );

  // Handle node changes (position, selection, removal)
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const updated = applyNodeChanges(changes, rfNodes);
      setNodes(
        updated.map((n) => ({
          id: n.id,
          type: n.type || "flowNode",
          position: n.position,
          data: n.data as FlowNode["data"],
        }))
      );

      // Track selection
      for (const change of changes) {
        if (change.type === "select") {
          if (change.selected) {
            selectNode(change.id);
          }
        }
      }
    },
    [rfNodes, setNodes, selectNode]
  );

  // Handle edge changes
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const updated = applyEdgeChanges(changes, rfEdges) as unknown as FlowEdge[];
      setEdges(
        updated.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle ?? "",
          targetHandle: e.targetHandle ?? "",
          animated: e.animated,
        }))
      );
    },
    [rfEdges, setEdges]
  );

  // Handle new connections
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target && connection.sourceHandle && connection.targetHandle) {
        addEdge({
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
        });

        // Fire dirty event
        window.dispatchEvent(new CustomEvent("workspace:dirty"));
      }
    },
    [addEdge]
  );

  // Validate connections — allow compatible port types (Langflow-style flexibility)
  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return false;
      if (connection.source === connection.target) return false;

      // Find source and target nodes
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return false;

      // Find port data types
      const sourcePort = sourceNode.data.outputs.find(
        (p) => p.id === connection.sourceHandle
      );
      const targetPort = targetNode.data.inputs.find(
        (p) => p.id === connection.targetHandle
      );
      if (!sourcePort || !targetPort) return false;

      // "any" type accepts anything
      if (sourcePort.dataType === "any" || targetPort.dataType === "any") return true;

      // Exact type match
      if (sourcePort.dataType === targetPort.dataType) return true;

      // Allow implicit conversions between text-like types (message ↔ data)
      const textLikeTypes = new Set(["message", "data"]);
      if (textLikeTypes.has(sourcePort.dataType) && textLikeTypes.has(targetPort.dataType)) return true;

      return false;
    },
    [nodes]
  );

  // Handle drag-drop from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/flow-node-type");
      if (!type) return;

      const def = getNodeDefinition(type);
      if (!def) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
      window.dispatchEvent(new CustomEvent("workspace:dirty"));
    },
    [screenToFlowPosition, addNode]
  );

  // Click on canvas background deselects
  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Viewport tracking
  const onMoveEnd = useCallback(
    (_event: unknown, viewport: { x: number; y: number; zoom: number }) => {
      setViewport(viewport);
    },
    [setViewport]
  );

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onPaneClick={onPaneClick}
        onMoveEnd={onMoveEnd}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          style: { stroke: "#6b7280", strokeWidth: 2 },
          type: "smoothstep",
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#374151"
        />
        <Controls
          showInteractive={false}
          className="!bg-gray-800 !border-gray-700 !rounded-lg !shadow-lg [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button]:!text-gray-400 [&>button:hover]:!bg-gray-700 [&>button:hover]:!text-gray-200"
        />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as unknown as { color?: string };
            return data?.color ?? "#6b7280";
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
          className="!bg-gray-900 !border-gray-700 !rounded-lg"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
