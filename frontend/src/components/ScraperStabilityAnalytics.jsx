import React, { useState, useEffect } from 'react';

/**
 * DreamTeQ Portal Stability Analytics Dashboard
 * Displays scraping health telemetry across East Africa & SADC targets.
 *
 * Production: fetch real data from GET /api/v1/dreamteq-scraper/analytics
 * which queries the portal_reliability_30d PostgreSQL view.
 */

const MOCK_LOGS = [
  {
    url:         'https://agra.org',
    successRate: 98.4,
    avgSpeed:    '1,240ms',
    stability:   'Excellent',
    totalRuns:   50,
    opsFound:    312,
    trends:      [100, 100, 100, 100, 92, 100, 100],
  },
  {
    url:         'https://sadc.int',
    successRate: 92.1,
    avgSpeed:    '2,150ms',
    stability:   'Stable',
    totalRuns:   38,
    opsFound:    187,
    trends:      [100, 100, 0, 100, 100, 100, 100],
  },
  {
    url:         'https://eagc.org',
    successRate: 86.5,
    avgSpeed:    '3,010ms',
    stability:   'Stable',
    totalRuns:   26,
    opsFound:    94,
    trends:      [100, 100, 100, 0, 100, 100, 0],
  },
  {
    url:         'https://kilimo.go.ke',
    successRate: 54.0,
    avgSpeed:    '4,890ms',
    stability:   'Unstable — Layout Broken',
    totalRuns:   13,
    opsFound:    22,
    trends:      [100, 0, 0, 100, 0, 0, 100],
  },
];

function StabilityBadge({ rate }) {
  const ok = rate >= 85;
  return (
    <span
      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
        ok ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-700'
      }`}
    >
      {ok ? 'Healthy' : 'Degraded'}
    </span>
  );
}

function Sparkline({ trends }) {
  return (
    <div className="flex gap-0.5 items-end h-8 bg-gray-100 px-1 py-1 rounded">
      {trends.map((val, i) => (
        <div
          key={i}
          className={`w-2 rounded-t-sm ${val === 100 ? 'bg-emerald-500 h-6' : 'bg-rose-500 h-2'}`}
          title={val === 100 ? 'Pass' : 'Fail'}
        />
      ))}
    </div>
  );
}

export default function ScraperStabilityAnalytics() {
  const [logs, setLogs]       = useState(MOCK_LOGS);
  const [loading, setLoading] = useState(false);

  // Production fetch — uncomment to replace mock data
  // useEffect(() => {
  //   setLoading(true);
  //   fetch('/api/v1/dreamteq-scraper/analytics')
  //     .then((r) => r.json())
  //     .then(setLogs)
  //     .catch(console.error)
  //     .finally(() => setLoading(false));
  // }, []);

  const globalSLA = logs.length
    ? (logs.reduce((acc, p) => acc + p.successRate, 0) / logs.length).toFixed(1)
    : 0;

  const globalOk = parseFloat(globalSLA) >= 85;

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm mt-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">DreamTeQ Portal Stability Insights</h2>
          <p className="text-xs text-gray-500">
            Real-time health telemetry across monitored agricultural sites — last 30 days.
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded border ${
            globalOk
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          Global SLA: {globalSLA}% {globalOk ? 'Healthy' : 'Degraded'}
        </span>
      </div>

      {loading && (
        <p className="text-xs text-gray-400 text-center py-6">Loading analytics…</p>
      )}

      {/* Portal cards */}
      <div className="grid grid-cols-1 gap-4">
        {logs.map((portal, idx) => (
          <div
            key={idx}
            className="p-4 border rounded-xl bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Left: URL + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <StabilityBadge rate={portal.successRate} />
                <a
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-sm text-gray-900 truncate hover:underline"
                >
                  {portal.url}
                </a>
              </div>
              <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
                <span>Avg Response: <strong className="text-gray-700">{portal.avgSpeed}</strong></span>
                <span>Total Runs: <strong className="text-gray-700">{portal.totalRuns}</strong></span>
                <span>Opportunities Found: <strong className="text-gray-700">{portal.opsFound}</strong></span>
              </div>
              <p className={`text-xs mt-1 font-medium ${portal.successRate >= 85 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {portal.stability}
              </p>
            </div>

            {/* Right: success rate + sparkline */}
            <div className="flex items-center gap-6 shrink-0">
              <div className="text-right">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Success Rate</p>
                <p className={`text-2xl font-bold ${portal.successRate >= 85 ? 'text-green-600' : 'text-rose-600'}`}>
                  {portal.successRate}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1 text-center">Last 7 runs</p>
                <Sparkline trends={portal.trends} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
