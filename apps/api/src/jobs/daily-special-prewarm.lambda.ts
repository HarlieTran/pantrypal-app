import "dotenv/config";
import { getOrCreateDailySpecial } from "../modules/home/index.js";

type DailySpecialPrewarmEvent = {
  locale?: string;
};

export async function handler(event?: DailySpecialPrewarmEvent) {
  const locale = event?.locale || "global";
  const startedAt = Date.now();

  try {
    const special = await getOrCreateDailySpecial(locale);
    return {
      ok: true,
      locale,
      id: special?.id ?? null,
      specialDate: special?.specialDate ?? null,
      elapsedMs: Date.now() - startedAt,
    };
  } catch (error) {
    console.error("daily special prewarm failed", { locale, error });
    throw error;
  }
}
