import { Box, Loader, Overlay } from '@mantine/core'

interface LoadingOverlayProps {
  visible: boolean
}

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <Box pos="relative">
      <Overlay opacity={0.5} color="#000" zIndex={10} />
      <Box
        pos="fixed"
        top="50%"
        left="50%"
        style={{ transform: 'translate(-50%, -50%)', zIndex: 11 }}
      >
        <Loader size="xl" />
      </Box>
    </Box>
  )
}
