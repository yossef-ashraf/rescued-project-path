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
      courses: {
        Row: {
          category_path: string | null
          completed_units: number | null
          created_at: string | null
          days_spent: number | null
          description: string | null
          expected_end_date: string | null
          expected_start_date: string | null
          id: number
          include_in_stats: number | null
          overdue_days: number | null
          parent_id: number | null
          presenter_description: string | null
          presenter_name: string | null
          progress_percentage: number | null
          resource_type: string | null
          sort_order: number | null
          start_date: string | null
          status: string | null
          title: string | null
          total_units: number | null
          type: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          category_path?: string | null
          completed_units?: number | null
          created_at?: string | null
          days_spent?: number | null
          description?: string | null
          expected_end_date?: string | null
          expected_start_date?: string | null
          id?: number
          include_in_stats?: number | null
          overdue_days?: number | null
          parent_id?: number | null
          presenter_description?: string | null
          presenter_name?: string | null
          progress_percentage?: number | null
          resource_type?: string | null
          sort_order?: number | null
          start_date?: string | null
          status?: string | null
          title?: string | null
          total_units?: number | null
          type?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          category_path?: string | null
          completed_units?: number | null
          created_at?: string | null
          days_spent?: number | null
          description?: string | null
          expected_end_date?: string | null
          expected_start_date?: string | null
          id?: number
          include_in_stats?: number | null
          overdue_days?: number | null
          parent_id?: number | null
          presenter_description?: string | null
          presenter_name?: string | null
          progress_percentage?: number | null
          resource_type?: string | null
          sort_order?: number | null
          start_date?: string | null
          status?: string | null
          title?: string | null
          total_units?: number | null
          type?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      finance_credits: {
        Row: {
          amount: number | null
          created_at: string | null
          id: number
          month: number | null
          month_id: number | null
          name: string | null
          note: string | null
          type: number | null
          updated_at: string | null
          week: number | null
          year: number | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: number
          month?: number | null
          month_id?: number | null
          name?: string | null
          note?: string | null
          type?: number | null
          updated_at?: string | null
          week?: number | null
          year?: number | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: number
          month?: number | null
          month_id?: number | null
          name?: string | null
          note?: string | null
          type?: number | null
          updated_at?: string | null
          week?: number | null
          year?: number | null
        }
        Relationships: []
      }
      finance_debts: {
        Row: {
          amount: number | null
          created_at: string | null
          id: number
          month: number | null
          month_id: number | null
          name: string | null
          note: string | null
          type: number | null
          updated_at: string | null
          week: number | null
          year: number | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: number
          month?: number | null
          month_id?: number | null
          name?: string | null
          note?: string | null
          type?: number | null
          updated_at?: string | null
          week?: number | null
          year?: number | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: number
          month?: number | null
          month_id?: number | null
          name?: string | null
          note?: string | null
          type?: number | null
          updated_at?: string | null
          week?: number | null
          year?: number | null
        }
        Relationships: []
      }
      finance_fiscal_months: {
        Row: {
          created_at: string | null
          id: number
          month: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          month?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          month?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      finance_investments_and_savings: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          gregorian_date: string | null
          hijri_date: string | null
          id: number
          image: string | null
          is_after_nisab: number | null
          month: number | null
          month_id: number | null
          name: string | null
          nisab_completion_date: string | null
          note: string | null
          price: number | null
          rate: number | null
          updated_at: string | null
          val: number | null
          week: number | null
          year: number | null
          zakat_due_date_gregorian: string | null
          zakat_due_date_hijri: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          gregorian_date?: string | null
          hijri_date?: string | null
          id?: number
          image?: string | null
          is_after_nisab?: number | null
          month?: number | null
          month_id?: number | null
          name?: string | null
          nisab_completion_date?: string | null
          note?: string | null
          price?: number | null
          rate?: number | null
          updated_at?: string | null
          val?: number | null
          week?: number | null
          year?: number | null
          zakat_due_date_gregorian?: string | null
          zakat_due_date_hijri?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          gregorian_date?: string | null
          hijri_date?: string | null
          id?: number
          image?: string | null
          is_after_nisab?: number | null
          month?: number | null
          month_id?: number | null
          name?: string | null
          nisab_completion_date?: string | null
          note?: string | null
          price?: number | null
          rate?: number | null
          updated_at?: string | null
          val?: number | null
          week?: number | null
          year?: number | null
          zakat_due_date_gregorian?: string | null
          zakat_due_date_hijri?: string | null
        }
        Relationships: []
      }
      finance_market_prices: {
        Row: {
          created_at: string | null
          dollar: number | null
          id: number
          name: string | null
          price: number | null
          riyal: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dollar?: number | null
          id?: number
          name?: string | null
          price?: number | null
          riyal?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dollar?: number | null
          id?: number
          name?: string | null
          price?: number | null
          riyal?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: number
          month_id: number | null
          note: string | null
          title: string | null
          transaction_date: string | null
          type: string | null
          week_number: number | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: number
          month_id?: number | null
          note?: string | null
          title?: string | null
          transaction_date?: string | null
          type?: string | null
          week_number?: number | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: number
          month_id?: number | null
          note?: string | null
          title?: string | null
          transaction_date?: string | null
          type?: string | null
          week_number?: number | null
        }
        Relationships: []
      }
      job_locks: {
        Row: {
          created_at: string
          expires_at: string
          lock_key: string
          locked_by: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          lock_key: string
          locked_by: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          lock_key?: string
          locked_by?: string
        }
        Relationships: []
      }
      job_runs: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: number
          job_name: string
          payload: Json | null
          result: Json | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: number
          job_name: string
          payload?: Json | null
          result?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: number
          job_name?: string
          payload?: Json | null
          result?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_attachments: {
        Row: {
          comment_id: number | null
          created_at: string | null
          file_name: string | null
          file_path: string | null
          id: number
          lead_id: number | null
        }
        Insert: {
          comment_id?: number | null
          created_at?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: number
          lead_id?: number | null
        }
        Update: {
          comment_id?: number | null
          created_at?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: number
          lead_id?: number | null
        }
        Relationships: []
      }
      lead_comments: {
        Row: {
          comment: string | null
          created_at: string | null
          id: number
          lead_id: number | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: number
          lead_id?: number | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: number
          lead_id?: number | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          budget: string | null
          company: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: number
          name: string | null
          notes: string | null
          phone: string | null
          project_type: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          name?: string | null
          notes?: string | null
          phone?: string | null
          project_type?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          name?: string | null
          notes?: string | null
          phone?: string | null
          project_type?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      learning_lesson_attachments: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: number
          lesson_id: number
          sort_order: number | null
          storage_key: string | null
          storage_provider: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: number
          lesson_id: number
          sort_order?: number | null
          storage_key?: string | null
          storage_provider?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: number
          lesson_id?: number
          sort_order?: number | null
          storage_key?: string | null
          storage_provider?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      learning_lesson_comments: {
        Row: {
          comment: string | null
          course_id: number | null
          created_at: string | null
          id: number
          lesson_id: number | null
        }
        Insert: {
          comment?: string | null
          course_id?: number | null
          created_at?: string | null
          id?: number
          lesson_id?: number | null
        }
        Update: {
          comment?: string | null
          course_id?: number | null
          created_at?: string | null
          id?: number
          lesson_id?: number | null
        }
        Relationships: []
      }
      learning_lesson_resources: {
        Row: {
          created_at: string
          description: string | null
          id: number
          lesson_id: number
          metadata: Json | null
          resource_type: string
          sort_order: number | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          lesson_id: number
          metadata?: Json | null
          resource_type?: string
          sort_order?: number | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          lesson_id?: number
          metadata?: Json | null
          resource_type?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      learning_lessons: {
        Row: {
          content: string | null
          course_id: number
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: number
          last_opened_at: string | null
          lecture_date: string | null
          lesson_number: number | null
          private_notes: string | null
          progress_percentage: number | null
          slug: string | null
          sort_order: number | null
          source_url: string | null
          status: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          course_id: number
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: number
          last_opened_at?: string | null
          lecture_date?: string | null
          lesson_number?: number | null
          private_notes?: string | null
          progress_percentage?: number | null
          slug?: string | null
          sort_order?: number | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          course_id?: number
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: number
          last_opened_at?: string | null
          lecture_date?: string | null
          lesson_number?: number | null
          private_notes?: string | null
          progress_percentage?: number | null
          slug?: string | null
          sort_order?: number | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      local_projects: {
        Row: {
          comments: string | null
          company: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          files: string | null
          id: number
          name: string | null
          start_date: string | null
          status: string | null
          tech_stack: string | null
          updated_at: string | null
        }
        Insert: {
          comments?: string | null
          company?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          files?: string | null
          id?: number
          name?: string | null
          start_date?: string | null
          status?: string | null
          tech_stack?: string | null
          updated_at?: string | null
        }
        Update: {
          comments?: string | null
          company?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          files?: string | null
          id?: number
          name?: string | null
          start_date?: string | null
          status?: string | null
          tech_stack?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      material_categories: {
        Row: {
          color: string | null
          id: number
          name: string | null
        }
        Insert: {
          color?: string | null
          id?: number
          name?: string | null
        }
        Update: {
          color?: string | null
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      material_knowledge_library: {
        Row: {
          category_name: string | null
          course_id: number | null
          created_at: string | null
          description: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: number
          item_type: string | null
          notes: string | null
          reading_status: string | null
          tags: string | null
        }
        Insert: {
          category_name?: string | null
          course_id?: number | null
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: number
          item_type?: string | null
          notes?: string | null
          reading_status?: string | null
          tags?: string | null
        }
        Update: {
          category_name?: string | null
          course_id?: number | null
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: number
          item_type?: string | null
          notes?: string | null
          reading_status?: string | null
          tags?: string | null
        }
        Relationships: []
      }
      op_task_attachments: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_path: string | null
          file_size: string | null
          file_type: string | null
          id: number
          task_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: string | null
          file_type?: string | null
          id?: number
          task_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: string | null
          file_type?: string | null
          id?: number
          task_id?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      op_task_comments: {
        Row: {
          comment: string | null
          created_at: string | null
          id: number
          task_id: number | null
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: number
          task_id?: number | null
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: number
          task_id?: number | null
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: []
      }
      op_tasks: {
        Row: {
          company: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          duration_hours: number | null
          end_date: string | null
          id: number
          is_daily: number | null
          is_recurring: number | null
          parent_task_id: number | null
          priority: string | null
          reminder_time: string | null
          repeat_days: string | null
          start_date: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          duration_hours?: number | null
          end_date?: string | null
          id?: number
          is_daily?: number | null
          is_recurring?: number | null
          parent_task_id?: number | null
          priority?: string | null
          reminder_time?: string | null
          repeat_days?: string | null
          start_date?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          duration_hours?: number | null
          end_date?: string | null
          id?: number
          is_daily?: number | null
          is_recurring?: number | null
          parent_task_id?: number | null
          priority?: string | null
          reminder_time?: string | null
          repeat_days?: string | null
          start_date?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      op_todo_items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          done: number | null
          due_date: string | null
          duration_hours: number | null
          end_date: string | null
          id: number
          reminder_time: string | null
          repeat_days: string | null
          series_id: string | null
          start_date: string | null
          text: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          done?: number | null
          due_date?: string | null
          duration_hours?: number | null
          end_date?: string | null
          id?: number
          reminder_time?: string | null
          repeat_days?: string | null
          series_id?: string | null
          start_date?: string | null
          text?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          done?: number | null
          due_date?: string | null
          duration_hours?: number | null
          end_date?: string | null
          id?: number
          reminder_time?: string | null
          repeat_days?: string | null
          series_id?: string | null
          start_date?: string | null
          text?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pending_user_roles: {
        Row: {
          profile_id: number
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          profile_id: number
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          profile_id?: number
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "pending_user_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_about: {
        Row: {
          core_expertise: string | null
          id: number
          summary: string | null
          updated_at: string | null
          what_i_do: string | null
        }
        Insert: {
          core_expertise?: string | null
          id?: number
          summary?: string | null
          updated_at?: string | null
          what_i_do?: string | null
        }
        Update: {
          core_expertise?: string | null
          id?: number
          summary?: string | null
          updated_at?: string | null
          what_i_do?: string | null
        }
        Relationships: []
      }
      profile_certificates: {
        Row: {
          id: number
          institution: string | null
          issue_date: string | null
          name: string | null
        }
        Insert: {
          id?: number
          institution?: string | null
          issue_date?: string | null
          name?: string | null
        }
        Update: {
          id?: number
          institution?: string | null
          issue_date?: string | null
          name?: string | null
        }
        Relationships: []
      }
      profile_education: {
        Row: {
          degree: string | null
          description: string | null
          grade: string | null
          id: number
          institution: string | null
          year_range: string | null
        }
        Insert: {
          degree?: string | null
          description?: string | null
          grade?: string | null
          id?: number
          institution?: string | null
          year_range?: string | null
        }
        Update: {
          degree?: string | null
          description?: string | null
          grade?: string | null
          id?: number
          institution?: string | null
          year_range?: string | null
        }
        Relationships: []
      }
      profile_experience: {
        Row: {
          company: string | null
          description: string | null
          duration: string | null
          id: number
          link_url: string | null
          logo_url: string | null
          role: string | null
        }
        Insert: {
          company?: string | null
          description?: string | null
          duration?: string | null
          id?: number
          link_url?: string | null
          logo_url?: string | null
          role?: string | null
        }
        Update: {
          company?: string | null
          description?: string | null
          duration?: string | null
          id?: number
          link_url?: string | null
          logo_url?: string | null
          role?: string | null
        }
        Relationships: []
      }
      profile_pages_sections: {
        Row: {
          content: string | null
          id: number
          is_active: boolean | null
          meta: Json | null
          page: string
          section_key: string
          sort_order: number | null
          subtitle: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          id?: number
          is_active?: boolean | null
          meta?: Json | null
          page?: string
          section_key: string
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          id?: number
          is_active?: boolean | null
          meta?: Json | null
          page?: string
          section_key?: string
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profile_personal_info: {
        Row: {
          created_at: string | null
          cv_url: string | null
          email: string | null
          github_url: string | null
          id: number
          linkedin_url: string | null
          location: string | null
          logo_path: string | null
          military_status: string | null
          name: string | null
          phone: string | null
          photo_path: string | null
          portfolio_url: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cv_url?: string | null
          email?: string | null
          github_url?: string | null
          id?: number
          linkedin_url?: string | null
          location?: string | null
          logo_path?: string | null
          military_status?: string | null
          name?: string | null
          phone?: string | null
          photo_path?: string | null
          portfolio_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cv_url?: string | null
          email?: string | null
          github_url?: string | null
          id?: number
          linkedin_url?: string | null
          location?: string | null
          logo_path?: string | null
          military_status?: string | null
          name?: string | null
          phone?: string | null
          photo_path?: string | null
          portfolio_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profile_projects: {
        Row: {
          category: string | null
          company: string | null
          country: string | null
          description: string | null
          geo_lat: number | null
          geo_long: number | null
          id: number
          link_url: string | null
          logo_url: string | null
          name: string | null
          role: string | null
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          company?: string | null
          country?: string | null
          description?: string | null
          geo_lat?: number | null
          geo_long?: number | null
          id?: number
          link_url?: string | null
          logo_url?: string | null
          name?: string | null
          role?: string | null
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          company?: string | null
          country?: string | null
          description?: string | null
          geo_lat?: number | null
          geo_long?: number | null
          id?: number
          link_url?: string | null
          logo_url?: string | null
          name?: string | null
          role?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      profile_skills: {
        Row: {
          badge: string | null
          category: string | null
          id: number
          is_highlight: number | null
          rating: number | null
          skill_name: string | null
        }
        Insert: {
          badge?: string | null
          category?: string | null
          id?: number
          is_highlight?: number | null
          rating?: number | null
          skill_name?: string | null
        }
        Update: {
          badge?: string | null
          category?: string | null
          id?: number
          is_highlight?: number | null
          rating?: number | null
          skill_name?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string | null
          email: string
          id: number
          last_login_at: string | null
          last_login_ip: string | null
          name: string
          phone: string | null
          status: string | null
          telegram_chat_id: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: number
          last_login_at?: string | null
          last_login_ip?: string | null
          name: string
          phone?: string | null
          status?: string | null
          telegram_chat_id?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: number
          last_login_at?: string | null
          last_login_ip?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          telegram_chat_id?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      setting_auth_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: number
          ip_address: string | null
          status: string
          user_agent: string | null
          user_id: number | null
          username: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: number
          ip_address?: string | null
          status: string
          user_agent?: string | null
          user_id?: number | null
          username?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: number
          ip_address?: string | null
          status?: string
          user_agent?: string | null
          user_id?: number | null
          username?: string | null
        }
        Relationships: []
      }
      setting_auth_otps: {
        Row: {
          code: string
          created_at: string | null
          destination: string
          expires_at: string
          id: number
          verified: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          destination: string
          expires_at: string
          id?: number
          verified?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          destination?: string
          expires_at?: string
          id?: number
          verified?: number | null
        }
        Relationships: []
      }
      setting_notifications: {
        Row: {
          created_at: string | null
          dedup_key: string | null
          id: number
          is_read: number | null
          link: string | null
          message: string | null
          title: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          dedup_key?: string | null
          id?: number
          is_read?: number | null
          link?: string | null
          message?: string | null
          title?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          dedup_key?: string | null
          id?: number
          is_read?: number | null
          link?: string | null
          message?: string | null
          title?: string | null
          type?: string | null
        }
        Relationships: []
      }
      setting_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: number
          key: string | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          key?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          key?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      setting_shared_link_views: {
        Row: {
          id: number
          ip_hash: string | null
          link_id: number
          user_agent: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: number
          ip_hash?: string | null
          link_id: number
          user_agent?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: number
          ip_hash?: string | null
          link_id?: number
          user_agent?: string | null
          viewed_at?: string | null
        }
        Relationships: []
      }
      setting_shared_links: {
        Row: {
          created_at: string
          created_by: number | null
          entity_id: number
          entity_type: string
          expires_at: string
          id: number
          is_revoked: boolean | null
          metadata: Json | null
          permissions: string | null
          token: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          created_at?: string
          created_by?: number | null
          entity_id: number
          entity_type: string
          expires_at: string
          id?: number
          is_revoked?: boolean | null
          metadata?: Json | null
          permissions?: string | null
          token: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          created_at?: string
          created_by?: number | null
          entity_id?: number
          entity_type?: string
          expires_at?: string
          id?: number
          is_revoked?: boolean | null
          metadata?: Json | null
          permissions?: string | null
          token?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      setting_vault_passwords: {
        Row: {
          created_at: string | null
          id: number
          password_encrypted: string
          password_iv: string
          password_tag: string
          site_name: string
          site_url: string | null
          updated_at: string | null
          user_data_encrypted: string
          user_data_iv: string
          user_data_tag: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          password_encrypted: string
          password_iv: string
          password_tag: string
          site_name: string
          site_url?: string | null
          updated_at?: string | null
          user_data_encrypted: string
          user_data_iv: string
          user_data_tag: string
        }
        Update: {
          created_at?: string | null
          id?: number
          password_encrypted?: string
          password_iv?: string
          password_tag?: string
          site_name?: string
          site_url?: string | null
          updated_at?: string | null
          user_data_encrypted?: string
          user_data_iv?: string
          user_data_tag?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_workspace_member: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
