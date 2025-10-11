import React from "react";
import "@/CSS/ReportsModule/reports.css";
import { MonthYearRangePicker } from "./MonthYearRangePicker";

interface MonthYearModalProps {
  show: boolean;
  onClose: () => void;
  onGenerate: (
    startMonth: number,
    startYear: number,
    endMonth: number,
    endYear: number,
    allTime?: boolean
  ) => void;
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

  const handleSubmit = () => {
    onGenerate(range.startMonth, range.startYear, range.endMonth, range.endYear, allTime);
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
