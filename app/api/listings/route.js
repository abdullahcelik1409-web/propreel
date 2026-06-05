import { fail, ok, toInt } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const MAX_LISTING_PHOTOS = 4;

function listingData(body) {
  return {
    title: body.title?.trim(),
    price: body.price?.trim() || null,
    location: body.location?.trim() || null,
    bedrooms: toInt(body.bedrooms),
    bathrooms: toInt(body.bathrooms),
    sqft: toInt(body.sqft),
    propertyType: body.propertyType?.trim() || null,
    description: body.description?.trim() || null,
    features: Array.isArray(body.features) ? body.features.map(String) : [],
    photos: Array.isArray(body.photos) ? body.photos.map(String).slice(0, MAX_LISTING_PHOTOS) : [],
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    const listings = await prisma.listing.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { videos: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    return ok({ listings });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireUser();
    const data = listingData(await request.json());
    if (!data.title) return ok({ error: "Title is required." }, { status: 400 });
    if (data.photos.length < 1) {
      return ok({ error: `Select at least 1 and up to ${MAX_LISTING_PHOTOS} photos.` }, { status: 400 });
    }

    const listing = await prisma.listing.create({
      data: { ...data, userId: user.id },
    });
    return ok({ listing }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
