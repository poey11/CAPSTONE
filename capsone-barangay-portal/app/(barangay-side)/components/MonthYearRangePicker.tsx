import React from "react";

type Range = {
  startMonth: number; // 0-11
  startYear: number;
  endMonth: number;   // 0-11
  endYear: number;
};

interface MonthYearRangePickerProps {
  value: Range;
  onChange: (next: Range) => void;
  disabled?: boolean;
  yearWindow?: number; // how many years back to show (default 6)
}

export const MonthYearRangePicker: React.FC<MonthYearRangePickerProps> = ({
  value,
  onChange,
  disabled = false,
  yearWindow = 6,
}) => {
  const now = new Date();
  const CUR_M = now.getMonth();
  const CUR_Y = now.getFullYear();

  const clampToCurrent = (y: number, m: number): [number, number] => {
    if (y > CUR_Y) return [CUR_Y, CUR_M];
    if (y === CUR_Y && m > CUR_M) return [y, CUR_M];
    return [y, m];
  };

  const normalizeRange = (r: Range): Range => {
    // clamp end to current
    let [ey, em] = clampToCurrent(r.endYear, r.endMonth);

    // ensure start <= end (in month-year terms)
    const startIndex = r.startYear * 12 + r.startMonth;
    const endIndex = ey * 12 + em;

    if (startIndex > endIndex) {
      // move start to end
      return { startMonth: em, startYear: ey, endMonth: em, endYear: ey };
    }

    // also clamp start to current if somehow beyond
    let [sy, sm] = clampToCurrent(r.startYear, r.startMonth);

    // if clamping start pushed it after end, sync end to start
    const newStartIdx = sy * 12 + sm;
    if (newStartIdx > endIndex) {
      return { startMonth: sm, startYear: sy, endMonth: sm, endYear: sy };
    }

    return { startMonth: sm, startYear: sy, endMonth: em, endYear: ey };
  };

  const monthName = (i: number) =>
    new Date(0, i).toLocaleString("default", { month: "long" });

  const years = Array.from({ length: yearWindow }, (_, i) => CUR_Y - i);

  const handleStartYear = (y: number) => {
    onChange(normalizeRange({ ...value, startYear: y }));
  };
  const handleStartMonth = (m: number) => {
    onChange(normalizeRange({ ...value, startMonth: m }));
  };
  const handleEndYear = (y: number) => {
    onChange(normalizeRange({ ...value, endYear: y }));
  };
  const handleEndMonth = (m: number) => {
    onChange(normalizeRange({ ...value, endMonth: m }));
  };

  const isMonthDisabled = (y: number, m: number) =>
    y > CUR_Y || (y === CUR_Y && m > CUR_M);

  return (
    <div className="myr-grid">
      {/* Start */}
      <div className="myr-field">
        <label>Start Month:</label>
        <select
          value={value.startMonth}
          onChange={(e) => handleStartMonth(Number(e.target.value))}
          disabled={disabled}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>
              {monthName(i)}
            </option>
          ))}
        </select>
      </div>
      <div className="myr-field">
        <label>Start Year:</label>
        <select
          value={value.startYear}
          onChange={(e) => handleStartYear(Number(e.target.value))}
          disabled={disabled}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* End */}
      <div className="myr-field">
        <label>End Month:</label>
        <select
          value={value.endMonth}
          onChange={(e) => handleEndMonth(Number(e.target.value))}
          disabled={disabled}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i} disabled={isMonthDisabled(value.endYear, i)}>
              {monthName(i)}
            </option>
          ))}
        </select>
      </div>
      <div className="myr-field">
        <label>End Year:</label>
        <select
          value={value.endYear}
          onChange={(e) => handleEndYear(Number(e.target.value))}
          disabled={disabled}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
