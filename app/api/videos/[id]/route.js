import { fail, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function DELETE(_request, { params }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const video = await prisma.video.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!video) return ok({ success: false, error: "Video not found." }, { status: 404 });

    await prisma.video.delete({ where: { id: video.id } });
    return ok({ success: true, deletedVideoId: video.id });
  } catch (error) {
    return fail(error);
  }
}
