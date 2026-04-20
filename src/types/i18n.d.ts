// Requires "resolveJsonModule": true in tsconfig.json
// The relative paths below are relative to this file's location (src/types/)
import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof import('../locales/en/common.json');
      devices: typeof import('../locales/en/devices.json');
      discovery: typeof import('../locales/en/discovery.json');
      settings: typeof import('../locales/en/settings.json');
    };
  }
}
