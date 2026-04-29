import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifySession } from "@/lib/auth";

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

  const users = await prisma.user.findMany({
    where: {
      companyId: session.companyId,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      category: true,
      companyId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (session.category !== "MASTER" && session.category !== "GESTOR") {
    return NextResponse.json(
      { error: "Você não tem permissão para criar acessos." },
      { status: 403 }
    );
  }

  const body = await request.json();

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const cpf = String(body.cpf || "").trim();
  const category = String(body.category || "").trim();
  const password = String(body.password || "").trim();

  if (!name || !email || !cpf || !category || !password) {
    return NextResponse.json(
      { error: "Preencha todos os campos." },
      { status: 400 }
    );
  }

  if (category === "MASTER" && session.category !== "MASTER") {
    return NextResponse.json(
      { error: "Somente MASTER pode criar outro MASTER." },
      { status: 403 }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      companyId: session.companyId,
      name,
      email,
      cpf,
      category: category as any,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      category: true,
      companyId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user });
}