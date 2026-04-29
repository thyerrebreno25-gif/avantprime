import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    const ok = await comparePassword(password, user.passwordHash);

    if (!ok) {
      return NextResponse.json(
        { error: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    const token = signSession({
      id: user.id,
      name: user.name,
      email: user.email,
      category: user.category,
      companyId: user.companyId,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        category: user.category,
        companyId: user.companyId,
      },
    });

    response.cookies.set("finconciliador_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao autenticar." },
      { status: 500 }
    );
  }
}