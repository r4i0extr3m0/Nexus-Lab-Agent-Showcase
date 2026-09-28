// Presentation helpers shared across the Observatory panels.

export function formatMs(value) {
  if (value === null || value === undefined) return '—'
  if (value < 1) return '<1 ms'
  if (value < 1000) return `${Math.round(value)} ms`
  return `${(value / 1000).toFixed(2)} s`
}

export function formatClock(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '—'
  }
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

export function prettyJson(value) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function truncate(text, max = 120) {
  const value = String(text || '')
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

export const STATUS_TONE = {
  SUCCESS: 'signal',
  FAILED: 'alert',
  RUNNING: 'flare',
  OK: 'signal',
  ERROR: 'alert',
  COMPLETE: 'pulse',
  FINAL: 'aurora',
}

export function statusTone(status) {
  return STATUS_TONE[status] || 'star'
}
