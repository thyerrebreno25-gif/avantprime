import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("finconciliador_session")?.value;
  return token ? verifySession(token) : null;
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (session.category !== "MASTER" && session.category !== "GESTOR") {
    return NextResponse.json(
      { error: "Você não tem permissão para excluir acessos." },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const userId = Number(id);

  if (userId === session.id) {
    return NextResponse.json(
      { error: "Você não pode excluir seu próprio acesso." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.companyId !== session.companyId) {
    return NextResponse.json(
      { error: "Usuário não encontrado." },
      { status: 404 }
    );
  }

  if (user.category === "MASTER" && session.category !== "MASTER") {
    return NextResponse.json(
      { error: "Somente MASTER pode excluir outro MASTER." },
      { status: 403 }
    );
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return NextResponse.json({ ok: true });
}