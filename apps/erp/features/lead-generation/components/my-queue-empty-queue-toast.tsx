"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Affiche un toast une fois quand l’URL contient `?queueEmpty=1`, puis nettoie le paramètre.
 */
export function MyQueueEmptyQueueToast() {
  const router = useRouter();
  const pathname = usePathname();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) {
      return;
    }
    fired.current = true;
    toast.message("Plus aucune fiche à traiter pour le moment.");
    router.replace(pathname);
  }, [pathname, router]);

  return null;
}
