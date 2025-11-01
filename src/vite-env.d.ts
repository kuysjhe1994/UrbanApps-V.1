/// <reference types="vite/client" />

interface ARCameraPluginInterface {
  checkARSupport(): Promise<{ supported: boolean }>;
  startARSession(): Promise<{ success: boolean; message: string }>;
  stopARSession(): Promise<{ success: boolean; message: string }>;
  start(options: { mode?: 'space' | 'plant' }): Promise<{ success: boolean; message: string }>;
  stop(): Promise<{ success: boolean; message: string }>;
  measureArea(): Promise<{ estimatedArea: number; method?: string; confidence?: number; message?: string }>;
}

interface Window {
  ARCamera?: ARCameraPluginInterface;
}

declare global {
  interface PluginRegistry {
    ARCamera?: ARCameraPluginInterface;
  }
}