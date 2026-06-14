(function () {
    'use strict';

    var extendedMiniApps = [
        ['Trade Fin', 'Trade Finance Core', 'Tracks cross-border letters of credit, asset financing thresholds, and international settlement terms.', 'Execute Audit'],
        ['Warehouse', 'Warehouse Receipting', 'Generates collateralized warehouse receipts and maps asset quantities to Odoo inventory ledgers.', 'Issue Receipt'],
        ['Insurance', 'Parametric Insurance', 'Monitors hyper-local climate models for drought and flood payout events.', 'Scan Risk'],
        ['Mechanise', 'Asset Mechanisation', 'Manages machinery maintenance schedules, lifecycle states, and run-hour statistics.', 'Schedule Maintenance'],
        ['GIS Map', 'GIS Topography Mapping', 'Generates polygon configurations for crop plots, property boundaries, and elevation models.', 'Render Boundary'],
        ['On-Demand', 'Tractor & Input Share', 'Matches equipment operators with smallholders requesting tillage or inputs delivery.', 'Dispatch Tractor'],
        ['Extension', 'Extension CRM Hub', 'Schedules agronomist visits and pushes recommendations to field teams.', 'Log Visit'],
        ['Lead Node', 'Lead Farmer Cluster', 'Coordinates smallholder production pools and localized output targets.', 'Aggregate'],
        ['SACCO', 'SACCO Capital Core', 'Manages member shares, underwriting pools, and capital dividend rules.', 'Audit Pool'],
        ['Cold Chain', 'Cold Chain Telemetry', 'Tracks produce temperature, route timing, and exception alerts.', 'Audit Route'],
        ['Trace', 'Product Traceability', 'Binds harvest batches to QR trace records and buyer verification events.', 'Generate Trace'],
        ['Carbon', 'Carbon Credits Registry', 'Maps regenerative practice evidence to carbon asset claims.', 'Compile Evidence'],
        ['Export', 'Export Documentation', 'Prepares phytosanitary, customs, and buyer compliance packets.', 'Assemble Pack'],
        ['Quality', 'Quality Lab Intake', 'Captures moisture, grade, residue, and defect scores.', 'Submit Grade'],
        ['Escrow', 'Buyer Escrow Bridge', 'Tracks escrow commitments, releases, exceptions, and confirmations.', 'Review Release'],
        ['Input Credit', 'Input Credit Scoring', 'Scores input financing requests with repayment and production history.', 'Run Score'],
        ['Market', 'Market Intelligence', 'Aggregates commodity prices, demand signals, and logistics premiums.', 'Refresh Signal'],
        ['Training', 'Farmer LMS Pulse', 'Tracks module completion, certifications, and field adoption indicators.', 'Assign Path'],
        ['Compliance', 'Compliance Vault', 'Stores audit evidence, regulatory filings, and partner verification checks.', 'Run Check'],
        ['Command', 'Regional Command Center', 'Consolidates alerts, route status, settlement state, and recommendations.', 'Open Review']
    ];

    var frappeModules = ['CRM', 'Selling', 'Buying', 'Stock', 'Projects', 'HR', 'Payroll', 'Accounting', 'Assets', 'Manufacturing', 'Quality', 'Support', 'Website', 'Portal', 'Desk', 'Workflow', 'SLA', 'Healthcare', 'Agriculture', 'Education'];
    var odooModules = ['Partners', 'Accounting', 'Invoicing', 'Inventory', 'Purchase', 'Sales', 'CRM', 'Subscriptions', 'Documents', 'Sign', 'Barcode', 'Fleet', 'Repair', 'Maintenance', 'Manufacturing', 'PLM', 'Quality', 'Employees', 'Recruitment', 'Time Off', 'Expenses', 'Payroll', 'Project', 'Timesheets', 'Field Service', 'Helpdesk', 'Website', 'eCommerce', 'POS', 'Email Marketing', 'SMS Marketing', 'Social Marketing', 'Events', 'Surveys', 'Knowledge', 'Approvals', 'Studio', 'IoT', 'VoIP', 'Live Chat', 'Planning', 'Appointments', 'Rental', 'Lunch', 'Fleet Fuel', 'MRP Workorders', 'Payment Providers', 'Data Cleaning', 'Spreadsheets', 'Dashboards'];

    function escapeHtml(value) {
        return String(value).replace(/[&<>'"]/g, function (char) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
        });
    }

    function mountDashboard() {
        var root = document.getElementById('dt-master-root');
        if (!root || root.dataset.mounted === 'true') return;
        root.dataset.mounted = 'true';
        root.innerHTML = [
            '<header class="dt-header"><div class="dt-header-row"><div><h1 class="dt-title">DreamTeQ Titanium ERP</h1><p class="dt-subtitle">Re-engineered fork of Frappe Next and Odoo 18, fused into a mobile-first, offline-first hybrid ERP command portal with Amanda Super Agent orchestration.</p><div class="dt-chip-row"><span class="dt-chip">70 Hybrid ERP Modules</span><span class="dt-chip">120 Mini-App Interfaces</span><span class="dt-chip">Vercel Production Vault</span><span class="dt-chip" id="platform-sync-badge">System Offline-Ready</span><span class="dt-chip" id="ws-badge">WS Pending</span></div></div><div class="dt-agent-rack"><div class="dt-agent"><div class="dt-agent-label">Amanda Brain</div><span class="dt-pentagon dt-good"></span></div><div class="dt-agent"><div class="dt-agent-label">DeepSeek Op</div><span class="dt-pentagon dt-good"></span></div><div class="dt-agent"><div class="dt-agent-label">Gemini Vision</div><span class="dt-pentagon dt-soft"></span></div><div class="dt-agent"><div class="dt-agent-label">Edge Ollama</div><span class="dt-pentagon dt-warn"></span></div></div></div></header>',
            '<div class="dt-grid"><aside class="dt-stack"><section class="dt-card"><h2 class="dt-card-title">Monetization Streams</h2><div class="dt-metric-label">SMM Video Revenue</div><div class="dt-metric-value" id="analytics-smm-rev">KSh 142,450</div><div class="dt-metric-label">LLMM / LLEO Search Influx</div><div class="dt-metric-value dt-gold" id="analytics-lleo-leads">2,481 Leads</div><div class="dt-metric-label">B2B Global Log Volume</div><div class="dt-metric-value" id="analytics-b2b-gmv">KSh 1,894,200</div></section><section class="dt-card"><h2 class="dt-card-title">Storage Partition Vectors</h2><div class="dt-stream" style="height:116px;">MiniApps Local Docs: <span id="pouch-miniapp-count">0</span><br>LMS Course Logs: <span id="pouch-lms-count">0</span><br>Analytics Logs: <span id="pouch-analytics-count">0</span><br>Encrypted Salt Array: AES-GCM Active</div></section><section class="dt-card warning"><h2 class="dt-card-title" style="color:#EF4444;">CTO Master Vault Panel</h2><div id="cto-auth-gate"><input class="dt-input" type="password" id="cto-passphrase-field" placeholder="Enter Master Gateway Key"><button class="dt-button" onclick="verifyCTOGodsGateAuthentication()" style="margin-top:10px;width:100%;">Authenticate CTO Enclave</button></div><div id="cto-secured-actions" class="dt-actions"><button class="dt-button" onclick="triggerGodsModeAction(\'HEAL\')">Self Heal</button><button class="dt-button silver" onclick="triggerGodsModeAction(\'DEBUG\')">Debug Live</button><button class="dt-button" onclick="triggerGodsModeAction(\'PAUSE\')">Pause Stack</button><button class="dt-button silver" onclick="triggerGodsModeAction(\'HOT_BACKUP\')">Hot Backup</button></div></section><section class="dt-card"><h2 class="dt-card-title">Corporate A4 Report Engine</h2><div class="dt-actions active"><button class="dt-button" onclick="compileReport(\'portrait\')">Compile Portrait Report</button><button class="dt-button silver" onclick="compileReport(\'landscape\')">Compile Landscape Deck</button></div></section></aside>',
            '<main class="dt-stack"><section class="dt-card gold"><h2 class="dt-card-title">Titanium ERP Module Infrastructure (70 Engines)</h2><div id="hybrid-module-grid" class="dt-scroll-grid"></div></section><section class="dt-card gold"><h2 class="dt-card-title">120 App Subsystem Workspace</h2><div id="miniapp-grid" class="dt-scroll-grid"></div></section><section class="dt-frames"><div class="dt-frame"><div class="dt-frame-head"><span>100APPS.HTML Workspace</span><button class="dt-button" onclick="reloadFrame(\'frame-miniapps\')">Reload</button></div><iframe id="frame-miniapps" src="100APPS.HTML" sandbox="allow-scripts allow-same-origin allow-forms"></iframe></div><div class="dt-frame"><div class="dt-frame-head"><span>LMSENTREPRISE.HTML Portal</span><button class="dt-button silver" onclick="reloadFrame(\'frame-lms\')">Reload</button></div><iframe id="frame-lms" src="LMSENTREPRISE.HTML" sandbox="allow-scripts allow-same-origin allow-forms"></iframe></div></section></main>',
            '<aside class="dt-stack"><section class="dt-card"><h2 class="dt-card-title">Swarm Agent Execution Pulse</h2><div class="dt-agent-rack" style="grid-template-columns:repeat(2,1fr);min-width:0;"><div class="dt-agent"><div class="dt-agent-label">Frappe Core</div><span class="dt-pentagon dt-good"></span></div><div class="dt-agent"><div class="dt-agent-label">Odoo 18</div><span class="dt-pentagon dt-warn"></span></div><div class="dt-agent"><div class="dt-agent-label">Ledger RPC</div><span class="dt-pentagon dt-soft"></span></div><div class="dt-agent"><div class="dt-agent-label">Vercel Vault</div><span class="dt-pentagon dt-good"></span></div></div></section><section class="dt-card"><h2 class="dt-card-title">Core System Live Event Stream</h2><div id="terminal-display" class="dt-stream">&gt; Establishing communication links to backend server arrays...</div><div style="display:flex;gap:8px;margin-top:10px;"><input class="dt-input" id="terminal-input" placeholder="Command Amanda..."><button class="dt-button" onclick="executeAmandaTerminalCommand()">Run</button></div></section><section class="dt-card"><h2 class="dt-card-title">Settlement Mesh</h2><div class="dt-stream" style="height:150px;">Cooperative Bank settlement channel armed.<br>M-Pesa Paybill routing protected in Vercel Vault.<br>Stripe and Hyperswitch connectors vault-mapped.<br>Cross-border rails: WeChat, Alipay, Interswitch, Pesalink, AfriPesa.</div></section></aside></div>',
            '<button id="dt-chat-button" onclick="toggleAmandaChat()" aria-label="Open Amanda chatbot">AI</button><section id="dt-chat-panel"><div class="dt-chat-head"><strong style="color:#D4AF37;text-transform:uppercase;">Amanda Master Orchestrator</strong><button class="dt-button silver" onclick="toggleAmandaChat()">Close</button></div><div id="dt-chat-log" class="dt-chat-log"><div class="dt-bubble">Hello Operator. I am Amanda, the primary super agent chatbot node running the operational health of your front-end canvas, backend JSON-RPC engines, and cloud deployments.</div></div><div class="dt-chat-form"><input id="dt-chat-input" placeholder="Command me..."><button class="dt-button" onclick="dispatchAmandaChat()">Send</button></div></section>'
        ].join('');
        renderCards();
        bindInputs();
        setInterval(refreshRouterStats, 8000);
        termLog('[DASHBOARD] Titanium Hybrid ERP Master Portal initialized.');
    }

    function card(html) {
        var article = document.createElement('article');
        article.className = 'dt-mini-card';
        article.innerHTML = html;
        return article;
    }

    function renderCards() {
        var miniGrid = document.getElementById('miniapp-grid');
        if (miniGrid && !miniGrid.dataset.rendered) {
            for (var index = 1; index <= 100; index += 1) {
                miniGrid.appendChild(card('<span>Core App ' + String(index).padStart(3, '0') + '</span><strong>Offline-First Mini-App ' + String(index).padStart(3, '0') + '</strong><p>Mobile-first floating interface with encrypted PouchDB persistence and Amanda routing.</p><button onclick="routeMiniAppAction(' + index + ')">Open Slot</button>'));
            }
            extendedMiniApps.forEach(function (app, offset) {
                var id = offset + 101;
                miniGrid.appendChild(card('<span>' + escapeHtml(app[0]) + ' ' + id + '</span><strong>' + escapeHtml(app[1]) + '</strong><p>' + escapeHtml(app[2]) + '</p><button onclick="routeMiniAppAction(' + id + ')">' + escapeHtml(app[3]) + '</button>'));
            });
            miniGrid.dataset.rendered = 'true';
        }
        var moduleGrid = document.getElementById('hybrid-module-grid');
        if (moduleGrid && !moduleGrid.dataset.rendered) {
            frappeModules.forEach(function (name, offset) { appendModule(moduleGrid, offset + 1, 'Frappe Next', name); });
            odooModules.forEach(function (name, offset) { appendModule(moduleGrid, offset + 21, 'Odoo 18', name); });
            moduleGrid.dataset.rendered = 'true';
        }
    }

    function appendModule(grid, id, source, title) {
        grid.appendChild(card('<span>' + escapeHtml(source) + ' Module ' + String(id).padStart(2, '0') + '</span><strong>' + escapeHtml(title) + '</strong><p>Re-engineered Titanium ERP service interface with shared analytics, audit routing, and ledger synchronization hooks.</p><button onclick="routeModuleAction(' + id + ')">Inspect Module</button>'));
    }

    function bindInputs() {
        var chatInput = document.getElementById('dt-chat-input');
        var terminalInput = document.getElementById('terminal-input');
        if (chatInput) chatInput.addEventListener('keydown', function (event) { if (event.key === 'Enter') window.dispatchAmandaChat(); });
        if (terminalInput) terminalInput.addEventListener('keydown', function (event) { if (event.key === 'Enter') window.executeAmandaTerminalCommand(); });
    }

    window.routeMiniAppAction = function (id) {
        termLog('[MINIAPP] Interface ' + id + ' routed into Amanda orchestration queue.');
        if (window.DreamTeQRouter && window.DreamTeQRouter.testFire) window.DreamTeQRouter.testFire('MINIAPP_' + id, { amount: 100 + id, module: 'miniapp' });
    };

    window.routeModuleAction = function (id) { termLog('[ERP MODULE] Titanium module ' + id + ' inspection pulse issued.'); };
    window.reloadFrame = function (id) { var frame = document.getElementById(id); if (frame) frame.src = frame.src; };
    window.compileReport = function (mode) { termLog('[REPORT] Compiling A4 ' + mode + ' report matrix for executive export.'); };

    window.verifyCTOGodsGateAuthentication = function () {
        var field = document.getElementById('cto-passphrase-field');
        var actions = document.getElementById('cto-secured-actions');
        if (!field || !actions) return;
        if (field.value.trim().length >= 8) {
            actions.classList.add('active');
            document.getElementById('cto-auth-gate').style.display = 'none';
            termLog('[CTO VAULT] Local CTO enclave unlocked for this browser session.');
        } else {
            termLog('[CTO VAULT] Passphrase rejected. Minimum secure entry length not met.');
        }
    };

    window.triggerGodsModeAction = function (action) {
        termLog('[CTO CONSOLE] ' + String(action || 'UNKNOWN').toUpperCase() + ' acknowledged. Server-side execution remains protected behind terminal/cloud controls.');
    };

    window.termLog = function (message) {
        var terminal = document.getElementById('terminal-display');
        if (!terminal) return;
        terminal.innerHTML += '<br>&gt; ' + escapeHtml(message);
        terminal.scrollTop = terminal.scrollHeight;
    };

    window.executeAmandaTerminalCommand = function () {
        var input = document.getElementById('terminal-input');
        var command = input ? input.value.trim() : '';
        if (!command) return;
        termLog('Operator: ' + command);
        input.value = '';
        termLog('[AMANDA] Command received. Use the floating chat or router commands for live orchestration.');
    };

    window.toggleAmandaChat = function () {
        var panel = document.getElementById('dt-chat-panel');
        if (panel) panel.classList.toggle('active');
    };

    function appendAmandaBubble(text, source) {
        var logs = document.getElementById('dt-chat-log');
        if (!logs) return;
        var bubble = document.createElement('div');
        bubble.className = 'dt-bubble' + (source === 'user' ? ' user' : '');
        bubble.textContent = text;
        logs.appendChild(bubble);
        logs.scrollTop = logs.scrollHeight;
    }

    window.dispatchAmandaChat = function () {
        var input = document.getElementById('dt-chat-input');
        var text = input ? input.value.trim() : '';
        if (!text) return;
        appendAmandaBubble(text, 'user');
        input.value = '';
        var lower = text.toLowerCase();
        if (lower.indexOf('status') >= 0) appendAmandaBubble('Platform shell active. Vercel vault mapped. Router: ' + (window.DreamTeQRouter ? 'ready' : 'loading') + '.', 'bot');
        else if (lower.indexOf('sync') >= 0 && window.flashLocalPouchDBToOdooLedger) {
            window.flashLocalPouchDBToOdooLedger();
            appendAmandaBubble('Ledger sync pulse dispatched to the local broker endpoint.', 'bot');
        } else {
            appendAmandaBubble('Acknowledged. I can route status, sync, report, mini-app, and CTO console requests.', 'bot');
        }
    };

    function refreshRouterStats() {
        if (!window.DreamTeQRouter || !window.DreamTeQRouter.getStats) return;
        window.DreamTeQRouter.getStats().then(function (stats) {
            document.getElementById('pouch-miniapp-count').textContent = stats.miniapps.doc_count || 0;
            document.getElementById('pouch-lms-count').textContent = stats.lms.doc_count || 0;
            document.getElementById('pouch-analytics-count').textContent = stats.analytics.doc_count || 0;
        }).catch(function () {});
    }

    window.addEventListener('dreamteq:router', function (event) {
        if (event.detail && event.detail.type === 'ROUTER_READY') {
            var badge = document.getElementById('platform-sync-badge');
            if (badge) badge.textContent = 'System Online';
            refreshRouterStats();
        }
    });

    window.addEventListener('dreamteq:counters', function (event) {
        var data = event.detail || {};
        if (data.SMM) document.getElementById('analytics-smm-rev').textContent = 'KSh ' + Number(data.SMM).toLocaleString();
        if (data.LLEO) document.getElementById('analytics-lleo-leads').textContent = Number(data.LLEO).toLocaleString() + ' Leads';
    });

    document.addEventListener('DOMContentLoaded', mountDashboard);
})();
