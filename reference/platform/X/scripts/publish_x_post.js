#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { TwitterApi } = require("twitter-api-v2");

function loadEnv() {
  const envCandidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "../../../../.env"),
  ];
  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return;
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (!args[0] || args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage:
  node publish_x_post.js <item_path> --draft <draft_id_or_name> [--dry-run]
`);
    process.exit(args[0] ? 0 : 1);
  }

  let draft = "";
  for (let i = 1; i < args.length; i += 1) {
    if (args[i] === "--draft" && args[i + 1]) {
      draft = args[i + 1];
      i += 1;
    }
  }

  if (!draft) {
    throw new Error("--draft is required, e.g. --draft 0001");
  }

  return {
    itemPath: path.resolve(args[0]),
    draft,
    dryRun: args.includes("--dry-run"),
  };
}

function loadPublishPayload(itemPath, draftName) {
  const draftDir = path.join(itemPath, "X", "draft", draftName);
  const payloadPath = path.join(draftDir, "publish.json");
  if (!fs.existsSync(payloadPath)) {
    throw new Error(`publish.json not found: ${payloadPath}`);
  }
  return {
    draftDir,
    payloadPath,
    payload: JSON.parse(fs.readFileSync(payloadPath, "utf-8")),
  };
}

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`${name} is required`);
  }
  return v;
}

function buildClient() {
  return new TwitterApi({
    appKey: requiredEnv("X_API_KEY"),
    appSecret: requiredEnv("X_API_SECRET"),
    accessToken: requiredEnv("X_ACCESS_TOKEN"),
    accessSecret: requiredEnv("X_ACCESS_TOKEN_SECRET"),
  }).readWrite;
}

async function uploadImages(client, baseDir, images) {
  if ((images || []).length > 4) {
    throw new Error("X supports at most 4 images per tweet");
  }
  const mediaIds = [];
  for (const relPath of images || []) {
    const absPath = path.join(baseDir, relPath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`Image not found: ${absPath}`);
    }
    const mediaId = await client.v1.uploadMedia(absPath, {
      mimeType: "image/png",
    });
    mediaIds.push(mediaId);
  }
  return mediaIds;
}

function trimTweet(text) {
  const t = String(text || "").trim();
  if (t.length <= 280) return t;
  return `${t.slice(0, 277)}...`;
}

async function publish(client, payload, baseDir, dryRun) {
  const text = trimTweet(payload.tweet);
  if (!text) {
    throw new Error("payload.tweet is empty");
  }

  if (dryRun) {
    console.log("[DRY RUN] Tweet:");
    console.log(text);
    const images = payload.images || [];
    if (images.length > 4) {
      throw new Error("X supports at most 4 images per tweet");
    }
    for (const relPath of images) {
      const absPath = path.join(baseDir, relPath);
      if (!fs.existsSync(absPath)) {
        throw new Error(`Image not found: ${absPath}`);
      }
    }
    console.log(`[DRY RUN] images=${images.length}`);
    return;
  }

  const mediaIds = await uploadImages(client, baseDir, payload.images || []);

  const firstTweet = await client.v2.tweet(
    mediaIds.length > 0
      ? { text, media: { media_ids: mediaIds } }
      : { text }
  );

  console.log("✅ X post published");
  console.log(`tweet_id: ${firstTweet.data.id}`);
  console.log(`url: https://x.com/i/web/status/${firstTweet.data.id}`);
}

async function main() {
  loadEnv();
  const opts = parseArgs();
  const { payload, draftDir } = loadPublishPayload(opts.itemPath, opts.draft);
  const client = opts.dryRun ? null : buildClient();
  await publish(client, payload, draftDir, opts.dryRun);
}

main().catch((err) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
