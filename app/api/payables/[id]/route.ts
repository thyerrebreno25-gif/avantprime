import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  console.log("DELETE PAYABLE CHAMADO");

  const cookieStore = await cookies();
  const token = cookieStore.get("finconciliador_session")?.value;

  if (!token) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const session = verifySession(token);

  if (!session) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const { id } = await context.params;
  const payableId = Number(id);

  console.log("ID RECEBIDO:", payableId);

  if (!payableId) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const existing = await prisma.payable.findFirst({
    where: {
      id: payableId,
      companyId: session.companyId,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Despesa não encontrada." },
      { status: 404 }
    );
  }

  await prisma.payable.delete({
    where: {
      id: payableId,
    },
  });

  console.log("DESPESA EXCLUÍDA:", payableId);

  return NextResponse.json({ ok: true });
}
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("finconciliador_session")?.value;

  if (!token) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const session = verifySession(token);

  if (!session) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const { id } = await context.params;
  const payableId = Number(id);

  if (!payableId) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const body = await request.json();

  const updated = await prisma.payable.update({
    where: { id: payableId },
    data: {
      description: body.description,
      amount: body.amount,
      paymentType: body.paymentType,
      dueDate: new Date(body.dueDate),
      launchDate: new Date(body.launchDate),
      category: body.category,
    },
  });

  return NextResponse.json({ payable: updated });
}
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("finconciliador_session")?.value;

  if (!token) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const session = verifySession(token);

  if (!session) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const { id } = await context.params;
  const payableId = Number(id);

  const body = await request.json();

  const updated = await prisma.payable.update({
    where: { id: payableId },
    data: {
      status: body.status,
    },
  });

  return NextResponse.json({ payable: updated });
}