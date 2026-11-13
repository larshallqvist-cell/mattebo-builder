export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          chapter: number | null
          created_at: string
          grade: number
          id: string
          resource_title: string | null
          resource_url: string | null
          user_id: string
        }
        Insert: {
          chapter?: number | null
          created_at?: string
          grade: number
          id?: string
          resource_title?: string | null
          resource_url?: string | null
          user_id: string
        }
        Update: {
          chapter?: number | null
          created_at?: string
          grade?: number
          id?: string
          resource_title?: string | null
          resource_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      algebra_attempts: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          level: number
          mode: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          level: number
          mode: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          level?: number
          mode?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "algebra_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          expires_on: string | null
          grade: number
          size: string
          updated_at: string
        }
        Insert: {
          content?: string
          expires_on?: string | null
          grade: number
          size?: string
          updated_at?: string
        }
        Update: {
          content?: string
          expires_on?: string | null
          grade?: number
          size?: string
          updated_at?: string
        }
        Relationships: []
      }
      brak_attempts: {
        Row: {
          calculator_used: boolean
          created_at: string
          hint_used: boolean
          id: string
          is_correct: boolean
          level: number
          mode: string
          points: number
          session_id: string
          streak: number
          streak_points: number
          task_kind: string
          unsimplified: boolean
          user_id: string
        }
        Insert: {
          calculator_used?: boolean
          created_at?: string
          hint_used?: boolean
          id?: string
          is_correct: boolean
          level: number
          mode: string
          points?: number
          session_id: string
          streak?: number
          streak_points?: number
          task_kind: string
          unsimplified?: boolean
          user_id: string
        }
        Update: {
          calculator_used?: boolean
          created_at?: string
          hint_used?: boolean
          id?: string
          is_correct?: boolean
          level?: number
          mode?: string
          points?: number
          session_id?: string
          streak?: number
          streak_points?: number
          task_kind?: string
          unsimplified?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brak_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      braklabbet_attempts: {
        Row: {
          answer: string
          answered_at: string
          attempt_number: number
          exercise_id: number
          hint_used: boolean
          id: string
          is_correct: boolean
          user_id: string
        }
        Insert: {
          answer: string
          answered_at?: string
          attempt_number: number
          exercise_id: number
          hint_used?: boolean
          id: string
          is_correct: boolean
          user_id: string
        }
        Update: {
          answer?: string
          answered_at?: string
          attempt_number?: number
          exercise_id?: number
          hint_used?: boolean
          id?: string
          is_correct?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "braklabbet_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      braklabbet_progress: {
        Row: {
          completed_at: string
          mission_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          mission_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          mission_id?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_cache: {
        Row: {
          fetched_at: string
          grade: number
          ics_data: string
        }
        Insert: {
          fetched_at?: string
          grade: number
          ics_data: string
        }
        Update: {
          fetched_at?: string
          grade?: number
          ics_data?: string
        }
        Relationships: []
      }
      chapter_sections: {
        Row: {
          assessment_pulse: boolean
          chapter: number
          current_index: number | null
          grade: number
          sections: string[]
          updated_at: string
        }
        Insert: {
          assessment_pulse?: boolean
          chapter: number
          current_index?: number | null
          grade: number
          sections?: string[]
          updated_at?: string
        }
        Update: {
          assessment_pulse?: boolean
          chapter?: number
          current_index?: number | null
          grade?: number
          sections?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      class_presentations: {
        Row: {
          file_name: string | null
          file_path: string | null
          grade: number
          updated_at: string
          url: string
        }
        Insert: {
          file_name?: string | null
          file_path?: string | null
          grade: number
          updated_at?: string
          url: string
        }
        Update: {
          file_name?: string | null
          file_path?: string | null
          grade?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      ekvation_attempts: {
        Row: {
          created_at: string
          error_kind: string | null
          hint_used: boolean
          id: string
          is_correct: boolean
          level: number
          mode: string
          puzzle_id: string | null
          seconds_spent: number | null
          session_id: string
          theme: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_kind?: string | null
          hint_used?: boolean
          id?: string
          is_correct: boolean
          level: number
          mode?: string
          puzzle_id?: string | null
          seconds_spent?: number | null
          session_id: string
          theme?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_kind?: string | null
          hint_used?: boolean
          id?: string
          is_correct?: boolean
          level?: number
          mode?: string
          puzzle_id?: string | null
          seconds_spent?: number | null
          session_id?: string
          theme?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ekvation_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      google_sheet_cache: {
        Row: {
          cache_key: string
          fetched_at: string
          payload: Json
        }
        Insert: {
          cache_key: string
          fetched_at?: string
          payload: Json
        }
        Update: {
          cache_key?: string
          fetched_at?: string
          payload?: Json
        }
        Relationships: []
      }
      homework: {
        Row: {
          content: string
          grade: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          grade: number
          title?: string
          updated_at?: string
        }
        Update: {
          content?: string
          grade?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      koordinat_attempts: {
        Row: {
          created_at: string
          error_kind: string | null
          hint_used: boolean
          id: string
          is_correct: boolean
          level: number
          mode: string
          session_id: string
          streak: number
          task_kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_kind?: string | null
          hint_used?: boolean
          id?: string
          is_correct: boolean
          level: number
          mode: string
          session_id: string
          streak?: number
          task_kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_kind?: string | null
          hint_used?: boolean
          id?: string
          is_correct?: boolean
          level?: number
          mode?: string
          session_id?: string
          streak?: number
          task_kind?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "koordinat_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_notes: {
        Row: {
          content: string
          created_at: string
          event_uid: string
          grade: number
          id: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          event_uid: string
          grade: number
          id?: string
          starts_at: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          event_uid?: string
          grade?: number
          id?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_plans: {
        Row: {
          content: string
          created_at: string
          event_uid: string
          grade: number
          id: string
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          event_uid: string
          grade: number
          id?: string
          starts_at: string
          title?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          event_uid?: string
          grade?: number
          id?: string
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lunch_menu: {
        Row: {
          created_at: string
          date: string
          id: string
          menu_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          menu_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          menu_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      procent_attempts: {
        Row: {
          created_at: string
          hint_used: boolean
          id: string
          is_correct: boolean
          level: number
          mode: string
          session_id: string
          streak: number | null
          task_kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hint_used?: boolean
          id?: string
          is_correct: boolean
          level: number
          mode: string
          session_id: string
          streak?: number | null
          task_kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          hint_used?: boolean
          id?: string
          is_correct?: boolean
          level?: number
          mode?: string
          session_id?: string
          streak?: number | null
          task_kind?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procent_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          class_grade: number | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          class_grade?: number | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          class_grade?: number | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      section_presentations: {
        Row: {
          chapter: number
          file_name: string
          file_path: string
          grade: number
          section: number
          updated_at: string
        }
        Insert: {
          chapter: number
          file_name: string
          file_path: string
          grade: number
          section: number
          updated_at?: string
        }
        Update: {
          chapter?: number
          file_name?: string
          file_path?: string
          grade?: number
          section?: number
          updated_at?: string
        }
        Relationships: []
      }
      self_assessment_questions: {
        Row: {
          chapter: number
          grade: number
          questions: string[]
          section_index: number
          updated_at: string
        }
        Insert: {
          chapter: number
          grade: number
          questions?: string[]
          section_index: number
          updated_at?: string
        }
        Update: {
          chapter?: number
          grade?: number
          questions?: string[]
          section_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      self_assessment_responses: {
        Row: {
          chapter: number
          created_at: string
          grade: number
          id: string
          questions: string[]
          ratings: number[]
          section_index: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter: number
          created_at?: string
          grade: number
          id?: string
          questions: string[]
          ratings: number[]
          section_index: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter?: number
          created_at?: string
          grade?: number
          id?: string
          questions?: string[]
          ratings?: number[]
          section_index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_visits: {
        Row: {
          active_seconds: number
          id: string
          last_seen_at: string
          path: string
          started_at: string
          user_id: string
          visit_id: string
        }
        Insert: {
          active_seconds?: number
          id: string
          last_seen_at?: string
          path: string
          started_at?: string
          user_id: string
          visit_id: string
        }
        Update: {
          active_seconds?: number
          id?: string
          last_seen_at?: string
          path?: string
          started_at?: string
          user_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_visits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          created_at: string
          id: string
          learned_text: string
          q_calm: number
          q_effort: number
          q_learning: number
          q_teacher: number
          survey_id: string
          updated_at: string
          user_id: string
          wish_text: string
        }
        Insert: {
          created_at?: string
          id?: string
          learned_text?: string
          q_calm: number
          q_effort: number
          q_learning: number
          q_teacher: number
          survey_id: string
          updated_at?: string
          user_id: string
          wish_text?: string
        }
        Update: {
          created_at?: string
          id?: string
          learned_text?: string
          q_calm?: number
          q_effort?: number
          q_learning?: number
          q_teacher?: number
          survey_id?: string
          updated_at?: string
          user_id?: string
          wish_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "weekly_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      tabelltest_results: {
        Row: {
          avg_time_ms: number
          created_at: string
          id: string
          input_mode: string
          passed: boolean
          score: number
          total: number
          user_id: string
        }
        Insert: {
          avg_time_ms: number
          created_at?: string
          id?: string
          input_mode?: string
          passed: boolean
          score: number
          total?: number
          user_id: string
        }
        Update: {
          avg_time_ms?: number
          created_at?: string
          id?: string
          input_mode?: string
          passed?: boolean
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tabelltest_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tabelltest_sessions: {
        Row: {
          finished_at: string | null
          id: string
          input_mode: string
          questions: Json
          started_at: string
          user_id: string
        }
        Insert: {
          finished_at?: string | null
          id?: string
          input_mode: string
          questions: Json
          started_at?: string
          user_id: string
        }
        Update: {
          finished_at?: string | null
          id?: string
          input_mode?: string
          questions?: Json
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tabelltest_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_surveys: {
        Row: {
          closed_at: string | null
          created_at: string
          grade: number
          id: string
          is_open: boolean
          opened_at: string
          updated_at: string
          week_start: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          grade: number
          id?: string
          is_open?: boolean
          opened_at?: string
          updated_at?: string
          week_start: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          grade?: number
          id?: string
          is_open?: boolean
          opened_at?: string
          updated_at?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_student_directory: {
        Args: never
        Returns: {
          full_name: string
          last_sign_in_at: string
          user_id: string
        }[]
      }
      brak_leaderboard: {
        Args: never
        Returns: {
          best: number
          is_me: boolean
          name: string
          place: number
          scope: number
        }[]
      }
      fill_missing_classes: { Args: never; Returns: number }
      finish_tabelltest: {
        Args: {
          p_answers: number[]
          p_session_id: string
          p_times_ms: number[]
        }
        Returns: Json
      }
      first_recorded_grade: { Args: { p_user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      koordinat_leaderboard: {
        Args: { p_mode: string }
        Returns: {
          best: number
          is_me: boolean
          name: string
          place: number
          scope: number
        }[]
      }
      procent_leaderboard: {
        Args: { p_mode: string }
        Returns: {
          best: number
          is_me: boolean
          name: string
          place: number
          scope: number
        }[]
      }
      record_braklabbet_attempt: {
        Args: {
          p_answer: string
          p_exercise_id: number
          p_hint_used: boolean
          p_id: string
          p_is_correct: boolean
          p_user_id: string
        }
        Returns: {
          answer: string
          answered_at: string
          attempt_number: number
          exercise_id: number
          hint_used: boolean
          id: string
          is_correct: boolean
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "braklabbet_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_student_visit: {
        Args: {
          p_active_seconds: number
          p_id: string
          p_path: string
          p_visit_id: string
        }
        Returns: undefined
      }
      start_tabelltest: { Args: { p_input_mode: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
