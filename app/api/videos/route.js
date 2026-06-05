import { fail, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireUser();
    const videos = await prisma.video.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { listing: true },
    });
    return ok({ videos });
  } catch (error) {
    return fail(error);
  }
}
