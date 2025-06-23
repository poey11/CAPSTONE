import React from "react";
import "@/CSS/ReportsModule/reports.css";

interface MonthYearModalProps {
  show: boolean;
  onClose: () => void;
  onGenerate: (month: number, year: number, allTime?: boolean) => void;
  loading?: boolean;
  title?: string;
}

export const MonthYearModal: React.FC<MonthYearModalProps> = ({
  show,
  onClose,
  onGenerate,
  loading = false,
  title = "Generate Monthly Report",
}) => {
  const [month, setMonth] = React.useState(new Date().getMonth());
  const [year, setYear] = React.useState(new Date().getFullYear());
  const [allTime, setAllTime] = React.useState(false);

  const handleSubmit = () => {
    onGenerate(month, year, allTime);
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
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

        <label>Year:</label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          disabled={allTime}
        >
          {Array.from({ length: 6 }, (_, i) => {
            const y = new Date().getFullYear() - i;
            return (
              <option key={y} value={y}>
                {y}
              </option>
            );
          })}
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
