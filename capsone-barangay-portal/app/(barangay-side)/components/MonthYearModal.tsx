import React from "react";
import "@/CSS/ReportsModule/reports.css";

interface MonthYearModalProps {
  show: boolean;
  onClose: () => void;
  onGenerate: (month: number, year: number) => void;
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

  const handleSubmit = () => {
    onGenerate(month, year);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>{title}</h3>

        <label>Month:</label>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

        <label>Year:</label>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
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
