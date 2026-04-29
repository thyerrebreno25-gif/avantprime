-- CreateEnum
CREATE TYPE "FinanceStatus" AS ENUM ('PENDENTE', 'A_VENCER', 'VENCE_HOJE', 'PAGO', 'RECEBIDO');

-- CreateTable
CREATE TABLE "Payable" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paymentType" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "launchDate" TIMESTAMP(3) NOT NULL,
    "userName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "FinanceStatus" NOT NULL DEFAULT 'A_VENCER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payable_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Payable" ADD CONSTRAINT "Payable_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
