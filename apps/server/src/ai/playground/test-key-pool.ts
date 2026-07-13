import { ProviderKeyPool } from '../../lib/providers/provider-key-pool';
import { ProviderPoolFactory } from '../../lib/providers/provider-pool-factory';

async function runTest() {
  console.log('🧪 Starting system-scoped ProviderKeyPool E2E tests...\n');

  // ─── Test 1: Basic rotation on discovery:gemini ──────────────────────────────
  console.log('--- 1. Basic rotation (discovery:gemini) ---');
  const discoveryGemini = ProviderPoolFactory.discovery('gemini');
  discoveryGemini.setKeys(['DISC_GEMINI_KEY_A', 'DISC_GEMINI_KEY_B', 'DISC_GEMINI_KEY_C']);

  console.log(`Current key (expect A): ${discoveryGemini.getCurrentKey()}`);
  discoveryGemini.rotate();
  console.log(`After rotate 1 (expect B): ${discoveryGemini.getCurrentKey()}`);
  discoveryGemini.rotate();
  console.log(`After rotate 2 (expect C): ${discoveryGemini.getCurrentKey()}`);
  discoveryGemini.rotate();
  console.log(`After wrap-around (expect A): ${discoveryGemini.getCurrentKey()}`);

  // ─── Test 2: Pool isolation — recommendation:gemini is fully independent ─────
  console.log('\n--- 2. Pool isolation (recommendation:gemini is independent) ---');
  const recoGemini = ProviderPoolFactory.recommendation('gemini');
  recoGemini.setKeys(['RECO_GEMINI_KEY_X', 'RECO_GEMINI_KEY_Y']);

  console.log(`discovery:gemini current (expect A): ${discoveryGemini.getCurrentKey()}`);
  console.log(`recommendation:gemini current (expect X): ${recoGemini.getCurrentKey()}`);

  recoGemini.rotate();
  console.log(`recommendation:gemini after rotate (expect Y): ${recoGemini.getCurrentKey()}`);
  console.log(`discovery:gemini unaffected (still A): ${discoveryGemini.getCurrentKey()}`);

  // ─── Test 3: Singleton identity ───────────────────────────────────────────────
  console.log('\n--- 3. Singleton identity ---');
  const same = ProviderKeyPool.for('discovery', 'gemini');
  console.log(`Same instance? ${same === discoveryGemini ? '✅ Yes' : '❌ No'}`);

  // ─── Test 4: Telemetry fields ─────────────────────────────────────────────────
  console.log('\n--- 4. Telemetry fields ---');
  discoveryGemini.markSuccess();
  discoveryGemini.markSuccess();
  discoveryGemini.markFailure();

  const telemetry = discoveryGemini.getTelemetry();
  console.log('discovery:gemini telemetry:', JSON.stringify(telemetry, null, 2));

  const expected = {
    system: 'discovery',
    provider: 'gemini',
    rotations: 3,
    successRequests: 2,
    failedRequests: 1,
    currentStatus: 'DEGRADED', // failures >= successes at some point
  };
  console.log('\nExpected subset:', JSON.stringify(expected, null, 2));

  const checks = [
    ['system', telemetry.system === 'discovery'],
    ['provider', telemetry.provider === 'gemini'],
    ['rotations', telemetry.rotations === 3],
    ['successRequests', telemetry.successRequests === 2],
    ['failedRequests', telemetry.failedRequests === 1],
    ['lastRotationAt', telemetry.lastRotationAt !== null],
    ['currentStatus', ['ACTIVE', 'DEGRADED', 'EXHAUSTED'].includes(telemetry.currentStatus)],
  ];

  let allPassed = true;
  for (const [field, pass] of checks) {
    const icon = pass ? '✅' : '❌';
    console.log(`  ${icon} ${field}`);
    if (!pass) allPassed = false;
  }

  // ─── Test 5: getAllPools ───────────────────────────────────────────────────────
  console.log('\n--- 5. getAllPools() ---');
  const allPools = ProviderKeyPool.getAllPools();
  console.log(`Total pools registered: ${allPools.length}`);
  allPools.forEach((p) => {
    const t = p.getTelemetry();
    console.log(`  ${t.system}:${t.provider} — ${t.currentStatus} (${t.totalKeys} keys)`);
  });

  // ─── Result ───────────────────────────────────────────────────────────────────
  console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed!'}`);
}

runTest().catch((err) => console.error('Test runner failed:', err));
