import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";
import ts from "typescript";

const typesSource = readFileSync(
  new URL("../src/types/index.ts", import.meta.url),
  "utf8",
);
const categoryMatrixSource = readFileSync(
  new URL("../src/data/categoryMatrix.ts", import.meta.url),
  "utf8",
);
const frontendMatrixSources = [typesSource, categoryMatrixSource].join("\n");

const typeContractFileName = new URL(
  "./__category-matrix-type-contract__.ts",
  import.meta.url,
).pathname;
const viteEnvFileName = new URL("../src/vite-env.d.ts", import.meta.url)
  .pathname;

const typeContractSource = String.raw`
import { expectTypeOf } from "vitest";
import type {
  CategoryId,
  CategoryMatrixApiResponse,
  CategoryMatrixCategory,
  CategoryMatrixData,
  CategoryMatrixError,
  CategoryMatrixLoadResult,
  CategoryMatrixMeta,
  CategoryMatrixState,
  CountryCode,
  MatrixAlternative,
  MatrixCriterionFilterSelection,
  MatrixCriterion,
  MatrixCriterionOption,
  MatrixDisplayTone,
  MatrixFact,
  MatrixFactValue,
  MatrixFilterPrimitive,
  MatrixFilterMode,
  MatrixFilterSelections,
  MatrixGroup,
  MatrixSemantics,
  MatrixSourceMetadata,
  MatrixValueType,
  NotApplicableMatrixFact,
  UnverifiedMatrixFact,
  VerifiedMatrixFact,
} from "../src/types";

const matrixValueTypes: MatrixValueType[] = [
  "boolean",
  "enum",
  "multi_enum",
  "number",
  "text",
  "url",
  "date",
];
const matrixSemantics: MatrixSemantics[] = [
  "beneficial",
  "harmful",
  "neutral",
  "tradeoff",
  "informational",
  "risk",
];
const matrixFilterModes: MatrixFilterMode[] = [
  "none",
  "optional",
  "must_match",
  "range",
  "multi_select",
];
const matrixDisplayTones: MatrixDisplayTone[] = [
  "positive",
  "warning",
  "negative",
  "neutral",
  "tradeoff",
];
const matrixFactValues: MatrixFactValue[] = [
  true,
  42,
  "eu",
  ["web", "desktop"],
  null,
];
const matrixFilterPrimitives: MatrixFilterPrimitive[] = [true, 42, "eu"];

const criterionOption = {
  id: "eu",
  label: "EU",
  displayTone: "positive",
} satisfies MatrixCriterionOption;

const criterion = {
  id: "hosting_region",
  label: "Hosting region",
  helpText: "Where the service is primarily hosted.",
  valueType: "enum",
  semantics: "tradeoff",
  filterMode: "must_match",
  options: [criterionOption],
} satisfies MatrixCriterion;

const sourceMetadata = {
  url: "https://example.test/source",
  title: "Security overview",
  accessedDate: "2026-05-24",
} satisfies MatrixSourceMetadata;

const verifiedFact = {
  status: "verified",
  value: "eu",
  source: sourceMetadata,
} satisfies VerifiedMatrixFact;

const unverifiedFact = {
  status: "unverified",
  value: null,
} satisfies UnverifiedMatrixFact;

const notApplicableFact = {
  status: "not_applicable",
  value: null,
} satisfies NotApplicableMatrixFact;

const alternative = {
  id: "primary-chat",
  name: "Primary Chat",
  website: "https://primary-chat.example",
  logo: null,
  country: "de",
  category: "messaging",
  secondaryCategories: ["privacy-tools"],
  facts: {
    hosting_region: verifiedFact,
    e2ee: unverifiedFact,
    self_hosting: notApplicableFact,
  },
} satisfies MatrixAlternative;

const group = {
  id: "privacy",
  label: "Privacy",
  description: null,
  criteria: [criterion],
} satisfies MatrixGroup;

const categoryMatrixResponse = {
  data: {
    category: {
      id: "messaging",
      name: "Messaging",
      description: "Secure messaging and chat apps",
      emoji: "chat",
    },
    groups: [group],
    alternatives: [alternative],
  },
  meta: {
    category: "messaging",
    locale: "de",
    groupCount: 1,
    criterionCount: 1,
    alternativeCount: 1,
  },
} satisfies CategoryMatrixApiResponse;

const readyLoadResult = {
  status: "ready",
  matrix: categoryMatrixResponse,
  error: null,
} satisfies CategoryMatrixLoadResult;

const unavailableLoadResult = {
  status: "unavailable",
  matrix: null,
  error: {
    code: "not_found",
    message: "Matrix not found.",
    httpStatus: 404,
  },
} satisfies CategoryMatrixLoadResult;

const loadingState = {
  status: "loading",
  matrix: null,
  error: null,
} satisfies CategoryMatrixState;

const booleanFilter = {
  value: true,
  includeUnverified: true,
} satisfies MatrixCriterionFilterSelection;

const multiEnumFilter = {
  values: ["csv", "json"],
  includeUnverified: true,
} satisfies MatrixCriterionFilterSelection;

const rangeFilter = {
  min: 10,
  max: 100,
  includeUnverified: false,
} satisfies MatrixCriterionFilterSelection;

const matrixFilterSelections = {
  e2ee: booleanFilter,
  export_formats: multiEnumFilter,
  storage_included: rangeFilter,
} satisfies MatrixFilterSelections;

expectTypeOf(matrixValueTypes).toEqualTypeOf<MatrixValueType[]>();
expectTypeOf(matrixSemantics).toEqualTypeOf<MatrixSemantics[]>();
expectTypeOf(matrixFilterModes).toEqualTypeOf<MatrixFilterMode[]>();
expectTypeOf(matrixDisplayTones).toEqualTypeOf<MatrixDisplayTone[]>();
expectTypeOf(matrixFactValues).toEqualTypeOf<MatrixFactValue[]>();
expectTypeOf(matrixFilterPrimitives).toEqualTypeOf<MatrixFilterPrimitive[]>();

expectTypeOf<MatrixValueType>().toEqualTypeOf<
  "boolean" | "enum" | "multi_enum" | "number" | "text" | "url" | "date"
>();
expectTypeOf<MatrixSemantics>().toEqualTypeOf<
  "beneficial" | "harmful" | "neutral" | "tradeoff" | "informational" | "risk"
>();
expectTypeOf<MatrixFilterMode>().toEqualTypeOf<
  "none" | "optional" | "must_match" | "range" | "multi_select"
>();
expectTypeOf<MatrixDisplayTone>().toEqualTypeOf<
  "positive" | "warning" | "negative" | "neutral" | "tradeoff"
>();
expectTypeOf<MatrixFactValue>().toEqualTypeOf<
  boolean | number | string | string[] | null
>();
expectTypeOf<MatrixFilterPrimitive>().toEqualTypeOf<
  boolean | number | string
>();

expectTypeOf<CategoryMatrixApiResponse>().toEqualTypeOf<{
  data: CategoryMatrixData;
  meta: CategoryMatrixMeta;
}>();
expectTypeOf<CategoryMatrixData>().toEqualTypeOf<{
  category: CategoryMatrixCategory;
  groups: MatrixGroup[];
  alternatives: MatrixAlternative[];
}>();
expectTypeOf<CategoryMatrixCategory>().toEqualTypeOf<{
  id: CategoryId;
  name: string;
  description: string;
  emoji: string | null;
}>();
expectTypeOf<CategoryMatrixMeta>().toEqualTypeOf<{
  category: CategoryId;
  locale: "en" | "de";
  groupCount: number;
  criterionCount: number;
  alternativeCount: number;
}>();
expectTypeOf<MatrixGroup>().toEqualTypeOf<{
  id: string;
  label: string;
  description: string | null;
  criteria: MatrixCriterion[];
}>();
expectTypeOf<MatrixCriterion>().toEqualTypeOf<{
  id: string;
  label: string;
  helpText: string | null;
  valueType: MatrixValueType;
  semantics: MatrixSemantics;
  filterMode: MatrixFilterMode;
  options: MatrixCriterionOption[];
}>();
expectTypeOf<MatrixCriterionOption>().toEqualTypeOf<{
  id: string;
  label: string;
  displayTone?: MatrixDisplayTone;
}>();
expectTypeOf<MatrixAlternative>().toEqualTypeOf<{
  id: string;
  name: string;
  website: string | null;
  logo: string | null;
  country: CountryCode | null;
  category: CategoryId | null;
  secondaryCategories: CategoryId[];
  facts: Record<string, MatrixFact>;
}>();
expectTypeOf<MatrixFact>().toEqualTypeOf<
  VerifiedMatrixFact | UnverifiedMatrixFact | NotApplicableMatrixFact
>();
expectTypeOf<VerifiedMatrixFact>().toEqualTypeOf<{
  status: "verified";
  value: MatrixFactValue;
  source?: MatrixSourceMetadata;
}>();
expectTypeOf<UnverifiedMatrixFact>().toEqualTypeOf<{
  status: "unverified";
  value: null;
}>();
expectTypeOf<NotApplicableMatrixFact>().toEqualTypeOf<{
  status: "not_applicable";
  value: null;
}>();
expectTypeOf<MatrixSourceMetadata>().toEqualTypeOf<{
  url: string;
  title?: string;
  accessedDate?: string;
}>();
expectTypeOf<MatrixCriterionFilterSelection>().toEqualTypeOf<{
  value?: MatrixFilterPrimitive;
  values?: string[];
  min?: number;
  max?: number;
  includeUnverified: boolean;
}>();
expectTypeOf<MatrixFilterSelections>().toEqualTypeOf<
  Record<string, MatrixCriterionFilterSelection>
>();
expectTypeOf<CategoryMatrixError>().toEqualTypeOf<{
  code: string;
  message: string;
  httpStatus?: number;
}>();

expectTypeOf(categoryMatrixResponse.data.category).toMatchTypeOf<CategoryMatrixCategory>();
expectTypeOf(categoryMatrixResponse.data.groups[0]).toMatchTypeOf<MatrixGroup>();
expectTypeOf(categoryMatrixResponse.data.groups[0]?.criteria[0]).toMatchTypeOf<
  MatrixCriterion | undefined
>();
expectTypeOf(categoryMatrixResponse.data.alternatives[0]).toMatchTypeOf<
  MatrixAlternative | undefined
>();
expectTypeOf(alternative.country).toMatchTypeOf<CountryCode | null>();
expectTypeOf(alternative.category).toMatchTypeOf<CategoryId | null>();
expectTypeOf(alternative.secondaryCategories).toMatchTypeOf<CategoryId[]>();
expectTypeOf(alternative.facts.hosting_region).toMatchTypeOf<VerifiedMatrixFact>();
expectTypeOf(alternative.facts.e2ee).toEqualTypeOf<UnverifiedMatrixFact>();
expectTypeOf(alternative.facts.self_hosting).toEqualTypeOf<NotApplicableMatrixFact>();
expectTypeOf(verifiedFact.source).toMatchTypeOf<MatrixSourceMetadata>();
expectTypeOf(unverifiedFact.value).toEqualTypeOf<null>();
expectTypeOf(notApplicableFact.value).toEqualTypeOf<null>();
expectTypeOf(readyLoadResult).toMatchTypeOf<CategoryMatrixLoadResult>();
expectTypeOf(unavailableLoadResult.error).toMatchTypeOf<CategoryMatrixError>();
expectTypeOf(loadingState).toMatchTypeOf<CategoryMatrixState>();
expectTypeOf(booleanFilter.value).toEqualTypeOf<true>();
expectTypeOf(multiEnumFilter.values).toEqualTypeOf<string[]>();
expectTypeOf(rangeFilter.includeUnverified).toEqualTypeOf<false>();
expectTypeOf(matrixFilterSelections).toMatchTypeOf<MatrixFilterSelections>();

// @ts-expect-error auditQuote is intentionally not part of public source metadata.
void ({ url: "https://example.test", auditQuote: "internal quote" } satisfies MatrixSourceMetadata);
// @ts-expect-error audit_quote is intentionally not part of public source metadata.
void ({ url: "https://example.test", audit_quote: "internal quote" } satisfies MatrixSourceMetadata);
// @ts-expect-error rawResponse is intentionally not part of public source metadata.
void ({ url: "https://example.test", rawResponse: "{}" } satisfies MatrixSourceMetadata);
// @ts-expect-error raw_response is intentionally not part of public source metadata.
void ({ url: "https://example.test", raw_response: "{}" } satisfies MatrixSourceMetadata);
// @ts-expect-error attempts are intentionally not part of public verified fact data.
void ({ status: "verified", value: true, attempts: [] } satisfies VerifiedMatrixFact);
// @ts-expect-error verifications are intentionally not part of public alternative rows.
void ({ ...alternative, verifications: [] } satisfies MatrixAlternative);
// @ts-expect-error verifierNotes are intentionally not part of public matrix facts.
void ({ status: "verified", value: true, verifierNotes: "internal" } satisfies MatrixFact);
`;

