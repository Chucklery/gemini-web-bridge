import { describe, expect, it } from 'vitest';
import { ConversationState } from '../src/gemini/session.js';
describe('ConversationState',()=>{it('updates only with non-empty protocol values',()=>{const state=new ConversationState({cid:'c'});state.update({rid:'r',rcid:''});expect(state.snapshot()).toEqual({cid:'c',rid:'r',rcid:''});});});
