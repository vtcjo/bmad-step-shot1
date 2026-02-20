import type { NextApiRequest, NextApiResponse } from 'next';
import { getScript, updateScript, deleteScript } from '../../lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Missing script id' });
    return;
  }

  if (req.method === 'GET') {
    const script = getScript(id);
    if (!script) return res.status(404).json({ error: 'Script not found' });
    res.status(200).json(script);
    return;
  }

  if (req.method === 'PUT') {
    const { name, content } = req.body;
    if (!name || !content) return res.status(400).json({ error: 'Missing fields' });
    const updated = updateScript(id, name, content);
    if (!updated) return res.status(404).json({ error: 'Script not found' });
    res.status(200).json(updated);
    return;
  }

  if (req.method === 'DELETE') {
    const ok = deleteScript(id);
    res.status(ok ? 200 : 404).json({ ok });
    return;
  }

  res.status(405).end();
}