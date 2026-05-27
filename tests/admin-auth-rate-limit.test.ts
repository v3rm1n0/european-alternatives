import { createHash } from 'node:crypto'
import { chmodSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { loadNodeRuntime, useHostFilesystem } from '@php-wasm/node'
import { PHP } from '@php-wasm/universal'
import { afterAll, describe, expect, it } from 'vitest'

const adminAuthPath = resolve('api/admin/auth.php')
const addAlternativePath = resolve('api/admin/add-alternative.php')
const denyAlternativePath = resolve('api/admin/deny-alternative.php')
const adminAuthSource = readFileSync(adminAuthPath, 'utf8')
const addAlternativeSource = readFileSync(addAlternativePath, 'utf8')
const denyAlternativeSource = readFileSync(denyAlternativePath, 'utf8')
const authRunnerCode = `<?php
declare(strict_types=1);
require ${JSON.stringify(adminAuthPath)};
requireAdminAuth();
sendJsonResponse(200, ['ok' => true]);
`
const addAlternativeSuccessRunnerCode = `<?php
declare(strict_types=1);
require ${JSON.stringify(adminAuthPath)};

final class TestAddAlternativeStatement
{
    public function __construct(
        private TestAddAlternativePdo $pdo,
        private string $sql,
    ) {
    }

    private array $lastParams = [];

    public function execute(array $params = []): bool
    {
        $this->lastParams = $params;
        $this->pdo->handleExecute($this->sql, $params);

        return true;
    }

    public function fetch(): array|false
    {
        return $this->pdo->handleFetch($this->sql, $this->lastParams);
    }

    public function fetchAll(int $mode = 0): array
    {
        return $this->pdo->handleFetchAll($this->sql, $this->lastParams, $mode);
    }
}

final class TestAddAlternativePdo
{
    private bool $inTransaction = false;
    private int $lastInsertedId = 0;

    public function beginTransaction(): bool
    {
        $this->inTransaction = true;

        return true;
    }

    public function prepare(string $sql): TestAddAlternativeStatement
    {
        return new TestAddAlternativeStatement($this, $sql);
    }

    public function lastInsertId(?string $name = null): string
    {
        return (string) $this->lastInsertedId;
    }

    public function commit(): bool
    {
        $this->inTransaction = false;

        return true;
    }

    public function rollBack(): bool
    {
        $this->inTransaction = false;

        return true;
    }

    public function inTransaction(): bool
    {
        return $this->inTransaction;
    }

    public function handleExecute(string $sql, array $params): void
    {
        if (str_contains($sql, 'SELECT code FROM countries')) {
            return;
        }

        if (str_contains($sql, 'SELECT id FROM categories WHERE id IN')) {
            return;
        }

        if (str_contains($sql, 'SELECT id FROM catalog_entries WHERE slug = :slug')) {
            return;
        }

        if (str_contains($sql, 'SELECT id FROM catalog_entries WHERE name = :name AND status = :status LIMIT 1')) {
            return;
        }

        if (str_contains($sql, 'SELECT entry_id FROM us_vendor_aliases WHERE alias = :alias LIMIT 1')) {
            return;
        }

        if (str_contains($sql, 'INSERT INTO catalog_entries')) {
            $this->lastInsertedId = ($params['status'] ?? '') === 'us' ? 3001 : 1001;
            return;
        }

        if (str_contains($sql, 'INSERT INTO entry_categories')) {
            return;
        }

        if (str_contains($sql, 'INSERT IGNORE INTO matrix_facts')) {
            return;
        }

        if (str_contains($sql, 'INSERT IGNORE INTO us_vendor_aliases')) {
            return;
        }

        if (str_contains($sql, 'INSERT INTO entry_replacements')) {
            return;
        }

        throw new RuntimeException('Unexpected execute SQL: ' . $sql);
    }

    public function handleFetch(string $sql, array $params): array|false
    {
        if (str_contains($sql, 'SELECT code FROM countries')) {
            return ['code' => $params['code']];
        }

        if (str_contains($sql, 'SELECT id FROM catalog_entries WHERE slug = :slug')) {
            return false;
        }

        if (str_contains($sql, 'SELECT id FROM catalog_entries WHERE name = :name AND status = :status LIMIT 1')) {
            return false;
        }

        if (str_contains($sql, 'SELECT entry_id FROM us_vendor_aliases WHERE alias = :alias LIMIT 1')) {
            return false;
        }

        throw new RuntimeException('Unexpected fetch SQL: ' . $sql);
    }

    public function handleFetchAll(string $sql, array $params, int $mode): array
    {
        if (str_contains($sql, 'SELECT id FROM categories WHERE id IN')) {
            return array_values($params);
        }

        throw new RuntimeException('Unexpected fetchAll SQL: ' . $sql);
    }
}

function getDatabaseConnection()
{
    return new TestAddAlternativePdo();
}

function invalidateCache(): void
{
}

${stripAdminEndpointSource(addAlternativeSource)}
`
const denyAlternativeSuccessRunnerCode = `<?php
declare(strict_types=1);
require ${JSON.stringify(adminAuthPath)};

final class TestDenyAlternativeStatement
{
    public function __construct(
        private TestDenyAlternativePdo $pdo,
        private string $sql,
    ) {
    }

    private array $lastParams = [];

    public function execute(array $params = []): bool
    {
        $this->lastParams = $params;
        $this->pdo->handleExecute($this->sql, $params);

        return true;
    }

    public function fetch(): array|false
    {
        return $this->pdo->handleFetch($this->sql, $this->lastParams);
    }

    public function fetchAll(int $mode = 0): array
    {
        return $this->pdo->handleFetchAll($this->sql, $this->lastParams, $mode);
    }
}

final class TestDenyAlternativePdo
{
    private bool $inTransaction = false;
    private int $lastInsertedId = 0;

    public function beginTransaction(): bool
    {
        $this->inTransaction = true;

        return true;
    }

    public function prepare(string $sql): TestDenyAlternativeStatement
    {
        return new TestDenyAlternativeStatement($this, $sql);
    }

    public function lastInsertId(?string $name = null): string
    {
        return (string) $this->lastInsertedId;
    }

    public function commit(): bool
    {
        $this->inTransaction = false;

        return true;
    }

    public function rollBack(): bool
    {
        $this->inTransaction = false;

        return true;
    }

    public function inTransaction(): bool
    {
        return $this->inTransaction;
    }

    public function handleExecute(string $sql, array $params): void
    {
        if (str_contains($sql, 'SELECT code FROM countries')) {
            return;
        }

        if (str_contains($sql, 'SELECT id, status FROM catalog_entries WHERE slug = :slug')) {
            return;
        }

        if (str_contains($sql, 'INSERT INTO catalog_entries')) {
            $this->lastInsertedId = 2001;
            return;
        }

        if (str_contains($sql, 'INSERT INTO denied_decisions')) {
            return;
        }

        throw new RuntimeException('Unexpected execute SQL: ' . $sql);
    }

    public function handleFetch(string $sql, array $params): array|false
    {
        if (str_contains($sql, 'SELECT code FROM countries')) {
            return ($params['code'] ?? '') === 'de' ? ['code' => 'de'] : false;
        }

        if (str_contains($sql, 'SELECT id, status FROM catalog_entries WHERE slug = :slug')) {
            return false;
        }

        throw new RuntimeException('Unexpected fetch SQL: ' . $sql);
    }

    public function handleFetchAll(string $sql, array $params, int $mode): array
    {
        throw new RuntimeException('Unexpected fetchAll SQL: ' . $sql);
    }
}

function getDatabaseConnection()
{
    return new TestDenyAlternativePdo();
}

function invalidateCache(): void
{
}

${stripAdminEndpointSource(denyAlternativeSource)}
`
const validToken = 'b'.repeat(64)
const tempPaths: string[] = []

let phpPromise: Promise<PHP> | undefined

type AuthResponse = {
  status: number
  headers: Record<string, string[]>
  json: unknown
  stderr: string
}

type AuthRequestOptions = {
  authorization?: string
  body?: string
  now: number
  rateLimitDir: string
  remoteAddr?: string
  userAgent?: string
}

function stripAdminEndpointSource(source: string): string {
  return source
    .replace(/^<\?php\s*/, '')
    .replace("declare(strict_types=1);\n\n", '')
    .replace("require_once __DIR__ . '/../db.php';\n", '')
    .replace("require_once __DIR__ . '/../cache.php';\n", '')
    .replace("require_once __DIR__ . '/auth.php';\n", '')
}

function createTempPath(prefix: string): string {
  const path = mkdtempSync(join(tmpdir(), prefix))
  tempPaths.push(path)
  return path
}

function getPhp(): Promise<PHP> {
  phpPromise ??= loadNodeRuntime('8.3').then((runtime) => {
    const php = new PHP(runtime)
    useHostFilesystem(php)
    return php
  })
  return phpPromise
}

function getStatePath(rateLimitDir: string, clientKey: string): string {
  const hashedClientKey = createHash('sha256').update(clientKey).digest('hex')
  return join(rateLimitDir, `${hashedClientKey}.json`)
}

function readRateLimitState(rateLimitDir: string, clientKey: string): {
  failures: number[]
  blocked_until: number
} | null {
  const statePath = getStatePath(rateLimitDir, clientKey)

  try {
    return JSON.parse(readFileSync(statePath, 'utf8')) as {
      failures: number[]
      blocked_until: number
    }
  } catch {
    return null
  }
}

function getHeader(headers: Record<string, string[]>, name: string): string | undefined {
  const expectedName = name.toLowerCase()

  for (const [headerName, values] of Object.entries(headers)) {
    if (headerName.toLowerCase() === expectedName) {
      return values[0]
    }
  }

  return undefined
}

async function runPhpAuthRequest(
  code: string,
  options: AuthRequestOptions,
): Promise<AuthResponse> {
  const php = await getPhp()
  const response = await php.runStream({
    code,
    method: 'POST',
    body: options.body,
    env: {
      EUROALT_ADMIN_AUTH_NOW: String(options.now),
      EUROALT_ADMIN_RATE_LIMIT_DIR: options.rateLimitDir,
      EUROALT_ADMIN_TOKEN: validToken,
    },
    $_SERVER: {
      REMOTE_ADDR: options.remoteAddr ?? '203.0.113.7',
      ...(options.authorization === undefined
        ? {}
        : { HTTP_AUTHORIZATION: options.authorization }),
      ...(options.userAgent === undefined
        ? {}
        : { HTTP_USER_AGENT: options.userAgent }),
    },
  })

  const stdoutText = await response.stdoutText
  const stderrText = await response.stderrText

  return {
    status: await response.httpStatusCode,
    headers: await response.headers,
    json: JSON.parse(stdoutText) as unknown,
    stderr: stderrText,
  }
}

async function runAuthRequest(options: AuthRequestOptions): Promise<AuthResponse> {
  return runPhpAuthRequest(authRunnerCode, options)
}

async function runAdminEndpointRequest(
  endpointPath: string,
  options: AuthRequestOptions,
): Promise<AuthResponse> {
  return runPhpAuthRequest(
    `<?php
declare(strict_types=1);
require ${JSON.stringify(endpointPath)};
`,
    options,
  )
}

afterAll(async () => {
  if (phpPromise) {
    const php = await phpPromise
    php.exit(0)
  }

  for (const tempPath of tempPaths) {
    rmSync(tempPath, { recursive: true, force: true })
  }
})

describe('admin auth rate limiting', () => {
  it('removes sleep-based throttling and uses a private default rate-limit directory', () => {
    expect(adminAuthSource).toContain(
      "const DEFAULT_ADMIN_RATE_LIMIT_DIR = '/home/u688914453/.local/state/euroalt-admin-auth';",
    )
    expect(adminAuthSource).not.toContain('/tmp/euroalt-ratelimit/')
    expect(adminAuthSource).not.toContain('sleep(')
  })

  it('allows five failures, then returns 429 with Retry-After based on the oldest short-window failure', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const remoteAddr = '198.51.100.25'

    for (let offset = 0; offset < 5; offset += 1) {
      const response = await runAuthRequest({
        authorization: 'Bearer wrong-token',
        now: 1_000 + offset,
        rateLimitDir,
        remoteAddr,
      })

      expect(response.status).toBe(403)
      expect(response.json).toEqual({ ok: false, error: 'forbidden' })
    }

    const throttledResponse = await runAuthRequest({
      authorization: 'Bearer wrong-token',
      now: 1_005,
      rateLimitDir,
      remoteAddr,
    })

    expect(throttledResponse.status).toBe(429)
    expect(throttledResponse.json).toEqual({
      ok: false,
      error: 'too_many_auth_attempts',
    })
    expect(getHeader(throttledResponse.headers, 'Retry-After')).toBe('895')

    const state = readRateLimitState(rateLimitDir, remoteAddr)
    expect(state).not.toBeNull()
    expect(state?.failures).toHaveLength(6)
    expect(state?.blocked_until).toBe(0)
  })

  it('activates the one-hour block after twenty failures even while short-window throttling is active', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const remoteAddr = '198.51.100.26'

    for (let offset = 0; offset < 19; offset += 1) {
      await runAuthRequest({
        authorization: 'Bearer wrong-token',
        now: 2_000 + offset,
        rateLimitDir,
        remoteAddr,
      })
    }

    const blockResponse = await runAuthRequest({
      authorization: 'Bearer wrong-token',
      now: 2_019,
      rateLimitDir,
      remoteAddr,
    })

    expect(blockResponse.status).toBe(429)
    expect(blockResponse.json).toEqual({
      ok: false,
      error: 'too_many_auth_attempts',
    })
    expect(getHeader(blockResponse.headers, 'Retry-After')).toBe('3600')

    const stateAfterBlock = readRateLimitState(rateLimitDir, remoteAddr)
    expect(stateAfterBlock).not.toBeNull()
    expect(stateAfterBlock?.failures).toHaveLength(20)
    expect(stateAfterBlock?.blocked_until).toBe(5_619)

    const blockedResponse = await runAuthRequest({
      authorization: 'Bearer wrong-token',
      now: 2_050,
      rateLimitDir,
      remoteAddr,
    })

    expect(blockedResponse.status).toBe(429)
    expect(getHeader(blockedResponse.headers, 'Retry-After')).toBe('3569')
  })

  it('recovers from malformed state files by resetting them and recording the current failure', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const remoteAddr = '198.51.100.27'
    const statePath = getStatePath(rateLimitDir, remoteAddr)

    writeFileSync(statePath, '{not-json')

    const response = await runAuthRequest({
      authorization: 'Bearer wrong-token',
      now: 3_000,
      rateLimitDir,
      remoteAddr,
    })

    expect(response.status).toBe(403)
    expect(response.json).toEqual({ ok: false, error: 'forbidden' })
    expect(readRateLimitState(rateLimitDir, remoteAddr)).toEqual({
      failures: [3_000],
      blocked_until: 0,
    })
  })

  it('clears stored failures after a successful bearer-token authentication', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const remoteAddr = '198.51.100.28'
    const statePath = getStatePath(rateLimitDir, remoteAddr)

    writeFileSync(
      statePath,
      JSON.stringify({
        failures: [4_000, 4_010, 4_020],
        blocked_until: 0,
      }),
    )

    const response = await runAuthRequest({
      authorization: `Bearer ${validToken}`,
      now: 4_030,
      rateLimitDir,
      remoteAddr,
    })

    expect(response.status).toBe(200)
    expect(response.json).toEqual({ ok: true })
    expect(readRateLimitState(rateLimitDir, remoteAddr)).toBeNull()
  })

  it('fails closed when the configured rate-limit storage path is unusable', async () => {
    const unusablePath = createTempPath('euroalt-admin-rate-limit-file-')
    const remoteAddr = '198.51.100.29'

    rmSync(unusablePath, { recursive: true, force: true })
    writeFileSync(unusablePath, 'not a directory')
    tempPaths.push(unusablePath)

    const response = await runAuthRequest({
      authorization: 'Bearer wrong-token',
      now: 5_000,
      rateLimitDir: unusablePath,
      remoteAddr,
    })

    expect(response.status).toBe(503)
    expect(response.json).toEqual({
      ok: false,
      error: 'auth_rate_limit_unavailable',
    })
  })

  it('tightens directory permissions to private mode before using the limiter state', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const remoteAddr = '198.51.100.30'

    chmodSync(rateLimitDir, 0o755)

    const response = await runAuthRequest({
      authorization: 'Bearer wrong-token',
      now: 6_000,
      rateLimitDir,
      remoteAddr,
    })

    expect(response.status).toBe(403)
    expect(statSync(rateLimitDir).mode & 0o777).toBe(0o700)
  })
})

