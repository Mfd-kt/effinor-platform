"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DEFAULT_GOOGLE_MAPS_COUNTRY,
  LEAD_GEN_GOOGLE_MAPS_DEPARTMENT_OPTIONS,
  LEAD_GEN_GOOGLE_MAPS_OVERSEAS_TERRITORY_OPTIONS,
} from "../lib/google-maps-region-options";

type Props = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function LeadGenerationGoogleMapsRegionSelect({
  id,
  value,
  onValueChange,
  disabled,
  placeholder = "Choisir un département / territoire",
}: Props) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v) {
          onValueChange(v);
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={DEFAULT_GOOGLE_MAPS_COUNTRY}>France (tout le pays)</SelectItem>
        <SelectGroup>
          <SelectLabel>Métropole + DOM (départements)</SelectLabel>
          {LEAD_GEN_GOOGLE_MAPS_DEPARTMENT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Collectivités / territoires français d’outre-mer</SelectLabel>
          {LEAD_GEN_GOOGLE_MAPS_OVERSEAS_TERRITORY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
