import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "argon2";
import { z } from "zod";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  AdminRole,
  Locale,
  ProductColor,
  ProductCondition,
  ProductStatus,
  ProductType,
} from "../src/generated/prisma/enums";

const seedEnvSchema = z.object({
  DATABASE_URL: z.url(),
  NODE_ENV: z.enum(["development", "test"]).default("development"),
  SEED_ADMIN_EMAIL: z.email().transform((value) => value.toLowerCase()),
  SEED_ADMIN_PASSWORD: z.string().min(12),
});

const env = seedEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});

type Translation = {
  description: string;
  locale: Locale;
  name: string;
  slug: string;
};

async function upsertCategory(sortOrder: number, translations: Translation[]) {
  const uz = translations.find(({ locale }) => locale === Locale.UZ);

  if (!uz) {
    throw new Error("Every seeded category requires an Uzbek translation");
  }

  const existing = await prisma.categoryTranslation.findUnique({
    where: { locale_slug: { locale: Locale.UZ, slug: uz.slug } },
    select: { categoryId: true },
  });

  const category = existing
    ? await prisma.category.update({
        where: { id: existing.categoryId },
        data: { archivedAt: null, isActive: true, sortOrder },
      })
    : await prisma.category.create({ data: { sortOrder } });

  for (const translation of translations) {
    await prisma.categoryTranslation.upsert({
      where: {
        categoryId_locale: {
          categoryId: category.id,
          locale: translation.locale,
        },
      },
      create: { categoryId: category.id, ...translation },
      update: translation,
    });
  }

  return category;
}

async function upsertProduct(input: {
  additionalImages?: { altUz?: string; slug: string }[];
  brandId?: string;
  categoryId: string;
  compatibility?: {
    engineCc?: number;
    make: string;
    model: string;
    yearFrom?: number;
    yearTo?: number;
  }[];
  condition?: ProductCondition;
  color?: ProductColor;
  imageSlug: string;
  motorcycle?: {
    engineCc: number;
    make: string;
    mileageKm: number;
    model: string;
    year: number;
  };
  partNumber?: string;
  price: string;
  compareAtPrice?: string;
  isFeatured?: boolean;
  sku: string;
  stock: number;
  translations: Translation[];
  type: ProductType;
}) {
  const product = await prisma.product.upsert({
    where: { sku: input.sku },
    create: {
      brandId: input.brandId,
      categoryId: input.categoryId,
      condition: input.condition,
      color: input.color,
      currency: "UZS",
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      isFeatured: input.isFeatured ?? false,
      sku: input.sku,
      status: ProductStatus.ACTIVE,
      stock: input.stock,
      type: input.type,
    },
    update: {
      archivedAt: null,
      brandId: input.brandId,
      categoryId: input.categoryId,
      condition: input.condition,
      color: input.color,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      isFeatured: input.isFeatured ?? false,
      status: ProductStatus.ACTIVE,
      stock: input.stock,
      type: input.type,
    },
  });

  for (const translation of input.translations) {
    await prisma.productTranslation.upsert({
      where: {
        productId_locale: {
          locale: translation.locale,
          productId: product.id,
        },
      },
      create: { productId: product.id, ...translation },
      update: translation,
    });
  }

  await prisma.productImage.upsert({
    where: { objectKey: `demo/${input.imageSlug}.webp` },
    create: {
      altUz: input.translations[0]?.name ?? input.sku,
      isPrimary: true,
      sortOrder: 0,
      width: 1200,
      height: 800,
      objectKey: `demo/${input.imageSlug}.webp`,
      productId: product.id,
      url: `/demo/${input.imageSlug}.webp`,
    },
    update: {
      altUz: input.translations[0]?.name ?? input.sku,
      isPrimary: true,
      sortOrder: 0,
      width: 1200,
      height: 800,
      productId: product.id,
      url: `/demo/${input.imageSlug}.webp`,
    },
  });

  if (input.additionalImages?.length) {
    for (let i = 0; i < input.additionalImages.length; i++) {
      const img = input.additionalImages[i];
      await prisma.productImage.upsert({
        where: { objectKey: `demo/${img.slug}.webp` },
        create: {
          altUz: img.altUz ?? input.translations[0]?.name ?? input.sku,
          isPrimary: false,
          sortOrder: i + 1,
          width: 1200,
          height: 800,
          objectKey: `demo/${img.slug}.webp`,
          productId: product.id,
          url: `/demo/${img.slug}.webp`,
        },
        update: {
          altUz: img.altUz ?? input.translations[0]?.name ?? input.sku,
          isPrimary: false,
          sortOrder: i + 1,
          width: 1200,
          height: 800,
          productId: product.id,
          url: `/demo/${img.slug}.webp`,
        },
      });
    }
  }

  if (input.motorcycle) {
    await prisma.motorcycleSpec.upsert({
      where: { productId: product.id },
      create: { productId: product.id, ...input.motorcycle },
      update: input.motorcycle,
    });
  }

  if (input.partNumber) {
    await prisma.partSpec.upsert({
      where: { productId: product.id },
      create: { partNumber: input.partNumber, productId: product.id },
      update: { partNumber: input.partNumber },
    });
  }

  await prisma.productCompatibility.deleteMany({
    where: { productId: product.id },
  });

  if (input.compatibility?.length) {
    await prisma.productCompatibility.createMany({
      data: input.compatibility.map((compatibility) => ({
        ...compatibility,
        productId: product.id,
      })),
    });
  }
}

