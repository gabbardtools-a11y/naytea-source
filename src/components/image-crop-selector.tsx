'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface CropRect {
  x1: number
  y1: number
  x2: number
  y2: number
}

interface ImageCropSelectorProps {
  src: string
  /** Natural dimensions of the source image (px). */
  naturalWidth: number
  naturalHeight: number
  /** Called whenever the user changes the selection (in natural-image coords). */
  onChange?: (rect: CropRect | null) => void
}

/**
 * Lets the user drag-select a rectangular region on an image.
 *
 * The component renders the image at its natural aspect ratio inside a
 * container; the user drags to draw a selection box. Coordinates are
 * reported back to the parent in the image's natural pixel space so they
 * can be sent directly to the brand-search.ru `rectangle` query parameter
 * (which expects `[x1, y1, x2, y2]` in image pixels).
 */
export function ImageCropSelector({ src, naturalWidth, naturalHeight, onChange }: ImageCropSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [displayRect, setDisplayRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })

  // Track the rendered (CSS-pixel) size of the image so we can convert
  // between display coordinates and natural coordinates.
  useEffect(() => {
    const updateSize = () => {
      if (imgRef.current) {
        setDisplaySize({
          w: imgRef.current.clientWidth,
          h: imgRef.current.clientHeight,
        })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [src])

  const toNatural = useCallback(
    (dx: number, dy: number): CropRect | null => {
      if (displaySize.w === 0 || displaySize.h === 0) return null
      const scaleX = naturalWidth / displaySize.w
      const scaleY = naturalHeight / displaySize.h
      return {
        x1: Math.round(dx * scaleX),
        y1: Math.round(dy * scaleY),
        x2: Math.round((dx + (displayRect?.w || 0)) * scaleX),
        y2: Math.round((dy + (displayRect?.h || 0)) * scaleY),
      }
    },
    [displaySize, naturalWidth, naturalHeight, displayRect]
  )

  function handleMouseDown(e: React.MouseEvent) {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    dragStart.current = { x, y }
    setDragging(true)
    setDisplayRect({ x, y, w: 0, h: 0 })
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging || !dragStart.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, displaySize.w))
    const y = Math.max(0, Math.min(e.clientY - rect.top, displaySize.h))
    const startX = dragStart.current.x
    const startY = dragStart.current.y
    const left = Math.min(startX, x)
    const top = Math.min(startY, y)
    const w = Math.abs(x - startX)
    const h = Math.abs(y - startY)
    setDisplayRect({ x: left, y: top, w, h })
  }

  function handleMouseUp() {
    setDragging(false)
    dragStart.current = null
    if (displayRect && displayRect.w > 5 && displayRect.h > 5) {
      const natural = toNatural(displayRect.x, displayRect.y)
      if (natural) onChange?.(natural)
    } else {
      setDisplayRect(null)
      onChange?.(null)
    }
  }

  function handleMouseLeave() {
    if (dragging) handleMouseUp()
  }

  function clearSelection() {
    setDisplayRect(null)
    onChange?.(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Выделите область поиска мышью (необязательно)
        </span>
        {displayRect && (
          <button
            type="button"
            onClick={clearSelection}
            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300"
          >
            Сбросить выделение
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="relative inline-block max-w-full cursor-crosshair select-none border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white"
        style={{ lineHeight: 0 }}
      >
        <img
          ref={imgRef}
          src={src}
          alt="Для выделения области"
          className="block max-w-full h-auto"
          style={{ maxHeight: '300px', width: 'auto' }}
          draggable={false}
        />
        {/* Darkened overlay outside selection */}
        {displayRect && displayRect.w > 0 && displayRect.h > 0 && (
          <>
            <div
              className="absolute bg-black/50 pointer-events-none"
              style={{ left: 0, top: 0, right: 0, height: `${displayRect.y}px` }}
            />
            <div
              className="absolute bg-black/50 pointer-events-none"
              style={{ left: 0, top: `${displayRect.y + displayRect.h}px`, right: 0, bottom: 0 }}
            />
            <div
              className="absolute bg-black/50 pointer-events-none"
              style={{ left: 0, top: `${displayRect.y}px`, width: `${displayRect.x}px`, height: `${displayRect.h}px` }}
            />
            <div
              className="absolute bg-black/50 pointer-events-none"
              style={{ left: `${displayRect.x + displayRect.w}px`, top: `${displayRect.y}px`, right: 0, height: `${displayRect.h}px` }}
            />
            {/* Selection border */}
            <div
              className="absolute border-2 border-fuchsia-500 pointer-events-none"
              style={{
                left: `${displayRect.x}px`,
                top: `${displayRect.y}px`,
                width: `${displayRect.w}px`,
                height: `${displayRect.h}px`,
              }}
            />
          </>
        )}
      </div>
      {displayRect && displayRect.w > 5 && displayRect.h > 5 && (
        <div className="text-xs text-fuchsia-600 dark:text-fuchsia-400">
          Выделена область: {Math.round(displayRect.w)}×{Math.round(displayRect.h)}px
        </div>
      )}
    </div>
  )
}
