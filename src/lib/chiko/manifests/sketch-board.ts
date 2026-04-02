/* ─────────────────────────────────────────────────────────────
   Sketch Board — Chiko AI Manifest
   Full AI control over the infinite canvas whiteboard
   ───────────────────────────────────────────────────────────── */
import type {
  ChikoActionManifest,
  ChikoActionResult,
} from "@/stores/chiko-actions";
import type { useSketchBoardEditor } from "@/stores/sketch-board-editor";
import { STICKY_COLORS, STROKE_COLORS, FILL_COLORS, BACKGROUND_PRESETS } from "@/stores/sketch-board-editor";
import type { SketchElement, ElementStyle, Point } from "@/types/sketch-board";

type Store = typeof useSketchBoardEditor;

export function createSketchBoardManifest(store: Store): ChikoActionManifest {
  return {
    toolId: "sketch-board",
    toolName: "Sketch Board",
    actions: [
      // ── Info ──
      {
        name: "readCurrentState",
        description:
          "Read the full state: title, element count, element types, camera position, grid settings, selected elements",
        parameters: {},
        category: "Info",
      },
      {
        name: "listElements",
        description:
          "List all elements with their IDs, types, positions, dimensions, and key properties",
        parameters: {},
        category: "Info",
      },
      {
        name: "getElementDetail",
        description: "Get detailed info about a specific element by ID",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Element ID" },
          },
          required: ["id"],
        },
        category: "Info",
      },

      // ── Document ──
      {
        name: "setTitle",
        description: "Change the board title",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "New board title" },
          },
          required: ["title"],
        },
        category: "Document",
      },
      {
        name: "setBackground",
        description: "Change the canvas background",
        parameters: {
          type: "object",
          properties: {
            background: {
              type: "string",
              description: "Background preset ID",
              enum: BACKGROUND_PRESETS.map((b) => b.id),
            },
          },
          required: ["background"],
        },
        category: "Document",
      },
      {
        name: "clearAll",
        description: "Remove all elements from the board",
        parameters: {},
        category: "Document",
        destructive: true,
      },
      {
        name: "resetBoard",
        description: "Reset the entire board to default empty state",
        parameters: {},
        category: "Document",
        destructive: true,
      },

      // ── Create Shapes ──
      {
        name: "addRectangle",
        description: "Add a rectangle at given position and size",
        parameters: {
          type: "object",
          properties: {
            x: { type: "number", description: "X position" },
            y: { type: "number", description: "Y position" },
            width: { type: "number", description: "Width" },
            height: { type: "number", description: "Height" },
          },
          required: ["x", "y", "width", "height"],
        },
        category: "Create",
      },
      {
        name: "addEllipse",
        description: "Add an ellipse/circle at given position and size",
        parameters: {
          type: "object",
          properties: {
            x: { type: "number", description: "X position" },
            y: { type: "number", description: "Y position" },
            width: { type: "number", description: "Width" },
            height: { type: "number", description: "Height" },
          },
          required: ["x", "y", "width", "height"],
        },
        category: "Create",
      },
      {
        name: "addDiamond",
        description: "Add a diamond shape at given position and size",
        parameters: {
          type: "object",
          properties: {
            x: { type: "number", description: "X position" },
            y: { type: "number", description: "Y position" },
            width: { type: "number", description: "Width" },
            height: { type: "number", description: "Height" },
          },
          required: ["x", "y", "width", "height"],
        },
        category: "Create",
      },
      {
        name: "addTriangle",
        description: "Add a triangle at given position and size",
        parameters: {
          type: "object",
          properties: {
            x: { type: "number", description: "X position" },
            y: { type: "number", description: "Y position" },
            width: { type: "number", description: "Width" },
            height: { type: "number", description: "Height" },
          },
          required: ["x", "y", "width", "height"],
        },
        category: "Create",
      },
      {
        name: "addLine",
        description: "Add a line between two points",
        parameters: {
          type: "object",
          properties: {
            x1: { type: "number", description: "Start X" },
            y1: { type: "number", description: "Start Y" },
            x2: { type: "number", description: "End X" },
            y2: { type: "number", description: "End Y" },
          },
          required: ["x1", "y1", "x2", "y2"],
        },
        category: "Create",
      },
      {
        name: "addArrow",
        description: "Add an arrow connector between two points",
        parameters: {
          type: "object",
          properties: {
            x1: { type: "number", description: "Start X" },
            y1: { type: "number", description: "Start Y" },
            x2: { type: "number", description: "End X" },
            y2: { type: "number", description: "End Y" },
          },
          required: ["x1", "y1", "x2", "y2"],
        },
        category: "Create",
      },
      {
        name: "addText",
        description: "Add a text element at a position",
        parameters: {
          type: "object",
          properties: {
            x: { type: "number", description: "X position" },
            y: { type: "number", description: "Y position" },
            text: { type: "string", description: "Text content" },
          },
          required: ["x", "y", "text"],
        },
        category: "Create",
      },
      {
        name: "addSticky",
        description: "Add a sticky note at a position",
        parameters: {
          type: "object",
          properties: {
            x: { type: "number", description: "X position" },
            y: { type: "number", description: "Y position" },
            text: { type: "string", description: "Sticky note text" },
            color: {
              type: "string",
              description: "Sticky color (hex)",
              enum: STICKY_COLORS,
            },
          },
          required: ["x", "y", "text"],
        },
        category: "Create",
      },
      {
        name: "addFreehand",
        description:
          "Add a freehand drawing from an array of {x,y} points",
        parameters: {
          type: "object",
          properties: {
            points: {
              type: "array",
              description: "Array of {x, y} points",
              items: {
                type: "object",
                properties: {
                  x: { type: "number" },
                  y: { type: "number" },
                },
              },
            },
          },
          required: ["points"],
        },
        category: "Create",
      },

      // ── Modify ──
      {
        name: "moveElement",
        description: "Move an element by dx/dy offset",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Element ID" },
            dx: { type: "number", description: "X offset" },
            dy: { type: "number", description: "Y offset" },
          },
          required: ["id", "dx", "dy"],
        },
        category: "Modify",
      },
      {
        name: "resizeElement",
        description: "Resize an element to new width and height",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Element ID" },
            width: { type: "number", description: "New width" },
            height: { type: "number", description: "New height" },
          },
          required: ["id", "width", "height"],
        },
        category: "Modify",
      },
      {
        name: "rotateElement",
        description: "Rotate an element to a specific angle in degrees",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Element ID" },
            angle: { type: "number", description: "Rotation angle in degrees" },
          },
          required: ["id", "angle"],
        },
        category: "Modify",
      },
      {
        name: "updateText",
        description: "Update the text content of a text or sticky element",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Element ID" },
            text: { type: "string", description: "New text" },
          },
          required: ["id", "text"],
        },
        category: "Modify",
      },
      {
        name: "lockElement",
        description: "Lock or unlock an element",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Element ID" },
            locked: { type: "boolean", description: "Whether locked" },
          },
          required: ["id", "locked"],
        },
        category: "Modify",
      },

      // ── Style ──
      {
        name: "setElementStyle",
        description:
          "Change visual style of an element (stroke color, fill, width, dash, opacity, font)",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Element ID" },
            strokeColor: {
              type: "string",
              description: "Stroke color hex",
              enum: STROKE_COLORS,
            },
            fillColor: {
              type: "string",
              description: "Fill color hex",
              enum: FILL_COLORS,
            },
            strokeWidth: { type: "number", description: "Stroke width 1-12" },
            dashStyle: {
              type: "string",
              enum: ["solid", "dashed", "dotted"],
            },
            opacity: { type: "number", description: "Opacity 0-1" },
            fontSize: { type: "number", description: "Font size 12-72" },
            fontFamily: {
              type: "string",
              enum: ["hand", "sans", "serif", "mono"],
            },
            textAlign: { type: "string", enum: ["left", "center", "right"] },
          },
          required: ["id"],
        },
        category: "Style",
      },
      {
        name: "setCurrentStyle",
        description: "Set the default style for new elements",
        parameters: {
          type: "object",
          properties: {
            strokeColor: { type: "string" },
            fillColor: { type: "string" },
            strokeWidth: { type: "number" },
            dashStyle: {
              type: "string",
              enum: ["solid", "dashed", "dotted"],
            },
            opacity: { type: "number" },
            fontSize: { type: "number" },
            fontFamily: {
              type: "string",
              enum: ["hand", "sans", "serif", "mono"],
            },
          },
        },
        category: "Style",
      },

      // ── Z-Order ──
      {
        name: "bringToFront",
        description: "Bring an element to the front (highest z-index)",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Element ID" },
          },
          required: ["id"],
        },
        category: "Z-Order",
      },
      {
        name: "sendToBack",
        description: "Send an element to the back (lowest z-index)",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Element ID" },
          },
          required: ["id"],
        },
        category: "Z-Order",
      },

      // ── Camera ──
      {
        name: "setCamera",
        description: "Set camera position and zoom level",
        parameters: {
          type: "object",
          properties: {
            x: { type: "number", description: "Camera X offset" },
            y: { type: "number", description: "Camera Y offset" },
            zoom: { type: "number", description: "Zoom level (0.1 to 8)" },
          },
          required: ["x", "y", "zoom"],
        },
        category: "Camera",
      },
      {
        name: "zoomIn",
        description: "Zoom in by 25%",
        parameters: {},
        category: "Camera",
      },
      {
        name: "zoomOut",
        description: "Zoom out by 25%",
        parameters: {},
        category: "Camera",
      },
      {
        name: "resetZoom",
        description: "Reset camera to origin at 100% zoom",
        parameters: {},
        category: "Camera",
      },
      {
        name: "fitToContent",
        description: "Auto-fit camera to show all elements",
        parameters: {},
        category: "Camera",
      },

      // ── Grid ──
      {
        name: "toggleGrid",
        description: "Toggle the dot grid on/off",
        parameters: {},
        category: "Grid",
      },
      {
        name: "toggleSnap",
        description: "Toggle snap-to-grid on/off",
        parameters: {},
        category: "Grid",
      },
      {
        name: "setGridSize",
        description: "Set the grid spacing in pixels",
        parameters: {
          type: "object",
          properties: {
            size: { type: "number", description: "Grid size in pixels" },
          },
          required: ["size"],
        },
        category: "Grid",
      },

      // ── Selection & Delete ──
      {
        name: "selectElements",
        description: "Select elements by their IDs",
        parameters: {
          type: "object",
          properties: {
            ids: {
              type: "array",
              description: "Array of element IDs to select",
              items: { type: "string" },
            },
          },
          required: ["ids"],
        },
        category: "Selection",
      },
      {
        name: "selectAll",
        description: "Select all elements",
        parameters: {},
        category: "Selection",
      },
      {
        name: "deselectAll",
        description: "Deselect all elements",
        parameters: {},
        category: "Selection",
      },
      {
        name: "deleteElements",
        description: "Delete elements by their IDs",
        parameters: {
          type: "object",
          properties: {
            ids: {
              type: "array",
              description: "Array of element IDs to delete",
              items: { type: "string" },
            },
          },
          required: ["ids"],
        },
        category: "Selection",
        destructive: true,
      },
      {
        name: "duplicateSelected",
        description: "Duplicate currently selected elements",
        parameters: {},
        category: "Selection",
      },

      // ── Composite / AI-Powered ──
      {
        name: "createFlowchart",
        description:
          "Create a simple flowchart from an array of labeled steps with arrows connecting them",
        parameters: {
          type: "object",
          properties: {
            steps: {
              type: "array",
              description:
                "Array of step labels. Each step becomes a rectangle with text, connected by arrows.",
              items: { type: "string" },
            },
            direction: {
              type: "string",
              enum: ["horizontal", "vertical"],
              description: "Layout direction",
            },
          },
          required: ["steps"],
        },
        category: "Composite",
      },
      {
        name: "createMindMap",
        description:
          "Create a mind map from a central topic and branches",
        parameters: {
          type: "object",
          properties: {
            center: { type: "string", description: "Central topic" },
            branches: {
              type: "array",
              description: "Array of branch labels radiating from center",
              items: { type: "string" },
            },
          },
          required: ["center", "branches"],
        },
        category: "Composite",
      },
      {
        name: "createStickyWall",
        description:
          "Create a grid of sticky notes from an array of texts",
        parameters: {
          type: "object",
          properties: {
            notes: {
              type: "array",
              description: "Array of sticky note texts",
              items: { type: "string" },
            },
            columns: {
              type: "number",
              description: "Number of columns (default 3)",
            },
          },
          required: ["notes"],
        },
        category: "Composite",
      },
    ],

    getState: () => {
      const s = store.getState();
      const types: Record<string, number> = {};
      for (const el of s.doc.elements) {
        types[el.type] = (types[el.type] || 0) + 1;
      }
      return {
        title: s.doc.title,
        background: s.doc.background,
        elementCount: s.doc.elements.length,
        elementTypes: types,
        selectedCount: s.selectedIds.length,
        selectedIds: s.selectedIds,
        camera: s.camera,
        gridEnabled: s.grid.enabled,
        gridSnap: s.grid.snap,
        activeTool: s.activeTool,
      };
    },

    executeAction: (
      name: string,
      params: Record<string, unknown>
    ): ChikoActionResult => {
      try {
        const s = store.getState();

        switch (name) {
          // ── Info ──
          case "readCurrentState": {
            const types: Record<string, number> = {};
            for (const el of s.doc.elements) {
              types[el.type] = (types[el.type] || 0) + 1;
            }
            return {
              success: true,
              message: `Board "${s.doc.title}": ${s.doc.elements.length} elements (${Object.entries(types).map(([k, v]) => `${v} ${k}(s)`).join(", ") || "empty"}). Background: ${s.doc.background}. Camera: (${Math.round(s.camera.x)}, ${Math.round(s.camera.y)}) @ ${Math.round(s.camera.zoom * 100)}%. Grid: ${s.grid.enabled ? "on" : "off"}.`,
            };
          }
          case "listElements": {
            if (s.doc.elements.length === 0) {
              return { success: true, message: "Board is empty — no elements." };
            }
            const list = s.doc.elements.map((el: SketchElement) => {
              let info = `[${el.id}] ${el.type} at (${Math.round(el.x)}, ${Math.round(el.y)}) ${Math.round(el.width)}×${Math.round(el.height)}`;
              if ("text" in el) info += ` text="${(el as unknown as { text: string }).text}"`;
              if (el.locked) info += " [LOCKED]";
              return info;
            });
            return { success: true, message: list.join("\n") };
          }
          case "getElementDetail": {
            const el = s.doc.elements.find(
              (e: SketchElement) => e.id === (params.id as string)
            );
            if (!el) return { success: false, message: `Element ${params.id} not found` };
            return {
              success: true,
              message: JSON.stringify(el, null, 2),
            };
          }

          // ── Document ──
          case "setTitle":
            s.setTitle(params.title as string);
            return { success: true, message: `Title set to "${params.title}"` };
          case "setBackground":
            s.setBackground(params.background as string);
            return {
              success: true,
              message: `Background changed to ${params.background}`,
            };
          case "clearAll":
            s.clearAll();
            return { success: true, message: "All elements cleared" };
          case "resetBoard":
            s.resetDoc();
            return { success: true, message: "Board reset to empty state" };

          // ── Create ──
          case "addRectangle": {
            const id = s.addRectangle(
              params.x as number,
              params.y as number,
              params.width as number,
              params.height as number
            );
            return { success: true, message: `Rectangle created: ${id}` };
          }
          case "addEllipse": {
            const id = s.addEllipse(
              params.x as number,
              params.y as number,
              params.width as number,
              params.height as number
            );
            return { success: true, message: `Ellipse created: ${id}` };
          }
          case "addDiamond": {
            const id = s.addDiamond(
              params.x as number,
              params.y as number,
              params.width as number,
              params.height as number
            );
            return { success: true, message: `Diamond created: ${id}` };
          }
          case "addTriangle": {
            const id = s.addTriangle(
              params.x as number,
              params.y as number,
              params.width as number,
              params.height as number
            );
            return { success: true, message: `Triangle created: ${id}` };
          }
          case "addLine": {
            const id = s.addLine(
              params.x1 as number,
              params.y1 as number,
              params.x2 as number,
              params.y2 as number
            );
            return { success: true, message: `Line created: ${id}` };
          }
          case "addArrow": {
            const id = s.addArrow(
              params.x1 as number,
              params.y1 as number,
              params.x2 as number,
              params.y2 as number
            );
            return { success: true, message: `Arrow created: ${id}` };
          }
          case "addText": {
            const id = s.addText(
              params.x as number,
              params.y as number,
              params.text as string
            );
            return { success: true, message: `Text created: ${id}` };
          }
          case "addSticky": {
            const id = s.addSticky(
              params.x as number,
              params.y as number,
              params.text as string,
              params.color as string | undefined
            );
            return { success: true, message: `Sticky note created: ${id}` };
          }
          case "addFreehand": {
            const pts = params.points as Point[];
            if (!pts || pts.length < 2) {
              return {
                success: false,
                message: "Need at least 2 points for freehand",
              };
            }
            const id = s.addFreehand(pts);
            return {
              success: true,
              message: `Freehand drawing created (${pts.length} points): ${id}`,
            };
          }

          // ── Modify ──
          case "moveElement":
            s.moveElement(
              params.id as string,
              params.dx as number,
              params.dy as number
            );
            return {
              success: true,
              message: `Moved ${params.id} by (${params.dx}, ${params.dy})`,
            };
          case "resizeElement":
            s.resizeElement(
              params.id as string,
              params.width as number,
              params.height as number
            );
            return {
              success: true,
              message: `Resized ${params.id} to ${params.width}×${params.height}`,
            };
          case "rotateElement":
            s.rotateElement(params.id as string, params.angle as number);
            return {
              success: true,
              message: `Rotated ${params.id} to ${params.angle}°`,
            };
          case "updateText":
            s.updateText(params.id as string, params.text as string);
            return {
              success: true,
              message: `Text updated on ${params.id}`,
            };
          case "lockElement":
            s.lockElement(params.id as string, params.locked as boolean);
            return {
              success: true,
              message: `${params.id} ${params.locked ? "locked" : "unlocked"}`,
            };

          // ── Style ──
          case "setElementStyle": {
            const id = params.id as string;
            const patch: Partial<ElementStyle> = {};
            if (params.strokeColor) patch.strokeColor = params.strokeColor as string;
            if (params.fillColor) patch.fillColor = params.fillColor as string;
            if (params.strokeWidth) patch.strokeWidth = params.strokeWidth as number;
            if (params.dashStyle) patch.dashStyle = params.dashStyle as ElementStyle["dashStyle"];
            if (params.opacity !== undefined) patch.opacity = params.opacity as number;
            if (params.fontSize) patch.fontSize = params.fontSize as number;
            if (params.fontFamily) patch.fontFamily = params.fontFamily as ElementStyle["fontFamily"];
            if (params.textAlign) patch.textAlign = params.textAlign as ElementStyle["textAlign"];
            s.setElementStyle(id, patch);
            return { success: true, message: `Style updated on ${id}` };
          }
          case "setCurrentStyle": {
            const patch: Partial<ElementStyle> = {};
            if (params.strokeColor) patch.strokeColor = params.strokeColor as string;
            if (params.fillColor) patch.fillColor = params.fillColor as string;
            if (params.strokeWidth) patch.strokeWidth = params.strokeWidth as number;
            if (params.dashStyle) patch.dashStyle = params.dashStyle as ElementStyle["dashStyle"];
            if (params.opacity !== undefined) patch.opacity = params.opacity as number;
            if (params.fontSize) patch.fontSize = params.fontSize as number;
            if (params.fontFamily) patch.fontFamily = params.fontFamily as ElementStyle["fontFamily"];
            s.setCurrentStyle(patch);
            return { success: true, message: "Default style updated" };
          }

          // ── Z-Order ──
          case "bringToFront":
            s.bringToFront(params.id as string);
            return { success: true, message: `${params.id} brought to front` };
          case "sendToBack":
            s.sendToBack(params.id as string);
            return { success: true, message: `${params.id} sent to back` };

          // ── Camera ──
          case "setCamera":
            s.setCamera({
              x: params.x as number,
              y: params.y as number,
              zoom: params.zoom as number,
            });
            return {
              success: true,
              message: `Camera set to (${params.x}, ${params.y}) @ ${Math.round((params.zoom as number) * 100)}%`,
            };
          case "zoomIn":
            s.zoomIn();
            return { success: true, message: "Zoomed in" };
          case "zoomOut":
            s.zoomOut();
            return { success: true, message: "Zoomed out" };
          case "resetZoom":
            s.resetZoom();
            return { success: true, message: "Zoom reset to 100%" };
          case "fitToContent":
            s.fitToContent();
            return { success: true, message: "Camera fitted to content" };

          // ── Grid ──
          case "toggleGrid":
            s.toggleGrid();
            return {
              success: true,
              message: `Grid ${!s.grid.enabled ? "enabled" : "disabled"}`,
            };
          case "toggleSnap":
            s.toggleSnap();
            return {
              success: true,
              message: `Snap ${!s.grid.snap ? "enabled" : "disabled"}`,
            };
          case "setGridSize":
            s.setGrid({ size: params.size as number });
            return {
              success: true,
              message: `Grid size set to ${params.size}px`,
            };

          // ── Selection ──
          case "selectElements":
            s.setSelectedIds(params.ids as string[]);
            return {
              success: true,
              message: `Selected ${(params.ids as string[]).length} elements`,
            };
          case "selectAll":
            s.selectAll();
            return {
              success: true,
              message: `Selected all ${s.doc.elements.length} elements`,
            };
          case "deselectAll":
            s.deselectAll();
            return { success: true, message: "All deselected" };
          case "deleteElements":
            s.removeElements(params.ids as string[]);
            return {
              success: true,
              message: `Deleted ${(params.ids as string[]).length} elements`,
            };
          case "duplicateSelected":
            s.duplicateSelected();
            return { success: true, message: "Selected elements duplicated" };

          // ── Composite: Flowchart ──
          case "createFlowchart": {
            const steps = params.steps as string[];
            const dir = (params.direction as string) || "vertical";
            const boxW = 180;
            const boxH = 60;
            const gap = 80;
            const startX = 100;
            const startY = 100;
            const ids: string[] = [];

            for (let i = 0; i < steps.length; i++) {
              const bx =
                dir === "horizontal" ? startX + i * (boxW + gap) : startX;
              const by =
                dir === "vertical" ? startY + i * (boxH + gap) : startY;
              const rid = s.addRectangle(bx, by, boxW, boxH);
              ids.push(rid);
              // Add label
              s.addText(bx + 10, by + 20, steps[i]);

              // Add arrow from prev step
              if (i > 0) {
                if (dir === "horizontal") {
                  s.addArrow(
                    bx - gap + boxW,
                    by + boxH / 2,
                    bx,
                    by + boxH / 2
                  );
                } else {
                  s.addArrow(
                    startX + boxW / 2,
                    by - gap + boxH,
                    startX + boxW / 2,
                    by
                  );
                }
              }
            }
            return {
              success: true,
              message: `Flowchart created with ${steps.length} steps: ${ids.join(", ")}`,
            };
          }

          // ── Composite: Mind Map ──
          case "createMindMap": {
            const center = params.center as string;
            const branches = params.branches as string[];
            const cx = 400;
            const cy = 300;
            const radius = 250;

            // Center node
            s.addEllipse(cx - 80, cy - 30, 160, 60);
            s.addText(cx - 70, cy - 10, center);

            // Branch nodes
            for (let i = 0; i < branches.length; i++) {
              const angle = (2 * Math.PI * i) / branches.length - Math.PI / 2;
              const bx = cx + Math.cos(angle) * radius;
              const by = cy + Math.sin(angle) * radius;
              s.addArrow(cx, cy, bx, by);
              s.addSticky(bx - 60, by - 30, branches[i]);
            }
            return {
              success: true,
              message: `Mind map created: "${center}" with ${branches.length} branches`,
            };
          }

          // ── Composite: Sticky Wall ──
          case "createStickyWall": {
            const notes = params.notes as string[];
            const cols = (params.columns as number) || 3;
            const stickyW = 200;
            const stickyH = 200;
            const gap2 = 20;
            const startX2 = 50;
            const startY2 = 50;

            for (let i = 0; i < notes.length; i++) {
              const col = i % cols;
              const row = Math.floor(i / cols);
              const x = startX2 + col * (stickyW + gap2);
              const y = startY2 + row * (stickyH + gap2);
              const color = STICKY_COLORS[i % STICKY_COLORS.length];
              s.addSticky(x, y, notes[i], color);
            }
            return {
              success: true,
              message: `Sticky wall created: ${notes.length} notes in ${cols} columns`,
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
