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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          id: string
          justification: string
          module_key: string
          organization_id: string
          permissions: Json
          requested_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          justification: string
          module_key: string
          organization_id: string
          permissions: Json
          requested_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          justification?: string
          module_key?: string
          organization_id?: string
          permissions?: Json
          requested_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action_type: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          org_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          org_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          org_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type: string
          org_id: string | null
          read_at: string | null
          severity: string
          title: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type: string
          org_id?: string | null
          read_at?: string | null
          severity?: string
          title: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type?: string
          org_id?: string | null
          read_at?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_integrations: {
        Row: {
          api_key_encrypted: string | null
          api_url: string | null
          created_at: string
          id: string
          integration_name: string
          integration_type: string
          is_active: boolean
          last_sync_at: string | null
          org_id: string
          sync_frequency: number | null
          updated_at: string
        }
        Insert: {
          api_key_encrypted?: string | null
          api_url?: string | null
          created_at?: string
          id?: string
          integration_name: string
          integration_type: string
          is_active?: boolean
          last_sync_at?: string | null
          org_id: string
          sync_frequency?: number | null
          updated_at?: string
        }
        Update: {
          api_key_encrypted?: string | null
          api_url?: string | null
          created_at?: string
          id?: string
          integration_name?: string
          integration_type?: string
          is_active?: boolean
          last_sync_at?: string | null
          org_id?: string
          sync_frequency?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      appointment_types: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          appointment_type_id: string | null
          created_at: string
          created_by: string
          customer_id: string | null
          id: string
          is_completed: boolean
          is_task: boolean
          notes: string | null
          opportunity: string | null
          org_id: string
          remind_responsible: boolean
          responsible: string
          title: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          appointment_type_id?: string | null
          created_at?: string
          created_by: string
          customer_id?: string | null
          id?: string
          is_completed?: boolean
          is_task?: boolean
          notes?: string | null
          opportunity?: string | null
          org_id: string
          remind_responsible?: boolean
          responsible: string
          title: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          appointment_type_id?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string | null
          id?: string
          is_completed?: boolean
          is_task?: boolean
          notes?: string | null
          opportunity?: string | null
          org_id?: string
          remind_responsible?: boolean
          responsible?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_policies: {
        Row: {
          cost_center: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          org_id: string
          policy_name: string
          updated_at: string
        }
        Insert: {
          cost_center?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          org_id: string
          policy_name: string
          updated_at?: string
        }
        Update: {
          cost_center?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          org_id?: string
          policy_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      approval_policy_levels: {
        Row: {
          approver_count: number
          created_at: string
          id: string
          level_name: string
          level_order: number
          max_amount: number | null
          min_amount: number
          policy_id: string
          required_role: string | null
          timeout_days: number | null
        }
        Insert: {
          approver_count?: number
          created_at?: string
          id?: string
          level_name: string
          level_order: number
          max_amount?: number | null
          min_amount?: number
          policy_id: string
          required_role?: string | null
          timeout_days?: number | null
        }
        Update: {
          approver_count?: number
          created_at?: string
          id?: string
          level_name?: string
          level_order?: number
          max_amount?: number | null
          min_amount?: number
          policy_id?: string
          required_role?: string | null
          timeout_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_policy_levels_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "approval_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_trail: {
        Row: {
          action: string
          entity_id: string
          entity_type: string
          event_timestamp: string
          field_name: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          org_id: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          entity_id: string
          entity_type: string
          event_timestamp?: string
          field_name?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          org_id: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          entity_id?: string
          entity_type?: string
          event_timestamp?: string
          field_name?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          org_id?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_digit: string | null
          account_number: string
          account_type: string
          agency: string | null
          agency_digit: string | null
          balance: number
          bank_can_protest: boolean | null
          bank_can_return: boolean | null
          bank_code: string | null
          bank_name: string
          company_id: string | null
          created_at: string
          discount_until_due: number | null
          emit_boletos_erp: boolean | null
          emit_with_receipt: boolean | null
          enable_pix_sales: boolean | null
          fine_percentage: number | null
          id: string
          initial_number: number | null
          is_active: boolean
          monthly_interest: number | null
          org_id: string
          payment_instruction_after_due: string | null
          updated_at: string
        }
        Insert: {
          account_digit?: string | null
          account_number: string
          account_type?: string
          agency?: string | null
          agency_digit?: string | null
          balance?: number
          bank_can_protest?: boolean | null
          bank_can_return?: boolean | null
          bank_code?: string | null
          bank_name: string
          company_id?: string | null
          created_at?: string
          discount_until_due?: number | null
          emit_boletos_erp?: boolean | null
          emit_with_receipt?: boolean | null
          enable_pix_sales?: boolean | null
          fine_percentage?: number | null
          id?: string
          initial_number?: number | null
          is_active?: boolean
          monthly_interest?: number | null
          org_id: string
          payment_instruction_after_due?: string | null
          updated_at?: string
        }
        Update: {
          account_digit?: string | null
          account_number?: string
          account_type?: string
          agency?: string | null
          agency_digit?: string | null
          balance?: number
          bank_can_protest?: boolean | null
          bank_can_return?: boolean | null
          bank_code?: string | null
          bank_name?: string
          company_id?: string | null
          created_at?: string
          discount_until_due?: number | null
          emit_boletos_erp?: boolean | null
          emit_with_receipt?: boolean | null
          enable_pix_sales?: boolean | null
          fine_percentage?: number | null
          id?: string
          initial_number?: number | null
          is_active?: boolean
          monthly_interest?: number | null
          org_id?: string
          payment_instruction_after_due?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_bank_accounts_company_id"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_wallets: {
        Row: {
          add_fee_to_amount: boolean | null
          agreement_number: string | null
          bank_account_id: string
          created_at: string
          fee: number | null
          id: string
          is_default: boolean | null
          name: string
          org_id: string
          updated_at: string
          with_registration: boolean | null
        }
        Insert: {
          add_fee_to_amount?: boolean | null
          agreement_number?: string | null
          bank_account_id: string
          created_at?: string
          fee?: number | null
          id?: string
          is_default?: boolean | null
          name: string
          org_id: string
          updated_at?: string
          with_registration?: boolean | null
        }
        Update: {
          add_fee_to_amount?: boolean | null
          agreement_number?: string | null
          bank_account_id?: string
          created_at?: string
          fee?: number | null
          id?: string
          is_default?: boolean | null
          name?: string
          org_id?: string
          updated_at?: string
          with_registration?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_wallets_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      blockchain_alerts: {
        Row: {
          alert_type: string
          block_id: string | null
          block_number: number | null
          created_at: string
          details: Json | null
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          is_read: boolean | null
          is_resolved: boolean | null
          message: string
          org_id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          alert_type: string
          block_id?: string | null
          block_number?: number | null
          created_at?: string
          details?: Json | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message: string
          org_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Update: {
          alert_type?: string
          block_id?: string | null
          block_number?: number | null
          created_at?: string
          details?: Json | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message?: string
          org_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_alerts_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blockchain_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blockchain_alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      blockchain_records: {
        Row: {
          block_number: number
          created_at: string
          current_hash: string
          data_snapshot: Json
          id: string
          is_valid: boolean | null
          org_id: string
          previous_hash: string
          record_id: string
          table_name: string
          timestamp: string
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          block_number?: number
          created_at?: string
          current_hash: string
          data_snapshot: Json
          id?: string
          is_valid?: boolean | null
          org_id: string
          previous_hash: string
          record_id: string
          table_name: string
          timestamp?: string
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          block_number?: number
          created_at?: string
          current_hash?: string
          data_snapshot?: Json
          id?: string
          is_valid?: boolean | null
          org_id?: string
          previous_hash?: string
          record_id?: string
          table_name?: string
          timestamp?: string
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_alerts: {
        Row: {
          alert_type: string
          budget_id: string
          created_at: string
          id: string
          is_triggered: boolean
          message: string | null
          threshold_percentage: number | null
          triggered_at: string | null
        }
        Insert: {
          alert_type: string
          budget_id: string
          created_at?: string
          id?: string
          is_triggered?: boolean
          message?: string | null
          threshold_percentage?: number | null
          triggered_at?: string | null
        }
        Update: {
          alert_type?: string
          budget_id?: string
          created_at?: string
          id?: string
          is_triggered?: boolean
          message?: string | null
          threshold_percentage?: number | null
          triggered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_alerts_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "purchase_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_monthly_breakdown: {
        Row: {
          budget_id: string
          created_at: string
          id: string
          month: number
          planned_amount: number
          spent_amount: number
          updated_at: string
        }
        Insert: {
          budget_id: string
          created_at?: string
          id?: string
          month: number
          planned_amount?: number
          spent_amount?: number
          updated_at?: string
        }
        Update: {
          budget_id?: string
          created_at?: string
          id?: string
          month?: number
          planned_amount?: number
          spent_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_monthly_breakdown_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "purchase_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      business_alerts: {
        Row: {
          alert_type: string
          condition: string
          config: Json | null
          created_at: string
          id: string
          is_active: boolean
          last_triggered_at: string | null
          notify_users: string[] | null
          org_id: string
          threshold: number | null
          updated_at: string
        }
        Insert: {
          alert_type: string
          condition: string
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          notify_users?: string[] | null
          org_id: string
          threshold?: number | null
          updated_at?: string
        }
        Update: {
          alert_type?: string
          condition?: string
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          notify_users?: string[] | null
          org_id?: string
          threshold?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      caixa_movimentacoes: {
        Row: {
          created_at: string
          created_by: string
          descricao: string
          id: string
          observacoes: string | null
          org_id: string
          reference_id: string | null
          reference_type: string | null
          sessao_id: string | null
          tipo: string
          valor: number
        }
        Insert: {
          created_at?: string
          created_by: string
          descricao: string
          id?: string
          observacoes?: string | null
          org_id: string
          reference_id?: string | null
          reference_type?: string | null
          sessao_id?: string | null
          tipo: string
          valor: number
        }
        Update: {
          created_at?: string
          created_by?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          org_id?: string
          reference_id?: string | null
          reference_type?: string | null
          sessao_id?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: []
      }
      caixa_sessoes: {
        Row: {
          abertura_em: string
          created_at: string
          diferenca: number | null
          fechamento_em: string | null
          id: string
          observacoes_fechamento: string | null
          org_id: string
          status: string
          updated_at: string
          usuario_abertura: string
          usuario_fechamento: string | null
          valor_atual: number
          valor_contado: number | null
          valor_inicial: number
        }
        Insert: {
          abertura_em?: string
          created_at?: string
          diferenca?: number | null
          fechamento_em?: string | null
          id?: string
          observacoes_fechamento?: string | null
          org_id: string
          status?: string
          updated_at?: string
          usuario_abertura: string
          usuario_fechamento?: string | null
          valor_atual?: number
          valor_contado?: number | null
          valor_inicial?: number
        }
        Update: {
          abertura_em?: string
          created_at?: string
          diferenca?: number | null
          fechamento_em?: string | null
          id?: string
          observacoes_fechamento?: string | null
          org_id?: string
          status?: string
          updated_at?: string
          usuario_abertura?: string
          usuario_fechamento?: string | null
          valor_atual?: number
          valor_contado?: number | null
          valor_inicial?: number
        }
        Relationships: []
      }
      cash_flow_projections: {
        Row: {
          bank_account_id: string | null
          company_id: string | null
          confidence_level: number
          created_at: string
          id: string
          org_id: string
          projected_balance: number
          projected_inflow: number
          projected_outflow: number
          projection_date: string
          projection_type: string
          updated_at: string
        }
        Insert: {
          bank_account_id?: string | null
          company_id?: string | null
          confidence_level?: number
          created_at?: string
          id?: string
          org_id: string
          projected_balance?: number
          projected_inflow?: number
          projected_outflow?: number
          projection_date: string
          projection_type?: string
          updated_at?: string
        }
        Update: {
          bank_account_id?: string | null
          company_id?: string | null
          confidence_level?: number
          created_at?: string
          id?: string
          org_id?: string
          projected_balance?: number
          projected_inflow?: number
          projected_outflow?: number
          projection_date?: string
          projection_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      chart_account_cost_centers: {
        Row: {
          chart_of_account_id: string
          cost_center_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          chart_of_account_id: string
          cost_center_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          chart_of_account_id?: string
          cost_center_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_account_cost_centers_chart_of_account_id_fkey"
            columns: ["chart_of_account_id"]
            isOneToOne: false
            referencedRelation: "analytical_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_account_cost_centers_chart_of_account_id_fkey"
            columns: ["chart_of_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_account_cost_centers_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_expense: boolean | null
          nature_code: string | null
          org_id: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_expense?: boolean | null
          nature_code?: string | null
          org_id: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_expense?: boolean | null
          nature_code?: string | null
          org_id?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      codigos_classificacao_tributaria: {
        Row: {
          aplicacao: string | null
          artigo_lc_214: string | null
          codigo: string
          created_at: string | null
          descricao: string
          id: string
          tipo_tributo: string
          updated_at: string | null
        }
        Insert: {
          aplicacao?: string | null
          artigo_lc_214?: string | null
          codigo: string
          created_at?: string | null
          descricao: string
          id?: string
          tipo_tributo: string
          updated_at?: string | null
        }
        Update: {
          aplicacao?: string | null
          artigo_lc_214?: string | null
          codigo?: string
          created_at?: string | null
          descricao?: string
          id?: string
          tipo_tributo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          org_id: string
          phone: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          org_id: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          org_id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          activity_type: string
          assigned_to: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          lead_id: string | null
          opportunity_id: string | null
          org_id: string
          scheduled_at: string | null
          title: string
        }
        Insert: {
          activity_type: string
          assigned_to?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
          org_id: string
          scheduled_at?: string | null
          title: string
        }
        Update: {
          activity_type?: string
          assigned_to?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
          org_id?: string
          scheduled_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          estimated_value: number | null
          id: string
          name: string
          notes: string | null
          org_id: string
          phone: string | null
          position: string | null
          score: number | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          estimated_value?: number | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          phone?: string | null
          position?: string | null
          score?: number | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          estimated_value?: number | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          position?: string | null
          score?: number | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunities: {
        Row: {
          company_name: string | null
          created_at: string | null
          created_by: string | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          notes: string | null
          org_id: string
          probability: number | null
          stage_id: string | null
          status: string | null
          title: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          org_id: string
          probability?: number | null
          stage_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          org_id?: string
          probability?: number | null
          stage_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_stages: {
        Row: {
          created_at: string | null
          id: string
          name: string
          order_number: number
          org_id: string
          probability: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          order_number: number
          org_id: string
          probability?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          order_number?: number
          org_id?: string
          probability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_stages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          document: string | null
          email: string | null
          id: string
          last_interaction: string | null
          name: string
          org_id: string | null
          owner_id: string | null
          phone: string | null
          tags: string[] | null
          total_spent: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          last_interaction?: string | null
          name: string
          org_id?: string | null
          owner_id?: string | null
          phone?: string | null
          tags?: string[] | null
          total_spent?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          last_interaction?: string | null
          name?: string
          org_id?: string | null
          owner_id?: string | null
          phone?: string | null
          tags?: string[] | null
          total_spent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_read: boolean
          can_update: boolean
          created_at: string
          feature_key: string
          id: string
          org_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_read?: boolean
          can_update?: boolean
          created_at?: string
          feature_key: string
          id?: string
          org_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_read?: boolean
          can_update?: boolean
          created_at?: string
          feature_key?: string
          id?: string
          org_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_permissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_entries: {
        Row: {
          amount: number
          bank_account_id: string | null
          chart_of_account_id: string | null
          company_id: string | null
          competence_date: string
          cost_center_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string
          entry_code: number | null
          entry_type: string
          id: string
          is_settled: boolean
          org_id: string
          origin_id: string | null
          origin_type: string | null
          payment_method_id: string | null
          person_id: string | null
          person_type: string
          settled_at: string | null
          settled_payment_method_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          chart_of_account_id?: string | null
          company_id?: string | null
          competence_date?: string
          cost_center_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date: string
          entry_code?: number | null
          entry_type: string
          id?: string
          is_settled?: boolean
          org_id: string
          origin_id?: string | null
          origin_type?: string | null
          payment_method_id?: string | null
          person_id?: string | null
          person_type: string
          settled_at?: string | null
          settled_payment_method_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          chart_of_account_id?: string | null
          company_id?: string | null
          competence_date?: string
          cost_center_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string
          entry_code?: number | null
          entry_type?: string
          id?: string
          is_settled?: boolean
          org_id?: string
          origin_id?: string | null
          origin_type?: string | null
          payment_method_id?: string | null
          person_id?: string | null
          person_type?: string
          settled_at?: string | null
          settled_payment_method_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_financial_entries_chart_of_account"
            columns: ["chart_of_account_id"]
            isOneToOne: false
            referencedRelation: "analytical_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financial_entries_chart_of_account"
            columns: ["chart_of_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financial_entries_chart_of_account_id"
            columns: ["chart_of_account_id"]
            isOneToOne: false
            referencedRelation: "analytical_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financial_entries_chart_of_account_id"
            columns: ["chart_of_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financial_entries_company_id"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financial_entries_cost_center"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_entry_installments: {
        Row: {
          amount: number
          bank_account_id: string | null
          created_at: string
          created_by: string
          discount_amount: number | null
          due_date: string
          entry_id: string
          final_amount: number | null
          id: string
          installment_number: number
          interest_amount: number | null
          is_settled: boolean
          late_fee: number | null
          notes: string | null
          org_id: string
          payment_method_id: string | null
          settled_amount: number | null
          settled_at: string | null
          total_installments: number
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          created_at?: string
          created_by: string
          discount_amount?: number | null
          due_date: string
          entry_id: string
          final_amount?: number | null
          id?: string
          installment_number: number
          interest_amount?: number | null
          is_settled?: boolean
          late_fee?: number | null
          notes?: string | null
          org_id: string
          payment_method_id?: string | null
          settled_amount?: number | null
          settled_at?: string | null
          total_installments: number
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          created_at?: string
          created_by?: string
          discount_amount?: number | null
          due_date?: string
          entry_id?: string
          final_amount?: number | null
          id?: string
          installment_number?: number
          interest_amount?: number | null
          is_settled?: boolean
          late_fee?: number | null
          notes?: string | null
          org_id?: string
          payment_method_id?: string | null
          settled_amount?: number | null
          settled_at?: string | null
          total_installments?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_entry_installments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entry_installments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "financial_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entry_installments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "financial_entries_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entry_installments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_entry_payments: {
        Row: {
          bank_account_id: string | null
          created_at: string
          created_by: string
          data_pagamento: string
          documento: string | null
          entry_id: string
          id: string
          is_conciliated: boolean
          juros: number
          multa: number
          org_id: string
          payment_method_id: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          bank_account_id?: string | null
          created_at?: string
          created_by: string
          data_pagamento: string
          documento?: string | null
          entry_id: string
          id?: string
          is_conciliated?: boolean
          juros?: number
          multa?: number
          org_id: string
          payment_method_id?: string | null
          updated_at?: string
          valor?: number
        }
        Update: {
          bank_account_id?: string | null
          created_at?: string
          created_by?: string
          data_pagamento?: string
          documento?: string | null
          entry_id?: string
          id?: string
          is_conciliated?: boolean
          juros?: number
          multa?: number
          org_id?: string
          payment_method_id?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_entry_payments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entry_payments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "financial_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entry_payments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "financial_entries_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entry_payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entry_payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          bank_account_id: string | null
          category: string | null
          company_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          org_id: string
          reference_id: string | null
          reference_type: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          org_id: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          org_id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      fiscal_config: {
        Row: {
          ambiente: string
          bairro: string
          cep: string
          certificate_expires_at: string | null
          certificate_password_encrypted: string | null
          certificate_pfx: string | null
          cnae: string | null
          cnpj: string
          codigo_municipio: string
          company_id: string | null
          complemento: string | null
          contingencia_ativa: boolean | null
          created_at: string
          csc_homologacao: string | null
          csc_id_homologacao: number | null
          csc_id_producao: number | null
          csc_producao: string | null
          data_inicio_contingencia: string | null
          email: string | null
          id: string
          impressora_padrao: string | null
          inscricao_estadual: string
          inscricao_municipal: string | null
          is_active: boolean
          logradouro: string
          motivo_contingencia: string | null
          municipio: string
          nfce_contingencia_ativa: boolean | null
          nfce_csc: string | null
          nfce_numero_atual: number | null
          nfce_serie: number | null
          nome_fantasia: string | null
          numero: string
          org_id: string
          proximo_numero_nfce: number | null
          proximo_numero_nfe: number
          razao_social: string
          regime_tributario: string
          serie_nfce: string | null
          serie_nfe: string
          telefone: string | null
          token_contingencia: string | null
          uf: string
          uf_emitente: string
          updated_at: string
        }
        Insert: {
          ambiente?: string
          bairro: string
          cep: string
          certificate_expires_at?: string | null
          certificate_password_encrypted?: string | null
          certificate_pfx?: string | null
          cnae?: string | null
          cnpj: string
          codigo_municipio: string
          company_id?: string | null
          complemento?: string | null
          contingencia_ativa?: boolean | null
          created_at?: string
          csc_homologacao?: string | null
          csc_id_homologacao?: number | null
          csc_id_producao?: number | null
          csc_producao?: string | null
          data_inicio_contingencia?: string | null
          email?: string | null
          id?: string
          impressora_padrao?: string | null
          inscricao_estadual: string
          inscricao_municipal?: string | null
          is_active?: boolean
          logradouro: string
          motivo_contingencia?: string | null
          municipio: string
          nfce_contingencia_ativa?: boolean | null
          nfce_csc?: string | null
          nfce_numero_atual?: number | null
          nfce_serie?: number | null
          nome_fantasia?: string | null
          numero: string
          org_id: string
          proximo_numero_nfce?: number | null
          proximo_numero_nfe?: number
          razao_social: string
          regime_tributario: string
          serie_nfce?: string | null
          serie_nfe?: string
          telefone?: string | null
          token_contingencia?: string | null
          uf: string
          uf_emitente: string
          updated_at?: string
        }
        Update: {
          ambiente?: string
          bairro?: string
          cep?: string
          certificate_expires_at?: string | null
          certificate_password_encrypted?: string | null
          certificate_pfx?: string | null
          cnae?: string | null
          cnpj?: string
          codigo_municipio?: string
          company_id?: string | null
          complemento?: string | null
          contingencia_ativa?: boolean | null
          created_at?: string
          csc_homologacao?: string | null
          csc_id_homologacao?: number | null
          csc_id_producao?: number | null
          csc_producao?: string | null
          data_inicio_contingencia?: string | null
          email?: string | null
          id?: string
          impressora_padrao?: string | null
          inscricao_estadual?: string
          inscricao_municipal?: string | null
          is_active?: boolean
          logradouro?: string
          motivo_contingencia?: string | null
          municipio?: string
          nfce_contingencia_ativa?: boolean | null
          nfce_csc?: string | null
          nfce_numero_atual?: number | null
          nfce_serie?: number | null
          nome_fantasia?: string | null
          numero?: string
          org_id?: string
          proximo_numero_nfce?: number | null
          proximo_numero_nfe?: number
          razao_social?: string
          regime_tributario?: string
          serie_nfce?: string | null
          serie_nfe?: string
          telefone?: string | null
          token_contingencia?: string | null
          uf?: string
          uf_emitente?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_email_templates: {
        Row: {
          assunto: string
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          mensagem_padrao: string
          nome: string
          org_id: string
          updated_at: string
        }
        Insert: {
          assunto: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          mensagem_padrao: string
          nome: string
          org_id: string
          updated_at?: string
        }
        Update: {
          assunto?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          mensagem_padrao?: string
          nome?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      fiscal_nfe: {
        Row: {
          base_calculo_icms: number | null
          chave_acesso: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          data_autorizacao: string | null
          data_cancelamento: string | null
          data_emissao: string
          data_saida: string | null
          destinatario_bairro: string | null
          destinatario_cep: string | null
          destinatario_cidade: string | null
          destinatario_complemento: string | null
          destinatario_documento: string
          destinatario_email: string | null
          destinatario_endereco: string | null
          destinatario_id: string | null
          destinatario_ie: string | null
          destinatario_nome: string
          destinatario_numero: string | null
          destinatario_telefone: string | null
          destinatario_tipo: string
          destinatario_uf: string | null
          finalidade: string
          id: string
          informacoes_complementares: string | null
          informacoes_fisco: string | null
          justificativa_cancelamento: string | null
          modalidade_frete: string | null
          modelo: string
          natureza_operacao: string
          numero: number
          org_id: string
          protocolo_autorizacao: string | null
          protocolo_cancelamento: string | null
          serie: string
          status: string
          tipo_operacao: string
          transportadora_cidade: string | null
          transportadora_documento: string | null
          transportadora_endereco: string | null
          transportadora_nome: string | null
          transportadora_uf: string | null
          updated_at: string
          valor_cbs: number | null
          valor_cofins: number | null
          valor_desconto: number | null
          valor_frete: number | null
          valor_ibs_municipal: number | null
          valor_ibs_uf: number | null
          valor_icms: number | null
          valor_icms_st: number | null
          valor_ipi: number | null
          valor_outras_despesas: number | null
          valor_pis: number | null
          valor_seguro: number | null
          valor_total_cbs: number | null
          valor_total_ibs: number | null
          valor_total_is: number | null
          valor_total_nota: number
          valor_total_produtos: number
          veiculo_placa: string | null
          veiculo_uf: string | null
          volumes_especie: string | null
          volumes_marca: string | null
          volumes_numeracao: string | null
          volumes_peso_bruto: number | null
          volumes_peso_liquido: number | null
          volumes_quantidade: number | null
        }
        Insert: {
          base_calculo_icms?: number | null
          chave_acesso?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data_autorizacao?: string | null
          data_cancelamento?: string | null
          data_emissao?: string
          data_saida?: string | null
          destinatario_bairro?: string | null
          destinatario_cep?: string | null
          destinatario_cidade?: string | null
          destinatario_complemento?: string | null
          destinatario_documento: string
          destinatario_email?: string | null
          destinatario_endereco?: string | null
          destinatario_id?: string | null
          destinatario_ie?: string | null
          destinatario_nome: string
          destinatario_numero?: string | null
          destinatario_telefone?: string | null
          destinatario_tipo?: string
          destinatario_uf?: string | null
          finalidade?: string
          id?: string
          informacoes_complementares?: string | null
          informacoes_fisco?: string | null
          justificativa_cancelamento?: string | null
          modalidade_frete?: string | null
          modelo?: string
          natureza_operacao: string
          numero: number
          org_id: string
          protocolo_autorizacao?: string | null
          protocolo_cancelamento?: string | null
          serie?: string
          status?: string
          tipo_operacao?: string
          transportadora_cidade?: string | null
          transportadora_documento?: string | null
          transportadora_endereco?: string | null
          transportadora_nome?: string | null
          transportadora_uf?: string | null
          updated_at?: string
          valor_cbs?: number | null
          valor_cofins?: number | null
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_ibs_municipal?: number | null
          valor_ibs_uf?: number | null
          valor_icms?: number | null
          valor_icms_st?: number | null
          valor_ipi?: number | null
          valor_outras_despesas?: number | null
          valor_pis?: number | null
          valor_seguro?: number | null
          valor_total_cbs?: number | null
          valor_total_ibs?: number | null
          valor_total_is?: number | null
          valor_total_nota?: number
          valor_total_produtos?: number
          veiculo_placa?: string | null
          veiculo_uf?: string | null
          volumes_especie?: string | null
          volumes_marca?: string | null
          volumes_numeracao?: string | null
          volumes_peso_bruto?: number | null
          volumes_peso_liquido?: number | null
          volumes_quantidade?: number | null
        }
        Update: {
          base_calculo_icms?: number | null
          chave_acesso?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data_autorizacao?: string | null
          data_cancelamento?: string | null
          data_emissao?: string
          data_saida?: string | null
          destinatario_bairro?: string | null
          destinatario_cep?: string | null
          destinatario_cidade?: string | null
          destinatario_complemento?: string | null
          destinatario_documento?: string
          destinatario_email?: string | null
          destinatario_endereco?: string | null
          destinatario_id?: string | null
          destinatario_ie?: string | null
          destinatario_nome?: string
          destinatario_numero?: string | null
          destinatario_telefone?: string | null
          destinatario_tipo?: string
          destinatario_uf?: string | null
          finalidade?: string
          id?: string
          informacoes_complementares?: string | null
          informacoes_fisco?: string | null
          justificativa_cancelamento?: string | null
          modalidade_frete?: string | null
          modelo?: string
          natureza_operacao?: string
          numero?: number
          org_id?: string
          protocolo_autorizacao?: string | null
          protocolo_cancelamento?: string | null
          serie?: string
          status?: string
          tipo_operacao?: string
          transportadora_cidade?: string | null
          transportadora_documento?: string | null
          transportadora_endereco?: string | null
          transportadora_nome?: string | null
          transportadora_uf?: string | null
          updated_at?: string
          valor_cbs?: number | null
          valor_cofins?: number | null
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_ibs_municipal?: number | null
          valor_ibs_uf?: number | null
          valor_icms?: number | null
          valor_icms_st?: number | null
          valor_ipi?: number | null
          valor_outras_despesas?: number | null
          valor_pis?: number | null
          valor_seguro?: number | null
          valor_total_cbs?: number | null
          valor_total_ibs?: number | null
          valor_total_is?: number | null
          valor_total_nota?: number
          valor_total_produtos?: number
          veiculo_placa?: string | null
          veiculo_uf?: string | null
          volumes_especie?: string | null
          volumes_marca?: string | null
          volumes_numeracao?: string | null
          volumes_peso_bruto?: number | null
          volumes_peso_liquido?: number | null
          volumes_quantidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_nfe_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_nfe_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_nfe_cce: {
        Row: {
          correcao: string
          created_at: string
          created_by: string | null
          data_evento: string
          id: string
          nfe_id: string
          org_id: string
          protocolo: string | null
          sequencia: number
          status: string
        }
        Insert: {
          correcao: string
          created_at?: string
          created_by?: string | null
          data_evento?: string
          id?: string
          nfe_id: string
          org_id: string
          protocolo?: string | null
          sequencia?: number
          status?: string
        }
        Update: {
          correcao?: string
          created_at?: string
          created_by?: string | null
          data_evento?: string
          id?: string
          nfe_id?: string
          org_id?: string
          protocolo?: string | null
          sequencia?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_nfe_cce_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "fiscal_nfe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_nfe_cce_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_nfe_emails: {
        Row: {
          created_at: string
          created_by: string | null
          data_envio: string | null
          destinatario_email: string
          erro_mensagem: string | null
          id: string
          mensagem_adicional: string | null
          nfe_id: string
          org_id: string
          status_envio: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_envio?: string | null
          destinatario_email: string
          erro_mensagem?: string | null
          id?: string
          mensagem_adicional?: string | null
          nfe_id: string
          org_id: string
          status_envio?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_envio?: string | null
          destinatario_email?: string
          erro_mensagem?: string | null
          id?: string
          mensagem_adicional?: string | null
          nfe_id?: string
          org_id?: string
          status_envio?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_nfe_emails_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "fiscal_nfe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_nfe_emails_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_nfe_items: {
        Row: {
          cbs_aliquota: number | null
          cbs_base_calculo: number | null
          cbs_valor: number | null
          cest: string | null
          cfop: string
          codigo_produto: string | null
          cofins_aliquota: number | null
          cofins_base_calculo: number | null
          cofins_cst: string | null
          cofins_valor: number | null
          created_at: string
          descricao_produto: string
          ibs_mun_valor: number | null
          ibs_municipal_aliquota: number | null
          ibs_municipal_base_calculo: number | null
          ibs_uf_aliquota: number | null
          ibs_uf_base_calculo: number | null
          ibs_uf_valor: number | null
          icms_aliquota: number | null
          icms_base_calculo: number | null
          icms_cst: string | null
          icms_modalidade_bc: string | null
          icms_origem: string | null
          icms_valor: number | null
          id: string
          informacoes_adicionais: string | null
          ipi_aliquota: number | null
          ipi_base_calculo: number | null
          ipi_cst: string | null
          ipi_valor: number | null
          is_aliquota: number | null
          is_base_calculo: number | null
          is_valor: number | null
          item_pedido: number | null
          ncm: string | null
          nfe_id: string
          numero_pedido: string | null
          org_id: string
          pis_aliquota: number | null
          pis_base_calculo: number | null
          pis_cst: string | null
          pis_valor: number | null
          product_id: string | null
          quantidade_comercial: number
          unidade_comercial: string
          updated_at: string
          valor_desconto: number | null
          valor_frete: number | null
          valor_outras_despesas: number | null
          valor_seguro: number | null
          valor_total: number
          valor_unitario_comercial: number
        }
        Insert: {
          cbs_aliquota?: number | null
          cbs_base_calculo?: number | null
          cbs_valor?: number | null
          cest?: string | null
          cfop: string
          codigo_produto?: string | null
          cofins_aliquota?: number | null
          cofins_base_calculo?: number | null
          cofins_cst?: string | null
          cofins_valor?: number | null
          created_at?: string
          descricao_produto: string
          ibs_mun_valor?: number | null
          ibs_municipal_aliquota?: number | null
          ibs_municipal_base_calculo?: number | null
          ibs_uf_aliquota?: number | null
          ibs_uf_base_calculo?: number | null
          ibs_uf_valor?: number | null
          icms_aliquota?: number | null
          icms_base_calculo?: number | null
          icms_cst?: string | null
          icms_modalidade_bc?: string | null
          icms_origem?: string | null
          icms_valor?: number | null
          id?: string
          informacoes_adicionais?: string | null
          ipi_aliquota?: number | null
          ipi_base_calculo?: number | null
          ipi_cst?: string | null
          ipi_valor?: number | null
          is_aliquota?: number | null
          is_base_calculo?: number | null
          is_valor?: number | null
          item_pedido?: number | null
          ncm?: string | null
          nfe_id: string
          numero_pedido?: string | null
          org_id: string
          pis_aliquota?: number | null
          pis_base_calculo?: number | null
          pis_cst?: string | null
          pis_valor?: number | null
          product_id?: string | null
          quantidade_comercial: number
          unidade_comercial?: string
          updated_at?: string
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_outras_despesas?: number | null
          valor_seguro?: number | null
          valor_total: number
          valor_unitario_comercial: number
        }
        Update: {
          cbs_aliquota?: number | null
          cbs_base_calculo?: number | null
          cbs_valor?: number | null
          cest?: string | null
          cfop?: string
          codigo_produto?: string | null
          cofins_aliquota?: number | null
          cofins_base_calculo?: number | null
          cofins_cst?: string | null
          cofins_valor?: number | null
          created_at?: string
          descricao_produto?: string
          ibs_mun_valor?: number | null
          ibs_municipal_aliquota?: number | null
          ibs_municipal_base_calculo?: number | null
          ibs_uf_aliquota?: number | null
          ibs_uf_base_calculo?: number | null
          ibs_uf_valor?: number | null
          icms_aliquota?: number | null
          icms_base_calculo?: number | null
          icms_cst?: string | null
          icms_modalidade_bc?: string | null
          icms_origem?: string | null
          icms_valor?: number | null
          id?: string
          informacoes_adicionais?: string | null
          ipi_aliquota?: number | null
          ipi_base_calculo?: number | null
          ipi_cst?: string | null
          ipi_valor?: number | null
          is_aliquota?: number | null
          is_base_calculo?: number | null
          is_valor?: number | null
          item_pedido?: number | null
          ncm?: string | null
          nfe_id?: string
          numero_pedido?: string | null
          org_id?: string
          pis_aliquota?: number | null
          pis_base_calculo?: number | null
          pis_cst?: string | null
          pis_valor?: number | null
          product_id?: string | null
          quantidade_comercial?: number
          unidade_comercial?: string
          updated_at?: string
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_outras_despesas?: number | null
          valor_seguro?: number | null
          valor_total?: number
          valor_unitario_comercial?: number
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_nfe_items_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "fiscal_nfe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_nfe_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_nfe_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_nfe_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_integrity_check"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_operations: {
        Row: {
          additional_info: string | null
          aplica_ibs_cbs: boolean | null
          aplica_imposto_seletivo: boolean | null
          calculate_base_inside: boolean | null
          cbs_aliquota: number | null
          cfop_codes: Json | null
          codigo_classificacao_tributaria: string | null
          cofins_situation: string
          created_at: string
          created_by: string
          destination_state: string
          effective_icms_bc_reduction: number | null
          effective_icms_rate: number | null
          ex_tipi_general: string | null
          ex_tipi_suframa: string | null
          fcp_rate: number | null
          fiscal_benefit: string | null
          ibs_municipal_aliquota: number | null
          ibs_uf_aliquota: number | null
          icms_situation: string | null
          id: string
          internal_icms_rate: number | null
          interstate_icms_rate: number | null
          ipi_class_general: string | null
          ipi_class_suframa: string | null
          ipi_rate_general: number | null
          ipi_rate_suframa: number | null
          ipi_situation_general: string | null
          ipi_situation_suframa: string | null
          is_aliquota: number | null
          operation_name: string
          org_id: string
          pis_situation: string
          sales_category_id: string | null
          show_icms_st_on_invoice: boolean | null
          sum_ipi_on_base: boolean | null
          tax_group_id: string
          updated_at: string
        }
        Insert: {
          additional_info?: string | null
          aplica_ibs_cbs?: boolean | null
          aplica_imposto_seletivo?: boolean | null
          calculate_base_inside?: boolean | null
          cbs_aliquota?: number | null
          cfop_codes?: Json | null
          codigo_classificacao_tributaria?: string | null
          cofins_situation: string
          created_at?: string
          created_by: string
          destination_state: string
          effective_icms_bc_reduction?: number | null
          effective_icms_rate?: number | null
          ex_tipi_general?: string | null
          ex_tipi_suframa?: string | null
          fcp_rate?: number | null
          fiscal_benefit?: string | null
          ibs_municipal_aliquota?: number | null
          ibs_uf_aliquota?: number | null
          icms_situation?: string | null
          id?: string
          internal_icms_rate?: number | null
          interstate_icms_rate?: number | null
          ipi_class_general?: string | null
          ipi_class_suframa?: string | null
          ipi_rate_general?: number | null
          ipi_rate_suframa?: number | null
          ipi_situation_general?: string | null
          ipi_situation_suframa?: string | null
          is_aliquota?: number | null
          operation_name: string
          org_id: string
          pis_situation: string
          sales_category_id?: string | null
          show_icms_st_on_invoice?: boolean | null
          sum_ipi_on_base?: boolean | null
          tax_group_id: string
          updated_at?: string
        }
        Update: {
          additional_info?: string | null
          aplica_ibs_cbs?: boolean | null
          aplica_imposto_seletivo?: boolean | null
          calculate_base_inside?: boolean | null
          cbs_aliquota?: number | null
          cfop_codes?: Json | null
          codigo_classificacao_tributaria?: string | null
          cofins_situation?: string
          created_at?: string
          created_by?: string
          destination_state?: string
          effective_icms_bc_reduction?: number | null
          effective_icms_rate?: number | null
          ex_tipi_general?: string | null
          ex_tipi_suframa?: string | null
          fcp_rate?: number | null
          fiscal_benefit?: string | null
          ibs_municipal_aliquota?: number | null
          ibs_uf_aliquota?: number | null
          icms_situation?: string | null
          id?: string
          internal_icms_rate?: number | null
          interstate_icms_rate?: number | null
          ipi_class_general?: string | null
          ipi_class_suframa?: string | null
          ipi_rate_general?: number | null
          ipi_rate_suframa?: number | null
          ipi_situation_general?: string | null
          ipi_situation_suframa?: string | null
          is_aliquota?: number | null
          operation_name?: string
          org_id?: string
          pis_situation?: string
          sales_category_id?: string | null
          show_icms_st_on_invoice?: boolean | null
          sum_ipi_on_base?: boolean | null
          tax_group_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_operations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_operations_sales_category_id_fkey"
            columns: ["sales_category_id"]
            isOneToOne: false
            referencedRelation: "sales_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_operations_tax_group_id_fkey"
            columns: ["tax_group_id"]
            isOneToOne: false
            referencedRelation: "tax_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_sefaz_logs: {
        Row: {
          created_at: string
          id: string
          nfe_id: string | null
          operation_type: string
          org_id: string
          protocolo: string | null
          request_xml: string | null
          response_xml: string | null
          status_code: string | null
          status_message: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nfe_id?: string | null
          operation_type: string
          org_id: string
          protocolo?: string | null
          request_xml?: string | null
          response_xml?: string | null
          status_code?: string | null
          status_message?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nfe_id?: string | null
          operation_type?: string
          org_id?: string
          protocolo?: string | null
          request_xml?: string | null
          response_xml?: string | null
          status_code?: string | null
          status_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_sefaz_logs_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "fiscal_nfe"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          service_id: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          service_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          service_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoice_items_invoice_id"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoice_items_service_id"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          customer_id: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          number: string
          org_id: string
          owner_id: string
          paid_at: string | null
          payment_method: string | null
          pix_key: string | null
          pix_qr_code: string | null
          quote_id: string | null
          status: string
          title: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          number: string
          org_id: string
          owner_id: string
          paid_at?: string | null
          payment_method?: string | null
          pix_key?: string | null
          pix_qr_code?: string | null
          quote_id?: string | null
          status?: string
          title: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          number?: string
          org_id?: string
          owner_id?: string
          paid_at?: string | null
          payment_method?: string | null
          pix_key?: string | null
          pix_qr_code?: string | null
          quote_id?: string | null
          status?: string
          title?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoices_customer_id"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_quote_id"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      lot_management: {
        Row: {
          created_at: string | null
          created_by: string | null
          expiration_date: string | null
          id: string
          lot_number: string
          manufacturing_date: string | null
          org_id: string
          product_id: string
          quantity: number
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expiration_date?: string | null
          id?: string
          lot_number: string
          manufacturing_date?: string | null
          org_id: string
          product_id: string
          quantity?: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expiration_date?: string | null
          id?: string
          lot_number?: string
          manufacturing_date?: string | null
          org_id?: string
          product_id?: string
          quantity?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lot_management_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_management_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_management_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_integrity_check"
            referencedColumns: ["id"]
          },
        ]
      }
      module_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_read: boolean
          can_update: boolean
          created_at: string
          id: string
          module_key: string
          org_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_read?: boolean
          can_update?: boolean
          created_at?: string
          id?: string
          module_key: string
          org_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_read?: boolean
          can_update?: boolean
          created_at?: string
          id?: string
          module_key?: string
          org_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_permissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nfce: {
        Row: {
          base_calculo_icms: number | null
          caixa_sessao_id: string | null
          chave_acesso: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          data_autorizacao: string | null
          data_cancelamento: string | null
          data_emissao: string
          data_saida: string | null
          destinatario_bairro: string | null
          destinatario_cep: string | null
          destinatario_cidade: string | null
          destinatario_complemento: string | null
          destinatario_documento: string | null
          destinatario_email: string | null
          destinatario_endereco: string | null
          destinatario_nome: string | null
          destinatario_numero: string | null
          destinatario_telefone: string | null
          destinatario_tipo: string
          destinatario_uf: string | null
          finalidade: string
          forma_pagamento: string | null
          id: string
          informacoes_complementares: string | null
          informacoes_fisco: string | null
          justificativa_cancelamento: string | null
          modelo: string
          natureza_operacao: string
          numero: number
          order_id: string | null
          org_id: string
          presenca_comprador: string
          protocolo_autorizacao: string | null
          protocolo_cancelamento: string | null
          qr_code: string | null
          serie: string
          status: string
          tipo_operacao: string
          troco: number | null
          updated_at: string
          url_consulta: string | null
          valor_cbs: number | null
          valor_cofins: number | null
          valor_desconto: number | null
          valor_frete: number | null
          valor_ibs_municipal: number | null
          valor_ibs_uf: number | null
          valor_icms: number | null
          valor_icms_st: number | null
          valor_ipi: number | null
          valor_outras_despesas: number | null
          valor_pis: number | null
          valor_produtos: number
          valor_seguro: number | null
          valor_total: number
          valor_total_cbs: number | null
          valor_total_ibs: number | null
          valor_total_is: number | null
        }
        Insert: {
          base_calculo_icms?: number | null
          caixa_sessao_id?: string | null
          chave_acesso?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data_autorizacao?: string | null
          data_cancelamento?: string | null
          data_emissao?: string
          data_saida?: string | null
          destinatario_bairro?: string | null
          destinatario_cep?: string | null
          destinatario_cidade?: string | null
          destinatario_complemento?: string | null
          destinatario_documento?: string | null
          destinatario_email?: string | null
          destinatario_endereco?: string | null
          destinatario_nome?: string | null
          destinatario_numero?: string | null
          destinatario_telefone?: string | null
          destinatario_tipo?: string
          destinatario_uf?: string | null
          finalidade?: string
          forma_pagamento?: string | null
          id?: string
          informacoes_complementares?: string | null
          informacoes_fisco?: string | null
          justificativa_cancelamento?: string | null
          modelo?: string
          natureza_operacao?: string
          numero: number
          order_id?: string | null
          org_id: string
          presenca_comprador?: string
          protocolo_autorizacao?: string | null
          protocolo_cancelamento?: string | null
          qr_code?: string | null
          serie?: string
          status?: string
          tipo_operacao?: string
          troco?: number | null
          updated_at?: string
          url_consulta?: string | null
          valor_cbs?: number | null
          valor_cofins?: number | null
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_ibs_municipal?: number | null
          valor_ibs_uf?: number | null
          valor_icms?: number | null
          valor_icms_st?: number | null
          valor_ipi?: number | null
          valor_outras_despesas?: number | null
          valor_pis?: number | null
          valor_produtos?: number
          valor_seguro?: number | null
          valor_total?: number
          valor_total_cbs?: number | null
          valor_total_ibs?: number | null
          valor_total_is?: number | null
        }
        Update: {
          base_calculo_icms?: number | null
          caixa_sessao_id?: string | null
          chave_acesso?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data_autorizacao?: string | null
          data_cancelamento?: string | null
          data_emissao?: string
          data_saida?: string | null
          destinatario_bairro?: string | null
          destinatario_cep?: string | null
          destinatario_cidade?: string | null
          destinatario_complemento?: string | null
          destinatario_documento?: string | null
          destinatario_email?: string | null
          destinatario_endereco?: string | null
          destinatario_nome?: string | null
          destinatario_numero?: string | null
          destinatario_telefone?: string | null
          destinatario_tipo?: string
          destinatario_uf?: string | null
          finalidade?: string
          forma_pagamento?: string | null
          id?: string
          informacoes_complementares?: string | null
          informacoes_fisco?: string | null
          justificativa_cancelamento?: string | null
          modelo?: string
          natureza_operacao?: string
          numero?: number
          order_id?: string | null
          org_id?: string
          presenca_comprador?: string
          protocolo_autorizacao?: string | null
          protocolo_cancelamento?: string | null
          qr_code?: string | null
          serie?: string
          status?: string
          tipo_operacao?: string
          troco?: number | null
          updated_at?: string
          url_consulta?: string | null
          valor_cbs?: number | null
          valor_cofins?: number | null
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_ibs_municipal?: number | null
          valor_ibs_uf?: number | null
          valor_icms?: number | null
          valor_icms_st?: number | null
          valor_ipi?: number | null
          valor_outras_despesas?: number | null
          valor_pis?: number | null
          valor_produtos?: number
          valor_seguro?: number | null
          valor_total?: number
          valor_total_cbs?: number | null
          valor_total_ibs?: number | null
          valor_total_is?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nfce_caixa_sessao_id_fkey"
            columns: ["caixa_sessao_id"]
            isOneToOne: false
            referencedRelation: "caixa_sessoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfce_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfce_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfce_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_integrity_check"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfce_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nfce_contingency_queue: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_retry_at: string | null
          nfce_data: Json
          org_id: string
          retry_count: number | null
          status: string
          transmitted_at: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          nfce_data: Json
          org_id: string
          retry_count?: number | null
          status?: string
          transmitted_at?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          nfce_data?: Json
          org_id?: string
          retry_count?: number | null
          status?: string
          transmitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfce_contingency_queue_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nfce_items: {
        Row: {
          cbs_aliquota: number | null
          cbs_valor: number | null
          cest: string | null
          cfop: string
          codigo_produto: string
          cofins_aliquota: number | null
          cofins_base_calculo: number | null
          cofins_cst: string | null
          cofins_valor: number | null
          created_at: string
          descricao: string
          ibs_mun_aliquota: number | null
          ibs_mun_valor: number | null
          ibs_uf_aliquota: number | null
          ibs_uf_valor: number | null
          icms_aliquota: number | null
          icms_base_calculo: number | null
          icms_cst: string | null
          icms_origem: string | null
          icms_valor: number | null
          id: string
          ipi_aliquota: number | null
          ipi_base_calculo: number | null
          ipi_cst: string | null
          ipi_valor: number | null
          is_aliquota: number | null
          is_valor: number | null
          ncm: string | null
          nfce_id: string
          numero_item: number
          pis_aliquota: number | null
          pis_base_calculo: number | null
          pis_cst: string | null
          pis_valor: number | null
          product_id: string | null
          quantidade: number
          unidade: string
          valor_desconto: number | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          cbs_aliquota?: number | null
          cbs_valor?: number | null
          cest?: string | null
          cfop: string
          codigo_produto: string
          cofins_aliquota?: number | null
          cofins_base_calculo?: number | null
          cofins_cst?: string | null
          cofins_valor?: number | null
          created_at?: string
          descricao: string
          ibs_mun_aliquota?: number | null
          ibs_mun_valor?: number | null
          ibs_uf_aliquota?: number | null
          ibs_uf_valor?: number | null
          icms_aliquota?: number | null
          icms_base_calculo?: number | null
          icms_cst?: string | null
          icms_origem?: string | null
          icms_valor?: number | null
          id?: string
          ipi_aliquota?: number | null
          ipi_base_calculo?: number | null
          ipi_cst?: string | null
          ipi_valor?: number | null
          is_aliquota?: number | null
          is_valor?: number | null
          ncm?: string | null
          nfce_id: string
          numero_item: number
          pis_aliquota?: number | null
          pis_base_calculo?: number | null
          pis_cst?: string | null
          pis_valor?: number | null
          product_id?: string | null
          quantidade: number
          unidade?: string
          valor_desconto?: number | null
          valor_total: number
          valor_unitario: number
        }
        Update: {
          cbs_aliquota?: number | null
          cbs_valor?: number | null
          cest?: string | null
          cfop?: string
          codigo_produto?: string
          cofins_aliquota?: number | null
          cofins_base_calculo?: number | null
          cofins_cst?: string | null
          cofins_valor?: number | null
          created_at?: string
          descricao?: string
          ibs_mun_aliquota?: number | null
          ibs_mun_valor?: number | null
          ibs_uf_aliquota?: number | null
          ibs_uf_valor?: number | null
          icms_aliquota?: number | null
          icms_base_calculo?: number | null
          icms_cst?: string | null
          icms_origem?: string | null
          icms_valor?: number | null
          id?: string
          ipi_aliquota?: number | null
          ipi_base_calculo?: number | null
          ipi_cst?: string | null
          ipi_valor?: number | null
          is_aliquota?: number | null
          is_valor?: number | null
          ncm?: string | null
          nfce_id?: string
          numero_item?: number
          pis_aliquota?: number | null
          pis_base_calculo?: number | null
          pis_cst?: string | null
          pis_valor?: number | null
          product_id?: string | null
          quantidade?: number
          unidade?: string
          valor_desconto?: number | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "nfce_items_nfce_id_fkey"
            columns: ["nfce_id"]
            isOneToOne: false
            referencedRelation: "nfce"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfce_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfce_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_integrity_check"
            referencedColumns: ["id"]
          },
        ]
      }
      nfce_transmission_logs: {
        Row: {
          ambiente: string | null
          created_at: string
          duration_ms: number | null
          error_code: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          nfce_id: string | null
          operation_type: string
          org_id: string
          protocol: string | null
          request_json: Json | null
          request_timestamp: string
          request_xml: string | null
          response_json: Json | null
          response_timestamp: string | null
          response_xml: string | null
          sefaz_message: string | null
          status_code: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          ambiente?: string | null
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          nfce_id?: string | null
          operation_type: string
          org_id: string
          protocol?: string | null
          request_json?: Json | null
          request_timestamp?: string
          request_xml?: string | null
          response_json?: Json | null
          response_timestamp?: string | null
          response_xml?: string | null
          sefaz_message?: string | null
          status_code?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          ambiente?: string | null
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          nfce_id?: string | null
          operation_type?: string
          org_id?: string
          protocol?: string | null
          request_json?: Json | null
          request_timestamp?: string
          request_xml?: string | null
          response_json?: Json | null
          response_timestamp?: string | null
          response_xml?: string | null
          sefaz_message?: string | null
          status_code?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfce_transmission_logs_nfce_id_fkey"
            columns: ["nfce_id"]
            isOneToOne: false
            referencedRelation: "nfce"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfce_transmission_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe: {
        Row: {
          aliquota_cbs: number | null
          aliquota_ibs_municipal: number | null
          aliquota_ibs_uf: number | null
          aliquota_is: number | null
          bc_icms: number | null
          chave_acesso: string | null
          company_id: string | null
          created_at: string
          created_by: string
          danfe_path: string | null
          data_autorizacao: string | null
          data_cancelamento: string | null
          data_emissao: string
          data_prevista_entrega: string | null
          data_saida_entrada: string | null
          destinatario_bairro: string
          destinatario_cep: string
          destinatario_cidade: string
          destinatario_complemento: string | null
          destinatario_cpf_cnpj: string
          destinatario_email: string | null
          destinatario_endereco: string
          destinatario_id: string | null
          destinatario_ie: string | null
          destinatario_nome: string
          destinatario_numero: string
          destinatario_telefone: string | null
          destinatario_uf: string
          finalidade: string
          id: string
          informacoes_complementares: string | null
          informacoes_fisco: string | null
          manifestacao_destinatario: string | null
          modelo: string
          motivo_cancelamento: string | null
          motivo_rejeicao: string | null
          municipio_fato_gerador_ibs: string | null
          natureza_operacao: string
          numero: number
          numero_protocolo: string | null
          order_id: string | null
          org_id: string
          percentual_redutor_compra_gov: number | null
          protocolo_cancelamento: string | null
          serie: string
          status: string
          tipo_ente_governamental: string | null
          tipo_nf_credito: string | null
          tipo_nf_debito: string | null
          tipo_operacao: string
          tipo_operacao_governamental: string | null
          updated_at: string
          valor_bc_cbs: number | null
          valor_bc_ibs_municipal: number | null
          valor_bc_ibs_uf: number | null
          valor_bc_is: number | null
          valor_cbs: number | null
          valor_cofins: number | null
          valor_desconto: number | null
          valor_frete: number | null
          valor_ibs_municipal: number | null
          valor_ibs_uf: number | null
          valor_icms: number | null
          valor_icms_st: number | null
          valor_ipi: number | null
          valor_is: number | null
          valor_outras_despesas: number | null
          valor_pis: number | null
          valor_produtos: number
          valor_seguro: number | null
          valor_total: number
          valor_total_cbs: number | null
          valor_total_ibs: number | null
          valor_total_is: number | null
          xml_autorizado: string | null
          xml_gerado: string | null
          xml_path: string | null
        }
        Insert: {
          aliquota_cbs?: number | null
          aliquota_ibs_municipal?: number | null
          aliquota_ibs_uf?: number | null
          aliquota_is?: number | null
          bc_icms?: number | null
          chave_acesso?: string | null
          company_id?: string | null
          created_at?: string
          created_by: string
          danfe_path?: string | null
          data_autorizacao?: string | null
          data_cancelamento?: string | null
          data_emissao?: string
          data_prevista_entrega?: string | null
          data_saida_entrada?: string | null
          destinatario_bairro: string
          destinatario_cep: string
          destinatario_cidade: string
          destinatario_complemento?: string | null
          destinatario_cpf_cnpj: string
          destinatario_email?: string | null
          destinatario_endereco: string
          destinatario_id?: string | null
          destinatario_ie?: string | null
          destinatario_nome: string
          destinatario_numero: string
          destinatario_telefone?: string | null
          destinatario_uf: string
          finalidade?: string
          id?: string
          informacoes_complementares?: string | null
          informacoes_fisco?: string | null
          manifestacao_destinatario?: string | null
          modelo?: string
          motivo_cancelamento?: string | null
          motivo_rejeicao?: string | null
          municipio_fato_gerador_ibs?: string | null
          natureza_operacao?: string
          numero: number
          numero_protocolo?: string | null
          order_id?: string | null
          org_id: string
          percentual_redutor_compra_gov?: number | null
          protocolo_cancelamento?: string | null
          serie?: string
          status?: string
          tipo_ente_governamental?: string | null
          tipo_nf_credito?: string | null
          tipo_nf_debito?: string | null
          tipo_operacao?: string
          tipo_operacao_governamental?: string | null
          updated_at?: string
          valor_bc_cbs?: number | null
          valor_bc_ibs_municipal?: number | null
          valor_bc_ibs_uf?: number | null
          valor_bc_is?: number | null
          valor_cbs?: number | null
          valor_cofins?: number | null
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_ibs_municipal?: number | null
          valor_ibs_uf?: number | null
          valor_icms?: number | null
          valor_icms_st?: number | null
          valor_ipi?: number | null
          valor_is?: number | null
          valor_outras_despesas?: number | null
          valor_pis?: number | null
          valor_produtos?: number
          valor_seguro?: number | null
          valor_total?: number
          valor_total_cbs?: number | null
          valor_total_ibs?: number | null
          valor_total_is?: number | null
          xml_autorizado?: string | null
          xml_gerado?: string | null
          xml_path?: string | null
        }
        Update: {
          aliquota_cbs?: number | null
          aliquota_ibs_municipal?: number | null
          aliquota_ibs_uf?: number | null
          aliquota_is?: number | null
          bc_icms?: number | null
          chave_acesso?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string
          danfe_path?: string | null
          data_autorizacao?: string | null
          data_cancelamento?: string | null
          data_emissao?: string
          data_prevista_entrega?: string | null
          data_saida_entrada?: string | null
          destinatario_bairro?: string
          destinatario_cep?: string
          destinatario_cidade?: string
          destinatario_complemento?: string | null
          destinatario_cpf_cnpj?: string
          destinatario_email?: string | null
          destinatario_endereco?: string
          destinatario_id?: string | null
          destinatario_ie?: string | null
          destinatario_nome?: string
          destinatario_numero?: string
          destinatario_telefone?: string | null
          destinatario_uf?: string
          finalidade?: string
          id?: string
          informacoes_complementares?: string | null
          informacoes_fisco?: string | null
          manifestacao_destinatario?: string | null
          modelo?: string
          motivo_cancelamento?: string | null
          motivo_rejeicao?: string | null
          municipio_fato_gerador_ibs?: string | null
          natureza_operacao?: string
          numero?: number
          numero_protocolo?: string | null
          order_id?: string | null
          org_id?: string
          percentual_redutor_compra_gov?: number | null
          protocolo_cancelamento?: string | null
          serie?: string
          status?: string
          tipo_ente_governamental?: string | null
          tipo_nf_credito?: string | null
          tipo_nf_debito?: string | null
          tipo_operacao?: string
          tipo_operacao_governamental?: string | null
          updated_at?: string
          valor_bc_cbs?: number | null
          valor_bc_ibs_municipal?: number | null
          valor_bc_ibs_uf?: number | null
          valor_bc_is?: number | null
          valor_cbs?: number | null
          valor_cofins?: number | null
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_ibs_municipal?: number | null
          valor_ibs_uf?: number | null
          valor_icms?: number | null
          valor_icms_st?: number | null
          valor_ipi?: number | null
          valor_is?: number | null
          valor_outras_despesas?: number | null
          valor_pis?: number | null
          valor_produtos?: number
          valor_seguro?: number | null
          valor_total?: number
          valor_total_cbs?: number | null
          valor_total_ibs?: number | null
          valor_total_is?: number | null
          xml_autorizado?: string | null
          xml_gerado?: string | null
          xml_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfe_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_integrity_check"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_cancelamentos: {
        Row: {
          created_at: string | null
          data_cancelamento: string | null
          id: string
          motivo: string
          nfe_id: string
          org_id: string
          protocolo_cancelamento: string | null
          updated_at: string | null
          usuario_cancelamento: string | null
          xml_cancelamento: string | null
        }
        Insert: {
          created_at?: string | null
          data_cancelamento?: string | null
          id?: string
          motivo: string
          nfe_id: string
          org_id: string
          protocolo_cancelamento?: string | null
          updated_at?: string | null
          usuario_cancelamento?: string | null
          xml_cancelamento?: string | null
        }
        Update: {
          created_at?: string | null
          data_cancelamento?: string | null
          id?: string
          motivo?: string
          nfe_id?: string
          org_id?: string
          protocolo_cancelamento?: string | null
          updated_at?: string | null
          usuario_cancelamento?: string | null
          xml_cancelamento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfe_cancelamentos_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "nfe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_cancelamentos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_carta_correcao: {
        Row: {
          correcao: string
          created_at: string | null
          created_by: string | null
          data_evento: string | null
          id: string
          nfe_id: string
          org_id: string
          protocolo: string | null
          sequencia: number
          updated_at: string | null
          xml_evento: string | null
        }
        Insert: {
          correcao: string
          created_at?: string | null
          created_by?: string | null
          data_evento?: string | null
          id?: string
          nfe_id: string
          org_id: string
          protocolo?: string | null
          sequencia?: number
          updated_at?: string | null
          xml_evento?: string | null
        }
        Update: {
          correcao?: string
          created_at?: string | null
          created_by?: string | null
          data_evento?: string | null
          id?: string
          nfe_id?: string
          org_id?: string
          protocolo?: string | null
          sequencia?: number
          updated_at?: string | null
          xml_evento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfe_carta_correcao_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "nfe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_carta_correcao_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_envios_email: {
        Row: {
          created_at: string | null
          email_destinatario: string
          enviado_em: string
          id: string
          nfe_id: string
          org_id: string
        }
        Insert: {
          created_at?: string | null
          email_destinatario: string
          enviado_em?: string
          id?: string
          nfe_id: string
          org_id: string
        }
        Update: {
          created_at?: string | null
          email_destinatario?: string
          enviado_em?: string
          id?: string
          nfe_id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nfe_envios_email_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "nfe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_envios_email_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_eventos: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_evento: string
          descricao: string
          id: string
          nfe_id: string
          org_id: string
          protocolo: string | null
          tipo_evento: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_evento?: string
          descricao: string
          id?: string
          nfe_id: string
          org_id: string
          protocolo?: string | null
          tipo_evento: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_evento?: string
          descricao?: string
          id?: string
          nfe_id?: string
          org_id?: string
          protocolo?: string | null
          tipo_evento?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfe_eventos_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "nfe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_eventos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_inutilizacao: {
        Row: {
          ano: string
          created_at: string
          created_by: string
          data_inutilizacao: string | null
          id: string
          justificativa: string
          numero_final: number
          numero_inicial: number
          org_id: string
          protocolo: string | null
          serie: string
          status: string
          updated_at: string
        }
        Insert: {
          ano: string
          created_at?: string
          created_by: string
          data_inutilizacao?: string | null
          id?: string
          justificativa: string
          numero_final: number
          numero_inicial: number
          org_id: string
          protocolo?: string | null
          serie: string
          status?: string
          updated_at?: string
        }
        Update: {
          ano?: string
          created_at?: string
          created_by?: string
          data_inutilizacao?: string | null
          id?: string
          justificativa?: string
          numero_final?: number
          numero_inicial?: number
          org_id?: string
          protocolo?: string | null
          serie?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nfe_inutilizacao_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_inutilizacoes: {
        Row: {
          ano: number
          chave_inutilizacao: string | null
          created_at: string | null
          created_by: string
          data_inutilizacao: string | null
          fiscal_config_id: string
          id: string
          justificativa: string
          mensagem_sefaz: string | null
          modelo: string
          numero_final: number
          numero_inicial: number
          org_id: string
          protocolo: string | null
          serie: string
          status: string
          updated_at: string | null
        }
        Insert: {
          ano: number
          chave_inutilizacao?: string | null
          created_at?: string | null
          created_by: string
          data_inutilizacao?: string | null
          fiscal_config_id: string
          id?: string
          justificativa: string
          mensagem_sefaz?: string | null
          modelo?: string
          numero_final: number
          numero_inicial: number
          org_id: string
          protocolo?: string | null
          serie: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          ano?: number
          chave_inutilizacao?: string | null
          created_at?: string | null
          created_by?: string
          data_inutilizacao?: string | null
          fiscal_config_id?: string
          id?: string
          justificativa?: string
          mensagem_sefaz?: string | null
          modelo?: string
          numero_final?: number
          numero_inicial?: number
          org_id?: string
          protocolo?: string | null
          serie?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfe_inutilizacoes_fiscal_config_id_fkey"
            columns: ["fiscal_config_id"]
            isOneToOne: false
            referencedRelation: "fiscal_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_inutilizacoes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_items: {
        Row: {
          cbs_aliquota: number | null
          cbs_base_calculo: number | null
          cbs_indicador_doacao: string | null
          cbs_percentual_devolucao: number | null
          cbs_percentual_diferimento: number | null
          cbs_percentual_reducao: number | null
          cbs_valor: number | null
          cbs_valor_devolucao: number | null
          cbs_valor_diferido: number | null
          cest: string | null
          cfop: string
          classificacao_subapuracao_zfm: string | null
          codigo_classificacao_tributaria: string | null
          codigo_produto: string
          cofins_aliquota: number | null
          cofins_bc: number | null
          cofins_cst: string
          cofins_valor: number | null
          created_at: string
          cst_ibs_cbs: string | null
          descricao: string
          ibs_cbs_monofasico: boolean | null
          ibs_cbs_percentual_retencao: number | null
          ibs_cbs_valor_retido: number | null
          ibs_mun_aliquota: number | null
          ibs_mun_base_calculo: number | null
          ibs_mun_percentual_devolucao: number | null
          ibs_mun_percentual_diferimento: number | null
          ibs_mun_percentual_reducao: number | null
          ibs_mun_valor: number | null
          ibs_mun_valor_devolucao: number | null
          ibs_mun_valor_diferido: number | null
          ibs_uf_aliquota: number | null
          ibs_uf_base_calculo: number | null
          ibs_uf_percentual_devolucao: number | null
          ibs_uf_percentual_diferimento: number | null
          ibs_uf_percentual_reducao: number | null
          ibs_uf_valor: number | null
          ibs_uf_valor_devolucao: number | null
          ibs_uf_valor_diferido: number | null
          icms_aliquota: number | null
          icms_bc: number | null
          icms_cst: string
          icms_modalidade_bc: string | null
          icms_origem: string
          icms_st_aliquota: number | null
          icms_st_bc: number | null
          icms_st_valor: number | null
          icms_valor: number | null
          id: string
          indicador_bem_movel_usado: string | null
          informacoes_adicionais: string | null
          ipi_aliquota: number | null
          ipi_bc: number | null
          ipi_cst: string | null
          ipi_valor: number | null
          is_aliquota: number | null
          is_base_calculo: number | null
          is_codigo_classificacao: string | null
          is_cst: string | null
          is_quantidade_tributavel: number | null
          is_unidade_medida: string | null
          is_valor: number | null
          item_numero: number
          ncm: string
          nfe_id: string
          org_id: string
          pis_aliquota: number | null
          pis_bc: number | null
          pis_cst: string
          pis_valor: number | null
          product_id: string | null
          quantidade: number
          unidade: string
          updated_at: string
          valor_desconto: number | null
          valor_frete: number | null
          valor_outras_despesas: number | null
          valor_seguro: number | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          cbs_aliquota?: number | null
          cbs_base_calculo?: number | null
          cbs_indicador_doacao?: string | null
          cbs_percentual_devolucao?: number | null
          cbs_percentual_diferimento?: number | null
          cbs_percentual_reducao?: number | null
          cbs_valor?: number | null
          cbs_valor_devolucao?: number | null
          cbs_valor_diferido?: number | null
          cest?: string | null
          cfop: string
          classificacao_subapuracao_zfm?: string | null
          codigo_classificacao_tributaria?: string | null
          codigo_produto: string
          cofins_aliquota?: number | null
          cofins_bc?: number | null
          cofins_cst: string
          cofins_valor?: number | null
          created_at?: string
          cst_ibs_cbs?: string | null
          descricao: string
          ibs_cbs_monofasico?: boolean | null
          ibs_cbs_percentual_retencao?: number | null
          ibs_cbs_valor_retido?: number | null
          ibs_mun_aliquota?: number | null
          ibs_mun_base_calculo?: number | null
          ibs_mun_percentual_devolucao?: number | null
          ibs_mun_percentual_diferimento?: number | null
          ibs_mun_percentual_reducao?: number | null
          ibs_mun_valor?: number | null
          ibs_mun_valor_devolucao?: number | null
          ibs_mun_valor_diferido?: number | null
          ibs_uf_aliquota?: number | null
          ibs_uf_base_calculo?: number | null
          ibs_uf_percentual_devolucao?: number | null
          ibs_uf_percentual_diferimento?: number | null
          ibs_uf_percentual_reducao?: number | null
          ibs_uf_valor?: number | null
          ibs_uf_valor_devolucao?: number | null
          ibs_uf_valor_diferido?: number | null
          icms_aliquota?: number | null
          icms_bc?: number | null
          icms_cst: string
          icms_modalidade_bc?: string | null
          icms_origem?: string
          icms_st_aliquota?: number | null
          icms_st_bc?: number | null
          icms_st_valor?: number | null
          icms_valor?: number | null
          id?: string
          indicador_bem_movel_usado?: string | null
          informacoes_adicionais?: string | null
          ipi_aliquota?: number | null
          ipi_bc?: number | null
          ipi_cst?: string | null
          ipi_valor?: number | null
          is_aliquota?: number | null
          is_base_calculo?: number | null
          is_codigo_classificacao?: string | null
          is_cst?: string | null
          is_quantidade_tributavel?: number | null
          is_unidade_medida?: string | null
          is_valor?: number | null
          item_numero: number
          ncm: string
          nfe_id: string
          org_id: string
          pis_aliquota?: number | null
          pis_bc?: number | null
          pis_cst: string
          pis_valor?: number | null
          product_id?: string | null
          quantidade: number
          unidade: string
          updated_at?: string
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_outras_despesas?: number | null
          valor_seguro?: number | null
          valor_total: number
          valor_unitario: number
        }
        Update: {
          cbs_aliquota?: number | null
          cbs_base_calculo?: number | null
          cbs_indicador_doacao?: string | null
          cbs_percentual_devolucao?: number | null
          cbs_percentual_diferimento?: number | null
          cbs_percentual_reducao?: number | null
          cbs_valor?: number | null
          cbs_valor_devolucao?: number | null
          cbs_valor_diferido?: number | null
          cest?: string | null
          cfop?: string
          classificacao_subapuracao_zfm?: string | null
          codigo_classificacao_tributaria?: string | null
          codigo_produto?: string
          cofins_aliquota?: number | null
          cofins_bc?: number | null
          cofins_cst?: string
          cofins_valor?: number | null
          created_at?: string
          cst_ibs_cbs?: string | null
          descricao?: string
          ibs_cbs_monofasico?: boolean | null
          ibs_cbs_percentual_retencao?: number | null
          ibs_cbs_valor_retido?: number | null
          ibs_mun_aliquota?: number | null
          ibs_mun_base_calculo?: number | null
          ibs_mun_percentual_devolucao?: number | null
          ibs_mun_percentual_diferimento?: number | null
          ibs_mun_percentual_reducao?: number | null
          ibs_mun_valor?: number | null
          ibs_mun_valor_devolucao?: number | null
          ibs_mun_valor_diferido?: number | null
          ibs_uf_aliquota?: number | null
          ibs_uf_base_calculo?: number | null
          ibs_uf_percentual_devolucao?: number | null
          ibs_uf_percentual_diferimento?: number | null
          ibs_uf_percentual_reducao?: number | null
          ibs_uf_valor?: number | null
          ibs_uf_valor_devolucao?: number | null
          ibs_uf_valor_diferido?: number | null
          icms_aliquota?: number | null
          icms_bc?: number | null
          icms_cst?: string
          icms_modalidade_bc?: string | null
          icms_origem?: string
          icms_st_aliquota?: number | null
          icms_st_bc?: number | null
          icms_st_valor?: number | null
          icms_valor?: number | null
          id?: string
          indicador_bem_movel_usado?: string | null
          informacoes_adicionais?: string | null
          ipi_aliquota?: number | null
          ipi_bc?: number | null
          ipi_cst?: string | null
          ipi_valor?: number | null
          is_aliquota?: number | null
          is_base_calculo?: number | null
          is_codigo_classificacao?: string | null
          is_cst?: string | null
          is_quantidade_tributavel?: number | null
          is_unidade_medida?: string | null
          is_valor?: number | null
          item_numero?: number
          ncm?: string
          nfe_id?: string
          org_id?: string
          pis_aliquota?: number | null
          pis_bc?: number | null
          pis_cst?: string
          pis_valor?: number | null
          product_id?: string | null
          quantidade?: number
          unidade?: string
          updated_at?: string
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_outras_despesas?: number | null
          valor_seguro?: number | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "nfe_items_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "nfe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_integrity_check"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_itens: {
        Row: {
          aliquota_cbs: number | null
          aliquota_cofins: number | null
          aliquota_ibs_municipal: number | null
          aliquota_ibs_uf: number | null
          aliquota_icms: number | null
          aliquota_ipi: number | null
          aliquota_pis: number | null
          base_calculo_icms: number | null
          base_calculo_icms_st: number | null
          cfop: string | null
          codigo_classificacao_tributaria: string | null
          codigo_produto: string | null
          created_at: string | null
          descricao: string
          id: string
          ncm: string | null
          nfe_id: string
          numero_item: number
          org_id: string
          quantidade: number
          unidade: string | null
          updated_at: string | null
          valor_cbs: number | null
          valor_cofins: number | null
          valor_ibs_municipal: number | null
          valor_ibs_uf: number | null
          valor_icms: number | null
          valor_icms_st: number | null
          valor_ipi: number | null
          valor_pis: number | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          aliquota_cbs?: number | null
          aliquota_cofins?: number | null
          aliquota_ibs_municipal?: number | null
          aliquota_ibs_uf?: number | null
          aliquota_icms?: number | null
          aliquota_ipi?: number | null
          aliquota_pis?: number | null
          base_calculo_icms?: number | null
          base_calculo_icms_st?: number | null
          cfop?: string | null
          codigo_classificacao_tributaria?: string | null
          codigo_produto?: string | null
          created_at?: string | null
          descricao: string
          id?: string
          ncm?: string | null
          nfe_id: string
          numero_item: number
          org_id: string
          quantidade: number
          unidade?: string | null
          updated_at?: string | null
          valor_cbs?: number | null
          valor_cofins?: number | null
          valor_ibs_municipal?: number | null
          valor_ibs_uf?: number | null
          valor_icms?: number | null
          valor_icms_st?: number | null
          valor_ipi?: number | null
          valor_pis?: number | null
          valor_total: number
          valor_unitario: number
        }
        Update: {
          aliquota_cbs?: number | null
          aliquota_cofins?: number | null
          aliquota_ibs_municipal?: number | null
          aliquota_ibs_uf?: number | null
          aliquota_icms?: number | null
          aliquota_ipi?: number | null
          aliquota_pis?: number | null
          base_calculo_icms?: number | null
          base_calculo_icms_st?: number | null
          cfop?: string | null
          codigo_classificacao_tributaria?: string | null
          codigo_produto?: string | null
          created_at?: string | null
          descricao?: string
          id?: string
          ncm?: string | null
          nfe_id?: string
          numero_item?: number
          org_id?: string
          quantidade?: number
          unidade?: string | null
          updated_at?: string | null
          valor_cbs?: number | null
          valor_cofins?: number | null
          valor_ibs_municipal?: number | null
          valor_ibs_uf?: number | null
          valor_icms?: number | null
          valor_icms_st?: number | null
          valor_ipi?: number | null
          valor_pis?: number | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "nfe_itens_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "nfe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_itens_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_manifestacao: {
        Row: {
          chave_acesso: string
          created_at: string | null
          created_by: string | null
          data_evento: string | null
          id: string
          justificativa: string | null
          nfe_id: string
          org_id: string
          protocolo: string | null
          tipo_evento: string
          updated_at: string | null
          xml_evento: string | null
        }
        Insert: {
          chave_acesso: string
          created_at?: string | null
          created_by?: string | null
          data_evento?: string | null
          id?: string
          justificativa?: string | null
          nfe_id: string
          org_id: string
          protocolo?: string | null
          tipo_evento: string
          updated_at?: string | null
          xml_evento?: string | null
        }
        Update: {
          chave_acesso?: string
          created_at?: string | null
          created_by?: string | null
          data_evento?: string | null
          id?: string
          justificativa?: string | null
          nfe_id?: string
          org_id?: string
          protocolo?: string | null
          tipo_evento?: string
          updated_at?: string | null
          xml_evento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfe_manifestacao_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "nfe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_manifestacao_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nfse: {
        Row: {
          aliquota_iss: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          codigo_servico: string
          codigo_tributacao_municipio: string | null
          codigo_verificacao: string | null
          cofins_retido: boolean | null
          created_at: string | null
          created_by: string
          csll_retido: boolean | null
          data_competencia: string
          data_emissao: string
          discriminacao: string
          id: string
          inss_retido: boolean | null
          ir_retido: boolean | null
          iss_retido: boolean | null
          link_visualizacao: string | null
          mensagem_retorno: string | null
          numero: number
          numero_rps: number | null
          org_id: string
          pis_retido: boolean | null
          protocolo: string | null
          serie: string
          serie_rps: string | null
          status: string
          tomador_bairro: string | null
          tomador_cep: string | null
          tomador_cidade: string | null
          tomador_cpf_cnpj: string
          tomador_email: string | null
          tomador_endereco: string | null
          tomador_nome: string
          tomador_numero: string | null
          tomador_telefone: string | null
          tomador_uf: string | null
          updated_at: string | null
          valor_cofins: number | null
          valor_csll: number | null
          valor_deducoes: number | null
          valor_inss: number | null
          valor_ir: number | null
          valor_iss: number | null
          valor_iss_retido: number | null
          valor_liquido: number
          valor_pis: number | null
          valor_servicos: number
          xml_nfse: string | null
        }
        Insert: {
          aliquota_iss?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          codigo_servico: string
          codigo_tributacao_municipio?: string | null
          codigo_verificacao?: string | null
          cofins_retido?: boolean | null
          created_at?: string | null
          created_by: string
          csll_retido?: boolean | null
          data_competencia: string
          data_emissao?: string
          discriminacao: string
          id?: string
          inss_retido?: boolean | null
          ir_retido?: boolean | null
          iss_retido?: boolean | null
          link_visualizacao?: string | null
          mensagem_retorno?: string | null
          numero: number
          numero_rps?: number | null
          org_id: string
          pis_retido?: boolean | null
          protocolo?: string | null
          serie?: string
          serie_rps?: string | null
          status?: string
          tomador_bairro?: string | null
          tomador_cep?: string | null
          tomador_cidade?: string | null
          tomador_cpf_cnpj: string
          tomador_email?: string | null
          tomador_endereco?: string | null
          tomador_nome: string
          tomador_numero?: string | null
          tomador_telefone?: string | null
          tomador_uf?: string | null
          updated_at?: string | null
          valor_cofins?: number | null
          valor_csll?: number | null
          valor_deducoes?: number | null
          valor_inss?: number | null
          valor_ir?: number | null
          valor_iss?: number | null
          valor_iss_retido?: number | null
          valor_liquido: number
          valor_pis?: number | null
          valor_servicos: number
          xml_nfse?: string | null
        }
        Update: {
          aliquota_iss?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          codigo_servico?: string
          codigo_tributacao_municipio?: string | null
          codigo_verificacao?: string | null
          cofins_retido?: boolean | null
          created_at?: string | null
          created_by?: string
          csll_retido?: boolean | null
          data_competencia?: string
          data_emissao?: string
          discriminacao?: string
          id?: string
          inss_retido?: boolean | null
          ir_retido?: boolean | null
          iss_retido?: boolean | null
          link_visualizacao?: string | null
          mensagem_retorno?: string | null
          numero?: number
          numero_rps?: number | null
          org_id?: string
          pis_retido?: boolean | null
          protocolo?: string | null
          serie?: string
          serie_rps?: string | null
          status?: string
          tomador_bairro?: string | null
          tomador_cep?: string | null
          tomador_cidade?: string | null
          tomador_cpf_cnpj?: string
          tomador_email?: string | null
          tomador_endereco?: string | null
          tomador_nome?: string
          tomador_numero?: string | null
          tomador_telefone?: string | null
          tomador_uf?: string | null
          updated_at?: string | null
          valor_cofins?: number | null
          valor_csll?: number | null
          valor_deducoes?: number | null
          valor_inss?: number | null
          valor_ir?: number | null
          valor_iss?: number | null
          valor_iss_retido?: number | null
          valor_liquido?: number
          valor_pis?: number | null
          valor_servicos?: number
          xml_nfse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfse_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          notification_type: string
          org_id: string
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          notification_type: string
          org_id: string
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          notification_type?: string
          org_id?: string
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          org_id: string
          priority: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          org_id: string
          priority?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          org_id?: string
          priority?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          discount_amount: number | null
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_id: string | null
          delivery_date: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          order_type: string
          org_id: string
          owner_id: string
          payment_method: string | null
          payment_status: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          delivery_date?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          order_type?: string
          org_id: string
          owner_id: string
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          delivery_date?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          order_type?: string
          org_id?: string
          owner_id?: string
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          default_daily_interest_percentage: number | null
          default_early_discount_days: number | null
          default_early_discount_percentage: number | null
          default_late_fee_percentage: number | null
          id: string
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_daily_interest_percentage?: number | null
          default_early_discount_days?: number | null
          default_early_discount_percentage?: number | null
          default_late_fee_percentage?: number | null
          id?: string
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_daily_interest_percentage?: number | null
          default_early_discount_days?: number | null
          default_early_discount_percentage?: number | null
          default_late_fee_percentage?: number | null
          id?: string
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          active: boolean
          code: string | null
          created_at: string
          id: string
          is_default: boolean
          name: string
          org_id: string
          type: string
        }
        Insert: {
          active?: boolean
          code?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          org_id: string
          type: string
        }
        Update: {
          active?: boolean
          code?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          org_id?: string
          type?: string
        }
        Relationships: []
      }
      pessoas: {
        Row: {
          ativo: boolean
          bloquear_notificacoes_whatsapp: boolean | null
          cep: string | null
          cidade: string | null
          codigo: string | null
          created_at: string
          created_by: string
          documento: string
          email_geral: string | null
          emails_secundarios: string[] | null
          endereco: string | null
          id: string
          nome_fantasia: string
          org_id: string
          razao_social: string | null
          rotulos: string[] | null
          telefone: string | null
          telefone_celular: string | null
          tipo_pessoa: string
          transportadora_padrao: string | null
          uf: string | null
          updated_at: string
          vendedor_padrao: string | null
          whatsapps: string[] | null
        }
        Insert: {
          ativo?: boolean
          bloquear_notificacoes_whatsapp?: boolean | null
          cep?: string | null
          cidade?: string | null
          codigo?: string | null
          created_at?: string
          created_by: string
          documento: string
          email_geral?: string | null
          emails_secundarios?: string[] | null
          endereco?: string | null
          id?: string
          nome_fantasia: string
          org_id: string
          razao_social?: string | null
          rotulos?: string[] | null
          telefone?: string | null
          telefone_celular?: string | null
          tipo_pessoa: string
          transportadora_padrao?: string | null
          uf?: string | null
          updated_at?: string
          vendedor_padrao?: string | null
          whatsapps?: string[] | null
        }
        Update: {
          ativo?: boolean
          bloquear_notificacoes_whatsapp?: boolean | null
          cep?: string | null
          cidade?: string | null
          codigo?: string | null
          created_at?: string
          created_by?: string
          documento?: string
          email_geral?: string | null
          emails_secundarios?: string[] | null
          endereco?: string | null
          id?: string
          nome_fantasia?: string
          org_id?: string
          razao_social?: string | null
          rotulos?: string[] | null
          telefone?: string | null
          telefone_celular?: string | null
          tipo_pessoa?: string
          transportadora_padrao?: string | null
          uf?: string | null
          updated_at?: string
          vendedor_padrao?: string | null
          whatsapps?: string[] | null
        }
        Relationships: []
      }
      price_table_products: {
        Row: {
          created_at: string
          id: string
          mva: number
          price_table_id: string
          product_id: string
          representative_commission: number
          sale_price: number
          seller_commission: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mva?: number
          price_table_id: string
          product_id: string
          representative_commission?: number
          sale_price?: number
          seller_commission?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mva?: number
          price_table_id?: string
          product_id?: string
          representative_commission?: number
          sale_price?: number
          seller_commission?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_table_products_price_table_id_fkey"
            columns: ["price_table_id"]
            isOneToOne: false
            referencedRelation: "price_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_table_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_table_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_integrity_check"
            referencedColumns: ["id"]
          },
        ]
      }
      price_tables: {
        Row: {
          auto_update_commission_changes: boolean
          auto_update_cost_changes: boolean
          created_at: string
          created_by: string
          default_mva: number
          default_representative_commission: number
          default_seller_commission: number
          gender: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          updated_at: string
          visible_in_pdv: boolean
        }
        Insert: {
          auto_update_commission_changes?: boolean
          auto_update_cost_changes?: boolean
          created_at?: string
          created_by: string
          default_mva?: number
          default_representative_commission?: number
          default_seller_commission?: number
          gender: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          updated_at?: string
          visible_in_pdv?: boolean
        }
        Update: {
          auto_update_commission_changes?: boolean
          auto_update_cost_changes?: boolean
          created_at?: string
          created_by?: string
          default_mva?: number
          default_representative_commission?: number
          default_seller_commission?: number
          gender?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          updated_at?: string
          visible_in_pdv?: boolean
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_lots: {
        Row: {
          created_at: string
          created_by: string
          expiration_date: string | null
          id: string
          lot_number: string
          org_id: string
          product_id: string
          quantity: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expiration_date?: string | null
          id?: string
          lot_number: string
          org_id: string
          product_id: string
          quantity?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expiration_date?: string | null
          id?: string
          lot_number?: string
          org_id?: string
          product_id?: string
          quantity?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_integrity_check"
            referencedColumns: ["id"]
          },
        ]
      }
      product_serials: {
        Row: {
          created_at: string
          created_by: string
          id: string
          org_id: string
          product_id: string
          serial_number: string
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          org_id: string
          product_id: string
          serial_number: string
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          org_id?: string
          product_id?: string
          serial_number?: string
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: []
      }
      product_warehouse_stock: {
        Row: {
          id: string
          product_id: string
          quantity: number
          reserved_quantity: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          assembly_fee_amount: number | null
          assembly_fee_percent: number | null
          barcode: string | null
          brand: string | null
          category: string | null
          category_id: string | null
          cost_calculation_method: string | null
          cost_price: number | null
          cost_with_additions: number | null
          created_at: string
          default_warehouse_id: string | null
          description: string | null
          dimensions: string | null
          fcp_st_purchase_percent: number | null
          freight_purchase_percent: number | null
          has_lot_control: boolean | null
          has_serial_control: boolean | null
          hide_in_sales: boolean | null
          icms_purchase_percent: number | null
          icms_st_purchase_percent: number | null
          id: string
          inactive: boolean | null
          insurance_purchase_percent: number | null
          ipi_purchase_percent: number | null
          is_perishable: boolean | null
          last_purchase_value: number | null
          max_stock_level: number | null
          min_stock_level: number | null
          minimum_sale_price: number | null
          model: string | null
          name: string
          ncm_code: string | null
          operational_expenses_percent: number | null
          org_id: string
          owner_id: string
          product_genre: string | null
          product_type: string | null
          profit_amount: number | null
          profit_percent: number | null
          reorder_point: number | null
          representation_commission_percent: number | null
          sale_unit: string | null
          sku: string
          stock_quantity: number
          supplier_code: string | null
          supplier_id: string | null
          system_code: string | null
          tax_group_id: string | null
          track_stock: boolean
          unit: string | null
          unit_id: string | null
          unit_price: number
          updated_at: string
          validity_days: number | null
          vendor_commission_amount: number | null
          vendor_commission_percent: number | null
          visible_in_catalog: boolean | null
          weight: number | null
        }
        Insert: {
          active?: boolean
          assembly_fee_amount?: number | null
          assembly_fee_percent?: number | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          category_id?: string | null
          cost_calculation_method?: string | null
          cost_price?: number | null
          cost_with_additions?: number | null
          created_at?: string
          default_warehouse_id?: string | null
          description?: string | null
          dimensions?: string | null
          fcp_st_purchase_percent?: number | null
          freight_purchase_percent?: number | null
          has_lot_control?: boolean | null
          has_serial_control?: boolean | null
          hide_in_sales?: boolean | null
          icms_purchase_percent?: number | null
          icms_st_purchase_percent?: number | null
          id?: string
          inactive?: boolean | null
          insurance_purchase_percent?: number | null
          ipi_purchase_percent?: number | null
          is_perishable?: boolean | null
          last_purchase_value?: number | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          minimum_sale_price?: number | null
          model?: string | null
          name: string
          ncm_code?: string | null
          operational_expenses_percent?: number | null
          org_id: string
          owner_id: string
          product_genre?: string | null
          product_type?: string | null
          profit_amount?: number | null
          profit_percent?: number | null
          reorder_point?: number | null
          representation_commission_percent?: number | null
          sale_unit?: string | null
          sku: string
          stock_quantity?: number
          supplier_code?: string | null
          supplier_id?: string | null
          system_code?: string | null
          tax_group_id?: string | null
          track_stock?: boolean
          unit?: string | null
          unit_id?: string | null
          unit_price?: number
          updated_at?: string
          validity_days?: number | null
          vendor_commission_amount?: number | null
          vendor_commission_percent?: number | null
          visible_in_catalog?: boolean | null
          weight?: number | null
        }
        Update: {
          active?: boolean
          assembly_fee_amount?: number | null
          assembly_fee_percent?: number | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          category_id?: string | null
          cost_calculation_method?: string | null
          cost_price?: number | null
          cost_with_additions?: number | null
          created_at?: string
          default_warehouse_id?: string | null
          description?: string | null
          dimensions?: string | null
          fcp_st_purchase_percent?: number | null
          freight_purchase_percent?: number | null
          has_lot_control?: boolean | null
          has_serial_control?: boolean | null
          hide_in_sales?: boolean | null
          icms_purchase_percent?: number | null
          icms_st_purchase_percent?: number | null
          id?: string
          inactive?: boolean | null
          insurance_purchase_percent?: number | null
          ipi_purchase_percent?: number | null
          is_perishable?: boolean | null
          last_purchase_value?: number | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          minimum_sale_price?: number | null
          model?: string | null
          name?: string
          ncm_code?: string | null
          operational_expenses_percent?: number | null
          org_id?: string
          owner_id?: string
          product_genre?: string | null
          product_type?: string | null
          profit_amount?: number | null
          profit_percent?: number | null
          reorder_point?: number | null
          representation_commission_percent?: number | null
          sale_unit?: string | null
          sku?: string
          stock_quantity?: number
          supplier_code?: string | null
          supplier_id?: string | null
          system_code?: string | null
          tax_group_id?: string | null
          track_stock?: boolean
          unit?: string | null
          unit_id?: string | null
          unit_price?: number
          updated_at?: string
          validity_days?: number | null
          vendor_commission_amount?: number | null
          vendor_commission_percent?: number | null
          visible_in_catalog?: boolean | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_tax_group_id_fkey"
            columns: ["tax_group_id"]
            isOneToOne: false
            referencedRelation: "tax_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          comissao_pdv_percentual: number | null
          comissao_pedidos_percentual: number | null
          comissao_por_produto_pdv: boolean | null
          comissao_por_produto_pedidos: boolean | null
          created_at: string
          dia_vencimento_comissoes_pdv: number | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          pessoa_id: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          comissao_pdv_percentual?: number | null
          comissao_pedidos_percentual?: number | null
          comissao_por_produto_pdv?: boolean | null
          comissao_por_produto_pedidos?: boolean | null
          created_at?: string
          dia_vencimento_comissoes_pdv?: number | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          pessoa_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          comissao_pdv_percentual?: number | null
          comissao_pedidos_percentual?: number | null
          comissao_por_produto_pdv?: boolean | null
          comissao_por_produto_pedidos?: boolean | null
          created_at?: string
          dia_vencimento_comissoes_pdv?: number | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          pessoa_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_pessoa"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_approvals: {
        Row: {
          approved_at: string | null
          approver_id: string
          comments: string | null
          created_at: string | null
          id: string
          level_order: number
          purchase_id: string | null
          request_id: string | null
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          approver_id: string
          comments?: string | null
          created_at?: string | null
          id?: string
          level_order: number
          purchase_id?: string | null
          request_id?: string | null
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          approver_id?: string
          comments?: string | null
          created_at?: string | null
          id?: string
          level_order?: number
          purchase_id?: string | null
          request_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_approvals_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_approvals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_budgets: {
        Row: {
          available_amount: number
          budget_name: string
          budget_year: number
          category: string | null
          cost_center: string | null
          created_at: string
          created_by: string
          id: string
          org_id: string
          planned_amount: number
          reserved_amount: number
          spent_amount: number
          status: string
          updated_at: string
        }
        Insert: {
          available_amount?: number
          budget_name: string
          budget_year: number
          category?: string | null
          cost_center?: string | null
          created_at?: string
          created_by: string
          id?: string
          org_id: string
          planned_amount?: number
          reserved_amount?: number
          spent_amount?: number
          status?: string
          updated_at?: string
        }
        Update: {
          available_amount?: number
          budget_name?: string
          budget_year?: number
          category?: string | null
          cost_center?: string | null
          created_at?: string
          created_by?: string
          id?: string
          org_id?: string
          planned_amount?: number
          reserved_amount?: number
          spent_amount?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          product_name: string
          purchase_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name: string
          purchase_id: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name?: string
          purchase_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: []
      }
      purchase_receipt_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          purchase_item_id: string
          quality_check_status: string | null
          quality_notes: string | null
          quantity_received: number
          receipt_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          purchase_item_id: string
          quality_check_status?: string | null
          quality_notes?: string | null
          quantity_received: number
          receipt_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          purchase_item_id?: string
          quality_check_status?: string | null
          quality_notes?: string | null
          quantity_received?: number
          receipt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_integrity_check"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipt_items_purchase_item_id_fkey"
            columns: ["purchase_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "purchase_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_receipts: {
        Row: {
          created_at: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          notes: string | null
          org_id: string
          purchase_id: string
          receipt_code: number
          receipt_date: string | null
          receipt_number: string | null
          received_by: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          org_id: string
          purchase_id: string
          receipt_code?: number
          receipt_date?: string | null
          receipt_number?: string | null
          received_by: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          org_id?: string
          purchase_id?: string
          receipt_code?: number
          receipt_date?: string | null
          receipt_number?: string | null
          received_by?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_receipts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_request_items: {
        Row: {
          created_at: string | null
          estimated_total: number | null
          estimated_unit_price: number | null
          id: string
          notes: string | null
          product_description: string
          product_id: string | null
          quantity: number
          request_id: string
        }
        Insert: {
          created_at?: string | null
          estimated_total?: number | null
          estimated_unit_price?: number | null
          id?: string
          notes?: string | null
          product_description: string
          product_id?: string | null
          quantity: number
          request_id: string
        }
        Update: {
          created_at?: string | null
          estimated_total?: number | null
          estimated_unit_price?: number | null
          id?: string
          notes?: string | null
          product_description?: string
          product_id?: string | null
          quantity?: number
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_request_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_request_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_integrity_check"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string | null
          converted_to_purchase_id: string | null
          cost_center_id: string | null
          created_at: string | null
          department: string | null
          description: string | null
          id: string
          justification: string | null
          org_id: string
          priority: string | null
          rejection_reason: string | null
          request_code: number
          request_number: string | null
          requested_by: string
          status: string
          title: string
          total_estimated_amount: number | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          converted_to_purchase_id?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          department?: string | null
          description?: string | null
          id?: string
          justification?: string | null
          org_id: string
          priority?: string | null
          rejection_reason?: string | null
          request_code?: number
          request_number?: string | null
          requested_by: string
          status?: string
          title: string
          total_estimated_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          converted_to_purchase_id?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          department?: string | null
          description?: string | null
          id?: string
          justification?: string | null
          org_id?: string
          priority?: string | null
          rejection_reason?: string | null
          request_code?: number
          request_number?: string | null
          requested_by?: string
          status?: string
          title?: string
          total_estimated_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_converted_to_purchase_id_fkey"
            columns: ["converted_to_purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          created_by: string
          id: string
          notes: string | null
          org_id: string
          payment_status: string
          purchase_date: string
          purchase_number: string
          received_at: string | null
          status: string
          subtotal: number
          supplier_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          org_id: string
          payment_status?: string
          purchase_date?: string
          purchase_number: string
          received_at?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          org_id?: string
          payment_status?: string
          purchase_date?: string
          purchase_number?: string
          received_at?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          created_at: string
          description: string
          id: string
          quantity: number
          quote_id: string
          service_id: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          quantity?: number
          quote_id: string
          service_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          quote_id?: string
          service_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_quote_items_quote_id"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_quote_items_service_id"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          notes: string | null
          number: string
          org_id: string
          owner_id: string
          status: string
          title: string
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          number: string
          org_id: string
          owner_id: string
          status?: string
          title: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          number?: string
          org_id?: string
          owner_id?: string
          status?: string
          title?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_quotes_customer_id"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_purchase_template_items: {
        Row: {
          created_at: string
          description: string | null
          estimated_unit_price: number
          id: string
          justification: string | null
          product_name: string
          quantity: number
          supplier_suggestion: string | null
          template_id: string
          unit: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_unit_price?: number
          id?: string
          justification?: string | null
          product_name: string
          quantity?: number
          supplier_suggestion?: string | null
          template_id: string
          unit?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_unit_price?: number
          id?: string
          justification?: string | null
          product_name?: string
          quantity?: number
          supplier_suggestion?: string | null
          template_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_purchase_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "recurring_purchase_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_purchase_templates: {
        Row: {
          auto_submit: boolean
          cost_center: string | null
          created_at: string
          created_by: string
          description: string | null
          frequency_interval: number
          frequency_type: string
          id: string
          is_active: boolean
          last_executed_date: string | null
          next_execution_date: string | null
          org_id: string
          priority: string
          project_code: string | null
          template_name: string
          updated_at: string
        }
        Insert: {
          auto_submit?: boolean
          cost_center?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          frequency_interval?: number
          frequency_type: string
          id?: string
          is_active?: boolean
          last_executed_date?: string | null
          next_execution_date?: string | null
          org_id: string
          priority?: string
          project_code?: string | null
          template_name: string
          updated_at?: string
        }
        Update: {
          auto_submit?: boolean
          cost_center?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          frequency_interval?: number
          frequency_type?: string
          id?: string
          is_active?: boolean
          last_executed_date?: string | null
          next_execution_date?: string | null
          org_id?: string
          priority?: string
          project_code?: string | null
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      reforma_tributaria_config: {
        Row: {
          aliquota_cbs_padrao: number | null
          aliquota_ibs_municipal_padrao: number | null
          aliquota_ibs_uf_padrao: number | null
          ano_transicao: number
          created_at: string | null
          data_inicio_obrigatoriedade: string
          habilitar_ibs_cbs: boolean | null
          habilitar_imposto_seletivo: boolean | null
          id: string
          org_id: string
          percentual_aplicacao_novo: number | null
          percentual_reducao_antigo: number | null
          regime_tributario: string
          updated_at: string | null
        }
        Insert: {
          aliquota_cbs_padrao?: number | null
          aliquota_ibs_municipal_padrao?: number | null
          aliquota_ibs_uf_padrao?: number | null
          ano_transicao: number
          created_at?: string | null
          data_inicio_obrigatoriedade: string
          habilitar_ibs_cbs?: boolean | null
          habilitar_imposto_seletivo?: boolean | null
          id?: string
          org_id: string
          percentual_aplicacao_novo?: number | null
          percentual_reducao_antigo?: number | null
          regime_tributario: string
          updated_at?: string | null
        }
        Update: {
          aliquota_cbs_padrao?: number | null
          aliquota_ibs_municipal_padrao?: number | null
          aliquota_ibs_uf_padrao?: number | null
          ano_transicao?: number
          created_at?: string | null
          data_inicio_obrigatoriedade?: string
          habilitar_ibs_cbs?: boolean | null
          habilitar_imposto_seletivo?: boolean | null
          id?: string
          org_id?: string
          percentual_aplicacao_novo?: number | null
          percentual_reducao_antigo?: number | null
          regime_tributario?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reforma_tributaria_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_categories: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          moves_financial: boolean
          moves_stock: boolean
          name: string
          org_id: string
          updated_at: string
          visible_in_fiscal_operations: boolean
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          moves_financial?: boolean
          moves_stock?: boolean
          name: string
          org_id: string
          updated_at?: string
          visible_in_fiscal_operations?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          moves_financial?: boolean
          moves_stock?: boolean
          name?: string
          org_id?: string
          updated_at?: string
          visible_in_fiscal_operations?: boolean
        }
        Relationships: []
      }
      serial_number_history: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          location: string | null
          movement_type: string
          notes: string | null
          org_id: string
          serial_number_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          location?: string | null
          movement_type: string
          notes?: string | null
          org_id: string
          serial_number_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          location?: string | null
          movement_type?: string
          notes?: string | null
          org_id?: string
          serial_number_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "serial_number_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_number_history_serial_number_id_fkey"
            columns: ["serial_number_id"]
            isOneToOne: false
            referencedRelation: "serial_number_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      serial_number_tracking: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_location: string | null
          id: string
          lot_id: string | null
          org_id: string
          product_id: string
          serial_number: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_location?: string | null
          id?: string
          lot_id?: string | null
          org_id: string
          product_id: string
          serial_number: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_location?: string | null
          id?: string
          lot_id?: string | null
          org_id?: string
          product_id?: string
          serial_number?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serial_number_tracking_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lot_management"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_number_tracking_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_number_tracking_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_number_tracking_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_integrity_check"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string
          owner_id: string
          unit: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          owner_id: string
          unit?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          owner_id?: string
          unit?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string
          expiration_date: string | null
          id: string
          lot_id: string | null
          movement_type: string
          notes: string | null
          org_id: string
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          serial_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expiration_date?: string | null
          id?: string
          lot_id?: string | null
          movement_type: string
          notes?: string | null
          org_id: string
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          serial_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expiration_date?: string | null
          id?: string
          lot_id?: string | null
          movement_type?: string
          notes?: string | null
          org_id?: string
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          serial_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_integrity_check"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_cycle: string
          created_at: string | null
          description: string | null
          features: string[] | null
          id: string
          is_active: boolean | null
          max_customers: number | null
          max_invoices: number | null
          max_users: number | null
          name: string
          price: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle?: string
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          max_customers?: number | null
          max_invoices?: number | null
          max_users?: number | null
          name: string
          price: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          max_customers?: number | null
          max_invoices?: number | null
          max_users?: number | null
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      supplier_documents: {
        Row: {
          document_name: string
          document_type: string
          file_path: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          org_id: string
          supplier_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          document_name: string
          document_type: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          org_id: string
          supplier_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          document_name?: string
          document_type?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          org_id?: string
          supplier_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_documents_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_history: {
        Row: {
          action_type: string
          changed_at: string
          changed_by: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          org_id: string
          supplier_id: string
        }
        Insert: {
          action_type: string
          changed_at?: string
          changed_by: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          org_id: string
          supplier_id: string
        }
        Update: {
          action_type?: string
          changed_at?: string
          changed_by?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          org_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_history_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          average_delivery_time: string | null
          bank_account: string | null
          bank_agency: string | null
          bank_name: string | null
          billing_email: string | null
          business_activity: string | null
          city: string | null
          cnae_code: string | null
          commercial_notes: string | null
          complement: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          created_by: string
          credit_limit: number | null
          default_payment_terms: string | null
          document: string | null
          documents_folder: string | null
          email: string | null
          full_name: string | null
          general_observations: string | null
          id: string
          is_active: boolean
          landline_phone: string | null
          last_modified_at: string | null
          last_modified_by: string | null
          legal_name: string | null
          main_contact_name: string | null
          mobile_phone: string | null
          municipal_registration: string | null
          name: string
          neighborhood: string | null
          notes: string | null
          org_id: string
          payment_terms: string | null
          phone: string | null
          pix_key: string | null
          state: string | null
          state_registration: string | null
          status: string
          street_name: string | null
          street_number: string | null
          street_type: string | null
          supplier_type: string | null
          trade_name: string | null
          updated_at: string
          website_url: string | null
          whatsapp_phone: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          average_delivery_time?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          billing_email?: string | null
          business_activity?: string | null
          city?: string | null
          cnae_code?: string | null
          commercial_notes?: string | null
          complement?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          credit_limit?: number | null
          default_payment_terms?: string | null
          document?: string | null
          documents_folder?: string | null
          email?: string | null
          full_name?: string | null
          general_observations?: string | null
          id?: string
          is_active?: boolean
          landline_phone?: string | null
          last_modified_at?: string | null
          last_modified_by?: string | null
          legal_name?: string | null
          main_contact_name?: string | null
          mobile_phone?: string | null
          municipal_registration?: string | null
          name: string
          neighborhood?: string | null
          notes?: string | null
          org_id: string
          payment_terms?: string | null
          phone?: string | null
          pix_key?: string | null
          state?: string | null
          state_registration?: string | null
          status?: string
          street_name?: string | null
          street_number?: string | null
          street_type?: string | null
          supplier_type?: string | null
          trade_name?: string | null
          updated_at?: string
          website_url?: string | null
          whatsapp_phone?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          average_delivery_time?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          billing_email?: string | null
          business_activity?: string | null
          city?: string | null
          cnae_code?: string | null
          commercial_notes?: string | null
          complement?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          credit_limit?: number | null
          default_payment_terms?: string | null
          document?: string | null
          documents_folder?: string | null
          email?: string | null
          full_name?: string | null
          general_observations?: string | null
          id?: string
          is_active?: boolean
          landline_phone?: string | null
          last_modified_at?: string | null
          last_modified_by?: string | null
          legal_name?: string | null
          main_contact_name?: string | null
          mobile_phone?: string | null
          municipal_registration?: string | null
          name?: string
          neighborhood?: string | null
          notes?: string | null
          org_id?: string
          payment_terms?: string | null
          phone?: string | null
          pix_key?: string | null
          state?: string | null
          state_registration?: string | null
          status?: string
          street_name?: string | null
          street_number?: string | null
          street_type?: string | null
          supplier_type?: string | null
          trade_name?: string | null
          updated_at?: string
          website_url?: string | null
          whatsapp_phone?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          org_id: string
          source_id: string
          source_table: string
          status: string
          sync_type: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          org_id: string
          source_id: string
          source_table: string
          status?: string
          sync_type: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          org_id?: string
          source_id?: string
          source_table?: string
          status?: string
          sync_type?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      tax_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_groups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_audit: {
        Row: {
          action_type: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          org_id: string
          record_id: string
          request_id: string | null
          session_id: string | null
          table_name: string
          transaction_type: string
          user_agent: string | null
          user_id: string
          user_ip: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          org_id: string
          record_id: string
          request_id?: string | null
          session_id?: string | null
          table_name: string
          transaction_type: string
          user_agent?: string | null
          user_id: string
          user_ip?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          org_id?: string
          record_id?: string
          request_id?: string | null
          session_id?: string | null
          table_name?: string
          transaction_type?: string
          user_agent?: string | null
          user_id?: string
          user_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_audit_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      units_of_measurement: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          symbol: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          symbol: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          org_id: string
          priority: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          org_id: string
          priority?: string
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          org_id?: string
          priority?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organizations: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: string
          subscription_plan_id: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: string
          subscription_plan_id?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: string
          subscription_plan_id?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organizations_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
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
      warehouses: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          location: string | null
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      analytical_accounts: {
        Row: {
          account_code: string | null
          account_name: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_expense: boolean | null
          nature_code: string | null
          org_id: string | null
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_code?: string | null
          account_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_expense?: boolean | null
          nature_code?: string | null
          org_id?: string | null
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_code?: string | null
          account_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_expense?: boolean | null
          nature_code?: string | null
          org_id?: string | null
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_summary: {
        Row: {
          action: string | null
          action_count: number | null
          audit_date: string | null
          entity_type: string | null
          first_action: string | null
          last_action: string | null
          org_id: string | null
          unique_users: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      blockchain_statistics: {
        Row: {
          first_block_date: string | null
          invalid_blocks: number | null
          last_block_date: string | null
          org_id: string | null
          total_blocks: number | null
          transaction_types: number | null
          unique_users: number | null
          valid_blocks: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_entries_report: {
        Row: {
          account_code: string | null
          account_name: string | null
          amount: number | null
          bank_account_id: string | null
          chart_of_account_id: string | null
          company_id: string | null
          company_name: string | null
          competence_date: string | null
          cost_center_code: string | null
          cost_center_id: string | null
          cost_center_name: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          entry_type: string | null
          id: string | null
          is_expense: boolean | null
          is_settled: boolean | null
          nature_code: string | null
          org_id: string | null
          origin_id: string | null
          origin_type: string | null
          payment_method_id: string | null
          person_id: string | null
          person_name: string | null
          person_type: string | null
          settled_at: string | null
          settled_payment_method_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_financial_entries_chart_of_account"
            columns: ["chart_of_account_id"]
            isOneToOne: false
            referencedRelation: "analytical_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financial_entries_chart_of_account"
            columns: ["chart_of_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financial_entries_chart_of_account_id"
            columns: ["chart_of_account_id"]
            isOneToOne: false
            referencedRelation: "analytical_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financial_entries_chart_of_account_id"
            columns: ["chart_of_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financial_entries_company_id"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financial_entries_cost_center"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_integrity_check: {
        Row: {
          calculated_total: number | null
          created_at: string | null
          declared_total: number | null
          financial_entries_count: number | null
          id: string | null
          items_count: number | null
          order_number: string | null
          payment_status: string | null
          status: string | null
          status_check: string | null
          stock_movements_count: number | null
          value_difference: number | null
        }
        Relationships: []
      }
      sales_sync_statistics: {
        Row: {
          financial_sync_percentage: number | null
          orders_with_financial_sync: number | null
          orders_with_stock_sync: number | null
          paid_orders: number | null
          processed_orders: number | null
          stock_sync_percentage: number | null
          total_orders: number | null
        }
        Relationships: []
      }
      stock_integrity_check: {
        Row: {
          calculated_stock: number | null
          declared_stock: number | null
          id: string | null
          movements_count: number | null
          name: string | null
          status_check: string | null
          stock_difference: number | null
          system_code: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_nfce_contingency: {
        Args: { p_motivo: string; p_org_id: string }
        Returns: boolean
      }
      add_blockchain_record: {
        Args: {
          p_data_snapshot: Json
          p_org_id: string
          p_record_id: string
          p_table_name: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: string
      }
      approve_access_request: {
        Args: { notes?: string; request_id: string; reviewer_id: string }
        Returns: undefined
      }
      auto_allocate_lots: {
        Args: {
          p_org_id: string
          p_product_id: string
          p_required_quantity: number
          p_warehouse_id?: string
        }
        Returns: {
          allocated_quantity: number
          expiration_date: string
          lot_id: string
          lot_number: string
          manufacturing_date: string
        }[]
      }
      calcular_ibs_cbs_is: {
        Args: {
          p_aliquota_cbs: number
          p_aliquota_ibs_mun: number
          p_aliquota_ibs_uf: number
          p_aliquota_is?: number
          p_valor_base: number
        }
        Returns: {
          cbs_valor: number
          ibs_mun_valor: number
          ibs_uf_valor: number
          is_valor: number
          valor_total_tributos: number
        }[]
      }
      calculate_installment_charges: {
        Args: { p_installment_id: string; p_payment_date?: string }
        Returns: {
          days_early: number
          days_late: number
          discount_amount: number
          final_amount: number
          interest_amount: number
          late_fee: number
          original_amount: number
        }[]
      }
      calculate_nfe_totals: { Args: { p_nfe_id: string }; Returns: undefined }
      check_low_stock_alert: {
        Args: never
        Returns: {
          current_stock: number
          min_stock: number
          org_id: string
          product_id: string
          product_name: string
          reorder_point: number
        }[]
      }
      cleanup_expired_admin_notifications: { Args: never; Returns: undefined }
      cleanup_expired_notifications: { Args: never; Returns: undefined }
      cleanup_old_audit_logs: {
        Args: { p_retention_days?: number }
        Returns: number
      }
      cleanup_old_nfce_logs: { Args: never; Returns: undefined }
      cleanup_old_notifications: { Args: never; Returns: undefined }
      create_admin_audit_log: {
        Args: {
          p_action_type: string
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
          p_new_values?: Json
          p_old_values?: Json
          p_org_id: string
        }
        Returns: string
      }
      create_blockchain_alert: {
        Args: {
          p_alert_type: string
          p_block_id: string
          p_block_number: number
          p_details?: Json
          p_message: string
          p_org_id: string
          p_severity: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          p_action_url?: string
          p_message: string
          p_metadata?: Json
          p_org_id: string
          p_priority?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      create_organization_with_owner: {
        Args: { org_name: string; org_slug: string }
        Returns: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }[]
      }
      create_sync_log: {
        Args: {
          p_org_id: string
          p_source_id: string
          p_source_table: string
          p_sync_type: string
          p_target_id?: string
          p_target_table?: string
        }
        Returns: string
      }
      deactivate_nfce_contingency: {
        Args: { p_org_id: string }
        Returns: boolean
      }
      export_audit_logs: {
        Args: { p_end_date: string; p_org_id: string; p_start_date: string }
        Returns: {
          action: string
          entity_id: string
          entity_type: string
          event_timestamp: string
          field_name: string
          ip_address: string
          new_value: string
          old_value: string
          user_email: string
        }[]
      }
      generate_blockchain_hash: {
        Args: {
          p_block_number: number
          p_data_snapshot: Json
          p_previous_hash: string
          p_record_id: string
          p_table_name: string
          p_timestamp: string
          p_transaction_type: string
        }
        Returns: string
      }
      generate_cash_flow_projections: {
        Args: { p_days_ahead?: number; p_org_id: string }
        Returns: {
          projected_balance: number
          projected_inflow: number
          projected_outflow: number
          projection_date: string
        }[]
      }
      generate_installments: {
        Args: {
          p_created_by: string
          p_entry_id: string
          p_first_due_date: string
          p_num_installments: number
          p_org_id: string
          p_total_amount: number
        }
        Returns: {
          amount: number
          due_date: string
          installment_number: number
        }[]
      }
      generate_next_caixa_number: {
        Args: { p_org_id: string }
        Returns: number
      }
      generate_next_entry_code: { Args: { p_org_id: string }; Returns: number }
      generate_next_nfce_number: {
        Args: { p_org_id: string; p_serie?: string }
        Returns: number
      }
      generate_next_nfe_number: {
        Args: { p_org_id: string; p_serie?: string }
        Returns: number
      }
      generate_next_nfse_number: {
        Args: { p_org_id: string; p_serie?: string }
        Returns: number
      }
      generate_next_order_number: {
        Args: { p_org_id: string }
        Returns: number
      }
      generate_next_payment_method_code: {
        Args: { p_org_id: string }
        Returns: string
      }
      generate_next_purchase_number: {
        Args: { p_org_id: string }
        Returns: number
      }
      generate_next_quote_number: {
        Args: { p_org_id: string }
        Returns: number
      }
      generate_next_system_code: { Args: { p_org_id: string }; Returns: string }
      get_audit_timeline: {
        Args: {
          p_end_date?: string
          p_entity_id?: string
          p_entity_type?: string
          p_limit?: number
          p_org_id: string
          p_start_date?: string
          p_user_id?: string
        }
        Returns: {
          action: string
          entity_id: string
          entity_type: string
          event_timestamp: string
          field_name: string
          id: string
          ip_address: string
          metadata: Json
          new_value: string
          old_value: string
          user_email: string
        }[]
      }
      get_expiring_lots_alert: {
        Args: { p_days_threshold?: number; p_org_id: string }
        Returns: {
          available_quantity: number
          days_until_expiration: number
          expiration_date: string
          lot_id: string
          lot_number: string
          product_id: string
          product_name: string
          severity: string
          warehouse_id: string
          warehouse_name: string
        }[]
      }
      get_installments_summary: {
        Args: { p_entry_id: string }
        Returns: {
          next_due_date: string
          pending_amount: number
          pending_installments: number
          settled_amount: number
          settled_installments: number
          total_amount: number
          total_installments: number
        }[]
      }
      get_last_blockchain_hash: {
        Args: { p_org_id: string }
        Returns: {
          block_number: number
          current_hash: string
        }[]
      }
      get_overdue_installments_with_charges: {
        Args: { p_org_id: string; p_reference_date?: string }
        Returns: {
          days_overdue: number
          due_date: string
          entry_id: string
          entry_type: string
          final_amount: number
          installment_id: string
          installment_number: number
          interest_amount: number
          late_fee: number
          original_amount: number
          person_name: string
          total_installments: number
        }[]
      }
      get_pending_contingency_nfce: {
        Args: { p_limit?: number; p_org_id: string }
        Returns: {
          created_at: string
          id: string
          nfce_data: Json
          retry_count: number
        }[]
      }
      get_sync_statistics: {
        Args: { p_days?: number; p_org_id: string }
        Returns: {
          failed_syncs: number
          success_rate: number
          successful_syncs: number
          sync_type: string
          total_syncs: number
        }[]
      }
      get_unread_blockchain_alerts_count: {
        Args: { p_org_id: string }
        Returns: number
      }
      get_unread_notification_count: {
        Args: { p_org_id: string }
        Returns: number
      }
      get_warehouse_stock: {
        Args: { p_product_id: string; p_warehouse_id: string }
        Returns: number
      }
      has_children: {
        Args: { item_id: string; table_name: string }
        Returns: boolean
      }
      has_feature_permission: {
        Args: {
          _feature_key: string
          _org_id: string
          _permission_type: string
          _user_id: string
        }
        Returns: boolean
      }
      has_module_permission: {
        Args: {
          _module_key: string
          _org_id: string
          _permission_type: string
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_used_in_financial_entries: {
        Args: { item_id: string; reference_type: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_field_name?: string
          p_metadata?: Json
          p_new_value?: string
          p_old_value?: string
          p_org_id: string
        }
        Returns: string
      }
      mark_all_notifications_as_read: {
        Args: { p_org_id: string }
        Returns: number
      }
      mark_contingency_failed: {
        Args: { p_error_message: string; p_queue_id: string }
        Returns: boolean
      }
      mark_contingency_transmitted: {
        Args: { p_queue_id: string }
        Returns: boolean
      }
      mark_notification_as_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      reject_access_request: {
        Args: { notes: string; request_id: string; reviewer_id: string }
        Returns: undefined
      }
      settle_installment: {
        Args: {
          p_bank_account_id?: string
          p_installment_id: string
          p_payment_method_id?: string
          p_settled_amount: number
        }
        Returns: boolean
      }
      settle_installment_with_charges: {
        Args: {
          p_bank_account_id?: string
          p_custom_amount?: number
          p_installment_id: string
          p_payment_date?: string
          p_payment_method_id?: string
        }
        Returns: {
          discount_amount: number
          final_amount: number
          interest_amount: number
          late_fee: number
          message: string
          original_amount: number
          success: boolean
        }[]
      }
      simulate_installment_payment: {
        Args: { p_installment_id: string; p_payment_date?: string }
        Returns: {
          days_early: number
          days_late: number
          discount_amount: number
          due_date: string
          final_amount: number
          installment_number: number
          interest_amount: number
          late_fee: number
          original_amount: number
          payment_date: string
          total_charges: number
          total_discount: number
        }[]
      }
      stock_entry_atomic: {
        Args: {
          p_created_by?: string
          p_entry_type?: string
          p_lot_id?: string
          p_notes?: string
          p_org_id: string
          p_product_id: string
          p_quantity: number
          p_reason?: string
          p_reference_document?: string
          p_supplier_id?: string
          p_total_cost?: number
          p_unit_cost?: number
          p_warehouse_id: string
        }
        Returns: Json
      }
      stock_exit_with_validation: {
        Args: {
          p_created_by?: string
          p_destination?: string
          p_exit_type?: string
          p_lot_id?: string
          p_notes?: string
          p_org_id: string
          p_product_id: string
          p_quantity: number
          p_reason?: string
          p_reference_document?: string
          p_warehouse_id: string
        }
        Returns: Json
      }
      stock_transfer_atomic: {
        Args: {
          p_created_by?: string
          p_lot_id?: string
          p_notes?: string
          p_org_id: string
          p_product_id: string
          p_quantity: number
          p_reason?: string
          p_warehouse_from: string
          p_warehouse_to: string
        }
        Returns: Json
      }
      suggest_lot_fifo: {
        Args: {
          p_org_id: string
          p_product_id: string
          p_required_quantity?: number
          p_warehouse_id?: string
        }
        Returns: {
          available_quantity: number
          days_until_expiration: number
          expiration_date: string
          lot_id: string
          lot_number: string
          manufacturing_date: string
          suggested_quantity: number
        }[]
      }
      unsettle_installment: {
        Args: { p_installment_id: string }
        Returns: boolean
      }
      update_organization_financial_config: {
        Args: {
          p_daily_interest_percentage?: number
          p_early_discount_days?: number
          p_early_discount_percentage?: number
          p_late_fee_percentage?: number
          p_org_id: string
        }
        Returns: boolean
      }
      validate_account_code_hierarchy: {
        Args: { new_account_code: string; parent_account_code: string }
        Returns: boolean
      }
      validate_blockchain_chain: {
        Args: { p_org_id: string }
        Returns: {
          first_invalid_block: number
          invalid_blocks: number
          is_valid: boolean
          total_blocks: number
          validation_message: string
        }[]
      }
      validate_hierarchy_cycle: {
        Args: { new_id: string; new_parent_id: string; table_name: string }
        Returns: boolean
      }
      validate_lot_fifo: {
        Args: {
          p_lot_id: string
          p_org_id: string
          p_product_id: string
          p_warehouse_id?: string
        }
        Returns: Json
      }
      validate_nfce_emission: {
        Args: { p_org_id: string }
        Returns: {
          errors: string[]
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "user" | "admin" | "superadmin"
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
      app_role: ["user", "admin", "superadmin"],
    },
  },
} as const
