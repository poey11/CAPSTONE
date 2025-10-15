"use client";
import { useEffect, useMemo, useState } from "react";
import type { Firestore } from "firebase/firestore";
import { fetchApprovedPrograms } from "@/app/(barangay-side)/dashboard/ReportsModule/logic/programsReports";
import "@/CSS/ReportsModule/reports.css";

type ProgramPick = {
  id: string;
  programName: string;
  startDate?: string;
  endDate?: string;
  progressStatus?: string;
};

export default function ProgramsParticipationReportModal({
  open,
  onClose,
  db,
  loading,
  onGenerate,
}: {
  open: boolean;
  onClose: () => void;
  db: Firestore;
  loading?: boolean;
  onGenerate: (args: { programId: string }) => void;
}) {
  const [programs, setPrograms] = useState<ProgramPick[]>([]);
  const [selected, setSelected] = useState<ProgramPick | null>(null);
  const [query, setQuery] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setQuery("");
    setPrograms([]);
    setError("");
    setLoadingList(true);

    (async () => {
      try {
        const list = await fetchApprovedPrograms(db);
        setPrograms(list);
      } catch {
        setError("Failed to load programs.");
      } finally {
        setLoadingList(false);
      }
    })();
  }, [open, db]);

  const labelFor = (p: ProgramPick) => {
    const s = p.startDate || "";
    const e = p.endDate || "";
    const datePart =
      s && e ? `(${s} - ${e})` : s ? `(${s})` : e ? `(${e})` : "";
    const statusPart = p.progressStatus ? ` (${p.progressStatus})` : "";
    return `${p.programName}${datePart ? ` ${datePart}` : ""}${statusPart}`;
  };

  // Map labels to programs for quick lookup (handles exact selection from datalist)
  const labelMap = useMemo(() => {
    const m = new Map<string, ProgramPick>();
    for (const p of programs) {
      const label = labelFor(p);
      // If duplicate labels exist, last one wins (rare; recommend unique names/dates)
      m.set(label, p);
    }
    return m;
  }, [programs]);

  const onInputChange = (val: string) => {
    setQuery(val);
    const picked = labelMap.get(val.trim());
    setSelected(picked ?? null);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box-program-participant" role="dialog" aria-modal="true" aria-labelledby="program-report-title">
        <h3 id="program-report-title">Program Participation Report</h3>

        {/* Single combined search + dropdown (native combobox) */}
        <label htmlFor="program-combobox" className="block-label">
          Program (type to filter):
        </label>
        <input
          id="program-combobox"
          className="form-input"
          type="text"
          list="programs-list"
          placeholder="e.g. Community Clean-Up (2025-03-01 - 2025-03-07) (Completed)"
          value={query}
          onChange={(e) => onInputChange(e.target.value)}
          disabled={loadingList}
          autoComplete="off"
        />
        <datalist id="programs-list">
          {programs.map((p) => (
            <option key={p.id} value={labelFor(p)} />
          ))}
        </datalist>

        {loadingList && <div className="hint">Loading programs…</div>}
        {error && <div className="hint error">{error}</div>}
        {(!loadingList && !error && programs.length === 0) && (
          <div className="hint">No Approved programs found.</div>
        )}
        {selected && (
          <div className="hint">
            Selected: <strong>{labelFor(selected)}</strong>
          </div>
        )}

        <div className="modal-actions">
          <button
            className="btn-secondary"
            onClick={() => selected && onGenerate({ programId: selected.id })}
            disabled={!selected || !!loading || loadingList}
          >
            {loading ? "Generating…" : "Generate PDF"}
          </button>
          <button onClick={onClose} disabled={loading}>Cancel</button>

        </div>
      </div>
    </div>
  );
}
