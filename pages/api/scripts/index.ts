import type { NextApiRequest, NextApiResponse } from 'next';
import { createScript, listScripts, seedExampleScript } from '../../lib/store';

seedExampleScript();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const scripts = listScripts();
    res.status(200).json({ scripts });
    return;
  }

  if (req.method === 'POST') {
    const { name, content } = req.body;
    if (!name || !content) {
      res.status(400).json({ error: 'Missing name or content' });
      return;
    }

    // Basic validation of JSON
    try {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed.steps)) {
        res.status(400).json({ error: 'Script must contain steps array' });
        return;
      }
    } catch (e) {
      res.status(400).json({ error: 'Content must be valid JSON' });
      return;
    }

    const script = createScript(name, content);
    res.status(201).json(script);
    return;
  }

  res.status(405).end();
}