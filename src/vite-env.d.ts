/// <reference types="vite/client" />

interface ARPluginInterface {
  start(options: { mode: 'space' | 'plant' }): Promise<{ estimatedArea?: number }>;
  stop(): Promise<void>;
}

interface Window {
  ARPlugin?: ARPluginInterface;
}

declare global {
  interface PluginRegistry {
    ARPlugin?: ARPluginInterface;
  }
}