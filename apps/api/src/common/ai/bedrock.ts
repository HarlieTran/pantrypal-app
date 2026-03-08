import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const region = process.env.AWS_REGION || "us-east-2";
const modelId = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";

const client = new BedrockRuntimeClient({ region });

export type PreferenceInference = {
  likes: string[];
  dislikes: string[];
  dietSignals: string[];
  confidence: {
    likes: number;
    dislikes: number;
    overall: number;
  };
};

export function stripCodeFence(text: string) {
  return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
}

export async function inferPreferencesFromSelections(input: {
  selected: Array<Record<string, unknown>>;
  rejected: Array<Record<string, unknown>>;
}): Promise<PreferenceInference> {
  const prompt = [
    "You are a food preference inference assistant.",
    "Infer user preferences from selected and rejected recipe metadata.",
    "Return ONLY valid JSON with this schema:",
    '{"likes":["string"],"dislikes":["string"],"dietSignals":["string"],"confidence":{"likes":0.0,"dislikes":0.0,"overall":0.0}}',
    "Rules:",
    "- Keep arrays short (3-8 items).",
    "- Prefer concrete food attributes (protein, cuisine, spice, diet style).",
    "- Confidence values between 0 and 1.",
    `Selected: ${JSON.stringify(input.selected)}`,
    `Rejected: ${JSON.stringify(input.rejected)}`,
  ].join("\n");

  const command = new ConverseCommand({
    modelId,
    messages: [{ role: "user", content: [{ text: prompt }] }],
    inferenceConfig: { temperature: 0.2, maxTokens: 800 },
  });

  const res = await client.send(command);
  const rawText = res.output?.message?.content?.find((x) => "text" in x)?.text ?? "";
  if (!rawText) throw new Error("Bedrock returned empty response");

  const parsed = JSON.parse(stripCodeFence(rawText)) as PreferenceInference;
  return parsed;
}
