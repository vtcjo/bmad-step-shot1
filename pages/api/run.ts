import type { NextApiRequest, NextApiResponse } from 'next';
import { getScript, createRun } from '../../lib/store';
import { startRealDriverRun } from '../../lib/runner';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { scriptId } = req.body;
  if (!scriptId || typeof scriptId !== 'string') {
    res.status(400).json({ error: 'Missing or invalid scriptId' });
    return;
  }

  const script = getScript(scriptId);
  if (!script) {
    res.status(404).json({ error: 'Script not found' });
    return;
  }

  // Parse steps/actions from the script content
  let steps: string[] = [];
  try {
    const parsed = JSON.parse(script.content);
    steps = parsed?.steps?.map((s: any) => s.action) ?? [];
  } catch {
    steps = [];
  }

  const run = createRun(scriptId, steps);
  
  // Start the runner asynchronously (don't await - respond immediately)
  // Wrap in try-catch to handle any synchronous errors
  try {
    startRealDriverRun(run).catch((err) => {
      console.error('[API] Runner failed:', err);
      run.status = 'failed';
      run.logs.push(`Runner failed to start: ${err?.message ?? String(err)}`);
    });
  } catch (err) {
    console.error('[API] Failed to start runner:', err);
  }
  
  res.status(200).json({ runId: run.id });
}