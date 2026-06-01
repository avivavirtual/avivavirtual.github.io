import https from 'node:https';

const registryUrl = new URL(process.env.NPM_REGISTRY_CHECK_URL ?? 'https://registry.npmjs.org/@types%2fnode');
const timeoutMs = Number(process.env.NPM_REGISTRY_CHECK_TIMEOUT_MS ?? 5000);

function checkRegistry(url) {
  return new Promise((resolve) => {
    const request = https.request(url, { method: 'HEAD', timeout: timeoutMs }, (response) => {
      response.resume();
      resolve({ ok: response.statusCode >= 200 && response.statusCode < 400, statusCode: response.statusCode });
    });
    request.on('timeout', () => {
      request.destroy(new Error(`timed out after ${timeoutMs}ms`));
    });
    request.on('error', (error) => {
      resolve({ ok: false, error: error.message });
    });
    request.end();
  });
}

const result = await checkRegistry(registryUrl);
if (result.ok) {
  console.log(`npm registry reachable: ${registryUrl.href} (${result.statusCode})`);
} else {
  const reason = result.statusCode ? `HTTP ${result.statusCode}` : result.error;
  console.log(`npm registry unavailable in this environment: ${registryUrl.href} (${reason})`);
  console.log('Skipping package-lock generation here is expected; run npm install in CI or an environment with registry access.');
}
