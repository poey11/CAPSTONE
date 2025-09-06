"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
// @ts-ignore – quiet incompatible React type signatures in some setups
import ReactMarkdown from "react-markdown";
// @ts-ignore
import remarkGfm from "remark-gfm";
// @ts-ignore
import rehypeSanitize from "rehype-sanitize";
import "@/CSS/Components/chatbot.css";

export default function Chatbot({ user }: { user?: { uid?: string } }) {
  type ChatMsg = { id: string; role: "user" | "bot"; text: string; ts: number };

  const [botOpen, setBotOpen] = useState(false);
  const [botInput, setBotInput] = useState("");
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [botTyping, setBotTyping] = useState(false);

  const sessionId =
    (user?.uid ?? "") ||
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

  useEffect(() => {
    if (botOpen && chat.length === 0) {
      pushMsg(
        "bot",
        "Hi! I can help with **Services** (request documents, file incidents), **Programs**, **News**, and **Tracking**.\n\nTry: [Services](/services), [File an Incident](/IncidentReport), [Programs](/Programs), [Announcements](/Announcements)."
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botOpen]);

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
        data?.queryResult?.responseMessages?.find((m: any) => m.text)?.text
          ?.text?.[0] ??
        data?.queryResult?.text ??
        data?.error ??
        "No response.";

      if (typeof reply !== "string") reply = JSON.stringify(reply, null, 2);
      pushMsg("bot", reply);
    } catch (e: any) {
      pushMsg("bot", "⚠️ " + (e?.message ?? "Network error"));
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
        <MD remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}
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
  // -----------------------------------------------------------------------------

  return (
    <>
      <div className="chatbot-container">
        <button onClick={() => setBotOpen((v) => !v)} className="chatbot-btn">
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
                <button className="mini-btn" onClick={() => setBotOpen(false)}>
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
                {["hello", "Services", "Request Document", "File an Incident", "Programs", "Announcements"].map((q) => (
                  <button key={q} className="quick-chip" onClick={() => sendToBot(q)}>
                    {q}
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
