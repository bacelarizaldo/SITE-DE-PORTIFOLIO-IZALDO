import { getAllReels } from "@/content/reels";
import { getSiteSettings } from "@/content/settings";

export const revalidate = 60;

export async function GET() {
  const [settings, reels] = await Promise.all([getSiteSettings(), getAllReels()]);
  const recurringReels = reels.filter((reel) => reel.recurringContent && reel.client);
  const reelsByClient = new Map<string, typeof recurringReels>();

  for (const reel of recurringReels) {
    const client = reel.client;
    if (!client) continue;
    const clientReels = reelsByClient.get(client) ?? [];
    clientReels.push(reel);
    reelsByClient.set(client, clientReels);
  }

  return Response.json({
    settings: {
      recurringContentAboutPhoto: settings.recurringContentAboutPhoto,
      recurringContentVideo: settings.recurringContentVideo,
    },
    clientFeeds: Array.from(reelsByClient, ([client, clientReels]) => ({
      client,
      reels: clientReels.map((reel) => ({
        caption: reel.caption,
        image: reel.thumbnail,
        video: reel.video,
        link: reel.link,
      })),
    })),
  });
}