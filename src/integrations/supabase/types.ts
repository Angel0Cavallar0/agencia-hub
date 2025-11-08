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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clickup_responsaveis: {
        Row: {
          aprovacao_arte_id: string | null
          aprovacao_video_id: string | null
          atendimento_id: string | null
          design_id: string | null
          filmmaker_id: string | null
          gerente_conta_id: string | null
          gestor_trafego_id: string | null
          id_cliente: string
          revisao_texto_id: string | null
        }
        Insert: {
          aprovacao_arte_id?: string | null
          aprovacao_video_id?: string | null
          atendimento_id?: string | null
          design_id?: string | null
          filmmaker_id?: string | null
          gerente_conta_id?: string | null
          gestor_trafego_id?: string | null
          id_cliente: string
          revisao_texto_id?: string | null
        }
        Update: {
          aprovacao_arte_id?: string | null
          aprovacao_video_id?: string | null
          atendimento_id?: string | null
          design_id?: string | null
          filmmaker_id?: string | null
          gerente_conta_id?: string | null
          gestor_trafego_id?: string | null
          id_cliente?: string
          revisao_texto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_aprovacao_arte"
            columns: ["aprovacao_arte_id"]
            isOneToOne: false
            referencedRelation: "colaborador"
            referencedColumns: ["id_clickup"]
          },
          {
            foreignKeyName: "fk_aprovacao_video"
            columns: ["aprovacao_video_id"]
            isOneToOne: false
            referencedRelation: "colaborador"
            referencedColumns: ["id_clickup"]
          },
          {
            foreignKeyName: "fk_atendimento"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "colaborador"
            referencedColumns: ["id_clickup"]
          },
          {
            foreignKeyName: "fk_cliente"
            columns: ["id_cliente"]
            isOneToOne: true
            referencedRelation: "clientes_infos"
            referencedColumns: ["id_cliente"]
          },
          {
            foreignKeyName: "fk_design"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "colaborador"
            referencedColumns: ["id_clickup"]
          },
          {
            foreignKeyName: "fk_filmmaker"
            columns: ["filmmaker_id"]
            isOneToOne: false
            referencedRelation: "colaborador"
            referencedColumns: ["id_clickup"]
          },
          {
            foreignKeyName: "fk_gerente_conta"
            columns: ["gerente_conta_id"]
            isOneToOne: false
            referencedRelation: "colaborador"
            referencedColumns: ["id_clickup"]
          },
          {
            foreignKeyName: "fk_gestor_trafego"
            columns: ["gestor_trafego_id"]
            isOneToOne: false
            referencedRelation: "colaborador"
            referencedColumns: ["id_clickup"]
          },
          {
            foreignKeyName: "fk_revisao_texto"
            columns: ["revisao_texto_id"]
            isOneToOne: false
            referencedRelation: "colaborador"
            referencedColumns: ["id_clickup"]
          },
        ]
      }
      cliente_contato: {
        Row: {
          email: string | null
          id_cliente: string | null
          id_contato: string
          id_grupo_whatsapp: string | null
          nome_cliente: string | null
          nome_contato: string | null
          numero_whatsapp: string | null
        }
        Insert: {
          email?: string | null
          id_cliente?: string | null
          id_contato?: string
          id_grupo_whatsapp?: string | null
          nome_cliente?: string | null
          nome_contato?: string | null
          numero_whatsapp?: string | null
        }
        Update: {
          email?: string | null
          id_cliente?: string | null
          id_contato?: string
          id_grupo_whatsapp?: string | null
          nome_cliente?: string | null
          nome_contato?: string | null
          numero_whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_contato_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes_infos"
            referencedColumns: ["id_cliente"]
          },
        ]
      }
      clientes_infos: {
        Row: {
          cliente_ativo: boolean | null
          cnpj: string | null
          data_contrato: string | null
          data_criacao: string | null
          data_inauguracao: string | null
          gestao_trafego: boolean | null
          id_cliente: string
          nome_cliente: string | null
          nome_responsavel: string | null
          segmento: string | null
        }
        Insert: {
          cliente_ativo?: boolean | null
          cnpj?: string | null
          data_contrato?: string | null
          data_criacao?: string | null
          data_inauguracao?: string | null
          gestao_trafego?: boolean | null
          id_cliente?: string
          nome_cliente?: string | null
          nome_responsavel?: string | null
          segmento?: string | null
        }
        Update: {
          cliente_ativo?: boolean | null
          cnpj?: string | null
          data_contrato?: string | null
          data_criacao?: string | null
          data_inauguracao?: string | null
          gestao_trafego?: boolean | null
          id_cliente?: string
          nome_cliente?: string | null
          nome_responsavel?: string | null
          segmento?: string | null
        }
        Relationships: []
      }
      clientes_listas_clickup: {
        Row: {
          data_criacao: string | null
          id: string
          id_lista: string | null
          id_pasta: string | null
          nome_lista: string | null
          nome_pasta: string | null
        }
        Insert: {
          data_criacao?: string | null
          id?: string
          id_lista?: string | null
          id_pasta?: string | null
          nome_lista?: string | null
          nome_pasta?: string | null
        }
        Update: {
          data_criacao?: string | null
          id?: string
          id_lista?: string | null
          id_pasta?: string | null
          nome_lista?: string | null
          nome_pasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_listas_clickup_id_pasta_fkey"
            columns: ["id_pasta"]
            isOneToOne: false
            referencedRelation: "clientes_pastas_clickup"
            referencedColumns: ["id_pasta"]
          },
          {
            foreignKeyName: "clientes_listas_clickup_nome_pasta_fkey"
            columns: ["nome_pasta"]
            isOneToOne: false
            referencedRelation: "clientes_pastas_clickup"
            referencedColumns: ["nome_pasta"]
          },
        ]
      }
      clientes_pastas_clickup: {
        Row: {
          data_criacao: string | null
          id: string
          id_cliente: string | null
          id_espaco: string | null
          id_pasta: string | null
          nome_cliente: string | null
          nome_espaco: string | null
          nome_pasta: string | null
        }
        Insert: {
          data_criacao?: string | null
          id?: string
          id_cliente?: string | null
          id_espaco?: string | null
          id_pasta?: string | null
          nome_cliente?: string | null
          nome_espaco?: string | null
          nome_pasta?: string | null
        }
        Update: {
          data_criacao?: string | null
          id?: string
          id_cliente?: string | null
          id_espaco?: string | null
          id_pasta?: string | null
          nome_cliente?: string | null
          nome_espaco?: string | null
          nome_pasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_pastas_clickup_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes_infos"
            referencedColumns: ["id_cliente"]
          },
          {
            foreignKeyName: "clientes_pastas_clickup_nome_cliente_fkey"
            columns: ["nome_cliente"]
            isOneToOne: false
            referencedRelation: "clientes_infos"
            referencedColumns: ["nome_cliente"]
          },
        ]
      }
      colaborador: {
        Row: {
          admin: boolean | null
          apelido: string | null
          cargo: string | null
          colab_afastado: boolean | null
          colab_ativo: boolean | null
          colab_ferias: boolean | null
          colab_desligado: boolean | null
          data_admissao: string | null
          data_aniversario: string | null
          date_created: string | null
          email_corporativo: string | null
          email_pessoal: string | null
          id_clickup: string | null
          id_colaborador: string
          id_slack: string | null
          nome: string
          sobrenome: string | null
          supervisor: boolean | null
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          admin?: boolean | null
          apelido?: string | null
          cargo?: string | null
          colab_afastado?: boolean | null
          colab_ativo?: boolean | null
          colab_ferias?: boolean | null
          colab_desligado?: boolean | null
          data_admissao?: string | null
          data_aniversario?: string | null
          date_created?: string | null
          email_corporativo?: string | null
          email_pessoal?: string | null
          id_clickup?: string | null
          id_colaborador?: string
          id_slack?: string | null
          nome: string
          sobrenome?: string | null
          supervisor?: boolean | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          admin?: boolean | null
          apelido?: string | null
          cargo?: string | null
          colab_afastado?: boolean | null
          colab_ativo?: boolean | null
          colab_ferias?: boolean | null
          colab_desligado?: boolean | null
          data_admissao?: string | null
          data_aniversario?: string | null
          date_created?: string | null
          email_corporativo?: string | null
          email_pessoal?: string | null
          id_clickup?: string | null
          id_colaborador?: string
          id_slack?: string | null
          nome?: string
          sobrenome?: string | null
          supervisor?: boolean | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      colaborador_private: {
        Row: {
          created_at: string | null
          data_aniversario: string | null
          email_pessoal: string | null
          id_colaborador: string
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string | null
          data_aniversario?: string | null
          email_pessoal?: string | null
          id_colaborador: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string | null
          data_aniversario?: string | null
          email_pessoal?: string | null
          id_colaborador?: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_private_id_colaborador_fkey"
            columns: ["id_colaborador"]
            isOneToOne: true
            referencedRelation: "colaborador"
            referencedColumns: ["id_colaborador"]
          },
        ]
      }
      global_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      informacoes_tasks_clickup: {
        Row: {
          data_atualizacao: string | null
          data_entrega: string | null
          id_colaborador_clickup: string | null
          id_lista: string | null
          id_pasta: string | null
          id_status: string | null
          id_subtask: string
          nome_colaborador: string | null
          nome_lista: string | null
          nome_pasta: string | null
          nome_subtask: string | null
          prioridade: string | null
          status: string | null
        }
        Insert: {
          data_atualizacao?: string | null
          data_entrega?: string | null
          id_colaborador_clickup?: string | null
          id_lista?: string | null
          id_pasta?: string | null
          id_status?: string | null
          id_subtask: string
          nome_colaborador?: string | null
          nome_lista?: string | null
          nome_pasta?: string | null
          nome_subtask?: string | null
          prioridade?: string | null
          status?: string | null
        }
        Update: {
          data_atualizacao?: string | null
          data_entrega?: string | null
          id_colaborador_clickup?: string | null
          id_lista?: string | null
          id_pasta?: string | null
          id_status?: string | null
          id_subtask?: string
          nome_colaborador?: string | null
          nome_lista?: string | null
          nome_pasta?: string | null
          nome_subtask?: string | null
          prioridade?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "informacoes_tasks_clickup_id_colaborador_clickup_fkey"
            columns: ["id_colaborador_clickup"]
            isOneToOne: false
            referencedRelation: "colaborador"
            referencedColumns: ["id_clickup"]
          },
          {
            foreignKeyName: "informacoes_tasks_clickup_id_lista_fkey"
            columns: ["id_lista"]
            isOneToOne: false
            referencedRelation: "clientes_listas_clickup"
            referencedColumns: ["id_lista"]
          },
          {
            foreignKeyName: "informacoes_tasks_clickup_id_pasta_fkey"
            columns: ["id_pasta"]
            isOneToOne: false
            referencedRelation: "clientes_pastas_clickup"
            referencedColumns: ["id_pasta"]
          },
        ]
      }
      system_logs: {
        Row: {
          code: string | null
          context: Json | null
          created_at: string
          id: string
          level: string
          message: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          code?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          level: string
          message: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          code?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          level?: string
          message?: string
          timestamp?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "user"
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
      app_role: ["admin", "supervisor", "user"],
    },
  },
} as const
