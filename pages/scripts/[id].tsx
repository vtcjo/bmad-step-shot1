import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { getScript, updateScript, deleteScript, listScripts } from '../../lib/store';

export default function ScriptEditor() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const isNew = id === 'new';

  const [name, setName] = useState<string>('');
  const [content, setContent] = useState<string>('{}');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isNew && id) {
      const fetchScript = async () => {
        const res = await fetch(`/api/scripts/${id}`);
        if (res.ok) {
          const data = await res.json();
          setName(data.name);
          setContent(data.content);
        } else {
          // fallback
          alert('Script not found');
        }
      };
      fetchScript();
    }
  }, [id, isNew]);

  const onSave = async () => {
    // Validate JSON
    try {
      const parsed = JSON.parse(content);
      if (!parsed.steps || !Array.isArray(parsed.steps)) {
        alert('Invalid script: missing steps array.');
        return;
      }
    } catch {
      alert('Invalid JSON');
      return;
    }

    if (isNew) {
      // create
      const res = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content })
      });
      if (res.ok) router.push('/');
      else alert('Failed to create script');
    } else if (id) {
      // update
      const res = await fetch(`/api/scripts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content })
      });
      if (res.ok) router.push('/');
      else alert('Failed to update script');
    }
  };

  const onRun = async () => {
    // Create run from this script (client triggers via API)
    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptId: id })
    });
    const data = await res.json();
    if (data?.runId) routeToRun(data.runId);
  };

  const routeToRun = (runId: string) => {
    window.location.href = `/run/${runId}`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold mb-4">{isNew ? 'Create Script' : 'Edit Script'}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input className="w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Script JSON</label>
          <textarea
            className="w-full h-48 border rounded px-3 py-2 font-mono text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={onSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Script'}
        </button>
        {!isNew && (
          <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={onRun}>
            Run Script
          </button>
        )}
      </div>

      {!isNew && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <div className="text-sm text-gray-700">
            This editor supports updating an existing script. Versioning is handled on the server.
          </div>
        </div>
      )}
    </div>
  );
}