describe('admin auth audit logging', () => {
  it('logs failed auth with IP, reason, and user-agent', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const remoteAddr = '198.51.100.40'

    const response = await runAuthRequest({
      authorization: 'Bearer wrong-token',
      now: 10_000,
      rateLimitDir,
      remoteAddr,
      userAgent: 'TestBot/1.0',
    })

    expect(response.status).toBe(403)
    expect(response.stderr).toContain('euroalt-admin: auth FAILED from 198.51.100.40 reason=forbidden (UA: TestBot/1.0)')
  })

  it('logs successful auth with IP', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const remoteAddr = '198.51.100.41'

    const response = await runAuthRequest({
      authorization: `Bearer ${validToken}`,
      now: 10_100,
      rateLimitDir,
      remoteAddr,
    })

    expect(response.status).toBe(200)
    expect(response.stderr).toContain('euroalt-admin: auth OK from 198.51.100.41')
  })

  it('logs missing authorization header with correct reason', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const remoteAddr = '198.51.100.42'

    const response = await runAuthRequest({
      now: 10_200,
      rateLimitDir,
      remoteAddr,
    })

    expect(response.status).toBe(401)
    expect(response.stderr).toContain('euroalt-admin: auth FAILED from 198.51.100.42 reason=missing_authorization')
  })

  it('logs invalid authorization scheme with correct reason', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const remoteAddr = '198.51.100.43'

    const response = await runAuthRequest({
      authorization: 'Basic dXNlcjpwYXNz',
      now: 10_300,
      rateLimitDir,
      remoteAddr,
    })

    expect(response.status).toBe(401)
    expect(response.stderr).toContain('euroalt-admin: auth FAILED from 198.51.100.43 reason=invalid_authorization_scheme')
  })

  it('truncates user-agent to 100 characters', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const remoteAddr = '198.51.100.44'
    const longUA = 'A'.repeat(200)

    const response = await runAuthRequest({
      authorization: 'Bearer wrong-token',
      now: 10_400,
      rateLimitDir,
      remoteAddr,
      userAgent: longUA,
    })

    expect(response.status).toBe(403)
    expect(response.stderr).toContain(`(UA: ${'A'.repeat(100)})`)
    expect(response.stderr).not.toContain(`(UA: ${'A'.repeat(101)})`)
  })

  it('logs "unknown" when REMOTE_ADDR is missing', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')

    const response = await runAuthRequest({
      authorization: 'Bearer wrong-token',
      now: 10_500,
      rateLimitDir,
      remoteAddr: '',
    })

    expect(response.stderr).toContain('euroalt-admin: auth FAILED from unknown')
  })

  it('does not leak the bearer token in log messages', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const remoteAddr = '198.51.100.46'
    const secretToken = 'super-secret-token-that-should-not-appear-in-logs'

    const response = await runAuthRequest({
      authorization: `Bearer ${secretToken}`,
      now: 10_600,
      rateLimitDir,
      remoteAddr,
    })

    expect(response.status).toBe(403)
    expect(response.stderr).not.toContain(secretToken)
    expect(response.stderr).toContain('euroalt-admin: auth FAILED')
  })
})

