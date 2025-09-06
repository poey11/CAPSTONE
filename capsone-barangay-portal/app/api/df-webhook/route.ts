// app/api/df-webhook/route.ts
// Next.js App Router webhook for Dialogflow CX

export const runtime = "nodejs";        // ensure Node runtime (not edge)
export const dynamic = "force-dynamic"; // avoid caching

const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || "";

// ---- Helpers ----
function t(msg: string) {
  return { text: { text: [msg] } };
}
function reply(message: string, params?: Record<string, any>) {
  return {
    fulfillment_response: { messages: [t(message)] },
    session_info: params ? { parameters: params } : undefined,
  };
}

// ---- Requirements data (edit as needed) ----
const REQ: Record<string, Record<string, string[]>> = {
  "Barangay Certificate": {
    Residency: [
      "Accomplished request form",
      "Valid ID (shows barangay address)",
      "Proof of residency (barangay ID / lease / utility bill)",
      "Fee: ₱50 (subject to change)",
    ],
    "No Income": [
      "Accomplished request form",
      "Valid ID",
      "Affidavit of No Income (if applicable)",
      "Fee: ₱50",
    ],
    "General Purpose": [
      "Accomplished request form",
      "Valid ID",
      "Fee: ₱50",
    ],
  },
  Indigency: {
    "General Purpose": [
      "Accomplished request form",
      "Valid ID",
      "Statement of purpose (scholarship/medical/aid/etc.)",
      "Fee: ₱0–₱50 (depends on LGU policy)",
    ],
    "No Income": [
      "Accomplished request form",
      "Valid ID",
      "Affidavit of No Income (if applicable)",
    ],
  },
  Clearance: {
    "General Purpose": [
      "Accomplished request form",
      "Valid ID",
      "Police/NBI Clearance (if required by LGU)",
      "Fee: ₱100–₱150 (varies)",
    ],
  },
  "Business Permit": {
    New: [
      "DTI/SEC registration",
      "Lease/Tax Declaration",
      "Location sketch",
      "Sanitary & Fire clearances",
      "Assessments from BPLO",
    ],
    Renewal: [
      "Previous year’s permit",
      "Latest BIR registration/receipts",
      "Updated clearances if any changes",
    ],
  },
};

// ---- Small normalizers so free text still works with our map ----
function normalizeBase(input?: string) {
  if (!input) return "";
  const s = String(input).toLowerCase();
  if (s.includes("indigen")) return "Indigency";
  if (s.includes("resid") || s.includes("barangay certificate"))
    return "Barangay Certificate";
  if (s.includes("clearance")) return "Clearance";
  if (s.includes("business")) return "Business Permit";
  return input;
}
function labelizeVariant(input?: string) {
  if (!input) return "General Purpose";
  const s = String(input).toLowerCase();
  if (s.includes("resid")) return "Residency";
  if (s.includes("no income") || s.includes("walang kita")) return "No Income";
  if (s.includes("renew")) return "Renewal";
  if (s.includes("new")) return "New";
  // Title-case fallback
  return input.replace(/\b\w/g, (m) => m.toUpperCase());
}
function buildServicesLink(base: string, variant?: string) {
  const b = encodeURIComponent(base);
  const v = variant ? `&docV=${encodeURIComponent(variant)}` : "";
  return `/services/action?docB=${b}${v}`;
}

// Optional GET for quick “is alive” checks in browser
export async function GET() {
  return Response.json({ ok: true, where: "/api/df-webhook" });
}

// Main CX webhook handler
export async function POST(request: Request) {
  try {
    // Simple bearer auth (recommended)
    if (WEBHOOK_TOKEN) {
      const auth = request.headers.get("authorization") || "";
      if (auth !== `Bearer ${WEBHOOK_TOKEN}`) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    const tag = body?.fulfillmentInfo?.tag as string | undefined;
    const params = (body?.sessionInfo?.parameters || {}) as Record<string, any>;

    const docBase = normalizeBase(params.doc_base);
    const docVariant = labelizeVariant(params.doc_variant);

    // Tag: services.link — just return the deep link
    if (tag === "services.link") {
      if (!docBase) {
        return Response.json(
          reply(
            "Which document do you need? (e.g., Barangay Certificate, Indigency, Clearance)"
          )
        );
      }
      const url = buildServicesLink(
        docBase,
        params.doc_variant ? docVariant : undefined
      );
      return Response.json(
        reply(
          `Here’s your link for **${docBase}${
            params.doc_variant ? " – " + docVariant : ""
          }**:\n${url}`
        )
      );
    }

    // Tag: services.requirements — list requirements + link
    if (tag === "services.requirements") {
      if (!docBase) {
        return Response.json(
          reply(
            "Tell me the base document (e.g., Barangay Certificate or Indigency) so I can list the requirements."
          )
        );
      }
      const v = params.doc_variant ? docVariant : "General Purpose";
      const items = REQ[docBase]?.[v] || REQ[docBase]?.["General Purpose"];
      if (!items) {
        const url = buildServicesLink(
          docBase,
          params.doc_variant ? docVariant : undefined
        );
        return Response.json(
          reply(
            `I don’t have specific requirements for **${docBase}${
              params.doc_variant ? " – " + v : ""
            }** yet. You can still request it here:\n${url}`
          )
        );
      }
      const bullets = items.map((i) => `• ${i}`).join("\n");
      const url = buildServicesLink(docBase, params.doc_variant ? v : undefined);
      return Response.json(
        reply(
          `Requirements for **${docBase}${
            params.doc_variant ? " – " + v : ""
          }**:\n${bullets}\n\nYou can request it here:\n${url}`
        )
      );
    }

    // Default: tag not matched
    return Response.json(
      reply(
        "Webhook is live. (No tag matched — send `services.link` or `services.requirements`.)"
      )
    );
  } catch (err: any) {
    console.error("Webhook error:", err);
    return Response.json(reply("Sorry, something went wrong."), { status: 500 });
  }
}
