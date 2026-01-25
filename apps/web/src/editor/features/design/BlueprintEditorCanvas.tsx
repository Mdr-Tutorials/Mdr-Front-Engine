import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useEditorStore } from "@/editor/store/useEditorStore"
import { useSettingsStore } from "@/editor/store/useSettingsStore"
import { MIRRenderer } from "@/mir/renderer/MIRRenderer"
import { createOrderedComponentRegistry, parseResolverOrder } from "@/mir/renderer/registry"
import { testDoc } from "@/mock/pagaData"

type BlueprintEditorCanvasProps = {
  viewportWidth: string
  viewportHeight: string
  zoom: number
  pan: { x: number; y: number }
  selectedId?: string
  onPanChange: (pan: { x: number; y: number }) => void
  onSelectNode: (nodeId: string) => void
}

type PanState = {
  pointerId: number | null
  startX: number
  startY: number
  originX: number
  originY: number
  moved: boolean
}

const DRAG_THRESHOLD = 3
const getTimestamp = () =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now()

const parseDimension = (value: string, fallback: number, min: number) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.max(min, parsed)
}

const isInteractiveTarget = (target: HTMLElement | null) => {
  if (!target) return false
  return Boolean(target.closest("button, input, textarea, select, option, a, label, [contenteditable=\"true\"]"))
}

export function BlueprintEditorCanvas({
  viewportWidth,
  viewportHeight,
  zoom,
  pan,
  selectedId,
  onPanChange,
  onSelectNode,
}: BlueprintEditorCanvasProps) {
  const { t } = useTranslation('blueprint')
  const assist = useSettingsStore((state) => state.global.assist)
  const panInertia = useSettingsStore((state) => state.global.panInertia)
  const renderMode = useSettingsStore((state) => state.global.renderMode)
  const allowExternalProps = useSettingsStore((state) => state.global.allowExternalProps)
  const resolverOrder = useSettingsStore((state) => state.global.resolverOrder)
  const diagnostics = useSettingsStore((state) => state.global.diagnostics)
  const [isPanning, setIsPanning] = useState(false)
  const mirDoc = useEditorStore((state) => state.mirDoc)
  const panState = useRef<PanState>({
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  })
  const panRef = useRef(pan)
  const velocityRef = useRef({ x: 0, y: 0 })
  const lastMoveRef = useRef({ x: 0, y: 0, time: 0 })
  const inertiaFrameRef = useRef<number | null>(null)
  const suppressSelectRef = useRef(false)
  const canvasWidth = parseDimension(viewportWidth, 1440, 320)
  const canvasHeight = parseDimension(viewportHeight, 900, 240)
  const scale = Math.min(2, Math.max(0.4, zoom / 100))
  const showGrid = assist.includes("grid")
  const showSelectionDiagnostics = diagnostics.includes("selection")
  const registry = useMemo(
    () => createOrderedComponentRegistry(parseResolverOrder(resolverOrder)),
    [resolverOrder]
  )

  useEffect(() => {
    panRef.current = pan
  }, [pan])

  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return
      if (inertiaFrameRef.current) {
        window.cancelAnimationFrame(inertiaFrameRef.current)
      }
    }
  }, [])

  const stopInertia = () => {
    if (typeof window === "undefined") return
    if (inertiaFrameRef.current) {
      window.cancelAnimationFrame(inertiaFrameRef.current)
      inertiaFrameRef.current = null
    }
  }

  const applyPan = (nextPan: { x: number; y: number }) => {
    panRef.current = nextPan
    onPanChange(nextPan)
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    if (isInteractiveTarget(event.target as HTMLElement)) return
    stopInertia()
    panState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
      moved: false,
    }
    velocityRef.current = { x: 0, y: 0 }
    lastMoveRef.current = { x: event.clientX, y: event.clientY, time: getTimestamp() }
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (panState.current.pointerId !== event.pointerId) return
    const deltaX = event.clientX - panState.current.startX
    const deltaY = event.clientY - panState.current.startY
    const now = getTimestamp()
    const lastMove = lastMoveRef.current
    const deltaTime = now - lastMove.time
    if (deltaTime > 0) {
      velocityRef.current = {
        x: (event.clientX - lastMove.x) / deltaTime,
        y: (event.clientY - lastMove.y) / deltaTime,
      }
    }
    lastMoveRef.current = { x: event.clientX, y: event.clientY, time: now }
    if (!panState.current.moved && Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD) {
      panState.current.moved = true
      setIsPanning(true)
    }
    if (!panState.current.moved) return
    event.preventDefault()
    applyPan({
      x: panState.current.originX + deltaX,
      y: panState.current.originY + deltaY,
    })
  }

  const startInertia = () => {
    if (typeof window === "undefined") return
    if (panInertia <= 0) return
    const baseVelocity = velocityRef.current
    let velocityX = baseVelocity.x * 16
    let velocityY = baseVelocity.y * 16
    if (Math.abs(velocityX) + Math.abs(velocityY) < 0.1) return
    const inertiaStrength = Math.min(1, Math.max(0, panInertia / 100))
    const damping = 0.86 + inertiaStrength * 0.12
    const step = () => {
      velocityX *= damping
      velocityY *= damping
      if (Math.abs(velocityX) + Math.abs(velocityY) < 0.1) {
        inertiaFrameRef.current = null
        return
      }
      applyPan({
        x: panRef.current.x + velocityX,
        y: panRef.current.y + velocityY,
      })
      inertiaFrameRef.current = window.requestAnimationFrame(step)
    }
    inertiaFrameRef.current = window.requestAnimationFrame(step)
  }

  const endPan = (event: PointerEvent<HTMLDivElement>) => {
    if (panState.current.pointerId !== event.pointerId) return
    const shouldInertia = panState.current.moved
    if (panState.current.moved) {
      suppressSelectRef.current = true
      setTimeout(() => {
        suppressSelectRef.current = false
      }, 0)
    }
    panState.current.pointerId = null
    panState.current.moved = false
    setIsPanning(false)
    if (shouldInertia) {
      startInertia()
    }
  }

  const handleNodeSelect = (nodeId: string) => {
    if (suppressSelectRef.current) return
    onSelectNode(nodeId)
  }

  const resolvedDoc = mirDoc?.ui?.root?.children?.length ? mirDoc : testDoc
  const hasRoot = Boolean(resolvedDoc?.ui?.root)

  return (
    <section className={`BlueprintEditorCanvas ${showSelectionDiagnostics ? "" : "HideSelectionDiagnostics"}`}>
      <div
        className={`BlueprintEditorCanvasSurface ${isPanning ? "IsPanning" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onPointerLeave={endPan}
      >
        {showGrid && <div className="BlueprintEditorCanvasGrid" />}
        <div
          className="BlueprintEditorCanvasPanLayer"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
        >
          <div
            className="BlueprintEditorCanvasZoomLayer"
            style={{ transform: `scale(${scale})` }}
          >
            <div
              className="BlueprintEditorCanvasArtboard"
              style={{ width: canvasWidth, height: canvasHeight }}
            >
              {hasRoot ? (
                <MIRRenderer
                  node={resolvedDoc.ui.root}
                  mirDoc={resolvedDoc}
                  selectedId={selectedId}
                  onNodeSelect={handleNodeSelect}
                  registry={registry}
                  renderMode={renderMode}
                  allowExternalProps={allowExternalProps === "enabled"}
                />
              ) : (
                <div className="BlueprintEditorCanvasPlaceholder">
                  <h3>{t('canvas.placeholderTitle')}</h3>
                  <p>{t('canvas.placeholderDescription')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
