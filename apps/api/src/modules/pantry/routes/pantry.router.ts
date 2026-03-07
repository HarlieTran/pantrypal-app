import { z } from "zod";
import { withAuth } from "../../auth/index.js";
import {
  addPantryItem,
  addPantryItemsBulk,
  deletePantryItem,
  getPantryImageUploadUrl,
  getPantryItems,
  getPantryMeta,
  parseImageForIngredients,
  updatePantryItem,
} from "../index.js";
import { created, handleError, ok, parseBody, type JsonResponse } from "../../../common/routing/helpers.js";

const addPantryItemSchema = z.object({
  rawName: z.string().min(1).max(200),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(500).optional(),
});

const updatePantryItemSchema = z.object({
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).max(50).optional(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(500).optional(),
});

const bulkAddPantrySchema = z.object({
  items: z.array(addPantryItemSchema).min(1).max(50),
});

const uploadUrlSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

const parseImageSchema = z.object({
  imageKey: z.string().min(1),
});

export async function handlePantryRoute(
  method: string,
  path: string,
  authHeader?: string,
  rawBody?: string,
): Promise<JsonResponse | null> {
  if (!path.startsWith("/pantry")) return null;

  if (method === "GET" && path === "/pantry") {
    return withAuth(authHeader, async (claims) => {
      const [items, meta] = await Promise.all([
        getPantryItems(claims.sub),
        getPantryMeta(claims.sub),
      ]);
      return ok({ items, meta });
    });
  }

  if (method === "POST" && path === "/pantry/items") {
    return withAuth(authHeader, async (claims) => {
      try {
        const parsed = parseBody(rawBody, addPantryItemSchema);
        const item = await addPantryItem(claims.sub, parsed);
        return created({ item });
      } catch (error) {
        return handleError(error, "Failed to add pantry item");
      }
    });
  }

  if (method === "POST" && path === "/pantry/items/bulk") {
    return withAuth(authHeader, async (claims) => {
      try {
        const parsed = parseBody(rawBody, bulkAddPantrySchema);
        const items = await addPantryItemsBulk(claims.sub, parsed.items);
        return created({ items });
      } catch (error) {
        return handleError(error, "Failed to add pantry items");
      }
    });
  }

  if (method === "PATCH" && path.match(/^\/pantry\/items\/[^/]+$/)) {
    return withAuth(authHeader, async (claims) => {
      try {
        const itemId = path.split("/")[3];
        const parsed = parseBody(rawBody, updatePantryItemSchema);
        const item = await updatePantryItem(claims.sub, itemId, parsed);
        return ok({ item });
      } catch (error) {
        return handleError(error, "Failed to update pantry item");
      }
    });
  }

  if (method === "DELETE" && path.match(/^\/pantry\/items\/[^/]+$/)) {
    return withAuth(authHeader, async (claims) => {
      try {
        const itemId = path.split("/")[3];
        await deletePantryItem(claims.sub, itemId);
        return ok({ deleted: true });
      } catch (error) {
        return handleError(error, "Failed to delete pantry item");
      }
    });
  }

  if (method === "POST" && path === "/pantry/upload-url") {
    return withAuth(authHeader, async (claims) => {
      try {
        const parsed = parseBody(rawBody, uploadUrlSchema);
        const result = await getPantryImageUploadUrl(claims.sub, parsed.filename, parsed.contentType);
        return ok(result);
      } catch (error) {
        return handleError(error, "Failed to create upload URL");
      }
    });
  }

  if (method === "POST" && path === "/pantry/parse-image") {
    return withAuth(authHeader, async () => {
      try {
        const parsed = parseBody(rawBody, parseImageSchema);
        const ingredients = await parseImageForIngredients(parsed.imageKey);
        return ok({ ingredients });
      } catch (error) {
        return handleError(error, "Failed to parse image");
      }
    });
  }

  return null;
}
