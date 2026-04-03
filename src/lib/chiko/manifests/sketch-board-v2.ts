import type {
  ChikoActionManifest,
  ChikoActionResult,
} from "@/stores/chiko-actions";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

/**
 * Chiko AI manifest for Sketch Board V2 (Excalidraw).
 * Exposes 20+ actions: read, create, modify, navigate, export.
 */
export function createSketchBoardV2Manifest(
  apiRef: React.RefObject<ExcalidrawImperativeAPI | null>
): ChikoActionManifest {
  return {
    toolId: "sketch-board-v2",
    toolName: "Sketch Board V2",
    actions: [
      // ── Info ──
      {
        name: "readCurrentState",
        description:
          "Read the current state: element count, selected count, active tool, zoom, background color, grid status",
        parameters: {},
        category: "Info",
      },
      {
        name: "listElements",
        description:
          "List all elements on the canvas with their type, id, position, and dimensions",
        parameters: {},
        category: "Info",
      },
      {
        name: "getSelectedElements",
        description: "Get details of all currently selected elements",
        parameters: {},
        category: "Info",
      },

      // ── Navigation ──
      {
        name: "scrollToContent",
        description:
          "Scroll and zoom to fit all content on screen, optionally with animation",
        parameters: {
          type: "object",
          properties: {
            animate: {
              type: "boolean",
              description: "Whether to animate the scroll (default: true)",
            },
          },
        },
        category: "Navigation",
      },

      // ── Create ──
      {
        name: "createRectangle",
        description: "Create a rectangle on the canvas",
        parameters: {
          type: "object",
          properties: {
            x: { type: "number", description: "X position" },
            y: { type: "number", description: "Y position" },
            width: {
              type: "number",
              description: "Width (default: 200)",
            },
            height: {
              type: "number",
              description: "Height (default: 150)",
            },
            backgroundColor: {
              type: "string",
              description:
                "Fill color (e.g. 'transparent', '#a5d8ff', '#ffc9c9')",
            },
            strokeColor: {
              type: "string",
              description: "Border color (default: '#1e1e1e')",
            },
          },
          required: ["x", "y"],
        },
        category: "Create",
      },
      {
        name: "createEllipse",
        description: "Create an ellipse/circle on the canvas",
        parameters: {
          type: "object",
          properties: {
            x: { type: "number", description: "X position" },
            y: { type: "number", description: "Y position" },
            width: {
              type: "number",
              description: "Width (default: 200)",
            },
            height: {
              type: "number",
              description: "Height (default: 200)",
            },
            backgroundColor: {
              type: "string",
              description: "Fill color",
            },
            strokeColor: {
              type: "string",
              description: "Border color",
            },
          },
          required: ["x", "y"],
        },
        category: "Create",
      },
      {
        name: "createDiamond",
        description: "Create a diamond shape on the canvas",
        parameters: {
          type: "object",
          properties: {
            x: { type: "number", description: "X position" },
            y: { type: "number", description: "Y position" },
            width: { type: "number", description: "Width (default: 200)" },
            height: { type: "number", description: "Height (default: 200)" },
            backgroundColor: { type: "string", description: "Fill color" },
            strokeColor: { type: "string", description: "Border color" },
          },
          required: ["x", "y"],
        },
        category: "Create",
      },
      {
        name: "createText",
        description: "Create a text element on the canvas",
        parameters: {
          type: "object",
          properties: {
            x: { type: "number", description: "X position" },
            y: { type: "number", description: "Y position" },
            text: { type: "string", description: "Text content" },
            fontSize: {
              type: "number",
              description: "Font size (default: 20)",
            },
          },
          required: ["x", "y", "text"],
        },
        category: "Create",
      },
      {
        name: "createArrow",
        description:
          "Create an arrow from one point to another on the canvas",
        parameters: {
          type: "object",
          properties: {
            startX: { type: "number", description: "Start X" },
            startY: { type: "number", description: "Start Y" },
            endX: { type: "number", description: "End X" },
            endY: { type: "number", description: "End Y" },
            strokeColor: { type: "string", description: "Arrow color" },
          },
          required: ["startX", "startY", "endX", "endY"],
        },
        category: "Create",
      },
      {
        name: "createLine",
        description: "Create a line from one point to another on the canvas",
        parameters: {
          type: "object",
          properties: {
            startX: { type: "number", description: "Start X" },
            startY: { type: "number", description: "Start Y" },
            endX: { type: "number", description: "End X" },
            endY: { type: "number", description: "End Y" },
            strokeColor: { type: "string", description: "Line color" },
          },
          required: ["startX", "startY", "endX", "endY"],
        },
        category: "Create",
      },

      // ── Modify ──
      {
        name: "deleteSelected",
        description: "Delete all currently selected elements",
        parameters: {},
        category: "Modify",
        destructive: true,
      },
      {
        name: "selectAll",
        description: "Select all elements on the canvas",
        parameters: {},
        category: "Modify",
      },
      {
        name: "clearCanvas",
        description: "Delete all elements from the canvas",
        parameters: {},
        category: "Modify",
        destructive: true,
      },
      {
        name: "setBackgroundColor",
        description: "Change the canvas background color",
        parameters: {
          type: "object",
          properties: {
            color: {
              type: "string",
              description:
                "Background color (e.g. '#ffffff', '#1e1e1e', 'transparent')",
            },
          },
          required: ["color"],
        },
        category: "Modify",
      },

      // ── Tool ──
      {
        name: "setActiveTool",
        description: "Switch the active drawing tool",
        parameters: {
          type: "object",
          properties: {
            tool: {
              type: "string",
              description: "Tool type",
              enum: [
                "selection",
                "rectangle",
                "diamond",
                "ellipse",
                "arrow",
                "line",
                "freedraw",
                "text",
                "eraser",
                "hand",
                "frame",
                "laser",
              ],
            },
          },
          required: ["tool"],
        },
        category: "Tool",
      },

      // ── View ──
      {
        name: "toggleGrid",
        description: "Toggle the grid overlay on/off",
        parameters: {
          type: "object",
          properties: {
            enabled: {
              type: "boolean",
              description: "Whether grid should be on or off",
            },
          },
          required: ["enabled"],
        },
        category: "View",
      },
      {
        name: "toggleZenMode",
        description:
          "Toggle zen mode (hides toolbar/sidebar for distraction-free drawing)",
        parameters: {
          type: "object",
          properties: {
            enabled: { type: "boolean", description: "Zen mode state" },
          },
          required: ["enabled"],
        },
        category: "View",
      },

      // ── Export ──
      {
        name: "exportInfo",
        description:
          "Get information about what can be exported (element counts, types, bounds)",
        parameters: {},
        category: "Export",
      },

      // ── History ──
      {
        name: "clearHistory",
        description: "Clear the undo/redo history",
        parameters: {},
        category: "History",
        destructive: true,
      },

      // ── Toast ──
      {
        name: "showToast",
        description: "Show a toast notification on the canvas",
        parameters: {
          type: "object",
          properties: {
            message: { type: "string", description: "Message to show" },
            duration: {
              type: "number",
              description: "Duration in ms (default: 3000)",
            },
          },
          required: ["message"],
        },
        category: "Info",
      },
    ],

    getState: () => {
      const api = apiRef.current;
      if (!api) return { status: "Editor not ready" };

      const elements = api.getSceneElements();
      const appState = api.getAppState();

      return {
        elementCount: elements.length,
        selectedCount: Object.keys(appState.selectedElementIds || {}).length,
        activeTool: appState.activeTool?.type ?? "unknown",
        theme: appState.theme,
        viewBackgroundColor: appState.viewBackgroundColor,
        elementTypes: elements.reduce(
          (acc: Record<string, number>, el: ExcalidrawElement) => {
            acc[el.type] = (acc[el.type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      };
    },

    executeAction: (
      name: string,
      params: Record<string, unknown>
    ): ChikoActionResult => {
      const api = apiRef.current;
      if (!api) {
        return { success: false, message: "Editor not ready" };
      }

      try {
        switch (name) {
          // ── Info ──
          case "readCurrentState": {
            const elements = api.getSceneElements();
            const appState = api.getAppState();
            const selectedCount = Object.keys(
              appState.selectedElementIds || {}
            ).length;
            return {
              success: true,
              message: `${elements.length} elements, ${selectedCount} selected, tool=${appState.activeTool?.type ?? "unknown"}, theme=${appState.theme}, bg=${appState.viewBackgroundColor}`,
            };
          }

          case "listElements": {
            const elements = api.getSceneElements();
            if (elements.length === 0) {
              return { success: true, message: "Canvas is empty" };
            }
            const list = elements
              .slice(0, 50)
              .map(
                (el: ExcalidrawElement) =>
                  `${el.type} [${el.id}] at (${Math.round(el.x)}, ${Math.round(el.y)}) ${el.width}×${el.height}`
              )
              .join("\n");
            const suffix =
              elements.length > 50
                ? `\n... and ${elements.length - 50} more`
                : "";
            return { success: true, message: list + suffix };
          }

          case "getSelectedElements": {
            const appState = api.getAppState();
            const allElements = api.getSceneElements();
            const selectedIds = new Set(
              Object.keys(appState.selectedElementIds || {})
            );
            const selected = allElements.filter((el: ExcalidrawElement) =>
              selectedIds.has(el.id)
            );
            if (selected.length === 0) {
              return { success: true, message: "No elements selected" };
            }
            const list = selected
              .map(
                (el: ExcalidrawElement) =>
                  `${el.type} [${el.id}] at (${Math.round(el.x)}, ${Math.round(el.y)}) ${el.width}×${el.height}`
              )
              .join("\n");
            return { success: true, message: list };
          }

          // ── Navigation ──
          case "scrollToContent": {
            const animate = (params.animate as boolean) ?? true;
            api.scrollToContent(undefined, {
              fitToContent: true,
              animate,
              duration: 300,
            });
            return { success: true, message: "Scrolled to content" };
          }

          // ── Create helpers ──
          case "createRectangle": {
            const id = crypto.randomUUID();
            api.updateScene({
              elements: [
                ...api.getSceneElementsIncludingDeleted(),
                {
                  type: "rectangle",
                  id,
                  x: (params.x as number) ?? 0,
                  y: (params.y as number) ?? 0,
                  width: (params.width as number) ?? 200,
                  height: (params.height as number) ?? 150,
                  strokeColor:
                    (params.strokeColor as string) ?? "#1e1e1e",
                  backgroundColor:
                    (params.backgroundColor as string) ?? "transparent",
                  fillStyle: "solid",
                  strokeWidth: 2,
                  roughness: 1,
                  opacity: 100,
                  angle: 0,
                  seed: Math.floor(Math.random() * 100000),
                  version: 1,
                  versionNonce: Math.floor(Math.random() * 100000),
                  isDeleted: false,
                  groupIds: [],
                  boundElements: null,
                  link: null,
                  locked: false,
                } as unknown as ExcalidrawElement,
              ],
            });
            return {
              success: true,
              message: `Created rectangle [${id}]`,
            };
          }

          case "createEllipse": {
            const id = crypto.randomUUID();
            api.updateScene({
              elements: [
                ...api.getSceneElementsIncludingDeleted(),
                {
                  type: "ellipse",
                  id,
                  x: (params.x as number) ?? 0,
                  y: (params.y as number) ?? 0,
                  width: (params.width as number) ?? 200,
                  height: (params.height as number) ?? 200,
                  strokeColor:
                    (params.strokeColor as string) ?? "#1e1e1e",
                  backgroundColor:
                    (params.backgroundColor as string) ?? "transparent",
                  fillStyle: "solid",
                  strokeWidth: 2,
                  roughness: 1,
                  opacity: 100,
                  angle: 0,
                  seed: Math.floor(Math.random() * 100000),
                  version: 1,
                  versionNonce: Math.floor(Math.random() * 100000),
                  isDeleted: false,
                  groupIds: [],
                  boundElements: null,
                  link: null,
                  locked: false,
                } as unknown as ExcalidrawElement,
              ],
            });
            return { success: true, message: `Created ellipse [${id}]` };
          }

          case "createDiamond": {
            const id = crypto.randomUUID();
            api.updateScene({
              elements: [
                ...api.getSceneElementsIncludingDeleted(),
                {
                  type: "diamond",
                  id,
                  x: (params.x as number) ?? 0,
                  y: (params.y as number) ?? 0,
                  width: (params.width as number) ?? 200,
                  height: (params.height as number) ?? 200,
                  strokeColor:
                    (params.strokeColor as string) ?? "#1e1e1e",
                  backgroundColor:
                    (params.backgroundColor as string) ?? "transparent",
                  fillStyle: "solid",
                  strokeWidth: 2,
                  roughness: 1,
                  opacity: 100,
                  angle: 0,
                  seed: Math.floor(Math.random() * 100000),
                  version: 1,
                  versionNonce: Math.floor(Math.random() * 100000),
                  isDeleted: false,
                  groupIds: [],
                  boundElements: null,
                  link: null,
                  locked: false,
                } as unknown as ExcalidrawElement,
              ],
            });
            return {
              success: true,
              message: `Created diamond [${id}]`,
            };
          }

          case "createText": {
            const id = crypto.randomUUID();
            api.updateScene({
              elements: [
                ...api.getSceneElementsIncludingDeleted(),
                {
                  type: "text",
                  id,
                  x: (params.x as number) ?? 0,
                  y: (params.y as number) ?? 0,
                  width: 0,
                  height: 0,
                  text: (params.text as string) ?? "Hello",
                  fontSize: (params.fontSize as number) ?? 20,
                  fontFamily: 1,
                  textAlign: "left",
                  verticalAlign: "top",
                  strokeColor: "#1e1e1e",
                  backgroundColor: "transparent",
                  fillStyle: "solid",
                  strokeWidth: 1,
                  roughness: 1,
                  opacity: 100,
                  angle: 0,
                  seed: Math.floor(Math.random() * 100000),
                  version: 1,
                  versionNonce: Math.floor(Math.random() * 100000),
                  isDeleted: false,
                  groupIds: [],
                  boundElements: null,
                  link: null,
                  locked: false,
                  originalText: (params.text as string) ?? "Hello",
                  lineHeight: 1.25,
                } as unknown as ExcalidrawElement,
              ],
            });
            return { success: true, message: `Created text [${id}]` };
          }

          case "createArrow": {
            const id = crypto.randomUUID();
            const sx = (params.startX as number) ?? 0;
            const sy = (params.startY as number) ?? 0;
            const ex = (params.endX as number) ?? 200;
            const ey = (params.endY as number) ?? 0;
            api.updateScene({
              elements: [
                ...api.getSceneElementsIncludingDeleted(),
                {
                  type: "arrow",
                  id,
                  x: sx,
                  y: sy,
                  width: ex - sx,
                  height: ey - sy,
                  points: [
                    [0, 0],
                    [ex - sx, ey - sy],
                  ],
                  strokeColor:
                    (params.strokeColor as string) ?? "#1e1e1e",
                  backgroundColor: "transparent",
                  fillStyle: "solid",
                  strokeWidth: 2,
                  roughness: 1,
                  opacity: 100,
                  angle: 0,
                  seed: Math.floor(Math.random() * 100000),
                  version: 1,
                  versionNonce: Math.floor(Math.random() * 100000),
                  isDeleted: false,
                  groupIds: [],
                  boundElements: null,
                  link: null,
                  locked: false,
                  startBinding: null,
                  endBinding: null,
                  lastCommittedPoint: null,
                  startArrowhead: null,
                  endArrowhead: "arrow",
                } as unknown as ExcalidrawElement,
              ],
            });
            return { success: true, message: `Created arrow [${id}]` };
          }

          case "createLine": {
            const id = crypto.randomUUID();
            const sx = (params.startX as number) ?? 0;
            const sy = (params.startY as number) ?? 0;
            const ex = (params.endX as number) ?? 200;
            const ey = (params.endY as number) ?? 0;
            api.updateScene({
              elements: [
                ...api.getSceneElementsIncludingDeleted(),
                {
                  type: "line",
                  id,
                  x: sx,
                  y: sy,
                  width: ex - sx,
                  height: ey - sy,
                  points: [
                    [0, 0],
                    [ex - sx, ey - sy],
                  ],
                  strokeColor:
                    (params.strokeColor as string) ?? "#1e1e1e",
                  backgroundColor: "transparent",
                  fillStyle: "solid",
                  strokeWidth: 2,
                  roughness: 1,
                  opacity: 100,
                  angle: 0,
                  seed: Math.floor(Math.random() * 100000),
                  version: 1,
                  versionNonce: Math.floor(Math.random() * 100000),
                  isDeleted: false,
                  groupIds: [],
                  boundElements: null,
                  link: null,
                  locked: false,
                  lastCommittedPoint: null,
                  startArrowhead: null,
                  endArrowhead: null,
                } as unknown as ExcalidrawElement,
              ],
            });
            return { success: true, message: `Created line [${id}]` };
          }

          // ── Modify ──
          case "deleteSelected": {
            const appState = api.getAppState();
            const selectedIds = new Set(
              Object.keys(appState.selectedElementIds || {})
            );
            if (selectedIds.size === 0) {
              return {
                success: false,
                message: "No elements selected",
              };
            }
            const updated = api
              .getSceneElementsIncludingDeleted()
              .map((el: ExcalidrawElement) =>
                selectedIds.has(el.id)
                  ? { ...el, isDeleted: true }
                  : el
              );
            api.updateScene({
              elements: updated as ExcalidrawElement[],
              appState: { selectedElementIds: {} },
            });
            return {
              success: true,
              message: `Deleted ${selectedIds.size} elements`,
            };
          }

          case "selectAll": {
            const allElements = api.getSceneElements();
            const selectedIds: Record<string, true> = {};
            allElements.forEach((el: ExcalidrawElement) => {
              selectedIds[el.id] = true;
            });
            api.updateScene({
              appState: { selectedElementIds: selectedIds },
            });
            return {
              success: true,
              message: `Selected ${allElements.length} elements`,
            };
          }

          case "clearCanvas": {
            api.resetScene();
            return { success: true, message: "Canvas cleared" };
          }

          case "setBackgroundColor": {
            const color = params.color as string;
            if (!color) {
              return {
                success: false,
                message: "color parameter required",
              };
            }
            api.updateScene({
              appState: { viewBackgroundColor: color },
            });
            return {
              success: true,
              message: `Background set to ${color}`,
            };
          }

          // ── Tool ──
          case "setActiveTool": {
            const tool = params.tool as string;
            if (!tool) {
              return {
                success: false,
                message: "tool parameter required",
              };
            }
            api.setActiveTool({ type: tool as never });
            return {
              success: true,
              message: `Active tool set to ${tool}`,
            };
          }

          // ── View ──
          case "toggleGrid": {
            const enabled = params.enabled as boolean;
            api.updateScene({
              appState: { gridModeEnabled: enabled },
            });
            return {
              success: true,
              message: `Grid ${enabled ? "enabled" : "disabled"}`,
            };
          }

          case "toggleZenMode": {
            const enabled = params.enabled as boolean;
            api.updateScene({
              appState: { zenModeEnabled: enabled },
            });
            return {
              success: true,
              message: `Zen mode ${enabled ? "enabled" : "disabled"}`,
            };
          }

          // ── Export ──
          case "exportInfo": {
            const elements = api.getSceneElements();
            const types = elements.reduce(
              (acc: Record<string, number>, el: ExcalidrawElement) => {
                acc[el.type] = (acc[el.type] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            );
            return {
              success: true,
              message: `${elements.length} elements: ${JSON.stringify(types)}. Export via PNG, SVG, JSON using toolbar.`,
            };
          }

          // ── History ──
          case "clearHistory": {
            api.history.clear();
            return { success: true, message: "History cleared" };
          }

          // ── Toast ──
          case "showToast": {
            const message = params.message as string;
            const duration = (params.duration as number) ?? 3000;
            api.setToast({
              message,
              closable: true,
              duration,
            });
            return { success: true, message: `Toast shown: "${message}"` };
          }

          default:
            return {
              success: false,
              message: `Unknown action: ${name}`,
            };
        }
      } catch (err) {
        return {
          success: false,
          message: `Error: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  };
}
