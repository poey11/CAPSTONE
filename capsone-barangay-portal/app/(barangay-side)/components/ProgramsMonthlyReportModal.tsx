import React, { useMemo, useState } from "react";
import { MonthYearRangePicker } from "../components/MonthYearRangePicker";
import "@/CSS/ReportsModule/reports.css";

type Range = {
  startMonth: number; // 0–11
  startYear: number;
  endMonth: number;   // 0–11
  endYear: number;
};

type ApprovalStatus = "All" | "Pending" | "Approved" | "Rejected";
type ProgressStatus = "All" | "Upcoming" | "Ongoing" | "Completed";

interface ProgramsMonthlyReportModalProps {
  open: boolean;
  onClose: () => void;
  range: Range;
  onRangeChange: (next: Range) => void;

  approvalStatus: ApprovalStatus;
  onApprovalStatusChange: (next: ApprovalStatus) => void;

  progressStatus: ProgressStatus;
  onProgressStatusChange: (next: ProgressStatus) => void;

  loading?: boolean;
  onGenerate: (args: {
    startMonth: number;
    startYear: number;
    endMonth: number;
    endYear: number;
    allTime: boolean;
    approvalStatus: ApprovalStatus;
    progressStatus: ProgressStatus;
  }) => void;
}

export const ProgramsMonthlyReportModal: React.FC<ProgramsMonthlyReportModalProps> = ({
  open,
  onClose,
  range,
  onRangeChange,
  approvalStatus,
  onApprovalStatusChange,
  progressStatus,
  onProgressStatusChange,
  loading = false,
  onGenerate,
}) => {
  const [allTime, setAllTime] = useState(false);
  const isRejected = useMemo(() => approvalStatus === "Rejected", [approvalStatus]);

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Monthly Programs Report</h3>

        {/* All Time Toggle */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={allTime}
              onChange={(e) => setAllTime(e.target.checked)}
              disabled={loading}
            />
            <span>All Time</span>
          </label>
          <p className="hint">When enabled, all date filters will be ignored.</p>
        </div>

        {/* Month & Year Range */}
        <label className="block-label">Month &amp; Year Range:</label>
        <div style={{ marginBottom: "1rem" }}>
          <MonthYearRangePicker
            value={range}
            onChange={onRangeChange}
            disabled={loading || allTime}
          />
        </div>

        {/* Approval Status */}
        <label htmlFor="approval-status">Approval Status:</label>
        <select
          id="approval-status"
          value={approvalStatus}
          onChange={(e) => onApprovalStatusChange(e.target.value as ApprovalStatus)}
          disabled={loading}
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <p className="hint">
          If set to <strong>Rejected</strong>, progress status will be ignored.
        </p>

        {/* Progress Status */}
        <label htmlFor="progress-status">Progress Status:</label>
        <select
          id="progress-status"
          value={progressStatus}
          onChange={(e) => onProgressStatusChange(e.target.value as ProgressStatus)}
          disabled={loading || isRejected}
          title={isRejected ? "Disabled when approval is Rejected" : "Filter by progress status"}
        >
          <option value="All">All</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
        </select>
        {isRejected && <p className="hint">Progress status disabled for Rejected approvals.</p>}

        {/* Buttons */}
        <div className="modal-actions">
          <button
            onClick={() =>
              onGenerate({
                startMonth: range.startMonth,
                startYear: range.startYear,
                endMonth: range.endMonth,
                endYear: range.endYear,
                allTime,
                approvalStatus,
                progressStatus,
              })
            }
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate PDF"}
          </button>
          <button onClick={onClose} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
