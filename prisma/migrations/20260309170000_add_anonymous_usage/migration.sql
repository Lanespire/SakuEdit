CREATE TABLE "anonymous_usages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fingerprint" TEXT NOT NULL,
    "dailyCount" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL,
    "blockedUntil" DATETIME
);

CREATE UNIQUE INDEX "anonymous_usages_fingerprint_key" ON "anonymous_usages"("fingerprint");
CREATE INDEX "anonymous_usages_fingerprint_idx" ON "anonymous_usages"("fingerprint");
CREATE INDEX "anonymous_usages_lastResetAt_idx" ON "anonymous_usages"("lastResetAt");
