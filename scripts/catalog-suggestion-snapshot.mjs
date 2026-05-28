#!/usr/bin/env node

const DEFAULT_API_BASE = "https://european-alternatives.cloud/api";

function usage() {
  process.stdout.write(`Usage:
  node scripts/catalog-suggestion-snapshot.mjs [--entry-slug <slug>] [--api-base <url>] [--help]

Builds the catalog snapshot consumed by the issue suggestion research stage.
The JSON contains valid categories, valid countries, existing entry slugs,
and optionally the current entry for a catalog_fact_correction target.
`);
}

function fail(message, exitCode = 64) {
  process.stderr.write(`${message}\n`);
  process.exit(exitCode);
}

function trimTrailingSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function parseArgs(argv) {
  const options = {
    apiBase:
      process.env.EUROALT_CATALOG_API_BASE ??
      process.env.EUROALT_API_BASE ??
      DEFAULT_API_BASE,
    entrySlug: null,
    help: false,
  };

  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];

    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }

    if (argument === "--entry-slug") {
      if (index + 1 >= argv.length) {
        fail("error: --entry-slug requires a value");
      }
      options.entrySlug = argv[++index];
      continue;
    }

    if (argument.startsWith("--entry-slug=")) {
      options.entrySlug = argument.slice("--entry-slug=".length);
      continue;
    }

    if (argument === "--api-base") {
      if (index + 1 >= argv.length) {
        fail("error: --api-base requires a value");
      }
      options.apiBase = argv[++index];
      continue;
    }

    if (argument.startsWith("--api-base=")) {
      options.apiBase = argument.slice("--api-base=".length);
      continue;
    }

    fail(`error: unknown option ${argument}`);
  }

  if (
    options.entrySlug !== null &&
    !/^[a-zA-Z0-9._-]+$/u.test(options.entrySlug)
  ) {
    fail("error: --entry-slug contains invalid characters");
  }

  try {
    const parsed = new URL(options.apiBase);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      fail("error: --api-base must be an http or https URL");
    }
  } catch {
    fail("error: --api-base must be a valid URL");
  }

  return options;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`${url} did not return JSON`);
  }

  if (!response.ok) {
    const detail =
      payload &&
      typeof payload === "object" &&
      typeof payload.detail === "string"
        ? `: ${payload.detail}`
        : "";
    throw new Error(`${url} returned HTTP ${response.status}${detail}`);
  }

  return payload;
}

function dataArray(payload, label) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.data)) {
    throw new Error(`${label} response did not contain a data array`);
  }
  return payload.data;
}

function writeStdout(text) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      process.stdout.off("drain", onDrain);
      reject(error);
    };
    const onDrain = () => {
      process.stdout.off("error", onError);
      resolve();
    };

    process.stdout.once("error", onError);
    if (process.stdout.write(text)) {
      process.stdout.off("error", onError);
      resolve();
      return;
    }
    process.stdout.once("drain", onDrain);
  });
}

function normalizeEntry(entry) {
  const secondaryCategories = Array.isArray(entry.secondaryCategories)
    ? entry.secondaryCategories
    : [];
  return {
    slug: String(entry.id ?? ""),
    name: String(entry.name ?? ""),
    status: String(entry.status ?? "alternative"),
    description_en: entry.description ?? null,
    description_de:
      entry.localizedDescriptions &&
      typeof entry.localizedDescriptions === "object" &&
      typeof entry.localizedDescriptions.de === "string"
        ? entry.localizedDescriptions.de
        : null,
    country_code: entry.country ?? null,
    website_url: entry.website ?? null,
    pricing: entry.pricing ?? null,
    is_open_source:
      typeof entry.isOpenSource === "boolean" ? entry.isOpenSource : null,
    open_source_level: entry.openSourceLevel ?? null,
    source_code_url: entry.sourceCodeUrl ?? null,
    self_hostable:
      typeof entry.selfHostable === "boolean" ? entry.selfHostable : null,
    founded_year:
      typeof entry.foundedYear === "number" ? entry.foundedYear : null,
    headquarters_city: entry.headquartersCity ?? null,
    license_text: entry.license ?? null,
    categories: [
      ...(typeof entry.category === "string"
        ? [{ category_id: entry.category, is_primary: true }]
        : []),
      ...secondaryCategories
        .filter((category) => typeof category === "string")
        .map((category) => ({ category_id: category, is_primary: false })),
    ],
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    replaces_us: Array.isArray(entry.replacesUS) ? entry.replacesUS : [],
  };
}

async function main(argv) {
  const options = parseArgs(argv);

  if (options.help) {
    usage();
    return 0;
  }

  const apiBase = trimTrailingSlash(options.apiBase);

  const [
    categoriesPayload,
    countriesPayload,
    alternativeEntriesPayload,
    usEntriesPayload,
  ] = await Promise.all([
    fetchJson(`${apiBase}/catalog/categories?locale=en`),
    fetchJson(`${apiBase}/catalog/countries?locale=en`),
    fetchJson(`${apiBase}/catalog/entries?status=alternative&locale=en`),
    fetchJson(`${apiBase}/catalog/entries?status=us&locale=en`),
  ]);

  const categories = dataArray(categoriesPayload, "categories").map(
    (category) => ({
      id: String(category.id),
      name: String(category.name ?? category.id),
    }),
  );

  const countries = dataArray(countriesPayload, "countries").map((country) => ({
    code: String(country.code),
    name: String(country.label ?? country.code),
  }));

  const entriesBySlug = new Map();
  const entryGroups = [
    {
      status: "alternative",
      entries: dataArray(alternativeEntriesPayload, "alternative entries"),
    },
    { status: "us", entries: dataArray(usEntriesPayload, "us entries") },
  ];
  for (const { status, entries: groupEntries } of entryGroups) {
    for (const entry of groupEntries) {
      const slug = String(entry.id);
      if (slug === "" || entriesBySlug.has(slug)) {
        continue;
      }
      entriesBySlug.set(slug, {
        slug,
        name: String(entry.name ?? entry.id),
        status: String(entry.status ?? status),
        website: entry.website ?? null,
      });
    }
  }
  const entries = Array.from(entriesBySlug.values());

  const snapshot = { categories, countries, entries };

  if (options.entrySlug !== null) {
    const entryPayload = await fetchJson(
      `${apiBase}/catalog/entry?slug=${encodeURIComponent(
        options.entrySlug,
      )}&locale=en`,
    );
    const entry =
      entryPayload && typeof entryPayload === "object"
        ? entryPayload.data
        : null;
    if (!entry || typeof entry !== "object") {
      throw new Error(
        `entry ${options.entrySlug} response did not contain an entry object`,
      );
    }
    snapshot.entry = normalizeEntry(entry);
  }

  await writeStdout(`${JSON.stringify(snapshot, null, 2)}\n`);
  return 0;
}

main(process.argv.slice(2)).then(
  (exitCode) => {
    process.exitCode = exitCode;
  },
  (error) => {
    const message = error instanceof Error ? error.message : String(error);
    fail(`error: failed to build catalog snapshot: ${message}`, 1);
  },
);
