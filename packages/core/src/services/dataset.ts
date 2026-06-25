import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { datasets, testCases } from "../db/schema.js";
import { createId } from "../utils/id.js";
import { logAudit } from "./audit.js";

export const DATASET_IMPORT_MAX_BYTES = 10 * 1024 * 1024;
export const DATASET_IMPORT_MAX_CASES = 500;
export const DATASET_PREVIEW_PAGE_SIZE = 20;

export type DatasetImportFormat = "json" | "csv";

export interface DatasetCaseInput {
  input: string;
  expectedBehavior?: string;
  tags?: string | string[];
}

export interface DatasetImportErrorItem {
  row: number;
  field: string;
  message: string;
}

export class DatasetImportError extends Error {
  errors: DatasetImportErrorItem[];

  constructor(errors: DatasetImportErrorItem[]) {
    super("Dataset import validation failed");
    this.name = "DatasetImportError";
    this.errors = errors;
  }
}

export async function listDatasets() {
  const db = getDb();
  const all = await db.select().from(datasets).orderBy(desc(datasets.updatedAt));
  const result = [];
  for (const ds of all) {
    const cases = await db.select().from(testCases).where(eq(testCases.datasetId, ds.id));
    result.push({ ...ds, caseCount: cases.length });
  }
  return result;
}

export async function getDataset(id: string) {
  const db = getDb();
  const [dataset] = await db.select().from(datasets).where(eq(datasets.id, id));
  if (!dataset) return null;
  const cases = await db.select().from(testCases).where(eq(testCases.datasetId, id)).orderBy(asc(testCases.createdAt));
  return { ...dataset, testCases: cases };
}

export async function getDatasetPage(id: string, page = 1, pageSize = DATASET_PREVIEW_PAGE_SIZE) {
  const db = getDb();
  const [dataset] = await db.select().from(datasets).where(eq(datasets.id, id));
  if (!dataset) return null;

  const safePageSize = Math.min(Math.max(Math.trunc(pageSize) || DATASET_PREVIEW_PAGE_SIZE, 1), 100);
  const allCases = await db.select().from(testCases).where(eq(testCases.datasetId, id)).orderBy(asc(testCases.createdAt));
  const total = allCases.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(Math.trunc(page) || 1, 1), totalPages);
  const offset = (safePage - 1) * safePageSize;

  return {
    ...dataset,
    testCases: allCases.slice(offset, offset + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages,
  };
}

export async function createDataset(input: {
  name: string;
  description?: string;
  cases?: DatasetCaseInput[];
}) {
  const name = input.name?.trim();
  if (!name) {
    throw new DatasetImportError([{ row: 0, field: "name", message: "数据集名称不能为空" }]);
  }
  const validationErrors = validateDatasetCases(input.cases ?? []);
  if (validationErrors.length) throw new DatasetImportError(validationErrors);
  const normalizedCases = normalizeDatasetCases(input.cases ?? []);

  const db = getDb();
  const datasetId = createId("dataset");
  await db.insert(datasets).values({
    id: datasetId,
    name,
    description: input.description ?? "",
  });

  if (normalizedCases.length) {
    for (const c of normalizedCases) {
      await db.insert(testCases).values({
        id: createId("tc"),
        datasetId,
        input: c.input,
        expectedBehavior: c.expectedBehavior ?? "",
        tags: c.tags ?? "",
      });
    }
  }

  await logAudit({ action: "create", entityType: "dataset", entityId: datasetId, detail: name });
  return getDataset(datasetId);
}

export async function addTestCase(
  datasetId: string,
  input: DatasetCaseInput,
) {
  const [normalized] = normalizeDatasetCases([input]);
  const errors = validateDatasetCases(normalized ? [normalized] : []);
  if (errors.length) throw new DatasetImportError(errors);
  const db = getDb();
  const id = createId("tc");
  await db.insert(testCases).values({
    id,
    datasetId,
    input: normalized.input,
    expectedBehavior: normalized.expectedBehavior,
    tags: normalized.tags,
  });
  await db.update(datasets).set({ updatedAt: new Date().toISOString() }).where(eq(datasets.id, datasetId));
  return id;
}

export async function importDatasetJson(data: {
  name: string;
  description?: string;
  cases: DatasetCaseInput[];
}) {
  return createDataset(data);
}

export function parseDatasetText(input: {
  name: string;
  description?: string;
  format: DatasetImportFormat;
  content: string;
}) {
  const errors: DatasetImportErrorItem[] = [];
  if (Buffer.byteLength(input.content ?? "", "utf-8") > DATASET_IMPORT_MAX_BYTES) {
    errors.push({ row: 0, field: "file", message: "导入内容不能超过 10MB" });
  }

  let parsedName = input.name?.trim() ?? "";
  let parsedDescription = input.description ?? "";
  let rawCases: DatasetCaseInput[] = [];

  if (!parsedName) errors.push({ row: 0, field: "name", message: "数据集名称不能为空" });

  try {
    rawCases = input.format === "csv" ? parseDatasetCsv(input.content) : parseDatasetJsonContent(input.content);
    if (input.format === "json") {
      const parsed = JSON.parse(input.content);
      if (!Array.isArray(parsed) && typeof parsed === "object" && parsed) {
        parsedName = parsedName || String(parsed.name ?? "").trim();
        parsedDescription = parsedDescription || String(parsed.description ?? "");
      }
    }
  } catch (error) {
    errors.push({
      row: 0,
      field: input.format,
      message: error instanceof Error ? error.message : "导入内容解析失败",
    });
  }

  errors.push(...validateDatasetCases(rawCases));
  const cases = normalizeDatasetCases(rawCases);

  return {
    name: parsedName,
    description: parsedDescription,
    cases,
    errors,
    preview: cases.slice(0, DATASET_PREVIEW_PAGE_SIZE),
    maxCases: DATASET_IMPORT_MAX_CASES,
    maxBytes: DATASET_IMPORT_MAX_BYTES,
  };
}

