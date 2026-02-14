-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallScore" INTEGER NOT NULL,
    "seoScore" INTEGER NOT NULL,
    "convScore" INTEGER NOT NULL,
    "perfScore" INTEGER NOT NULL,
    "summaryJson" JSONB NOT NULL
);

CREATE TABLE "PageResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "metaDesc" TEXT,
    "h1" TEXT,
    "ogJson" JSONB,
    "altCoverage" REAL,
    "structuredDataPresent" BOOLEAN NOT NULL DEFAULT false,
    "brokenLinksCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PageResult_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Finding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "howToApply" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "Finding_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Shop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopDomain" TEXT NOT NULL,
    "accessTokenEncrypted" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ActionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActionLog_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AdProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeUrl" TEXT NOT NULL,
    "shopIdNullable" TEXT,
    "productRef" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "captionsJson" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "outputFilePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdProject_shopIdNullable_fkey" FOREIGN KEY ("shopIdNullable") REFERENCES "Shop" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Shop_shopDomain_key" ON "Shop"("shopDomain");
