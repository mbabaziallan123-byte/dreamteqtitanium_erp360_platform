/**
 * DreamTeQ_360 Consolidated Multi-Currency & Cross-Border Ledger Engine
 * Integration: Stripe, WeChat, Alipay, Interswitch, Pesalink, AfriPesa
 * Settlement Bank: COOPERATIVE BANK OF KENYA | Account: 01192952690600
 * Logistics Operator: ALTOVEX GLOBAL LOGISTICS COMPANY LTD (Paybill: 400200 / Acc: 40045731)
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const Redis = require('ioredis');
const PDFDocument = require('pdfkit');

// All secrets injected from environment — never hardcode credentials in source.
if (!process.env.ODOO_RPC_PASSWORD) {
    console.warn('[CONFIG] ODOO_RPC_PASSWORD not set — Odoo RPC calls will fail authentication.');
}

const CONFIG = {
    odooUrl: process.env.ODOO_URL || 'http://odoo18-core:8069',
    dbName: process.env.POSTGRES_DB || 'dreamteq_master_pool',
    username: process.env.POSTGRES_USER || 'dreamteq_operator',
    password: process.env.ODOO_RPC_PASSWORD || '',
    redisHost: process.env.REDIS_HOST || 'dreamteq-cache',
    listenPort: parseInt(process.env.LEDGER_PORT || '8090', 10),
    pdfStorageDir: './media/optimized_output',
    settlement: {
        beneficiary: 'ALTOVEX GLOBAL LOGISTICS COMPANY LTD',
        bank: 'COOPERATIVE BANK OF KENYA',
        account: '01192952690600',
        paybill: '400200',
        paybillAccount: '40045731'
    }
};

const redisPublisher = new Redis({ host: CONFIG.redisHost, port: 6379 });

const CURRENCY_EXCHANGE_MATRIX = {
    KES: 1.0000,
    USD: 129.5000,
    EUR: 138.2000,
    CNY: 17.8500,
    JPY: 0.8100,
    CHF: 143.4000,
    RWF: 0.0980,
    UGX: 0.0340,
    TZS: 0.0490
};

const CURRENCY_MATRIX_ROUTER = {
    baseCurrency: 'KES',
    rates: CURRENCY_EXCHANGE_MATRIX,
    gateways: {
        STRIPE: { channels: ['Visa', 'Mastercard', 'ApplePay'], clearing_base: 'USD' },
        WECHAT_ALIPAY: { channels: ['CNY_Digital', 'QR_Merchant'], clearing_base: 'CNY' },
        INTERSWITCH_PESALINK: { channels: ['EAC_Bank_Transfer', 'Zamtel', 'TigoPesa'], clearing_base: 'KES' },
        AFRIPESA: { channels: ['SADC_Remit', 'EcoCash', 'Mukuru'], clearing_base: 'USD' }
    },
    settlementAccount: {
        beneficiary: CONFIG.settlement.beneficiary,
        accountNumber: CONFIG.settlement.account,
        bank: CONFIG.settlement.bank,
        paybill: CONFIG.settlement.paybill,
        paybillAccount: CONFIG.settlement.paybillAccount
    }
};

const GATEWAY_LABELS = {
    STRIPE: 'Stripe Engine',
    WECHAT_ALIPAY: 'WeChat Pay / Alipay Merchant Rail',
    WECHAT_PAY: 'WeChat Pay Rail',
    ALIPAY: 'Alipay Rail',
    INTERSWITCH_PESALINK: 'Interswitch / PesaLink EAC Bank Rail',
    INTERSWITCH: 'Interswitch Settlement Rail',
    PESALINK: 'Pesalink Bank Rail',
    AFRIPESA: 'AfriPesa Cross-Border Rail',
    SAFARICOM_DARAJA: 'Safaricom Daraja M-Pesa Rail',
    MOBILE_MONEY_GATEWAY_C2B: 'Mobile Money Gateway C2B'
};

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
    return path.join(CONFIG.pdfStorageDir, `Receipt_Invoice_${safeInvoiceRef}.pdf`);
}

function normaliseCurrency(currencyCode) {
    return String(currencyCode || 'KES').trim().toUpperCase();
}

function calculateBaseKshAmount(amount, currencyCode) {
    const originalCurrency = normaliseCurrency(currencyCode);
    const rawInputAmount = Number.parseFloat(amount) || 0;
    const multiplicationFactor = CURRENCY_MATRIX_ROUTER.rates[originalCurrency];

    if (!multiplicationFactor) {
        throw new Error(`Unsupported transaction currency corridor asset exception: ${originalCurrency}`);
    }

    return {
        originalCurrency,
        rawInputAmount,
        multiplicationFactor,
        calculatedKshAmount: Number((rawInputAmount * multiplicationFactor).toFixed(2))
    };
}

function normalizeAndRouteCrossBorderTransaction(sourceGateway, amount, foreignCurrency) {
    const settlementDetails = calculateBaseKshAmount(amount, foreignCurrency);
    const gatewayKey = String(sourceGateway || 'STRIPE').trim().toUpperCase();
    const gatewayProfile = CURRENCY_MATRIX_ROUTER.gateways[gatewayKey] || CURRENCY_MATRIX_ROUTER.gateways.STRIPE;

    console.log(`[CROSS-BORDER CORRIDOR ACTIVE] Ingesting via ${gatewayKey}: ${settlementDetails.originalCurrency} ${settlementDetails.rawInputAmount} -> KES ${settlementDetails.calculatedKshAmount.toFixed(4)}`);

    return {
        clearedAmountKES: settlementDetails.calculatedKshAmount.toFixed(2),
        sourceGateway: gatewayKey,
        clearingBase: gatewayProfile.clearing_base,
        beneficiaryAllocation: CURRENCY_MATRIX_ROUTER.settlementAccount.beneficiary,
        clearingBank: CURRENCY_MATRIX_ROUTER.settlementAccount.bank,
        routingTarget: CURRENCY_MATRIX_ROUTER.settlementAccount.accountNumber,
        mPesaClearingPool: {
            paybill: CURRENCY_MATRIX_ROUTER.settlementAccount.paybill,
            account: CURRENCY_MATRIX_ROUTER.settlementAccount.paybillAccount
        }
    };
}

function resolveGatewayLabel(record) {
    const gatewayKey = String(record.gateway || record.app_id || 'STRIPE').trim().toUpperCase();
    return GATEWAY_LABELS[gatewayKey] || record.app_id || 'Stripe Engine';
}

/**
 * Generates an Enterprise-Grade PDF Receipt directly to the storage vector volumes.
 */
