import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("finconciliador_session")?.value;
  return token ? verifySession(token) : null;
}

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const payables = await prisma.payable.findMany({
    where: { companyId: session.companyId },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json({ payables });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json();

  const description = String(body.description || "").trim();
  const amount = Number(body.amount || 0);
  const paymentType = String(body.paymentType || "").trim();
  const dueDate = String(body.dueDate || "");
  const launchDate = String(body.launchDate || "");
  const userName = String(body.userName || session.name).trim();
  const category = String(body.category || "").trim();

  if (!description || !amount || !paymentType || !dueDate || !launchDate || !category) {
    return NextResponse.json(
      { error: "Preencha todos os campos obrigatórios." },
      { status: 400 }
    );
  }

  const payable = await prisma.payable.create({
    data: {
      companyId: session.companyId,
      description,
      amount,
      paymentType,
      dueDate: new Date(dueDate),
      launchDate: new Date(launchDate),
      userName,
      category,
      status: "A_VENCER",
    },
  });

  return NextResponse.json({ payable });
}