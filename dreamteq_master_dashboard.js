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

    var titaniumFeaturedModules = [
        { id: 'itax_compliance', name: 'iTax Automated Filing Module', ancestry: 'Odoo Accounting + Kenya Revenue Authority Bridge', agent: 'TaxCompliance Swarm', desc: 'Automated VAT, PAYE, and withholding tax optimization computation layers routed to KRA-ready API payloads.', braintier: '#34D399' },
        { id: 'hr_payroll', name: 'Ecosystem HR & Payroll Module', ancestry: 'Frappe HR + Odoo Employee', agent: 'LaborCompensation Swarm', desc: 'Manages piece-rate field worker wages, statutory deductions, and direct bank allocation ledgers.', braintier: '#34D399' },
        { id: 'crm_farmer', name: 'Smallholder Relations CRM', ancestry: 'Frappe CRM Core', agent: 'Cooperative Liaison Swarm', desc: 'Handles smallholder interaction lifecycles, farmer helpdesk requests, and voice-to-text agronomy memos.', braintier: '#34D399' },
        { id: 'sales_marketing', name: 'Project Sales & Marketing Module', ancestry: 'Odoo CRM + Odoo Sales', agent: 'MarketArbitrage Swarm', desc: 'Runs wholesale contract allocation arrays, automated lead scoring, and route-aware deal matching.', braintier: '#34D399' },
        { id: 'training_lms', name: 'Capacity Building LMS Module', ancestry: 'Odoo Slide LMS Core', agent: 'Instructional Design Swarm', desc: 'Deploys training guidelines, certification tests, and A4 presentation manual outputs.', braintier: '#FBBF24' },
        { id: 'jobs_careers', name: 'Jobs & Rural Careers Module', ancestry: 'Frappe Recruitment Core', agent: 'TalentAllocation Swarm', desc: 'Matches seasonal field labor, mechanical operators, and agronomists with verified operational tasks.', braintier: '#34D399' },
        { id: 'manufacturing_value', name: 'Manufacturing & Value Addition', ancestry: 'Odoo MRP Engine', agent: 'ProcessCosting Swarm', desc: 'Calculates milling, sorting, pasteurization, packaging BOM overheads, and batch yields.', braintier: '#34D399' },
        { id: 'finance_admin', name: 'Finance & Admin General Ledger', ancestry: 'Odoo 18 Multi-Company Accounting', agent: 'CapitalAllocation Swarm', desc: 'Central double-entry ledger for KES, USD, EUR, and CNY cooperative bank clearings.', braintier: '#34D399' },
        { id: 'smm_monetization', name: 'SMM Automated Content Module', ancestry: 'DreamTeQ Custom Media Framework', agent: 'SocialContent Swarm', desc: 'Controls programmatic short-form video creation, watermarking, and publishing queues.', braintier: '#34D399' },
        { id: 'legal_compliance', name: 'Legal, IP & Patent Protection', ancestry: 'Odoo Document Management Vault', agent: 'ComplianceAudit Swarm', desc: 'Protects sensitive source data, legal frameworks, patents, trademarks, and audit artifacts.', braintier: '#34D399' },
        { id: 'business_planning', name: 'Project Business Planning Module', ancestry: 'Frappe Project Management Matrix', agent: 'StrategicFeasibility Swarm', desc: 'Compiles capital projections, asset lifecycle indices, and predictive business model outlines.', braintier: '#34D399' },
        { id: 'valuechain_farm_fork', name: 'Value Chain Farm-to-Fork Analysis', ancestry: 'Odoo Stock Logistics + Blockchain Trace', agent: 'TraceabilityAudit Swarm', desc: 'Maps price markup parameters from smallholder fields through warehousing to kiosks.', braintier: '#34D399' },
        { id: 'profitability_analysis', name: 'Project Profitability Analysis Dashboard', ancestry: 'Odoo Analytic Accounting Mod', agent: 'YieldProfitability Swarm', desc: 'Evaluates gross margin per cooperative node while tracking input overhead usage.', braintier: '#34D399' },
        { id: 'project_budgeting', name: 'Project Budgeting Module', ancestry: 'Odoo Budget Management Engine', agent: 'FiscalControl Swarm', desc: 'Enforces cash allocation boundaries and alerts operational heads to overhead spikes.', braintier: '#34D399' },
        { id: 'postharvest_packaging', name: 'Post-Harvest & Packaging Module', ancestry: 'Odoo Quality Assurance + MRP', agent: 'SpoilagePrevention Swarm', desc: 'Monitors shelf life, moisture values, and barcode labeling for shipping boxes.', braintier: '#34D399' },
        { id: 'inventory_management', name: 'Project Inventory Management Module', ancestry: 'Odoo 18 Multi-Warehouse Stock', agent: 'InventoryVelocity Swarm', desc: 'Tracks batch numbers, seed and fertilizer thresholds, and warehouse velocity.', braintier: '#34D399' },
        { id: 'project_research', name: 'Project Research & Metadata Hub', ancestry: 'Frappe Custom Document Node', agent: 'AgronomicR_D Swarm', desc: 'Stores soil records, variety yields, and regional models curated by extension agronomists.', braintier: '#FBBF24' },
        { id: 'inputs_trial_validation', name: 'Inputs Trial & Validation Module', ancestry: 'Odoo Quality App Framework', agent: 'EfficacyEvaluation Swarm', desc: 'Compares seed varieties and fertilizer combinations inside sandbox field plots.', braintier: '#FBBF24' },
        { id: 'inputs_supply_delivery', name: 'Inputs Supply & Delivery Module', ancestry: 'Odoo Purchase + Stock Picking', agent: 'WholesaleProcurement Swarm', desc: 'Groups cooperative input buying requests into automated wholesale purchasing actions.', braintier: '#34D399' },
        { id: 'transport_fleet', name: 'Transport Fleet Management & Tracking', ancestry: 'Odoo Fleet + GPS Telematics', agent: 'VehicleMaintenance Swarm', desc: 'Monitors diagnostics, fuel anomalies, and tire wear profiles for logistics fleets.', braintier: '#34D399' },
        { id: 'cargotex_marketplace', name: 'Altovex DreamTeQ CargoTeX Module', ancestry: 'Altovex Global Logistics Matching Engine', agent: 'LogisticsArbitrage Swarm', desc: 'Matches vehicle capacity with empty shipping crate routes across active supply pathways.', braintier: '#34D399' },
        { id: 'kiosk_merchandise', name: 'Kiosk Merchandise Franchise Module', ancestry: 'Odoo Retail Point of Sale Core', agent: 'FranchiseVelocity Swarm', desc: 'Controls roadside retail outlets, offline terminal configurations, and revenue sweeps.', braintier: '#34D399' },
        { id: 'website_deployment', name: 'Website Development & CMS Module', ancestry: 'Odoo 18 Website Builder Engine', agent: 'WebPublication Swarm', desc: 'Deploys landing templates, cooperative news feeds, and e-commerce storefront channels.', braintier: '#34D399' },
        { id: 'drone_crop_protection', name: 'Drone Crop Protection & Mapping', ancestry: 'ArduPilot Mission Planner API Wrapper', agent: 'AutonomousGeospatial Swarm', desc: 'Controls boundary sweeps, thermal leaf evaluations, and precision spray paths.', braintier: '#34D399' }
    ];

    function createTitaniumModuleRegistry() {
        var registry = titaniumFeaturedModules.slice();
        frappeModules.forEach(function (name, offset) {
            registry.push({ id: 'frappe_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_'), name: name + ' Hybrid Service', ancestry: 'Frappe Next Core', agent: 'FrappeDomain Swarm ' + String(offset + 1).padStart(2, '0'), desc: 'Re-engineered Frappe service surface with offline-first persistence, audit routing, and Amanda status monitoring.', braintier: offset % 5 === 0 ? '#FBBF24' : '#34D399' });
        });
        odooModules.slice(0, 70 - registry.length).forEach(function (name, offset) {
            registry.push({ id: 'odoo_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_'), name: name + ' Titanium Module', ancestry: 'Odoo 18 Enterprise Core', agent: 'OdooDomain Swarm ' + String(offset + 1).padStart(2, '0'), desc: 'Re-engineered Odoo module with ledger hooks, multi-agent telemetry loops, and A4 report export readiness.', braintier: offset % 7 === 0 ? '#A7F3D0' : '#34D399' });
        });
        return registry.slice(0, 70);
    }

    var DreamTeQ_ERP_Modules_Engine = {
        modulesRegistry: createTitaniumModuleRegistry(),
        injectTitaniumModulesIntoDashboard: function (targetContainerId) {
            var rootContainer = document.getElementById(targetContainerId);
            if (!rootContainer || rootContainer.dataset.rendered === 'true') return;
            rootContainer.innerHTML = this.modulesRegistry.map(function (mod, index) {
                return '<article class="dreamteq-floating-card titanium-module-card" style="--module-brain-tier:' + escapeHtml(mod.braintier) + '">' +
                    '<div><div class="titanium-module-head"><span>DT_TITANIUM_ERP_' + String(index + 1).padStart(2, '0') + '</span><svg width="18" height="18" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,5 95,38 78,92 22,92 5,38"></polygon></svg></div>' +
                    '<h4>' + escapeHtml(mod.name) + '</h4><span class="titanium-module-heritage">Base Heritage: ' + escapeHtml(mod.ancestry) + '</span><p>' + escapeHtml(mod.desc) + '</p></div>' +
                    '<div><div class="titanium-module-agent">Assigned Agent: [' + escapeHtml(mod.agent) + ']</div><button type="button" onclick="triggerModuleExecutionSandbox(\'' + escapeHtml(mod.id) + '\',\'' + escapeHtml(mod.name) + '\')">Initialize Core Workspace</button></div>' +
                    '</article>';
            }).join('');
            rootContainer.dataset.rendered = 'true';
            console.log('[ERP INITIALIZATION] Rendered ' + this.modulesRegistry.length + ' titanium core micro-frontends.');
        }
    };

    window.DreamTeQ_ERP_Modules_Engine = DreamTeQ_ERP_Modules_Engine;

    function escapeHtml(value) {
        return String(value).replace(/[&<>'"]/g, function (char) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
        });
    }

    function createLocalDatabase(name) {
        if (typeof window.PouchDB === 'function') return new window.PouchDB(name);
        return {
            put: function () { return Promise.reject(new Error('PouchDB is not available.')); },
            get: function () { return Promise.reject(new Error('PouchDB is not available.')); },
            allDocs: function () { return Promise.resolve({ rows: [] }); }
        };
    }

    function appendCoreLog(message) {
        if (window.DreamTeQ_Storage_Router && typeof window.DreamTeQ_Storage_Router.appendLog === 'function') {
            window.DreamTeQ_Storage_Router.appendLog(message);
        } else if (window.DreamTeQRouter && typeof window.DreamTeQRouter.appendLog === 'function') {
            window.DreamTeQRouter.appendLog(message);
        } else if (typeof window.termLog === 'function') {
            window.termLog(message);
        } else {
            console.log(message);
        }
    }

    function createPentagonStatus(label, status, state) {
        var stateClass = state || 'green';
        return '<div class="agent-pentagon-status-container ' + stateClass + '"><svg width="22" height="22" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,5 95,38 78,92 22,92 5,38" fill="var(--pentagon-color, #34D399)"></polygon></svg><div class="agent-pentagon-status-copy"><strong>' + escapeHtml(label) + '</strong>: <span class="agent-pentagon-performance">' + escapeHtml(status) + '</span></div></div>';
    }

    function renderEnhancedCTOVaultPanel() {
        return '<section id="cto-gods-mode-panel" class="cto-master-vault-panel">' +
            '<div class="cto-master-vault-header"><div><h2 class="cto-master-vault-title">CTO Master Platform Security Vault</h2><p class="cto-master-vault-profile">Secured Access Node Profile: <strong>Mr. Allan (Platform CTO)</strong></p></div><div class="cto-master-vault-status">GODS MODE READY</div></div>' +
            '<div class="cto-vault-secured-badge"><span class="cto-vault-lock-symbol">LOCK</span><span>Hardware encrypted isolation channel mapped safely under security token credentials profile target. Full systemic overrides remain session-gated.</span></div>' +
            '<div class="cto-vault-actions-grid">' +
            '<button type="button" class="cto-vault-action-button" onclick="triggerCTOVaultAction(\'ONLINE_DEBUG\')"><span>DEBUG</span>Activate Gods Mode Debug</button>' +
            '<button type="button" class="cto-vault-action-button" onclick="triggerCTOVaultAction(\'PAUSE_SYSTEM\')"><span>PAUSE</span>Pause System Operations</button>' +
            '<button type="button" class="cto-vault-action-button" onclick="triggerCTOVaultAction(\'HOT_FIX\')"><span>FIX</span>Hot-Fix System Clusters</button>' +
            '<button type="button" class="cto-vault-action-button" onclick="triggerCTOVaultAction(\'ROLLBACK\')"><span>ROLLBACK</span>Return to Last Safest State</button>' +
            '</div>' +
            '<div class="cto-vault-doc-hub"><h4 class="cto-vault-doc-title">Core Platform Documentation &amp; Reference Manuals</h4><div class="cto-vault-doc-links"><a href="#" onclick="compileReport(\'portrait\'); return false;">Download Comprehensive Platform Manual.pdf (Portrait)</a><span class="cto-vault-doc-separator">|</span><a href="#" onclick="compileReport(\'landscape\'); return false;">Download Mini-App System Training Manual.pdf (Landscape)</a></div></div>' +
            '<div class="cto-vault-footer">Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya | Tel: +254718554383 | Web: www.dreamteamconsult.site | Email: dreamteamconsult@gmx.com | Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.</div>' +
            '</section>';
    }

    var DreamTeQ_Core_Apps = {
        databases: {
            farmers: createLocalDatabase('dreamteq_360_farmers_registry'),
            onboarding: createLocalDatabase('dreamteq_360_onboarding_tasks')
        },

        renderFarmerRegistrationApp: function (containerId) {
            var target = document.getElementById(containerId);
            if (!target) return;

            target.innerHTML = '<div class="dt-core-app-card">' +
                '<h3 class="dt-core-app-title">Farmer Registration &amp; KYC Hub</h3>' +
                createPentagonStatus('KYC Capture Agent', 'MAX INTEL ACTIVE (OPTIMAL)', 'green') +
                '<form id="dt-farmer-reg-form">' +
                '<div class="dreamteq-form-group"><label class="dreamteq-form-label" for="reg-farmer-name">Full Legal Name</label><input type="text" id="reg-farmer-name" class="dreamteq-input" required placeholder="e.g. John Kiprop"></div>' +
                '<div class="dreamteq-form-group"><label class="dreamteq-form-label" for="reg-farmer-id">National ID / Passport Number</label><input type="text" id="reg-farmer-id" class="dreamteq-input" required placeholder="e.g. 32456789"></div>' +
                '<div class="dreamteq-form-group"><label class="dreamteq-form-label" for="reg-farmer-phone">Primary Mobile Money Number</label><input type="text" id="reg-farmer-phone" class="dreamteq-input" required placeholder="e.g. PHONE-254718554383"></div>' +
                '<div class="dreamteq-form-group"><label class="dreamteq-form-label" for="reg-farmer-coop">Regional Cooperative Node</label><select id="reg-farmer-coop" class="dreamteq-select"><option value="Nairobi_East">Nairobi East Cooperative Hub</option><option value="Rift_Valley_Central">Rift Valley Central Pool</option><option value="SADC_Cross_Border">SADC Logistics Hub Sector</option></select></div>' +
                '<button type="submit" class="dreamteq-action-btn">Register Smallholder Node</button>' +
                '</form></div>';

            document.getElementById('dt-farmer-reg-form').addEventListener('submit', this.handleFarmerRegistration.bind(this));
        },

        handleFarmerRegistration: function (event) {
            event.preventDefault();
            var farmerId = document.getElementById('reg-farmer-id').value.trim();
            var name = document.getElementById('reg-farmer-name').value.trim();
            var phone = document.getElementById('reg-farmer-phone').value.trim();
            var coop = document.getElementById('reg-farmer-coop').value;
            var farmerDoc = {
                _id: 'FARMER_' + farmerId,
                kyc_status: 'PENDING_VERIFICATION',
                name: name,
                phone: phone,
                coop: coop,
                registered_at: new Date().toISOString(),
                sync_ready: true,
                settlement_currency: 'KES',
                cross_border_router: 'COOPERATIVE_BANK_ALTOVEX_MASTER'
            };

            this.databases.farmers.put(farmerDoc).then(function () {
                appendCoreLog('[KYC REGISTER] Farmer ' + name + ' logged into localized storage vault.');
                window.alert('Registration successful. Local Vault ID: FARMER_' + farmerId);
                event.target.reset();
            }).catch(function (err) {
                appendCoreLog('[KYC REGISTER] Local database insertion error: ' + err.message);
            });
        },

        renderFarmerOnboardingApp: function (containerId) {
            var target = document.getElementById(containerId);
            if (!target) return;

            target.innerHTML = '<div class="dt-core-app-card gold">' +
                '<h3 class="dt-core-app-title">Smallholder Ecosystem Onboarding</h3>' +
                createPentagonStatus('Compliance Pipeline Agent', 'MEDIUM PROCESSING TIER READY', 'green') +
                '<div class="dreamteq-form-group"><label class="dreamteq-form-label" for="onboard-search-id">Target Farmer Profile ID</label><input type="text" id="onboard-search-id" class="dreamteq-input" placeholder="e.g. 32456789"><button id="dt-init-onboarding" class="dreamteq-action-btn spaced">Initialize Onboarding Pipeline</button></div>' +
                '<div id="onboarding-steps-box" class="onboarding-steps-box"><h4>Mandatory Compliance Milestone Checklist</h4><div class="onboarding-checklist"><input type="checkbox" id="step-biometric"> <label for="step-biometric">Biometric Profile &amp; Land Mapping Verified</label><br><br><input type="checkbox" id="step-lms"> <label for="step-lms">Ecosystem Base Training Module Completed (LMS)</label><br><br><input type="checkbox" id="step-escrow"> <label for="step-escrow">Cooperative Escrow Wallet Allocation Active</label></div><button id="dt-finalize-onboarding" class="dreamteq-action-btn full spaced">Commit Compliance Certification</button></div>' +
                '</div>';

            document.getElementById('dt-init-onboarding').addEventListener('click', this.initializeOnboardingWorkflow.bind(this));
            document.getElementById('dt-finalize-onboarding').addEventListener('click', this.finalizeOnboarding.bind(this));
        },

        initializeOnboardingWorkflow: function () {
            var id = document.getElementById('onboard-search-id').value.trim();
            if (!id) return window.alert('Please clarify target smallholder ID profile.');
            document.getElementById('onboarding-steps-box').classList.add('active');
            this.databases.onboarding.put({
                _id: 'ONBOARDING_' + id + '_' + Date.now(),
                farmer_ref: 'FARMER_' + id,
                status: 'PIPELINE_INITIALIZED',
                created_at: new Date().toISOString()
            }).catch(function () {});
            appendCoreLog('[ONBOARDING] Initialized certification pipeline tracking matrices for user: ' + id);
        },

        finalizeOnboarding: function () {
            var id = document.getElementById('onboard-search-id').value.trim();
            var step1 = document.getElementById('step-biometric').checked;
            var step2 = document.getElementById('step-lms').checked;
            var step3 = document.getElementById('step-escrow').checked;
            var self = this;

            if (!step1 || !step2 || !step3) return window.alert('All environmental milestone constraints must be checked to process compliance.');

            this.databases.farmers.get('FARMER_' + id).then(function (farmer) {
                farmer.kyc_status = 'VERIFIED_ACTIVE';
                farmer.onboarded_at = new Date().toISOString();
                return self.databases.farmers.put(farmer);
            }).then(function () {
                appendCoreLog('[COMPLIANCE] Farmer account profile FARMER_' + id + ' escalated to VERIFIED_ACTIVE operational tier.');
                window.alert('Smallholder onboarding configuration complete.');
                document.getElementById('onboarding-steps-box').classList.remove('active');
            }).catch(function () {
                window.alert('Target profile lookup signature mismatch in local storage.');
            });
        },

        renderFarmerDashboardApp: function (containerId) {
            var target = document.getElementById(containerId);
            if (!target) return;

            target.innerHTML = '<div class="dt-core-app-card">' +
                '<h3 class="dt-core-app-title silver">My Smallholder Portal Dashboard</h3>' +
                createPentagonStatus('Farmer Finance Agent', 'MAX INTEL ACTIVE (OPTIMAL)', 'green') +
                '<div class="dt-core-stats-grid"><div class="dt-core-stat"><span>Cooperative Bank Escrow Balance</span><strong>KSh 48,250.00</strong></div><div class="dt-core-stat gold"><span>Altovex Logistics Transit Orders</span><strong>2 Active Deliveries</strong></div></div>' +
                '<button id="dt-request-trade-finance" class="dreamteq-action-btn full">Request Emergency Trade Financing Advance</button>' +
                '</div>';

            document.getElementById('dt-request-trade-finance').addEventListener('click', function () {
                if (window.DreamTeQ_Storage_Router && typeof window.DreamTeQ_Storage_Router.updateFinancialMetrics === 'function') {
                    window.DreamTeQ_Storage_Router.updateFinancialMetrics('MINI_APP', 500);
                } else if (window.DreamTeQRouter && typeof window.DreamTeQRouter.testFire === 'function') {
                    window.DreamTeQRouter.testFire('FARMER_TRADE_FINANCE_ADVANCE', { amount: 500, currency: 'KES', gateway: 'INTERSWITCH_PESALINK' });
                }
                appendCoreLog('[FARMER DASHBOARD] Emergency trade financing advance request queued into local router.');
            });
        },

        renderAdminBackendApp: function (containerId) {
            var target = document.getElementById(containerId);
            if (!target) return;

            target.innerHTML = '<div class="dt-core-app-card">' +
                '<div class="cto-vault-secured-badge"><span>CTO VAULT SECURED</span><span>Session-gated admin directory</span></div>' +
                '<h3 class="dt-core-app-title">Ecosystem Administrator Console</h3>' +
                createPentagonStatus('Admin Directory Agent', 'MAX INTEL ACTIVE (OPTIMAL)', 'green') +
                '<button id="dt-refresh-farmers" class="dreamteq-action-btn">Refresh Master Local Identity Directory</button>' +
                '<div class="admin-table-wrap"><table class="admin-data-table"><thead><tr><th>Profile Mapping ID</th><th>Smallholder Identity Name</th><th>Phone Vector Target</th><th>KYC Verification Status</th></tr></thead><tbody id="admin-farmer-rows-target"><tr><td colspan="4" class="admin-empty">Execute refresh parameter check to mount dynamic dataset.</td></tr></tbody></table></div>' +
                '</div>';

            document.getElementById('dt-refresh-farmers').addEventListener('click', this.loadRegisteredFarmersTable.bind(this));
        },

        loadRegisteredFarmersTable: function () {
            var targetBody = document.getElementById('admin-farmer-rows-target');
            if (!targetBody) return;

            this.databases.farmers.allDocs({ include_docs: true }).then(function (allDocs) {
                if (allDocs.rows.length === 0) {
                    targetBody.innerHTML = '<tr><td colspan="4" class="admin-empty">Zero registry items located in local storage.</td></tr>';
                    return;
                }
                targetBody.innerHTML = allDocs.rows.map(function (row) {
                    var doc = row.doc || {};
                    return '<tr><td class="admin-id">' + escapeHtml(doc._id || '') + '</td><td><strong>' + escapeHtml(doc.name || '') + '</strong></td><td class="admin-phone">' + escapeHtml(doc.phone || '') + '</td><td><span class="kyc-badge">' + escapeHtml(doc.kyc_status || 'UNKNOWN') + '</span></td></tr>';
                }).join('');
            }).catch(function () {
                targetBody.innerHTML = '<tr><td colspan="4" class="admin-error">Error processing database parsing operations.</td></tr>';
            });
        }
    };

    window.DreamTeQ_Core_Apps = DreamTeQ_Core_Apps;

    function mountDashboard() {
        var root = document.getElementById('dt-master-root');
        if (!root || root.dataset.mounted === 'true') return;
        root.dataset.mounted = 'true';
        root.innerHTML = [
            '<header class="dt-header"><div class="dt-header-row"><div><h1 class="dt-title">DreamTeQ Titanium ERP</h1><p class="dt-subtitle">Re-engineered fork of Frappe Next and Odoo 18, fused into a mobile-first, offline-first hybrid ERP command portal with Amanda Super Agent orchestration.</p><div class="dt-chip-row"><span class="dt-chip">70 Hybrid ERP Modules</span><span class="dt-chip">120 Mini-App Interfaces</span><span class="dt-chip">Vercel Production Vault</span><span class="dt-chip" id="platform-sync-badge">System Offline-Ready</span><span class="dt-chip" id="ws-badge">WS Pending</span></div></div><div class="dt-agent-rack"><div class="dt-agent"><div class="dt-agent-label">Amanda Brain</div><span class="dt-pentagon dt-good"></span></div><div class="dt-agent"><div class="dt-agent-label">DeepSeek Op</div><span class="dt-pentagon dt-good"></span></div><div class="dt-agent"><div class="dt-agent-label">Gemini Vision</div><span class="dt-pentagon dt-soft"></span></div><div class="dt-agent"><div class="dt-agent-label">Edge Ollama</div><span class="dt-pentagon dt-warn"></span></div></div></div></header>',
            '<div class="dt-grid"><aside class="dt-stack"><section class="dt-card"><h2 class="dt-card-title">Monetization Streams</h2><div class="dt-metric-label">SMM Video Revenue</div><div class="dt-metric-value" id="analytics-smm-rev">KSh 142,450</div><div class="dt-metric-label">LLMM / LLEO Search Influx</div><div class="dt-metric-value dt-gold" id="analytics-lleo-leads">2,481 Leads</div><div class="dt-metric-label">B2B Global Log Volume</div><div class="dt-metric-value" id="analytics-b2b-gmv">KSh 1,894,200</div></section><section class="dt-card"><h2 class="dt-card-title">Storage Partition Vectors</h2><div class="dt-stream" style="height:116px;">MiniApps Local Docs: <span id="pouch-miniapp-count">0</span><br>LMS Course Logs: <span id="pouch-lms-count">0</span><br>Analytics Logs: <span id="pouch-analytics-count">0</span><br>Encrypted Salt Array: AES-GCM Active</div></section><section class="dt-card warning"><h2 class="dt-card-title" style="color:#EF4444;">CTO Master Vault Panel</h2><div id="cto-auth-gate"><input class="dt-input" type="password" id="cto-passphrase-field" placeholder="Enter Master Gateway Key"><button class="dt-button" onclick="verifyCTOGodsGateAuthentication()" style="margin-top:10px;width:100%;">Authenticate CTO Enclave</button></div><div id="cto-secured-actions" class="dt-actions"><button class="dt-button" onclick="triggerGodsModeAction(\'HEAL\')">Self Heal</button><button class="dt-button silver" onclick="triggerGodsModeAction(\'DEBUG\')">Debug Live</button><button class="dt-button" onclick="triggerGodsModeAction(\'PAUSE\')">Pause Stack</button><button class="dt-button silver" onclick="triggerGodsModeAction(\'HOT_BACKUP\')">Hot Backup</button></div></section><section class="dt-card"><h2 class="dt-card-title">Corporate A4 Report Engine</h2><div class="dt-actions active"><button class="dt-button" onclick="compileReport(\'portrait\')">Compile Portrait Report</button><button class="dt-button silver" onclick="compileReport(\'landscape\')">Compile Landscape Deck</button></div></section></aside>',
            '<main class="dt-stack"><section id="titanium-erp-portal-surface" class="dt-card gold titanium-erp-portal-surface"><div class="titanium-portal-heading"><h2>Titanium Hybrid ERP System Core</h2><p>70 re-engineered Frappe Next and Odoo 18 full-stack sub-domain dashboards managed by active multi-agent intelligence swarms.</p></div><div id="titanium-modules-grid-mount" class="titanium-modules-grid"></div></section><section class="dt-card gold"><h2 class="dt-card-title">Titanium ERP Module Infrastructure (70 Engines)</h2><div id="hybrid-module-grid" class="dt-scroll-grid"></div></section><section class="dt-card gold"><h2 class="dt-card-title">120 App Subsystem Workspace</h2><div id="miniapp-grid" class="dt-scroll-grid"></div></section><section class="dt-frames"><div class="dt-frame"><div class="dt-frame-head"><span>100APPS.HTML Workspace</span><button class="dt-button" onclick="reloadFrame(\'frame-miniapps\')">Reload</button></div><iframe id="frame-miniapps" src="100APPS.HTML" sandbox="allow-scripts allow-same-origin allow-forms"></iframe></div><div class="dt-frame"><div class="dt-frame-head"><span>LMSENTREPRISE.HTML Portal</span><button class="dt-button silver" onclick="reloadFrame(\'frame-lms\')">Reload</button></div><iframe id="frame-lms" src="LMSENTREPRISE.HTML" sandbox="allow-scripts allow-same-origin allow-forms"></iframe></div></section></main>',
            '<aside class="dt-stack"><section class="dt-card"><h2 class="dt-card-title">Swarm Agent Execution Pulse</h2><div class="dt-agent-rack" style="grid-template-columns:repeat(2,1fr);min-width:0;"><div class="dt-agent"><div class="dt-agent-label">Frappe Core</div><span class="dt-pentagon dt-good"></span></div><div class="dt-agent"><div class="dt-agent-label">Odoo 18</div><span class="dt-pentagon dt-warn"></span></div><div class="dt-agent"><div class="dt-agent-label">Ledger RPC</div><span class="dt-pentagon dt-soft"></span></div><div class="dt-agent"><div class="dt-agent-label">Vercel Vault</div><span class="dt-pentagon dt-good"></span></div></div></section><section class="dt-card"><h2 class="dt-card-title">Core System Live Event Stream</h2><div id="terminal-display" class="dt-stream">&gt; Establishing communication links to backend server arrays...</div><div style="display:flex;gap:8px;margin-top:10px;"><input class="dt-input" id="terminal-input" placeholder="Command Amanda..."><button class="dt-button" onclick="executeAmandaTerminalCommand()">Run</button></div></section><section class="dt-card"><h2 class="dt-card-title">Settlement Mesh</h2><div class="dt-stream" style="height:150px;">Cooperative Bank settlement channel armed.<br>M-Pesa Paybill routing protected in Vercel Vault.<br>Stripe and Hyperswitch connectors vault-mapped.<br>Cross-border rails: WeChat, Alipay, Interswitch, Pesalink, AfriPesa.</div></section></aside></div>',
            renderEnhancedCTOVaultPanel(),
            '<section class="dt-card gold"><h2 class="dt-card-title">Core Farmer &amp; Admin Business Utilities</h2><div class="dt-core-app-grid"><div id="app-holder-farmer-registration"></div><div id="app-holder-farmer-onboarding"></div><div id="app-holder-farmer-dashboard"></div><div id="app-holder-admin-backend"></div></div></section>',
            '<button id="dt-chat-button" onclick="toggleAmandaChat()" aria-label="Open Amanda chatbot">AI</button><section id="dt-chat-panel"><div class="dt-chat-head"><strong style="color:#D4AF37;text-transform:uppercase;">Amanda Master Orchestrator</strong><button class="dt-button silver" onclick="toggleAmandaChat()">Close</button></div><div id="dt-chat-log" class="dt-chat-log"><div class="dt-bubble">Hello Operator. I am Amanda, the primary super agent chatbot node running the operational health of your front-end canvas, backend JSON-RPC engines, and cloud deployments.</div></div><div class="dt-chat-form"><input id="dt-chat-input" placeholder="Command me..."><button class="dt-button" onclick="dispatchAmandaChat()">Send</button></div></section>'
        ].join('');
        renderCards();
        renderCoreBusinessApps();
        bindInputs();
        setInterval(refreshRouterStats, 8000);
        termLog('[DASHBOARD] Titanium Hybrid ERP Master Portal initialized.');
    }

    function renderCoreBusinessApps() {
        DreamTeQ_Core_Apps.renderFarmerRegistrationApp('app-holder-farmer-registration');
        DreamTeQ_Core_Apps.renderFarmerOnboardingApp('app-holder-farmer-onboarding');
        DreamTeQ_Core_Apps.renderFarmerDashboardApp('app-holder-farmer-dashboard');
        DreamTeQ_Core_Apps.renderAdminBackendApp('app-holder-admin-backend');
        console.log('[DREAMTEQ PLATFORM LAYER] Core Business App extensions mounted and running.');
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
            DreamTeQ_ERP_Modules_Engine.modulesRegistry.forEach(function (moduleDef, offset) { appendModule(moduleGrid, offset + 1, moduleDef.ancestry, moduleDef.name); });
            moduleGrid.dataset.rendered = 'true';
        }

        DreamTeQ_ERP_Modules_Engine.injectTitaniumModulesIntoDashboard('titanium-modules-grid-mount');
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
    window.triggerModuleExecutionSandbox = function (moduleId, moduleName) {
        var label = moduleName || moduleId || 'UNKNOWN_MODULE';
        appendCoreLog('[MODULE ACTIVE] Initializing stateless frame context for: ' + label);
        termLog('[ERP SANDBOX] ' + label + ' workspace instantiation pulse issued.');
    };
    window.reloadFrame = function (id) { var frame = document.getElementById(id); if (frame) frame.src = frame.src; };
    window.compileReport = function (mode) { termLog('[REPORT] Compiling A4 ' + mode + ' report matrix for executive export.'); };

    window.verifyCTOGodsGateAuthentication = function () {
        var field = document.getElementById('cto-passphrase-field');
        var actions = document.getElementById('cto-secured-actions');
        if (!field || !actions) return;
        if (!window.crypto || !window.crypto.subtle) {
            termLog('[CTO VAULT] Browser cryptography services unavailable. Vault remains locked.');
            return;
        }

        window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(field.value.trim())).then(function (hashBuffer) {
            var hashHex = Array.prototype.map.call(new Uint8Array(hashBuffer), function (byte) {
                return byte.toString(16).padStart(2, '0');
            }).join('');

            if (hashHex === 'c1c35c81fcbd39d4bd7a90c2e2e702dd869eba8d3601af43507a429e153fddfe') {
                actions.classList.add('active');
                document.getElementById('cto-auth-gate').style.display = 'none';
                termLog('[CTO VAULT] Local CTO enclave unlocked for this browser session.');
            } else {
                termLog('[CTO VAULT] Passphrase rejected. Hash verification failed.');
            }
        }).catch(function () {
            termLog('[CTO VAULT] Passphrase verification failed.');
        });
    };

    window.triggerGodsModeAction = function (action) {
        termLog('[CTO CONSOLE] ' + String(action || 'UNKNOWN').toUpperCase() + ' acknowledged. Server-side execution remains protected behind terminal/cloud controls.');
    };

    window.triggerCTOVaultAction = function (operationalActionCode) {
        var actionCode = String(operationalActionCode || 'UNKNOWN').toUpperCase();
        console.log('[VAULT INTRUSION] Attempting deployment action token confirmation payload: ' + actionCode);

        if (!window.crypto || !window.crypto.subtle) {
            window.alert('ACCESS DENIED: Browser cryptography services unavailable. System locked down.');
            appendCoreLog('[SECURITY ALERT] Crypto services unavailable for action: ' + actionCode);
            return;
        }

        var ctoTokenChallenge = window.prompt('Enter Master Platform CTO Authorization Password Sequence:');
        if (!ctoTokenChallenge) {
            appendCoreLog('[SECURITY ALERT] Empty authorization challenge blocked for action: ' + actionCode);
            return;
        }

        window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(ctoTokenChallenge.trim())).then(function (hashBuffer) {
            var hashHex = Array.prototype.map.call(new Uint8Array(hashBuffer), function (byte) {
                return byte.toString(16).padStart(2, '0');
            }).join('');

            if (hashHex !== 'c1c35c81fcbd39d4bd7a90c2e2e702dd869eba8d3601af43507a429e153fddfe') {
                window.alert('ACCESS DENIED: Invalid identity signature confirmation parameters. System locked down.');
                appendCoreLog('[SECURITY ALERT] Unauthorized access attempt blocked for action: ' + actionCode);
                return;
            }

            appendCoreLog('[GODS MODE ACTIVE] CTO Mr. Allan successfully executed: ' + actionCode + '. Actions synced to container logs.');
            window.alert('Execution successful: ' + actionCode + ' process thread deployed to the local mesh.');
        }).catch(function () {
            window.alert('ACCESS DENIED: Authorization verification failed.');
            appendCoreLog('[SECURITY ALERT] Authorization verification failed for action: ' + actionCode);
        });
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

    // ── WhatsApp Telemetry Live Traffic Logger ────────────────────────────────
    function logLiveWhatsAppTrafficEvent(messageType, statusText) {
        var feed        = document.getElementById('wa-live-traffic-feed');
        var sentCounter = document.getElementById('wa-total-sent');

        if (feed && sentCounter) {
            var activeCount = parseInt(sentCounter.innerText, 10) || 0;
            sentCounter.innerText = activeCount + 1;

            var timeString = new Date().toLocaleTimeString();
            feed.innerHTML += '<br>&gt; [' + timeString + '] Outbound ' + messageType + ' -> Status: ' + statusText;
            feed.scrollTop = feed.scrollHeight;
        }
    }
    window.logLiveWhatsAppTrafficEvent = logLiveWhatsAppTrafficEvent;

    // ── Regional Cooperative Viewport Matrix Controller ───────────────────────
    /**
     * Drives view switches inside the Regional Cooperative Viewport Matrix.
     * @param {string} regionalScopeSelection - ALL | Nairobi_East | Rift_Valley_Central | SADC_Cross_Border
     */
    async function switchRegionalCooperativeDataView(regionalScopeSelection) {
        var contentGrid = document.getElementById('regional-coop-filtered-content-grid');
        if (!contentGrid || typeof DreamTeQ_Core_Apps === 'undefined') return;

        contentGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #D4AF37;">Querying PouchDB records matching regional signature token: ' + regionalScopeSelection + '...</div>';

        try {
            var allRecords = await DreamTeQ_Core_Apps.databases.farmers.allDocs({ include_docs: true });

            var filteredRows = allRecords.rows.filter(function (row) {
                if (regionalScopeSelection === 'ALL') return true;
                return row.doc && row.doc.coop === regionalScopeSelection;
            });

            if (filteredRows.length === 0) {
                contentGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #888; padding: 20px;">Zero active smallholder profiles registered under this cooperative sector node.</div>';
                return;
            }

            contentGrid.innerHTML = filteredRows.map(function (row) {
                var doc = row.doc;
                return '<div style="background: #030504; border: 1px solid #222; border-left: 3px solid #D4AF37; padding: 15px; border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">' +
                    '<div style="font-size: 0.75rem; font-family: monospace; color: #888; margin-bottom: 5px;">ID: ' + doc._id + '</div>' +
                    '<div style="color: #FFF; font-weight: bold; font-size: 1.05rem; margin-bottom: 8px;">' + doc.name + '</div>' +
                    '<div style="font-size: 0.82rem; color: #C0C0C0;">Phone Link: <span style="font-family: monospace;">' + doc.phone + '</span></div>' +
                    '<div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">' +
                        '<span style="font-size: 0.7rem; color: #888; text-transform: uppercase;">KYC Status</span>' +
                        '<span style="background: rgba(52,211,153,0.1); color: #34D399; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">' + doc.kyc_status + '</span>' +
                    '</div>' +
                '</div>';
            }).join('');

        } catch (err) {
            contentGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #EF4444;">Error mapping database entries: ' + err.message + '</div>';
        }
    }
    window.switchRegionalCooperativeDataView = switchRegionalCooperativeDataView;

})();
