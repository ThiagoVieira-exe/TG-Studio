interface ElectronPrintResult {
  success: boolean;
  failureReason?: string;
}

interface ElectronAPI {
  isElectron: true;
  print: (paper: { width: number; height: number }) => Promise<ElectronPrintResult>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
