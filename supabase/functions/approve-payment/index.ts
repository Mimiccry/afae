// @ts-nocheck
// Supabase Edge Function: approve-payment
// 요청 바디: { paymentKey: string, orderId: string, amount: number }
// 응답: { success: true, data } | { success: false, message }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type ConfirmBody = {
  paymentKey?: string;
  orderId?: string;
  amount?: number;
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return json({ success: false, message: "Method not allowed" }, 405);
  }

  const secretKey = Deno.env.get("TOSS_SECRET_KEY");
  if (!secretKey) {
    return json({ success: false, message: "Missing TOSS_SECRET_KEY" }, 500);
  }

  let payload: ConfirmBody;
  try {
    payload = await req.json();
  } catch {
    return json({ success: false, message: "Invalid JSON body" }, 400);
  }

  const { paymentKey, orderId, amount } = payload;
  if (!paymentKey || !orderId || typeof amount !== "number") {
    return json(
      { success: false, message: "paymentKey, orderId, amount(required)" },
      400,
    );
  }

  try {
    const auth = "Basic " + btoa(`${secretKey}:`);
    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const data = await tossRes.json();

    if (!tossRes.ok) {
      return json(
        {
          success: false,
          message: data?.message || "Confirm failed",
          code: data?.code,
        },
        tossRes.status,
      );
    }

    return json({ success: true, data });
  } catch (error) {
    console.error("confirm error:", error);
    return json({ success: false, message: "Server error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

