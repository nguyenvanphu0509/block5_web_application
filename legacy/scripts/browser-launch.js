import { existsSync } from 'node:fs';

const chromeCandidates = process.platform === 'win32'
  ? [
      `${process.env.PROGRAMFILES || 'C:\\Program Files'}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)'}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env.LOCALAPPDATA || ''}\\Google\\Chrome\\Application\\chrome.exe`,
    ]
  : process.platform === 'darwin'
    ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
    : ['/usr/bin/google-chrome', '/usr/bin/chromium'];

export function browserLaunchOptions() {
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || chromeCandidates.find(existsSync);
  return executablePath ? { headless: true, executablePath } : { headless: true };
}
