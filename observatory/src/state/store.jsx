/* eslint-disable react-refresh/only-export-components */
// Observatory state — run history + settings, persisted to localStorage.
// Mirrors the "all data stays local" posture of the Nexus-Lab showcase.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { runAgentAsync } from '../runtime/runtime'

const STORAGE_KEY = 'nexus-observatory:v1'
const MAX_RUNS = 40
const DEFAULT_SETTINGS = { maxToolRounds: 3 }

const ObservatoryContext = createContext(null)

function loadPersisted() {
  if (typeof window === 'undefined') return { runs: [], settings: DEFAULT_SETTINGS }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { runs: [], settings: DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw)
    return {
      runs: Array.isArray(parsed.runs) ? parsed.runs : [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    }
  } catch {
    return { runs: [], settings: DEFAULT_SETTINGS }
  }
}

export function ObservatoryProvider({ children }) {
  const persisted = useMemo(loadPersisted, [])
  const [runs, setRuns] = useState(persisted.runs)
  const [settings, setSettings] = useState(persisted.settings)
  const [activeRunId, setActiveRunId] = useState(persisted.runs[0]?.requestId ?? null)
  const [evalResults, setEvalResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ runs, settings }))
    } catch {
      // Storage may be unavailable (private mode). Keep the in-memory state.
    }
  }, [runs, settings])

  const runPrompt = useCallback(
    async (prompt) => {
      const trimmed = String(prompt || '').trim()
      if (!trimmed) return null
      const requestId = `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
      
      setIsRunning(true)
      try {
        const { answer, trace } = await runAgentAsync(trimmed, {
          requestId,
          maxToolRounds: settings.maxToolRounds,
        })
        const run = { ...trace, answer }
        setRuns((previous) => [run, ...previous].slice(0, MAX_RUNS))
        setActiveRunId(requestId)
        return run
      } finally {
        setIsRunning(false)
      }
    },
    [settings.maxToolRounds],
  )

  const clearHistory = useCallback(() => {
    setRuns([])
    setActiveRunId(null)
  }, [])

  const deleteRun = useCallback(
    (requestId) => {
      setRuns((previous) => previous.filter((run) => run.requestId !== requestId))
      setActiveRunId((current) => (current === requestId ? null : current))
    },
    [],
  )

  const updateSettings = useCallback((patch) => {
    setSettings((previous) => ({ ...previous, ...patch }))
  }, [])

  const value = useMemo(
    () => ({
      runs,
      settings,
      activeRunId,
      activeRun: runs.find((run) => run.requestId === activeRunId) || runs[0] || null,
      evalResults,
      isRunning,
      setEvalResults,
      setActiveRunId,
      runPrompt,
      clearHistory,
      deleteRun,
      updateSettings,
    }),
    [
      runs,
      settings,
      activeRunId,
      evalResults,
      isRunning,
      runPrompt,
      clearHistory,
      deleteRun,
      updateSettings,
    ],
  )

  return <ObservatoryContext.Provider value={value}>{children}</ObservatoryContext.Provider>
}

export function useObservatory() {
  const context = useContext(ObservatoryContext)
  if (!context) throw new Error('useObservatory must be used within ObservatoryProvider')
  return context
}
