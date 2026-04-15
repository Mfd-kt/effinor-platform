/**
 * Types Supabase — compléter avec `supabase gen types` quand le schéma est figé.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Valeurs alignées sur la migration SQL `lead_source` */
export type LeadSource =
  | "website"
  | "cold_call"
  | "commercial_callback"
  | "landing_froid"
  | "landing_lum"
  | "landing_destrat"
  | "lead_generation"
  | "hpf"
  | "kompas"
  | "site_internet"
  | "prospecting_kompas"
  | "phone"
  | "partner"
  | "referral"
  | "other";

/** Valeurs alignées sur la migration SQL `lead_status` */
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "dossier_sent"
  | "accord_received"
  | "nurturing"
  | "lost"
  | "converted";

export type QualificationStatus =
  | "pending"
  | "in_progress"
  | "qualified"
  | "disqualified";

/** Aligné sur `public.product_family` (migration SQL). */
export type ProductFamily =
  | "lighting_led"
  | "destratification"
  | "balancing"
  | "heat_recovery"
  | "heat_pump"
  | "other";

/** Aligné sur `public.sales_status`. */
export type SalesStatus =
  | "draft"
  | "to_contact"
  | "qualified"
  | "proposal"
  | "quote_sent"
  | "quote_signed"
  | "won"
  | "lost"
  | "stalled";

/** Aligné sur `public.admin_status`. */
export type AdminStatus =
  | "pending"
  | "in_review"
  | "complete"
  | "blocked"
  | "archived";

/** Aligné sur `public.technical_status`. */
export type TechnicalStatus =
  | "pending"
  | "study_in_progress"
  | "validated"
  | "blocked";

/** Aligné sur `public.technical_visit_status` (visites techniques). */
export type TechnicalVisitStatus =
  | "to_schedule"
  | "scheduled"
  | "performed"
  | "report_pending"
  | "validated"
  | "refused"
  | "cancelled";

/** Aligné sur `public.document_type`. */
export type DocumentType =
  | "quote"
  | "invoice"
  | "delegate_invoice"
  | "technical_study"
  | "dimensioning_note"
  | "cee_declaration"
  | "photo"
  | "contract"
  | "proof"
  | "correspondence"
  | "other";

/** Aligné sur `public.document_status`. */
export type DocumentStatus =
  | "draft"
  | "pending_review"
  | "valid"
  | "rejected"
  | "superseded";

/** Aligné sur `public.study_type`. */
export type StudyType =
  | "dimensioning_note"
  | "lighting_study"
  | "technical_assessment"
  | "cold_recovery_study"
  | "other";

/** Aligné sur `public.technical_study_status`. */
export type TechnicalStudyStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "rejected"
  | "archived";

/** Aligné sur `public.beneficiary_status`. */
export type BeneficiaryStatus = "prospect" | "active" | "inactive" | "blocked";

/** Aligné sur `public.site_kind` (sites d’opération). */
export type SiteKind =
  | "warehouse"
  | "office"
  | "greenhouse"
  | "industrial"
  | "retail"
  | "mixed"
  | "other";

