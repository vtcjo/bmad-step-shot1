import type { NextApiRequest, NextApiResponse } from 'next';
import { getRun } from '../../../lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { runId } = req.query;
  if (!runId || typeof runId !== 'string') {
    res.status(400).json({ error: 'Missing runId' });
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const run = getRun(runId);
  if (!run) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }

  res.status(200).json(run);
}