/**
 * DreamTeQ_360 Automated Sunday Midnight PDF Layout Audit Cron Service
 * Purpose: Sunday Midnight Execution Engine tracking A4 document integrity and corporate trace validations
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const LOG_FILE = path.join(__dirname, 'backups', 'local_state', 'pdf_cron_audit_log.txt');

function logAuditResult(messageText) {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    const logEntry = `[${new Date().toISOString()}] ${messageText}\n`;
    fs.appendFileSync(LOG_FILE, logEntry, 'utf8');
    console.log(messageText);
}

logAuditResult('=== STARTING SCHEDULED WEEKLY SUNDAY MIDNIGHT PDF STRUCTURAL AUDIT ===');

const harnessPath = path.join(__dirname, 'test_pdf_structure.js');
if (!fs.existsSync(harnessPath)) {
    logAuditResult('CRITICAL ERROR: test_pdf_structure.js script module is missing from the directory tree.');
    process.exit(1);
}

exec('docker exec dreamteq_ledger_broker node test_pdf_structure.js', (error, stdout, stderr) => {
    if (error) {
        logAuditResult(`SYSTEM AUDIT CRITICAL FAULT: ${error.message}`);
        return;
    }

    if (stderr) {
        logAuditResult(`PROCESS STANDARD ERROR TELEMETRY DETECTED: ${stderr}`);
    }

    logAuditResult('=== WEEKLY TEST RESULTS RECEIVED ===');
    logAuditResult(stdout.trim());
    logAuditResult('=== END OF LOGGED WEEKLY TRANSIT MATRIX ===');
});
