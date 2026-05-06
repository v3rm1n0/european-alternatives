import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

type SemverTuple = [number, number, number]

interface LockfilePackage {
  version?: string
}

interface Lockfile {
  packages?: Record<string, LockfilePackage>
}

interface ResolvedPackageVersion {
  path: string
  version: string
}

const MIN_SAFE_ROLLUP_VERSION: SemverTuple = [4, 59, 0]
const MIN_SAFE_FLATTED_VERSION: SemverTuple = [3, 4, 2]
const MIN_SAFE_AJV_VERSION: SemverTuple = [6, 14, 0]
const MIN_SAFE_AJV_V8_VERSION: SemverTuple = [8, 17, 2]
const MIN_SAFE_MINIMATCH_V3_VERSION: SemverTuple = [3, 1, 4]
const MIN_SAFE_MINIMATCH_V9_VERSION: SemverTuple = [9, 0, 7]
const MIN_SAFE_MINIMATCH_V10_VERSION: SemverTuple = [10, 2, 4]
const lockfileUrl = new URL('../package-lock.json', import.meta.url)

function readLockfile(): Lockfile {
  return JSON.parse(readFileSync(lockfileUrl, 'utf8')) as Lockfile
}

function parseSemver(version: string): SemverTuple {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/)

  if (!match) {
    throw new Error(`Unexpected semver format: ${version}`)
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function isAtLeastVersion(version: string, minimum: SemverTuple): boolean {
  const parsed = parseSemver(version)

  for (let index = 0; index < parsed.length; index += 1) {
    if (parsed[index] > minimum[index]) {
      return true
    }

    if (parsed[index] < minimum[index]) {
      return false
    }
  }

  return true
}

function isSafeAjvVersion(version: string): boolean {
  const [major] = parseSemver(version)

  if (major === 6) {
    return isAtLeastVersion(version, MIN_SAFE_AJV_VERSION)
  }

  if (major === 7) {
    return false
  }

  if (major === 8) {
    return isAtLeastVersion(version, MIN_SAFE_AJV_V8_VERSION)
  }

  return true
}

function getResolvedPackageVersions(
  lockfile: Lockfile,
  packageName: string,
): ResolvedPackageVersion[] {
  const packagePathSuffix = `/node_modules/${packageName}`
  return Object.entries(lockfile.packages ?? {})
    .filter(
      ([packagePath]) =>
        packagePath === `node_modules/${packageName}` ||
        packagePath.endsWith(packagePathSuffix),
    )
    .map(([packagePath, packageInfo]) => {
      if (!packageInfo.version) {
        throw new Error(`${packagePath} is missing a version in package-lock.json`)
      }

      return {
        path: packagePath,
        version: packageInfo.version,
      }
    })
}

function expectNoResolvedPackagesBelowVersion(
  packageName: string,
  minimum: SemverTuple,
  major?: number,
): void {
  const resolvedPackages = getResolvedPackageVersions(readLockfile(), packageName)
  const scopedPackages =
    major === undefined
      ? resolvedPackages
      : resolvedPackages.filter(
          ({ version }) => parseSemver(version)[0] === major,
        )

  const vulnerablePackages = scopedPackages.filter(
    ({ version }) => !isAtLeastVersion(version, minimum),
  )

  if (vulnerablePackages.length > 0) {
    const vulnerablePackageDetails = vulnerablePackages
      .map(({ path, version }) => `${path}@${version}`)
      .join(', ')

    throw new Error(
      `Found vulnerable ${packageName} entries in package-lock.json: ${vulnerablePackageDetails}. Minimum safe version is ${minimum.join('.')}.`,
    )
  }

  expect(vulnerablePackages).toHaveLength(0)
}

function expectNoVulnerableAjvVersions(): void {
  const vulnerablePackages = getResolvedPackageVersions(readLockfile(), 'ajv')
    .filter(({ version }) => !isSafeAjvVersion(version))

  if (vulnerablePackages.length > 0) {
    const vulnerablePackageDetails = vulnerablePackages
      .map(({ path, version }) => `${path}@${version}`)
      .join(', ')

    throw new Error(
      `Found vulnerable ajv entries in package-lock.json: ${vulnerablePackageDetails}. Safe versions are 6.14.0+, 8.17.2+, or non-vulnerable major releases.`,
    )
  }

  expect(vulnerablePackages).toHaveLength(0)
}

describe('package-lock dependency security', () => {
  it('has no rollup entries in the GHSA-mw96-cpmx-2vgc vulnerable range', () => {
    expectNoResolvedPackagesBelowVersion('rollup', MIN_SAFE_ROLLUP_VERSION)
  })

  it('has no flatted entries in the GHSA-rf6f-7fwh-wjgh and GHSA-25h7-pfq9-p65f vulnerable ranges', () => {
    expectNoResolvedPackagesBelowVersion('flatted', MIN_SAFE_FLATTED_VERSION)
  })

  it('has no ajv entries in the GHSA-2g4f-4pwh-qvx6 vulnerable range', () => {
    expectNoVulnerableAjvVersions()
  })

  it('has no minimatch 3.x entries in the GHSA-3ppc-4f35-3m26, GHSA-7r86-cg39-jmmj, and GHSA-23c5-xmqv-rm74 vulnerable ranges', () => {
    expectNoResolvedPackagesBelowVersion(
      'minimatch',
      MIN_SAFE_MINIMATCH_V3_VERSION,
      3,
    )
  })

  it('has no minimatch 9.x entries in the GHSA-3ppc-4f35-3m26, GHSA-7r86-cg39-jmmj, and GHSA-23c5-xmqv-rm74 vulnerable ranges', () => {
    expectNoResolvedPackagesBelowVersion(
      'minimatch',
      MIN_SAFE_MINIMATCH_V9_VERSION,
      9,
    )
  })

  it('has no minimatch 10.x entries in the GHSA-3ppc-4f35-3m26, GHSA-7r86-cg39-jmmj, and GHSA-23c5-xmqv-rm74 vulnerable ranges', () => {
    expectNoResolvedPackagesBelowVersion(
      'minimatch',
      MIN_SAFE_MINIMATCH_V10_VERSION,
      10,
    )
  })
})
