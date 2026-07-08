#!/usr/bin/env node
/**
 * Fetch YouTube video metadata (title, channel, description, thumbnail) without any API key.
 * Used by the `/import-recipe` Claude Code skill so recipe extraction runs under the user's
 * Claude subscription instead of API credits.
 *
 * Usage: node scripts/fetch-youtube.mjs <youtube-url-or-video-id>
 * Prints JSON to stdout.
 */

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/fetch-youtube.mjs <youtube-url-or-video-id>");
  process.exit(1);
}

function parseVideoId(s) {
  s = s.trim();
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

const videoId = parseVideoId(input);
if (!videoId) {
  console.error("Could not parse a YouTube video id from: " + input);
  process.exit(1);
}

const url = `https://www.youtube.com/watch?v=${videoId}`;
const out = {
  videoId,
  url,
  title: undefined,
  author: undefined,
  description: undefined,
  thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
};

// 1. oEmbed — reliable title + channel.
try {
  const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
  if (res.ok) {
    const j = await res.json();
    out.title = j.title;
    out.author = j.author_name;
  }
} catch {
  /* ignore */
}

// 2. Watch page — the description lives in ytInitialPlayerResponse.videoDetails.shortDescription.
try {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  const html = await res.text();
  const m = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
  if (m) out.description = JSON.parse(`"${m[1]}"`);
  if (!out.title) {
    const t = html.match(/<meta name="title" content="([^"]*)"/);
    if (t) out.title = t[1];
  }
} catch {
  /* ignore */
}

console.log(JSON.stringify(out, null, 2));
