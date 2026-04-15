import { z } from "zod";

import type { VisitStartGeoProviderErrorCode } from "./start-geo-constants";

const errorCodes = z.enum(["refused", "unavailable", "timeout", "incompatible"]);

export const VisitStartGeoPayloadSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    latitude: z.number().finite().gte(-90).lte(90),
    longitude: z.number().finite().gte(-180).lte(180),
    accuracyM: z.number().finite().nonnegative().nullable(),
    clientCapturedAtIso: z.string().min(8),
  }),
  z.object({
    ok: z.literal(false),
    code: errorCodes,
  }),
]);

export type VisitStartGeoPayload = z.infer<typeof VisitStartGeoPayloadSchema>;

export type VisitStartGeoPayloadInput =
  | {
      ok: true;
      latitude: number;
      longitude: number;
      accuracyM: number | null;
      clientCapturedAtIso: string;
    }
  | {
      ok: false;
      code: VisitStartGeoProviderErrorCode;
    };
