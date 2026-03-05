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

type Size = 'sm' | 'md'

export default function PriorityBadge({
  priority,
  compact = false,
  size,
  showIcon = false,
}: {
  priority?: Priority | null
  compact?: boolean
  size?: Size
  showIcon?: boolean
}) {
  const p = String(priority || 'none').toLowerCase()

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
    'inline-flex items-center justify-center gap-1 rounded-full border font-extrabold tracking-wide tabular-nums select-none ' +
    'shadow-[0_0_0_1px_hsl(var(--border)/0.35)]'

  // Resolve sizing: explicit size wins, else compact flag, else default md
  const resolved: Size = size ? size : (compact ? 'sm' : 'md')

  const sz =
    resolved === 'sm'
      ? 'text-[10px] px-2 py-[2px]'
      : 'text-[11px] px-2.5 py-1'

  // Contrast rule:
  // - Text uses theme foreground (readable on any surface)
  // - Priority conveyed by background + border (stronger alphas)
  // - Slightly stronger alphas for "critical/done" so they pop
  const bgAlpha =
    cfg.tone === 'danger' ? 0.42 :
    cfg.tone === 'success' ? 0.38 :
    cfg.tone === 'warning' ? 0.34 :
    cfg.tone === 'info' ? 0.32 :
    0.26

  const borderAlpha =
    cfg.tone === 'danger' ? 0.78 :
    cfg.tone === 'success' ? 0.72 :
    cfg.tone === 'warning' ? 0.70 :
    cfg.tone === 'info' ? 0.66 :
    0.55

  const style: React.CSSProperties = {
    color: 'hsl(var(--foreground) / 1)',
    backgroundColor: `hsl(${toneVar} / ${bgAlpha})`,
    borderColor: `hsl(${toneVar} / ${borderAlpha})`,
  }

  return (
    <span className={`${base} ${sz}`} style={style} title={cfg.label}>
      {showIcon ? <span aria-hidden className="text-[10px] leading-none">●</span> : null}
      {cfg.label.toUpperCase()}
    </span>
  )
}