async function main() {
  const passwordHash = await hash(env.SEED_ADMIN_PASSWORD, {
    memoryCost: 19456,
    parallelism: 1,
    timeCost: 2,
  });

  await prisma.adminUser.upsert({
    where: { email: env.SEED_ADMIN_EMAIL },
    create: {
      email: env.SEED_ADMIN_EMAIL,
      name: "Development Admin",
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
    },
    update: {
      deletedAt: null,
      isActive: true,
      name: "Development Admin",
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
    },
  });

  // ─── Categories ───────────────────────────────────────────────────────────
  const [motorcycles, parts, accessories, gear] = await Promise.all([
    upsertCategory(10, [
      {
        locale: Locale.UZ,
        slug: "mototsikllar",
        name: "Mototsikllar",
        description: "Shahar va trassa uchun sport va naked mototsikllar.",
      },
      {
        locale: Locale.RU,
        slug: "motocikly",
        name: "Мотоциклы",
        description: "Спортивные и нейкид мотоциклы для города и трека.",
      },
      {
        locale: Locale.EN,
        slug: "motorcycles",
        name: "Motorcycles",
        description: "Sport and naked motorcycles for city and track.",
      },
    ]),
    upsertCategory(20, [
      {
        locale: Locale.UZ,
        slug: "ehtiyot-qismlar",
        name: "Ehtiyot qismlar",
        description: "Texnik xizmat, ta'mirlash va tuning qismlari.",
      },
      {
        locale: Locale.RU,
        slug: "zapchasti",
        name: "Запчасти",
        description: "Детали для обслуживания, ремонта и тюнинга.",
      },
      {
        locale: Locale.EN,
        slug: "parts",
        name: "Parts",
        description: "Parts for maintenance, repair and tuning.",
      },
    ]),
    upsertCategory(30, [
      {
        locale: Locale.UZ,
        slug: "aksessuarlar",
        name: "Aksessuarlar",
        description: "Bagaj, navigatsiya va qulaylik uchun aksessuarlar.",
      },
      {
        locale: Locale.RU,
        slug: "aksessuary",
        name: "Аксессуары",
        description: "Аксессуары для багажа, навигации и комфорта.",
      },
      {
        locale: Locale.EN,
        slug: "accessories",
        name: "Accessories",
        description: "Luggage, navigation and comfort accessories.",
      },
    ]),
    upsertCategory(40, [
      {
        locale: Locale.UZ,
        slug: "ekipirovka",
        name: "Ekipirovka",
        description: "Shlem, kurtka, qo'lqop va himoya vositalari.",
      },
      {
        locale: Locale.RU,
        slug: "ekipirovka",
        name: "Экипировка",
        description: "Шлемы, куртки, перчатки и средства защиты.",
      },
      {
        locale: Locale.EN,
        slug: "gear",
        name: "Gear",
        description: "Helmets, jackets, gloves and protective gear.",
      },
    ]),
  ]);

  // ─── Brands ───────────────────────────────────────────────────────────────
  const [yamaha, honda, kawasaki, suzuki, bmw, agv, akrapovic, alpinestars, dainese, pirelli, givi, motul, ls2] =
    await Promise.all(
      [
        ["Yamaha",      "yamaha",      "https://www.yamaha-motor.eu"],
        ["Honda",       "honda",       "https://www.honda.com"],
        ["Kawasaki",    "kawasaki",    "https://www.kawasaki.com"],
        ["Suzuki",      "suzuki",      "https://www.suzuki-motor.com"],
        ["BMW Motorrad","bmw-motorrad","https://www.bmw-motorrad.com"],
        ["AGV",         "agv",         "https://www.agv.com"],
        ["Akrapovič",   "akrapovic",   "https://www.akrapovic.com"],
        ["Alpinestars", "alpinestars", "https://www.alpinestars.com"],
        ["Dainese",     "dainese",     "https://www.dainese.com"],
        ["Pirelli",     "pirelli",     "https://www.pirelli.com"],
        ["Givi",        "givi",        "https://www.givi.it"],
        ["Motul",       "motul",       "https://www.motul.com"],
        ["LS2",         "ls2",         "https://ls2helmets.com"],
      ].map(([name, slug, websiteUrl]) =>
        prisma.brand.upsert({
          where: { slug },
          create: { name, slug, websiteUrl },
          update: { archivedAt: null, isActive: true, name, websiteUrl },
        }),
      ),
    );

  // ─── 🏍️  MOTORCYCLES (5 models) ──────────────────────────────────────────

  // 1. Yamaha MT-07 2025
  await upsertProduct({
    brandId: yamaha.id,
    categoryId: motorcycles.id,
    condition: ProductCondition.NEW,
    color: ProductColor.BLACK,
    imageSlug: "yamaha-mt-07-2025",
    isFeatured: true,
    motorcycle: {
      engineCc: 689,
      make: "Yamaha",
      mileageKm: 0,
      model: "MT-07",
      year: 2025,
    },
    price: "128000000.00",
    compareAtPrice: "135000000.00",
    sku: "MOTO-YAM-MT07-2025",
    stock: 3,
    translations: [
      {
        locale: Locale.UZ,
        slug: "yamaha-mt-07-2025",
        name: "Yamaha MT-07 2025",
        description:
          "689 cc parallel-twin dvigatelli, 73 l.k. quvvatga ega Yamaha MT-07 2025 — shahar va tog' yo'llarida mukammal balansni ta'minlaydigan naked mototsikl. YCC-T elektronik gaz tizimi, LED chiroqlar va yangilangan ergonomika bilan jihozlangan. Toshkentdan yetkazib berish mavjud.",
      },
      {
        locale: Locale.RU,
        slug: "yamaha-mt-07-2025",
        name: "Yamaha MT-07 2025",
        description:
          "Yamaha MT-07 2025 с параллельным двухцилиндровым двигателем 689 куб. см мощностью 73 л.с. — нейкид мотоцикл, обеспечивающий идеальный баланс в городе и на горных дорогах. Оснащён электронным дросселем YCC-T, LED-фарами и обновлённой эргономикой.",
      },
      {
        locale: Locale.EN,
        slug: "yamaha-mt-07-2025",
        name: "Yamaha MT-07 2025",
        description:
          "The Yamaha MT-07 2025 packs a 689 cc CP2 parallel-twin producing 73 hp into a lightweight naked chassis. Features YCC-T electronic throttle, full-LED lighting and refreshed ergonomics for the perfect city-to-canyon machine.",
      },
    ],
    type: ProductType.MOTORCYCLE,
  });

  // 2. Honda CBR600RR 2024
  await upsertProduct({
    brandId: honda.id,
    categoryId: motorcycles.id,
    condition: ProductCondition.NEW,
    color: ProductColor.RED,
    imageSlug: "honda-cbr600rr-2024",
    isFeatured: true,
    motorcycle: {
      engineCc: 599,
      make: "Honda",
      mileageKm: 0,
      model: "CBR600RR",
      year: 2024,
    },
    price: "195000000.00",
    compareAtPrice: "210000000.00",
    sku: "MOTO-HON-CBR600RR-2024",
    stock: 2,
    translations: [
      {
        locale: Locale.UZ,
        slug: "honda-cbr600rr-2024",
        name: "Honda CBR600RR 2024",
        description:
          "599 cc to'rt silindrli dvigatel, 121 l.k. quvvat va MotoGP texnologiyalari asosida yaratilgan Honda CBR600RR 2024. Showa Big Piston vilkasi, Brembo tormozlari, Repsol livereyi bilan jihozlangan. Supersport sinfdagi eng zo'r mototsikllardan biri.",
      },
      {
        locale: Locale.RU,
        slug: "honda-cbr600rr-2024",
        name: "Honda CBR600RR 2024",
        description:
          "Honda CBR600RR 2024 с четырёхцилиндровым двигателем 599 куб. см мощностью 121 л.с., основанным на технологиях MotoGP. Оснащён вилкой Showa Big Piston, тормозами Brembo и ливреей Repsol. Один из лучших в классе суперспорт.",
      },
      {
        locale: Locale.EN,
        slug: "honda-cbr600rr-2024",
        name: "Honda CBR600RR 2024",
        description:
          "The Honda CBR600RR 2024 delivers 121 hp from its 599 cc inline-four, drawing directly on MotoGP technology. Showa Big Piston forks, Brembo calipers and the iconic Repsol livery make it the definitive supersport machine.",
      },
    ],
    type: ProductType.MOTORCYCLE,
  });

  // 3. Kawasaki Z900 2024
  await upsertProduct({
    brandId: kawasaki.id,
    categoryId: motorcycles.id,
    condition: ProductCondition.NEW,
    color: ProductColor.GREEN,
    imageSlug: "kawasaki-z900-2024",
    isFeatured: true,
    motorcycle: {
      engineCc: 948,
      make: "Kawasaki",
      mileageKm: 0,
      model: "Z900",
      year: 2024,
    },
    price: "152000000.00",
    compareAtPrice: "162000000.00",
    sku: "MOTO-KAW-Z900-2024",
    stock: 4,
    translations: [
      {
        locale: Locale.UZ,
        slug: "kawasaki-z900-2024",
        name: "Kawasaki Z900 2024",
        description:
          "948 cc to'rt silindrli dvigatel va 125 l.k. quvvat bilan Kawasaki Z900 2024 — agresiv dizayni va kuchli performansi bilan naked segmentining liderlaridan biri. Elektronik traction control, 4 ta riding mode va TFT displeyi bilan jihozlangan. Sugomi yashil rangi — brendning ikonik belgisi.",
      },
      {
        locale: Locale.RU,
        slug: "kawasaki-z900-2024",
        name: "Kawasaki Z900 2024",
        description:
          "Kawasaki Z900 2024 с четырёхцилиндровым двигателем 948 куб. см мощностью 125 л.с. — один из лидеров в классе нейкид с агрессивным дизайном и мощной динамикой. Оснащён электронным контролем тяги, 4 режимами езды и TFT-дисплеем.",
      },
      {
        locale: Locale.EN,
        slug: "kawasaki-z900-2024",
        name: "Kawasaki Z900 2024",
        description:
          "The Kawasaki Z900 2024 unleashes 125 hp from its 948 cc inline-four in a sharp, aggressive naked package. Electronic traction control, four riding modes and a TFT display make it as smart as it is fast. Available in iconic Sugomi green.",
      },
    ],
    type: ProductType.MOTORCYCLE,
  });

  // 4. Suzuki GSX-R1000 2024
  await upsertProduct({
    brandId: suzuki.id,
    categoryId: motorcycles.id,
    condition: ProductCondition.NEW,
    color: ProductColor.BLUE,
    imageSlug: "suzuki-gsxr1000-2024",
    isFeatured: true,
    motorcycle: {
      engineCc: 999,
      make: "Suzuki",
      mileageKm: 0,
      model: "GSX-R1000",
      year: 2024,
    },
    price: "235000000.00",
    compareAtPrice: "250000000.00",
    sku: "MOTO-SUZ-GSXR1000-2024",
    stock: 2,
    translations: [
      {
        locale: Locale.UZ,
        slug: "suzuki-gsx-r1000-2024",
        name: "Suzuki GSX-R1000 2024",
        description:
          "999 cc inline-four dvigatel va 202 l.k. quvvat bilan Suzuki GSX-R1000 2024 — trassa mototsiklining simvoli. MotoGP texnologiyalari: Variable Valve Timing, Launch Control, Motion Track ABS va 10 darajali traction control. Yoshimura livereyi bilan taqdimlangan.",
      },
      {
        locale: Locale.RU,
        slug: "suzuki-gsx-r1000-2024",
        name: "Suzuki GSX-R1000 2024",
        description:
          "Suzuki GSX-R1000 2024 с двигателем 999 куб. см мощностью 202 л.с. — символ трекового мотоцикла. Технологии MotoGP: Variable Valve Timing, Launch Control, Motion Track ABS и 10-уровневый контроль тяги. Представлен в ливрее Yoshimura.",
      },
      {
        locale: Locale.EN,
        slug: "suzuki-gsx-r1000-2024",
        name: "Suzuki GSX-R1000 2024",
        description:
          "The Suzuki GSX-R1000 2024 delivers 202 hp from its 999 cc inline-four, packed with MotoGP-derived tech including Variable Valve Timing, Launch Control, Motion Track ABS and 10-level traction control. Dressed in the legendary Yoshimura livery.",
      },
    ],
    type: ProductType.MOTORCYCLE,
  });

  // 5. BMW S1000RR 2024
  await upsertProduct({
    additionalImages: [
      {
        slug: "bmw-s1000rr-2024-2",
        altUz: "BMW S1000RR 2024 - Orqa tomondan ko'rinishi",
      },
      {
        slug: "bmw-s1000rr-2024-3",
        altUz: "BMW S1000RR 2024 - Yon tomondan ko'rinishi",
      },
      {
        slug: "bmw-s1000rr-2024-4",
        altUz: "BMW S1000RR 2024 - Old tomondan ko'rinishi",
      },
    ],
    brandId: bmw.id,
    categoryId: motorcycles.id,
    condition: ProductCondition.NEW,
    color: ProductColor.WHITE,
    imageSlug: "bmw-s1000rr-2024",
    isFeatured: true,
    motorcycle: {
      engineCc: 999,
      make: "BMW Motorrad",
      mileageKm: 0,
      model: "S1000RR",
      year: 2024,
    },
    price: "420000000.00",
    compareAtPrice: "450000000.00",
    sku: "MOTO-BMW-S1000RR-2024",
    stock: 1,
    translations: [
      {
        locale: Locale.UZ,
        slug: "bmw-s1000rr-2024",
        name: "BMW S1000RR 2024",
        description:
          "210 l.k. quvvatli 999 cc inline-four dvigatel va M-Sport paketi bilan BMW S1000RR 2024 — dunyo chempionatlarida ishtirok etadigan superbike. ShiftCam texnologiyasi, DDC elektronik suspension, M karbon vilkasi va M endurance zanjiri bilan jihozlangan. Milliy rekord darajasida ishlaydi.",
      },
      {
        locale: Locale.RU,
        slug: "bmw-s1000rr-2024",
        name: "BMW S1000RR 2024",
        description:
          "BMW S1000RR 2024 с двигателем 999 куб. см мощностью 210 л.с. и M-Sport пакетом — супербайк мирового уровня. Оснащён технологией ShiftCam, электронной подвеской DDC, карбоновой вилкой M и цепью M Endurance. Производительность мирового чемпионата.",
      },
      {
        locale: Locale.EN,
        slug: "bmw-s1000rr-2024",
        name: "BMW S1000RR 2024",
        description:
          "The BMW S1000RR 2024 with M-Sport package produces 210 hp from its 999 cc ShiftCam inline-four. DDC electronic suspension, M Carbon fork, M Endurance chain and the iconic M motorsport livery place it at the very pinnacle of production superbikes.",
      },
    ],
    type: ProductType.MOTORCYCLE,
  });

  // ─── 🔧 PARTS ─────────────────────────────────────────────────────────────

  // Akrapovič Slip-On Carbon Exhaust
  await upsertProduct({
    brandId: akrapovic.id,
    categoryId: parts.id,
    compatibility: [
      { engineCc: 689, make: "Yamaha", model: "MT-07", yearFrom: 2021, yearTo: 2025 },
      { engineCc: 689, make: "Yamaha", model: "XSR700", yearFrom: 2021, yearTo: 2025 },
    ],
    condition: ProductCondition.NEW,
    color: ProductColor.SILVER,
    imageSlug: "akrapovic-slip-on-carbon",
    isFeatured: true,
    partNumber: "S-Y7SO11-HCZBL",
    price: "7500000.00",
    compareAtPrice: "9200000.00",
    sku: "PART-AKR-SLIP-ON-MT07-CF",
    stock: 5,
    translations: [
      {
        locale: Locale.UZ,
        slug: "akrapovic-slip-on-carbon-mt07",
        name: "Akrapovič Slip-On Line (Carbon) MT-07",
        description:
          "Yamaha MT-07 2021–2025 uchun Akrapovič carbon fiber Slip-On egzoz tizimi. Titanium qo'rg'oshin va carbon fiber qopqoq: umumiy vazni atigi 1.8 kg. 3-5 l.k. qo'shimcha quvvat, agressiv tovush va Euro 5 muvofiqlik. Montaj uchun barcha texnik aksessuarlar to'plami kiritilgan.",
      },
      {
        locale: Locale.RU,
        slug: "akrapovic-slip-on-carbon-mt07",
        name: "Akrapovič Slip-On Line (Carbon) MT-07",
        description:
          "Система выпуска Akrapovič Slip-On с корпусом из углеродного волокна для Yamaha MT-07 2021–2025. Коллектор из титана и крышка из карбона: общий вес всего 1,8 кг. Прирост 3–5 л.с., агрессивный звук, соответствие Euro 5. В комплекте весь монтажный набор.",
      },
      {
        locale: Locale.EN,
        slug: "akrapovic-slip-on-carbon-mt07",
        name: "Akrapovič Slip-On Line (Carbon) MT-07",
        description:
          "Carbon fibre Slip-On exhaust system for Yamaha MT-07 2021–2025. Titanium link pipe with carbon fibre sleeve: total weight just 1.8 kg. Gains 3–5 hp, delivers an aggressive soundtrack, and remains Euro 5 compliant. Full fitting kit included.",
      },
    ],
    type: ProductType.PART,
  });

  // Motul 7100 10W-40
  await upsertProduct({
    brandId: motul.id,
    categoryId: parts.id,
    compatibility: [
      { engineCc: 689,  make: "Yamaha",  model: "MT-07",      yearFrom: 2014, yearTo: 2025 },
      { engineCc: 599,  make: "Honda",   model: "CBR600RR",   yearFrom: 2013, yearTo: 2024 },
      { engineCc: 948,  make: "Kawasaki",model: "Z900",       yearFrom: 2017, yearTo: 2024 },
      { engineCc: 999,  make: "Suzuki",  model: "GSX-R1000",  yearFrom: 2017, yearTo: 2024 },
      { engineCc: 999,  make: "BMW Motorrad", model: "S1000RR", yearFrom: 2019, yearTo: 2024 },
    ],
    condition: ProductCondition.NEW,
    color: ProductColor.GOLD,
    imageSlug: "motul-7100-10w40",
    partNumber: "104091",
    price: "245000.00",
    sku: "PART-MOT-7100-10W40-1L",
    stock: 80,
    translations: [
      {
        locale: Locale.UZ,
        slug: "motul-7100-10w40-1l",
        name: "Motul 7100 10W-40 1 litr",
        description:
          "4-takt mototsikllar uchun Motul 7100 to'liq sintetik motor moyi, 1 litr. Ester texnologiyasi asosida yaratilgan formula istalgan sharoitda maksimal dvigatel himoyasini ta'minlaydi. JASO MA2 sertifikati, vlazhniy shlif muammodan himoya. Barcha 4-takt mototsikl dvigatellari uchun mos keladi.",
      },
      {
        locale: Locale.RU,
        slug: "motul-7100-10w40-1l",
        name: "Motul 7100 10W-40 1 л",
        description:
          "Полностью синтетическое моторное масло Motul 7100 для четырёхтактных мотоциклов, 1 л. Формула на основе технологии Ester обеспечивает максимальную защиту двигателя в любых условиях. Сертификат JASO MA2. Подходит для всех четырёхтактных двигателей мотоциклов.",
      },
      {
        locale: Locale.EN,
        slug: "motul-7100-10w40-1l",
        name: "Motul 7100 10W-40 1L",
        description:
          "Fully synthetic 4-stroke motorcycle engine oil by Motul, 1 L. Ester-based formula delivers maximum engine protection under all conditions. JASO MA2 certified for wet clutch compatibility. Universal fit for all four-stroke motorcycle engines.",
      },
    ],
    type: ProductType.PART,
  });

  // Pirelli Diablo Rosso IV tire
  await upsertProduct({
    brandId: pirelli.id,
    categoryId: parts.id,
    compatibility: [
      { make: "Yamaha",  model: "MT-07",    yearFrom: 2014, yearTo: 2025 },
      { make: "Honda",   model: "CBR600RR", yearFrom: 2013, yearTo: 2024 },
      { make: "Kawasaki",model: "Z900",     yearFrom: 2017, yearTo: 2024 },
    ],
    condition: ProductCondition.NEW,
    color: ProductColor.BLACK,
    imageSlug: "pirelli-diablo-rosso-iv",
    partNumber: "4029600",
    price: "2100000.00",
    compareAtPrice: "2450000.00",
    sku: "PART-PIR-DR4-12070ZR17",
    stock: 20,
    translations: [
      {
        locale: Locale.UZ,
        slug: "pirelli-diablo-rosso-iv-120-70-zr17",
        name: "Pirelli Diablo Rosso IV 120/70 ZR17",
        description:
          "Oldingi g'ildirak: Pirelli Diablo Rosso IV 120/70 ZR17 — trassa va shahar uchun mukammal sport shinasi. Yangi compound va proctor texnologiyasi bilan isitish vaqti qisqargan, grip darajasi oshgan. Yomg'irda va quruqda barqaror ishlaydi. Yamaha MT-07, Honda CBR600RR va Kawasaki Z900 bilan to'liq mos keladi.",
      },
      {
        locale: Locale.RU,
        slug: "pirelli-diablo-rosso-iv-120-70-zr17",
        name: "Pirelli Diablo Rosso IV 120/70 ZR17",
        description:
          "Pirelli Diablo Rosso IV 120/70 ZR17 — передняя спортивная шина для трека и города. Новый компаунд и технология Proctor сокращают время прогрева и повышают уровень сцепления. Стабильна в дождь и на сухой дороге. Совместима с Yamaha MT-07, Honda CBR600RR и Kawasaki Z900.",
      },
      {
        locale: Locale.EN,
        slug: "pirelli-diablo-rosso-iv-120-70-zr17",
        name: "Pirelli Diablo Rosso IV 120/70 ZR17",
        description:
          "Front sport tyre: Pirelli Diablo Rosso IV 120/70 ZR17. New compound and Proctor technology reduce warm-up time and maximise grip in both wet and dry conditions. Fully compatible with Yamaha MT-07, Honda CBR600RR and Kawasaki Z900.",
      },
    ],
    type: ProductType.PART,
  });

  // ─── 🎒 ACCESSORIES ────────────────────────────────────────────────────────

  // Givi V47 Top Case
  await upsertProduct({
    brandId: givi.id,
    categoryId: accessories.id,
    condition: ProductCondition.NEW,
    color: ProductColor.BLACK,
    imageSlug: "givi-v47-top-case",
    isFeatured: true,
    price: "2890000.00",
    compareAtPrice: "3200000.00",
    sku: "ACC-GIVI-V47NML",
    stock: 12,
    translations: [
      {
        locale: Locale.UZ,
        slug: "givi-v47-monolock-top-case",
        name: "Givi V47 Monolock top case",
        description:
          "47 litrlik Givi V47 Monolock qattiq bagaj — ikkita integral shlem va shaxsiy buyumlar uchun ideal. ABS plastik korpus, zamonaviy Monolock plitalari tizimi va o'rnatilgan ichki yoritish. Barcha asosiy mototsikl markalari uchun moslagichlar mavjud.",
      },
      {
        locale: Locale.RU,
        slug: "givi-v47-monolock-top-case",
        name: "Кофр Givi V47 Monolock",
        description:
          "47-литровый жёсткий кофр Givi V47 Monolock — идеальный для двух интегральных шлемов и личных вещей. Корпус из ABS-пластика, современная система пластин Monolock и встроенная внутренняя подсветка. Адаптеры доступны для всех основных марок мотоциклов.",
      },
      {
        locale: Locale.EN,
        slug: "givi-v47-monolock-top-case",
        name: "Givi V47 Monolock top case",
        description:
          "The 47-litre Givi V47 Monolock hard case fits two full-face helmets and personal gear with ease. ABS shell, modern Monolock plate system and built-in interior lighting. Adapters available for all major motorcycle brands.",
      },
    ],
    type: ProductType.ACCESSORY,
  });

  // ─── 🛡️ GEAR ───────────────────────────────────────────────────────────────

  // AGV K6S Helmet
  await upsertProduct({
    brandId: agv.id,
    categoryId: gear.id,
    condition: ProductCondition.NEW,
    color: ProductColor.BLACK,
    imageSlug: "agv-k6s-helmet",
    isFeatured: true,
    price: "4800000.00",
    compareAtPrice: "5600000.00",
    sku: "GEAR-AGV-K6S-MBLK-L",
    stock: 8,
    translations: [
      {
        locale: Locale.UZ,
        slug: "agv-k6s-shlem-matte-black",
        name: "AGV K6S shlemi (Matte Black)",
        description:
          "ECE 22.06 sertifikatlangan AGV K6S integral shlem — 1350 g yengil karbon kompozit korpus, MPLK Pinlock vizor, IVS havalandirish tizimi va 4 ta rang konfiguratsiyasi. Premium termoplastik ichligi va qulay chiqib ketuvchi to'r bilan to'liq jihozlangan. Barcha sharoitlarda mukammal himoya.",
      },
      {
        locale: Locale.RU,
        slug: "agv-k6s-shlem-matte-black",
        name: "Шлем AGV K6S (Matte Black)",
        description:
          "Интегральный шлем AGV K6S с сертификатом ECE 22.06 — лёгкий карбоново-композитный корпус весом 1350 г, визор MPLK Pinlock, система вентиляции IVS и 4 цветовые конфигурации. Полностью оснащён премиальной термопластичной подкладкой и удобным съёмным нетканым полотном.",
      },
      {
        locale: Locale.EN,
        slug: "agv-k6s-helmet-matte-black",
        name: "AGV K6S Helmet (Matte Black)",
        description:
          "ECE 22.06 certified AGV K6S full-face helmet — lightweight 1,350 g carbon composite shell, MPLK Pinlock-ready visor, IVS ventilation system and four shell sizes. Premium thermoplastic liner and removable fabric complete a helmet built for pure performance.",
      },
    ],
    type: ProductType.GEAR,
  });

  // Alpinestars SP-8 V3 Gloves
  await upsertProduct({
    brandId: alpinestars.id,
    categoryId: gear.id,
    condition: ProductCondition.NEW,
    color: ProductColor.RED,
    imageSlug: "alpinestars-sp8-v3-gloves",
    isFeatured: true,
    price: "950000.00",
    compareAtPrice: "1200000.00",
    sku: "GEAR-ALP-SP8V3-BLK-RED-L",
    stock: 20,
    translations: [
      {
        locale: Locale.UZ,
        slug: "alpinestars-sp8-v3-qolqop",
        name: "Alpinestars SP-8 V3 qo'lqop",
        description:
          "Alpinestars SP-8 V3 — mukammal teri sport qo'lqopi, carbon fiber bo'g'im himoyasi, TPR tirsak va oshqozon qismlari bilan. ESR (Evolved Short Cuff) manjetasi maxsus fit ta'minlaydi. Touchscreen sezgir barmoqlar. XS dan 3XL gacha o'lchamlarda mavjud. Qora-qizil dizayn.",
      },
      {
        locale: Locale.RU,
        slug: "alpinestars-sp8-v3-perchatki",
        name: "Перчатки Alpinestars SP-8 V3",
        description:
          "Alpinestars SP-8 V3 — премиальные кожаные спортивные перчатки с защитой суставов из углеродного волокна, TPR-элементами на запястье и ладони. Манжет ESR обеспечивает индивидуальную посадку. Пальцы совместимы с сенсорными экранами. Размеры XS–3XL. Дизайн чёрно-красный.",
      },
      {
        locale: Locale.EN,
        slug: "alpinestars-sp8-v3-gloves",
        name: "Alpinestars SP-8 V3 Gloves",
        description:
          "The Alpinestars SP-8 V3 combines genuine leather construction with carbon fibre knuckle armour and TPR wrist and palm inserts. ESR short cuff delivers a precise, adjustable fit. Touchscreen-compatible fingertips. Available in sizes XS–3XL. Black/Red colourway.",
      },
    ],
    type: ProductType.GEAR,
  });

  // Dainese Laguna Seca 5 Jacket
  await upsertProduct({
    brandId: dainese.id,
    categoryId: gear.id,
    condition: ProductCondition.NEW,
    color: ProductColor.WHITE,
    imageSlug: "dainese-laguna-seca-5",
    isFeatured: true,
    price: "6200000.00",
    compareAtPrice: "7500000.00",
    sku: "GEAR-DAI-LAGUNA5-WHT-BLK-52",
    stock: 6,
    translations: [
      {
        locale: Locale.UZ,
        slug: "dainese-laguna-seca-5-kurtka",
        name: "Dainese Laguna Seca 5 kurtka",
        description:
          "Dainese Laguna Seca 5 — 100% teridan tikilgan trassa darajasidagi moto kurtka. D-air elektronik airbag sistemasi bilan jihozlanishi mumkin. Yelka va tirsak Pro-Shape 2.0 himoya qo'shimchalari, Tutu carbon chest protector va teshilgan ventilatsiya panellari mavjud. CE 2 sertifikati.",
      },
      {
        locale: Locale.RU,
        slug: "dainese-laguna-seca-5-kurtka",
        name: "Куртка Dainese Laguna Seca 5",
        description:
          "Dainese Laguna Seca 5 — мотокуртка трекового уровня из 100% натуральной кожи. Совместима с электронной системой Airbag D-air. Плечевые и локтевые вставки Pro-Shape 2.0, карбоновая нагрудная защита Tutu и перфорированные вентиляционные панели. Сертификат CE 2.",
      },
      {
        locale: Locale.EN,
        slug: "dainese-laguna-seca-5-jacket",
        name: "Dainese Laguna Seca 5 Jacket",
        description:
          "The Dainese Laguna Seca 5 is a track-grade 100% full-grain leather jacket compatible with the D-air electronic airbag system. Pro-Shape 2.0 shoulder and elbow armour, Tutu carbon chest protector and perforated ventilation panels deliver CE Level 2 protection.",
      },
    ],
    type: ProductType.GEAR,
  });

  // LS2 FF800 Storm II Helmet
  await upsertProduct({
    brandId: ls2.id,
    categoryId: gear.id,
    condition: ProductCondition.NEW,
    color: ProductColor.MULTICOLOR,
    imageSlug: "ls2-ff800-storm-ii",
    price: "2150000.00",
    compareAtPrice: "2600000.00",
    sku: "GEAR-LS2-FF800-STORM-BLK-M",
    stock: 15,
    translations: [
      {
        locale: Locale.UZ,
        slug: "ls2-ff800-storm-ii-shlem",
        name: "LS2 FF800 Storm II shlemi",
        description:
          "ECE 22.06 va DOT sertifikatlangan LS2 FF800 Storm II integral shlem — aerofiber kompozit korpus, Pinlock 70 tayyor vizor, 19 ta havalandirish kanali. Ichki himoya: EPS Plus qatlamli energiya absorberi. Chiqariluvchi va yuviladigan ichki to'r. S dan 3XL gacha o'lchamlar.",
      },
      {
        locale: Locale.RU,
        slug: "shlem-ls2-ff800-storm-ii",
        name: "Шлем LS2 FF800 Storm II",
        description:
          "Интегральный шлем LS2 FF800 Storm II с сертификатами ECE 22.06 и DOT — корпус из аэрофайберного композита, визор с подготовкой Pinlock 70, 19 вентиляционных каналов. Внутренняя защита EPS Plus. Съёмная и моющаяся подкладка. Размеры S–3XL.",
      },
      {
        locale: Locale.EN,
        slug: "ls2-ff800-storm-ii-helmet",
        name: "LS2 FF800 Storm II Helmet",
        description:
          "ECE 22.06 and DOT certified LS2 FF800 Storm II full-face helmet — Aerofiber composite shell, Pinlock 70 ready visor and 19 ventilation channels. EPS Plus multi-density liner provides outstanding impact protection. Removable and washable inner lining. Sizes S–3XL.",
      },
    ],
    type: ProductType.GEAR,
  });

  // ─── Site Settings ──────────────────────────────────────────────────────────
  await prisma.siteSetting.upsert({
    where: { key_locale: { key: "store.contact", locale: Locale.UZ } },
    create: {
      description: "Asosiy do'kon aloqa ma'lumotlari",
      isPublic: true,
      key: "store.contact",
      locale: Locale.UZ,
      value: { phone: "+998 78 113 22 33", telegram: "@motomarket_uz" },
    },
    update: { value: { phone: "+998 78 113 22 33", telegram: "@motomarket_uz" } },
  });
}

main()
  .then(() => {
    console.info("✅ Development seed completed successfully.");
  })
  .catch((error: unknown) => {
    console.error("❌ Development seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
