/**
 * DreamTeQ_360 Odoo 18 JSON-RPC Middleware & PDF Extraction Pipeline
 * Architecture: Stateless JSON-RPC 2.0 Ingestion Pipeline + PDF Kit Generator
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const Redis = require('ioredis');
const PDFDocument = require('pdfkit');

const CONFIG = {
    odooUrl: 'http://odoo18-core:8069',
    dbName: 'dreamteq_master_pool',
    username: 'dreamteq_operator',
    password: 'SecretTitaniumPassword360',
    redisHost: 'dreamteq-cache',
    listenPort: 8090,
    pdfStorageDir: './media/optimized_output'
};

const redisPublisher = new Redis({ host: CONFIG.redisHost, port: 6379 });

async function callOdooRPC(pathStr, service, method, args) {
    const payload = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
            db: CONFIG.dbName,
            login: CONFIG.username,
            password: CONFIG.password,
            service,
            method,
            args
        },
        id: Math.floor(Math.random() * 100000)
    };

    const payloadString = JSON.stringify(payload);

    return new Promise((resolve, reject) => {
        const req = http.request(`${CONFIG.odooUrl}${pathStr}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payloadString)
            }
        }, (res) => {
            let bufferData = '';
            res.on('data', chunk => bufferData += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(bufferData);
                    if (parsed.error) return reject(new Error(JSON.stringify(parsed.error)));
                    resolve(parsed.result);
                } catch (err) {
                    reject(new Error('Invalid JSON RPC stream response.'));
                }
            });
        });

        req.on('error', err => reject(err));
        req.write(payloadString);
        req.end();
    });
}

function buildReceiptFilePath(invoiceRef) {
    const safeInvoiceRef = String(invoiceRef).replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(CONFIG.pdfStorageDir, `Receipt_${safeInvoiceRef}.pdf`);
}

/**
 * Generates an Enterprise-Grade PDF Receipt directly to the storage vector volumes.
 */
function extractBillingPDFReceipt(record, invoiceRef) {
    fs.mkdirSync(CONFIG.pdfStorageDir, { recursive: true });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const fileDestination = buildReceiptFilePath(invoiceRef);
    const writeStream = fs.createWriteStream(fileDestination);

    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
            console.log(`[PDF PIPELINE] Billing transaction layout vector exported to: ${fileDestination}`);
            resolve(fileDestination);
        });
        writeStream.on('error', reject);
        doc.on('error', reject);

        doc.pipe(writeStream);

        // Luxury Layout Style Injections: Deep Dark Obsidian Green and Rich Gold Branding Accents
        doc.rect(0, 0, 595, 120).fill('#0B130E');

        // Header Vector Branding
        doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(24).text('DREAMTEQ_360 FARMER PLATFORM', 50, 40);
        doc.fillColor('#C0C0C0').font('Helvetica').fontSize(10).text('OFFLINE-FIRST TITANIUM HYBRID ENGINE INTEGRATION', 50, 70);

        // Receipt Metadata Blocks
        doc.fillColor('#333333').font('Helvetica-Bold').fontSize(14).text('DIGITAL ACCOUNT SETTLEMENT RECEIPT', 50, 150);
        doc.moveDown();
        doc.font('Helvetica').fontSize(11).fillColor('#555555');
        doc.text(`Odoo Invoice Tracking Reference: ${invoiceRef}`);
        doc.text(`Amanda Cryptographic Validation Reference Hash: DT360-SYNC-${record._id}`);
        doc.text(`Originating Mini-App Component Identifier: ${record.app_id}`);
        doc.text(`Smallholder/Farmer ID Mapping Value: ${record.farmer_id}`);
        doc.text(`Transaction Synchronization Date: ${new Date().toUTCString()}`);

        // Billing Line Item Grid Layout Simulation Matrix
        doc.moveDown(2);
        const gridTop = doc.y;
        doc.rect(50, gridTop, 495, 25).fill('#0B130E');
        doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(10).text('ITEM DESCRIPTION', 60, gridTop + 8);
        doc.text('TOTAL CHARGE', 450, gridTop + 8);

        const amount = Number.parseFloat(record.amount) || 0;
        doc.fillColor('#333333').font('Helvetica').fontSize(10).text(`Ecosystem Processing Ingestion Volume - ${record.app_id}`, 60, gridTop + 45, { width: 350 });
        doc.font('Helvetica-Bold').text(`KSh ${amount.toLocaleString()}`, 450, gridTop + 45, { width: 95, align: 'right' });

        // Standard Multi-Platform Footer Trace Mandate Binding Injection
        doc.rect(0, 762, 595, 80).fill('#0B130E');
        doc.fillColor('#C0C0C0').font('Helvetica').fontSize(8).text(
            'Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya | Tel: +254718554383 | Web: www.dreamteamconsult.site | Email: dreamteamconsult@gmx.com | Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.',
            50,
            785,
            { width: 495, align: 'center', lineGap: 4 }
        );

        doc.end();
    });
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        return res.end();
    }

    if (req.method === 'POST' && req.url === '/sync/ledger') {
        let payloadBuffer = '';
        req.on('data', chunk => payloadBuffer += chunk);
        req.on('end', async () => {
            try {
                const batchDataset = JSON.parse(payloadBuffer);
                if (!Array.isArray(batchDataset)) throw new Error('Ledger sync payload must be an array.');

                let synchronisedRecordsCount = 0;
                const exportedReceipts = [];

                for (let record of batchDataset) {
                    const partnerIds = await callOdooRPC('/jsonrpc', 'object', 'execute_kw', [
                        CONFIG.dbName,
                        2,
                        CONFIG.password,
                        'res.partner',
                        'search',
                        [[['ref', '=', record.farmer_id]]]
                    ]);

                    if (partnerIds.length === 0) continue;

                    const accountMoveId = await callOdooRPC('/jsonrpc', 'object', 'execute_kw', [
                        CONFIG.dbName,
                        2,
                        CONFIG.password,
                        'account.move',
                        'create',
                        [{
                            partner_id: partnerIds[0],
                            move_type: 'out_invoice',
                            ref: `DT360-SYNC-${record._id}`,
                            invoice_line_ids: [[0, 0, {
                                name: `Ecosystem Sync Transaction Volume: ${record.app_id}`,
                                price_unit: Number.parseFloat(record.amount) || 0,
                                quantity: 1
                            }]]
                        }]
                    ]);

                    await callOdooRPC('/jsonrpc', 'object', 'execute_kw', [
                        CONFIG.dbName,
                        2,
                        CONFIG.password,
                        'account.move',
                        'action_post',
                        [[accountMoveId]]
                    ]);

                    // Trigger PDF extraction pipeline immediately upon successful ledger posting loop.
                    const receiptPath = await extractBillingPDFReceipt(record, accountMoveId);
                    exportedReceipts.push(receiptPath);
                    synchronisedRecordsCount++;
                }

                await redisPublisher.publish('dreamteq_system_notifications', JSON.stringify({
                    event: 'BACKUP_COMPLETE',
                    message: `Successfully updated ${synchronisedRecordsCount} items directly into Odoo 18 Partner Ledgers and exported vector PDF receipts.`,
                    timestamp: new Date().toISOString()
                }));

                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: true, count: synchronisedRecordsCount, receipts: exportedReceipts }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Route unrecognized.');
    }
});

server.listen(CONFIG.listenPort, '0.0.0.0', () => {
    console.log(`[LEDGER MIDDLEWARE ONLINE] Running JSON-RPC nodes with PDF Extractor on port: ${CONFIG.listenPort}`);
});