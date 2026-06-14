/**
 * DreamTeQ_360 Automated Dialect Unit Verification Test Suite
 * Target Module under Verification: ollama-bridge.js Language Pipeline
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */
'use strict';

const assert = require('assert');
const { normalizeLocalDialectSpeech } = require('./ollama-bridge');

async function runOllamaBridgeVerificationTests() {
    console.log('=== [STARTING AUTOMATED OLLAMA-BRIDGE LANGUAGE VERIFICATION] ===');
    let verificationCheckpointsPassed = 0;

    const testScenarios = [
        {
            phrase: 'Nahitaji kununua mbolea sasa hivi',
            expectedKeyword: 'fertilizer',
            description: 'Verify Swahili noun translation parameters'
        },
        {
            phrase: 'Maziwa yote yamepelekwa kwenye shamba',
            expectedKeyword: 'farm plot',
            description: 'Verify regional geographic reference indicators'
        }
    ];

    for (const currentScenario of testScenarios) {
        try {
            console.log('-> Executing Verification Test: [' + currentScenario.description + ']');
            const processResult = await normalizeLocalDialectSpeech(currentScenario.phrase);
            assert(
                processResult.toLowerCase().includes(currentScenario.expectedKeyword),
                'Pipeline Parsing Mismatch! Output returned was: "' + processResult + '"'
            );
            console.log('Passed Checkpoint: Translated value matched expected target asset [' + currentScenario.expectedKeyword + '].');
            verificationCheckpointsPassed++;
        } catch (error) {
            console.error('Verification Boundary Broken: ' + error.message);
        }
    }

    console.log('=== TEST HARNESS EVALUATION CONCLUDED: ' + verificationCheckpointsPassed + '/' + testScenarios.length + ' SPEECH RECOGNITION CORRIDORS NORMALIZED ===');
    process.exit(verificationCheckpointsPassed === testScenarios.length ? 0 : 1);
}

runOllamaBridgeVerificationTests();
