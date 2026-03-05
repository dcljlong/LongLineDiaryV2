import React from 'react'

type Priority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'deferred'
  | 'done'
  | 'none'
  | string

export default function PriorityBadge({
  priority,
  compact = false,
}: {
  priority?: Priority | null
  compact?: boolean
}) {
  const p = String(priority || 'none').toLowerCase()

  // token-driven colors (works in light + dark; strong text contrast)
  const cfg =
    p === 'critical' ? { label: 'Critical', tone: 'danger' } :
    p === 'high' ? { label: 'High', tone: 'warning' } :
    p === 'medium' ? { label: 'Medium', tone: 'info' } :
    p === 'low' ? { label: 'Low', tone: 'neutral' } :
    p === 'deferred' ? { label: 'Deferred', tone: 'neutral' } :
    p === 'done' ? { label: 'Done', tone: 'success' } :
    { label: 'None', tone: 'neutral' }

  const toneVar =
    cfg.tone === 'danger' ? 'var(--status-danger)' :
    cfg.tone === 'warning' ? 'var(--status-warning)' :
    cfg.tone === 'info' ? 'var(--status-info)' :
    cfg.tone === 'success' ? 'var(--status-success)' :
    'var(--status-neutral)'

  const base =
    'inline-flex items-center justify-center rounded-full border font-extrabold tracking-wide tabular-nums select-none ' +
    'shadow-[0_0_0_1px_hsl(var(--border)/0.35)]'

  const size = compact
    ? 'text-[10px] px-2 py-[2px]'
    : 'text-[11px] px-2.5 py-1'

  // higher contrast than before:
  // - bg is darker/stronger in dark mode via alpha
  // - border is vivid
  // - text is full-intensity tone
  const style: React.CSSProperties = {
    color: `hsl(${toneVar} / 1)`,
    backgroundColor: `hsl(${toneVar} / 0.22)`,
    borderColor: `hsl(${toneVar} / 0.62)`,
  }

  return (
    <span className={`${base} ${size}`} style={style} title={cfg.label}>
      {cfg.label.toUpperCase()}
    </span>
  )
}
