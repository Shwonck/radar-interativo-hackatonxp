import { ArrowUpRight, Wallet } from "lucide-react";

export function Metric({
  icon: Icon,
  label,
  value,
  detail,
  trend,
  progress,
  action,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  detail: string;
  trend?: string;
  progress?: number;
  action?: () => void;
}) {
  const content = (
    <>
      <div className="metric-top">
        <span className="metric-icon">
          <Icon size={20} strokeWidth={1.8} />
        </span>
        <ArrowUpRight size={17} className="metric-arrow" />
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-bottom">
        <span>{detail}</span>
        {trend && <b>{trend}</b>}
      </div>
      {progress && (
        <div className="metric-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
    </>
  );
  return action ? (
    <button className="metric-card metric-clickable" onClick={action}>
      {content}
    </button>
  ) : (
    <div className="metric-card">{content}</div>
  );
}
