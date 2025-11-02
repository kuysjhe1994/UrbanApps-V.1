/// <reference types="vite/client" />

interface ARPluginInterface {
  startAR(): Promise<void>;
  stopAR(): Promise<void>;
  addListener(eventName: 'scanResult', listenerFunc: (data: { label: string; confidence: number; timestamp: number }) => void): Promise<any>;
}

interface Window {
  ARPlugin?: ARPluginInterface;
}

declare global {
  interface PluginRegistry {
    ARPlugin?: ARPluginInterface;
  }
}