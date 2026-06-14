// DreamTeQ_360 Pipeline Exception Notifier dry-run verification harness.
'use strict';

process.env.DREAMTEQ_MAIL_DRY_RUN = '1';

const { dispatchPipelineExceptionAlert } = require('./pipeline_exception_notifier');

async function runDryRun() {
    const result = await dispatchPipelineExceptionAlert(
        'ODOO_RPC_MIDDLEWARE_CORRIDOR',
        new Error('JSON-RPC stream dropped unexpectedly: Connection reset by remote backend database host peer.')
    );

    console.log('DRY_RUN_RESULT=' + JSON.stringify(result));
    process.exit(result && result.ok && result.dryRun ? 0 : 1);
}

runDryRun().catch(function(error) {
    console.error(error.message);
    process.exit(1);
});
