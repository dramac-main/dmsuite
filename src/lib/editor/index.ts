// =============================================================================
// DMSuite — Editor Module Barrel Export
// Single import for all editor infrastructure
// =============================================================================

// ---- Schema & Types ----
export type {
  RGBA, Vec2, AABB, Matrix2D, LayerId, DocId,
  SolidPaint, GradientPaint, ImagePaint, PatternPaint, Paint, GradientStop,
  StrokeSpec, DropShadowEffect, InnerShadowEffect, BlurEffect, GlowEffect,
  OutlineEffect, ColorAdjustEffect, NoiseEffect, Effect, BlendMode,
  ClipSpec, MaskSpec, Constraints, Transform,
  TextStyle, TextRun, ParagraphStyle,
  PathCommand, PathGeometry,
  LayerBaseV2, TextLayerV2, ShapeLayerV2, ImageLayerV2, FrameLayerV2,
  PathLayerV2, IconLayerV2, BooleanGroupLayerV2, GroupLayerV2,
  LayerV2, DesignDocumentV2,
} from "./schema";

export {
  BLEND_MODE_TO_COMPOSITE,
  transformToMatrix, transformToAABB,
  createDocumentV2, createTextLayerV2, createShapeLayerV2,
  createImageLayerV2, createFrameLayer, createIconLayerV2,
  createPathLayerV2, createGroupLayerV2,
  getLayer, getChildren, addLayer, removeLayer, updateLayer,
  reorderLayerV2, getLayerOrder, duplicateLayerV2,
  solidPaint, solidPaintHex, hexToRGBA, rgbaToHex,
} from "./schema";

// ---- Command System ----
export type { Command, CommandEntry, CommandStackState } from "./commands";
export {
  createCommandStack, executeCommand, undo, redo, canUndo, canRedo, getHistory,
  createMoveCommand, createResizeCommand, createUpdateCommand,
  createAddLayerCommand, createDeleteCommand, createReorderCommand,
  createDuplicateCommand, createBatchCommand,
} from "./commands";

// ---- Renderer ----
export {
  renderDocumentV2, drawSelectionHandlesV2, renderToCanvas,
} from "./renderer";
export type { RenderOptions } from "./renderer";

// ---- Hit Testing ----
export {
  hitTestDocument, hitTestHandles,
  SpatialIndex,
} from "./hit-test";
export type { HandleDirection, HitResult } from "./hit-test";

// ---- Design Rules ----
export {
  rgbaToHSL, relativeLuminance, contrastRatio,
  isWCAG_AA, isWCAG_AA_Large, isWCAG_AAA,
  getReadableColor, generateHarmony, colorsClash, generateTintLadder,
  MODULAR_SCALES, generateTypeScale, MIN_FONT_SIZES, LINE_HEIGHT_RANGES,
  recommendedLetterSpacing, checkTextReadability,
  SPACING_UNIT, snapToGrid, GOLDEN_RATIO, goldenSplit,
  PRINT_MARGINS, ruleOfThirds, isInSafeArea,
  HIERARCHY_LEVELS, visualWeight, calculateBalance,
  STANDARD_SIZES, mmToPx, pxToMm,
  validateDesign, PROPERTY_RANGES, clampToRange,
} from "./design-rules";
export type { RuleViolation } from "./design-rules";

// ---- AI Patch Protocol ----
export type {
  RevisionScope, PatchOp, PatchResult,
  IntentType, EditIntent, LayerTarget,
  AIRevisionResponse,
} from "./ai-patch";
export {
  validateAndApplyPatch, intentToPatchOps, processIntent,
  resolveTarget, parseAIRevisionResponse, buildAIPatchPrompt,
} from "./ai-patch";

// ---- Interaction Engine ----
export type {
  PointerPhase, InteractionState, ViewportTransform,
  InteractionResult, KeyAction,
} from "./interaction";
export {
  createInteractionState, screenToWorld, worldToScreen,
  handlePointerDown, handlePointerMove, handlePointerUp,
  handleKeyAction,
} from "./interaction";

// ---- v1 → v2 Migration Bridge ----
export type { MigrationOptions } from "./v1-migration";
export {
  migrateDocumentV1toV2,
  extractTextFromV2, extractColorsFromV2, getTextLayersByTag,
  mapFontFamily, mapAlign,
  convertTextLayer, convertShapeLayer, convertImageLayer,
  convertCtaLayer, convertDecorativeLayer, convertGroupLayer,
} from "./v1-migration";

// ---- Alignment & Distribution ----
export {
  createAlignCommand, createDistributeCommand,
  createSpaceEvenlyCommand, createFlipCommand,
} from "./align-distribute";

// ---- Smart Snapping ----
export type { SnapConfig, SnapGuide, SnapResult } from "./snapping";
export {
  snapLayer, snapResize, drawSnapGuides,
  DEFAULT_SNAP_CONFIG,
} from "./snapping";

// ---- Parametric Template Generator ----
export type {
  SlotName, SlotSpec, LayoutRecipe, AccentLayer, AccentKit, CardTheme, GenerateParams,
} from "./template-generator";
export {
  LAYOUT_RECIPES, LAYOUT_RECIPE_MAP,
  ACCENT_KITS, ACCENT_KIT_MAP,
  CARD_THEMES, CARD_THEME_MAP,
  generateCardDocument,
  getCombinationCount, getRecipesForStyle, getThemesByMood, getThemesByCategory,
  suggestCombination, applyThemeToConfig,
} from "./template-generator";

// ---- Abstract Asset Library ----
export type {
  AbstractCategory, AbstractAssetType, AbstractMood,
  AbstractCustomizable, AbstractColorRoles, AbstractBuildParams,
  AbstractAsset, AbstractLayerConfig,
} from "./abstract-library";
export {
  ABSTRACT_ASSETS, ABSTRACT_REGISTRY,
  ABSTRACT_CATEGORIES, ABSTRACT_CATEGORY_LABELS,
  getAllAbstractIds, getAbstractsByCategory, getAbstractsByMood,
  getAbstractsByType, searchAbstractAssets, buildAbstractAsset,
  getAbstractListForAI, getAbstractCountByCategory,
} from "./abstract-library";
