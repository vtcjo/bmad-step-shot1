// Minimal in-memory store for scripts and runs (MVP) with optional WebDriver-backed runner.
// This patch adds a WebDriver-backed runner path and falls back to simulateRun if drivers are unavailable.

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
  // Start WebDriver-backed runner if available; fallback to simulated runner.
  startRealDriverRun(run);
  return run;
};

// Attempt to run a real WebDriver-backed runner. Falls back to simulateRun if WebDriver isn't available.
async function startRealDriverRun(run: Run) {
  try {
    const script = scriptsStore.get(run.scriptId);
    const parsed: any = script ? JSON.parse(script.content) : null;
    const stepActions: string[] = parsed?.steps?.map((s: any) => s.action) ?? [];

    // Resolve capabilities from script or default
    const browser = (parsed?.settings?.browser ?? 'chrome').toString().toLowerCase();
    const headless = parsed?.settings?.headless ?? true;
    const continueOnError = !!parsed?.settings?.continueOnError;

    // Lazy require to avoid breaking environments without drivers installed
    const webdriver = require('selenium-webdriver');
    const By = webdriver.By;
    const until = webdriver.until;
    const chromeModule = require('selenium-webdriver/chrome');
    const firefoxModule = require('selenium-webdriver/firefox');

    let driver: any = null;

    if (browser === 'firefox') {
      const options = new firefoxModule.Options();
      if (headless) options.headless();
      driver = new webdriver.Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .build();
    } else {
      const options = new chromeModule.Options();
      if (headless) options.headless();
      driver = new webdriver.Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    }

    // Execute steps sequentially
    for (let i = 0; i < stepActions.length; i++) {
      const actionName = stepActions[i];
      const stepDef = (parsed?.steps?.[i] as any) ?? {};
      const t0 = Date.now();

      try {
        switch (actionName) {
          case 'open':
            if (stepDef.target) {
              await driver.get(stepDef.target);
            } else {
              throw new Error('Missing target for open');
            }
            break;
          case 'click': {
            if (!stepDef.selector) throw new Error('Missing selector for click');
            const el = await driver.findElement(By.css(stepDef.selector));
            await el.click();
            break;
          }
          case 'type': {
            if (!stepDef.selector) throw new Error('Missing selector for type');
            const el = await driver.findElement(By.css(stepDef.selector));
            await el.sendKeys(stepDef.text ?? '');
            break;
          }
          case 'waitForSelector': {
            if (!stepDef.selector) throw new Error('Missing selector for waitForSelector');
            await driver.wait(until.elementLocated(By.css(stepDef.selector)), 10000);
            break;
          }
          default:
            // Unknown action: treat as pass with a log
            run.logs.push(`Step ${i + 1}: Unknown action "${actionName}" - skipping`);
        }

        // Take a screenshot after each step
        let base64: string | undefined;
        try {
          base64 = await driver.takeScreenshot();
        } catch {
          base64 = undefined;
        }

        const durationMs = Date.now() - t0;
        run.steps[i] = {
          action: actionName,
          status: 'passed',
          durationMs,
          screenshot: base64 ? `data:image/png;base64,${base64}` : undefined
        };

        run.logs.push(`Step ${i + 1} (${actionName}) -> passed`);
        // Persist interim state
        runsStore.set(run.id, run);

        // If continueOnError is false, we proceed; catch blocks handle failures per-step
      } catch (err: any) {
        const durationMs = Date.now() - t0;
        run.steps[i] = {
          action: actionName,
          status: 'failed',
          durationMs,
          errorMessage: err?.message ?? String(err),
          screenshot: undefined
        };
        run.logs.push(`Step ${i + 1} (${actionName}) -> failed: ${err?.message ?? String(err)}`);
        runsStore.set(run.id, run);

        if (!continueOnError) {
          run.status = 'failed';
          runsStore.set(run.id, run);
          try { driver.quit(); } catch {}
          return;
        }
      }
    }

    // All steps processed
    if (run.status === 'running') {
      run.status = 'completed';
    }
    runsStore.set(run.id, run);
    try {
      // Best-effort cleanup
      await driver?.quit();
    } catch {
      // ignore
    }
  } catch (e: any) {
    // WebDriver path failed entirely; fallback to simulate
    run.logs.push(`WebDriver path failed to initialize: ${e?.message ?? String(e)}`);
    runsStore.set(run.id, run);
    simulateRun(run);
  }
}

// Fallback simulated runner (preserved for environments without WebDriver)
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