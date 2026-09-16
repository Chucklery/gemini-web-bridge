export type BrowserChannel = 'chrome' | 'msedge';
export interface BrowserExecutable { channel?: BrowserChannel; executablePath?: string; }
export interface BrowserDiscoveryOptions { channel?: 'auto' | BrowserChannel; executablePath?: string; platform?: NodeJS.Platform; env?: NodeJS.ProcessEnv; }

export function discoverBrowser(options: BrowserDiscoveryOptions = {}): BrowserExecutable {
  if (options.executablePath) return { executablePath: options.executablePath };
  if (options.channel && options.channel !== 'auto') return { channel: options.channel };
  const envPath = options.env?.GEMINI_BROWSER_EXECUTABLE_PATH ?? process.env.GEMINI_BROWSER_EXECUTABLE_PATH;
  if (envPath) return { executablePath: envPath };
  return { channel: (options.platform ?? process.platform) === 'win32' ? 'msedge' : 'chrome' };
}
