import type { Database } from "@/types/database.types";

export type OperationSiteRow = Database["public"]["Tables"]["operation_sites"]["Row"];

export type OperationSiteListRow = OperationSiteRow & {
  operation_reference: string | null;
  operation_title: string | null;
  beneficiary_company_name: string | null;
};

export type OperationOption = {
  id: string;
  operation_reference: string;
  title: string;
  beneficiary_company_name: string | null;
};

export type OperationSiteFormOptions = {
  operations: OperationOption[];
};

export type OperationSiteDetailRow = OperationSiteRow & {
  operations: {
    id: string;
    operation_reference: string;
    title: string;
    beneficiary_id: string;
    beneficiaries: {
      id: string;
      company_name: string;
    } | null;
  } | null;
};
