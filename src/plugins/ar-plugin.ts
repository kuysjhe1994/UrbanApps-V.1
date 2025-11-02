import { Capacitor } from "@capacitor/core";

/**
 * ARPlugin - Wrapper for native ARPlugin Capacitor plugin
 */
export class ARPlugin {
  private static getPlugin() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("ARPlugin is only available on native platforms");
    }
    
    // @ts-ignore - ARPlugin
    const plugin = Capacitor.Plugins?.ARPlugin || (window as any).ARPlugin;
    if (!plugin) {
      throw new Error("ARPlugin not found. Make sure the plugin is properly registered.");
    }
    return plugin;
  }

  /**
   * Start AR scanning session
   */
  static async startAR(): Promise<void> {
    const plugin = this.getPlugin();
    await plugin.startAR();
  }

  /**
   * Stop AR scanning session
   */
  static async stopAR(): Promise<void> {
    const plugin = this.getPlugin();
    await plugin.stopAR();
  }

  /**
   * Add listener for scan results
   */
  static async addListener(
    eventName: 'scanResult',
    listenerFunc: (data: { label: string; confidence: number; timestamp: number }) => void
  ) {
    const plugin = this.getPlugin();
    const listener = await plugin.addListener(eventName, listenerFunc);
    return {
      remove: async () => {
        await listener.remove();
      }
    };
  }
}

