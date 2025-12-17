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
      chat_messages: {
        Row: {
          audio_transcription: string | null
          audio_url: string | null
          chat_id: string
          chat_name: string | null
          created_at: string | null
          direcao: string
          document_url: string | null
          encaminhado: boolean | null
          foto_contato: string | null
          id: string
          image_url: string | null
          is_edited: boolean | null
          is_group: boolean | null
          message: string | null
          message_id: string
          numero_wpp: string | null
          read_status: boolean
          reference_message_id: string | null
          video_url: string | null
        }
        Insert: {
          audio_transcription?: string | null
          audio_url?: string | null
          chat_id: string
          chat_name?: string | null
          created_at?: string | null
          direcao: string
          document_url?: string | null
          encaminhado?: boolean | null
          foto_contato?: string | null
          id?: string
          image_url?: string | null
          is_edited?: boolean | null
          is_group?: boolean | null
          message?: string | null
          message_id: string
          numero_wpp?: string | null
          read_status?: boolean
          reference_message_id?: string | null
          video_url?: string | null
        }
        Update: {
          audio_transcription?: string | null
          audio_url?: string | null
          chat_id?: string
          chat_name?: string | null
          created_at?: string | null
          direcao?: string
          document_url?: string | null
          encaminhado?: boolean | null
          foto_contato?: string | null
          id?: string
          image_url?: string | null
          is_edited?: boolean | null
          is_group?: boolean | null
          message?: string | null
          message_id?: string
          numero_wpp?: string | null
          read_status?: boolean
          reference_message_id?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
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
          colab_desligado: boolean | null
          colab_ferias: boolean | null
          data_admissao: string | null
          data_aniversario: string | null
          data_desligamento: string | null
          date_created: string | null
          email_corporativo: string | null
          foto_url: string | null
          id_clickup: string | null
          id_colaborador: string
          id_slack: string | null
          nome: string
          sobrenome: string | null
          supervisor: boolean | null
          user_id: string | null
        }
        Insert: {
          admin?: boolean | null
          apelido?: string | null
          cargo?: string | null
          colab_afastado?: boolean | null
          colab_ativo?: boolean | null
          colab_desligado?: boolean | null
          colab_ferias?: boolean | null
          data_admissao?: string | null
          data_aniversario?: string | null
          data_desligamento?: string | null
          date_created?: string | null
          email_corporativo?: string | null
          foto_url?: string | null
          id_clickup?: string | null
          id_colaborador?: string
          id_slack?: string | null
          nome: string
          sobrenome?: string | null
          supervisor?: boolean | null
          user_id?: string | null
        }
        Update: {
          admin?: boolean | null
          apelido?: string | null
          cargo?: string | null
          colab_afastado?: boolean | null
          colab_ativo?: boolean | null
          colab_desligado?: boolean | null
          colab_ferias?: boolean | null
          data_admissao?: string | null
          data_aniversario?: string | null
          data_desligamento?: string | null
          date_created?: string | null
          email_corporativo?: string | null
          foto_url?: string | null
          id_clickup?: string | null
          id_colaborador?: string
          id_slack?: string | null
          nome?: string
          sobrenome?: string | null
          supervisor?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      colaborador_private: {
        Row: {
          contato_emergencia: Json | null
          cpf: string | null
          created_at: string | null
          data_aniversario: string | null
          email_pessoal: string | null
          endereco: string | null
          foto_url: string | null
          id_colaborador: string
          rg: string | null
          telefone_pessoal: string | null
          updated_at: string | null
        }
        Insert: {
          contato_emergencia?: Json | null
          cpf?: string | null
          created_at?: string | null
          data_aniversario?: string | null
          email_pessoal?: string | null
          endereco?: string | null
          foto_url?: string | null
          id_colaborador: string
          rg?: string | null
          telefone_pessoal?: string | null
          updated_at?: string | null
        }
        Update: {
          contato_emergencia?: Json | null
          cpf?: string | null
          created_at?: string | null
          data_aniversario?: string | null
          email_pessoal?: string | null
          endereco?: string | null
          foto_url?: string | null
          id_colaborador?: string
          rg?: string | null
          telefone_pessoal?: string | null
          updated_at?: string | null
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
      crm_companies: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          created_by: string | null
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deal_notes: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          deal_id: string
          id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          deal_id: string
          id?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          deal_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_deal_notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          closed_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          expected_close_date: string | null
          id: string
          notes: string | null
          owner_id: string
          pipeline_id: string
          stage_id: string
          status: string | null
          title: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          closed_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          owner_id: string
          pipeline_id: string
          stage_id: string
          status?: string | null
          title: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          closed_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          pipeline_id?: string
          stage_id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          order_index: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          order_index?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          order_index?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      crm_stages: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_lost: boolean | null
          is_won: boolean | null
          name: string
          order_index: number | null
          pipeline_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_lost?: boolean | null
          is_won?: boolean | null
          name: string
          order_index?: number | null
          pipeline_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_lost?: boolean | null
          is_won?: boolean | null
          name?: string
          order_index?: number | null
          pipeline_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
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
      group_messages: {
        Row: {
          audio_transcription: string | null
          audio_url: string | null
          created_at: string | null
          direcao: string | null
          document_url: string | null
          encaminhada: boolean
          group_id: string | null
          group_name: string | null
          group_photo: string | null
          id: string
          image_url: string | null
          is_edited: boolean
          is_group: boolean
          message: string | null
          message_id: string | null
          nome_wpp: string | null
          read_status: boolean
          sender_phone: string | null
          video_url: string | null
        }
        Insert: {
          audio_transcription?: string | null
          audio_url?: string | null
          created_at?: string | null
          direcao?: string | null
          document_url?: string | null
          encaminhada: boolean
          group_id?: string | null
          group_name?: string | null
          group_photo?: string | null
          id?: string
          image_url?: string | null
          is_edited: boolean
          is_group: boolean
          message?: string | null
          message_id?: string | null
          nome_wpp?: string | null
          read_status?: boolean
          sender_phone?: string | null
          video_url?: string | null
        }
        Update: {
          audio_transcription?: string | null
          audio_url?: string | null
          created_at?: string | null
          direcao?: string | null
          document_url?: string | null
          encaminhada?: boolean
          group_id?: string | null
          group_name?: string | null
          group_photo?: string | null
          id?: string
          image_url?: string | null
          is_edited?: boolean
          is_group?: boolean
          message?: string | null
          message_id?: string | null
          nome_wpp?: string | null
          read_status?: boolean
          sender_phone?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      informacoes_tasks_clickup: {
        Row: {
          audiovisual: boolean | null
          data_atualizacao: string | null
          data_entrega: string | null
          design: boolean | null
          id_colaborador_clickup: string | null
          id_lista: string | null
          id_pasta: string | null
          id_status: string | null
          id_subtask: string
          nome_colaborador: string | null
          nome_lista: string | null
          nome_pasta: string | null
          nome_subtask: string | null
          planejamento: boolean | null
          prioridade: string | null
          status: string | null
        }
        Insert: {
          audiovisual?: boolean | null
          data_atualizacao?: string | null
          data_entrega?: string | null
          design?: boolean | null
          id_colaborador_clickup?: string | null
          id_lista?: string | null
          id_pasta?: string | null
          id_status?: string | null
          id_subtask: string
          nome_colaborador?: string | null
          nome_lista?: string | null
          nome_pasta?: string | null
          nome_subtask?: string | null
          planejamento?: boolean | null
          prioridade?: string | null
          status?: string | null
        }
        Update: {
          audiovisual?: boolean | null
          data_atualizacao?: string | null
          data_entrega?: string | null
          design?: boolean | null
          id_colaborador_clickup?: string | null
          id_lista?: string | null
          id_pasta?: string | null
          id_status?: string | null
          id_subtask?: string
          nome_colaborador?: string | null
          nome_lista?: string | null
          nome_pasta?: string | null
          nome_subtask?: string | null
          planejamento?: boolean | null
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
      meeting_transcriptions: {
        Row: {
          created_at: string
          decisoes_tomadas: string | null
          id: number
          id_cliente: string | null
          meeting_date: string | null
          pendencias_de_confirmacao: string | null
          pontos_debatidos: string | null
          resumo_executivo: string | null
          riscos_e_alertas: string | null
          tarefas_proximos_passos: string | null
          topicos_de_servico: string | null
        }
        Insert: {
          created_at?: string
          decisoes_tomadas?: string | null
          id?: number
          id_cliente?: string | null
          meeting_date?: string | null
          pendencias_de_confirmacao?: string | null
          pontos_debatidos?: string | null
          resumo_executivo?: string | null
          riscos_e_alertas?: string | null
          tarefas_proximos_passos?: string | null
          topicos_de_servico?: string | null
        }
        Update: {
          created_at?: string
          decisoes_tomadas?: string | null
          id?: number
          id_cliente?: string | null
          meeting_date?: string | null
          pendencias_de_confirmacao?: string | null
          pontos_debatidos?: string | null
          resumo_executivo?: string | null
          riscos_e_alertas?: string | null
          tarefas_proximos_passos?: string | null
          topicos_de_servico?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_transcriptions_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes_infos"
            referencedColumns: ["id_cliente"]
          },
        ]
      }
      status_clickup: {
        Row: {
          data_criacao: string | null
          reg: number
          status: string
        }
        Insert: {
          data_criacao?: string | null
          reg?: number
          status: string
        }
        Update: {
          data_criacao?: string | null
          reg?: number
          status?: string
        }
        Relationships: []
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
          crm_access: boolean | null
          crm_access_level:
            | Database["public"]["Enums"]["crm_access_level_enum"]
            | null
          id: string
          role: Database["public"]["Enums"]["app_role"] | null
          user_id: string
          wpp_acess: boolean | null
        }
        Insert: {
          created_at?: string | null
          crm_access?: boolean | null
          crm_access_level?:
            | Database["public"]["Enums"]["crm_access_level_enum"]
            | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id: string
          wpp_acess?: boolean | null
        }
        Update: {
          created_at?: string | null
          crm_access?: boolean | null
          crm_access_level?:
            | Database["public"]["Enums"]["crm_access_level_enum"]
            | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string
          wpp_acess?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _chat_messages_user_has_wpp_acess: { Args: never; Returns: boolean }
      get_current_user_role: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      user_can_manage_app_data: { Args: never; Returns: boolean }
      user_can_view_app_data: { Args: never; Returns: boolean }
      user_deal_ids: { Args: never; Returns: string[] }
      user_has_any_role: {
        Args: { required_roles: Database["public"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      user_has_crm_access: { Args: never; Returns: boolean }
      user_is_crm_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "supervisor" | "assistent" | "basic"
      crm_access_level_enum:
        | "admin"
        | "gerente"
        | "supervisor"
        | "assistente"
        | "negado"
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
      app_role: ["admin", "manager", "supervisor", "assistent", "basic"],
      crm_access_level_enum: [
        "admin",
        "gerente",
        "supervisor",
        "assistente",
        "negado",
      ],
    },
  },
} as const