/** Aligné sur `public.operation_status` (workflow + valeurs legacy). */
export type OperationStatus =
  | "draft"
  | "technical_qualification"
  | "quote_preparation"
  | "quote_sent"
  | "quote_signed"
  | "installation_planned"
  | "installation_in_progress"
  | "installation_completed"
  | "delivered_without_install"
  | "cee_compliance_review"
  | "dossier_complete"
  | "anomaly_to_resubmit"
  | "polluter_filed"
  | "cofrac_control"
  | "invoicing_call"
  | "payment_pending"
  | "prime_paid"
  | "cancelled_off_target"
  | "not_eligible"
  | "cancelled_by_client"
  | "delivery_requested"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled"
  | "archived";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          job_title: string | null;
          avatar_url: string | null;
          is_active: boolean;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          job_title?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          job_title?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          code: string;
          label_fr: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          label_fr: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          label_fr?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      permissions: {
        Row: {
          id: string;
          code: string;
          label_fr: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          label_fr: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          label_fr?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          role_id: string;
          permission_id: string;
          created_at: string;
        };
        Insert: {
          role_id: string;
          permission_id: string;
          created_at?: string;
        };
        Update: {
          role_id?: string;
          permission_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
        ];
      };
      role_digest_logs: {
        Row: {
          id: string;
          digest_id: string | null;
          event_type: string;
          payload_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          digest_id?: string | null;
          event_type: string;
          payload_json?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          digest_id?: string | null;
          event_type?: string;
          payload_json?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_digest_logs_digest_id_fkey";
            columns: ["digest_id"];
            isOneToOne: false;
            referencedRelation: "role_digests";
            referencedColumns: ["id"];
          },
        ];
      };
      role_digests: {
        Row: {
          id: string;
          role_target: string;
          target_user_id: string;
          digest_type: string;
          priority: string;
          content_json: Json;
          dedupe_key: string;
          status: string;
          generated_at: string;
          delivered_at: string | null;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          role_target: string;
          target_user_id: string;
          digest_type?: string;
          priority?: string;
          content_json?: Json;
          dedupe_key: string;
          status?: string;
          generated_at?: string;
          delivered_at?: string | null;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          role_target?: string;
          target_user_id?: string;
          digest_type?: string;
          priority?: string;
          content_json?: Json;
          dedupe_key?: string;
          status?: string;
          generated_at?: string;
          delivered_at?: string | null;
          read_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "role_digests_target_user_id_fkey";
            columns: ["target_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          id: string;
          source: LeadSource;
          campaign: string | null;
          landing: string | null;
          product_interest: string | null;
          company_name: string;
          siret: string | null;
          head_office_siret: string | null;
          worksite_siret: string | null;
          first_name: string | null;
          last_name: string | null;
          civility: string | null;
          contact_name: string | null;
          job_title: string | null;
          department: string | null;
          contact_role: string | null;
          phone: string | null;
          email: string | null;
          head_office_address: string;
          head_office_postal_code: string;
          head_office_city: string;
          worksite_address: string;
          worksite_postal_code: string;
          worksite_city: string;
          building_type: string | null;
          surface_m2: number | null;
          ceiling_height_m: number | null;
          heated_building: boolean | null;
          heating_type: string[] | null;
          warehouse_count: number | null;
          lead_status: LeadStatus;
          qualification_status: QualificationStatus;
          assigned_to: string | null;
          cee_sheet_id: string | null;
          current_workflow_id: string | null;
          lead_channel: string | null;
          lead_origin: string | null;
          owner_user_id: string | null;
          callback_at: string | null;
          created_by_agent_id: string | null;
          confirmed_by_user_id: string | null;
          aerial_photos: Json;
          cadastral_parcel_files: Json;
          recording_files: Json;
          study_media_files: Json;
          recording_notes: string | null;
          ai_lead_summary: string | null;
          ai_lead_score: number | null;
          sim_height_m: number | null;
          sim_surface_m2: number | null;
          sim_client_type: string | null;
          sim_model: string | null;
          sim_heating_mode: string | null;
          sim_consigne: string | null;
          sim_volume_m3: number | null;
          sim_air_change_rate: number | null;
          sim_model_capacity_m3h: number | null;
          sim_needed_destrat: number | null;
          sim_power_kw: number | null;
          sim_consumption_kwh_year: number | null;
          sim_cost_year_min: number | null;
          sim_cost_year_max: number | null;
          sim_cost_year_selected: number | null;
          sim_saving_kwh_30: number | null;
          sim_saving_eur_30_min: number | null;
          sim_saving_eur_30_max: number | null;
          sim_saving_eur_30_selected: number | null;
          sim_co2_saved_tons: number | null;
          sim_cee_prime_estimated: number | null;
          sim_install_unit_price: number | null;
          sim_install_total_price: number | null;
          sim_rest_to_charge: number | null;
          sim_lead_score: number | null;
          sim_payload_json: Json | null;
          sim_version: string | null;
          simulated_at: string | null;
          simulated_by_user_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          source: LeadSource;
          campaign?: string | null;
          landing?: string | null;
          product_interest?: string | null;
          company_name: string;
          siret?: string | null;
          head_office_siret?: string | null;
          worksite_siret?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          civility?: string | null;
          contact_name?: string | null;
          job_title?: string | null;
          department?: string | null;
          contact_role?: string | null;
          phone?: string | null;
          email?: string | null;
          head_office_address?: string;
          head_office_postal_code?: string;
          head_office_city?: string;
          worksite_address?: string;
          worksite_postal_code?: string;
          worksite_city?: string;
          building_type?: string | null;
          surface_m2?: number | null;
          ceiling_height_m?: number | null;
          heated_building?: boolean | null;
          heating_type?: string[] | null;
          warehouse_count?: number | null;
          lead_status?: LeadStatus;
          qualification_status?: QualificationStatus;
          assigned_to?: string | null;
          cee_sheet_id?: string | null;
          current_workflow_id?: string | null;
          lead_channel?: string | null;
          lead_origin?: string | null;
          owner_user_id?: string | null;
          callback_at?: string | null;
          created_by_agent_id?: string | null;
          confirmed_by_user_id?: string | null;
          aerial_photos?: Json;
          cadastral_parcel_files?: Json;
          recording_files?: Json;
          study_media_files?: Json;
          recording_notes?: string | null;
          ai_lead_summary?: string | null;
          ai_lead_score?: number | null;
          sim_height_m?: number | null;
          sim_surface_m2?: number | null;
          sim_client_type?: string | null;
          sim_model?: string | null;
          sim_heating_mode?: string | null;
          sim_consigne?: string | null;
          sim_volume_m3?: number | null;
          sim_air_change_rate?: number | null;
          sim_model_capacity_m3h?: number | null;
          sim_needed_destrat?: number | null;
          sim_power_kw?: number | null;
          sim_consumption_kwh_year?: number | null;
          sim_cost_year_min?: number | null;
          sim_cost_year_max?: number | null;
          sim_cost_year_selected?: number | null;
          sim_saving_kwh_30?: number | null;
          sim_saving_eur_30_min?: number | null;
          sim_saving_eur_30_max?: number | null;
          sim_saving_eur_30_selected?: number | null;
          sim_co2_saved_tons?: number | null;
          sim_cee_prime_estimated?: number | null;
          sim_install_unit_price?: number | null;
          sim_install_total_price?: number | null;
          sim_rest_to_charge?: number | null;
          sim_lead_score?: number | null;
          sim_payload_json?: Json | null;
          sim_version?: string | null;
          simulated_at?: string | null;
          simulated_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          source?: LeadSource;
          campaign?: string | null;
          landing?: string | null;
          product_interest?: string | null;
          company_name?: string;
          siret?: string | null;
          head_office_siret?: string | null;
          worksite_siret?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          civility?: string | null;
          contact_name?: string | null;
          job_title?: string | null;
          department?: string | null;
          contact_role?: string | null;
          phone?: string | null;
          email?: string | null;
          head_office_address?: string;
          head_office_postal_code?: string;
          head_office_city?: string;
          worksite_address?: string;
          worksite_postal_code?: string;
          worksite_city?: string;
          building_type?: string | null;
          surface_m2?: number | null;
          ceiling_height_m?: number | null;
          heated_building?: boolean | null;
          heating_type?: string[] | null;
          warehouse_count?: number | null;
          lead_status?: LeadStatus;
          qualification_status?: QualificationStatus;
          assigned_to?: string | null;
          cee_sheet_id?: string | null;
          current_workflow_id?: string | null;
          lead_channel?: string | null;
          lead_origin?: string | null;
          owner_user_id?: string | null;
          callback_at?: string | null;
          created_by_agent_id?: string | null;
          confirmed_by_user_id?: string | null;
          aerial_photos?: Json;
          cadastral_parcel_files?: Json;
          recording_files?: Json;
          study_media_files?: Json;
          recording_notes?: string | null;
          ai_lead_summary?: string | null;
          ai_lead_score?: number | null;
          sim_height_m?: number | null;
          sim_surface_m2?: number | null;
          sim_client_type?: string | null;
          sim_model?: string | null;
          sim_heating_mode?: string | null;
          sim_consigne?: string | null;
          sim_volume_m3?: number | null;
          sim_air_change_rate?: number | null;
          sim_model_capacity_m3h?: number | null;
          sim_needed_destrat?: number | null;
          sim_power_kw?: number | null;
          sim_consumption_kwh_year?: number | null;
          sim_cost_year_min?: number | null;
          sim_cost_year_max?: number | null;
          sim_cost_year_selected?: number | null;
          sim_saving_kwh_30?: number | null;
          sim_saving_eur_30_min?: number | null;
          sim_saving_eur_30_max?: number | null;
          sim_saving_eur_30_selected?: number | null;
          sim_co2_saved_tons?: number | null;
          sim_cee_prime_estimated?: number | null;
          sim_install_unit_price?: number | null;
          sim_install_total_price?: number | null;
          sim_rest_to_charge?: number | null;
          sim_lead_score?: number | null;
          sim_payload_json?: Json | null;
          sim_version?: string | null;
          simulated_at?: string | null;
          simulated_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      lead_internal_notes: {
        Row: {
          id: string;
          lead_id: string;
          body: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          body: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          body?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      beneficiaries: {
        Row: {
          id: string;
          company_name: string;
          siren: string | null;
          siret_head_office: string | null;
          siret_worksite: string | null;
          civility: string | null;
          contact_first_name: string | null;
          contact_last_name: string | null;
          contact_role: string | null;
          phone: string | null;
          landline: string | null;
          email: string | null;
          head_office_address: string | null;
          head_office_postal_code: string | null;
          head_office_city: string | null;
          worksite_address: string | null;
          worksite_postal_code: string | null;
          worksite_city: string | null;
          climate_zone: string | null;
          region: string | null;
          acquisition_source: string | null;
          status: BeneficiaryStatus;
          notes: string | null;
          sales_owner_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          company_name: string;
          siren?: string | null;
          siret_head_office?: string | null;
          siret_worksite?: string | null;
          civility?: string | null;
          contact_first_name?: string | null;
          contact_last_name?: string | null;
          contact_role?: string | null;
          phone?: string | null;
          landline?: string | null;
          email?: string | null;
          head_office_address?: string | null;
          head_office_postal_code?: string | null;
          head_office_city?: string | null;
          worksite_address?: string | null;
          worksite_postal_code?: string | null;
          worksite_city?: string | null;
          climate_zone?: string | null;
          region?: string | null;
          acquisition_source?: string | null;
          status: BeneficiaryStatus;
          notes?: string | null;
          sales_owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          company_name?: string;
          siren?: string | null;
          siret_head_office?: string | null;
          siret_worksite?: string | null;
          civility?: string | null;
          contact_first_name?: string | null;
          contact_last_name?: string | null;
          contact_role?: string | null;
          phone?: string | null;
          landline?: string | null;
          email?: string | null;
          head_office_address?: string | null;
          head_office_postal_code?: string | null;
          head_office_city?: string | null;
          worksite_address?: string | null;
          worksite_postal_code?: string | null;
          worksite_city?: string | null;
          climate_zone?: string | null;
          region?: string | null;
          acquisition_source?: string | null;
          status?: BeneficiaryStatus;
          notes?: string | null;
          sales_owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      lead_documents: {
        Row: {
          id: string;
          lead_id: string;
          document_type: string;
          title: string;
          file_url: string;
          storage_bucket: string;
          storage_path: string;
          status: string;
          template_version: string;
          metadata: Json;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          document_type?: string;
          title: string;
          file_url: string;
          storage_bucket: string;
          storage_path: string;
          status?: string;
          template_version: string;
          metadata?: Json;
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          document_type?: string;
          title?: string;
          file_url?: string;
          storage_bucket?: string;
          storage_path?: string;
          status?: string;
          template_version?: string;
          metadata?: Json;
          created_at?: string;
          created_by?: string;
        };
        Relationships: [];
      };
      cee_sheets: {
        Row: {
          id: string;
          code: string;
          label: string;
          category: string | null;
          description: string | null;
          sort_order: number;
          calculation_profile: string;
          input_fields: Json;
          calculation_config: Json;
          official_pdf_path: string | null;
          official_pdf_file_name: string | null;
          control_points: string | null;
          simulator_key: string | null;
          presentation_template_key: string | null;
          agreement_template_key: string | null;
          requires_technical_visit: boolean;
          technical_visit_template_key: string | null;
          technical_visit_template_version: number | null;
          requires_quote: boolean;
          workflow_key: string | null;
          is_commercial_active: boolean;
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          label: string;
          category?: string | null;
          description?: string | null;
          sort_order?: number;
          calculation_profile?: string;
          input_fields?: Json;
          calculation_config?: Json;
          official_pdf_path?: string | null;
          official_pdf_file_name?: string | null;
          control_points?: string | null;
          simulator_key?: string | null;
          presentation_template_key?: string | null;
          agreement_template_key?: string | null;
          requires_technical_visit?: boolean;
          technical_visit_template_key?: string | null;
          technical_visit_template_version?: number | null;
          requires_quote?: boolean;
          workflow_key?: string | null;
          is_commercial_active?: boolean;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          label?: string;
          category?: string | null;
          description?: string | null;
          sort_order?: number;
          calculation_profile?: string;
          input_fields?: Json;
          calculation_config?: Json;
          official_pdf_path?: string | null;
          official_pdf_file_name?: string | null;
          control_points?: string | null;
          simulator_key?: string | null;
          presentation_template_key?: string | null;
          agreement_template_key?: string | null;
          requires_technical_visit?: boolean;
          technical_visit_template_key?: string | null;
          technical_visit_template_version?: number | null;
          requires_quote?: boolean;
          workflow_key?: string | null;
          is_commercial_active?: boolean;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      cee_sheet_teams: {
        Row: {
          id: string;
          cee_sheet_id: string;
          name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cee_sheet_id: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cee_sheet_id?: string;
          name?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cee_sheet_team_members: {
        Row: {
          id: string;
          cee_sheet_team_id: string;
          user_id: string;
          role_in_team: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cee_sheet_team_id: string;
          user_id: string;
          role_in_team: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cee_sheet_team_id?: string;
          user_id?: string;
          role_in_team?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      app_notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          severity: string;
          entity_type: string | null;
          entity_id: string | null;
          action_url: string | null;
          is_read: boolean;
          is_dismissed: boolean;
          metadata_json: Json | null;
          created_at: string;
          delivered_at: string | null;
          read_at: string | null;
          dedupe_key: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          severity?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          action_url?: string | null;
          is_read?: boolean;
          is_dismissed?: boolean;
          metadata_json?: Json | null;
          created_at?: string;
          delivered_at?: string | null;
          read_at?: string | null;
          dedupe_key?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          severity?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          action_url?: string | null;
          is_read?: boolean;
          is_dismissed?: boolean;
          metadata_json?: Json | null;
          created_at?: string;
          delivered_at?: string | null;
          read_at?: string | null;
          dedupe_key?: string | null;
        };
        Relationships: [];
      };
      ai_action_logs: {
        Row: {
          id: string;
          recommendation_id: string;
          action_type: string;
          payload_json: Json | null;
          actor_user_id: string;
          executed_by: string;
          status: string;
          result_json: Json | null;
          error_message: string | null;
          trigger_source: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recommendation_id: string;
          action_type: string;
          payload_json?: Json | null;
          actor_user_id: string;
          executed_by?: string;
          status: string;
          result_json?: Json | null;
          error_message?: string | null;
          trigger_source?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recommendation_id?: string;
          action_type?: string;
          payload_json?: Json | null;
          actor_user_id?: string;
          executed_by?: string;
          status?: string;
          result_json?: Json | null;
          error_message?: string | null;
          trigger_source?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          role_target: string;
          status: string;
          topic: string;
          priority: string;
          dedupe_key: string | null;
          entity_type: string | null;
          entity_id: string | null;
          metadata_json: Json;
          awaiting_user_reply: boolean;
          snoozed_until: string | null;
          issue_type: string | null;
          issue_entity_type: string | null;
          issue_entity_id: string | null;
          severity: string;
          resolved_at: string | null;
          last_ai_message_at: string | null;
          last_user_message_at: string | null;
          last_escalated_at: string | null;
          cooldown_until: string | null;
          reopen_count: number;
          auto_closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_target?: string;
          status?: string;
          topic: string;
          priority?: string;
          dedupe_key?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata_json?: Json;
          awaiting_user_reply?: boolean;
          snoozed_until?: string | null;
          issue_type?: string | null;
          issue_entity_type?: string | null;
          issue_entity_id?: string | null;
          severity?: string;
          resolved_at?: string | null;
          last_ai_message_at?: string | null;
          last_user_message_at?: string | null;
          last_escalated_at?: string | null;
          cooldown_until?: string | null;
          reopen_count?: number;
          auto_closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_target?: string;
          status?: string;
          topic?: string;
          priority?: string;
          dedupe_key?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata_json?: Json;
          awaiting_user_reply?: boolean;
          snoozed_until?: string | null;
          issue_type?: string | null;
          issue_entity_type?: string | null;
          issue_entity_id?: string | null;
          severity?: string;
          resolved_at?: string | null;
          last_ai_message_at?: string | null;
          last_user_message_at?: string | null;
          last_escalated_at?: string | null;
          cooldown_until?: string | null;
          reopen_count?: number;
          auto_closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_type: string;
          sender_user_id: string | null;
          message_type: string;
          body: string;
          metadata_json: Json;
          requires_action: boolean;
          action_type: string | null;
          action_payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_type: string;
          sender_user_id?: string | null;
          message_type: string;
          body: string;
          metadata_json?: Json;
          requires_action?: boolean;
          action_type?: string | null;
          action_payload?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_type?: string;
          sender_user_id?: string | null;
          message_type?: string;
          body?: string;
          metadata_json?: Json;
          requires_action?: boolean;
          action_type?: string | null;
          action_payload?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_ops_logs: {
        Row: {
          id: string;
          conversation_id: string | null;
          target_user_id: string | null;
          event_type: string;
          channel: string;
          payload_json: Json;
          status: string;
          error_message: string | null;
          dedupe_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id?: string | null;
          target_user_id?: string | null;
          event_type: string;
          channel: string;
          payload_json?: Json;
          status?: string;
          error_message?: string | null;
          dedupe_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string | null;
          target_user_id?: string | null;
          event_type?: string;
          channel?: string;
          payload_json?: Json;
          status?: string;
          error_message?: string | null;
          dedupe_key?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      commercial_callbacks: {
        Row: {
          id: string;
          company_name: string;
          contact_name: string;
          phone: string;
          email: string | null;
          callback_date: string;
          callback_time: string | null;
          callback_time_window: string | null;
          callback_comment: string;
          status: string;
          priority: string;
          source: string | null;
          assigned_agent_user_id: string | null;
          created_by_user_id: string | null;
          updated_by_user_id: string | null;
          converted_lead_id: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
          attempts_count: number;
          last_call_at: string | null;
          call_started_at: string | null;
          call_context_summary: string | null;
          prospect_temperature: string | null;
          estimated_value_cents: number | null;
          estimated_value_eur: number | null;
          sequence_step: number;
          sequence_type: string | null;
          sequence_next_at: string | null;
          callback_reason: string | null;
          callback_preferred_period: string | null;
          callback_outcome: string | null;
          due_at: string | null;
          next_reminder_at: string | null;
          snoozed_until: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          business_score: number | null;
          confidence_score: number | null;
          ai_script_text: string | null;
          ai_followup_draft: string | null;
          ai_last_generated_at: string | null;
          in_progress_by_user_id: string | null;
          last_notification_at: string | null;
          last_in_app_alert_at: string | null;
          auto_followup_enabled: boolean;
          auto_followup_last_sent_at: string | null;
          auto_followup_count: number;
          auto_followup_status: string | null;
          auto_followup_next_eligible_at: string | null;
          last_outbound_email_at: string | null;
          initial_contact_email_sent: boolean;
        };
        Insert: {
          id?: string;
          company_name: string;
          contact_name: string;
          phone: string;
          email?: string | null;
          callback_date: string;
          callback_time?: string | null;
          callback_time_window?: string | null;
          callback_comment: string;
          status?: string;
          priority?: string;
          source?: string | null;
          assigned_agent_user_id?: string | null;
          created_by_user_id?: string | null;
          updated_by_user_id?: string | null;
          converted_lead_id?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          attempts_count?: number;
          last_call_at?: string | null;
          call_started_at?: string | null;
          call_context_summary?: string | null;
          prospect_temperature?: string | null;
          estimated_value_cents?: number | null;
          estimated_value_eur?: number | null;
          sequence_step?: number;
          sequence_type?: string | null;
          sequence_next_at?: string | null;
          callback_reason?: string | null;
          callback_preferred_period?: string | null;
          callback_outcome?: string | null;
          due_at?: string | null;
          next_reminder_at?: string | null;
          snoozed_until?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          business_score?: number | null;
          confidence_score?: number | null;
          ai_script_text?: string | null;
          ai_followup_draft?: string | null;
          ai_last_generated_at?: string | null;
          in_progress_by_user_id?: string | null;
          last_notification_at?: string | null;
          last_in_app_alert_at?: string | null;
          auto_followup_enabled?: boolean;
          auto_followup_last_sent_at?: string | null;
          auto_followup_count?: number;
          auto_followup_status?: string | null;
          auto_followup_next_eligible_at?: string | null;
          last_outbound_email_at?: string | null;
          initial_contact_email_sent?: boolean;
        };
        Update: {
          id?: string;
          company_name?: string;
          contact_name?: string;
          phone?: string;
          email?: string | null;
          callback_date?: string;
          callback_time?: string | null;
          callback_time_window?: string | null;
          callback_comment?: string;
          status?: string;
          priority?: string;
          source?: string | null;
          assigned_agent_user_id?: string | null;
          created_by_user_id?: string | null;
          updated_by_user_id?: string | null;
          converted_lead_id?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          attempts_count?: number;
          last_call_at?: string | null;
          call_started_at?: string | null;
          call_context_summary?: string | null;
          prospect_temperature?: string | null;
          estimated_value_cents?: number | null;
          estimated_value_eur?: number | null;
          sequence_step?: number;
          sequence_type?: string | null;
          sequence_next_at?: string | null;
          callback_reason?: string | null;
          callback_preferred_period?: string | null;
          callback_outcome?: string | null;
          due_at?: string | null;
          next_reminder_at?: string | null;
          snoozed_until?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          business_score?: number | null;
          confidence_score?: number | null;
          ai_script_text?: string | null;
          ai_followup_draft?: string | null;
          ai_last_generated_at?: string | null;
          in_progress_by_user_id?: string | null;
          last_notification_at?: string | null;
          last_in_app_alert_at?: string | null;
          auto_followup_enabled?: boolean;
          auto_followup_last_sent_at?: string | null;
          auto_followup_count?: number;
          auto_followup_status?: string | null;
          auto_followup_next_eligible_at?: string | null;
          last_outbound_email_at?: string | null;
          initial_contact_email_sent?: boolean;
        };
        Relationships: [];
      };
      delegators: {
        Row: {
          id: string;
          name: string;
          company_name: string | null;
          email: string | null;
          phone: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          siret: string | null;
          address: string | null;
          contract_start_date: string | null;
          invoice_note: string | null;
          prime_per_kwhc_note: string | null;
          notes: string | null;
          official_pdf_path: string | null;
          official_pdf_file_name: string | null;
          control_points: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          company_name?: string | null;
          email?: string | null;
          phone?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          siret?: string | null;
          address?: string | null;
          contract_start_date?: string | null;
          invoice_note?: string | null;
          prime_per_kwhc_note?: string | null;
          notes?: string | null;
          official_pdf_path?: string | null;
          official_pdf_file_name?: string | null;
          control_points?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          company_name?: string | null;
          email?: string | null;
          phone?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          siret?: string | null;
          address?: string | null;
          contract_start_date?: string | null;
          invoice_note?: string | null;
          prime_per_kwhc_note?: string | null;
          notes?: string | null;
          official_pdf_path?: string | null;
          official_pdf_file_name?: string | null;
          control_points?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      impersonation_audit_events: {
        Row: {
          id: string;
          event: string;
          actor_user_id: string;
          impersonated_user_id: string;
          started_at: string | null;
          ended_at: string | null;
          duration_seconds: number | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event: string;
          actor_user_id: string;
          impersonated_user_id: string;
          started_at?: string | null;
          ended_at?: string | null;
          duration_seconds?: number | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event?: string;
          actor_user_id?: string;
          impersonated_user_id?: string;
          started_at?: string | null;
          ended_at?: string | null;
          duration_seconds?: number | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      internal_sla_instances: {
        Row: {
          id: string;
          rule_code: string;
          entity_type: string;
          entity_id: string;
          assigned_user_id: string | null;
          manager_user_id: string | null;
          target_due_at: string;
          warning_due_at: string;
          critical_due_at: string;
          status: string;
          resolved_at: string | null;
          last_checked_at: string;
          metadata_json: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rule_code: string;
          entity_type: string;
          entity_id: string;
          assigned_user_id?: string | null;
          manager_user_id?: string | null;
          target_due_at: string;
          warning_due_at: string;
          critical_due_at: string;
          status?: string;
          resolved_at?: string | null;
          last_checked_at?: string;
          metadata_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rule_code?: string;
          entity_type?: string;
          entity_id?: string;
          assigned_user_id?: string | null;
          manager_user_id?: string | null;
          target_due_at?: string;
          warning_due_at?: string;
          critical_due_at?: string;
          status?: string;
          resolved_at?: string | null;
          last_checked_at?: string;
          metadata_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      internal_sla_logs: {
        Row: {
          id: string;
          sla_instance_id: string | null;
          rule_code: string;
          entity_type: string;
          entity_id: string;
          severity: string;
          event_type: string;
          payload_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          sla_instance_id?: string | null;
          rule_code: string;
          entity_type: string;
          entity_id: string;
          severity: string;
          event_type: string;
          payload_json?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          sla_instance_id?: string | null;
          rule_code?: string;
          entity_type?: string;
          entity_id?: string;
          severity?: string;
          event_type?: string;
          payload_json?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      internal_sla_rules: {
        Row: {
          id: string;
          code: string;
          name: string;
          entity_type: string;
          role_target: string;
          condition_json: Json;
          target_delay_minutes: number;
          warning_delay_minutes: number;
          critical_delay_minutes: number;
          action_policy: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          entity_type: string;
          role_target?: string;
          condition_json?: Json;
          target_delay_minutes: number;
          warning_delay_minutes: number;
          critical_delay_minutes: number;
          action_policy: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          entity_type?: string;
          role_target?: string;
          condition_json?: Json;
          target_delay_minutes?: number;
          warning_delay_minutes?: number;
          critical_delay_minutes?: number;
          action_policy?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          operation_id: string | null;
          document_type: DocumentType;
          document_subtype: string | null;
          version: number;
          document_status: DocumentStatus;
          is_required: boolean;
          is_signed_by_client: boolean;
          is_signed_by_company: boolean;
          is_compliant: boolean | null;
          issued_at: string | null;
          signed_at: string | null;
          checked_at: string | null;
          checked_by_user_id: string | null;
          document_number: string | null;
          document_date: string | null;
          amount_ht: number | null;
          amount_ttc: number | null;
          mime_type: string | null;
          file_size_bytes: number | null;
          storage_bucket: string | null;
          storage_path: string | null;
          signed_storage_bucket: string | null;
          signed_storage_path: string | null;
          signature_provider_url: string | null;
          internal_comments: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          operation_id?: string | null;
          document_type: DocumentType;
          document_subtype?: string | null;
          version?: number;
          document_status?: DocumentStatus;
          is_required?: boolean;
          is_signed_by_client?: boolean;
          is_signed_by_company?: boolean;
          is_compliant?: boolean | null;
          issued_at?: string | null;
          signed_at?: string | null;
          checked_at?: string | null;
          checked_by_user_id?: string | null;
          document_number?: string | null;
          document_date?: string | null;
          amount_ht?: number | null;
          amount_ttc?: number | null;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          signed_storage_bucket?: string | null;
          signed_storage_path?: string | null;
          signature_provider_url?: string | null;
          internal_comments?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          operation_id?: string | null;
          document_type?: DocumentType;
          document_subtype?: string | null;
          version?: number;
          document_status?: DocumentStatus;
          is_required?: boolean;
          is_signed_by_client?: boolean;
          is_signed_by_company?: boolean;
          is_compliant?: boolean | null;
          issued_at?: string | null;
          signed_at?: string | null;
          checked_at?: string | null;
          checked_by_user_id?: string | null;
          document_number?: string | null;
          document_date?: string | null;
          amount_ht?: number | null;
          amount_ttc?: number | null;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          signed_storage_bucket?: string | null;
          signed_storage_path?: string | null;
          signature_provider_url?: string | null;
          internal_comments?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      technical_studies: {
        Row: {
          id: string;
          operation_id: string | null;
          study_type: StudyType;
          reference: string;
          status: TechnicalStudyStatus;
          study_date: string | null;
          engineering_office: string | null;
          summary: string | null;
          primary_document_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          operation_id?: string | null;
          study_type: StudyType;
          reference: string;
          status?: TechnicalStudyStatus;
          study_date?: string | null;
          engineering_office?: string | null;
          summary?: string | null;
          primary_document_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          operation_id?: string | null;
          study_type?: StudyType;
          reference?: string;
          status?: TechnicalStudyStatus;
          study_date?: string | null;
          engineering_office?: string | null;
          summary?: string | null;
          primary_document_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      heating_models: {
        Row: {
          id: string;
          brand: string;
          model: string;
          type: string;
          energy: string | null;
          power_kw: number | null;
          use_case: string | null;
          technical_sheet_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand: string;
          model: string;
          type: string;
          energy?: string | null;
          power_kw?: number | null;
          use_case?: string | null;
          technical_sheet_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand?: string;
          model?: string;
          type?: string;
          energy?: string | null;
          power_kw?: number | null;
          use_case?: string | null;
          technical_sheet_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      existing_heating_units: {
        Row: {
          id: string;
          operation_site_id: string | null;
          heating_model_id: string;
          quantity: number;
          unit_power_kw: number | null;
          total_power_kw: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          operation_site_id?: string | null;
          heating_model_id: string;
          quantity?: number;
          unit_power_kw?: number | null;
          total_power_kw?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          operation_site_id?: string | null;
          heating_model_id?: string;
          quantity?: number;
          unit_power_kw?: number | null;
          total_power_kw?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          brand: string;
          reference: string;
          product_code: string;
          name: string;
          short_label: string | null;
          category: string;
          description: string | null;
          description_short: string | null;
          description_long: string | null;
          image_url: string | null;
          fallback_image_url: string | null;
          noise_db: number | null;
          airflow_m3h: number | null;
          max_throw: number | null;
          unit_power_w: number | null;
          luminous_efficiency: number | null;
          cri: number | null;
          unit_price_ht: number | null;
          default_price_ht: number | null;
          valuation: number | null;
          product_family: ProductFamily | null;
          is_active: boolean;
          sort_order: number;
          usage_contexts: Json;
          unit_label: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          brand: string;
          reference: string;
          product_code: string;
          name: string;
          short_label?: string | null;
          category?: string;
          description?: string | null;
          description_short?: string | null;
          description_long?: string | null;
          image_url?: string | null;
          fallback_image_url?: string | null;
          noise_db?: number | null;
          airflow_m3h?: number | null;
          max_throw?: number | null;
          unit_power_w?: number | null;
          luminous_efficiency?: number | null;
          cri?: number | null;
          unit_price_ht?: number | null;
          default_price_ht?: number | null;
          valuation?: number | null;
          product_family?: ProductFamily | null;
          is_active?: boolean;
          sort_order?: number;
          usage_contexts?: Json;
          unit_label?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          brand?: string;
          reference?: string;
          product_code?: string;
          name?: string;
          short_label?: string | null;
          category?: string;
          description?: string | null;
          description_short?: string | null;
          description_long?: string | null;
          image_url?: string | null;
          fallback_image_url?: string | null;
          noise_db?: number | null;
          airflow_m3h?: number | null;
          max_throw?: number | null;
          unit_power_w?: number | null;
          luminous_efficiency?: number | null;
          cri?: number | null;
          unit_price_ht?: number | null;
          default_price_ht?: number | null;
          valuation?: number | null;
          product_family?: ProductFamily | null;
          is_active?: boolean;
          sort_order?: number;
          usage_contexts?: Json;
          unit_label?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      product_specs: {
        Row: {
          id: string;
          product_id: string;
          spec_key: string;
          spec_label: string;
          spec_value: string;
          spec_group: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          spec_key: string;
          spec_label: string;
          spec_value: string;
          spec_group?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          spec_key?: string;
          spec_label?: string;
          spec_value?: string;
          spec_group?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      product_key_metrics: {
        Row: {
          id: string;
          product_id: string;
          label: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          label: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          label?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt: string | null;
          sort_order: number;
          is_cover: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt?: string | null;
          sort_order?: number;
          is_cover?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          alt?: string | null;
          sort_order?: number;
          is_cover?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      project_carts: {
        Row: {
          id: string;
          cart_code: string | null;
          lead_id: string | null;
          workflow_id: string | null;
          simulation_id: string | null;
          created_by_user_id: string;
          owner_user_id: string;
          status: string;
          currency: string;
          total_items: number;
          total_quantity: number;
          subtotal_ht: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_code?: string | null;
          lead_id?: string | null;
          workflow_id?: string | null;
          simulation_id?: string | null;
          created_by_user_id: string;
          owner_user_id: string;
          status?: string;
          currency?: string;
          total_items?: number;
          total_quantity?: number;
          subtotal_ht?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_code?: string | null;
          lead_id?: string | null;
          workflow_id?: string | null;
          simulation_id?: string | null;
          created_by_user_id?: string;
          owner_user_id?: string;
          status?: string;
          currency?: string;
          total_items?: number;
          total_quantity?: number;
          subtotal_ht?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_id: string;
          quantity: number;
          unit_price_ht: number | null;
          line_total_ht: number | null;
          display_order: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          product_id: string;
          quantity?: number;
          unit_price_ht?: number | null;
          line_total_ht?: number | null;
          display_order?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price_ht?: number | null;
          line_total_ht?: number | null;
          display_order?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      installed_products: {
        Row: {
          id: string;
          operation_id: string | null;
          product_id: string;
          quantity: number;
          unit_price_ht: number | null;
          total_price_ht: number | null;
          unit_power_w: number | null;
          cee_sheet_code: string | null;
          cumac_amount: number | null;
          valuation_amount: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          operation_id?: string | null;
          product_id: string;
          quantity: number;
          unit_price_ht?: number | null;
          total_price_ht?: number | null;
          unit_power_w?: number | null;
          cee_sheet_code?: string | null;
          cumac_amount?: number | null;
          valuation_amount?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          operation_id?: string | null;
          product_id?: string;
          quantity?: number;
          unit_price_ht?: number | null;
          total_price_ht?: number | null;
          unit_power_w?: number | null;
          cee_sheet_code?: string | null;
          cumac_amount?: number | null;
          valuation_amount?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      operations: {
        Row: {
          id: string;
          operation_reference: string;
          beneficiary_id: string;
          lead_id: string | null;
          reference_technical_visit_id: string | null;
          cee_sheet_id: string | null;
          cee_input_values: Json;
          cee_kwhc_calculated: number | null;
          cee_sheet_code: string;
          product_family: ProductFamily | null;
          title: string;
          operation_status: OperationStatus;
          sales_status: SalesStatus;
          admin_status: AdminStatus;
          technical_status: TechnicalStatus;
          delegator_id: string | null;
          sales_owner_id: string | null;
          confirmer_id: string | null;
          admin_owner_id: string | null;
          technical_owner_id: string | null;
          technical_visit_date: string | null;
          quote_sent_at: string | null;
          quote_signed_at: string | null;
          installation_start_at: string | null;
          installation_end_at: string | null;
          deposit_date: string | null;
          prime_paid_at: string | null;
          estimated_quote_amount_ht: number | null;
          estimated_prime_amount: number | null;
          estimated_remaining_cost: number | null;
          valuation_amount: number | null;
          drive_url: string | null;
          signature_url: string | null;
          public_tracking_url: string | null;
          risk_level: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          operation_reference: string;
          beneficiary_id: string;
          lead_id?: string | null;
          reference_technical_visit_id?: string | null;
          cee_sheet_id?: string | null;
          cee_input_values?: Json;
          cee_kwhc_calculated?: number | null;
          cee_sheet_code?: string;
          product_family?: ProductFamily | null;
          title: string;
          operation_status: OperationStatus;
          sales_status: SalesStatus;
          admin_status: AdminStatus;
          technical_status: TechnicalStatus;
          delegator_id?: string | null;
          sales_owner_id?: string | null;
          confirmer_id?: string | null;
          admin_owner_id?: string | null;
          technical_owner_id?: string | null;
          technical_visit_date?: string | null;
          quote_sent_at?: string | null;
          quote_signed_at?: string | null;
          installation_start_at?: string | null;
          installation_end_at?: string | null;
          deposit_date?: string | null;
          prime_paid_at?: string | null;
          estimated_quote_amount_ht?: number | null;
          estimated_prime_amount?: number | null;
          estimated_remaining_cost?: number | null;
          valuation_amount?: number | null;
          drive_url?: string | null;
          signature_url?: string | null;
          public_tracking_url?: string | null;
          risk_level?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          operation_reference?: string;
          beneficiary_id?: string;
          lead_id?: string | null;
          reference_technical_visit_id?: string | null;
          cee_sheet_id?: string | null;
          cee_input_values?: Json;
          cee_kwhc_calculated?: number | null;
          cee_sheet_code?: string;
          product_family?: ProductFamily | null;
          title?: string;
          operation_status?: OperationStatus;
          sales_status?: SalesStatus;
          admin_status?: AdminStatus;
          technical_status?: TechnicalStatus;
          delegator_id?: string | null;
          sales_owner_id?: string | null;
          confirmer_id?: string | null;
          admin_owner_id?: string | null;
          technical_owner_id?: string | null;
          technical_visit_date?: string | null;
          quote_sent_at?: string | null;
          quote_signed_at?: string | null;
          installation_start_at?: string | null;
          installation_end_at?: string | null;
          deposit_date?: string | null;
          prime_paid_at?: string | null;
          estimated_quote_amount_ht?: number | null;
          estimated_prime_amount?: number | null;
          estimated_remaining_cost?: number | null;
          valuation_amount?: number | null;
          drive_url?: string | null;
          signature_url?: string | null;
          public_tracking_url?: string | null;
          risk_level?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      operation_sites: {
        Row: {
          id: string;
          operation_id: string;
          label: string;
          sequence_number: number | null;
          is_primary: boolean;
          site_kind: SiteKind | null;
          activity_type: string | null;
          building_type: string | null;
          dedicated_building: string | null;
          climate_zone: string | null;
          operating_mode: string | null;
          height_m: number | null;
          volume_m3: number | null;
          area_m2: number | null;
          flow_type: string | null;
          heating_system_type: string | null;
          convective_power_kw: number | null;
          radiant_power_kw: number | null;
          calculated_power_kw: number | null;
          air_flow_required_m3h: number | null;
          destratifier_quantity_required: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          operation_id: string;
          label: string;
          sequence_number?: number | null;
          is_primary?: boolean;
          site_kind?: SiteKind | null;
          activity_type?: string | null;
          building_type?: string | null;
          dedicated_building?: string | null;
          climate_zone?: string | null;
          operating_mode?: string | null;
          height_m?: number | null;
          volume_m3?: number | null;
          area_m2?: number | null;
          flow_type?: string | null;
          heating_system_type?: string | null;
          convective_power_kw?: number | null;
          radiant_power_kw?: number | null;
          calculated_power_kw?: number | null;
          air_flow_required_m3h?: number | null;
          destratifier_quantity_required?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          operation_id?: string;
          label?: string;
          sequence_number?: number | null;
          is_primary?: boolean;
          site_kind?: SiteKind | null;
          activity_type?: string | null;
          building_type?: string | null;
          dedicated_building?: string | null;
          climate_zone?: string | null;
          operating_mode?: string | null;
          height_m?: number | null;
          volume_m3?: number | null;
          area_m2?: number | null;
          flow_type?: string | null;
          heating_system_type?: string | null;
          convective_power_kw?: number | null;
          radiant_power_kw?: number | null;
          calculated_power_kw?: number | null;
          air_flow_required_m3h?: number | null;
          destratifier_quantity_required?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      technical_visit_templates: {
        Row: {
          id: string;
          cee_sheet_id: string | null;
          template_key: string;
          label: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cee_sheet_id?: string | null;
          template_key: string;
          label: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cee_sheet_id?: string | null;
          template_key?: string;
          label?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "technical_visit_templates_cee_sheet_id_fkey";
            columns: ["cee_sheet_id"];
            isOneToOne: false;
            referencedRelation: "cee_sheets";
            referencedColumns: ["id"];
          },
        ];
      };
      technical_visit_template_versions: {
        Row: {
          id: string;
          template_id: string;
          version_number: number;
          status: string;
          schema_json: Json;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          template_id: string;
          version_number: number;
          status?: string;
          schema_json: Json;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          template_id?: string;
          version_number?: number;
          status?: string;
          schema_json?: Json;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "technical_visit_template_versions_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "technical_visit_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      technical_visits: {
        Row: {
          id: string;
          vt_reference: string;
          lead_id: string;
          beneficiary_id: string | null;
          workflow_id: string | null;
          created_by_user_id: string | null;
          visit_template_key: string | null;
          visit_template_version: number | null;
          visit_schema_snapshot_json: Json | null;
          form_answers_json: Json;
          started_at: string | null;
          completed_at: string | null;
          access_granted_at: string | null;
          locked_at: string | null;
          locked_by: string | null;
          status: TechnicalVisitStatus;
          scheduled_at: string | null;
          performed_at: string | null;
          time_slot: string | null;
          technician_id: string | null;
          worksite_address: string | null;
          worksite_postal_code: string | null;
          worksite_city: string | null;
          worksite_latitude: number | null;
          worksite_longitude: number | null;
          region: string | null;
          surface_m2: number | null;
          ceiling_height_m: number | null;
          heating_type: string[] | null;
          observations: string | null;
          technical_report: string | null;
          photos: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          vt_reference?: string;
          lead_id: string;
          beneficiary_id?: string | null;
          workflow_id?: string | null;
          created_by_user_id?: string | null;
          visit_template_key?: string | null;
          visit_template_version?: number | null;
          visit_schema_snapshot_json?: Json | null;
          form_answers_json?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          access_granted_at?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          status?: TechnicalVisitStatus;
          scheduled_at?: string | null;
          performed_at?: string | null;
          time_slot?: string | null;
          technician_id?: string | null;
          worksite_address?: string | null;
          worksite_postal_code?: string | null;
          worksite_city?: string | null;
          worksite_latitude?: number | null;
          worksite_longitude?: number | null;
          region?: string | null;
          surface_m2?: number | null;
          ceiling_height_m?: number | null;
          heating_type?: string[] | null;
          observations?: string | null;
          technical_report?: string | null;
          photos?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          vt_reference?: string;
          lead_id?: string;
          beneficiary_id?: string | null;
          workflow_id?: string | null;
          created_by_user_id?: string | null;
          visit_template_key?: string | null;
          visit_template_version?: number | null;
          visit_schema_snapshot_json?: Json | null;
          form_answers_json?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          access_granted_at?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          status?: TechnicalVisitStatus;
          scheduled_at?: string | null;
          performed_at?: string | null;
          time_slot?: string | null;
          technician_id?: string | null;
          worksite_address?: string | null;
          worksite_postal_code?: string | null;
          worksite_city?: string | null;
          worksite_latitude?: number | null;
          worksite_longitude?: number | null;
          region?: string | null;
          surface_m2?: number | null;
          ceiling_height_m?: number | null;
          heating_type?: string[] | null;
          observations?: string | null;
          technical_report?: string | null;
          photos?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      technical_visit_alerts: {
        Row: {
          id: string;
          technical_visit_id: string;
          alert_type: string;
          severity: string;
          title: string;
          message: string;
          status: string;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: {
          id?: string;
          technical_visit_id: string;
          alert_type: string;
          severity: string;
          title: string;
          message: string;
          status?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          id?: string;
          technical_visit_id?: string;
          alert_type?: string;
          severity?: string;
          title?: string;
          message?: string;
          status?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Relationships: [];
      };
      technical_visit_audio_notes: {
        Row: {
          id: string;
          technical_visit_id: string;
          created_by_user_id: string;
          audio_storage_path: string | null;
          audio_public_url: string | null;
          mime_type: string;
          duration_seconds: number | null;
          transcription_text: string | null;
          transcription_status: string;
          transcription_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          technical_visit_id: string;
          created_by_user_id: string;
          audio_storage_path?: string | null;
          audio_public_url?: string | null;
          mime_type: string;
          duration_seconds?: number | null;
          transcription_text?: string | null;
          transcription_status?: string;
          transcription_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          technical_visit_id?: string;
          created_by_user_id?: string;
          audio_storage_path?: string | null;
          audio_public_url?: string | null;
          mime_type?: string;
          duration_seconds?: number | null;
          transcription_text?: string | null;
          transcription_status?: string;
          transcription_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      technical_visit_geo_proofs: {
        Row: {
          id: string;
          technical_visit_id: string;
          kind: string;
          latitude: number | null;
          longitude: number | null;
          accuracy_m: number | null;
          client_captured_at: string | null;
          server_recorded_at: string;
          provider_error_code: string | null;
          distance_to_site_m: number | null;
          coherence:
            | "on_site"
            | "near_site"
            | "far_from_site"
            | "site_coords_missing"
            | "geo_unavailable"
            | "geo_refused";
          worksite_latitude_snapshot: number | null;
          worksite_longitude_snapshot: number | null;
        };
        Insert: {
          id?: string;
          technical_visit_id: string;
          kind?: string;
          latitude?: number | null;
          longitude?: number | null;
          accuracy_m?: number | null;
          client_captured_at?: string | null;
          server_recorded_at?: string;
          provider_error_code?: string | null;
          distance_to_site_m?: number | null;
          coherence:
            | "on_site"
            | "near_site"
            | "far_from_site"
            | "site_coords_missing"
            | "geo_unavailable"
            | "geo_refused";
          worksite_latitude_snapshot?: number | null;
          worksite_longitude_snapshot?: number | null;
        };
        Update: {
          id?: string;
          technical_visit_id?: string;
          kind?: string;
          latitude?: number | null;
          longitude?: number | null;
          accuracy_m?: number | null;
          client_captured_at?: string | null;
          server_recorded_at?: string;
          provider_error_code?: string | null;
          distance_to_site_m?: number | null;
          coherence?:
            | "on_site"
            | "near_site"
            | "far_from_site"
            | "site_coords_missing"
            | "geo_unavailable"
            | "geo_refused";
          worksite_latitude_snapshot?: number | null;
          worksite_longitude_snapshot?: number | null;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          task_type: string;
          priority: string;
          status: string;
          due_date: string | null;
          assigned_user_id: string | null;
          created_by_user_id: string | null;
          related_entity_type: string | null;
          related_entity_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          task_type?: string;
          priority?: string;
          status?: string;
          due_date?: string | null;
          assigned_user_id?: string | null;
          created_by_user_id?: string | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          task_type?: string;
          priority?: string;
          status?: string;
          due_date?: string | null;
          assigned_user_id?: string | null;
          created_by_user_id?: string | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_tracking: {
        Row: {
          id: string;
          lead_id: string | null;
          commercial_callback_id: string | null;
          recipient: string;
          subject: string | null;
          sent_at: string;
          opened_at: string | null;
          open_count: number;
          last_opened_at: string | null;
          click_count: number;
          first_clicked_at: string | null;
          last_clicked_at: string | null;
          user_agent: string | null;
          ip_address: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          commercial_callback_id?: string | null;
          recipient: string;
          subject?: string | null;
          sent_at?: string;
          opened_at?: string | null;
          open_count?: number;
          last_opened_at?: string | null;
          click_count?: number;
          first_clicked_at?: string | null;
          last_clicked_at?: string | null;
          user_agent?: string | null;
          ip_address?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          lead_id?: string | null;
          commercial_callback_id?: string | null;
          recipient?: string;
          subject?: string | null;
          sent_at?: string;
          opened_at?: string | null;
          open_count?: number;
          last_opened_at?: string | null;
          click_count?: number;
          first_clicked_at?: string | null;
          last_clicked_at?: string | null;
          user_agent?: string | null;
          ip_address?: string | null;
          created_by?: string | null;
        };
        Relationships: [];
      };
      lead_emails: {
        Row: {
          id: string;
          lead_id: string;
          direction: string;
          from_email: string;
          to_email: string;
          subject: string | null;
          html_body: string | null;
          text_body: string | null;
          gmail_message_id: string | null;
          email_date: string;
          tracking_id: string | null;
          attachments: Json;
          ai_analysis: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          direction: string;
          from_email: string;
          to_email: string;
          subject?: string | null;
          html_body?: string | null;
          text_body?: string | null;
          gmail_message_id?: string | null;
          email_date?: string;
          tracking_id?: string | null;
          attachments?: Json;
          ai_analysis?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          direction?: string;
          from_email?: string;
          to_email?: string;
          subject?: string | null;
          html_body?: string | null;
          text_body?: string | null;
          gmail_message_id?: string | null;
          email_date?: string;
          tracking_id?: string | null;
          attachments?: Json;
          ai_analysis?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      installations: {
        Row: {
          id: string;
          team_name: string | null;
          subcontractor_name: string | null;
          start_date: string | null;
          end_date: string | null;
          technician_count: number | null;
          status: string;
          travel_cost: number | null;
          hotel_cost: number | null;
          notes: string | null;
          assigned_installer_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_name?: string | null;
          subcontractor_name?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          technician_count?: number | null;
          status?: string;
          travel_cost?: number | null;
          hotel_cost?: number | null;
          notes?: string | null;
          assigned_installer_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_name?: string | null;
          subcontractor_name?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          technician_count?: number | null;
          status?: string;
          travel_cost?: number | null;
          hotel_cost?: number | null;
          notes?: string | null;
          assigned_installer_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_logs: {
        Row: {
          id: string;
          channel: string;
          provider: string;
          status: string;
          event_type: string | null;
          entity_type: string | null;
          entity_id: string | null;
          payload_json: Json | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          channel: string;
          provider?: string;
          status: string;
          event_type?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          payload_json?: Json | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          channel?: string;
          provider?: string;
          status?: string;
          event_type?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          payload_json?: Json | null;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      automation_logs: {
        Row: {
          id: string;
          automation_type: string;
          rule_id: string | null;
          workflow_id: string | null;
          lead_id: string | null;
          callback_id: string | null;
          dedupe_key: string | null;
          status: string;
          slack_channel: string | null;
          slack_event_type: string | null;
          result_json: Json | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          automation_type: string;
          rule_id?: string | null;
          workflow_id?: string | null;
          lead_id?: string | null;
          callback_id?: string | null;
          dedupe_key?: string | null;
          status: string;
          slack_channel?: string | null;
          slack_event_type?: string | null;
          result_json?: Json | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          automation_type?: string;
          rule_id?: string | null;
          workflow_id?: string | null;
          lead_id?: string | null;
          callback_id?: string | null;
          dedupe_key?: string | null;
          status?: string;
          slack_channel?: string | null;
          slack_event_type?: string | null;
          result_json?: Json | null;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      workflow_event_logs: {
        Row: {
          id: string;
          workflow_id: string;
          lead_id: string;
          from_status: string | null;
          to_status: string;
          event_type: string;
          actor_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          lead_id: string;
          from_status?: string | null;
          to_status: string;
          event_type: string;
          actor_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          lead_id?: string;
          from_status?: string | null;
          to_status?: string;
          event_type?: string;
          actor_user_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      lead_sheet_workflows: {
        Row: {
          id: string;
          lead_id: string;
          cee_sheet_id: string;
          cee_sheet_team_id: string | null;
          workflow_status: string;
          assigned_agent_user_id: string | null;
          assigned_confirmateur_user_id: string | null;
          assigned_closer_user_id: string | null;
          simulation_input_json: Json;
          simulation_result_json: Json;
          qualification_data_json: Json;
          presentation_document_id: string | null;
          agreement_document_id: string | null;
          quote_document_id: string | null;
          agreement_signature_status: string | null;
          agreement_signature_provider: string | null;
          agreement_signature_request_id: string | null;
          agreement_sent_at: string | null;
          agreement_signed_at: string | null;
          closer_notes: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          cee_sheet_id: string;
          cee_sheet_team_id?: string | null;
          workflow_status: string;
          assigned_agent_user_id?: string | null;
          assigned_confirmateur_user_id?: string | null;
          assigned_closer_user_id?: string | null;
          simulation_input_json?: Json;
          simulation_result_json?: Json;
          qualification_data_json?: Json;
          presentation_document_id?: string | null;
          agreement_document_id?: string | null;
          quote_document_id?: string | null;
          agreement_signature_status?: string | null;
          agreement_signature_provider?: string | null;
          agreement_signature_request_id?: string | null;
          agreement_sent_at?: string | null;
          agreement_signed_at?: string | null;
          closer_notes?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          cee_sheet_id?: string;
          cee_sheet_team_id?: string | null;
          workflow_status?: string;
          assigned_agent_user_id?: string | null;
          assigned_confirmateur_user_id?: string | null;
          assigned_closer_user_id?: string | null;
          simulation_input_json?: Json;
          simulation_result_json?: Json;
          qualification_data_json?: Json;
          presentation_document_id?: string | null;
          agreement_document_id?: string | null;
          quote_document_id?: string | null;
          agreement_signature_status?: string | null;
          agreement_signature_provider?: string | null;
          agreement_signature_request_id?: string | null;
          agreement_sent_at?: string | null;
          agreement_signed_at?: string | null;
          closer_notes?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lead_sheet_workflow_events: {
        Row: {
          id: string;
          lead_sheet_workflow_id: string;
          event_type: string;
          event_label: string;
          payload_json: Json;
          created_by_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_sheet_workflow_id: string;
          event_type: string;
          event_label: string;
          payload_json?: Json;
          created_by_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_sheet_workflow_id?: string;
          event_type?: string;
          event_label?: string;
          payload_json?: Json;
          created_by_user_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      lead_source: LeadSource;
      lead_status: LeadStatus;
      qualification_status: QualificationStatus;
      product_family: ProductFamily;
      sales_status: SalesStatus;
      admin_status: AdminStatus;
      technical_status: TechnicalStatus;
      technical_visit_status: TechnicalVisitStatus;
      beneficiary_status: BeneficiaryStatus;
      site_kind: SiteKind;
      operation_status: OperationStatus;
      document_type: DocumentType;
      document_status: DocumentStatus;
      study_type: StudyType;
      technical_study_status: TechnicalStudyStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
