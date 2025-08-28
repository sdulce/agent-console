// src/types/route.ts
export type IdCtx = { params: Promise<{ id: string }> };

export async function getId(ctx: IdCtx) {
  const { id } = await ctx.params;
  return id;
}
