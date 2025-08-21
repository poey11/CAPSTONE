"use client";
import "@/CSS/Programs/Programs.css";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/app/db/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

type Program = {
  id: string;
  programName: string;
  summary: string;
  description: string;
  eventType?: "single" | "multiple";
  startDate?: string;     // "YYYY-MM-DD"
  endDate?: string;       // "YYYY-MM-DD"
  createdAt?: any;        // Firestore Timestamp (kept as any; we don't render it)
  location: string;
  approvalStatus: string;
  activeStatus: string;
  progressStatus: string;
  participants: number;
  photoURL?: string | null;
  photoURLs?: string[];
};

/* ---- helpers ---- */
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function formatYMDToLong(ymd?: string): string {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd || "";
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function buildDateLabel(p: Program): string {
  const s = p.startDate || "";
  const e = p.endDate || "";

  const startLong = formatYMDToLong(s);
  const endLong   = formatYMDToLong(e);

  const sameDay = s && e && s === e;

  // Single-day or missing end date → just one date
  if (p.eventType === "single" || !e || sameDay) {
    return startLong || e ? startLong || endLong : "";
  }

  // Multi-day → range
  return `${startLong} - ${endLong}`;
}

export default function Programs() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const q = query(
          collection(db, "Programs"),
          where("approvalStatus", "==", "Approved"),
          where("activeStatus", "==", "Active"),
          orderBy("startDate", "asc"),
          orderBy("createdAt", "asc")
        );

        const snap = await getDocs(q);
        const data: Program[] = snap.docs.map((docu) => {
          const d = docu.data() as any;
          return {
            id: docu.id,
            programName: d.programName || "",
            summary: d.summary || "",
            description: d.description || "",
            eventType: d.eventType || "single",
            startDate: d.startDate || "",
            endDate: d.endDate || "",
            createdAt: d.createdAt ?? null,
            location: d.location || "",
            approvalStatus: d.approvalStatus || "",
            activeStatus: d.activeStatus || "",
            progressStatus: d.progressStatus || "",
            participants: Number(d.participants || 0),
            photoURL: d.photoURL || (Array.isArray(d.photoURLs) && d.photoURLs.length ? d.photoURLs[0] : null),
            photoURLs: d.photoURLs || [],
          } as Program;
        });

        setPrograms(data);
      } catch (err) {
        console.error("Error fetching programs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  if (loading) {
    return <p className="loading-text">Loading programs...</p>;
  }

  return (
    <main className="main-container-programs">
      <div className="headerpic-programs">
        <p>PROGRAMS</p>
      </div>

      <div className="programs-header">
        <h1 className="programs-title">Programs Offered by the Barangay</h1>
        <div className="programs-underline"></div>
      </div>

      <section className="programs-section-programs">
        {programs.length === 0 ? (
          <p className="no-programs-text">No available programs right now.</p>
        ) : (
          programs.map((program) => {
            const dateLabel = buildDateLabel(program);
            const cover = program.photoURL || (program.photoURLs?.[0] ?? undefined);
            return (
              <Link
                key={program.id}
                href={`/Programs/${program.id}`}
                className="programs-card-link"
              >
                <div className="programs-card-programs">
                  <h2 className="programs-title-programs">{program.programName}</h2>

                  {cover && (
                    <img
                      src={cover}
                      alt={program.programName}
                      className="programs-image-programs"
                    />
                  )}

                  <p className="programs-date-programs">{dateLabel}</p>

                  <p className="programs-desc-programs">{program.summary}</p>

                  <div className="programs-card-footer">
                    <span className="read-more-link">Click to Read More</span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </section>
    </main>
  );
}
