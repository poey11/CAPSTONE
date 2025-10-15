import React from "react";
import "@/CSS/ReportsModule/reports.css";
import { MonthYearRangePicker } from "./MonthYearRangePicker";

interface ServiceMonthYearModalProps {
  show: boolean;
  onClose: () => void;
  onGenerate: (
    startMonth: number,
    startYear: number,
    endMonth: number,
    endYear: number,
    allTime?: boolean,
    docType?: string,
    status?: string
  ) => void;
  loading?: boolean;
  title?: string;
}

export const ServiceMonthYearModal: React.FC<ServiceMonthYearModalProps> = ({
  show,
  onClose,
  onGenerate,
  loading = false,
  title = "Generate Service Report",
}) => {
  const now = new Date();
  const CUR_M = now.getMonth();
  const CUR_Y = now.getFullYear();

  const [range, setRange] = React.useState({
    startMonth: CUR_M,
    startYear: CUR_Y,
    endMonth: CUR_M,
    endYear: CUR_Y,
  });

  const [allTime, setAllTime] = React.useState(false);
  const [docType, setDocType] = React.useState<string>("All");
  const [status, setStatus] = React.useState<string>("All");

  const handleSubmit = () => {
    onGenerate(
      range.startMonth,
      range.startYear,
      range.endMonth,
      range.endYear,
      allTime,
      docType,
      status
    );
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>{title}</h3>

        <label className="all-time-checkbox">
          <input
            type="checkbox"
            checked={allTime}
            onChange={() => setAllTime((v) => !v)}
          />
          Include All Time Data (Ignore Month/Year Range)
        </label>

        <MonthYearRangePicker value={range} onChange={setRange} disabled={allTime} />

        <label>Document Type:</label>
        <select value={docType} onChange={(e) => setDocType(e.target.value)}>
          <option value="All">All</option>
          <option value="Barangay Certificate">Barangay Certificate</option>
          <option value="Barangay Clearance">Barangay Clearance</option>
          <option value="Barangay Indigency">Barangay Indigency</option>
          <option value="Business Permit">Business Permit</option>
          <option value="Temporary Business Permit">Temporary Business Permit</option>
          <option value="Construction Permit">Construction Permit</option>
        </select>

        <label>Status:</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="In - Progress">In - Progress</option>
          <option value="Pick-up">Pick-up</option>
          <option value="Completed">Completed</option>
          <option value="Rejected">Rejected</option>
        </select>

        <div className="modal-actions">
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? "Generating..." : "Generate"}
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
