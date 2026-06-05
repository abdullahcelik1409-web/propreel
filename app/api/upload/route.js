import { fal } from "@/lib/fal";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/session";

export async function POST(request) {
  try {
    await requireUser();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return ok({ error: "A file field is required." }, { status: 400 });
    }

    const url = await fal.storage.upload(file);
    return ok({ url });
  } catch (error) {
    return fail(error);
  }
}
