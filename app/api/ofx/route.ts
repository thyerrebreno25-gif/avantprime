import { NextResponse } from "next/server";
import { parse } from "ofx-parser";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

function getTag(block: string, tag: string) {
  const regex = new RegExp(`<${tag}>([^<\\r\\n]+)`, "i");
  const match = block.match(regex);
  return match?.[1]?.trim() || "";
}

function parseOfxDate(value: string) {
  if (!value) return new Date();

  const clean = value.slice(0, 8);
  const year = clean.slice(0, 4);
  const month = clean.slice(4, 6);
  const day = clean.slice(6, 8);

  return new Date(`${year}-${month}-${day}T00:00:00`);
}

function parseOfxByText(text: string) {
  const blocks =
    text.match(
      /<STMTTRN>[\s\S]*?(?=<STMTTRN>|<\/BANKTRANLIST>|<\/CCSTMTRS>|<\/STMTRS>|$)/gi
    ) || [];

  return blocks.map((block) => ({
    date: getTag(block, "DTPOSTED"),
    amount: getTag(block, "TRNAMT"),
    type: getTag(block, "TRNTYPE"),
    description: getTag(block, "MEMO") || getTag(block, "NAME"),
    fitId: getTag(block, "FITID"),
    documentNumber: getTag(block, "CHECKNUM") || getTag(block, "REFNUM"),
  }));
}

function findStmtTrn(obj: any): any[] {
  if (!obj || typeof obj !== "object") return [];

  if (obj.STMTTRN) {
    return Array.isArray(obj.STMTTRN) ? obj.STMTTRN : [obj.STMTTRN];
  }

  for (const key of Object.keys(obj)) {
    const found = findStmtTrn(obj[key]);
    if (found.length > 0) return found;
  }

  return [];
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("finconciliador_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const session = verifySession(token);

    if (!session) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bankAccountId = Number(formData.get("bankAccountId"));

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não enviado." },
        { status: 400 }
      );
    }

    if (!bankAccountId) {
      return NextResponse.json(
        { error: "Conta bancária não informada." },
        { status: 400 }
      );
    }

    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        companyId: session.companyId,
      },
    });

    if (!bankAccount) {
      return NextResponse.json(
        { error: "Conta bancária não encontrada." },
        { status: 404 }
      );
    }

    const text = await file.text();

    let parsed: any[] = [];

    try {
      const data = parse(text);
      const transactions = findStmtTrn(data);

      parsed = transactions.map((t: any) => ({
        date: t.DTPOSTED || "",
        amount: t.TRNAMT || "",
        type: t.TRNTYPE || "",
        description: t.MEMO || t.NAME || t.PAYEEID || "",
        fitId: t.FITID || "",
        documentNumber: t.CHECKNUM || t.REFNUM || "",
      }));
    } catch {
      parsed = [];
    }

    if (parsed.length === 0) {
      parsed = parseOfxByText(text);
    }

    let savedCount = 0;
    let ignoredCount = 0;

    for (const item of parsed) {
      const amount = Number(item.amount || 0);

      if (!item.fitId || !amount) {
        ignoredCount++;
        continue;
      }

      const existing = await prisma.bankTransaction.findUnique({
        where: {
          fitId: item.fitId,
        },
      });

      if (existing) {
        ignoredCount++;
        continue;
      }

      await prisma.bankTransaction.create({
        data: {
          companyId: session.companyId,
          bankAccountId,
          date: parseOfxDate(item.date),
          description: item.description || "Lançamento OFX",
          amount: Math.abs(amount),
          type: amount >= 0 ? "CREDIT" : "DEBIT",
          documentNumber: item.documentNumber || null,
          fitId: item.fitId,
          sourceFile: file.name,
          reconciled: false,
        },
      });

      savedCount++;
    }

    return NextResponse.json({
      imported: true,
      transactionsFound: parsed.length,
      savedCount,
      ignoredCount,
    });
  } catch (error) {
    console.error("Erro ao processar OFX:", error);

    return NextResponse.json(
      { error: "Erro ao processar OFX." },
      { status: 500 }
    );
  }
}