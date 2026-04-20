import { Badge, Group } from '@mantine/core'

const ERROR_COLOR: Record<string, string> = {
  overtemp: 'red',
  overpower: 'red',
  overvoltage: 'orange',
  undervoltage: 'orange',
  overcurrent: 'red',
  obstruction: 'yellow',
  safety_switch: 'yellow',
}

interface Props {
  errors?: string[]
}

export function ErrorBadges({ errors }: Props) {
  if (!errors || errors.length === 0) return null

  return (
    <Group gap={4} wrap="wrap">
      {errors.map((err) => (
        <Badge
          key={err}
          color={ERROR_COLOR[err] ?? 'red'}
          variant="filled"
          size="xs"
        >
          {err}
        </Badge>
      ))}
    </Group>
  )
}
