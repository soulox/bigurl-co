export function generateUniqueCode(generate: (len: number) => string, exists: (code: string) => boolean, maxAttempts = 20): string {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generate(7);
    if (!exists(code)) return code;
  }
  throw new Error('Failed to generate unique code');
}

export function randomAlphaNum(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}


