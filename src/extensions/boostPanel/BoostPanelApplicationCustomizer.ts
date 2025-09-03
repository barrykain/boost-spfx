import { Log } from '@microsoft/sp-core-library';
import { BaseApplicationCustomizer } from '@microsoft/sp-application-base';
import { SPComponentLoader } from '@microsoft/sp-loader';

const LOG_SOURCE = 'BoostAssistant';

export interface IBoostAssistantApplicationCustomizerProperties {
  /** Boost subdomain, e.g. "cfsiint" -> https://cfsiint.boost.ai */
  boostTenant: string;
  /** Load the widget without auto-opening (default true = open) */
  autoOpen?: boolean;
  /**
   * JSON string passed as the second parameter to window.boostInit(tenant, options).
   * Example:
   * { "chatPanel": { "position": "right", "locale": "en", "actionFilters": ["boostfilter1"] } }
   */
  boostOptionsJson?: string;
}

export default class BoostAssistantApplicationCustomizer
  extends BaseApplicationCustomizer<IBoostAssistantApplicationCustomizerProperties> {

  public async onInit(): Promise<void> {
    // Avoid injecting twice on SPA navigation
    if ((window as any).__boostAssistantLoaded) return;

    const tenant = (this.properties?.boostTenant || '').trim();
    if (!tenant) {
      Log.warn(LOG_SOURCE, 'Missing required property: boostTenant');
      return;
    }

    try {
      await SPComponentLoader.loadScript(`https://${tenant}.boost.ai/chatPanel/chatPanel.js`);

      const boostInit = (window as any).boostInit as ((t: string, opts?: any) => any);
      if (typeof boostInit !== 'function') {
        Log.warn(LOG_SOURCE, 'boostInit not found after script load.');
        return;
      }

      // Parse options JSON safely; fall back to a tiny default
      const options = this._getBoostOptions();
      const boost = boostInit(tenant, options);

      const shouldOpen = this.properties?.autoOpen !== false;
      if (shouldOpen && boost?.chatPanel?.show) {
        boost.chatPanel.show();
      }

      (window as any).__boostAssistantLoaded = true;
    } catch (e) {
      Log.error(LOG_SOURCE, e as Error);
    }

    return Promise.resolve();
  }

  private _getBoostOptions(): any {
    // Minimal baseline (keep launcher bottom-right unless your tenant overrides)
    const defaults: any = { chatPanel: {} };

    if (!this.properties?.boostOptionsJson) return defaults;

    try {
      const parsed = JSON.parse(this.properties.boostOptionsJson);
      // Shallow merge defaults → parsed (parsed wins)
      if (parsed && typeof parsed === 'object') {
        // ensure chatPanel object exists to avoid undefined derefs in some Boost builds
        if (!parsed.chatPanel) parsed.chatPanel = {};
        return { ...defaults, ...parsed };
      }
    } catch {
      // Log and continue with defaults
      Log.warn(LOG_SOURCE, 'Invalid boostOptionsJson; using defaults.');
    }
    return defaults;
  }
}
