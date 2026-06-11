import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("scooto2024", 10);

  await prisma.user.upsert({
    where: { email: "duda@scooto.com.br" },
    update: {},
    create: {
      name: "Duda",
      email: "duda@scooto.com.br",
      password: hash,
      role: "ADMIN",
    },
  });

  console.log("Seed concluído: duda@scooto.com.br / scooto2024");
}

main().finally(() => prisma.$disconnect());
