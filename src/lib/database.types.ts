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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      contact_notes: {
        Row: {
          author_id: string | null
          contact_id: number
          created_at: string
          id: number
          note: string
        }
        Insert: {
          author_id?: string | null
          contact_id: number
          created_at?: string
          id?: never
          note: string
        }
        Update: {
          author_id?: string | null
          contact_id?: number
          created_at?: string
          id?: never
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          archived_at: string | null
          city: string | null
          contact_name: string
          contact_role: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: number
          last_contacted_date: string | null
          next_follow_up_date: string | null
          notes: string | null
          organization_name: string
          phone: string | null
          state: string | null
          status: string
          street_address: string | null
          type: string | null
          updated_at: string
          updated_by: string | null
          version: number
          zip_code: string | null
        }
        Insert: {
          archived_at?: string | null
          city?: string | null
          contact_name: string
          contact_role?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: never
          last_contacted_date?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          organization_name: string
          phone?: string | null
          state?: string | null
          status?: string
          street_address?: string | null
          type?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          zip_code?: string | null
        }
        Update: {
          archived_at?: string | null
          city?: string | null
          contact_name?: string
          contact_role?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: never
          last_contacted_date?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          organization_name?: string
          phone?: string | null
          state?: string | null
          status?: string
          street_address?: string | null
          type?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          archived_at: string | null
          city: string | null
          created_at: string
          created_by: string | null
          email: string | null
          first_name: string
          id: number
          last_name: string
          phone: string
          state: string | null
          street_address: string | null
          updated_at: string
          updated_by: string | null
          version: number
          zip_code: string | null
        }
        Insert: {
          archived_at?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name: string
          id?: never
          last_name: string
          phone: string
          state?: string | null
          street_address?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          zip_code?: string | null
        }
        Update: {
          archived_at?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string
          id?: never
          last_name?: string
          phone?: string
          state?: string | null
          street_address?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          dashboard_view: string
          full_name: string
          id: string
          role: string
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          dashboard_view?: string
          full_name: string
          id: string
          role?: string
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          dashboard_view?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          assigned_user_id: string | null
          created_at: string
          created_by: string | null
          customer_id: number
          description: string
          due_date: string
          id: number
          notification_status: string
          payment_status: string
          pickup_delivery_status: string
          project_options: string[]
          project_type: string
          status: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          assigned_user_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: number
          description?: string
          due_date: string
          id?: never
          notification_status?: string
          payment_status?: string
          pickup_delivery_status?: string
          project_options?: string[]
          project_type: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          assigned_user_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: number
          description?: string
          due_date?: string
          id?: never
          notification_status?: string
          payment_status?: string
          pickup_delivery_status?: string
          project_options?: string[]
          project_type?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_customer_and_work_order: {
        Args: {
          p_assigned_user_id?: string
          p_city?: string
          p_description?: string
          p_due_date: string
          p_email?: string
          p_first_name: string
          p_last_name: string
          p_notification_status?: string
          p_payment_status?: string
          p_phone: string
          p_pickup_delivery_status?: string
          p_project_options?: string[]
          p_project_type: string
          p_state?: string
          p_street_address?: string
          p_zip_code?: string
        }
        Returns: {
          customer_id: number
          work_order_id: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
