import { fail, ok } from "@/lib/api";
import {
  adminCreditValidationMessage,
  assertAdminCreditRateLimit,
  assertSameOriginAdminRequest,
  parseAdminCreditAmount,
  validateAdminCreditEmail,
} from "@/lib/adminSecurity";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function POST(request) {
  try {
    assertSameOriginAdminRequest(request);
    const admin = await requireAdmin();
    assertAdminCreditRateLimit(admin.id);

    let body;
    try {
      body = await request.json();
    } catch {
      return ok({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const email = validateAdminCreditEmail(body.email);
    const amount = parseAdminCreditAmount(body.amount);

    if (!email || !amount) {
      return ok({ error: adminCreditValidationMessage() }, { status: 400 });
    }

    const user = await prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({
        where: { email },
        select: { id: true, email: true },
      });

      if (!targetUser) {
        const error = new Error("User not found.");
        error.status = 404;
        throw error;
      }

      const updatedUser = await tx.user.update({
        where: { id: targetUser.id },
        data: { credits: { increment: amount } },
        select: { id: true, email: true, name: true, credits: true },
      });

      await tx.creditEvent.create({
        data: {
          userId: targetUser.id,
          amount,
          action: "admin_credit",
          note: `Added by admin ${admin.id}`,
          referenceId: `admin-credit:${targetUser.id}:${Date.now()}`,
          metadata: {
            adminId: admin.id,
            targetEmail: targetUser.email,
            source: "admin_panel",
          },
        },
      });

      return updatedUser;
    });

    return ok({ user });
  } catch (error) {
    return fail(error);
  }
}
