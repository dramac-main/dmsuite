// =============================================================================
// DMSuite — Supabase Project Service
// Server-backed CRUD for project metadata and workspace data snapshots.
// Uses the browser Supabase client with RLS (auth.uid() policies).
// =============================================================================

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Milestone } from "@/stores/projects";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SupabaseProject {
  id: string;
  user_id: string;
  tool_id: string;
  name: string;
  progress: number;
  milestones: string[];
  has_data: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseProjectData {
  project_id: string;
  user_id: string;
  tool_id: string;
  data: Record<string, unknown>;
  saved_at: string;
  size_bytes: number;
}

// ---------------------------------------------------------------------------
// Singleton client
// ---------------------------------------------------------------------------

let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!_client) _client = createClient();
  return _client;
}

// ---------------------------------------------------------------------------
// Guard: skip all Supabase calls when not configured or no auth
// ---------------------------------------------------------------------------

// Cache the auth user ID to avoid repeated session lookups
let _cachedUserId: string | null = null;
let _cacheExpiry = 0;
const AUTH_CACHE_TTL = 60_000; // 60 seconds

async function getAuthUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  // Return cached value if still valid
  if (_cachedUserId && Date.now() < _cacheExpiry) return _cachedUserId;
  try {
    // getSession() reads from memory (no network request) — much faster than getUser()
    const { data } = await getClient().auth.getSession();
    const userId = data.session?.user?.id ?? null;
    if (userId) {
      _cachedUserId = userId;
      _cacheExpiry = Date.now() + AUTH_CACHE_TTL;
    }
    return userId;
  } catch {
    return null;
  }
}

/** Clear the auth cache (call on sign-out) */
export function clearAuthCache() {
  _cachedUserId = null;
  _cacheExpiry = 0;
}

// ---------------------------------------------------------------------------
// Project Metadata CRUD
// ---------------------------------------------------------------------------

/** Fetch all projects for the authenticated user */
export async function fetchUserProjects(): Promise<SupabaseProject[]> {
  const userId = await getAuthUserId();
  if (!userId) return [];

  const { data, error } = await getClient()
    .from("user_projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("[SupabaseProjects] fetchUserProjects error:", error.message);
    return [];
  }
  return data ?? [];
}

/** Fetch projects for a specific tool */
export async function fetchToolProjects(
  toolId: string
): Promise<SupabaseProject[]> {
  const userId = await getAuthUserId();
  if (!userId) return [];

  const { data, error } = await getClient()
    .from("user_projects")
    .select("*")
    .eq("user_id", userId)
    .eq("tool_id", toolId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("[SupabaseProjects] fetchToolProjects error:", error.message);
    return [];
  }
  return data ?? [];
}

/** Create a new project on the server. Returns the project or null. */
export async function createProjectRemote(project: {
  id: string;
  toolId: string;
  name: string;
  milestones: Milestone[];
  progress: number;
}): Promise<SupabaseProject | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  const { data, error } = await getClient()
    .from("user_projects")
    .insert({
      id: project.id,
      user_id: userId,
      tool_id: project.toolId,
      name: project.name,
      progress: project.progress,
      milestones: project.milestones,
      has_data: false,
    })
    .select()
    .single();

  if (error) {
    console.warn("[SupabaseProjects] createProjectRemote error:", error.message);
    return null;
  }
  return data;
}

/** Update project metadata on the server */
export async function updateProjectRemote(
  projectId: string,
  patch: Partial<{
    name: string;
    progress: number;
    milestones: string[];
    has_data: boolean;
  }>
): Promise<boolean> {
  const userId = await getAuthUserId();
  if (!userId) return false;

  const { error } = await getClient()
    .from("user_projects")
    .update(patch)
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) {
    console.warn("[SupabaseProjects] updateProjectRemote error:", error.message);
    return false;
  }
  return true;
}

/** Delete a project and its data from the server */
export async function deleteProjectRemote(projectId: string): Promise<boolean> {
  const userId = await getAuthUserId();
  if (!userId) return false;

  // project_data cascades via FK, so just delete the project
  const { error } = await getClient()
    .from("user_projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) {
    console.warn("[SupabaseProjects] deleteProjectRemote error:", error.message);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Project Data (Workspace Snapshots) CRUD
// ---------------------------------------------------------------------------

/** Save a workspace data snapshot to the server */
export async function saveProjectDataRemote(
  projectId: string,
  toolId: string,
  data: Record<string, unknown>
): Promise<boolean> {
  const userId = await getAuthUserId();
  if (!userId) return false;

  const serialized = JSON.stringify(data);
  const sizeBytes = new Blob([serialized]).size;

  const { error } = await getClient()
    .from("project_data")
    .upsert(
      {
        project_id: projectId,
        user_id: userId,
        tool_id: toolId,
        data,
        saved_at: new Date().toISOString(),
        size_bytes: sizeBytes,
      },
      { onConflict: "project_id" }
    );

  if (error) {
    console.warn("[SupabaseProjects] saveProjectDataRemote error:", error.message);
    return false;
  }

  // Also mark the project as having data
  await updateProjectRemote(projectId, { has_data: true });
  return true;
}

/** Load a workspace data snapshot from the server */
export async function loadProjectDataRemote(
  projectId: string
): Promise<SupabaseProjectData | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  const { data, error } = await getClient()
    .from("project_data")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();

  if (error) {
    // PGRST116 = "no rows returned" — not a real error
    if (error.code !== "PGRST116") {
      console.warn("[SupabaseProjects] loadProjectDataRemote error:", error.message);
    }
    return null;
  }
  return data;
}

/** Delete a project's workspace data from the server */
export async function deleteProjectDataRemote(
  projectId: string
): Promise<boolean> {
  const userId = await getAuthUserId();
  if (!userId) return false;

  const { error } = await getClient()
    .from("project_data")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) {
    console.warn("[SupabaseProjects] deleteProjectDataRemote error:", error.message);
    return false;
  }
  return true;
}

/** Duplicate a project's data to a new project on the server */
export async function duplicateProjectDataRemote(
  sourceProjectId: string,
  targetProjectId: string,
  targetToolId?: string
): Promise<boolean> {
  const source = await loadProjectDataRemote(sourceProjectId);
  if (!source) return false;

  return saveProjectDataRemote(
    targetProjectId,
    targetToolId ?? source.tool_id,
    structuredClone(source.data) as Record<string, unknown>
  );
}
