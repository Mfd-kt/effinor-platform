export type DropcontactPostResponse = {
  error?: boolean;
  success?: boolean;
  request_id?: string;
  credits_left?: number;
};

export type DropcontactGetResponse = {
  error?: boolean;
  success?: boolean;
  reason?: string;
  data?: DropcontactEnrichedContact[];
};

export type DropcontactEmailEntry = {
  email?: string;
  qualification?: string;
};

/** Une entrée renvoyée par GET /v1/enrich/all/{request_id} (contact enrichi). */
export type DropcontactEnrichedContact = {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: DropcontactEmailEntry[] | string;
  phone?: string;
  mobile_phone?: string;
  company?: string;
  website?: string;
  linkedin?: string;
  company_linkedin?: string;
  siret?: string;
  siren?: string;
  siret_address?: string;
  siret_zip?: string;
  siret_city?: string;
  vat?: string;
  nb_employees?: string;
  naf5_code?: string;
  naf5_des?: string;
  job?: string;
  job_level?: string;
  job_function?: string;
  custom_fields?: Record<string, string>;
};
