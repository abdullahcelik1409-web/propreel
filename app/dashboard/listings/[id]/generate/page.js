import VideoGeneratorForm from "@/components/VideoGeneratorForm";
import { getAudioTrackOptions } from "@/lib/audioTrackService";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function GenerateVideoPage({ params }) {
  const user = await getSessionUser();
  const { id } = await params;
  const listing = await prisma.listing.findFirst({ where: { id, userId: user.id } });
  if (!listing) notFound();
  const audioTracks = await getAudioTrackOptions();
  return <VideoGeneratorForm listing={listing} userCredits={user.credits} audioTracks={audioTracks} />;
}
