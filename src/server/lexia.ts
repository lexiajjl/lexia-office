// Lexia: reads a floor's oficina.json from the top of its checkout (see shared/lexia.ts). It's read
// again whenever the file changes, so editing it (or pulling a new one) shows on the next update.

import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { cleanLexia, type LexiaFloor } from '../shared/lexia.js';

const cache = new Map<string, { mtimeMs: number; size: number; floor: LexiaFloor | undefined }>();

/** What `dir`'s oficina.json says, or nothing when there isn't one (or it can't be read). */
export function readLexia(dir: string): LexiaFloor | undefined {
  const file = path.join(dir, 'oficina.json');
  let st: { mtimeMs: number; size: number };
  try {
    st = statSync(file);
  } catch {
    cache.delete(file);
    return undefined;
  }
  const hit = cache.get(file);
  if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) return hit.floor;
  let floor: LexiaFloor | undefined;
  try {
    floor = cleanLexia(JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, '')));
  } catch (err) {
    console.error(`agent-office: ${file} couldn't be read: ${(err as Error).message}`);
    floor = undefined;
  }
  cache.set(file, { mtimeMs: st.mtimeMs, size: st.size, floor });
  return floor;
}
