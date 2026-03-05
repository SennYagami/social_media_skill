#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { GoogleGenAI, Modality } = require("@google/genai");

const STYLE_DIR = path.join(__dirname, "style-prompts");
const SUPPORTED_IMAGE_MODELS = ["gemini-2.5-flash-image"];
const DEFAULT_IMAGE_MODEL = SUPPORTED_IMAGE_MODELS[0];

function loadEnv() {
  const envCandidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "../../.env"),
  ];
  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return;
    }
  }
}

function listStyles() {
  if (!fs.existsSync(STYLE_DIR)) return [];
  return fs
    .readdirSync(STYLE_DIR)
    .filter((f) => f.endsWith(".txt"))
    .map((f) => path.basename(f, ".txt"))
    .sort();
}

function listModels() {
  return [...SUPPORTED_IMAGE_MODELS];
}

function readStylePrompt(styleKey) {
  const safe = String(styleKey || "realistic").toLowerCase();
  const filePath = path.join(STYLE_DIR, `${safe}.txt`);
  if (fs.existsSync(filePath)) {
    return {
      style: safe,
      prompt: fs.readFileSync(filePath, "utf-8").trim(),
    };
  }

  const fallback = path.join(STYLE_DIR, "realistic.txt");
  if (!fs.existsSync(fallback)) {
    throw new Error("No style prompt found. Please add style-prompts/*.txt");
  }

  return {
    style: "realistic",
    prompt: fs.readFileSync(fallback, "utf-8").trim(),
  };
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function buildImagePrompt({ basePrompt, style, aspectRatio = "16:9" }) {
  const styleInfo = readStylePrompt(style);
  return [
    `Create one image in ${styleInfo.style} style.`,
    styleInfo.prompt,
    `Aspect ratio target: ${aspectRatio}.`,
    "No watermark, no text overlay, no logo.",
    "Content brief:",
    basePrompt,
  ].join("\n");
}

async function generateImageWithGemini(options) {
  const {
    apiKey,
    basePrompt,
    style = "realistic",
    outputPath,
    model = DEFAULT_IMAGE_MODEL,
    aspectRatio = "16:9",
  } = options;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required");
  }
  if (!basePrompt || !outputPath) {
    throw new Error("basePrompt and outputPath are required");
  }
  if (!SUPPORTED_IMAGE_MODELS.includes(model)) {
    throw new Error(
      `Unsupported image model: ${model}. Use one of: ${SUPPORTED_IMAGE_MODELS.join(", ")}`
    );
  }

  ensureDir(outputPath);

  const client = new GoogleGenAI({ apiKey });
  const prompt = buildImagePrompt({ basePrompt, style, aspectRatio });

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const parts = response?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData && p.inlineData.data);

  if (!imagePart) {
    const textPart = parts.find((p) => p.text);
    throw new Error(`Gemini did not return image data. ${textPart?.text || ""}`.trim());
  }

  const buffer = Buffer.from(imagePart.inlineData.data, "base64");
  fs.writeFileSync(outputPath, buffer);

  return {
    outputPath,
    mimeType: imagePart.inlineData.mimeType || "image/png",
    prompt,
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes("--list-styles")) {
    console.log(listStyles().join("\n"));
    process.exit(0);
  }
  if (args.includes("--list-models")) {
    console.log(listModels().join("\n"));
    process.exit(0);
  }

  if (!args[0] || args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage:
  node reference/utils/gemini_image.js --prompt "..." --style shinkai --output /abs/path/to/image.png [options]

Options:
  --prompt <text>         image brief (required)
  --style <style>         style key from style-prompts/*.txt (default: realistic)
  --output <path>         output png path (required)
  --model <model>         currently only supports: ${DEFAULT_IMAGE_MODEL}
  --aspect <ratio>        default: 16:9
  --list-styles           print available styles
  --list-models           print supported image generation models
`);
    process.exit(args[0] ? 0 : 1);
  }

  const opt = {
    style: "realistic",
    model: DEFAULT_IMAGE_MODEL,
    aspect: "16:9",
    prompt: "",
    output: "",
  };

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--prompt" && args[i + 1]) {
      opt.prompt = args[i + 1];
      i += 1;
    } else if (args[i] === "--style" && args[i + 1]) {
      opt.style = args[i + 1];
      i += 1;
    } else if (args[i] === "--output" && args[i + 1]) {
      opt.output = path.resolve(args[i + 1]);
      i += 1;
    } else if (args[i] === "--model" && args[i + 1]) {
      opt.model = args[i + 1];
      i += 1;
    } else if (args[i] === "--aspect" && args[i + 1]) {
      opt.aspect = args[i + 1];
      i += 1;
    }
  }

  if (!opt.prompt || !opt.output) {
    throw new Error("--prompt and --output are required");
  }

  return opt;
}

async function main() {
  loadEnv();
  const opt = parseArgs();
  const apiKey = process.env.GEMINI_API_KEY;

  const result = await generateImageWithGemini({
    apiKey,
    basePrompt: opt.prompt,
    style: opt.style,
    outputPath: opt.output,
    model: opt.model,
    aspectRatio: opt.aspect,
  });

  console.log(`Created image: ${result.outputPath}`);
  console.log(`Style: ${opt.style}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  generateImageWithGemini,
  buildImagePrompt,
  listStyles,
  listModels,
  readStylePrompt,
  SUPPORTED_IMAGE_MODELS,
  DEFAULT_IMAGE_MODEL,
};
