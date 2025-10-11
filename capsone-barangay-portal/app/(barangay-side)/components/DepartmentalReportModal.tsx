import React from "react";
import "@/CSS/ReportsModule/reports.css";
import { MonthYearRangePicker } from "./MonthYearRangePicker";

interface DepartmentalReportModalProps {
  show: boolean;
  onClose: () => void;
  onGenerate: (
    startMonth: number,
    startYear: number,
    endMonth: number,
    endYear: number,
    allTime: boolean,
    department: string,
    status: string
  ) => void;
  loading?: boolean;
  title?: string;
  allowedDepartments: string[];
}

export const DepartmentalReportModal: React.FC<DepartmentalReportModalProps> = ({
  show,
  onClose,
  onGenerate,
  loading = false,
  title = "Generate Departmental Incident Report",
  allowedDepartments,
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
  const [department, setDepartment] = React.useState<string>(allowedDepartments[0] || "ALL");
  const [status, setStatus] = React.useState<string>("ALL");

  const handleSubmit = () => {
    onGenerate(
      range.startMonth,
      range.startYear,
      range.endMonth,
      range.endYear,
      allTime,
      department,
      status
    );
    onClose();
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

        <label>Department:</label>
        <select value={department} onChange={(e) => setDepartment(e.target.value)}>
          {allowedDepartments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <label>Status:</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">ALL</option>
          <option value="pending">Pending</option>
          <option value="settled">Settled</option>
          <option value="archived">Archived</option>
          <option value="In - Progress">In - Progress</option>
          <option value="CFA">CFA</option>
          <option value="Refer to Government Agency">Refer to Government Agency</option>
          <option value="Dismissed">Dismissed</option>
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
