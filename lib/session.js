import { cookies, headers } from "next/headers";
import { getToken } from "next-auth/jwt";
import { prisma } from "./prisma";

async function getRequestLike() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  return {
    headers: {
      cookie: cookieHeader,
      host: headerStore.get("host") || "",
      "x-forwarded-host": headerStore.get("x-forwarded-host") || "",
      "x-forwarded-proto": headerStore.get("x-forwarded-proto") || "https",
    },
  };
}

export async function getSessionUser() {
  const token = await getToken({
    req: await getRequestLike(),
    secret: process.env.NEXTAUTH_SECRET,
  }).catch((error) => {
    console.error("[session] failed to read JWT token", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  });

  const userId = typeof token?.id === "string" ? token.id : null;
  if (!userId) return null;

  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        credits: true,
        role: true,
      },
    });
  } catch (error) {
    console.error("[session] failed to load session user", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    const error = new Error("Authentication required");
    error.status = 401;
    throw error;
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    const error = new Error("Admin access required");
    error.status = 403;
    throw error;
  }
  return user;
}
