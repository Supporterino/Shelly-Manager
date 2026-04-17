/**
 * Locale schema validation: every non-English locale must have
 * exactly the same leaf keys as the English source-of-truth files.
 *
 * Phase 7.4 — PLAN.md §7.4
 */
import { describe, it, expect } from 'vitest'

import en_common    from '../locales/en/common.json'
import en_devices   from '../locales/en/devices.json'
import en_discovery from '../locales/en/discovery.json'
import en_settings  from '../locales/en/settings.json'

import de_common    from '../locales/de/common.json'
import de_devices   from '../locales/de/devices.json'
import de_discovery from '../locales/de/discovery.json'
import de_settings  from '../locales/de/settings.json'

import fr_common    from '../locales/fr/common.json'
import fr_devices   from '../locales/fr/devices.json'
import fr_discovery from '../locales/fr/discovery.json'
import fr_settings  from '../locales/fr/settings.json'

import es_common    from '../locales/es/common.json'
import es_devices   from '../locales/es/devices.json'
import es_discovery from '../locales/es/discovery.json'
import es_settings  from '../locales/es/settings.json'

import zh_common    from '../locales/zh/common.json'
import zh_devices   from '../locales/zh/devices.json'
import zh_discovery from '../locales/zh/discovery.json'
import zh_settings  from '../locales/zh/settings.json'

import ja_common    from '../locales/ja/common.json'
import ja_devices   from '../locales/ja/devices.json'
import ja_discovery from '../locales/ja/discovery.json'
import ja_settings  from '../locales/ja/settings.json'

function getLeafKeys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null && !Array.isArray(v)
      ? getLeafKeys(v as object, `${prefix}${k}.`)
      : [`${prefix}${k}`]
  )
}

const LOCALES = [
  { code: 'de', common: de_common, devices: de_devices, discovery: de_discovery, settings: de_settings },
  { code: 'fr', common: fr_common, devices: fr_devices, discovery: fr_discovery, settings: fr_settings },
  { code: 'es', common: es_common, devices: es_devices, discovery: es_discovery, settings: es_settings },
  { code: 'zh', common: zh_common, devices: zh_devices, discovery: zh_discovery, settings: zh_settings },
  { code: 'ja', common: ja_common, devices: ja_devices, discovery: ja_discovery, settings: ja_settings },
]

const EN_NAMESPACES = {
  common:    en_common,
  devices:   en_devices,
  discovery: en_discovery,
  settings:  en_settings,
}

describe('locale completeness', () => {
  for (const locale of LOCALES) {
    for (const [ns, enObj] of Object.entries(EN_NAMESPACES)) {
      const enKeys = new Set(getLeafKeys(enObj))
      const localeObj = locale[ns as keyof typeof locale]
      const localeKeys = new Set(getLeafKeys(localeObj as object))

      it(`${locale.code}/${ns}: no missing keys`, () => {
        const missing = [...enKeys].filter((k) => !localeKeys.has(k))
        expect(missing, `Missing keys in ${locale.code}/${ns}`).toEqual([])
      })
    }
  }
})
