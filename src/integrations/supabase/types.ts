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
      client_custom_values: {
        Row: {
          client_id: string
          created_at: string | null
          field_id: string
          id: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          field_id: string
          id?: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          field_id?: string
          id?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_custom_values_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_custom_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          created_by: string | null
          document: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      custom_fields: {
        Row: {
          created_at: string | null
          created_by: string | null
          display_order: number | null
          entity_type: string
          field_type: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          name: string
          options: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          entity_type?: string
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name: string
          options?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          entity_type?: string
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name?: string
          options?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      landing_pages: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          primary_color: string | null
          responsible_id: string | null
          secondary_color: string | null
          slug: string
          success_message: string | null
          title: string
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          primary_color?: string | null
          responsible_id?: string | null
          secondary_color?: string | null
          slug: string
          success_message?: string | null
          title: string
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          primary_color?: string | null
          responsible_id?: string | null
          secondary_color?: string | null
          slug?: string
          success_message?: string | null
          title?: string
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_read: boolean | null
          can_update: boolean | null
          created_at: string | null
          id: string
          resource: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          id?: string
          resource: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          id?: string
          resource?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sac_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          sac_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          sac_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          sac_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sac_comments_sac_id_fkey"
            columns: ["sac_id"]
            isOneToOne: false
            referencedRelation: "sacs"
            referencedColumns: ["id"]
          },
        ]
      }
      sac_custom_values: {
        Row: {
          created_at: string | null
          field_id: string
          id: string
          sac_id: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          field_id: string
          id?: string
          sac_id: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          field_id?: string
          id?: string
          sac_id?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sac_custom_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sac_custom_values_sac_id_fkey"
            columns: ["sac_id"]
            isOneToOne: false
            referencedRelation: "sacs"
            referencedColumns: ["id"]
          },
        ]
      }
      sac_history: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_value: string | null
          old_value: string | null
          sac_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          sac_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          sac_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sac_history_sac_id_fkey"
            columns: ["sac_id"]
            isOneToOne: false
            referencedRelation: "sacs"
            referencedColumns: ["id"]
          },
        ]
      }
      sac_images: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          sac_id: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          sac_id: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          sac_id?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "sac_images_sac_id_fkey"
            columns: ["sac_id"]
            isOneToOne: false
            referencedRelation: "sacs"
            referencedColumns: ["id"]
          },
        ]
      }
      sac_observers: {
        Row: {
          created_at: string | null
          id: string
          sac_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          sac_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          sac_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sac_observers_sac_id_fkey"
            columns: ["sac_id"]
            isOneToOne: false
            referencedRelation: "sacs"
            referencedColumns: ["id"]
          },
        ]
      }
      sacs: {
        Row: {
          analyst_id: string | null
          client_id: string | null
          created_at: string | null
          created_by: string
          deadline: string | null
          description: string
          id: string
          nf_number: string | null
          number: number
          priority: Database["public"]["Enums"]["sac_priority"] | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["sac_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          analyst_id?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by: string
          deadline?: string | null
          description: string
          id?: string
          nf_number?: string | null
          number?: number
          priority?: Database["public"]["Enums"]["sac_priority"] | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["sac_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          analyst_id?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string
          deadline?: string | null
          description?: string
          id?: string
          nf_number?: string | null
          number?: number
          priority?: Database["public"]["Enums"]["sac_priority"] | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["sac_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sacs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workflow_stages: {
        Row: {
          color: string
          created_at: string | null
          created_by: string | null
          display_order: number
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_supervisor: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "analista" | "usuario"
      sac_priority: "baixa" | "media" | "alta" | "urgente"
      sac_status:
        | "aberto"
        | "em_andamento"
        | "aguardando_cliente"
        | "aguardando_interno"
        | "resolvido"
        | "cancelado"
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
      app_role: ["admin", "supervisor", "analista", "usuario"],
      sac_priority: ["baixa", "media", "alta", "urgente"],
      sac_status: [
        "aberto",
        "em_andamento",
        "aguardando_cliente",
        "aguardando_interno",
        "resolvido",
        "cancelado",
      ],
    },
  },
} as const
