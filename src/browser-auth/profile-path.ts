import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export function profilePath(accountId: string, root = process.env.GEMINI_AUTH_DATA_DIR ?? join(homedir(), '.gemini-web-bridge')): string {
  return resolve(root, 'browser-profiles', createHash('sha256').update(accountId).digest('hex').slice(0, 24));
}
export async function ensureProfilePath(accountId: string, root?: string): Promise<string> { const path = profilePath(accountId, root); await mkdir(path, { recursive: true, mode: 0o700 }); return path; }
export function authStatePath(accountId: string, root?: string): string { return join(profilePath(accountId, root), 'gemini-auth-state.json'); }
