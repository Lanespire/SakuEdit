'use client'

import { create } from 'zustand'

export type ProjectsFilter = 'ALL' | 'PROCESSING' | 'COMPLETED' | 'ERROR'

interface ProjectsFilterState {
  status: ProjectsFilter
  setStatus: (status: ProjectsFilter) => void
}

export const useProjectsFilterStore = create<ProjectsFilterState>((set) => ({
  status: 'ALL',
  setStatus: (status) => set({ status }),
}))
