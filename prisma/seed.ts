import "dotenv/config";
import { PrismaClient, UserCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });
async function main() {
  const company = await prisma.company.upsert({
    where: { document: "12.345.678/0001-99" },
    update: {},
    create: {
      name: "Breno Finance Group",
      tradeName: "BFG",
      document: "12.345.678/0001-99",
    },
  });

  const passwordHash = await bcrypt.hash("Master@123", 10);

  await prisma.user.upsert({
    where: { email: "master@finconciliador.com" },
    update: {},
    create: {
      companyId: company.id,
      name: "Administrador Master",
      email: "master@finconciliador.com",
      cpf: "00000000000",
      category: UserCategory.MASTER,
      passwordHash,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });