/**
 * Mobile pull-to-refresh gesture component.
 * Uses pointer events + CSS translate for a native-feel pull gesture.
 * Phase 6.3
 */
import { useRef, useState, type ReactNode, type PointerEvent } from 'react'
import { Loader, Stack } from '@mantine/core'

interface Props {
  onRefresh: () => Promise<void>
  children: ReactNode
  /** Disable the gesture (e.g. while already loading) */
  disabled?: boolean
}

const THRESHOLD_PX = 70
const MAX_PULL_PX = THRESHOLD_PX + 24

export function PullToRefresh({ onRefresh, children, disabled = false }: Props) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startYRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (disabled || refreshing) return
    // Only trigger when the container is scrolled to the top
    if ((containerRef.current?.scrollTop ?? 0) !== 0) return
    startYRef.current = e.clientY
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (startYRef.current === null) return
    // Dampen the pull to give resistance feel
    const raw = Math.max(0, e.clientY - startYRef.current)
    setPullDistance(Math.min(raw * 0.5, MAX_PULL_PX))
  }

  async function onPointerUp() {
    if (startYRef.current === null) return
    startYRef.current = null

    if (pullDistance >= THRESHOLD_PX) {
      setRefreshing(true)
      setPullDistance(0)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    } else {
      setPullDistance(0)
    }
  }

  function onPointerCancel() {
    startYRef.current = null
    setPullDistance(0)
  }

  const translateY = refreshing ? 44 : pullDistance
  const indicatorOpacity = Math.min(pullDistance / THRESHOLD_PX, 1)

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', overflowY: 'auto', height: '100%' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {/* Pull indicator */}
      <Stack
        align="center"
        style={{
          position: 'absolute',
          top: Math.max(translateY - 40, -40),
          left: 0,
          right: 0,
          opacity: refreshing ? 1 : indicatorOpacity,
          transition: pullDistance === 0 ? 'opacity 0.3s ease, top 0.3s ease' : undefined,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <Loader size="sm" color="orange" />
      </Stack>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${translateY}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}
