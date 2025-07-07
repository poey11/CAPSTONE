import React from "react";
import "@/CSS/ReportsModule/reports.css";

interface NatureOfWorkModalProps {
  show: boolean;
  onClose: () => void;
  onGenerate: (natureOfWork: string) => void;
  loading?: boolean;
  title?: string;
  options: { key: string; value: string }[];
}

export const NatureOfWorkModal: React.FC<NatureOfWorkModalProps> = ({
  show,
  onClose,
  onGenerate,
  loading = false,
  title = "Generate Kasambahay Masterlist",
  options
}) => {
  const [selected, setSelected] = React.useState<string>("All");

  const handleSubmit = () => {
    onGenerate(selected);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>{title}</h3>

        <label htmlFor="nature-select">Nature of Work:</label>
        <select
          id="nature-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.value}
            </option>
          ))}
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
