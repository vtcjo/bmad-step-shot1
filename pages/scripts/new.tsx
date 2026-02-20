import { useState } from 'react';
import { useRouter } from 'next/router';

export default function NewScript() {
  const router = useRouter();
  const [name, setName] = useState('Untitled Script');
  const [content, setContent] = useState<string>(JSON.stringify({ steps: [
    { action: "open", target: "https://example.com" },
    { action: "waitForSelector", selector: "#main" }
  ]}, null, 2));

  const onSave = async () => {
    // Basic validation: content should be valid JSON with steps
    try {
      const parsed = JSON.parse(content);
      if (!parsed.steps || !Array.isArray(parsed.steps)) {
        alert('Invalid script: missing steps array.');
        return;
      }
    } catch (e) {
      alert('Invalid JSON');
      return;
    }
    const res = await fetch('/api/scripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content })
    });
    if (res.ok) {
      router.push('/');
    } else {
      alert('Failed to save script');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold mb-4">Create Script</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Script JSON</label>
          <textarea
            className="w-full h-40 border rounded px-3 py-2 font-mono text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-4">
        <button onClick={onSave} className="px-4 py-2 bg-blue-600 text-white rounded">Save Script</button>
      </div>

      <div className="mt-6 p-4 border rounded bg-gray-50">
        <div className="text-sm text-gray-700">
          Validation: the editor validates JSON syntax and requires a steps array in the root object.
        </div>
      </div>
    </div>
  );
}