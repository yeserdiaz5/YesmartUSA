"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Server Action: purchaseLabelForOrder
 * - Usa SUPABASE_SERVICE_ROLE_KEY en el servidor para ignorar RLS durante el INSERT en `shipments`.
 * - Mantén RLS activado en Supabase (más seguro) y limita SELECT a cada dueño con policies.
 *
 * ⚠️ IMPORTANTE:
 * - Cambia el esquema de inserción si tu tabla `shipments` tiene columnas distintas.
 * - Este archivo NO hace la compra real en ShipEngine; integra tu lógica actual donde se indica.
 */

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE  = process.env.SUPABASE_SERVICE_ROLE_KEY!; // SOLO servidor (no NEXT_PUBLIC)

type PurchaseResult = {
  success: boolean;
  error?: string;
  label_url?: string;
  tracking_number?: string;
};

export async function purchaseLabelForOrder(
  orderId: string,
  rateId: string,
  serviceCode: string,
  lengthIn: number,
  widthIn: number,
  heightIn: number,
  weightOz: number,
  userId?: string // opcional: pásalo si quieres asociar el owner para SELECT por dueño
): Promise<PurchaseResult> {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      const msg = "[purchaseLabelForOrder] Missing envs: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY";
      console.error(msg);
      return { success: false, error: msg };
    }

    // 1) Compra real en ShipEngine (integra aquí tu lógica actual)
    // const se = await shipengine.purchase(...)
    // const { label_url, tracking_number, carrier_id, amount, currency } = se;

    // Datos de ejemplo (sustituye con datos reales del response de ShipEngine)
    const label_url = "https://example.com/label.pdf";
    const tracking_number = "1ZEXAMPLE123";
    const carrier_id = "ups";
    const amount = 9.85;
    const currency = "USD";

    // 2) Insert en Supabase usando SERVICE ROLE => ignora RLS (solo en servidor)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // ⚠️ Cambia el nombre de la tabla si tu tabla no es `shipments`
    // Asegúrate que exista una columna `user_id` si quieres filtrar SELECT por dueño.
    const insertPayload: any = {
      order_id: orderId,
      rate_id: rateId,
      service_code: serviceCode,
      length_in: lengthIn,
      width_in: widthIn,
      height_in: heightIn,
      weight_oz: weightOz,
      label_url,
      tracking_number,
      carrier_id,
      amount,
      currency,
    };

    if (userId) insertPayload.user_id = userId;

    const { data, error } = await supabase
      .from("shipments")
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.error("[purchaseLabelForOrder] Supabase insert error:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      label_url: data?.label_url,
      tracking_number: data?.tracking_number
    };
  } catch (err: any) {
    console.error("[purchaseLabelForOrder] runtime error:", err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}
