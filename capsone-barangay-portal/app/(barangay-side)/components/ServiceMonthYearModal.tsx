import React from "react";
import "@/CSS/ReportsModule/reports.css";

interface ServiceMonthYearModalProps {
  show: boolean;
  onClose: () => void;
  onGenerate: (
    month: number,
    year: number,
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
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [month, setMonth] = React.useState(currentMonth);
  const [year, setYear] = React.useState(currentYear);
  const [allTime, setAllTime] = React.useState(false);
  const [docType, setDocType] = React.useState<string>("All");
  const [status, setStatus] = React.useState<string>("All");

  const handleSubmit = () => {
    onGenerate(month, year, allTime, docType, status);
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
            onChange={() => setAllTime((prev) => !prev)}
          />
          Include All Time Data (Ignore Month and Year)
        </label>

        <label>Month:</label>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          disabled={allTime}
        >
          {Array.from({ length: 12 }, (_, i) => {
            const isFuture = year > currentYear || (year === currentYear && i > currentMonth);
            return (
              <option key={i} value={i} disabled={isFuture}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            );
          })}
        </select>

        <label>Year:</label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          disabled={allTime}
        >
          {Array.from({ length: 6 }, (_, i) => {
            const y = currentYear - i; // never goes into the future
            return (
              <option key={y} value={y}>
                {y}
              </option>
            );
          })}
        </select>

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
