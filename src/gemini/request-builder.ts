import { randomUUID } from 'node:crypto';
import type { GenerateRequest } from "./client.js";
import type { GeminiBootstrap } from "./models.js";
import { ENDPOINTS, formBody } from "./rpc.js";
export interface BuiltGenerateRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

const PAYLOAD_SIZE = 97;
const PROMPT_INDEX = 0;
const LANGUAGE_INDEX = 1;
const SESSION_INDEX = 2;
const STREAMING_INDEX = 7;
const REQUEST_ID_INDEX = 59;
const MODEL_MODE_INDEX = 79;

export class GeminiRequestBuilder {
  constructor(private readonly language = "en") {}
  build(
    bootstrap: GeminiBootstrap,
    request: GenerateRequest,
  ): BuiltGenerateRequest {
    const model = bootstrap.models.find((item) => item.name === request.model) ?? bootstrap.models.find(item => item.default) ?? bootstrap.models[0];
    const session = request.conversation ?? { cid: "", rid: "", rcid: "" };
    const payload: unknown[] = Array(PAYLOAD_SIZE).fill(null);
    payload[PROMPT_INDEX] = [[request.prompt, 0, null, null, null, null, 0]];
    payload[LANGUAGE_INDEX] = [this.language];
    payload[SESSION_INDEX] = [session.cid, session.rid, session.rcid, null, null, null, null, null, null, ""];
    payload[6] = [0]; payload[STREAMING_INDEX] = 1; payload[10] = 1; payload[11] = 0;
    payload[17] = [[0]]; payload[18] = 0; payload[27] = 1; payload[30] = [4];
    payload[41] = [1]; payload[53] = 0; payload[REQUEST_ID_INDEX] = randomUUID();
    payload[61] = []; payload[68] = 1; payload[MODEL_MODE_INDEX] = model?.mode ?? 0;
    payload[80] = 1; payload[91] = 0; payload[96] = 1;
    const params = new URLSearchParams({
      bl: bootstrap.bl,
      "f.sid": bootstrap.fsid,
      hl: this.language,
      rt: "c",
    });
    return {
      url: ENDPOINTS.generate + "?" + params.toString(),
      headers: {
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        ...(model ? { 'x-goog-ext-525001261-jspb': `[1,null,null,null,"${model.hash}",null,null,0,[4],null,null,${model.mode}]` } : {}),
        'x-goog-ext-73010989-jspb': '[0]',
        'x-goog-ext-73010990-jspb': '[0]',
      },
      body: formBody({
        "f.req": JSON.stringify([null, JSON.stringify(payload)]),
        at: bootstrap.snlM0e,
      }),
    };
  }
}
import crypto from "node:crypto";
