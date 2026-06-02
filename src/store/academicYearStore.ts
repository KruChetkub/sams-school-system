import { create } from 'zustand'
import { getAcademicYears, getActiveAcademicYear } from '../services/academicYearService'
import type { AcademicYear, Semester } from '../services/academicYearService'

interface AcademicYearState {
  years: AcademicYear[]
  selectedYear: AcademicYear | null
  selectedSemester: Semester | null
  isLoading: boolean
  
  initializeStore: () => Promise<void>
  setSelectedYear: (yearId: string) => void
  setSelectedSemester: (semesterId: string) => void
}

export const useAcademicYearStore = create<AcademicYearState>((set, get) => ({
  years: [],
  selectedYear: null,
  selectedSemester: null,
  isLoading: false,

  initializeStore: async () => {
    set({ isLoading: true })
    try {
      const allYears = await getAcademicYears()
      const { activeYear, activeSemester } = await getActiveAcademicYear()
      
      const savedYearId = localStorage.getItem('sams_selected_year_id')
      const savedSemId = localStorage.getItem('sams_selected_semester_id')
      
      let finalYear = activeYear
      let finalSem = activeSemester
      
      // activeYear จาก getActiveAcademicYear() ไม่มี semesters ติดมา
      // ต้องใช้ข้อมูลจาก allYears ที่มี semesters ครบถ้วนแทน
      if (finalYear) {
        const fullYear = allYears.find(y => y.id === finalYear!.id)
        if (fullYear) finalYear = fullYear
      }
      
      if (savedYearId) {
        const found = allYears.find(y => y.id === savedYearId)
        if (found) finalYear = found
      }
      
      if (savedSemId && finalYear) {
        const foundSem = finalYear.semesters?.find(s => s.id === savedSemId)
        if (foundSem) finalSem = foundSem
      } else if (finalYear) {
        finalSem = finalYear.semesters?.find(s => s.is_active) || finalYear.semesters?.[0] || null
      }
      
      // If we don't have an active year in database and no saved year, default to the first year in the list
      if (!finalYear && allYears.length > 0) {
        finalYear = allYears[0]
        finalSem = finalYear.semesters?.find(s => s.is_active) || finalYear.semesters?.[0] || null
      }
      
      set({ 
        years: allYears,
        selectedYear: finalYear,
        selectedSemester: finalSem,
        isLoading: false 
      })
    } catch (err) {
      console.error('Failed to initialize academic year store:', err)
      set({ isLoading: false })
    }
  },

  setSelectedYear: (yearId: string) => {
    const { years } = get()
    const found = years.find(y => y.id === yearId)
    if (found) {
      localStorage.setItem('sams_selected_year_id', yearId)
      // Find default semester for this year
      const defaultSem = found.semesters?.find(s => s.is_active) || found.semesters?.[0] || null
      if (defaultSem) {
        localStorage.setItem('sams_selected_semester_id', defaultSem.id)
      } else {
        localStorage.removeItem('sams_selected_semester_id')
      }
      set({ selectedYear: found, selectedSemester: defaultSem })
    }
  },

  setSelectedSemester: (semesterId: string) => {
    const { selectedYear } = get()
    if (selectedYear && selectedYear.semesters) {
      const found = selectedYear.semesters.find(s => s.id === semesterId)
      if (found) {
        localStorage.setItem('sams_selected_semester_id', semesterId)
        set({ selectedSemester: found })
      }
    }
  }
}))