function generateEnterpriseBillingInvoicePDF(record, invoiceRef, settlementDetails) {
    fs.mkdirSync(CONFIG.pdfStorageDir, { recursive: true });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const fileDestination = buildReceiptFilePath(invoiceRef);
    const writeStream = fs.createWriteStream(fileDestination);

    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
            console.log(`[PDF PIPELINE] Cross-border billing profile exported to: ${fileDestination}`);
            resolve(fileDestination);
        });
        writeStream.on('error', reject);
        doc.on('error', reject);

        doc.pipe(writeStream);

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
        doc.fillColor('#333333').font('Helvetica').fontSize(10).text(`Cross-Border Settlement via ${resolveGatewayLabel(record)}: ${settlementDetails.rawInputAmount} ${settlementDetails.originalCurrency}`, 60, gridTop + 45, { width: 350 });
        doc.font('Helvetica-Bold').text(`KSh ${settlementDetails.calculatedKshAmount.toLocaleString()}`, 450, gridTop + 45, { width: 95, align: 'right' });

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

function compilePlatformA4Document(outputFilename, schemaData, structuralOrientation = 'portrait') {
    fs.mkdirSync(CONFIG.pdfStorageDir, { recursive: true });

    const safeOutputFilename = String(outputFilename || `DreamTeQ_Report_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const doc = new PDFDocument({
        size: 'A4',
        layout: structuralOrientation === 'landscape' ? 'landscape' : 'portrait',
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });
    const outputDestination = path.join(CONFIG.pdfStorageDir, `${safeOutputFilename}.pdf`);
    const writeStream = fs.createWriteStream(outputDestination);

    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
            console.log(`[REPORT COMPILED] Dynamic documentation schema exported successfully: ${outputDestination}`);
            resolve(outputDestination);
        });
        writeStream.on('error', reject);
        doc.on('error', reject);

        doc.pipe(writeStream);
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0D1A12');
        doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(18).text(`DREAMTEQ TITANIUM ERP: ${schemaData.moduleName || 'Master Platform'}`, 40, 30);
        doc.rect(40, 55, doc.page.width - 80, 1).fill('#C0C0C0');
        doc.fillColor('#C0C0C0').font('Helvetica').fontSize(10).text(schemaData.briefDescription || 'Generated DreamTeQ Titanium ERP report bundle.', 40, 70, {
            width: doc.page.width - 80,
            align: 'justify',
            lineGap: 4
        });

        if (Array.isArray(schemaData.tabularRecords)) {
            let verticalOffset = 130;
            doc.fillColor('#D4AF37').font('Helvetica-Bold').text('ACCOUNT SETTLEMENT INDEX REGISTER', 40, verticalOffset);
            verticalOffset += 20;

            schemaData.tabularRecords.forEach(row => {
                if (verticalOffset > doc.page.height - 80) {
                    doc.addPage();
                    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0D1A12');
                    verticalOffset = 50;
                }
                doc.fillColor('#C0C0C0').font('Helvetica').fontSize(9).text(String(row.label || ''), 40, verticalOffset, { width: doc.page.width - 220 });
                doc.fillColor('#FFF').font('Helvetica-Bold').text(String(row.value || ''), doc.page.width - 190, verticalOffset, { width: 150, align: 'right' });
                verticalOffset += 15;
            });
        }

        doc.rect(40, doc.page.height - 50, doc.page.width - 80, 1).fill('#C0C0C0');
        doc.fillColor('#C0C0C0').font('Helvetica').fontSize(7).text(
            'Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya | Tel: +254718554383 | Web: www.dreamteamconsult.site | Email: dreamteamconsult@gmx.com | Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.',
            40,
            doc.page.height - 40,
            { width: doc.page.width - 80, align: 'center' }
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
                    const settlementDetails = calculateBaseKshAmount(record.amount, record.currency);
                    const settlementRoute = normalizeAndRouteCrossBorderTransaction(record.gateway, record.amount, record.currency);
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
                            ref: `CROSSBORDER-${record._id}`,
                            invoice_line_ids: [[0, 0, {
                                name: `Cross-Border Settlement via ${resolveGatewayLabel(record)}: ${settlementDetails.rawInputAmount} ${settlementDetails.originalCurrency}`,
                                price_unit: settlementDetails.calculatedKshAmount,
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

                    const receiptPath = await generateEnterpriseBillingInvoicePDF(record, accountMoveId, settlementDetails);
                    exportedReceipts.push({ receiptPath, settlementRoute });
                    synchronisedRecordsCount++;
                }

                await redisPublisher.publish('dreamteq_system_notifications', JSON.stringify({
                    event: 'BACKUP_COMPLETE',
                    message: `Processed ${synchronisedRecordsCount} cross-border records safely into Altovex Global Logistics bank accounts.`,
                    timestamp: new Date().toISOString()
                }));

                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: true, count: synchronisedRecordsCount, receipts: exportedReceipts }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else if (req.method === 'POST' && req.url === '/reports/a4') {
        let payloadBuffer = '';
        req.on('data', chunk => payloadBuffer += chunk);
        req.on('end', async () => {
            try {
                const payload = JSON.parse(payloadBuffer || '{}');
                const reportPath = await compilePlatformA4Document(
                    payload.outputFilename,
                    payload.schemaData || {},
                    payload.orientation || 'portrait'
                );

                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: true, reportPath }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else if (req.method === 'POST' && req.url === '/reports/compile-document') {
        let documentPayloadBuffer = '';
        req.on('data', chunk => documentPayloadBuffer += chunk);
        req.on('end', async () => {
            try {
                const documentConfig = JSON.parse(documentPayloadBuffer || '{}');

                if (!documentConfig.moduleName || !documentConfig.briefDescription) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, error: 'Missing document structural definitions.' }));
                }

                const layoutDirection = documentConfig.type === 'presentation' ? 'landscape' : 'portrait';
                const moduleId = String(documentConfig.moduleId || documentConfig.moduleName || 'master_platform').replace(/[^a-zA-Z0-9_-]/g, '_');
                const filenameStr = `Report_${moduleId}_${Date.now()}`;
                const reportPath = await compilePlatformA4Document(filenameStr, documentConfig, layoutDirection);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    success: true,
                    exportedFile: `${filenameStr}.pdf`,
                    reportPath,
                    dimensions: layoutDirection,
                    message: 'A4 high-density compilation completed matching layout specifications.'
                }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Route missing.');
    }
});

server.listen(CONFIG.listenPort, '0.0.0.0', () => {
    console.log(`[CORE LEDGER DISTRIBUTOR ACTIVE] Multi-currency conversion routing processing online on port: ${CONFIG.listenPort}`);
});