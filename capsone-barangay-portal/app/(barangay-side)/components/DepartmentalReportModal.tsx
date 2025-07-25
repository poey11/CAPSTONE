import React from "react";
import "@/CSS/ReportsModule/reports.css";

interface DepartmentalReportModalProps {
  show: boolean;
  onClose: () => void;
  onGenerate: (
    month: number,
    year: number,
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
  const [month, setMonth] = React.useState(new Date().getMonth());
  const [year, setYear] = React.useState(new Date().getFullYear());
  const [allTime, setAllTime] = React.useState(false);
  const [department, setDepartment] = React.useState<string>(allowedDepartments[0] || "ALL");
  const [status, setStatus] = React.useState<string>("ALL");

  const handleSubmit = () => {
    onGenerate(month, year, allTime, department, status);
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

        <label>Department:</label>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          {allowedDepartments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <label>Status:</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ALL">ALL</option>
          <option value="pending">Pending</option>
          <option value="settled">Settled</option>
          <option value="archived">Archived</option>
          <option value="In - Progress">In - Progress</option>
          <option value="CFA">CFA</option>
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
