import type { GenerateRequest } from "./client.js";
import type { GeminiBootstrap } from "./models.js";
import { ENDPOINTS, formBody } from "./rpc.js";
export interface BuiltGenerateRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}
export class GeminiRequestBuilder {
  constructor(private readonly language = "en") {}
  build(
    bootstrap: GeminiBootstrap,
    request: GenerateRequest,
  ): BuiltGenerateRequest {
    const model =
      bootstrap.models.find((item) => item.name === request.model) ??
      bootstrap.models[0];
    const session = request.conversation ?? { cid: "", rid: "", rcid: "" };
    const payload: unknown[] = Array(97).fill(null);
    payload[0] = [[request.prompt, 0, null, null, null, null, 0]];
    payload[1] = [this.language];
    payload[2] = [session.cid, session.rid, session.rcid, null, null, null, null, null, null, ""];
    payload[6] = [0]; payload[7] = 1; payload[10] = 1; payload[11] = 0;
    payload[17] = [[0]]; payload[18] = 0; payload[27] = 1; payload[30] = [4];
    payload[41] = [1]; payload[53] = 0; payload[59] = crypto.randomUUID();
    payload[61] = []; payload[68] = 1; payload[79] = model?.mode ?? 0;
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
      },
      body: formBody({
        "f.req": JSON.stringify([null, JSON.stringify(payload)]),
        at: bootstrap.snlM0e,
      }),
    };
  }
}
import crypto from "node:crypto";
