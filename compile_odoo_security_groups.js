/**
 * DreamTeQ_360 Odoo 18 Security Permission Schema Compiler
 * Emits XML groups, ir.model.access.csv rows, and sensitive-column policy metadata.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'security');
const groupMatrix = [
    { id: 'group_dreamteq_cto_master', name: 'DreamTeQ CTO Master Vault', category: 'DreamTeQ Titanium ERP' },
    { id: 'group_dreamteq_finance_controller', name: 'DreamTeQ Finance Controller', category: 'DreamTeQ Titanium ERP' },
    { id: 'group_dreamteq_logistics_operator', name: 'DreamTeQ Altovex Logistics Operator', category: 'DreamTeQ Titanium ERP' },
    { id: 'group_dreamteq_field_agent', name: 'DreamTeQ Field Extension Agent', category: 'DreamTeQ Titanium ERP' },
    { id: 'group_dreamteq_auditor_readonly', name: 'DreamTeQ Read-Only Compliance Auditor', category: 'DreamTeQ Titanium ERP' }
];

const modelAccessRows = [
    ['access_dreamteq_crossborder_ledger_cto', 'dreamteq.crossborder.ledger cto', 'model_dreamteq_crossborder_ledger', 'group_dreamteq_cto_master', 1, 1, 1, 1],
    ['access_dreamteq_crossborder_ledger_finance', 'dreamteq.crossborder.ledger finance', 'model_dreamteq_crossborder_ledger', 'group_dreamteq_finance_controller', 1, 1, 0, 0],
    ['access_dreamteq_crossborder_ledger_logistics', 'dreamteq.crossborder.ledger logistics', 'model_dreamteq_crossborder_ledger', 'group_dreamteq_logistics_operator', 1, 0, 0, 0],
    ['access_dreamteq_crossborder_ledger_auditor', 'dreamteq.crossborder.ledger auditor', 'model_dreamteq_crossborder_ledger', 'group_dreamteq_auditor_readonly', 1, 0, 0, 0],
    ['access_dreamteq_farmer_profile_field_agent', 'dreamteq.farmer.profile field agent', 'model_dreamteq_farmer_profile', 'group_dreamteq_field_agent', 1, 1, 0, 0],
    ['access_dreamteq_settlement_route_cto', 'dreamteq.settlement.route cto', 'model_dreamteq_settlement_route', 'group_dreamteq_cto_master', 1, 1, 1, 1],
    ['access_dreamteq_settlement_route_finance', 'dreamteq.settlement.route finance', 'model_dreamteq_settlement_route', 'group_dreamteq_finance_controller', 1, 1, 0, 0],
    ['access_dreamteq_security_event_auditor', 'dreamteq.security.event auditor', 'model_dreamteq_security_event', 'group_dreamteq_auditor_readonly', 1, 0, 0, 0]
];

const sensitiveColumnPolicies = [
    { model: 'dreamteq.crossborder.ledger', fields: ['routing_target', 'paybill_account', 'cleared_amount_kes', 'source_gateway', 'merchant_reference'], writeGroups: ['group_dreamteq_cto_master', 'group_dreamteq_finance_controller'] },
    { model: 'dreamteq.settlement.route', fields: ['beneficiary_account_number', 'bank_identifier', 'paybill', 'paybill_account'], writeGroups: ['group_dreamteq_cto_master'] },
    { model: 'dreamteq.farmer.profile', fields: ['phone_number', 'national_id', 'geolocation_polygon', 'credit_score_vector'], writeGroups: ['group_dreamteq_cto_master', 'group_dreamteq_field_agent'] },
    { model: 'res.partner.bank', fields: ['acc_number', 'bank_id', 'sanitized_acc_number'], writeGroups: ['group_dreamteq_cto_master', 'group_dreamteq_finance_controller'] }
];

function compileXml() {
    const records = groupMatrix.map(group => [
        `        <record id="${group.id}" model="res.groups">`,
        `            <field name="name">${group.name}</field>`,
        '            <field name="category_id" ref="base.module_category_accounting"/>',
        '        </record>'
    ].join('\n')).join('\n\n');

    return ['<?xml version="1.0" encoding="utf-8"?>', '<odoo>', '    <data noupdate="1">', records, '    </data>', '</odoo>', ''].join('\n');
}

function compileCsv() {
    const header = 'id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink';
    return [header].concat(modelAccessRows.map(row => row.join(','))).join('\n') + '\n';
}

function compileManifestSnippet() {
    return JSON.stringify({
        security: [
            'security/dreamteq_security_groups.xml',
            'security/ir.model.access.csv'
        ],
        sensitiveColumnPolicies
    }, null, 2) + '\n';
}

function run() {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'dreamteq_security_groups.xml'), compileXml());
    fs.writeFileSync(path.join(outputDir, 'ir.model.access.csv'), compileCsv());
    fs.writeFileSync(path.join(outputDir, 'dreamteq_sensitive_field_rules.json'), JSON.stringify(sensitiveColumnPolicies, null, 2) + '\n');
    fs.writeFileSync(path.join(outputDir, 'manifest_security_snippet.json'), compileManifestSnippet());
    console.log('[ODOO SECURITY] Compiled DreamTeQ Odoo 18 security groups and sensitive-column policy files.');
}

run();