describe('admin log sanitization', () => {
  it('escapes control characters before writing admin log messages', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')

    const response = await runPhpAuthRequest(
      `<?php
declare(strict_types=1);
require ${JSON.stringify(adminAuthPath)};
logAdminMessage("euroalt-admin: helper first line\\nsecond line\\t" . chr(1));
sendJsonResponse(200, ['ok' => true]);
`,
      {
        now: 10_650,
        rateLimitDir,
      },
    )

    expect(response.status).toBe(200)
    expect(response.stderr).toContain('euroalt-admin: helper first line\\nsecond line\\t\\x01')
    expect(response.stderr).not.toContain('helper first line\nsecond line')
  })
})

describe('admin mutation audit logging', () => {
  it('initializes matrix facts automatically when add-alternative inserts a matrix-enabled entry', () => {
    expect(addAlternativeSource).toContain('INSERT IGNORE INTO matrix_facts')
    expect(addAlternativeSource).toContain('JOIN matrix_criteria mc ON mc.category_id = ec.category_id')
    expect(addAlternativeSource).toContain("'status' => 'open'")
  })

  it('formats structured mutation audit logs with sanitized request context', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const longUserAgent = `Research Bot ${'A'.repeat(120)}`

    const response = await runPhpAuthRequest(
      `<?php
declare(strict_types=1);
require ${JSON.stringify(adminAuthPath)};
logAdminMutationAuditSuccess('deny-alternative', 77, 'blocked-service', 'denied', 321);
sendJsonResponse(200, ['ok' => true]);
`,
      {
        now: 10_700,
        rateLimitDir,
        remoteAddr: '',
        userAgent: longUserAgent,
      },
    )

    expect(response.status).toBe(200)
    expect(response.stderr).toContain(
      'euroalt-admin: audit action=deny-alternative slug=blocked-service entry_id=77 status=denied reason_length=321 ip=unknown',
    )
    expect(response.stderr).toContain(`ua=${JSON.stringify(longUserAgent.slice(0, 100))}`)
    expect(response.stderr).not.toContain(longUserAgent.slice(0, 101))
  })

  it('logs successful add-alternative mutations after auth with slug, entry id, and request metadata', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const response = await runPhpAuthRequest(addAlternativeSuccessRunnerCode, {
      authorization: `Bearer ${validToken}`,
      body: JSON.stringify({
        slug: 'eurostack-mail',
        name: 'Eurostack Mail',
        description_en: 'European email alternative.',
        country_code: 'de',
        website_url: 'https://eurostack.example',
        categories: [{ category_id: 'email', is_primary: true }],
        tags: [],
        replaces_us: [],
      }),
      now: 11_200,
      rateLimitDir,
      remoteAddr: '198.51.100.60',
      userAgent: 'TestBot/2.0',
    })

    expect(response.status).toBe(201)
    expect(response.json).toEqual({
      ok: true,
      entry_id: 1001,
      slug: 'eurostack-mail',
    })
    expect(response.stderr).toContain('euroalt-admin: auth OK from 198.51.100.60')
    expect(response.stderr).toContain(
      'euroalt-admin: audit action=add-alternative slug=eurostack-mail entry_id=1001 status=alternative ip=198.51.100.60 ua=TestBot/2.0',
    )
  })

  it('escapes newlines in auto-created US vendor log messages', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const response = await runPhpAuthRequest(addAlternativeSuccessRunnerCode, {
      authorization: `Bearer ${validToken}`,
      body: JSON.stringify({
        slug: 'forged-vendor-test',
        name: 'Forged Vendor Test',
        description_en: 'European email alternative.',
        country_code: 'de',
        website_url: 'https://eurostack.example',
        categories: [{ category_id: 'email', is_primary: true }],
        tags: [],
        replaces_us: ['Legit Vendor\nFORGED vendor log line'],
      }),
      now: 11_250,
      rateLimitDir,
      remoteAddr: '198.51.100.62',
    })

    expect(response.status).toBe(201)
    expect(response.stderr).toContain(
      "euroalt-admin: auto-created US vendor 'Legit Vendor\\nFORGED vendor log line' (id=3001, slug=legit-vendor-forged-vendor-log-line)",
    )
    expect(response.stderr).not.toContain(
      "euroalt-admin: auto-created US vendor 'Legit Vendor\nFORGED vendor log line'",
    )
  })

  it('logs successful deny-alternative mutations with reason length but not the raw denial text', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const denyReason = 'Fails gateway criteria because it is just a wrapper around a US service.'
    const response = await runPhpAuthRequest(denyAlternativeSuccessRunnerCode, {
      authorization: `Bearer ${validToken}`,
      body: JSON.stringify({
        slug: 'wrapper-service',
        name: 'Wrapper Service',
        deny_reason: denyReason,
      }),
      now: 11_300,
      rateLimitDir,
      remoteAddr: '198.51.100.61',
      userAgent: 'Research Bot/3.0',
    })

    expect(response.status).toBe(201)
    expect(response.json).toEqual({
      ok: true,
      entry_id: 2001,
      slug: 'wrapper-service',
      status: 'denied',
    })
    expect(response.stderr).toContain(
      `euroalt-admin: audit action=deny-alternative slug=wrapper-service entry_id=2001 status=denied reason_length=${denyReason.length} ip=198.51.100.61 ua="Research Bot/3.0"`,
    )
    expect(response.stderr).not.toContain(denyReason)
  })

  it('escapes newlines when logging ignored deny-alternative country codes', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const response = await runPhpAuthRequest(denyAlternativeSuccessRunnerCode, {
      authorization: `Bearer ${validToken}`,
      body: JSON.stringify({
        slug: 'forged-country-test',
        name: 'Forged Country Test',
        deny_reason: 'Fails gateway criteria.',
        country_code: 'de\nFORGED deny log line',
      }),
      now: 11_350,
      rateLimitDir,
      remoteAddr: '198.51.100.63',
    })

    expect(response.status).toBe(201)
    expect(response.stderr).toContain(
      "euroalt-admin: deny-alternative ignoring unknown country_code 'de\\nforged deny log line'",
    )
    expect(response.stderr).not.toContain(
      "euroalt-admin: deny-alternative ignoring unknown country_code 'de\nforged deny log line'",
    )
  })
})

