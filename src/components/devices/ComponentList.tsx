import { Stack } from '@mantine/core'
import { SwitchControl } from './controls/SwitchControl'
import { DimmerControl } from './controls/DimmerControl'
import { CCTControl } from './controls/CCTControl'
import { RGBControl } from './controls/RGBControl'
import { RGBWControl } from './controls/RGBWControl'
import { CoverControl } from './controls/CoverControl'
import { InputDisplay } from './controls/InputDisplay'
import { TemperatureSensor } from './sensors/TemperatureSensor'
import { HumiditySensor } from './sensors/HumiditySensor'
import { FloodSensor } from './sensors/FloodSensor'
import { SmokeSensor } from './sensors/SmokeSensor'
import { IlluminanceSensor } from './sensors/IlluminanceSensor'
import { MotionSensor } from './sensors/MotionSensor'
import { BatteryIndicator } from './sensors/BatteryIndicator'
import { VoltmeterDisplay } from './sensors/VoltmeterDisplay'
import { EMDisplay } from './energy/EMDisplay'
import { EM1Display } from './energy/EM1Display'
import { PM1Display } from './energy/PM1Display'
import type { StoredDevice } from '../../types/device'
import type { ShellyGetStatusResult } from '../../types/shelly'

interface Props {
  device: StoredDevice
  status: ShellyGetStatusResult | undefined
}

export function ComponentList({ device, status }: Props) {
  return (
    <Stack gap="sm">
      {device.components.map((comp) => {
        // 'light_cct' is our internal sub-type; the actual GetStatus key is 'light:N'
        const statusKey =
          comp.type === 'light_cct' ? `light:${comp.id}` : `${comp.type}:${comp.id}`
        const renderKey = `${comp.type}:${comp.id}`
        const compStatus = status?.[statusKey]
        const props = {
          deviceId: device.id,
          componentId: comp.id,
          status: compStatus,
          device,
        }

        switch (comp.type) {
          case 'switch':
            return <SwitchControl key={renderKey} {...props} />
          case 'light':
            return <DimmerControl key={renderKey} {...props} />
          case 'light_cct':
            return <CCTControl key={renderKey} {...props} />
          case 'rgb':
            return <RGBControl key={renderKey} {...props} />
          case 'rgbw':
            return <RGBWControl key={renderKey} {...props} />
          case 'cover':
            return <CoverControl key={renderKey} {...props} />
          case 'input':
            return <InputDisplay key={renderKey} {...props} />
          case 'temperature':
            return <TemperatureSensor key={renderKey} {...props} />
          case 'humidity':
            return <HumiditySensor key={renderKey} {...props} />
          case 'flood':
            return <FloodSensor key={renderKey} {...props} />
          case 'smoke':
            return <SmokeSensor key={renderKey} {...props} />
          case 'illuminance':
            return <IlluminanceSensor key={renderKey} {...props} />
          case 'motion':
            return <MotionSensor key={renderKey} {...props} />
          case 'devicepower':
            return <BatteryIndicator key={renderKey} {...props} />
          case 'voltmeter':
            return <VoltmeterDisplay key={renderKey} {...props} />
          case 'em':
            return <EMDisplay key={renderKey} {...props} />
          case 'em1':
            return <EM1Display key={renderKey} {...props} />
          case 'pm1':
            return <PM1Display key={renderKey} {...props} />
          default:
            return null
        }
      })}
    </Stack>
  )
}
