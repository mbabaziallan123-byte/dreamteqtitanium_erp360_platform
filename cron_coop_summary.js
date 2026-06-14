/**
 * DreamTeQ_360 Weekly Cooperative Summary Auto-Scheduler
 * Execution Profile: Scheduled Friday 17:00 EAT Core Run
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const CoopAnalyticsEngine = require('./coop_analytics');
const { sendWhatsAppAlert }  = require('./whatsapp_notifier');

const CRON_LOG = path.join(__dirname, 'backups', 'local_state', 'coop_summary_cron_log.txt');

function appendLog(msg) {
    const logStr = `[${new Date().toISOString()}] ${msg}\n`;
    try {
        fs.mkdirSync(path.dirname(CRON_LOG), { recursive: true });
        fs.appendFileSync(CRON_LOG, logStr, 'utf8');
    } catch (_) { /* log dir may not exist yet; console output still works */ }
    console.log(msg);
}

async function runWeeklySummaryPipeline() {
    appendLog("=== [STARTING SCHEDULED WEEKLY COOPERATIVE STATUS DISPATCH] ===");

    try {
        const metrics = await CoopAnalyticsEngine.aggregateRegionalPerformanceMetrics();
        if (!metrics) throw new Error("Analytics aggregator returned null payload records.");

        // Compile high-density metric block text string for WhatsApp template delivery
        const summaryText =
            `Nairobi East: KSh ${metrics.Nairobi_East.totalVolume.toLocaleString()} (${metrics.Nairobi_East.transactionsCount} tx) | ` +
            `Rift Valley: KSh ${metrics.Rift_Valley_Central.totalVolume.toLocaleString()} (${metrics.Rift_Valley_Central.transactionsCount} tx) | ` +
            `SADC Hub: KSh ${metrics.SADC_Cross_Border.totalVolume.toLocaleString()} (${metrics.SADC_Cross_Border.transactionsCount} tx)`;

        const timestampStr = new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });

        // Dispatch compiled summary to Meta API template fields
        sendWhatsAppAlert('dreamteq_weekly_summary', [summaryText, timestampStr]);
        appendLog("SUCCESS: Weekly report pushed to WhatsApp channels successfully.");

    } catch (err) {
        appendLog(`CRITICAL CRON FAILURE: ${err.message}`);
    }

    appendLog("=== [WEEKLY SCHEDULED PIPELINE RUN CONCLUDED] ===");
}

runWeeklySummaryPipeline();

/*
 * Register as a Windows Scheduled Task (run once in an elevated PowerShell window):
 *
 * $Action  = New-ScheduledTaskAction -Execute "node.exe" -Argument "C:\Users\25479\Downloads\cron_coop_summary.js"
 * $Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Friday -At 5:00PM
 * Register-ScheduledTask -TaskName "DreamTeQ_Weekly_Coop_Summary" `
 *     -Action $Action -Trigger $Trigger `
 *     -Description "Automated Friday weekly regional status summary pushed by Amanda." -Force
 *
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 * Tel: +254718554383 | Web: www.dreamteamconsult.site | Email: dreamteamconsult@gmx.com
 * Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.
 */
