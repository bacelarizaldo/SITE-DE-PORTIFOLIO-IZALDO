import { getLatestReels } from "@/content/reels";
import ReelsMarquee from "./ReelsMarquee";

export default async function LatestReels() {
  const reels = await getLatestReels();
  return <ReelsMarquee reels={reels} />;
}
