// Minimal in-memory store for scripts and runs (MVP)
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

// Simple in-memory stores
const scriptsStore = new Map<string, Script>();
const runsStore = new Map<string, Run>();

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

export const getRun = (id: string): Run | undefined => runsStore.get(id);

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
  // Start simulated run asynchronously
  simulateRun(run);
  return run;
};

// Simulated run: sequentially "execute" steps with delays
async function simulateRun(run: Run) {
  try {
    const script = scriptsStore.get(run.scriptId);
    const parsed: any = script ? JSON.parse(script.content) : null;
    const stepActions: string[] = parsed?.steps?.map((s: any) => s.action) ?? [];

    // For each step: wait, then mark as passed or failed
    for (let i = 0; i < stepActions.length; i++) {
      const actionName = stepActions[i];
      // simulate delay
      const durationMs = 350 + Math.floor(Math.random() * 900);
      await sleep(durationMs);

      // Determine outcome
      const stepDef = parsed.steps[i] || {};
      const shouldFail = !!stepDef.shouldFail;
      const status: RunStepState['status'] = shouldFail ? 'failed' : 'passed';
      // Update run step
      run.steps[i] = {
        action: actionName,
        status,
        durationMs,
        screenshot: PLACEHOLDER_SNAPSHOT,
        errorMessage: shouldFail ? 'Simulated failure for MVP' : undefined
      };
      run.logs.push(`Step ${i + 1} (${actionName}) -> ${status}`);
      // If failed and not continueOnError, stop
      if (status === 'failed' && !(parsed.settings?.continueOnError)) {
        run.status = 'failed';
        runsStore.set(run.id, run);
        return;
      }
      // Persist interim state
      runsStore.set(run.id, run);
    }

    // All steps processed
    run.status = run.status === 'running' ? 'completed' : run.status;
    runsStore.set(run.id, run);
  } catch (err: any) {
    run.status = 'failed';
    run.logs.push(`Runner error: ${err?.message ?? String(err)}`);
    runsStore.set(run.id, run);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}