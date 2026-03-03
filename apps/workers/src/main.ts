import cron from "node-cron";
import { runDailySpecialPrewarm } from "./features/daily-special/index.js";

// 00:05 UTC daily
cron.schedule("5 0 * * *", async () => {
  try {
    await runDailySpecialPrewarm();
  } catch (e) {
    console.error("daily prewarm error", e);
  }
});

console.log("worker started");