function collectTypeContractDiagnostics(): string[] {
  const compilerOptions: ts.CompilerOptions = {
    allowImportingTsExtensions: true,
    jsx: ts.JsxEmit.ReactJSX,
    lib: ["lib.es2020.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
    module: ts.ModuleKind.ESNext,
    moduleDetection: ts.ModuleDetectionKind.Force,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2020,
  };
  const host = ts.createCompilerHost(compilerOptions);
  const getSourceFile = host.getSourceFile.bind(host);
  const fileExists = host.fileExists.bind(host);
  const readFile = host.readFile.bind(host);

  host.getSourceFile = (
    fileName,
    languageVersion,
    onError,
    shouldCreateNewSourceFile,
  ) => {
    if (fileName === typeContractFileName) {
      return ts.createSourceFile(
        fileName,
        typeContractSource,
        languageVersion,
        true,
        ts.ScriptKind.TS,
      );
    }

    return getSourceFile(
      fileName,
      languageVersion,
      onError,
      shouldCreateNewSourceFile,
    );
  };
  host.fileExists = (fileName) =>
    fileName === typeContractFileName || fileExists(fileName);
  host.readFile = (fileName) =>
    fileName === typeContractFileName ? typeContractSource : readFile(fileName);

  const program = ts.createProgram(
    [viteEnvFileName, typeContractFileName],
    compilerOptions,
    host,
  );

  return ts.getPreEmitDiagnostics(program).map(formatDiagnostic);
}

function formatDiagnostic(diagnostic: ts.Diagnostic): string {
  const location =
    diagnostic.file && diagnostic.start !== undefined
      ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
      : null;
  const prefix =
    diagnostic.file && location
      ? `${diagnostic.file.fileName}:${location.line + 1}:${
          location.character + 1
        }: `
      : "";

  return `${prefix}${ts.flattenDiagnosticMessageText(
    diagnostic.messageText,
    "\n",
  )}`;
}

describe("category matrix frontend type contract", () => {
  it("type-checks the public response, enum, row, fact, and load-state contract", () => {
    expect(collectTypeContractDiagnostics()).toEqual([]);
  });

  it("keeps audit-only fields out of the public UI matrix contract", () => {
    for (const forbiddenField of [
      "auditQuote",
      "audit_quote",
      "rawResponse",
      "raw_response",
      "verifierNotes",
      "attempts",
      "verifications",
    ]) {
      expect(frontendMatrixSources).not.toContain(forbiddenField);
    }
  });
});
