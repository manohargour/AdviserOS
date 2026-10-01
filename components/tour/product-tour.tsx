'use client'

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TOUR_STEPS } from './tour-steps'

const SEEN_KEY = 'adviseros-tour-seen'
const PAD = 8
const GAP = 14
const CARD_WIDTH = 340

type Rect = { top: number; left: number; width: number; height: number }

const TourContext = createContext<{ start: () => void } | null>(null)

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used inside TourProvider')
  return ctx
}

function findVisible(selector: string) {
  const el = document.querySelector<HTMLElement>(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  const onScreen = r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth
  return onScreen ? el : null
}

// Element.scrollIntoView also scrolls the document, which shifts the fixed-height app shell.
function scrollIntoContainer(el: HTMLElement) {
  let parent = el.parentElement
  while (parent && parent !== document.body) {
    const { overflowY } = getComputedStyle(parent)
    if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) break
    parent = parent.parentElement
  }
  if (!parent || parent === document.body) return
  const pr = parent.getBoundingClientRect()
  const er = el.getBoundingClientRect()
  const offset = er.top - pr.top - Math.max((pr.height - er.height) / 2, 24)
  parent.scrollBy({ top: offset, behavior: 'smooth' })
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState<number | null>(null)
  const pathname = usePathname()

  const start = useCallback(() => setIndex(0), [])

  const close = useCallback(() => {
    setIndex(null)
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {}
  }, [])

  useEffect(() => {
    if (pathname !== '/') return
    try {
      if (!localStorage.getItem(SEEN_KEY)) setIndex(0)
    } catch {}
    // Only auto-start once, on the first landing on Home.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <TourContext.Provider value={{ start }}>
      {children}
      {index !== null && <TourOverlay index={index} setIndex={setIndex} onClose={close} />}
    </TourContext.Provider>
  )
}

function TourOverlay({
  index,
  setIndex,
  onClose,
}: {
  index: number
  setIndex: (i: number) => void
  onClose: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const step = TOUR_STEPS[index]!
  const isLast = index === TOUR_STEPS.length - 1
  const [rect, setRect] = useState<Rect | null>(null)
  const [ready, setReady] = useState(false)
  const [cardHeight, setCardHeight] = useState(200)
  const cardRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (step.route && pathname !== step.route) router.push(step.route)
  }, [step.route, pathname, router])

  useEffect(() => {
    setReady(false)
    setRect(null)
    targetRef.current = null
    if (step.route && pathname !== step.route) return
    if (!step.target) {
      setReady(true)
      return
    }
    const selector = step.target
    let attempts = 0
    const timer = window.setInterval(() => {
      const el = findVisible(selector)
      attempts++
      if (el || attempts > 40) {
        window.clearInterval(timer)
        if (el) {
          targetRef.current = el
          scrollIntoContainer(el)
          window.setTimeout(() => {
            const r = el.getBoundingClientRect()
            setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
            setReady(true)
          }, 350)
        } else {
          setReady(true)
        }
      }
    }, 100)
    return () => window.clearInterval(timer)
  }, [step.target, step.route, pathname])

  useEffect(() => {
    const update = () => {
      const el = targetRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [])

  useLayoutEffect(() => {
    if (cardRef.current) setCardHeight(cardRef.current.offsetHeight)
  }, [index, ready])

  useEffect(() => {
    if (ready) cardRef.current?.focus()
  }, [ready, index])

  const next = useCallback(() => (isLast ? onClose() : setIndex(index + 1)), [isLast, onClose, setIndex, index])
  const back = useCallback(() => index > 0 && setIndex(index - 1), [index, setIndex])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, back, onClose])

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const width = Math.min(CARD_WIDTH, vw - 24)

  let cardStyle: React.CSSProperties
  if (rect) {
    const spaceBelow = vh - (rect.top + rect.height)
    const spaceRight = vw - (rect.left + rect.width)
    const spaceLeft = rect.left
    let top: number
    let left: number
    if (rect.height > vh * 0.6 && spaceLeft > width + GAP * 2) {
      top = Math.min(Math.max(rect.top + 24, 12), vh - cardHeight - 12)
      left = rect.left - width - GAP - PAD
    } else if (rect.height > vh * 0.6 && spaceRight > width + GAP * 2) {
      top = Math.min(Math.max(rect.top + 24, 12), vh - cardHeight - 12)
      left = rect.left + rect.width + GAP + PAD
    } else if (spaceBelow > cardHeight + GAP * 2) {
      top = rect.top + rect.height + PAD + GAP
      left = rect.left
    } else {
      top = rect.top - PAD - GAP - cardHeight
      left = rect.left
    }
    left = Math.min(Math.max(left, 12), vw - width - 12)
    top = Math.min(Math.max(top, 12), vh - cardHeight - 12)
    cardStyle = { top, left, width }
  } else {
    cardStyle = { top: '50%', left: '50%', width, transform: 'translate(-50%, -50%)' }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div aria-hidden className={cn('absolute inset-0', !rect && 'bg-foreground/45')} />
      {rect && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-xl ring-2 ring-brass transition-all duration-300 ease-out"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px color-mix(in oklab, var(--foreground) 45%, transparent)',
          }}
        />
      )}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
        style={cardStyle}
        className={cn(
          'absolute rounded-xl border bg-popover p-5 text-popover-foreground shadow-2xl outline-none transition-opacity duration-200',
          ready ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-brass">
            Step {index + 1} of {TOUR_STEPS.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tour"
            className="-m-1 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
        <h2 id="tour-title" className="mt-1.5 font-serif text-xl font-medium leading-snug tracking-tight">
          {step.title}
        </h2>
        <p id="tour-body" className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {step.body}
        </p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex gap-1" aria-hidden>
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-4 bg-primary' : 'w-1.5 bg-border',
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {index === 0 ? (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Skip
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={back}>
                Back
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {isLast ? 'Finish' : index === 0 ? 'Start tour' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