export async function importDatasetText(input: {
  name: string;
  description?: string;
  format: DatasetImportFormat;
  content: string;
}) {
  const parsed = parseDatasetText(input);
  if (parsed.errors.length) throw new DatasetImportError(parsed.errors);
  return createDataset({
    name: parsed.name,
    description: parsed.description,
    cases: parsed.cases,
  });
}

export async function exportDatasetJson(id: string) {
  const dataset = await getDataset(id);
  if (!dataset) throw new Error("Dataset not found");
  return {
    name: dataset.name,
    description: dataset.description,
    cases: dataset.testCases.map((c) => ({
      input: c.input,
      expectedBehavior: c.expectedBehavior,
      tags: c.tags,
    })),
  };
}

export async function deleteDataset(id: string) {
  const db = getDb();
  await db.delete(datasets).where(eq(datasets.id, id));
  await logAudit({ action: "delete", entityType: "dataset", entityId: id });
}

function parseDatasetJsonContent(content: string): DatasetCaseInput[] {
  const parsed = JSON.parse(content);
  if (Array.isArray(parsed)) return parsed as DatasetCaseInput[];
  if (typeof parsed === "object" && parsed && Array.isArray((parsed as { cases?: unknown }).cases)) {
    return (parsed as { cases: DatasetCaseInput[] }).cases;
  }
  throw new Error("JSON 必须是用例数组，或包含 cases 数组的对象");
}

function parseDatasetCsv(content: string): DatasetCaseInput[] {
  const rows = parseCsvRows(content);
  const nonEmptyRows = rows.filter((row) => row.some((cell) => cell.trim()));
  if (!nonEmptyRows.length) return [];

  const header = nonEmptyRows[0].map((cell) => normalizeHeader(cell));
  const inputIndex = header.indexOf("input");
  if (inputIndex < 0) throw new Error("CSV 必须包含 input 表头");
  const expectedIndex = firstHeaderIndex(header, ["expectedbehavior", "expected", "expected_behavior"]);
  const tagsIndex = firstHeaderIndex(header, ["tags", "tag"]);

  return nonEmptyRows.slice(1).map((row) => ({
    input: row[inputIndex] ?? "",
    expectedBehavior: expectedIndex >= 0 ? row[expectedIndex] ?? "" : "",
    tags: tagsIndex >= 0 ? row[tagsIndex] ?? "" : "",
  }));
}

function parseCsvRows(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  if (inQuotes) throw new Error("CSV 存在未闭合的引号");
  return rows;
}

function normalizeHeader(value: string) {
  return value.trim().replace(/[\s-]/g, "").toLowerCase();
}

function firstHeaderIndex(headers: string[], names: string[]) {
  for (const name of names) {
    const index = headers.indexOf(name);
    if (index >= 0) return index;
  }
  return -1;
}

function normalizeDatasetCases(cases: DatasetCaseInput[]) {
  if (!Array.isArray(cases)) return [];
  return cases.map((item) => ({
    input: String(item?.input ?? "").trim(),
    expectedBehavior: String(item?.expectedBehavior ?? ""),
    tags: Array.isArray(item?.tags) ? item.tags.join(",") : String(item?.tags ?? ""),
  }));
}

export function validateDatasetCases(cases: DatasetCaseInput[]): DatasetImportErrorItem[] {
  const errors: DatasetImportErrorItem[] = [];
  if (!Array.isArray(cases)) {
    return [{ row: 0, field: "cases", message: "用例必须是数组" }];
  }
  if (cases.length > DATASET_IMPORT_MAX_CASES) {
    errors.push({ row: 0, field: "cases", message: `单个数据集最多 ${DATASET_IMPORT_MAX_CASES} 条用例` });
  }
  cases.forEach((item, index) => {
    const row = index + 1;
    if (!String(item?.input ?? "").trim()) {
      errors.push({ row, field: "input", message: "input 不能为空" });
    }
    if (item?.expectedBehavior != null && typeof item.expectedBehavior !== "string") {
      errors.push({ row, field: "expectedBehavior", message: "expectedBehavior 必须是字符串" });
    }
    if (item?.tags != null && typeof item.tags !== "string" && !Array.isArray(item.tags)) {
      errors.push({ row, field: "tags", message: "tags 必须是字符串或字符串数组" });
    }
  });
  return errors;
}
