import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const CleanNoteInput = z.object({
  text: z.string().trim().min(1).max(4000),
  context: z.string().max(400).optional(),
});

const SYSTEM = [
  "You tidy up field notes typed one-handed by a documentary crew during a live event.",
  "Fix spelling, punctuation and dictation errors. Expand obvious shorthand.",
  "Keep every fact, name, room, time and number exactly as given — never invent details.",
  "Return one short, clear note (1-3 lines, plain text, no markdown, no preamble).",
].join(" ");

export const cleanupNote = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CleanNoteInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured on this device.");

    const gateway = createLovableAiGatewayProvider(key);
    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3.6-flash"),
        system: SYSTEM,
        prompt: data.context
          ? `Schedule block: ${data.context}\n\nRaw note:\n${data.text}`
          : `Raw note:\n${data.text}`,
      });
      const cleaned = text.trim();
      return { cleaned: cleaned || data.text };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("429")) throw new Error("AI is rate limited — try again shortly.");
      if (message.includes("402")) throw new Error("AI credits exhausted — add credits to continue.");
      throw new Error("Could not clean up that note.");
    }
  });
