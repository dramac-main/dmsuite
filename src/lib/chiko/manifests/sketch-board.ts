import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import type { Editor } from "tldraw";

/**
 * Chiko AI manifest for Sketch Board.
 * Exposes read + basic write actions over the canvas Editor API.
 */
export function createSketchBoardManifest(
  editorRef: React.RefObject<Editor | null>
): ChikoActionManifest {
  return {
    toolId: "sketch-board",
    toolName: "Sketch Board",
    actions: [
      // ── Info ──
      {
        name: "readCurrentState",
        description:
          "Read the current state: page name, selected shapes, total shape count, current tool, zoom level",
        parameters: {},
        category: "Info",
      },
      {
        name: "listShapes",
        description:
          "List all shapes on the current page with their type, id, and position",
        parameters: {},
        category: "Info",
      },

      // ── Navigation ──
      {
        name: "zoomToFit",
        description: "Zoom the camera to fit all content on screen",
        parameters: {},
        category: "Navigation",
      },
      {
        name: "zoomTo",
        description: "Zoom to a specific level",
        parameters: {
          type: "object",
          properties: {
            level: {
              type: "number",
              description: "Zoom level (1 = 100%, 0.5 = 50%, 2 = 200%)",
            },
          },
          required: ["level"],
        },
        category: "Navigation",
      },

      // ── Create ──
      {
        name: "createShape",
        description:
          "Create a shape on the canvas (rectangle, ellipse, arrow, draw, text, note, etc.)",
        parameters: {
          type: "object",
          properties: {
            type: {
              type: "string",
              description:
                "Shape type: geo, draw, arrow, text, note, frame, line",
              enum: ["geo", "draw", "arrow", "text", "note", "frame", "line"],
            },
            x: { type: "number", description: "X position" },
            y: { type: "number", description: "Y position" },
            text: {
              type: "string",
              description: "Text content (for text/note shapes)",
            },
          },
          required: ["type", "x", "y"],
        },
        category: "Create",
      },

      // ── Modify ──
      {
        name: "deleteSelected",
        description: "Delete all currently selected shapes",
        parameters: {},
        category: "Modify",
      },
      {
        name: "selectAll",
        description: "Select all shapes on the current page",
        parameters: {},
        category: "Modify",
      },
      {
        name: "clearCanvas",
        description: "Delete all shapes from the current page",
        parameters: {},
        category: "Modify",
      },

      // ── Tool ──
      {
        name: "setTool",
        description: "Switch to a specific drawing tool",
        parameters: {
          type: "object",
          properties: {
            tool: {
              type: "string",
              description: "Tool name",
              enum: [
                "select",
                "hand",
                "draw",
                "eraser",
                "arrow",
                "text",
                "note",
                "geo",
                "line",
                "frame",
              ],
            },
          },
          required: ["tool"],
        },
        category: "Tool",
      },

      // ── Export ──
      {
        name: "exportInfo",
        description:
          "Get information about what can be exported (shape counts, bounds)",
        parameters: {},
        category: "Export",
      },
    ],

    getState: () => {
      const editor = editorRef.current;
      if (!editor) return { status: "Editor not ready" };

      const currentPage = editor.getCurrentPage();
      const shapes = editor.getCurrentPageShapes();
      const selected = editor.getSelectedShapeIds();
      const camera = editor.getCamera();

      return {
        page: currentPage.name,
        shapeCount: shapes.length,
        selectedCount: selected.length,
        currentTool: editor.getCurrentToolId(),
        zoom: camera.z.toFixed(2),
        shapeTypes: shapes.reduce(
          (acc, s) => {
            acc[s.type] = (acc[s.type] || 0) + 1;
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
      const editor = editorRef.current;
      if (!editor) {
        return { success: false, message: "Editor not ready" };
      }

      try {
        switch (name) {
          case "readCurrentState": {
            const state = {
              page: editor.getCurrentPage().name,
              shapes: editor.getCurrentPageShapes().length,
              selected: editor.getSelectedShapeIds().length,
              tool: editor.getCurrentToolId(),
              zoom:
                Math.round(editor.getCamera().z * 100) + "%",
            };
            return {
              success: true,
              message: `Page "${state.page}": ${state.shapes} shapes, ${state.selected} selected, tool=${state.tool}, zoom=${state.zoom}`,
            };
          }

          case "listShapes": {
            const shapes = editor.getCurrentPageShapes();
            if (shapes.length === 0) {
              return { success: true, message: "Canvas is empty" };
            }
            const list = shapes
              .slice(0, 50)
              .map(
                (s) =>
                  `${s.type} [${s.id}] at (${Math.round(s.x)}, ${Math.round(s.y)})`
              )
              .join("\n");
            const more =
              shapes.length > 50
                ? `\n... and ${shapes.length - 50} more`
                : "";
            return { success: true, message: list + more };
          }

          case "zoomToFit": {
            editor.zoomToFit();
            return { success: true, message: "Zoomed to fit all content" };
          }

          case "zoomTo": {
            const level = params.level as number;
            editor.setCamera({ ...editor.getCamera(), z: level });
            return {
              success: true,
              message: `Zoomed to ${Math.round(level * 100)}%`,
            };
          }

          case "createShape": {
            const type = params.type as string;
            const x = (params.x as number) ?? 100;
            const y = (params.y as number) ?? 100;
            const text = (params.text as string) ?? "";

            const shapeBase: Record<string, unknown> = {
              type,
              x,
              y,
            };

            if (type === "text" || type === "note") {
              shapeBase.props = { text };
            }
            if (type === "geo") {
              shapeBase.props = {
                w: 200,
                h: 150,
                text,
                geo: "rectangle",
              };
            }

            editor.createShape(shapeBase as Parameters<Editor['createShape']>[0]);
            return {
              success: true,
              message: `Created ${type} shape at (${x}, ${y})`,
            };
          }

          case "deleteSelected": {
            const selected = editor.getSelectedShapeIds();
            if (selected.length === 0) {
              return { success: true, message: "Nothing selected" };
            }
            editor.deleteShapes(selected);
            return {
              success: true,
              message: `Deleted ${selected.length} shapes`,
            };
          }

          case "selectAll": {
            editor.selectAll();
            return {
              success: true,
              message: `Selected ${editor.getSelectedShapeIds().length} shapes`,
            };
          }

          case "clearCanvas": {
            const allShapes = editor.getCurrentPageShapeIds();
            editor.deleteShapes([...allShapes]);
            return {
              success: true,
              message: "Canvas cleared",
            };
          }

          case "setTool": {
            const tool = params.tool as string;
            editor.setCurrentTool(tool);
            return { success: true, message: `Switched to ${tool} tool` };
          }

          case "exportInfo": {
            const shapes = editor.getCurrentPageShapes();
            const types = shapes.reduce(
              (acc, s) => {
                acc[s.type] = (acc[s.type] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            );
            return {
              success: true,
              message: `${shapes.length} shapes on canvas. Types: ${JSON.stringify(types)}. Use tldraw's built-in export (top-right menu > Export).`,
            };
          }

          default:
            return { success: false, message: `Unknown action: ${name}` };
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
