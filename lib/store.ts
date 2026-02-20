// Minimal in-memory store for scripts and runs (MVP)
// Note: WebDriver runner logic is in lib/runner.ts (server-side only)

export type Step = {
  action: string;
  target?: string;
  selector?: string;
  text?: string;
  shouldFail?: boolean;
  waitForSelector?: string;
};

export type Script = {
  id: string;
  name: string;
  content: string; // JSON string
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type RunStepState = {
  action: string;
  status: 'pending' | 'passed' | 'failed' | 'skipped';
  durationMs?: number;
  screenshot?: string;
  errorMessage?: string;
};

export type Run = {
  id: string;
  scriptId: string;
  startedAt: string;
  status: 'running' | 'completed' | 'failed';
  steps: RunStepState[];
  logs: string[];
};

const PLACEHOLDER_SNAPSHOT =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMBgZ5k6F0AAAAASUVORK5CYII=";

// Preserve stores across hot reloads in development
declare global {
  var scriptsStore: Map<string, Script> | undefined;
  var runsStore: Map<string, Run> | undefined;
}

// Simple in-memory stores that survive hot reloads
const scriptsStore = global.scriptsStore || new Map<string, Script>();
const runsStore = global.runsStore || new Map<string, Run>();

// Store in global to preserve across hot reloads
if (process.env.NODE_ENV !== 'production') {
  global.scriptsStore = scriptsStore;
  global.runsStore = runsStore;
}

// Utility helpers
const now = () => new Date().toISOString();
const generateId = () =>
  Math.random().toString(36).slice(2, 9) +
  "-" +
  Math.random().toString(36).slice(2, 6);

export const seedExampleScript = () => {
  if (scriptsStore.size > 0) return;
  const id = generateId();
  const contentObj = {
    steps: [
      { action: "open", target: "https://example.com" },
      { action: "click", selector: "#login" },
      { action: "type", selector: "#username", text: "user@example.com" },
      { action: "type", selector: "#password", text: "hunter2" },
      { action: "click", selector: "#submit" },
      { action: "waitForSelector", selector: "#dashboard" }
    ],
    settings: { continueOnError: false }
  };
  const content = JSON.stringify(contentObj, null, 2);
  const nowIso = now();
  const script: Script = {
    id,
    name: "Example Script",
    content,
    version: 1,
    createdAt: nowIso,
    updatedAt: nowIso
  };
  scriptsStore.set(id, script);
};

// Script operations
export const listScripts = (): Script[] => Array.from(scriptsStore.values());

export const getScript = (id: string): Script | undefined =>
  scriptsStore.get(id);

export const createScript = (name: string, content: string): Script => {
  const id = generateId();
  const nowIso = now();
  const script: Script = {
    id,
    name,
    content,
    version: 1,
    createdAt: nowIso,
    updatedAt: nowIso
  };
  scriptsStore.set(id, script);
  return script;
};

export const updateScript = (id: string, name: string, content: string): Script | undefined => {
  const s = scriptsStore.get(id);
  if (!s) return undefined;
  s.name = name;
  s.content = content;
  s.version += 1;
  s.updatedAt = now();
  scriptsStore.set(id, s);
  return s;
};

export const deleteScript = (id: string): boolean => scriptsStore.delete(id);

export const getRun = (id: string): Run | undefined => {
  const run = runsStore.get(id);
  console.log(`[Store] getRun(${id}):`, run ? 'found' : 'NOT FOUND', `(store size: ${runsStore.size})`);
  return run;
};

export const createRun = (scriptId: string, steps: string[]): Run => {
  const id = generateId();
  const startedAt = now();
  const initialSteps: RunStepState[] = steps.map((s) => ({
    action: s,
    status: 'pending'
  }));
  const run: Run = {
    id,
    scriptId,
    startedAt,
    status: 'running',
    steps: initialSteps,
    logs: []
  };
  runsStore.set(id, run);
  console.log(`[Store] createRun(${id}): Created run (store size: ${runsStore.size})`);
  // Note: Runner execution is triggered by API route via lib/runner.ts
  return run;
};

// Update an existing run's state (used by runner)
export const updateRunState = (run: Run): void => {
  runsStore.set(run.id, run);
};