import { fail, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const email = body.email?.toLowerCase().trim();
    const amount = Number.parseInt(body.amount, 10);

    if (!email || !Number.isFinite(amount) || amount <= 0) {
      return ok({ error: "Email and a positive credit amount are required." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { email },
      data: { credits: { increment: amount } },
      select: { id: true, email: true, name: true, credits: true },
    });

    await prisma.creditEvent.create({
      data: {
        userId: user.id,
        amount,
        action: "admin_credit",
        note: `Added by ${admin.email}`,
      },
    });

    return ok({ user });
  } catch (error) {
    return fail(error);
  }
}
