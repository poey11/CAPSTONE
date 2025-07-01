
const LegendColorBox = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1">
    <div
      style={{ backgroundColor: color }}
      className="w-4 h-4 rounded-sm border border-black"
    />
    <span>{label}</span>
  </div>
);
export default LegendColorBox;