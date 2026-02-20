import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getRun } from '../../lib/store';

function StatusBadge({ s }: { s: string }) {
  const color =
    s === 'passed' ? 'bg-green-500' : s === 'failed' ? 'bg-red-500' : s === 'skipped' ? 'bg-yellow-500' : 'bg-gray-400';
  return <span className={`text-white text-xs px-2 py-1 rounded ${color}`}>{s}</span>;
}

export default function RunView() {
  const router = useRouter();
  const { runId } = router.query;
  const [run, setRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!runId) return;
    const fetchRun = async () => {
      const res = await fetch(`/api/run/${runId}`);
      const data = await res.json();
      setRun(data);
      setLoading(false);
    };
    fetchRun();

    // Poll for updates
    const t = setInterval(async () => {
      const res = await fetch(`/api/run/${runId}`);
      const data = await res.json();
      setRun(data);
      if (data?.status && data.status !== 'running') {
        clearInterval(t);
      }
    }, 1000);

    return () => clearInterval(t);
  }, [runId]);

  if (loading || !run) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div>Loading run...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold mb-3">Run Details</h2>
      <div className="mb-4 text-sm text-gray-700">
        Run ID: {run.id} • Script: {run.scriptId} • Started: {new Date(run.startedAt).toLocaleString()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-3 bg-white">
          <h3 className="font-semibold mb-2">Progress</h3>
          <div className="space-y-2">
            {run.steps.map((st: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{idx + 1}.</span>
                  <span className="text-sm">{st.action}</span>
                </div>
                <StatusBadge s={st.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded p-3 bg-white">
          <h3 className="font-semibold mb-2">Artifacts</h3>
          <div className="space-y-2">
            {run.steps.map((st: any, idx: number) =>
              st.screenshot ? (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{idx + 1}</span>
                  <img src={st.screenshot} alt={`step-${idx + 1}`} width={160} height={90} />
                </div>
              ) : null
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <a
          href={`/api/run/${run.id}/report?format=html`}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Download HTML Report
        </a>
        <a
          href={`/api/run/${run.id}/report?format=json`}
          className="px-4 py-2 bg-gray-700 text-white rounded"
        >
          Download JSON Report
        </a>
      </div>

      <div className="mt-4 p-3 text-sm text-gray-600 border rounded bg-gray-50">
        Note: This MVP uses a simulated runner. In a full deployment, Selenium WebDriver-backed execution would occur here.
      </div>
    </div>
  );
}