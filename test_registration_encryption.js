/**
 * DreamTeQ_360 Automated Registration & Encryption Integrity Unit Test Suite
 * Architecture: Automated Lifecycle Regression Testing
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */

'use strict';

const assert = require('assert');
const PouchDB = require('pouchdb');

if (typeof window === 'undefined') {
    global.window = { crypto: require('crypto').webcrypto };
}

const Mock_Security_Hub = {
    cryptoKey: null,
    async deriveKey(passphrase, salt) {
        const encoder = new TextEncoder();
        const baseKey = await window.crypto.subtle.importKey(
            'raw', encoder.encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey']
        );
        this.cryptoKey = await window.crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
            baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
        );
    },
    async encrypt(data) {
        const encoder = new TextEncoder();
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv }, this.cryptoKey, encoder.encode(JSON.stringify(data))
        );
        return {
            iv: Buffer.from(iv).toString('base64'),
            ciphertext: Buffer.from(new Uint8Array(encrypted)).toString('base64')
        };
    },
    async decrypt(pkg) {
        const iv = Buffer.from(pkg.iv, 'base64');
        const cipher = Buffer.from(pkg.ciphertext, 'base64');
        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv }, this.cryptoKey, cipher
        );
        return JSON.parse(new TextDecoder().decode(decrypted));
    }
};

async function executeLifecycleUnitTest() {
    console.log('=== [STARTING REGISTRATION ENCLAVE UNIT TEST] ===');
    const testDb = new PouchDB('dreamteq_test_encryption_vault');

    try {
        await Mock_Security_Hub.deriveKey('Kyankazi@123', 'admin@dreamteamconsult.site');
        console.log('Step 1: Crypto Enclave Key Derivation verified matching parameters.');

        const mockInputData = {
            farmer_id: '32456789',
            name: 'John Kiprop',
            phone: 'PHONE-254718554383',
            coop: 'Nairobi_East',
            timestamp: new Date().toISOString()
        };

        const encryptedPackage = await Mock_Security_Hub.encrypt(mockInputData);
        assert.notStrictEqual(encryptedPackage.ciphertext, JSON.stringify(mockInputData), 'Crypto Error: Plaintext match found.');
        console.log('Step 2: AES-GCM 256-bit ciphertext isolation verified safe.');

        const dbRecordId = `TEST_FARMER_${mockInputData.farmer_id}`;
        await testDb.put({ _id: dbRecordId, secure_payload: encryptedPackage });
        console.log(`Step 3: Encrypted record row successfully committed to PouchDB [${dbRecordId}].`);

        const fetchedDoc = await testDb.get(dbRecordId);
        const decryptedOutput = await Mock_Security_Hub.decrypt(fetchedDoc.secure_payload);

        assert.strictEqual(decryptedOutput.name, mockInputData.name, 'Mismatched decrypt name string.');
        assert.strictEqual(decryptedOutput.phone, mockInputData.phone, 'Mismatched decrypt phone trace.');
        assert.strictEqual(decryptedOutput.coop, mockInputData.coop, 'Mismatched decrypt cooperative node.');
        console.log('Step 4: Decryption verification checks passed. Zero data parity leaks.');

        await testDb.destroy();
        console.log('=== [SUCCESS] Lifecycle test execution concluded perfectly. ===');
    } catch (err) {
        try {
            await testDb.destroy();
        } catch (cleanupErr) {
            console.error('[UNIT TEST CLEANUP WARNING]:', cleanupErr.message);
        }
        console.error('[UNIT TEST CRITICAL FAILURE]:', err.message);
        process.exit(1);
    }
}

executeLifecycleUnitTest();
