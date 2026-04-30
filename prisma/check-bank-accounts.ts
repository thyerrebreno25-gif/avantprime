import { prisma } from "../lib/prisma";

async function main() {
  const accounts = await prisma.bankAccount.findMany({
    include: { company: true },
  });

  console.log(accounts);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());