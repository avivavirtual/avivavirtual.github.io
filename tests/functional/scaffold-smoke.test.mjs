import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');

test('architecture documentation includes all required Mermaid diagrams', () => {
  const doc = read('docs/ARCHITECTURE.md');
  const mermaidBlocks = [...doc.matchAll(/```mermaid/g)].length;
  assert.ok(mermaidBlocks >= 6, `expected at least 6 Mermaid diagrams, found ${mermaidBlocks}`);
  for (const heading of ['Whole-platform architecture', 'Tenant isolation model', 'Code flow for a widget message', 'Chat escalation flow', 'Voice flow', 'RAG decision flow']) {
    assert.ok(doc.includes(heading), `missing architecture heading: ${heading}`);
  }
});

test('security-sensitive scaffold behavior is present in source', () => {
  const auth = read('apps/api/src/modules/auth/auth.service.ts');
  const guard = read('apps/api/src/modules/auth/jwt-auth.guard.ts');
  const contacts = read('apps/api/src/modules/contacts/contacts.service.ts');
  const widget = read('apps/widget/src/widget.ts');

  assert.ok(auth.includes('sanitizeUser'), 'auth service should sanitize user responses');
  assert.ok(auth.includes('token: await hash(refreshToken, 12)'), 'refresh token should be hashed before persistence');
  assert.ok(guard.includes('verifyAsync<JwtPayload>'), 'JWT guard should verify bearer tokens');
  assert.ok(contacts.includes('assertAllowedDomain'), 'widget endpoints should enforce allowedDomains');
  assert.ok(contacts.includes('PIPEDA consent is required'), 'widget contact creation should require PIPEDA consent');
  assert.ok(widget.includes('document.createElement'), 'widget should render through DOM nodes');
  assert.equal(widget.includes('innerHTML'), false, 'widget should not inject untrusted HTML');
});

test('repository contains the runtime files required by the local development path', () => {
  for (const path of [
    'docker-compose.yml',
    'docker-compose.whisper.yml',
    'apps/api/Dockerfile',
    'apps/web/Dockerfile',
    'apps/whisper/Dockerfile',
    'prisma/schema.prisma',
    'prisma/seed.ts',
    '.github/workflows/ci.yml',
  ]) {
    assert.equal(existsSync(path), true, `missing required file: ${path}`);
  }
});

test('CI setup-node does not enable npm cache without a lockfile', () => {
  const workflow = read('.github/workflows/ci.yml');
  assert.equal(existsSync('package-lock.json'), false, 'this scaffold intentionally omits package-lock.json until registry access is available');
  assert.equal(workflow.includes('cache: npm'), false, 'setup-node npm cache requires a lockfile and fails before npm install when none exists');
});

test('root package exposes reviewable test commands', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.test, 'node --test tests/**/*.test.mjs');
  assert.equal(pkg.scripts['test:unit'], 'node --test tests/unit/*.test.mjs');
  assert.equal(pkg.scripts['test:functional'], 'node --test tests/functional/*.test.mjs');
  assert.equal(pkg.scripts['check:registry'], 'node scripts/check-registry-access.mjs');
  assert.equal(pkg.scripts.review, 'npm test && npm run check:registry');
});

test('final review notes document the npm registry limitation and local review path', () => {
  const doc = read('docs/FINAL_REVIEW.md');
  assert.ok(doc.includes('npm run review'));
  assert.ok(doc.includes('HTTP 403'));
  assert.ok(doc.includes('no-network review checks'));
});
