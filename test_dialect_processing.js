/**
 * DreamTeQ_360 Automated Dialect Processing & Ingestion Test Suite
 * Purpose: Validates phonetic string normalization and pipeline execution parameters
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */
'use strict';

const assert = require('assert');
const { normalizeLocalDialectSpeech } = require('./ollama-bridge');

const testCases = [
    { input: 'Nahitaji kununua mbolea kwa shamba langu', expected: 'fertilizer' },
    { input: 'Pesa ya maziwa bado haijaingia kwenye ledger', expected: 'dairy revenue liquidation' },
    { input: 'Tunaanza kuhama mzunguko msimu huu', expected: 'crop rotation' }
];

async function runDialectAuditSuite() {
    console.log('=== [STARTING DYNAMIC DIALECT NORMALISATION AUDIT] ===');
    let passedTestsCount = 0;

    for (const test of testCases) {
        try {
            console.log('-> Testing input phrase: "' + test.input + '"');
            const normalizedResult = await normalizeLocalDialectSpeech(test.input);
            const passCondition = normalizedResult.toLowerCase().includes(test.expected.toLowerCase());
            assert(passCondition, 'Transformation validation failed! Got: "' + normalizedResult + '"');
            console.log('Passed: Successfully translated keyword mapping to -> "' + test.expected + '"');
            passedTestsCount++;
        } catch (err) {
            console.error('Test Failed: ' + err.message);
        }
    }

    console.log('=== AUDIT COMPLETED: ' + passedTestsCount + '/' + testCases.length + ' DIALECT PACKETS MATCHED SYSTEM SPECIFICATIONS ===');
    process.exit(passedTestsCount === testCases.length ? 0 : 1);
}

runDialectAuditSuite();
