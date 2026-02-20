// Server-side only: WebDriver-backed runner
// This file should ONLY be imported by API routes, never by client-side pages

import type { Run, RunStepState } from './store';
import { getScript, updateRunState } from './store';

// Generate a simple colored placeholder screenshot with step info
function generatePlaceholderScreenshot(stepNum: number, action: string): string {
  // Create a simple SVG as base64
  const svg = `
    <svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="180" fill="#f3f4f6"/>
      <text x="160" y="80" font-family="Arial" font-size="16" fill="#6b7280" text-anchor="middle">
        Simulated Screenshot
      </text>
      <text x="160" y="105" font-family="Arial" font-size="14" fill="#9ca3af" text-anchor="middle">
        Step ${stepNum}: ${action}
      </text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// Attempt to run a real WebDriver-backed runner. Falls back to simulateRun if WebDriver isn't available.
export async function startRealDriverRun(run: Run) {
  console.log(`[Runner] Starting run ${run.id} with ${run.steps.length} steps`);
  
  // Check if selenium-webdriver is available
  let webdriver: any;
  try {
    webdriver = require('selenium-webdriver');
  } catch (e) {
    console.log(`[Runner] selenium-webdriver not found, using simulation`);
    simulateRun(run);
    return;
  }
  
  try {
    const script = getScript(run.scriptId);
    const parsed: any = script ? JSON.parse(script.content) : null;
    const stepActions: string[] = parsed?.steps?.map((s: any) => s.action) ?? [];

    // Resolve capabilities from script or default
    const browser = (parsed?.settings?.browser ?? 'chrome').toString().toLowerCase();
    const headless = parsed?.settings?.headless ?? true;
    const continueOnError = !!parsed?.settings?.continueOnError;

    console.log(`[Runner] Attempting to initialize WebDriver (${browser}, headless: ${headless})`);
    
    const By = webdriver.By;
    const until = webdriver.until;
    const chromeModule = require('selenium-webdriver/chrome');
    const firefoxModule = require('selenium-webdriver/firefox');
    
    // Set up ChromeDriver path (it should be in node_modules)
    if (browser === 'chrome') {
      try {
        const chromedriverPath = require('chromedriver').path;
        process.env.PATH = process.env.PATH + ';' + require('path').dirname(chromedriverPath);
        console.log(`[Runner] ChromeDriver found at: ${chromedriverPath}`);
      } catch (e) {
        console.log(`[Runner] ChromeDriver package not found, using system PATH`);
      }
    }

    let driver: any = null;

    try {
      if (browser === 'firefox') {
        const options = new firefoxModule.Options();
        if (headless) options.headless();
        driver = await new webdriver.Builder()
          .forBrowser('firefox')
          .setFirefoxOptions(options)
          .build();
      } else {
        const options = new chromeModule.Options();
        if (headless) options.headless();
        
        // Add common Chrome arguments for better compatibility
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');
        
        driver = await new webdriver.Builder()
          .forBrowser('chrome')
          .setChromeOptions(options)
          .build();
      }
      console.log(`[Runner] WebDriver initialized successfully`);
    } catch (driverError: any) {
      console.log(`[Runner] Failed to build WebDriver: ${driverError.message}, falling back to simulation`);
      throw driverError; // This will trigger the outer catch
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
        updateRunState(run);

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
        updateRunState(run);

        if (!continueOnError) {
          run.status = 'failed';
          updateRunState(run);
          try { driver.quit(); } catch {}
          return;
        }
      }
    }

    // All steps processed
    if (run.status === 'running') {
      run.status = 'completed';
    }
    updateRunState(run);
    try {
      // Best-effort cleanup
      await driver?.quit();
    } catch {
      // ignore
    }
  } catch (e: any) {
    // WebDriver path failed entirely; fallback to simulate
    console.log(`[Runner] WebDriver initialization failed, falling back to simulation:`, e?.message);
    run.logs.push(`WebDriver path failed to initialize: ${e?.message ?? String(e)}`);
    updateRunState(run);
    simulateRun(run);
  }
}

// Fallback simulated runner (preserved for environments without WebDriver)
async function simulateRun(run: Run) {
  console.log(`[Runner] Starting simulated run for ${run.id}`);
  try {
    const script = getScript(run.scriptId);
    const parsed: any = script ? JSON.parse(script.content) : null;
    const stepActions: string[] = parsed?.steps?.map((s: any) => s.action) ?? [];

    // For each step: wait, then mark as passed or failed
    for (let i = 0; i < stepActions.length; i++) {
      const actionName = stepActions[i];
      console.log(`[Runner] Simulating step ${i + 1}/${stepActions.length}: ${actionName}`);
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
        screenshot: generatePlaceholderScreenshot(i + 1, actionName),
        errorMessage: shouldFail ? 'Simulated failure for MVP' : undefined
      };
      run.logs.push(`Step ${i + 1} (${actionName}) -> ${status}`);
      // If failed and not continueOnError, stop
      if (status === 'failed' && !(parsed.settings?.continueOnError)) {
        run.status = 'failed';
        updateRunState(run);
        return;
      }
      // Persist interim state
      updateRunState(run);
    }

    // All steps processed
    run.status = run.status === 'running' ? 'completed' : run.status;
    updateRunState(run);
    console.log(`[Runner] Simulation completed for ${run.id}, status: ${run.status}`);
  } catch (err: any) {
    console.error(`[Runner] Simulation error:`, err);
    run.status = 'failed';
    run.logs.push(`Runner error: ${err?.message ?? String(err)}`);
    updateRunState(run);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
