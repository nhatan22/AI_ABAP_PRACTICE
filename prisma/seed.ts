import { PrismaClient } from "@prisma/client";
import { abapA } from "./data/abap-a";
import { abapB } from "./data/abap-b";
import { ui5 } from "./data/ui5";

const db = new PrismaClient();

async function main() {
  const all = [...abapA, ...abapB, ...ui5];
  for (const ex of all) {
    const data = { ...ex, source: "seed" };
    await db.exercise.upsert({
      where: { slug: ex.slug },
      create: data,
      update: data,
    });
    console.log("seeded", ex.slug);
  }
  console.log(`Done: ${all.length} exercises`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
