import crypto from "crypto";
import type { AdProjectRecord, ActionLogRecord, FindingRecord, PageResultRecord, ScanRecord, ShopRecord } from "@/lib/dbTypes";

function id() {
  return crypto.randomUUID();
}

type DbClient = {
  scan: {
    create(args: {
      data: Omit<ScanRecord, "id" | "createdAt" | "findings" | "pageResults"> & {
        findings: { create: Array<Omit<FindingRecord, "id" | "scanId" | "createdAt" | "resolvedAt">> };
        pageResults: {
          create: Array<
            Omit<PageResultRecord, "id" | "scanId" | "createdAt" | "structuredDataPresent" | "brokenLinksCount"> &
              Partial<Pick<PageResultRecord, "structuredDataPresent" | "brokenLinksCount">>
          >;
        };
      };
    }): Promise<ScanRecord>;
    findUnique(args: { where: { id: string }; include?: { findings?: boolean; pageResults?: boolean } }): Promise<ScanRecord | null>;
  };
  adProject: {
    findMany(args: { orderBy: { createdAt: "asc" | "desc" }; take: number }): Promise<AdProjectRecord[]>;
    create(args: { data: Omit<AdProjectRecord, "id" | "createdAt" | "outputFilePath" | "status" | "shopIdNullable"> & Partial<Pick<AdProjectRecord, "status" | "outputFilePath" | "shopIdNullable">> }): Promise<AdProjectRecord>;
    findUniqueOrThrow(args: { where: { id: string } }): Promise<AdProjectRecord>;
    update(args: { where: { id: string }; data: Partial<AdProjectRecord> }): Promise<AdProjectRecord>;
  };
  shop: {
    upsert(args: { where: { shopDomain: string }; update: { accessTokenEncrypted: string }; create: { shopDomain: string; accessTokenEncrypted: string } }): Promise<ShopRecord>;
    findUniqueOrThrow(args: { where: { id: string } }): Promise<ShopRecord>;
  };
  actionLog: {
    create(args: { data: Omit<ActionLogRecord, "id" | "createdAt"> }): Promise<ActionLogRecord>;
  };
};

const memory = {
  scans: [] as ScanRecord[],
  ads: [] as AdProjectRecord[],
  shops: [] as ShopRecord[],
  logs: [] as ActionLogRecord[]
};

const fallbackPrisma: DbClient = {
  scan: {
    async create({ data }) {
      const scanId = id();
      const record: ScanRecord = {
        id: scanId,
        createdAt: new Date(),
        storeUrl: data.storeUrl,
        overallScore: data.overallScore,
        seoScore: data.seoScore,
        convScore: data.convScore,
        perfScore: data.perfScore,
        summaryJson: data.summaryJson,
        findings: data.findings.create.map((f) => ({ ...f, id: id(), scanId, createdAt: new Date(), resolvedAt: null })),
        pageResults: data.pageResults.create.map((p) => ({
          id: id(),
          scanId,
          url: p.url,
          title: p.title ?? null,
          metaDesc: p.metaDesc ?? null,
          h1: p.h1 ?? null,
          ogJson: (p.ogJson as Record<string, string | undefined>) ?? null,
          altCoverage: p.altCoverage ?? null,
          structuredDataPresent: p.structuredDataPresent ?? false,
          brokenLinksCount: p.brokenLinksCount ?? 0,
          createdAt: new Date()
        }))
      };
      memory.scans.push(record);
      return record;
    },
    async findUnique({ where }) {
      return memory.scans.find((s) => s.id === where.id) ?? null;
    }
  },
  adProject: {
    async findMany({ orderBy, take }) {
      const sorted = [...memory.ads].sort((a, b) => (orderBy.createdAt === "desc" ? b.createdAt.getTime() - a.createdAt.getTime() : a.createdAt.getTime() - b.createdAt.getTime()));
      return sorted.slice(0, take);
    },
    async create({ data }) {
      const project: AdProjectRecord = {
        id: id(),
        createdAt: new Date(),
        status: data.status ?? "QUEUED",
        outputFilePath: data.outputFilePath ?? null,
        shopIdNullable: data.shopIdNullable ?? null,
        storeUrl: data.storeUrl,
        productRef: data.productRef,
        template: data.template,
        format: data.format,
        script: data.script,
        captionsJson: data.captionsJson
      };
      memory.ads.push(project);
      return project;
    },
    async findUniqueOrThrow({ where }) {
      const item = memory.ads.find((a) => a.id === where.id);
      if (!item) throw new Error("Ad project not found");
      return item;
    },
    async update({ where, data }) {
      const idx = memory.ads.findIndex((a) => a.id === where.id);
      if (idx < 0) throw new Error("Ad project not found");
      memory.ads[idx] = { ...memory.ads[idx], ...data };
      return memory.ads[idx];
    }
  },
  shop: {
    async upsert({ where, update, create }) {
      const existing = memory.shops.find((s) => s.shopDomain === where.shopDomain);
      if (existing) {
        existing.accessTokenEncrypted = update.accessTokenEncrypted;
        existing.updatedAt = new Date();
        return existing;
      }
      const shop: ShopRecord = {
        id: id(),
        shopDomain: create.shopDomain,
        accessTokenEncrypted: create.accessTokenEncrypted,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memory.shops.push(shop);
      return shop;
    },
    async findUniqueOrThrow({ where }) {
      const item = memory.shops.find((s) => s.id === where.id);
      if (!item) throw new Error("Shop not found");
      return item;
    }
  },
  actionLog: {
    async create({ data }) {
      const log: ActionLogRecord = { id: id(), createdAt: new Date(), ...data };
      memory.logs.push(log);
      return log;
    }
  }
};

function createPrismaClient(): DbClient {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require("@prisma/client");
    const g = globalThis as typeof globalThis & { prismaRuntime?: DbClient };
    if (!g.prismaRuntime) {
      g.prismaRuntime = new PrismaClient({ log: ["warn", "error"] }) as DbClient;
    }
    return g.prismaRuntime;
  } catch {
    return fallbackPrisma;
  }
}

export const prisma: DbClient = createPrismaClient();
