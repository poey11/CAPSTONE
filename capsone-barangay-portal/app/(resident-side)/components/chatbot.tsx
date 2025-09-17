"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
// @ts-ignore – quiet incompatible React type signatures in some setups
import ReactMarkdown from "react-markdown";
// @ts-ignore
import remarkGfm from "remark-gfm";
// @ts-ignore
import rehypeSanitize from "rehype-sanitize";
import "@/CSS/Components/chatbot.css";

// ===== Firestore =====
import { db } from "@/app/db/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  limit as qLimit,
} from "firebase/firestore";

// ===== Auth (same pattern as Menu) =====
import { useAuth } from "@/app/context/authContext";

type ChatMsg = { id: string; role: "user" | "bot"; text: string; ts: number };

// Shapes we’ll read (tolerant to missing fields)
type ResidentDoc = {
  residentId?: string;
  first_name?: string;
  last_name?: string;
  status?: string; // "Verified" | others
  userIcon?: string;
};

type ProgramsParticipant = {
  id: string;
  programId?: string;
  residentId?: string;
  role?: string;
};

type ProgramDoc = {
  programName?: string;
  progressStatus?: string; // "Ongoing" | "Upcoming" | "Completed" | ...
};

type ServiceRequest = {
  id: string;
  residentId?: string;
  residentID?: string;
  docType?: string;
  purpose?: string;
  status?: string;
};

type IncidentReport = {
  id: string;
  typeOfIncident?: string; // "Minor" | "Major"
  residentId?: string;
  caseNumber?: string;
  nature?: string;
  status?: string;
};

// Render helpers
const join = (parts: Array<string | undefined>) => parts.filter(Boolean).join(" ");

// Give the UI time to paint before pushing big messages
const INTRO_DELAY_MS = 700;
const PUSH_DELAY_MS = 250;

