/**
 * DreamTeQ_360 Odoo 18 Production Backup & Retention Manager
 * Architecture: Automated Rotation Archive System (30-Day Limit)
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { exec } = require('child_process');

const BACKUP_DIR    = path.join(__dirname, 'backups', 'local_state', 'odoo_archives');
const RETENTION_MS  = 30 * 24 * 60 * 60 * 1000; // 30-day threshold

// Ensure backup directory exists before any operations
fs.mkdirSync(BACKUP_DIR, { recursive: true });

function runOdooBackupAndPurge() {
    console.log("=== [STARTING ODOO 18 DATA BACKUP MATRIX] ===");

    const timestamp = Date.now();
    const filename  = `Odoo_Prod_Backup_${timestamp}.dump`;
    const targetPath = path.join(BACKUP_DIR, filename);

    // Execute pg_dump via the running Postgres container
    const backupCmd = `docker exec dreamteq_postgres_core pg_dump -U dreamteq_operator -d dreamteq_master_pool -F c -f /var/lib/postgresql/data/${filename}`;

    exec(backupCmd, (err) => {
        if (err) {
            console.error("Odoo core hot-backup failed:", err.message);
            return;
        }

        // Copy the dump out of the container volume to local host
        const moveCmd = `docker cp dreamteq_postgres_core:/var/lib/postgresql/data/${filename} "${targetPath}"`;
        exec(moveCmd, (moveErr) => {
            if (moveErr) {
                console.error("Failed to copy dump from container:", moveErr.message);
                return;
            }

            console.log(`SUCCESS: Odoo backup snapshot saved to: ${targetPath}`);

            // Clean up temp file inside the container
            exec(`docker exec dreamteq_postgres_core rm /var/lib/postgresql/data/${filename}`, (rmErr) => {
                if (rmErr) console.warn("Container temp file removal warning:", rmErr.message);
            });

            executeRetentionPurge();
        });
    });
}

function executeRetentionPurge() {
    console.log("-> Running snapshot archive rotation checks against 30-day retention policies...");

    fs.readdir(BACKUP_DIR, (err, files) => {
        if (err) {
            console.error("Retention scan failed:", err.message);
            return;
        }

        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(BACKUP_DIR, file);
            fs.stat(filePath, (statErr, stats) => {
                if (statErr) return;
                if ((now - stats.mtimeMs) > RETENTION_MS) {
                    fs.unlink(filePath, (unlinkErr) => {
                        if (!unlinkErr) console.log(`Purged expired Odoo snapshot: ${file}`);
                    });
                }
            });
        });
    });
}

runOdooBackupAndPurge();

/*
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 * Tel: +254718554383 | Web: www.dreamteamconsult.site | Email: dreamteamconsult@gmx.com
 * Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.
 */
