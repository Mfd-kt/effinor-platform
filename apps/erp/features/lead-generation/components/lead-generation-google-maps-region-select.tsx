"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { LEAD_GEN_GOOGLE_MAPS_REGION_OPTIONS } from "../lib/google-maps-region-options";

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
  placeholder = "Choisir une zone",
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
        {LEAD_GEN_GOOGLE_MAPS_REGION_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
