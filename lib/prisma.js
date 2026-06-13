import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

function withConnectionLimit(url) {
  if (!url) return url;

  try {
    const databaseUrl = new URL(url);
    if (!databaseUrl.searchParams.has("connection_limit")) {
      databaseUrl.searchParams.set("connection_limit", "1");
    }
    return databaseUrl.toString();
  } catch {
    return url;
  }
}

const prismaClientOptions = {
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
};

const databaseUrl = withConnectionLimit(process.env.DATABASE_URL);
if (databaseUrl) {
  prismaClientOptions.datasources = {
    db: {
      url: databaseUrl,
    },
  };
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
