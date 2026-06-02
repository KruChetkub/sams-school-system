import { supabase } from '../../lib/supabase';
import { studentSupportService } from './studentSupportService';

export interface BehaviorPoint {
  id?: string;
  student_id: string;
  academic_year_id?: string;
  semester_id?: string;
  type: 'PLUS' | 'MINUS';
  points: number;
  category: string;
  description?: string;
  incident_date: string;
  recorded_by?: string;
  created_at?: string;
  teacher?: {
    first_name: string;
    last_name: string;
  };
}

export const behaviorService = {
  getStudentBehaviorPoints: async (studentId: string, academicYearId?: string) => {
    try {
      let query = supabase
        .from('student_behavior_points')
        .select(`
          *,
          teacher:recorded_by (first_name, last_name)
        `)
        .eq('student_id', studentId);

      if (academicYearId) {
        query = query.eq('academic_year_id', academicYearId);
      }

      const { data, error } = await query.order('incident_date', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      return data as BehaviorPoint[];
    } catch (err) {
      console.error('Error in getStudentBehaviorPoints:', err);
      throw err;
    }
  },

  getStudentBehaviorSummary: async (studentId: string, academicYearId?: string) => {
    try {
      let query = supabase
        .from('student_behavior_points')
        .select('type, points')
        .eq('student_id', studentId);

      if (academicYearId) {
        query = query.eq('academic_year_id', academicYearId);
      }

      const { data, error } = await query;
      if (error) throw error;

      let plusSum = 0;
      let minusSum = 0;
      (data || []).forEach(item => {
        if (item.type === 'PLUS') {
          plusSum += item.points;
        } else if (item.type === 'MINUS') {
          minusSum += item.points;
        }
      });

      const netScore = Math.max(0, 100 + plusSum - minusSum);
      return {
        plusSum,
        minusSum,
        netScore
      };
    } catch (err) {
      console.error('Error in getStudentBehaviorSummary:', err);
      throw err;
    }
  },

  addBehaviorPoint: async (point: Partial<BehaviorPoint>) => {
    try {
      // 1. ดึง Active Academic Year / Semester หากไม่ได้ระบุ
      let yearId = point.academic_year_id;
      let semesterId = point.semester_id;
      
      if (!yearId || !semesterId) {
        const { data: activeYear } = await supabase
          .from('academic_years')
          .select('id')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (activeYear) {
          yearId = yearId || activeYear.id;
          
          if (!semesterId) {
            const { data: activeSemester } = await supabase
              .from('semesters')
              .select('id')
              .eq('academic_year_id', activeYear.id)
              .eq('is_active', true)
              .limit(1)
              .maybeSingle();
            if (activeSemester) {
              semesterId = activeSemester.id;
            }
          }
        }
      }

      const payload = {
        ...point,
        academic_year_id: yearId,
        semester_id: semesterId
      };

      const { data, error } = await supabase
        .from('student_behavior_points')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // 2. สั่งอัปเดตระดับความเสี่ยงภาพรวม 360° ทันที
      await studentSupportService.updateOverallRiskAnalysis(point.student_id!, yearId);

      return data;
    } catch (err) {
      console.error('Error in addBehaviorPoint:', err);
      throw err;
    }
  },

  deleteBehaviorPoint: async (id: string, studentId: string, academicYearId?: string) => {
    try {
      const { error } = await supabase
        .from('student_behavior_points')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // สั่งอัปเดตระดับความเสี่ยงภาพรวม 360° ทันที
      await studentSupportService.updateOverallRiskAnalysis(studentId, academicYearId);
    } catch (err) {
      console.error('Error in deleteBehaviorPoint:', err);
      throw err;
    }
  }
};
