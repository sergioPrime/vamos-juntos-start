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
          account_number: string
          account_type: string
          agency: string | null
          balance: number
          bank_code: string | null
          bank_name: string
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean
          org_id: string
          updated_at: string
        }
        Insert: {
          account_number: string
          account_type?: string
          agency?: string | null
          balance?: number
          bank_code?: string | null
          bank_name: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          org_id: string
          updated_at?: string
        }
        Update: {
          account_number?: string
          account_type?: string
          agency?: string | null
          balance?: number
          bank_code?: string | null
          bank_name?: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          org_id?: string
          updated_at?: string
        }
        Relationships: []
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
        }
        Insert: {
          chart_of_account_id: string
          cost_center_id: string
          created_at?: string
          id?: string
        }
        Update: {
          chart_of_account_id?: string
          cost_center_id?: string
          created_at?: string
          id?: string
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
            foreignKeyName: "fk_financial_entries_chart_account"
            columns: ["chart_of_account_id"]
            isOneToOne: false
            referencedRelation: "analytical_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financial_entries_chart_account"
            columns: ["chart_of_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "fk_financial_entries_cost_center"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
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
          id: string
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
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
          created_at: string
          id: string
          name: string
          org_id: string
          type: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          org_id: string
          type: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          type?: string
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
        Relationships: []
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
          sku: string | null
          stock_quantity: number
          supplier_code: string | null
          supplier_id: string | null
          system_code: string | null
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
          sku?: string | null
          stock_quantity?: number
          supplier_code?: string | null
          supplier_id?: string | null
          system_code?: string | null
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
          sku?: string | null
          stock_quantity?: number
          supplier_code?: string | null
          supplier_id?: string | null
          system_code?: string | null
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
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
            foreignKeyName: "fk_financial_entries_chart_account"
            columns: ["chart_of_account_id"]
            isOneToOne: false
            referencedRelation: "analytical_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financial_entries_chart_account"
            columns: ["chart_of_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
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
      generate_cash_flow_projections: {
        Args: { p_days_ahead?: number; p_org_id: string }
        Returns: {
          projected_balance: number
          projected_inflow: number
          projected_outflow: number
          projection_date: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_children: {
        Args: { item_id: string; table_name: string }
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
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
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
