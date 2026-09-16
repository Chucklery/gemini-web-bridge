import { describe, expect, it } from 'vitest';
import { buildSapisidHash } from '../src/auth/sapisid.js';
describe('SAPISID authentication',()=>{it('creates the expected header shape',()=>{const value=buildSapisidHash('secret');expect(value).toMatch(/^SAPISIDHASH \d+_[a-f0-9]{40}$/);});});
