import type { ReactNode } from 'react'
import { SimContext } from './SimContext'
import { useSimulation } from '../hooks/useSimulation'

export function SimProvider({ children }: { children: ReactNode }) {
  const sim = useSimulation()
  return (
    <SimContext.Provider value={sim}>
      {children}
    </SimContext.Provider>
  )
}
