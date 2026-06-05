import bcrypt from "bcryptjs";
import { fail, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getInitialUserCredits } from "@/lib/videoConfig";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body.email?.toLowerCase().trim();
    const password = body.password;
    const name = body.name?.trim() || null;

    if (!email || !password || password.length < 8) {
      return ok({ error: "Email and an 8+ character password are required." }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return ok({ error: "An account with this email already exists." }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);
    const initialCredits = getInitialUserCredits();
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        credits: initialCredits,
        role: process.env.ADMIN_EMAIL === email ? "admin" : "user",
      },
      select: { id: true, email: true, name: true, credits: true, role: true },
    });

    await prisma.creditEvent.create({
      data: {
        userId: user.id,
        amount: initialCredits,
        action: "signup_bonus",
        note: "Free starter credits",
        metadata: {
          environment: process.env.NODE_ENV || "development",
        },
      },
    });

    return ok({ user }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
