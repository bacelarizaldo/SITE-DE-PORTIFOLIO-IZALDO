import { getAllReels } from "@/content/reels";
import ReelsMarquee from "./ReelsMarquee";

export default async function LatestReels() {
  const reels = await getAllReels();
  return <ReelsMarquee reels={reels} />;
}