describe('admin auth on real admin endpoints', () => {
  it('rejects unauthenticated add-alternative requests before body validation and logs the attempt', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const remoteAddr = '198.51.100.50'

    const response = await runAdminEndpointRequest(addAlternativePath, {
      now: 11_000,
      rateLimitDir,
      remoteAddr,
    })

    expect(response.status).toBe(401)
    expect(response.json).toEqual({
      ok: false,
      error: 'missing_authorization',
    })
    expect(response.stderr).toContain(
      'euroalt-admin: auth FAILED from 198.51.100.50 reason=missing_authorization',
    )
  })

  it('applies the shared auth rate limiter to deny-alternative.php', async () => {
    const rateLimitDir = createTempPath('euroalt-admin-rate-limit-')
    const remoteAddr = '198.51.100.51'

    for (let offset = 0; offset < 5; offset += 1) {
      const response = await runAdminEndpointRequest(denyAlternativePath, {
        authorization: 'Bearer wrong-token',
        now: 11_100 + offset,
        rateLimitDir,
        remoteAddr,
      })

      expect(response.status).toBe(403)
      expect(response.json).toEqual({ ok: false, error: 'forbidden' })
    }

    const throttledResponse = await runAdminEndpointRequest(denyAlternativePath, {
      authorization: 'Bearer wrong-token',
      now: 11_105,
      rateLimitDir,
      remoteAddr,
    })

    expect(throttledResponse.status).toBe(429)
    expect(throttledResponse.json).toEqual({
      ok: false,
      error: 'too_many_auth_attempts',
    })
    expect(getHeader(throttledResponse.headers, 'Retry-After')).toBe('895')
    expect(throttledResponse.stderr).toContain(
      'euroalt-admin: auth FAILED from 198.51.100.51 reason=forbidden',
    )
  })
})
