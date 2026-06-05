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

async function getOwnedListing(id, userId) {
  return prisma.listing.findFirst({
    where: { id, userId },
    include: { videos: { orderBy: { createdAt: "desc" } } },
  });
}

export async function GET(_request, { params }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const listing = await getOwnedListing(id, user.id);
    if (!listing) return ok({ error: "Listing not found." }, { status: 404 });
    return ok({ listing });
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const listing = await getOwnedListing(id, user.id);
    if (!listing) return ok({ error: "Listing not found." }, { status: 404 });

    const data = listingData(await request.json());
    if (!data.title) return ok({ error: "Title is required." }, { status: 400 });
    if (data.photos.length < 1) {
      return ok({ error: `Select at least 1 and up to ${MAX_LISTING_PHOTOS} photos.` }, { status: 400 });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data,
    });
    return ok({ listing: updated });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const listing = await getOwnedListing(id, user.id);
    if (!listing) return ok({ error: "Listing not found." }, { status: 404 });

    await prisma.listing.delete({ where: { id } });
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
