import { describe, expect, it } from 'vitest';
import { ReplayJournal } from '../src/server/streaming/replay-journal.js';

describe('ReplayJournal', () => {
  it('returns one owner and replays the same execution', async () => {
    const journal = new ReplayJournal(1000, 4);
    const first = journal.begin('request-1');
    const second = journal.begin('request-1');
    expect(first.owner).toBe(true);
    expect(second.owner).toBe(false);
    journal.append(first.entry, { type: 'response.created' });
    journal.complete(first.entry);
    await second.entry.done;
    expect(journal.replay(second.entry)).toEqual([{ type: 'response.created' }]);
  });
});
