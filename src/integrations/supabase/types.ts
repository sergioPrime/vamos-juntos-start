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
          person_id: string
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
          person_id: string
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
          person_id?: string
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
      nfse: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          invoice_id: string | null
          iss_amount: number | null
          iss_rate: number | null
          issued_at: string | null
          net_amount: number | null
          number: string | null
          org_id: string
          owner_id: string
          pdf_url: string | null
          service_amount: number
          service_description: string
          status: string
          updated_at: string
          verification_code: string | null
          xml_content: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          iss_amount?: number | null
          iss_rate?: number | null
          issued_at?: string | null
          net_amount?: number | null
          number?: string | null
          org_id: string
          owner_id: string
          pdf_url?: string | null
          service_amount?: number
          service_description: string
          status?: string
          updated_at?: string
          verification_code?: string | null
          xml_content?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          iss_amount?: number | null
          iss_rate?: number | null
          issued_at?: string | null
          net_amount?: number | null
          number?: string | null
          org_id?: string
          owner_id?: string
          pdf_url?: string | null
          service_amount?: number
          service_description?: string
          status?: string
          updated_at?: string
          verification_code?: string | null
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_nfse_customer_id"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_nfse_invoice_id"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
        Relationships: []
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
      transaction_audit: {
        Row: {
          action_type: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          org_id: string
          record_id: string
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
          new_data?: Json | null
          old_data?: Json | null
          org_id: string
          record_id: string
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
          new_data?: Json | null
          old_data?: Json | null
          org_id?: string
          record_id?: string
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
    }
    Functions: {
      approve_access_request: {
        Args: { notes?: string; request_id: string; reviewer_id: string }
        Returns: undefined
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
      validate_hierarchy_cycle: {
        Args: { new_id: string; new_parent_id: string; table_name: string }
        Returns: boolean
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
