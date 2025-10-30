export function generateShortCode(length: number = 7): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[values[i] % chars.length];
  }
  return code;
}

export async function generateUniqueCode(db: D1Database): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateShortCode();
    const exists = await db
      .prepare('SELECT 1 FROM links WHERE short_code = ?')
      .bind(code)
      .first();
    if (!exists) return code;
  }
  return generateShortCode(10);
}





