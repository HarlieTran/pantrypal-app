type JsonResponse = { statusCode: number; body: Record<string, unknown> };

export async function handleIngredientsRoute(
  method: string,
  path: string,
): Promise<JsonResponse | null> {
  void method;
  void path;
  return null;
}
