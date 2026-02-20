import Link from 'next/link';
import { useEffect, useState } from 'react';
import { seedExampleScript, listScripts } from '../lib/store';

export default function Home() {
  useEffect(() => {
    seedExampleScript();
  }, []);

  const [scripts, setScripts] = useState<Array<{ id: string; name: string; updatedAt: string; version: number }>>([]);

  useEffect(() => {
    const fetchScripts = async () => {
      const res = await fetch('/api/scripts');
      const data = await res.json();
      setScripts(data.scripts ?? []);
    };
    fetchScripts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold">StepShot MVP</h1>
          <p className="text-sm text-gray-600">JSON-script-driven Selenium-like runner (simulated)</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Scripts</h2>
          <Link href="/scripts/new">
            <a className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">New Script</a>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scripts.map((s) => (
            <div key={s.id} className="border rounded p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">{s.name}</div>
                <span className="text-xs text-gray-500">v{s.version}</span>
              </div>
              <div className="text-xs text-gray-500 mb-2">Updated: {new Date(s.updatedAt).toLocaleString()}</div>
              <div className="flex items-center gap-2">
                <Link href={`/scripts/${s.id}`}>
                  <a className="px-2 py-1 bg-green-500 text-white rounded-sm text-xs">Edit</a>
                </Link>
                <RunButton scriptId={s.id} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function RunButton({ scriptId }: { scriptId: string }) {
  const [loading, setLoading] = useState(false);

  const onRun = async () => {
    setLoading(true);
    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptId })
    });
    const data = await res.json();
    setLoading(false);
    if (data?.runId) {
      window.location.href = `/run/${data.runId}`;
    } else {
      alert('Failed to start run.');
    }
  };

  return (
    <button
      onClick={onRun}
      className="px-3 py-1 bg-indigo-600 text-white rounded-sm text-xs hover:bg-indigo-700"
      disabled={loading}
      aria-label="Run script"
    >
      {loading ? 'Starting...' : 'Run'}
    </button>
  );
}