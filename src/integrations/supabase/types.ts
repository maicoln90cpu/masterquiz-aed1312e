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
      ab_test_sessions: {
        Row: {
          completed_at: string | null
          converted: boolean
          id: string
          ip_address: unknown
          quiz_id: string
          started_at: string
          time_to_complete_seconds: number | null
          user_agent: string | null
          variant_id: string | null
          visitor_id: string
        }
        Insert: {
          completed_at?: string | null
          converted?: boolean
          id?: string
          ip_address?: unknown
          quiz_id: string
          started_at?: string
          time_to_complete_seconds?: number | null
          user_agent?: string | null
          variant_id?: string | null
          visitor_id: string
        }
        Update: {
          completed_at?: string | null
          converted?: boolean
          id?: string
          ip_address?: unknown
          quiz_id?: string
          started_at?: string
          time_to_complete_seconds?: number | null
          user_agent?: string | null
          variant_id?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ab_test_sessions_quiz_id"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_quiz_generations: {
        Row: {
          completion_tokens: number | null
          created_at: string | null
          estimated_cost_usd: number | null
          generation_month: string
          id: string
          input_data: Json
          model_used: string
          prompt_tokens: number | null
          questions_generated: number
          quiz_id: string | null
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string | null
          estimated_cost_usd?: number | null
          generation_month?: string
          id?: string
          input_data: Json
          model_used: string
          prompt_tokens?: number | null
          questions_generated: number
          quiz_id?: string | null
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string | null
          estimated_cost_usd?: number | null
          generation_month?: string
          id?: string
          input_data?: Json
          model_used?: string
          prompt_tokens?: number | null
          questions_generated?: number
          quiz_id?: string | null
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_generation_logs: {
        Row: {
          completion_tokens: number | null
          created_at: string
          error_message: string | null
          generation_type: string | null
          id: string
          image_cost_usd: number | null
          model_used: string
          post_id: string | null
          prompt_tokens: number | null
          status: string
          text_cost_usd: number | null
          total_cost_usd: number | null
          total_tokens: number | null
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string
          error_message?: string | null
          generation_type?: string | null
          id?: string
          image_cost_usd?: number | null
          model_used: string
          post_id?: string | null
          prompt_tokens?: number | null
          status?: string
          text_cost_usd?: number | null
          total_cost_usd?: number | null
          total_tokens?: number | null
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string
          error_message?: string | null
          generation_type?: string | null
          id?: string
          image_cost_usd?: number | null
          model_used?: string
          post_id?: string | null
          prompt_tokens?: number | null
          status?: string
          text_cost_usd?: number | null
          total_cost_usd?: number | null
          total_tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_generation_logs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_image_prompts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_used_at: string | null
          name: string
          prompt_template: string
          style_description: string | null
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name: string
          prompt_template: string
          style_description?: string | null
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name?: string
          prompt_template?: string
          style_description?: string | null
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string | null
          categories: string[] | null
          content: string
          created_at: string
          excerpt: string | null
          faq_schema: Json | null
          featured_image_url: string | null
          generation_cost_usd: number | null
          id: string
          image_generation_cost_usd: number | null
          included_in_digest: boolean | null
          internal_links: Json | null
          is_ai_generated: boolean | null
          meta_description: string | null
          meta_title: string | null
          model_used: string | null
          og_image_url: string | null
          published_at: string | null
          reading_time_min: number | null
          seo_keywords: string[] | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          author_name?: string | null
          categories?: string[] | null
          content?: string
          created_at?: string
          excerpt?: string | null
          faq_schema?: Json | null
          featured_image_url?: string | null
          generation_cost_usd?: number | null
          id?: string
          image_generation_cost_usd?: number | null
          included_in_digest?: boolean | null
          internal_links?: Json | null
          is_ai_generated?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          model_used?: string | null
          og_image_url?: string | null
          published_at?: string | null
          reading_time_min?: number | null
          seo_keywords?: string[] | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          author_name?: string | null
          categories?: string[] | null
          content?: string
          created_at?: string
          excerpt?: string | null
          faq_schema?: Json | null
          featured_image_url?: string | null
          generation_cost_usd?: number | null
          id?: string
          image_generation_cost_usd?: number | null
          included_in_digest?: boolean | null
          internal_links?: Json | null
          is_ai_generated?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          model_used?: string | null
          og_image_url?: string | null
          published_at?: string | null
          reading_time_min?: number | null
          seo_keywords?: string[] | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: []
      }
      blog_settings: {
        Row: {
          ai_model: string | null
          auto_publish: boolean | null
          categories_list: Json | null
          created_at: string
          cron_schedule: string | null
          default_author: string | null
          id: string
          image_model: string | null
          image_prompt_template: string | null
          is_active: boolean | null
          system_prompt: string | null
          topics_pool: Json | null
          updated_at: string
        }
        Insert: {
          ai_model?: string | null
          auto_publish?: boolean | null
          categories_list?: Json | null
          created_at?: string
          cron_schedule?: string | null
          default_author?: string | null
          id?: string
          image_model?: string | null
          image_prompt_template?: string | null
          is_active?: boolean | null
          system_prompt?: string | null
          topics_pool?: Json | null
          updated_at?: string
        }
        Update: {
          ai_model?: string | null
          auto_publish?: boolean | null
          categories_list?: Json | null
          created_at?: string
          cron_schedule?: string | null
          default_author?: string | null
          id?: string
          image_model?: string | null
          image_prompt_template?: string | null
          is_active?: boolean | null
          system_prompt?: string | null
          topics_pool?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      bunny_videos: {
        Row: {
          bunny_video_id: string
          cdn_url: string | null
          created_at: string
          duration_seconds: number | null
          file_name: string
          id: string
          original_name: string | null
          quiz_id: string | null
          size_mb: number
          status: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bunny_video_id: string
          cdn_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_name: string
          id?: string
          original_name?: string | null
          quiz_id?: string | null
          size_mb?: number
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bunny_video_id?: string
          cdn_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_name?: string
          id?: string
          original_name?: string | null
          quiz_id?: string | null
          size_mb?: number
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_error_logs: {
        Row: {
          component_name: string | null
          created_at: string
          error_message: string
          id: string
          metadata: Json | null
          stack_trace: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_name?: string | null
          created_at?: string
          error_message: string
          id?: string
          metadata?: Json | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_name?: string | null
          created_at?: string
          error_message?: string
          id?: string
          metadata?: Json | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cookie_consents: {
        Row: {
          accepted_at: string
          consent_analytics: boolean
          consent_functional: boolean
          consent_marketing: boolean
          id: string
          ip_address: unknown
          session_id: string | null
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string
          consent_analytics?: boolean
          consent_functional?: boolean
          consent_marketing?: boolean
          id?: string
          ip_address?: unknown
          session_id?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string
          consent_analytics?: boolean
          consent_functional?: boolean
          consent_marketing?: boolean
          id?: string
          ip_address?: unknown
          session_id?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      custom_form_fields: {
        Row: {
          created_at: string
          field_name: string
          field_options: Json | null
          field_type: Database["public"]["Enums"]["field_type"]
          id: string
          is_required: boolean
          order_number: number
          quiz_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_name: string
          field_options?: Json | null
          field_type: Database["public"]["Enums"]["field_type"]
          id?: string
          is_required?: boolean
          order_number: number
          quiz_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_name?: string
          field_options?: Json | null
          field_type?: Database["public"]["Enums"]["field_type"]
          id?: string
          is_required?: boolean
          order_number?: number
          quiz_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_custom_form_fields_quiz_id"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      email_automation_config: {
        Row: {
          automation_key: string
          created_at: string | null
          description: string | null
          display_name: string
          execution_count: number | null
          frequency: string | null
          id: string
          is_enabled: boolean | null
          last_executed_at: string | null
          last_result: Json | null
          updated_at: string | null
        }
        Insert: {
          automation_key: string
          created_at?: string | null
          description?: string | null
          display_name: string
          execution_count?: number | null
          frequency?: string | null
          id?: string
          is_enabled?: boolean | null
          last_executed_at?: string | null
          last_result?: Json | null
          updated_at?: string | null
        }
        Update: {
          automation_key?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          execution_count?: number | null
          frequency?: string | null
          id?: string
          is_enabled?: boolean | null
          last_executed_at?: string | null
          last_result?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_automation_logs: {
        Row: {
          automation_key: string
          details: Json | null
          emails_sent: number | null
          error_message: string | null
          executed_at: string | null
          id: string
          status: string
        }
        Insert: {
          automation_key: string
          details?: Json | null
          emails_sent?: number | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          status?: string
        }
        Update: {
          automation_key?: string
          details?: Json | null
          emails_sent?: number | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      email_generation_logs: {
        Row: {
          completion_tokens: number | null
          created_at: string
          estimated_cost_usd: number | null
          id: string
          model_used: string
          prompt_tokens: number | null
          template_type: string
          total_tokens: number | null
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string
          estimated_cost_usd?: number | null
          id?: string
          model_used?: string
          prompt_tokens?: number | null
          template_type: string
          total_tokens?: number | null
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string
          estimated_cost_usd?: number | null
          id?: string
          model_used?: string
          prompt_tokens?: number | null
          template_type?: string
          total_tokens?: number | null
        }
        Relationships: []
      }
      email_recovery_contacts: {
        Row: {
          ab_variant: string | null
          campaign_id: string | null
          clicked_at: string | null
          created_at: string | null
          days_inactive_at_contact: number | null
          egoi_message_id: string | null
          email: string
          error_message: string | null
          id: string
          opened_at: string | null
          priority: number | null
          retry_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          template_id: string | null
          updated_at: string | null
          user_id: string
          user_lead_count: number | null
          user_plan_at_contact: string | null
          user_quiz_count: number | null
        }
        Insert: {
          ab_variant?: string | null
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          days_inactive_at_contact?: number | null
          egoi_message_id?: string | null
          email: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          priority?: number | null
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string | null
          user_id: string
          user_lead_count?: number | null
          user_plan_at_contact?: string | null
          user_quiz_count?: number | null
        }
        Update: {
          ab_variant?: string | null
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          days_inactive_at_contact?: number | null
          egoi_message_id?: string | null
          email?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          priority?: number | null
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string | null
          user_id?: string
          user_lead_count?: number | null
          user_plan_at_contact?: string | null
          user_quiz_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_recovery_contacts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_recovery_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_recovery_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_recovery_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_recovery_settings: {
        Row: {
          allowed_hours_end: string | null
          allowed_hours_start: string | null
          batch_size: number | null
          created_at: string | null
          daily_email_limit: number | null
          exclude_plan_types: Json | null
          hourly_email_limit: number | null
          id: string
          inactivity_days_trigger: number | null
          is_active: boolean | null
          sender_email: string | null
          sender_name: string | null
          updated_at: string | null
          user_cooldown_days: number | null
        }
        Insert: {
          allowed_hours_end?: string | null
          allowed_hours_start?: string | null
          batch_size?: number | null
          created_at?: string | null
          daily_email_limit?: number | null
          exclude_plan_types?: Json | null
          hourly_email_limit?: number | null
          id?: string
          inactivity_days_trigger?: number | null
          is_active?: boolean | null
          sender_email?: string | null
          sender_name?: string | null
          updated_at?: string | null
          user_cooldown_days?: number | null
        }
        Update: {
          allowed_hours_end?: string | null
          allowed_hours_start?: string | null
          batch_size?: number | null
          created_at?: string | null
          daily_email_limit?: number | null
          exclude_plan_types?: Json | null
          hourly_email_limit?: number | null
          id?: string
          inactivity_days_trigger?: number | null
          is_active?: boolean | null
          sender_email?: string | null
          sender_name?: string | null
          updated_at?: string | null
          user_cooldown_days?: number | null
        }
        Relationships: []
      }
      email_recovery_templates: {
        Row: {
          category: string
          click_rate: number | null
          created_at: string | null
          created_by: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          open_rate: number | null
          priority: number | null
          subject: string
          subject_b: string | null
          trigger_days: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string
          click_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name: string
          open_rate?: number | null
          priority?: number | null
          subject?: string
          subject_b?: string | null
          trigger_days?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          click_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          open_rate?: number | null
          priority?: number | null
          subject?: string
          subject_b?: string | null
          trigger_days?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      email_tips: {
        Row: {
          created_at: string | null
          html_content: string | null
          id: string
          subject: string | null
          topic: string
        }
        Insert: {
          created_at?: string | null
          html_content?: string | null
          id?: string
          subject?: string | null
          topic: string
        }
        Update: {
          created_at?: string | null
          html_content?: string | null
          id?: string
          subject?: string | null
          topic?: string
        }
        Relationships: []
      }
      email_unsubscribes: {
        Row: {
          email: string
          id: string
          reason: string | null
          unsubscribed_at: string | null
          user_id: string | null
        }
        Insert: {
          email: string
          id?: string
          reason?: string | null
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Update: {
          email?: string
          id?: string
          reason?: string | null
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      gtm_event_integrations: {
        Row: {
          event_name: string
          gtm_event_name: string | null
          id: string
          is_integrated: boolean | null
          updated_at: string | null
        }
        Insert: {
          event_name: string
          gtm_event_name?: string | null
          id?: string
          is_integrated?: boolean | null
          updated_at?: string | null
        }
        Update: {
          event_name?: string
          gtm_event_name?: string | null
          id?: string
          is_integrated?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gtm_event_logs: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      institutional_email_domains: {
        Row: {
          created_at: string
          created_by: string | null
          domain: string
          id: string
          is_active: boolean
          notes: string | null
          reason: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          domain: string
          id?: string
          is_active?: boolean
          notes?: string | null
          reason?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          domain?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          reason?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_logs: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          id: string
          integration_id: string | null
          provider: string
          quiz_id: string | null
          request_payload: Json | null
          response_id: string | null
          response_payload: Json | null
          status: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          id?: string
          integration_id?: string | null
          provider: string
          quiz_id?: string | null
          request_payload?: Json | null
          response_id?: string | null
          response_payload?: Json | null
          status: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: string
          integration_id?: string | null
          provider?: string
          quiz_id?: string | null
          request_payload?: Json | null
          response_id?: string | null
          response_payload?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_integration_logs_integration_id"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_ab_sessions: {
        Row: {
          conversion_type: string | null
          converted: boolean | null
          converted_at: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          session_id: string
          test_id: string | null
          user_agent: string | null
          variant: string
        }
        Insert: {
          conversion_type?: string | null
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          session_id: string
          test_id?: string | null
          user_agent?: string | null
          variant: string
        }
        Update: {
          conversion_type?: string | null
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          session_id?: string
          test_id?: string | null
          user_agent?: string | null
          variant?: string
        }
        Relationships: []
      }
      landing_ab_tests: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          target_element: string | null
          traffic_split: number | null
          updated_at: string | null
          variant_a_content: Json | null
          variant_b_content: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          target_element?: string | null
          traffic_split?: number | null
          updated_at?: string | null
          variant_a_content?: Json | null
          variant_b_content?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          target_element?: string | null
          traffic_split?: number | null
          updated_at?: string | null
          variant_a_content?: Json | null
          variant_b_content?: Json | null
        }
        Relationships: []
      }
      landing_content: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          key: string
          site_mode: string
          updated_at: string | null
          value_en: string | null
          value_es: string | null
          value_pt: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          site_mode?: string
          updated_at?: string | null
          value_en?: string | null
          value_es?: string | null
          value_pt?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          site_mode?: string
          updated_at?: string | null
          value_en?: string | null
          value_es?: string | null
          value_pt?: string | null
        }
        Relationships: []
      }
      login_events: {
        Row: {
          id: string
          logged_in_at: string
          user_id: string
        }
        Insert: {
          id?: string
          logged_in_at?: string
          user_id: string
        }
        Update: {
          id?: string
          logged_in_at?: string
          user_id?: string
        }
        Relationships: []
      }
      master_admin_emails: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          id: string
          notify_new_responses: boolean | null
          notify_weekly_report: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notify_new_responses?: boolean | null
          notify_weekly_report?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notify_new_responses?: boolean | null
          notify_weekly_report?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      performance_logs: {
        Row: {
          created_at: string
          duration_ms: number
          id: string
          is_slow: boolean | null
          metadata: Json | null
          operation_name: string
          operation_type: string
        }
        Insert: {
          created_at?: string
          duration_ms: number
          id?: string
          is_slow?: boolean | null
          metadata?: Json | null
          operation_name: string
          operation_type: string
        }
        Update: {
          created_at?: string
          duration_ms?: number
          id?: string
          is_slow?: boolean | null
          metadata?: Json | null
          operation_name?: string
          operation_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_created_event_sent: boolean | null
          ai_used_on_real_quiz: boolean
          analytics_viewed_at: string | null
          company_slug: string | null
          created_at: string
          crm_interactions_count: number
          crm_viewed_at: string | null
          deleted_at: string | null
          editor_sessions_count: number
          email: string | null
          facebook_pixel_id: string | null
          first_lead_received_at: string | null
          form_collection_configured_at: string | null
          full_name: string | null
          gtm_container_id: string | null
          id: string
          landing_variant_seen: string | null
          login_count: number | null
          paywall_hit_count: number
          plan_limit_hit_type: string | null
          quiz_shared_count: number
          stage_updated_at: string | null
          updated_at: string
          upgrade_clicked_count: number
          user_objectives: string[] | null
          user_stage: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          whatsapp: string | null
        }
        Insert: {
          account_created_event_sent?: boolean | null
          ai_used_on_real_quiz?: boolean
          analytics_viewed_at?: string | null
          company_slug?: string | null
          created_at?: string
          crm_interactions_count?: number
          crm_viewed_at?: string | null
          deleted_at?: string | null
          editor_sessions_count?: number
          email?: string | null
          facebook_pixel_id?: string | null
          first_lead_received_at?: string | null
          form_collection_configured_at?: string | null
          full_name?: string | null
          gtm_container_id?: string | null
          id: string
          landing_variant_seen?: string | null
          login_count?: number | null
          paywall_hit_count?: number
          plan_limit_hit_type?: string | null
          quiz_shared_count?: number
          stage_updated_at?: string | null
          updated_at?: string
          upgrade_clicked_count?: number
          user_objectives?: string[] | null
          user_stage?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          whatsapp?: string | null
        }
        Update: {
          account_created_event_sent?: boolean | null
          ai_used_on_real_quiz?: boolean
          analytics_viewed_at?: string | null
          company_slug?: string | null
          created_at?: string
          crm_interactions_count?: number
          crm_viewed_at?: string | null
          deleted_at?: string | null
          editor_sessions_count?: number
          email?: string | null
          facebook_pixel_id?: string | null
          first_lead_received_at?: string | null
          form_collection_configured_at?: string | null
          full_name?: string | null
          gtm_container_id?: string | null
          id?: string
          landing_variant_seen?: string | null
          login_count?: number | null
          paywall_hit_count?: number
          plan_limit_hit_type?: string | null
          quiz_shared_count?: number
          stage_updated_at?: string | null
          updated_at?: string
          upgrade_clicked_count?: number
          user_objectives?: string[] | null
          user_stage?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      quiz_analytics: {
        Row: {
          avg_completion_time: number | null
          completions: number
          conversion_rate: number | null
          date: string
          id: string
          quiz_id: string
          starts: number
          views: number
        }
        Insert: {
          avg_completion_time?: number | null
          completions?: number
          conversion_rate?: number | null
          date: string
          id?: string
          quiz_id: string
          starts?: number
          views?: number
        }
        Update: {
          avg_completion_time?: number | null
          completions?: number
          conversion_rate?: number | null
          date?: string
          id?: string
          quiz_id?: string
          starts?: number
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_analytics_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_cta_click_analytics: {
        Row: {
          block_id: string | null
          clicked_at: string
          cta_text: string | null
          cta_url: string
          date: string
          id: string
          question_id: string | null
          quiz_id: string
          session_id: string
          step_number: number | null
        }
        Insert: {
          block_id?: string | null
          clicked_at?: string
          cta_text?: string | null
          cta_url: string
          date?: string
          id?: string
          question_id?: string | null
          quiz_id: string
          session_id: string
          step_number?: number | null
        }
        Update: {
          block_id?: string | null
          clicked_at?: string
          cta_text?: string | null
          cta_url?: string
          date?: string
          id?: string
          question_id?: string | null
          quiz_id?: string
          session_id?: string
          step_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_cta_click_analytics_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_cta_click_analytics_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_form_config: {
        Row: {
          collect_email: boolean
          collect_name: boolean
          collect_whatsapp: boolean
          collection_timing: Database["public"]["Enums"]["collection_timing"]
          created_at: string
          custom_fields: Json | null
          id: string
          quiz_id: string
          updated_at: string
        }
        Insert: {
          collect_email?: boolean
          collect_name?: boolean
          collect_whatsapp?: boolean
          collection_timing?: Database["public"]["Enums"]["collection_timing"]
          created_at?: string
          custom_fields?: Json | null
          id?: string
          quiz_id: string
          updated_at?: string
        }
        Update: {
          collect_email?: boolean
          collect_name?: boolean
          collect_whatsapp?: boolean
          collection_timing?: Database["public"]["Enums"]["collection_timing"]
          created_at?: string
          custom_fields?: Json | null
          id?: string
          quiz_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_form_config_quiz_id"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_question_translations: {
        Row: {
          created_at: string | null
          id: string
          language_code: string
          options: Json | null
          question_id: string
          question_text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          language_code: string
          options?: Json | null
          question_id: string
          question_text: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          language_code?: string
          options?: Json | null
          question_id?: string
          question_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_question_translations_question_id"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          answer_format: Database["public"]["Enums"]["answer_format"]
          blocks: Json | null
          conditions: Json | null
          created_at: string
          custom_label: string | null
          id: string
          media_type: Database["public"]["Enums"]["media_type"] | null
          media_url: string | null
          options: Json | null
          order_number: number
          question_text: string
          quiz_id: string
          updated_at: string
        }
        Insert: {
          answer_format?: Database["public"]["Enums"]["answer_format"]
          blocks?: Json | null
          conditions?: Json | null
          created_at?: string
          custom_label?: string | null
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          options?: Json | null
          order_number: number
          question_text: string
          quiz_id: string
          updated_at?: string
        }
        Update: {
          answer_format?: Database["public"]["Enums"]["answer_format"]
          blocks?: Json | null
          conditions?: Json | null
          created_at?: string
          custom_label?: string | null
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          options?: Json | null
          order_number?: number
          question_text?: string
          quiz_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_questions_quiz_id"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_responses: {
        Row: {
          answers: Json | null
          completed_at: string
          custom_field_data: Json | null
          id: string
          ip_address: string | null
          lead_status: string | null
          quiz_id: string
          respondent_email: string | null
          respondent_name: string | null
          respondent_whatsapp: string | null
          result_id: string | null
          session_id: string | null
          user_agent: string | null
          variant_id: string | null
        }
        Insert: {
          answers?: Json | null
          completed_at?: string
          custom_field_data?: Json | null
          id?: string
          ip_address?: string | null
          lead_status?: string | null
          quiz_id: string
          respondent_email?: string | null
          respondent_name?: string | null
          respondent_whatsapp?: string | null
          result_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          variant_id?: string | null
        }
        Update: {
          answers?: Json | null
          completed_at?: string
          custom_field_data?: Json | null
          id?: string
          ip_address?: string | null
          lead_status?: string | null
          quiz_id?: string
          respondent_email?: string | null
          respondent_name?: string | null
          respondent_whatsapp?: string | null
          result_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "quiz_results"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          button_text: string | null
          calculator_ranges: Json | null
          condition_config: Json | null
          condition_type: Database["public"]["Enums"]["result_condition"]
          created_at: string
          decimal_places: number | null
          display_format: string | null
          formula: string | null
          id: string
          image_url: string | null
          max_score: number | null
          min_score: number | null
          order_number: number
          quiz_id: string
          redirect_url: string | null
          result_text: string
          result_type: string | null
          result_unit: string | null
          updated_at: string
          variable_mapping: Json | null
          video_url: string | null
        }
        Insert: {
          button_text?: string | null
          calculator_ranges?: Json | null
          condition_config?: Json | null
          condition_type?: Database["public"]["Enums"]["result_condition"]
          created_at?: string
          decimal_places?: number | null
          display_format?: string | null
          formula?: string | null
          id?: string
          image_url?: string | null
          max_score?: number | null
          min_score?: number | null
          order_number: number
          quiz_id: string
          redirect_url?: string | null
          result_text: string
          result_type?: string | null
          result_unit?: string | null
          updated_at?: string
          variable_mapping?: Json | null
          video_url?: string | null
        }
        Update: {
          button_text?: string | null
          calculator_ranges?: Json | null
          condition_config?: Json | null
          condition_type?: Database["public"]["Enums"]["result_condition"]
          created_at?: string
          decimal_places?: number | null
          display_format?: string | null
          formula?: string | null
          id?: string
          image_url?: string | null
          max_score?: number | null
          min_score?: number | null
          order_number?: number
          quiz_id?: string
          redirect_url?: string | null
          result_text?: string
          result_type?: string | null
          result_unit?: string | null
          updated_at?: string
          variable_mapping?: Json | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_results_quiz_id"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_step_analytics: {
        Row: {
          date: string
          id: string
          question_id: string | null
          quiz_id: string
          reached_at: string
          session_id: string
          step_number: number
        }
        Insert: {
          date?: string
          id?: string
          question_id?: string | null
          quiz_id: string
          reached_at?: string
          session_id: string
          step_number: number
        }
        Update: {
          date?: string
          id?: string
          question_id?: string | null
          quiz_id?: string
          reached_at?: string
          session_id?: string
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_step_analytics_quiz_id"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_tag_relations: {
        Row: {
          created_at: string
          id: string
          quiz_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quiz_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quiz_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_tag_relations_quiz_id"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_quiz_tag_relations_tag_id"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "quiz_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          full_config: Json | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          name: string
          preview_config: Json | null
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          full_config?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name: string
          preview_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          full_config?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name?: string
          preview_config?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_translations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          language_code: string
          quiz_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          language_code: string
          quiz_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          language_code?: string
          quiz_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_translations_quiz_id"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_variants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_control: boolean
          parent_quiz_id: string
          traffic_weight: number
          updated_at: string
          variant_letter: string
          variant_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_control?: boolean
          parent_quiz_id: string
          traffic_weight?: number
          updated_at?: string
          variant_letter?: string
          variant_name?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_control?: boolean
          parent_quiz_id?: string
          traffic_weight?: number
          updated_at?: string
          variant_letter?: string
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_variants_parent_quiz_id"
            columns: ["parent_quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          ab_test_active: boolean | null
          created_at: string
          creation_source: string | null
          description: string | null
          facebook_pixel_id: string | null
          global_font_family: string | null
          global_font_size: string | null
          global_text_align: string | null
          hide_branding: boolean | null
          id: string
          is_public: boolean
          logo_url: string | null
          progress_style: string | null
          question_count: number
          show_description: boolean | null
          show_logo: boolean | null
          show_question_number: boolean | null
          show_results: boolean | null
          show_title: boolean | null
          slug: string | null
          status: Database["public"]["Enums"]["quiz_status"]
          template: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ab_test_active?: boolean | null
          created_at?: string
          creation_source?: string | null
          description?: string | null
          facebook_pixel_id?: string | null
          global_font_family?: string | null
          global_font_size?: string | null
          global_text_align?: string | null
          hide_branding?: boolean | null
          id?: string
          is_public?: boolean
          logo_url?: string | null
          progress_style?: string | null
          question_count?: number
          show_description?: boolean | null
          show_logo?: boolean | null
          show_question_number?: boolean | null
          show_results?: boolean | null
          show_title?: boolean | null
          slug?: string | null
          status?: Database["public"]["Enums"]["quiz_status"]
          template?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ab_test_active?: boolean | null
          created_at?: string
          creation_source?: string | null
          description?: string | null
          facebook_pixel_id?: string | null
          global_font_family?: string | null
          global_font_size?: string | null
          global_text_align?: string | null
          hide_branding?: boolean | null
          id?: string
          is_public?: boolean
          logo_url?: string | null
          progress_style?: string | null
          question_count?: number
          show_description?: boolean | null
          show_logo?: boolean | null
          show_question_number?: boolean | null
          show_results?: boolean | null
          show_title?: boolean | null
          slug?: string | null
          status?: Database["public"]["Enums"]["quiz_status"]
          template?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_tracker: {
        Row: {
          action: string
          attempt_count: number
          created_at: string
          id: string
          identifier: string
          updated_at: string
          window_start: string
        }
        Insert: {
          action: string
          attempt_count?: number
          created_at?: string
          id?: string
          identifier: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          action?: string
          attempt_count?: number
          created_at?: string
          id?: string
          identifier?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      recovery_blacklist: {
        Row: {
          added_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          phone_number: string
          reason: string | null
          user_id: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          phone_number: string
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          phone_number?: string
          reason?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      recovery_campaigns: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          delivered_count: number | null
          description: string | null
          failed_count: number | null
          id: string
          is_automatic: boolean | null
          name: string
          queued_count: number | null
          reactivated_count: number | null
          read_count: number | null
          responded_count: number | null
          scheduled_at: string | null
          sent_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["recovery_campaign_status"] | null
          target_criteria: Json | null
          template_id: string | null
          total_targets: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          description?: string | null
          failed_count?: number | null
          id?: string
          is_automatic?: boolean | null
          name: string
          queued_count?: number | null
          reactivated_count?: number | null
          read_count?: number | null
          responded_count?: number | null
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?:
            | Database["public"]["Enums"]["recovery_campaign_status"]
            | null
          target_criteria?: Json | null
          template_id?: string | null
          total_targets?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          description?: string | null
          failed_count?: number | null
          id?: string
          is_automatic?: boolean | null
          name?: string
          queued_count?: number | null
          reactivated_count?: number | null
          read_count?: number | null
          responded_count?: number | null
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?:
            | Database["public"]["Enums"]["recovery_campaign_status"]
            | null
          target_criteria?: Json | null
          template_id?: string | null
          total_targets?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recovery_contacts: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          custom_link: string | null
          days_inactive_at_contact: number | null
          delivered_at: string | null
          error_message: string | null
          evolution_message_id: string | null
          id: string
          message_sent: string | null
          phone_number: string
          priority: number | null
          reactivated: boolean | null
          reactivated_at: string | null
          read_at: string | null
          response_at: string | null
          response_text: string | null
          retry_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["recovery_contact_status"] | null
          template_id: string | null
          updated_at: string | null
          user_id: string
          user_lead_count: number | null
          user_plan_at_contact: string | null
          user_quiz_count: number | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          custom_link?: string | null
          days_inactive_at_contact?: number | null
          delivered_at?: string | null
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          message_sent?: string | null
          phone_number: string
          priority?: number | null
          reactivated?: boolean | null
          reactivated_at?: string | null
          read_at?: string | null
          response_at?: string | null
          response_text?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["recovery_contact_status"] | null
          template_id?: string | null
          updated_at?: string | null
          user_id: string
          user_lead_count?: number | null
          user_plan_at_contact?: string | null
          user_quiz_count?: number | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          custom_link?: string | null
          days_inactive_at_contact?: number | null
          delivered_at?: string | null
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          message_sent?: string | null
          phone_number?: string
          priority?: number | null
          reactivated?: boolean | null
          reactivated_at?: string | null
          read_at?: string | null
          response_at?: string | null
          response_text?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["recovery_contact_status"] | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string
          user_lead_count?: number | null
          user_plan_at_contact?: string | null
          user_quiz_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recovery_contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "recovery_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recovery_contacts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "recovery_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recovery_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recovery_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      recovery_settings: {
        Row: {
          allowed_hours_end: string | null
          allowed_hours_start: string | null
          auto_campaign_enabled: boolean | null
          batch_pause_minutes: number | null
          batch_size: number | null
          connection_status: string | null
          created_at: string | null
          daily_message_limit: number | null
          delay_max_seconds: number | null
          evolution_api_url: string | null
          exclude_plan_types: Json | null
          forward_to_phone: string | null
          hourly_message_limit: number | null
          id: string
          inactivity_days_trigger: number | null
          instance_name: string | null
          is_active: boolean | null
          is_connected: boolean | null
          last_connection_check: string | null
          max_retry_attempts: number | null
          message_delay_seconds: number | null
          qr_code_base64: string | null
          randomize_delay: boolean | null
          retry_failed_after_hours: number | null
          updated_at: string | null
          user_cooldown_days: number | null
        }
        Insert: {
          allowed_hours_end?: string | null
          allowed_hours_start?: string | null
          auto_campaign_enabled?: boolean | null
          batch_pause_minutes?: number | null
          batch_size?: number | null
          connection_status?: string | null
          created_at?: string | null
          daily_message_limit?: number | null
          delay_max_seconds?: number | null
          evolution_api_url?: string | null
          exclude_plan_types?: Json | null
          forward_to_phone?: string | null
          hourly_message_limit?: number | null
          id?: string
          inactivity_days_trigger?: number | null
          instance_name?: string | null
          is_active?: boolean | null
          is_connected?: boolean | null
          last_connection_check?: string | null
          max_retry_attempts?: number | null
          message_delay_seconds?: number | null
          qr_code_base64?: string | null
          randomize_delay?: boolean | null
          retry_failed_after_hours?: number | null
          updated_at?: string | null
          user_cooldown_days?: number | null
        }
        Update: {
          allowed_hours_end?: string | null
          allowed_hours_start?: string | null
          auto_campaign_enabled?: boolean | null
          batch_pause_minutes?: number | null
          batch_size?: number | null
          connection_status?: string | null
          created_at?: string | null
          daily_message_limit?: number | null
          delay_max_seconds?: number | null
          evolution_api_url?: string | null
          exclude_plan_types?: Json | null
          forward_to_phone?: string | null
          hourly_message_limit?: number | null
          id?: string
          inactivity_days_trigger?: number | null
          instance_name?: string | null
          is_active?: boolean | null
          is_connected?: boolean | null
          last_connection_check?: string | null
          max_retry_attempts?: number | null
          message_delay_seconds?: number | null
          qr_code_base64?: string | null
          randomize_delay?: boolean | null
          retry_failed_after_hours?: number | null
          updated_at?: string | null
          user_cooldown_days?: number | null
        }
        Relationships: []
      }
      recovery_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          message_content: string
          name: string
          priority: number | null
          response_count: number | null
          response_rate: number | null
          trigger_days: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          message_content: string
          name: string
          priority?: number | null
          response_count?: number | null
          response_rate?: number | null
          trigger_days?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          message_content?: string
          name?: string
          priority?: number | null
          response_count?: number | null
          response_rate?: number | null
          trigger_days?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      scheduled_deletions: {
        Row: {
          cancellation_token: string
          cancelled_at: string | null
          created_at: string
          id: string
          reason: string | null
          scheduled_for: string
          user_id: string
        }
        Insert: {
          cancellation_token?: string
          cancelled_at?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          scheduled_for: string
          user_id: string
        }
        Update: {
          cancellation_token?: string
          cancelled_at?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          scheduled_for?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          editor_layout: string
          id: string
          site_mode: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          editor_layout?: string
          id?: string
          site_mode?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          editor_layout?: string
          id?: string
          site_mode?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          ai_generations_per_month: number | null
          allow_ab_testing: boolean | null
          allow_advanced_analytics: boolean | null
          allow_ai_generation: boolean | null
          allow_custom_domain: boolean | null
          allow_export_pdf: boolean | null
          allow_facebook_pixel: boolean | null
          allow_gtm: boolean | null
          allow_heatmap: boolean | null
          allow_quiz_branching: boolean | null
          allow_quiz_sharing: boolean | null
          allow_video_upload: boolean | null
          allow_webhook: boolean | null
          allow_white_label: boolean | null
          allowed_templates: Json | null
          created_at: string
          display_order: number | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          kiwify_checkout_url: string | null
          kiwify_checkout_url_mode_b: string | null
          lead_limit: number | null
          plan_name: string
          plan_type: Database["public"]["Enums"]["plan_type"]
          price_monthly: number | null
          price_monthly_mode_b: number | null
          questions_per_quiz_limit: number
          quiz_limit: number
          response_limit: number
          updated_at: string
          video_storage_limit_mb: number | null
        }
        Insert: {
          ai_generations_per_month?: number | null
          allow_ab_testing?: boolean | null
          allow_advanced_analytics?: boolean | null
          allow_ai_generation?: boolean | null
          allow_custom_domain?: boolean | null
          allow_export_pdf?: boolean | null
          allow_facebook_pixel?: boolean | null
          allow_gtm?: boolean | null
          allow_heatmap?: boolean | null
          allow_quiz_branching?: boolean | null
          allow_quiz_sharing?: boolean | null
          allow_video_upload?: boolean | null
          allow_webhook?: boolean | null
          allow_white_label?: boolean | null
          allowed_templates?: Json | null
          created_at?: string
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          kiwify_checkout_url?: string | null
          kiwify_checkout_url_mode_b?: string | null
          lead_limit?: number | null
          plan_name: string
          plan_type: Database["public"]["Enums"]["plan_type"]
          price_monthly?: number | null
          price_monthly_mode_b?: number | null
          questions_per_quiz_limit?: number
          quiz_limit: number
          response_limit: number
          updated_at?: string
          video_storage_limit_mb?: number | null
        }
        Update: {
          ai_generations_per_month?: number | null
          allow_ab_testing?: boolean | null
          allow_advanced_analytics?: boolean | null
          allow_ai_generation?: boolean | null
          allow_custom_domain?: boolean | null
          allow_export_pdf?: boolean | null
          allow_facebook_pixel?: boolean | null
          allow_gtm?: boolean | null
          allow_heatmap?: boolean | null
          allow_quiz_branching?: boolean | null
          allow_quiz_sharing?: boolean | null
          allow_video_upload?: boolean | null
          allow_webhook?: boolean | null
          allow_white_label?: boolean | null
          allowed_templates?: Json | null
          created_at?: string
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          kiwify_checkout_url?: string | null
          kiwify_checkout_url_mode_b?: string | null
          lead_limit?: number | null
          plan_name?: string
          plan_type?: Database["public"]["Enums"]["plan_type"]
          price_monthly?: number | null
          price_monthly_mode_b?: number | null
          questions_per_quiz_limit?: number
          quiz_limit?: number
          response_limit?: number
          updated_at?: string
          video_storage_limit_mb?: number | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          closed_at: string | null
          created_at: string
          has_unread_admin: boolean
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          closed_at?: string | null
          created_at?: string
          has_unread_admin?: boolean
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          closed_at?: string | null
          created_at?: string
          has_unread_admin?: boolean
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_health_metrics: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          module: string
          score: number
          status: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          module: string
          score: number
          status: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          module?: string
          score?: number
          status?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_internal_note: boolean | null
          message: string
          sender_id: string
          ticket_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_internal_note?: boolean | null
          message: string
          sender_id: string
          ticket_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_internal_note?: boolean | null
          message?: string
          sender_id?: string
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ticket_messages_ticket_id"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_logs: {
        Row: {
          cancelled_at: string | null
          converted_at: string | null
          created_at: string
          id: string
          notes: string | null
          original_plan_type: string
          reverted_at: string | null
          started_by: string | null
          status: string
          trial_days: number
          trial_end_date: string
          trial_plan_type: string
          updated_at: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          original_plan_type: string
          reverted_at?: string | null
          started_by?: string | null
          status?: string
          trial_days: number
          trial_end_date: string
          trial_plan_type: string
          updated_at?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          original_plan_type?: string
          reverted_at?: string | null
          started_by?: string | null
          status?: string
          trial_days?: number
          trial_end_date?: string
          trial_plan_type?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          api_key: string | null
          api_secret: string | null
          created_at: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          provider: string
          settings: Json | null
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          provider: string
          settings?: Json | null
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          provider?: string
          settings?: Json | null
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          analytics_tour_completed: boolean | null
          completed_at: string | null
          created_at: string | null
          crm_tour_completed: boolean | null
          dashboard_tour_completed: boolean | null
          first_lead_captured: boolean | null
          first_quiz_created: boolean | null
          id: string
          integrations_tour_completed: boolean | null
          quiz_editor_tour_completed: boolean | null
          settings_tour_completed: boolean | null
          updated_at: string | null
          user_id: string
          welcome_completed: boolean | null
        }
        Insert: {
          analytics_tour_completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          crm_tour_completed?: boolean | null
          dashboard_tour_completed?: boolean | null
          first_lead_captured?: boolean | null
          first_quiz_created?: boolean | null
          id?: string
          integrations_tour_completed?: boolean | null
          quiz_editor_tour_completed?: boolean | null
          settings_tour_completed?: boolean | null
          updated_at?: string | null
          user_id: string
          welcome_completed?: boolean | null
        }
        Update: {
          analytics_tour_completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          crm_tour_completed?: boolean | null
          dashboard_tour_completed?: boolean | null
          first_lead_captured?: boolean | null
          first_quiz_created?: boolean | null
          id?: string
          integrations_tour_completed?: boolean | null
          quiz_editor_tour_completed?: boolean | null
          settings_tour_completed?: boolean | null
          updated_at?: string | null
          user_id?: string
          welcome_completed?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          id: string
          original_plan_type: string | null
          payment_confirmed: boolean | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          quiz_limit: number
          response_limit: number
          status: Database["public"]["Enums"]["subscription_status"]
          trial_end_date: string | null
          trial_started_at: string | null
          trial_started_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_plan_type?: string | null
          payment_confirmed?: boolean | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          quiz_limit?: number
          response_limit?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end_date?: string | null
          trial_started_at?: string | null
          trial_started_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          original_plan_type?: string | null
          payment_confirmed?: boolean | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          quiz_limit?: number
          response_limit?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end_date?: string | null
          trial_started_at?: string | null
          trial_started_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_webhooks: {
        Row: {
          created_at: string | null
          events: Json | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
          webhook_secret: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          events?: Json | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
          webhook_secret?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          events?: Json | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
          webhook_secret?: string | null
          webhook_url?: string
        }
        Relationships: []
      }
      validation_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          quiz_id: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["validation_status"]
          updated_at: string
          user_id: string
          validation_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          quiz_id: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["validation_status"]
          updated_at?: string
          user_id: string
          validation_url: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          quiz_id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["validation_status"]
          updated_at?: string
          user_id?: string
          validation_url?: string
        }
        Relationships: []
      }
      video_analytics: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          percentage_watched: number | null
          quiz_id: string | null
          session_id: string
          user_id: string | null
          video_id: string | null
          video_url: string | null
          watch_time_seconds: number | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          percentage_watched?: number | null
          quiz_id?: string | null
          session_id: string
          user_id?: string | null
          video_id?: string | null
          video_url?: string | null
          watch_time_seconds?: number | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          percentage_watched?: number | null
          quiz_id?: string | null
          session_id?: string
          user_id?: string | null
          video_id?: string | null
          video_url?: string | null
          watch_time_seconds?: number | null
        }
        Relationships: []
      }
      video_usage: {
        Row: {
          bunny_size_mb: number | null
          bunny_video_count: number | null
          created_at: string | null
          id: string
          total_size_mb: number | null
          updated_at: string | null
          user_id: string | null
          video_count: number | null
        }
        Insert: {
          bunny_size_mb?: number | null
          bunny_video_count?: number | null
          created_at?: string | null
          id?: string
          total_size_mb?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_count?: number | null
        }
        Update: {
          bunny_size_mb?: number | null
          bunny_video_count?: number | null
          created_at?: string | null
          id?: string
          total_size_mb?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_count?: number | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          email: string | null
          error_message: string | null
          evento: string | null
          id: string
          paid_plan_type: string | null
          produto: string | null
          provider: string | null
          quiz_id: string | null
          response_body: string | null
          response_id: string | null
          status: string | null
          status_code: number | null
          token: string | null
          webhook_id: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          email?: string | null
          error_message?: string | null
          evento?: string | null
          id?: string
          paid_plan_type?: string | null
          produto?: string | null
          provider?: string | null
          quiz_id?: string | null
          response_body?: string | null
          response_id?: string | null
          status?: string | null
          status_code?: number | null
          token?: string | null
          webhook_id?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          email?: string | null
          error_message?: string | null
          evento?: string | null
          id?: string
          paid_plan_type?: string | null
          produto?: string | null
          provider?: string | null
          quiz_id?: string | null
          response_body?: string | null
          response_id?: string | null
          status?: string | null
          status_code?: number | null
          token?: string | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_webhook_logs_webhook_id"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "user_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_ai_knowledge: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_ai_settings: {
        Row: {
          admin_alert_phone: string | null
          created_at: string
          fallback_message: string | null
          human_pause_minutes: number
          id: string
          is_enabled: boolean
          max_agent_retries: number
          max_history_messages: number
          rate_limit_per_hour: number
          system_prompt: string | null
          updated_at: string
        }
        Insert: {
          admin_alert_phone?: string | null
          created_at?: string
          fallback_message?: string | null
          human_pause_minutes?: number
          id?: string
          is_enabled?: boolean
          max_agent_retries?: number
          max_history_messages?: number
          rate_limit_per_hour?: number
          system_prompt?: string | null
          updated_at?: string
        }
        Update: {
          admin_alert_phone?: string | null
          created_at?: string
          fallback_message?: string | null
          human_pause_minutes?: number
          id?: string
          is_enabled?: boolean
          max_agent_retries?: number
          max_history_messages?: number
          rate_limit_per_hour?: number
          system_prompt?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          content: string
          created_at: string
          id: string
          phone_number: string
          role: string
          template_context_id: string | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          phone_number: string
          role: string
          template_context_id?: string | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          phone_number?: string
          role?: string
          template_context_id?: string | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_template_context_id_fkey"
            columns: ["template_context_id"]
            isOneToOne: false
            referencedRelation: "recovery_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_activity_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      user_activity_summary: {
        Row: {
          active_quiz_count: number | null
          ai_used_on_real_quiz: boolean | null
          created_at: string | null
          crm_interactions_count: number | null
          days_since_signup: number | null
          editor_sessions_count: number | null
          email: string | null
          first_lead_received_at: string | null
          form_collection_configured_at: string | null
          full_name: string | null
          icp_score: number | null
          landing_variant_seen: string | null
          lead_count: number | null
          login_count: number | null
          payment_confirmed: boolean | null
          paywall_hit_count: number | null
          plan_limit_hit_type: string | null
          plan_type: Database["public"]["Enums"]["plan_type"] | null
          quiz_count: number | null
          quiz_shared_count: number | null
          upgrade_clicked_count: number | null
          user_id: string | null
          user_stage: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      anonymize_old_ips: { Args: never; Returns: number }
      check_slug_available: { Args: { _slug: string }; Returns: Json }
      cleanup_expired_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_audit_logs: { Args: never; Returns: undefined }
      cleanup_old_gtm_events: { Args: never; Returns: undefined }
      cleanup_old_health_metrics: { Args: never; Returns: number }
      delete_user_by_id: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      enqueue_zombie_campaign: {
        Args: { p_campaign_id: string; p_template_id: string }
        Returns: number
      }
      generate_company_slug: {
        Args: { p_email: string; p_user_id: string }
        Returns: string
      }
      generate_express_slug: { Args: never; Returns: string }
      generate_slug: { Args: { title: string }; Returns: string }
      get_all_cron_jobs: {
        Args: never
        Returns: {
          active: boolean
          description: string
          display_name: string
          jobid: number
          jobname: string
          last_run_at: string
          last_run_duration_ms: number
          last_run_status: string
          schedule: string
          total_failures_24h: number
          total_runs_24h: number
        }[]
      }
      get_quiz_for_display: {
        Args: { p_company_slug?: string; p_quiz_slug?: string }
        Returns: Json
      }
      get_table_sizes: {
        Args: never
        Returns: {
          row_estimate: number
          table_name: string
          total_bytes: number
          total_size: string
        }[]
      }
      get_user_quiz_stats: {
        Args: { user_ids: string[] }
        Returns: {
          lead_count: number
          quiz_count: number
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_blog_views: { Args: { p_slug: string }; Returns: undefined }
      increment_login_count: { Args: { p_user_id: string }; Returns: undefined }
      increment_profile_counter: {
        Args: { _column: string }
        Returns: undefined
      }
      is_reserved_slug: { Args: { _slug: string }; Returns: boolean }
      mark_first_lead_received: {
        Args: { _owner_id: string }
        Returns: undefined
      }
      preview_zombie_recipients: {
        Args: never
        Returns: {
          email: string
          nome: string
          user_id: string
          whatsapp: string
        }[]
      }
      record_login_event: { Args: { p_user_id: string }; Returns: undefined }
      set_profile_first_value: {
        Args: { _column: string; _value: string }
        Returns: undefined
      }
    }
    Enums: {
      answer_format:
        | "yes_no"
        | "single_choice"
        | "multiple_choice"
        | "short_text"
      app_role: "master_admin" | "admin" | "user"
      collection_timing: "none" | "before" | "after" | "both"
      field_type:
        | "text"
        | "email"
        | "phone"
        | "select"
        | "textarea"
        | "checkbox"
      media_type: "image" | "video"
      plan_type:
        | "free"
        | "partner"
        | "premium"
        | "paid"
        | "professional"
        | "admin"
      quiz_status: "draft" | "active" | "archived"
      recovery_campaign_status:
        | "draft"
        | "scheduled"
        | "running"
        | "paused"
        | "completed"
        | "cancelled"
      recovery_contact_status:
        | "pending"
        | "queued"
        | "sent"
        | "delivered"
        | "read"
        | "responded"
        | "failed"
        | "cancelled"
      result_condition: "always" | "score_range" | "specific_answers"
      subscription_status: "active" | "inactive" | "pending_validation"
      ticket_category:
        | "suggestion"
        | "bug"
        | "question"
        | "feature_request"
        | "other"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
      validation_status: "pending" | "approved" | "rejected"
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
      answer_format: [
        "yes_no",
        "single_choice",
        "multiple_choice",
        "short_text",
      ],
      app_role: ["master_admin", "admin", "user"],
      collection_timing: ["none", "before", "after", "both"],
      field_type: ["text", "email", "phone", "select", "textarea", "checkbox"],
      media_type: ["image", "video"],
      plan_type: [
        "free",
        "partner",
        "premium",
        "paid",
        "professional",
        "admin",
      ],
      quiz_status: ["draft", "active", "archived"],
      recovery_campaign_status: [
        "draft",
        "scheduled",
        "running",
        "paused",
        "completed",
        "cancelled",
      ],
      recovery_contact_status: [
        "pending",
        "queued",
        "sent",
        "delivered",
        "read",
        "responded",
        "failed",
        "cancelled",
      ],
      result_condition: ["always", "score_range", "specific_answers"],
      subscription_status: ["active", "inactive", "pending_validation"],
      ticket_category: [
        "suggestion",
        "bug",
        "question",
        "feature_request",
        "other",
      ],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      validation_status: ["pending", "approved", "rejected"],
    },
  },
} as const
