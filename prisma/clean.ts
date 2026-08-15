import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";
import { PrismaClient } from "../src/generated/prisma/client";

const env = z.object({ DATABASE_URL: z.url() }).parse({
  DATABASE_URL: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});

async function main() {
  console.log("🧹 Cleaning product & brand data...");

  await prisma.productCompatibility.deleteMany({});
  await prisma.motorcycleSpec.deleteMany({});
  await prisma.partSpec.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productTranslation.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.categoryTranslation.deleteMany({});
  await prisma.category.deleteMany({});

  console.log("✅ All product/brand/category data deleted.");
}

main()
  .catch((e) => {
    console.error("❌ Clean failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
