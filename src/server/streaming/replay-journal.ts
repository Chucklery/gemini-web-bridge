import { randomUUID } from 'node:crypto';
import type { ResponsesEvent } from './responses-sse.js';

export interface JournalEntry { key: string; responseId: string; createdAt: number; events: ResponsesEvent[]; completed: boolean; running: boolean; done: Promise<void>; }

export class ReplayJournal {
  private readonly entries = new Map<string, JournalEntry>();
  constructor(private readonly ttlMs = 900000, private readonly maxEvents = 512) {}
  begin(key: string): { entry: JournalEntry; owner: boolean } {
    this.prune(); const existing = this.entries.get(key); if (existing) return { entry: existing, owner: false };
    let resolve!: () => void; const entry: JournalEntry = { key, responseId: `resp_${randomUUID().replaceAll('-', '')}`, createdAt: Date.now(), events: [], completed: false, running: true, done: new Promise(done => { resolve = done; }) }; (entry as JournalEntry & { resolve: () => void }).resolve = resolve; this.entries.set(key, entry); return { entry, owner: true };
  }
  append(entry: JournalEntry, event: ResponsesEvent): void { if (!entry.completed && entry.events.length < this.maxEvents) entry.events.push(structuredClone(event)); }
  complete(entry: JournalEntry): void { entry.completed = true; entry.running = false; (entry as JournalEntry & { resolve: () => void }).resolve(); }
  fail(entry: JournalEntry): void { this.complete(entry); }
  replay(entry: JournalEntry): ResponsesEvent[] { return entry.events.map(event => structuredClone(event)); }
  get(key: string): JournalEntry | undefined { this.prune(); return this.entries.get(key); }
  private prune(): void { const cutoff = Date.now() - this.ttlMs; for (const [key, entry] of this.entries) if (entry.createdAt < cutoff) this.entries.delete(key); }
}
