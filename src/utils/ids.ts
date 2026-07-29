/**
 * WhatsApp Web sometimes exposes IDs as `_serialized`, sometimes as `$1`.
 */
export function serializedId(
  id: { _serialized?: string; $1?: string; user?: string } | null | undefined,
): string | null {
  if (!id) return null;
  return id._serialized || (id as { $1?: string }).$1 || null;
}
