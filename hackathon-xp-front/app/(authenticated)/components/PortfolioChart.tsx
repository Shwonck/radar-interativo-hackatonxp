import { chart } from "@/lib/mock-data";

export function PortfolioChart({ period }: { period: string }) {
  const values = chart[period];
  // O SVG usa coordenadas de 0 a 100; valores maiores ficam mais altos no gráfico.
  const points = values
    .map((v, index) => `${(index / (values.length - 1)) * 100},${92 - v}`)
    .join(" ");
  return (
    <div
      className="chart-wrap"
      aria-label={`Evolução do patrimônio nos últimos ${period}`}
      role="img"
    >
      <div className="chart-guides">
        <span>R$ 50 mi</span>
        <span>R$ 45 mi</span>
        <span>R$ 40 mi</span>
        <span>R$ 35 mi</span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="growth-chart">
        <defs>
          <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f8d44a" stopOpacity=".27" />
            <stop offset="100%" stopColor="#f8d44a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,100 ${points} 100,100`} fill="url(#chartFill)" />
        <polyline
          points={points}
          fill="none"
          stroke="#e9b920"
          strokeWidth="1.05"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="100" cy={92 - values[values.length - 1]} r="1.15" fill="#e9b920" />
      </svg>
      <div className="chart-months">
        <span>Início</span>
        <span>Período selecionado</span>
        <span>Hoje</span>
      </div>
    </div>
  );
}
