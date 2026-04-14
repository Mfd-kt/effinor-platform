"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { convertCommercialCallbackToLead } from "@/features/commercial-callbacks/actions/convert-callback-to-lead";
import { Button } from "@/components/ui/button";

type Props = {
  callbackId: string;
  size?: "xs" | "sm" | "default";
};

export function CockpitConvertButton({ callbackId, size = "sm" }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      size={size === "xs" ? "xs" : size}
      variant="secondary"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const r = await convertCommercialCallbackToLead({ callbackId });
          if (r.ok) {
            router.push(`/leads/${r.leadId}`);
            router.refresh();
          } else {
            window.alert(r.error);
          }
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "…" : "Convertir"}
    </Button>
  );
}
