if (process.env.NODE_ENV !== "production") {
  const { config } = await import("dotenv");
  config();
}

import { getOrCreateDailySpecial } from "../modules/home/index.js";

export async function handler() {
  console.log("[prewarm] Starting daily special generation");
  
  try {
    const special = await getOrCreateDailySpecial("global");
    
    if (!special) {
      throw new Error("getOrCreateDailySpecial returned null");
    }
    
    console.log(`[prewarm] Success — dish="${special.dishName}" id="${special.id}"`);
    
    return {
      statusCode: 200,
      body: { success: true, dishName: special.dishName }
    };
  } catch (error) {
    console.error("[prewarm] FAILED:", error);
    throw error;
  }
}