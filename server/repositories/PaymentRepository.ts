import { SupabaseClient } from "@supabase/supabase-js";

export type PaymentStatus = "Pendiente" | "En revisión" | "Aprobado" | "Rechazado";

export interface PaymentRow {
  id: string;
  company_id: string;
  plan: "Emprendedor" | "Negocio" | "Empresa";
  amount: number;
  currency: string;
  method: string;
  reference: string | null;
  proof_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  status: PaymentStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export class PaymentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(payment: Partial<PaymentRow>): Promise<PaymentRow> {
    const { data, error } = await this.client
      .from("payments")
      .insert(payment)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data as PaymentRow;
  }

  async findById(id: string): Promise<PaymentRow | null> {
    const { data, error } = await this.client.from("payments").select("*").eq("id", id).single();
    if (error) return null;
    return data as PaymentRow;
  }

  /** Payments still awaiting a decision (Pendiente or En revisión). */
  async listPending(): Promise<PaymentRow[]> {
    const { data, error } = await this.client
      .from("payments")
      .select("*, companies(name, slug, email, user_id)")
      .in("status", ["Pendiente", "En revisión"])
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as PaymentRow[];
  }

  async updateStatus(
    id: string,
    status: Exclude<PaymentStatus, "Pendiente">,
    reviewedBy: string,
    rejectionReason?: string,
  ): Promise<PaymentRow> {
    const { data, error } = await this.client
      .from("payments")
      .update({
        status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason || null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data as PaymentRow;
  }

  async deleteById(id: string): Promise<void> {
    const { error } = await this.client.from("payments").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
