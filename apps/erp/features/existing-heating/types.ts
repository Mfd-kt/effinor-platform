import type { Database } from "@/types/database.types";

export type ExistingHeatingUnitRow = Database["public"]["Tables"]["existing_heating_units"]["Row"];
export type HeatingModelRow = Database["public"]["Tables"]["heating_models"]["Row"];

export type ExistingHeatingListRow = ExistingHeatingUnitRow & {
  heating_model_label: string;
};

export type HeatingModelOption = {
  id: string;
  brand: string;
  model: string;
  type: string;
  power_kw: number | null;
  label: string;
};

export type ExistingHeatingFormOptions = {
  heatingModels: HeatingModelOption[];
};

export type ExistingHeatingDetailRow = ExistingHeatingUnitRow & {
  heating_models: {
    id: string;
    brand: string;
    model: string;
    type: string;
    energy: string | null;
    power_kw: number | null;
  } | null;
};
