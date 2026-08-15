import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const brands = await prisma.brand.count();
  const images = await prisma.productImage.count();
  const products = await prisma.product.findMany({
    select: { sku: true, price: true, type: true, isFeatured: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\n📊 Seed verification:`);
  console.log(`   Brands  : ${brands}`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Images  : ${images}\n`);
  products.forEach((p) => {
    const price = (Number(p.price) / 1_000_000).toFixed(1);
    const featured = p.isFeatured ? "⭐" : "  ";
    console.log(`   ${featured} [${p.type.padEnd(10)}] ${p.sku.padEnd(38)} ${price}M UZS`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
