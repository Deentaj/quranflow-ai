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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          action_type: string
          ayah_reference: string | null
          created_at: string
          date: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          ayah_reference?: string | null
          created_at?: string
          date?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          ayah_reference?: string | null
          created_at?: string
          date?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      ai_chats: {
        Row: {
          ai_response: string
          bookmarked: boolean | null
          created_at: string
          id: string
          user_id: string
          user_message: string
        }
        Insert: {
          ai_response: string
          bookmarked?: boolean | null
          created_at?: string
          id?: string
          user_id: string
          user_message: string
        }
        Update: {
          ai_response?: string
          bookmarked?: boolean | null
          created_at?: string
          id?: string
          user_id?: string
          user_message?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          content: Json
          created_at: string
          id: string
          reference: string | null
          type: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          reference?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          reference?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_type: string
          completed: boolean | null
          created_at: string
          current_value: number
          date: string
          description: string
          id: string
          target_value: number
          title: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          challenge_type: string
          completed?: boolean | null
          created_at?: string
          current_value?: number
          date?: string
          description: string
          id?: string
          target_value?: number
          title: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          challenge_type?: string
          completed?: boolean | null
          created_at?: string
          current_value?: number
          date?: string
          description?: string
          id?: string
          target_value?: number
          title?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          completed: boolean | null
          created_at: string
          deadline: string | null
          id: string
          progress: number
          target_type: string
          target_value: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          deadline?: string | null
          id?: string
          progress?: number
          target_type: string
          target_value?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          deadline?: string | null
          id?: string
          progress?: number
          target_type?: string
          target_value?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      moods: {
        Row: {
          created_at: string
          date: string
          id: string
          mood: Database["public"]["Enums"]["mood_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          mood: Database["public"]["Enums"]["mood_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          mood?: Database["public"]["Enums"]["mood_type"]
          user_id?: string
        }
        Relationships: []
      }
      onboarding_answers: {
        Row: {
          created_at: string
          daily_time: string | null
          help_needed: string | null
          id: string
          spiritual_state: string | null
          user_id: string
          why_here: string | null
        }
        Insert: {
          created_at?: string
          daily_time?: string | null
          help_needed?: string | null
          id?: string
          spiritual_state?: string | null
          user_id: string
          why_here?: string | null
        }
        Update: {
          created_at?: string
          daily_time?: string | null
          help_needed?: string | null
          id?: string
          spiritual_state?: string | null
          user_id?: string
          why_here?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          current_streak: number | null
          daily_goal: number | null
          full_name: string
          id: string
          last_active_date: string | null
          longest_streak: number | null
          onboarding_completed: boolean | null
          preferred_language: string | null
          reminder_enabled: boolean | null
          reminder_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          daily_goal?: number | null
          full_name?: string
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          onboarding_completed?: boolean | null
          preferred_language?: string | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          daily_goal?: number | null
          full_name?: string
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          onboarding_completed?: boolean | null
          preferred_language?: string | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          last_read_at: string | null
          last_verse_read: number
          surah_number: number
          total_verses: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          last_read_at?: string | null
          last_verse_read?: number
          surah_number: number
          total_verses: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          last_read_at?: string | null
          last_verse_read?: number
          surah_number?: number
          total_verses?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reconnect_sessions: {
        Row: {
          ayah_reference: string | null
          completed: boolean | null
          content: Json | null
          created_at: string
          date: string
          id: string
          user_id: string
        }
        Insert: {
          ayah_reference?: string | null
          completed?: boolean | null
          content?: Json | null
          created_at?: string
          date?: string
          id?: string
          user_id: string
        }
        Update: {
          ayah_reference?: string | null
          completed?: boolean | null
          content?: Json | null
          created_at?: string
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      reflection_reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: string
          reflection_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type?: string
          reflection_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: string
          reflection_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflection_reactions_reflection_id_fkey"
            columns: ["reflection_id"]
            isOneToOne: false
            referencedRelation: "reflections"
            referencedColumns: ["id"]
          },
        ]
      }
      reflections: {
        Row: {
          ayah_reference: string | null
          created_at: string
          date: string
          id: string
          is_public: boolean
          mood: Database["public"]["Enums"]["mood_type"] | null
          reflection_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ayah_reference?: string | null
          created_at?: string
          date?: string
          id?: string
          is_public?: boolean
          mood?: Database["public"]["Enums"]["mood_type"] | null
          reflection_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ayah_reference?: string | null
          created_at?: string
          date?: string
          id?: string
          is_public?: boolean
          mood?: Database["public"]["Enums"]["mood_type"] | null
          reflection_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      mood_type:
        | "stressed"
        | "calm"
        | "tired"
        | "hopeful"
        | "grateful"
        | "unmotivated"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      mood_type: [
        "stressed",
        "calm",
        "tired",
        "hopeful",
        "grateful",
        "unmotivated",
      ],
    },
  },
} as const
