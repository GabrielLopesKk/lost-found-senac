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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      claims: {
        Row: {
          code_hash: string | null
          code_issued_at: string | null
          code_used: boolean
          contact_email: string
          contact_phone: string
          created_at: string
          decided_at: string | null
          id: string
          item_id: string
          name: string
          picked_up_at: string | null
          proof: string
          ref: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          code_hash?: string | null
          code_issued_at?: string | null
          code_used?: boolean
          contact_email?: string
          contact_phone?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          item_id: string
          name: string
          picked_up_at?: string | null
          proof: string
          ref?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          code_hash?: string | null
          code_issued_at?: string | null
          code_used?: boolean
          contact_email?: string
          contact_phone?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          item_id?: string
          name?: string
          picked_up_at?: string | null
          proof?: string
          ref?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "public_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category: string
          color: string
          created_at: string
          date_found: string
          description: string
          hidden: boolean
          id: string
          location: string
          marks: string[]
          name: string
          photo_path: string | null
          ref: string
          reported_by: string | null
          sensitive: boolean
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          color: string
          created_at?: string
          date_found: string
          description: string
          hidden?: boolean
          id?: string
          location: string
          marks?: string[]
          name: string
          photo_path?: string | null
          ref?: string
          reported_by?: string | null
          sensitive?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          date_found?: string
          description?: string
          hidden?: boolean
          id?: string
          location?: string
          marks?: string[]
          name?: string
          photo_path?: string | null
          ref?: string
          reported_by?: string | null
          sensitive?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_reports: {
        Row: {
          category: string
          color: string
          contact_email: string
          contact_phone: string
          created_at: string
          date_lost: string
          description: string
          id: string
          is_open: boolean
          location: string
          name: string
          photo_path: string | null
          ref: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          color: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          date_lost: string
          description: string
          id?: string
          is_open?: boolean
          location: string
          name: string
          photo_path?: string | null
          ref?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string
          color?: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          date_lost?: string
          description?: string
          id?: string
          is_open?: boolean
          location?: string
          name?: string
          photo_path?: string | null
          ref?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          phone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
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
    }
    Views: {
      public_items: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          date_found: string | null
          description: string | null
          id: string | null
          location: string | null
          marks: string[] | null
          name: string | null
          photo_hidden: boolean | null
          photo_path: string | null
          ref: string | null
          status: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          date_found?: string | null
          description?: string | null
          id?: string | null
          location?: string | null
          marks?: string[] | null
          name?: string | null
          photo_hidden?: never
          photo_path?: never
          ref?: string | null
          status?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          date_found?: string | null
          description?: string | null
          id?: string | null
          location?: string | null
          marks?: string[] | null
          name?: string | null
          photo_hidden?: never
          photo_path?: never
          ref?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_claim: { Args: { p_claim_id: string }; Returns: undefined }
      gen_ref: { Args: { len: number; prefix: string }; Returns: string }
      get_public_stats: { Args: never; Returns: Json }
      is_item_claimable: { Args: { p_item_id: string }; Returns: boolean }
      is_public_photo: { Args: { p_path: string }; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      issue_pickup_code: { Args: { p_claim_id: string }; Returns: string }
      my_claims: {
        Args: never
        Returns: {
          code_issued_at: string
          code_used: boolean
          created_at: string
          decided_at: string
          id: string
          item_category: string
          item_id: string
          item_name: string
          item_ref: string
          item_status: string
          picked_up_at: string
          proof: string
          ref: string
          status: string
        }[]
      }
      reject_claim: { Args: { p_claim_id: string }; Returns: undefined }
      validate_pickup_code: { Args: { p_code: string }; Returns: Json }
    }
    Enums: {
      app_role: "staff" | "user"
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
      app_role: ["staff", "user"],
    },
  },
} as const
