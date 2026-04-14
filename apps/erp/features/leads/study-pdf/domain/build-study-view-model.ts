import { formatHeatingModesDisplay } from "../../lib/heating-modes";
import { stringArrayFromLeadJson } from "../../lib/lead-media-json";
import { STUDY_INSTALLATION_EXAMPLES } from "../content/installation-examples";
import { filterParasiteNotes } from "./filter-study-notes";
import { resolveStudyProductsForPdf } from "./resolve-study-products";
import type { StudyPdfGenerationInput, StudyPdfViewModel } from "./types";
import { StudyPdfViewModelSchema } from "./validation";

const TEMPLATE_VERSION = "v2.1.0";

function joinedAddress(address: string, postalCode: string, city: string): string {
  return [address.trim(), postalCode.trim(), city.trim()].filter(Boolean).join(", ");
}

function contactName(firstName: string | null, lastName: string | null, fallback?: string | null): string {
  const bySplit = [firstName?.trim() ?? "", lastName?.trim() ?? ""].filter(Boolean).join(" ");
  return bySplit || fallback?.trim() || "Non renseigné";
}

export function buildLeadStudyPdfViewModel(input: StudyPdfGenerationInput): StudyPdfViewModel {
  const { lead, qualificationNotes: rawNotes, generatedByLabel } = input;
  const qualificationNotes = filterParasiteNotes(rawNotes);
  const useSurface = lead.sim_surface_m2 ?? lead.surface_m2 ?? 0;
  const useHeight = lead.sim_height_m ?? lead.ceiling_height_m ?? 0;
  const useVolume = lead.sim_volume_m3 ?? Math.max(0, useSurface * useHeight);
  const useHeating = lead.sim_heating_mode ?? formatHeatingModesDisplay(lead.heating_type);

  const vm: StudyPdfViewModel = {
    templateVersion: TEMPLATE_VERSION,
    generatedAtIso: new Date().toISOString(),
    generatedByLabel,
    client: {
      companyName: lead.company_name,
      contactName: contactName(lead.first_name, lead.last_name, lead.contact_name),
      contactRole: lead.contact_role?.trim() || lead.job_title?.trim() || "Non renseigné",
      phone: lead.phone?.trim() || "Non renseigné",
      email: lead.email?.trim() || "Non renseigné",
      department: lead.department?.trim() || "Non renseigné",
      activityType: lead.building_type?.trim() || lead.sim_client_type?.trim() || "Non renseigné",
    },
    site: {
      label: lead.worksite_city?.trim() || lead.head_office_city?.trim() || "Site client",
      addressLine:
        joinedAddress(lead.worksite_address, lead.worksite_postal_code, lead.worksite_city) ||
        joinedAddress(lead.head_office_address, lead.head_office_postal_code, lead.head_office_city) ||
        "Adresse non renseignée",
      postalCode: lead.worksite_postal_code?.trim() || lead.head_office_postal_code?.trim() || "Non renseigné",
      city: lead.worksite_city?.trim() || lead.head_office_city?.trim() || "Non renseigné",
      type: lead.sim_client_type?.trim() || lead.building_type?.trim() || "Non renseigné",
      surfaceM2: useSurface,
      heightM: useHeight,
      volumeM3: useVolume,
      heatingMode: useHeating || "Non renseigné",
    },
    simulation: {
      model: lead.sim_model?.trim() || "Non renseigné",
      neededDestrat: lead.sim_needed_destrat ?? 0,
      modelCapacityM3h: lead.sim_model_capacity_m3h ?? 0,
      powerKw: lead.sim_power_kw ?? 0,
      airChangeRate: lead.sim_air_change_rate ?? 0,
      annualConsumptionKwh: lead.sim_consumption_kwh_year ?? 0,
      annualCostEuro: lead.sim_cost_year_selected ?? 0,
      annualSavingKwh: lead.sim_saving_kwh_30 ?? 0,
      annualSavingEuro: lead.sim_saving_eur_30_selected ?? 0,
      co2SavedTons: lead.sim_co2_saved_tons ?? 0,
      ceePrimeEuro: lead.sim_cee_prime_estimated ?? 0,
      installTotalEuro: lead.sim_install_total_price ?? 0,
      restToChargeEuro: lead.sim_rest_to_charge ?? 0,
      score: lead.sim_lead_score ?? null,
    },
    qualification: {
      status: lead.qualification_status,
      notes: qualificationNotes,
      contextSummary:
        lead.ai_lead_summary?.trim() ||
        (qualificationNotes.length
          ? qualificationNotes[0] ?? ""
          : "Qualification réalisée sur la base des informations techniques et commerciales collectées."),
    },
    media: {
      logoUrl: null,
      aerialPhotoUrl: stringArrayFromLeadJson(lead.aerial_photos)[0] ?? null,
      cadastralPhotoUrl: stringArrayFromLeadJson(lead.cadastral_parcel_files)[0] ?? null,
      studyMediaUrls: stringArrayFromLeadJson(lead.study_media_files),
    },
    comparables: STUDY_INSTALLATION_EXAMPLES,
    products: resolveStudyProductsForPdf(lead.sim_model),
  };

  return StudyPdfViewModelSchema.parse(vm);
}
