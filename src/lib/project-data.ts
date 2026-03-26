// =============================================================================
// DMSuite — Project Data Service
// IndexedDB-backed storage for per-project workspace data snapshots.
// Each project gets its own data slot, completely isolated.
// =============================================================================

const DB_NAME = "dmsuite-projects-db";
const DB_VERSION = 1;
const STORE_NAME = "project-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Serialized workspace snapshot stored per project */
export interface ProjectSnapshot {
  projectId: string;
  toolId: string;
  /** Full serialized workspace state (tool-specific shape) */
  data: Record<string, unknown>;
  /** ISO timestamp of last save */
  savedAt: string;
  /** Byte size estimate for storage management */
  sizeBytes: number;
}

// ---------------------------------------------------------------------------
// IndexedDB Helpers
// ---------------------------------------------------------------------------

let _dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "projectId" });
        store.createIndex("toolId", "toolId", { unique: false });
        store.createIndex("savedAt", "savedAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      _dbPromise = null;
      reject(request.error);
    };
  });

  return _dbPromise;
}

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------

/** Save a full project data snapshot */
export async function saveProjectData(
  projectId: string,
  toolId: string,
  data: Record<string, unknown>
): Promise<void> {
  const db = await openDB();
  const serialized = JSON.stringify(data);
  const snapshot: ProjectSnapshot = {
    projectId,
    toolId,
    data,
    savedAt: new Date().toISOString(),
    sizeBytes: new Blob([serialized]).size,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(snapshot);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Load a project's data snapshot. Returns null if not found. */
export async function loadProjectData(
  projectId: string
): Promise<ProjectSnapshot | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(projectId);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

/** Delete a project's data snapshot */
export async function deleteProjectData(projectId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(projectId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** List all snapshots for a given tool (for project picker) */
export async function listProjectDataByTool(
  toolId: string
): Promise<ProjectSnapshot[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const index = tx.objectStore(STORE_NAME).index("toolId");
    const req = index.getAll(toolId);
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

/** Get total storage used across all projects (bytes) */
export async function getStorageUsage(): Promise<{
  totalBytes: number;
  projectCount: number;
}> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const all = (req.result ?? []) as ProjectSnapshot[];
      resolve({
        totalBytes: all.reduce((sum, s) => sum + (s.sizeBytes || 0), 0),
        projectCount: all.length,
      });
    };
    req.onerror = () => reject(req.error);
  });
}

/** Delete all project data for a specific tool */
export async function clearToolData(toolId: string): Promise<void> {
  const snapshots = await listProjectDataByTool(toolId);
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  for (const s of snapshots) {
    store.delete(s.projectId);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Duplicate a project's data to a new project ID */
export async function duplicateProjectData(
  sourceProjectId: string,
  targetProjectId: string,
  targetToolId?: string
): Promise<boolean> {
  const source = await loadProjectData(sourceProjectId);
  if (!source) return false;
  await saveProjectData(
    targetProjectId,
    targetToolId ?? source.toolId,
    structuredClone(source.data)
  );
  return true;
}

// ---------------------------------------------------------------------------
// Migration: Import existing global localStorage data into a project slot
// ---------------------------------------------------------------------------

/** Known tool-specific localStorage keys and their tool IDs */
const LEGACY_STORE_KEYS: Record<string, string> = {
  "dmsuite-resume": "resume-cv",
  "dmsuite-contract": "contract-template",
  "dmsuite-invoice": "invoice-designer",
  "dmsuite-sales-book": "sales-book",
};

/**
 * Migrate legacy global localStorage data into a project's IndexedDB slot.
 * Only migrates ONCE per tool (the first project gets the legacy data).
 * Subsequent projects are always fresh. This prevents the Zustand persist
 * middleware's live localStorage data from being copied into new projects.
 * Returns true if migration occurred.
 */
export async function migrateLegacyData(
  projectId: string,
  toolId: string
): Promise<boolean> {
  // Only migrate once per tool — persist middleware keeps writing to the same
  // localStorage key, so subsequent reads would return the *current* project's
  // data, not genuine legacy data.
  const migrationFlag = `_dmsuite_migrated_${toolId}`;
  if (typeof localStorage !== "undefined" && localStorage.getItem(migrationFlag)) {
    return false;
  }

  // Check if project already has data
  const existing = await loadProjectData(projectId);
  if (existing) return false;

  // Find legacy key for this tool
  const legacyKey = Object.entries(LEGACY_STORE_KEYS).find(
    ([, tid]) => tid === toolId
  )?.[0];
  if (!legacyKey) return false;

  try {
    const raw = localStorage.getItem(legacyKey);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    // Zustand persist wraps in { state: ..., version: ... }
    const data = parsed?.state ?? parsed;
    if (!data || typeof data !== "object") return false;

    await saveProjectData(projectId, toolId, data as Record<string, unknown>);
    // Mark migration as done for this tool so it never runs again
    localStorage.setItem(migrationFlag, new Date().toISOString());
    return true;
  } catch {
    return false;
  }
}
