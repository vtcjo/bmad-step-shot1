import type { NextApiRequest, NextApiResponse } from 'next';
import { getRun } from '../../../../lib/store';

function htmlEscape(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function generateHtmlReport(run: any) {
  const stepsRows = run.steps
    .map((s: any, i: number) => {
      const status = s.status;
      const row = `
        <tr>
          <td style="border:1px solid #ddd;padding:8px;">${i + 1}</td>
          <td style="border:1px solid #ddd;padding:8px;">${htmlEscape(s.action)}</td>
          <td style="border:1px solid #ddd;padding:8px;"><span>${status}</span></td>
          <td style="border:1px solid #ddd;padding:8px;">${s.durationMs ?? ''} ms</td>
          <td style="border:1px solid #ddd;padding:8px;">
            ${s.errorMessage ? `<span style="color:#a00">${htmlEscape(s.errorMessage)}</span>` : ''}
          </td>
          <td style="border:1px solid #ddd;padding:8px;">
            ${s.screenshot ? `<img src="${s.screenshot}" width="160" height="90" />` : ''}
          </td>
        </tr>
      `;
      return row;
    })
    .join('');

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"/><title>StepShot Report</title></head>
  <body>
    <h1>StepShot Report</h1>
    <p>Run ID: ${escapeHtml(run.id)}</p>
    <p>Script: ${escapeHtml(run.scriptId)}</p>
    <p>Started: ${escapeHtml(new Date(run.startedAt).toLocaleString())}</p>
    <h2>Summary</h2>
    <p>Status: ${escapeHtml(run.status)}</p>
    <h2>Steps</h2>
    <table style="border-collapse: collapse;width:100%;">
      <thead>
        <tr>
          <th style="border:1px solid #ddd;padding:8px;">#</th>
          <th style="border:1px solid #ddd;padding:8px;">Action</th>
          <th style="border:1px solid #ddd;padding:8px;">Status</th>
          <th style="border:1px solid #ddd;padding:8px;">Duration</th>
          <th style="border:1px solid #ddd;padding:8px;">Error</th>
          <th style="border:1px solid #ddd;padding:8px;">Artifact</th>
        </tr>
      </thead>
      <tbody>${stepsRows}</tbody>
    </table>
  </body>
  </html>
  `;
  return html;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { runId } = req.query;
  if (!runId || typeof runId !== 'string') {
    res.status(400).json({ error: 'Missing runId' });
    return;
  }

  const run = getRun(runId);
  if (!run) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }

  const format = (req.query.format as string) || 'json';

  if (format === 'html') {
    const html = generateHtmlReport(run);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
    return;
  } else {
    // default JSON
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(run);
    return;
  }
}