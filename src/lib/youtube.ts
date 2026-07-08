/**
 * Client-side YouTube fetching. Two tiers, both keyless-friendly:
 *
 *  1. oEmbed (no key, CORS-enabled) → always gives us title, channel and a thumbnail.
 *  2. YouTube Data API v3 (optional key) → the video description + top comments, which is where
 *     the ingredients and steps usually live.
 *
 * When no Data API key is set, we still return the title/thumbnail and the caller lets the user
 * paste the description manually. Everything degrades gracefully.
 */

export interface YouTubeContent {
  videoId: string;
  url: string;
  title?: string;
  author?: string;
  thumbnail?: string;
  description?: string;
  comments: string[];
  /** True when the Data API key was used and returned the description. */
  usedDataApi: boolean;
  /** Error message from the Data API (e.g. 403 API_KEY_SERVICE_BLOCKED), so the UI can explain. */
  apiError?: string;
}

/** Pull the 11-char video id out of any common YouTube URL shape. Returns null if not a YT link. */
export function parseVideoId(input: string): string | null {
  const s = input.trim();
  // Bare id
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const patterns = [
    /(?:youtube\.com\/watch\?[^ ]*[?&]?v=)([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return null;
}

export function thumbnailFor(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

async function fetchOEmbed(url: string): Promise<{ title?: string; author?: string }> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!res.ok) return {};
    const j = (await res.json()) as { title?: string; author_name?: string };
    return { title: j.title, author: j.author_name };
  } catch {
    return {};
  }
}

interface DataApiResult {
  description?: string;
  title?: string;
  author?: string;
  comments: string[];
  error?: string;
}

async function fetchDataApi(videoId: string, key: string): Promise<DataApiResult> {
  const out: DataApiResult = { comments: [] };
  try {
    const vRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${key}`,
    );
    const vJson = (await vRes.json()) as {
      items?: { snippet?: { description?: string; title?: string; channelTitle?: string } }[];
      error?: { message?: string; errors?: { reason?: string }[] };
    };
    if (vJson.error) {
      const reason = vJson.error.errors?.[0]?.reason;
      out.error = [reason, vJson.error.message].filter(Boolean).join(" — ");
    }
    const snip = vJson.items?.[0]?.snippet;
    out.description = snip?.description;
    out.title = snip?.title;
    out.author = snip?.channelTitle;
  } catch {
    /* ignore */
  }
  try {
    const cRes = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&order=relevance&maxResults=25&key=${key}`,
    );
    const cJson = (await cRes.json()) as {
      items?: { snippet?: { topLevelComment?: { snippet?: { textOriginal?: string } } } }[];
    };
    out.comments = (cJson.items ?? [])
      .map((i) => i.snippet?.topLevelComment?.snippet?.textOriginal ?? "")
      .filter(Boolean);
  } catch {
    /* ignore */
  }
  return out;
}

export async function fetchYouTube(url: string, dataApiKey?: string): Promise<YouTubeContent> {
  const videoId = parseVideoId(url);
  if (!videoId) throw new Error("That doesn't look like a YouTube link.");

  const oembed = await fetchOEmbed(url);
  const base: YouTubeContent = {
    videoId,
    url,
    title: oembed.title,
    author: oembed.author,
    thumbnail: thumbnailFor(videoId),
    comments: [],
    usedDataApi: false,
  };

  if (dataApiKey) {
    const api = await fetchDataApi(videoId, dataApiKey);
    base.title = base.title ?? api.title;
    base.author = base.author ?? api.author;
    base.description = api.description;
    base.comments = api.comments;
    base.usedDataApi = Boolean(api.description || api.comments.length);
    base.apiError = api.error;
  }

  return base;
}
