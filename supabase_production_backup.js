/**
 * DreamTeQ_360 Automated Supabase Production Database Cloud Backup Utility
 * Architecture: Automated Lifecycle Data Vault Snapshot Engine
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { exec } = require('child_process');

const BACKUP_LOG_PATH = path.join(__dirname, 'backups', 'local_state', 'supabase_cloud_backup_log.txt');

// Read the connection string from env only — never hardcode credentials.
const DATABASE_CONNECTION_STRING = process.env.SUPABASE_PRODUCTION_DB_URL || '';

function writeLog(messageText) {
    const entry = `[${new Date().toISOString()}] ${messageText}\n`;
    try {
        fs.appendFileSync(BACKUP_LOG_PATH, entry, 'utf8');
    } catch (_) { /* log dir may not yet exist; console output still works */ }
    console.log(messageText);
}

async function runProductionSupabaseBackup() {
    writeLog("=== [STARTING PRODUCTION DATABASE SNAPSHOT] ===");

    // Abort early rather than running pg_dump with a blank or placeholder URL.
    if (!DATABASE_CONNECTION_STRING) {
        writeLog("ABORT: SUPABASE_PRODUCTION_DB_URL is not set. Set the env variable before running this script.");
        process.exit(1);
    }

    const targetFilename = `Supabase_Production_Backup_${Date.now()}.sql`;
    const targetDestinationPath = path.join(__dirname, 'backups', 'local_state', targetFilename);

    // Ensure the backup directory exists before writing.
    fs.mkdirSync(path.dirname(targetDestinationPath), { recursive: true });

    // Execute pg_dump command using native system command line pipes.
    // pg_dump must be installed locally (bundled with PostgreSQL client tools).
    const dumpExecutionCommand = `pg_dump "${DATABASE_CONNECTION_STRING}" -F c -f "${targetDestinationPath}"`;

    writeLog(`[EXEC] Starting pg_dump -> ${targetFilename}`);
    exec(dumpExecutionCommand, (error, stdout, stderr) => {
        if (error) {
            writeLog(`CRITICAL DUMP EXECUTION FAULT: ${error.message}`);
            if (stderr) writeLog(`[STDERR] ${stderr.trim()}`);
            process.exit(1);
            return;
        }

        // Assert file size data indicators to verify data integrity.
        if (fs.existsSync(targetDestinationPath)) {
            const stats = fs.statSync(targetDestinationPath);
            const fileSizeKiloBytes = (stats.size / 1024).toFixed(2);

            if (stats.size > 0) {
                writeLog("SUCCESS: Cloud database tables exported securely to local storage archive.");
                writeLog(`-> Snapshot File Element Identity: ${targetFilename}`);
                writeLog(`-> Allocated Document Disk Size: ${fileSizeKiloBytes} KB`);
                writeLog("=== [PRODUCTION BACKUP MATRIX CONCLUDED SUCCESSFULLY] ===");
                process.exit(0);
            } else {
                writeLog("ERROR: Generated snapshot file contains 0 bytes. Database structure trace empty.");
                process.exit(1);
            }
        } else {
            writeLog("ERROR: Expected output file was not found after pg_dump completed.");
            process.exit(1);
        }
    });
}

runProductionSupabaseBackup();

/*
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 * Tel: +254718554383 | Web: www.dreamteamconsult.site | Email: dreamteamconsult@gmx.com
 * Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.
 */
