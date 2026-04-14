import type { Database } from "@/types/database.types";

export type CommercialCallbackRow = Database["public"]["Tables"]["commercial_callbacks"]["Row"];

export type CommercialCallbackInsert = Database["public"]["Tables"]["commercial_callbacks"]["Insert"];

export type CommercialCallbackUpdate = Database["public"]["Tables"]["commercial_callbacks"]["Update"];

export type { CallbackListFilter } from "@/features/commercial-callbacks/domain/callback-dates";