export default function Chatbot({ user: userProp }: { user?: { uid?: string } }) {
  const { user: authUser, loading } = useAuth();
  const effectiveUser = userProp?.uid ? userProp : authUser ?? undefined;

  const [botOpen, setBotOpen] = useState(false);
  const [botInput, setBotInput] = useState("");
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [botTyping, setBotTyping] = useState(false);

  const [residentId, setResidentId] = useState<string | null>(null);
  const [residentDoc, setResidentDoc] = useState<ResidentDoc | null>(null);

  const [programsJoined, setProgramsJoined] = useState<
    Array<{ id: string; programId: string; programName: string; role: string; progressStatus: string }>
  >([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [minorIncidents, setMinorIncidents] = useState<IncidentReport[]>([]);

  const [summaryLoaded, setSummaryLoaded] = useState(false);
  const [introPushed, setIntroPushed] = useState(false);

  const sessionId =
    (effectiveUser?.uid ?? "") ||
    ("guest-" +
      (typeof window !== "undefined"
        ? window.navigator.userAgent.replace(/\W+/g, "").slice(0, 16)
        : "web"));

  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chat, botTyping]);

  function pushMsg(role: "user" | "bot", text: string) {
    setChat((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), role, text, ts: Date.now() },
    ]);
  }

  // ---- Load ResidentUsers doc to get canonical residentId + status ----
  useEffect(() => {
    (async () => {
      if (!effectiveUser?.uid) {
        setResidentId(null);
        setResidentDoc(null);
        return;
      }
      try {
        const ref = doc(db, "ResidentUsers", effectiveUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const raw = snap.data() as any;
          const { id: _ignore, ...rest } = raw; // avoid TS2783
          const data = rest as ResidentDoc;
          setResidentDoc(data);
          setResidentId(data?.residentId ?? effectiveUser.uid); // fallback to auth uid
        } else {
          setResidentId(effectiveUser.uid);
        }
      } catch {
        setResidentId(effectiveUser.uid);
      }
    })();
  }, [effectiveUser?.uid]);

  const isVerifiedUser = !!effectiveUser?.uid && residentDoc?.status === "Verified";

  // ---- Firestore fetchers ----
  async function fetchProgramsForResident(rid: string) {
    // 1) Participants where residentId === rid
    const ppQ = query(
      collection(db, "ProgramsParticipants"),
      where("residentId", "==", rid),
      qLimit(25)
    );
    const ppSnap = await getDocs(ppQ);
    const participants = ppSnap.docs.map((d) => {
      const { id: _ignore, ...rest } = d.data() as any;
      return { id: d.id, ...rest } as ProgramsParticipant;
    });

    if (participants.length === 0) return [];

    // 2) Fetch Programs to resolve name + progressStatus
    const ids = Array.from(new Set(participants.map((p) => p.programId).filter(Boolean))) as string[];
    const programMap = new Map<string, ProgramDoc>();
    await Promise.all(
      ids.map(async (pid) => {
        const psnap = await getDoc(doc(db, "Programs", pid));
        if (psnap.exists()) {
          const raw = psnap.data() as any;
          const { id: _i, ...rest } = raw;
          programMap.set(pid, (rest as ProgramDoc) || {});
        }
      })
    );

    // 3) Join
    const rows = participants.map((p) => {
      const prog = programMap.get(p.programId || "") || {};
      return {
        id: p.id,
        programId: p.programId || "",
        programName: prog.programName || "(Unnamed Program)",
        role: p.role || "Participant",
        progressStatus: prog.progressStatus || "—",
      };
    });

    return rows;
  }

  async function fetchServiceRequestsForResident(rid: string) {
    const results: ServiceRequest[] = [];

    try {
      const q1 = query(
        collection(db, "ServiceRequests"),
        where("residentId", "==", rid),
        qLimit(25)
      );
      const s1 = await getDocs(q1);
      results.push(
        ...s1.docs.map((d) => {
          const { id: _ignore, ...rest } = d.data() as any;
          return { id: d.id, ...rest } as ServiceRequest;
        })
      );
    } catch {}

    // Optional fallback if some docs used residentID
    try {
      const q2 = query(
        collection(db, "ServiceRequests"),
        where("residentID", "==", rid),
        qLimit(25)
      );
      const s2 = await getDocs(q2);
      results.push(
        ...s2.docs.map((d) => {
          const { id: _ignore, ...rest } = d.data() as any;
          return { id: d.id, ...rest } as ServiceRequest;
        })
      );
    } catch {}

    // De-dupe by id
    const dedup = Array.from(new Map(results.map((r) => [r.id, r])).values());
    return dedup;
  }

  async function fetchMinorIncidentsForResident(rid: string) {
    // Filter by Minor + residentId equals
    const qInc = query(
      collection(db, "IncidentReports"),
      where("typeOfIncident", "==", "Minor"),
      where("residentId", "==", rid),
      qLimit(25)
    );
    const snap = await getDocs(qInc);
    return snap.docs.map((d) => {
      const { id: _ignore, ...rest } = d.data() as any;
      return { id: d.id, ...rest } as IncidentReport;
    });
  }

  // ---- Pull personalized summary when bot opens (only if Verified) ----
  useEffect(() => {
    (async () => {
      if (!botOpen || summaryLoaded || !residentId || !isVerifiedUser) return;
      try {
        const [p, s, i] = await Promise.all([
          fetchProgramsForResident(residentId),
          fetchServiceRequestsForResident(residentId),
          fetchMinorIncidentsForResident(residentId),
        ]);
        setProgramsJoined(p);
        setServiceRequests(s);
        setMinorIncidents(i);
      } finally {
        setSummaryLoaded(true);
      }
    })();
  }, [botOpen, residentId, summaryLoaded, isVerifiedUser]);

  // ---- Personalized greeting with counts & previews (Markdown links) ----
  function buildIntro() {
    const name = join([residentDoc?.first_name, residentDoc?.last_name]) || "there";
    const pCount = programsJoined.length;
    const sCount = serviceRequests.length;
    const iCount = minorIncidents.length;

    const lines: string[] = [];
    lines.push(`Hi ${name}! I can help with **Services**, **Programs**, **News**, and **Tracking**.`);

    // Summary line
    const bits = [];
    bits.push(`**Programs:** ${pCount}`);
    bits.push(`**Requests:** ${sCount}`);
    bits.push(`**Minor Incidents:** ${iCount}`);
    lines.push(bits.join(" • "));

    // Short previews (up to 3)
    if (pCount > 0) {
      const top = programsJoined.slice(0, 3).map((r) => `- ${r.programName}: Role: ${r.role} - ${r.progressStatus}`);
      lines.push(`\n**Your Programs**\n${top.join("\n")}`);
    }
    if (sCount > 0) {
      const top = serviceRequests.slice(0, 3).map((r) => {
        const label = `${r.docType ?? ""} ${r.purpose ?? ""}`.trim() || "Request";
        const url = `/ResidentAccount/Transactions/TransactionRouter?id=${r.id}&type=ServiceRequest`;
        return `- ${label}: ${r.status ?? "—"}  \n  [See Service Transaction](${url})`;
      });
      lines.push(`\n**Your Document Requests**\n${top.join("\n")}`);
    }
    if (iCount > 0) {
      const top = minorIncidents.slice(0, 3).map((r) => {
        const label = `${r.caseNumber ?? r.id}: ${r.nature ?? "Incident"} - ${r.status ?? "—"}`;
        const url = `/ResidentAccount/Transactions/TransactionRouter?id=${r.id}&type=IncidentReport`;
        return `- ${label}  \n  [See Incident Report](${url})`;
      });
      lines.push(`\n**Your Minor Incidents**\n${top.join("\n")}`);
    }

    // Helpful nav links
    lines.push(
      `\nQuick links: [Services](/services) • [File an Incident](/IncidentReport) • [Programs](/Programs) • [Announcements](/Announcements)`
    );

    return lines.join("\n\n");
  }

  // Schedule helper to allow paint before pushing text
  const introTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (introTimerRef.current) {
        window.clearTimeout(introTimerRef.current);
        introTimerRef.current = null;
      }
    };
  }, []);

  // Push greeting
  useEffect(() => {
    if (!botOpen) return;
    if (introPushed) return;

    // If not logged in or not Verified → generic greeting only
    if (!isVerifiedUser) {
      if (chat.length === 0) {
        window.setTimeout(() => {
          pushMsg(
            "bot",
            "Hi! I can help with **Services** (request documents, file incidents), **Programs**, **News**, and **Tracking**.\n\nTry: [Services](/services), [File an Incident](/IncidentReport), [Programs](/Programs), [Announcements](/Announcements).\n\nLog in with a **Verified** account for a personalized summary."
          );
          setIntroPushed(true);
        }, INTRO_DELAY_MS);
      }
      return;
    }

    // Verified user: wait for summary then greet
    if (summaryLoaded) {
      introTimerRef.current = window.setTimeout(() => {
        pushMsg("bot", buildIntro());
        setIntroPushed(true);
      }, INTRO_DELAY_MS);
    }
  }, [botOpen, summaryLoaded, introPushed, isVerifiedUser, chat.length]);

  async function sendToBot(message: string) {
    if (!message.trim()) return;
    pushMsg("user", message);
    setBotInput("");
    setBotTyping(true);
    try {
      const res = await fetch("/api/dialogflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message, sessionId }),
      });
      const data = await res.json();

      let reply =
        data?.queryResult?.responseMessages?.find((m: any) => m.text)?.text?.text?.[0] ??
        data?.queryResult?.text ??
        data?.error ??
        "No response.";

      if (typeof reply !== "string") reply = JSON.stringify(reply, null, 2);
      // small delay so UI stays smooth
      window.setTimeout(() => pushMsg("bot", reply), PUSH_DELAY_MS);
    } catch (e: any) {
      window.setTimeout(() => pushMsg("bot", "⚠️ " + (e?.message ?? "Network error")), PUSH_DELAY_MS);
    } finally {
      setBotTyping(false);
    }
  }

  // ---- Markdown helpers (typed as any to avoid React type incompatibilities) ----
  const MdLink: any = (props: { href?: string; children?: any }) => {
    const href = props.href || "#";
    const isInternal = href.startsWith("/");
    if (isInternal) {
      return (
        <Link href={href} className="chat-link">
          {props.children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="chat-link">
        {props.children}
      </a>
    );
  };

  const MD: any = ReactMarkdown as any;

  function BotBubble({ text }: { text: string }) {
    return (
      <div className="bubble">
        {/* @ts-ignore – relax types for components map */}
        <MD
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
          components={{
            a: MdLink,
            p: (props: any) => <p className="bubble-p">{props.children}</p>,
            strong: (props: any) => <strong className="bubble-strong">{props.children}</strong>,
          }}
        >
          {text}
        </MD>
      </div>
    );
  }

  // Dynamic quick chips (ONLY if Verified), with Markdown links
  const dynamicChips = useMemo(() => {
    if (!isVerifiedUser || !summaryLoaded) return [];
    const chips: Array<{ label: string; onClick: () => void }> = [];

    chips.push({
      label: `My Programs (${programsJoined.length})`,
      onClick: () => {
        const body =
          programsJoined.length === 0
            ? "You have no enrolled programs yet."
            : programsJoined
                .map((r) => `• ${r.programName}: Role: ${r.role} - ${r.progressStatus}`)
                .join("\n");
        window.setTimeout(() => pushMsg("bot", `**Your Programs**\n\n${body}`), PUSH_DELAY_MS);
      },
    });

    chips.push({
      label: `My Requests (${serviceRequests.length})`,
      onClick: () => {
        const body =
          serviceRequests.length === 0
            ? "You have no document/service requests yet."
            : serviceRequests
                .map((r) => {
                  const label = `${r.docType ?? ""} ${r.purpose ?? ""}`.trim() || "Request";
                  const url = `/ResidentAccount/Transactions/TransactionRouter?id=${r.id}&type=ServiceRequest`;
                  return `• ${label}: ${r.status ?? "—"}\n  [See Service Transaction](${url})`;
                })
                .join("\n");
        window.setTimeout(() => pushMsg("bot", `**Your Document Requests**\n\n${body}`), PUSH_DELAY_MS);
      },
    });

    chips.push({
      label: `My Incidents (${minorIncidents.length})`,
      onClick: () => {
        const body =
          minorIncidents.length === 0
            ? "You have no **Minor** incidents on record."
            : minorIncidents
                .map((r) => {
                  const label = `${r.caseNumber ?? r.id}: ${r.nature ?? "Incident"} - ${r.status ?? "—"}`;
                  const url = `/ResidentAccount/Transactions/TransactionRouter?id=${r.id}&type=IncidentReport`;
                  return `• ${label}\n  [See Incident Report](${url})`;
                })
                .join("\n");
        window.setTimeout(() => pushMsg("bot", `**Your Minor Incidents**\n\n${body}`), PUSH_DELAY_MS);
      },
    });

    return chips;
  }, [isVerifiedUser, summaryLoaded, programsJoined, serviceRequests, minorIncidents]);

  return (
    <>
      <div className="chatbot-container">
        <button onClick={() => setBotOpen((v) => !v)} className="chatbot-btn" aria-label="Open chat">
          💬
        </button>

        {botOpen && (
          <div className="bot-messenger">
            <div className="chat-header">
              <div>
                Barangay Assistant
                <div className="sublabel">Dialogflow CX</div>
              </div>
              <div className="mini-btn-container">
                <button className="mini-btn" onClick={() => setBotOpen(false)} aria-label="Close chat">
                  ✕
                </button>
              </div>
            </div>

            <div ref={chatBodyRef} className="chat-body">
              {chat.map((m) => (
                <div key={m.id} className={`chat-row ${m.role}`}>
                  {m.role === "bot" && <div className="chat-avatar">B</div>}
                  <div>
                    {m.role === "bot" ? (
                      <BotBubble text={m.text} />
                    ) : (
                      <div className="bubble">{m.text}</div>
                    )}
                    <div className="msg-time">
                      {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}

              {botTyping && <div className="chat-typing">Assistant is typing…</div>}

              <div className="quick-chips">
                {/* public chips */}
                {["hello", "Services", "Request Document", "File an Incident", "Programs", "Announcements"].map((q) => (
                  <button key={q} className="quick-chip" onClick={() => sendToBot(q)}>
                    {q}
                  </button>
                ))}

                {/* personalized chips (only if Verified) */}
                {dynamicChips.map((c) => (
                  <button key={c.label} className="quick-chip" onClick={c.onClick}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="chat-footer">
              <div className="chat-inputwrap">
                <input
                  className="chat-input"
                  value={botInput}
                  onChange={(e) => setBotInput(e.target.value)}
                  placeholder="Message Barangay Assistant"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendToBot(botInput);
                  }}
                />
                <button className="chat-send" onClick={() => sendToBot(botInput)}>
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
