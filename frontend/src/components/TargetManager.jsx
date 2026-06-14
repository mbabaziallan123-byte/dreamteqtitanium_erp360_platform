import React, { useState } from 'react';

/**
 * DreamTeQ Target Manager
 * Allows platform administrators to add new agricultural portals to the
 * monitoring queue and track sync history in real time.
 *
 * TODO (production): Replace mock handlers with real API calls to
 * POST /api/v1/dreamteq-scraper/targets and GET /api/v1/dreamteq-scraper/targets
 */
export default function TargetManager() {
  const [targets, setTargets] = useState([
    { id: 1, url: 'https://agra.org',      goal: 'Extract agri grants.',   status: 'Active', lastSync: '2026-06-15' },
    { id: 2, url: 'https://sadc.int',      goal: 'Extract SADC tenders.',  status: 'Active', lastSync: '2026-06-14' },
    { id: 3, url: 'https://kilimo.go.ke',  goal: 'Extract supply bids.',   status: 'Active', lastSync: '2026-06-13' },
  ]);
  const [newUrl,    setNewUrl]    = useState('');
  const [newGoal,   setNewGoal]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,     setError]     = useState('');

  const handleAddTarget = async (e) => {
    e.preventDefault();
    if (!newUrl || !newGoal) return;
    setError('');
    setSubmitting(true);

    const newEntry = {
      id:       Date.now(),
      url:      newUrl,
      goal:     newGoal,
      status:   'Active',
      lastSync: 'Pending',
    };

    try {
      // Production: replace with real POST call
      // await fetch('/api/v1/dreamteq-scraper/targets', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ target_url: newUrl, extraction_goal: newGoal }),
      // });
      setTargets((prev) => [...prev, newEntry]);
      setNewUrl('');
      setNewGoal('');
    } catch (err) {
      setError(`Failed to add target: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveTarget = (id) => {
    setTargets((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm mt-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">DreamTeQ Target Manager</h2>
        <p className="text-xs text-gray-500">
          Inject new scraping targets dynamically into the automation queue.
        </p>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleAddTarget}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200"
      >
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
            Source Target URL
          </label>
          <input
            type="url"
            required
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="w-full p-2 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder="https://example-agri.com"
            disabled={submitting}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
            AI Extraction Goal
          </label>
          <input
            type="text"
            required
            minLength={5}
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            className="w-full p-2 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder="Extract grain prices"
            disabled={submitting}
          />
        </div>
        {error && (
          <p className="md:col-span-3 text-xs text-red-600">{error}</p>
        )}
        <div className="md:col-span-3 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded transition"
          >
            {submitting ? 'Adding...' : '+ Append Monitoring Target'}
          </button>
        </div>
      </form>

      {/* Active Targets Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100 text-xs font-bold text-gray-500 uppercase">
              <th className="p-3">Target Portal</th>
              <th className="p-3">Extraction Context</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last Crawl</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {targets.map((target) => (
              <tr key={target.id} className="hover:bg-gray-50/50">
                <td className="p-3 font-medium text-gray-900 truncate max-w-xs">
                  <a
                    href={target.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:underline"
                  >
                    {target.url}
                  </a>
                </td>
                <td className="p-3 text-xs text-gray-500">{target.goal}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                    {target.status}
                  </span>
                </td>
                <td className="p-3 text-xs font-mono text-gray-400">{target.lastSync}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleRemoveTarget(target.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition"
                    title="Remove target"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {targets.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-6">
            No monitoring targets configured yet.
          </p>
        )}
      </div>
    </div>
  );
}
