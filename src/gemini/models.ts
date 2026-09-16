export interface GeminiModel { name: string; displayName: string; description: string; hash: string; mode: number; capabilities: string[]; default: boolean; }
export interface GeminiBootstrap { snlM0e: string; bl: string; fsid: string; models: GeminiModel[]; }
export function parseModelCatalog(payload: unknown): GeminiModel[] {
  if (!Array.isArray(payload) || !Array.isArray(payload[15])) return [];
  const models: GeminiModel[] = [];
  for (const raw of payload[15]) {
    if (!Array.isArray(raw)) continue;
    const hash=typeof raw[0]==='string'?raw[0]:'';
    const displayName=typeof raw[11]==='string'?raw[11]:(typeof raw[19]==='string'?raw[19]:'');
    const mode=typeof raw[17]==='number'?raw[17]:0;
    if (!hash || !displayName || !mode) continue;
    const slug=displayName.toLowerCase().replace(/[^a-z0-9.]+/g,'-').replace(/^-|-$/g,'');
    models.push({name:slug.startsWith('gemini-')?slug:'gemini-'+slug,displayName,description:typeof raw[12]==='string'?raw[12]:'',hash,mode,capabilities:['generateContent','streamGenerateContent'],default:raw[7]===true||raw[15]===true});
  }
  return models.sort((a,b)=>a.name.localeCompare(b.name));
}
