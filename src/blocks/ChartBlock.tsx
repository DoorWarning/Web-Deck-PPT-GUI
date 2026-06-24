import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, RadialLinearScale,
  BarElement, LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import type { BlockDef, BlockRenderProps, BlockEditProps } from './types';

ChartJS.register(
  CategoryScale, LinearScale, RadialLinearScale,
  BarElement, LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler
);

interface ChartProps {
  chartType: 'bar' | 'line' | 'pie' | 'doughnut';
  labels: string[];
  data: number[];
  label: string;
  controllable: boolean;
  min: number;
  max: number;
}

const PALETTE = ['#7c5cff', '#36c5f0', '#2eb67d', '#ecb22e', '#e01e5a', '#ff7849'];

function Render({ block }: BlockRenderProps) {
  const p = block.props as unknown as ChartProps;
  // Local, ephemeral copy so viewers can manipulate without mutating the deck.
  const [values, setValues] = useState<number[]>(p.data);
  useEffect(() => setValues(p.data), [JSON.stringify(p.data)]);

  const dataset = {
    labels: p.labels,
    datasets: [{
      label: p.label,
      data: values,
      backgroundColor: p.chartType === 'line' ? 'rgba(124,92,255,0.2)' : p.labels.map((_, i) => PALETTE[i % PALETTE.length]),
      borderColor: p.chartType === 'line' ? '#7c5cff' : '#ffffff22',
      borderWidth: p.chartType === 'line' ? 2 : 1,
      fill: p.chartType === 'line',
      tension: 0.3,
    }],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#ccd' } } },
    scales: p.chartType === 'bar' || p.chartType === 'line'
      ? { x: { ticks: { color: '#aab' }, grid: { color: '#ffffff14' } }, y: { ticks: { color: '#aab' }, grid: { color: '#ffffff14' } } }
      : undefined,
  } as const;

  const ChartC = p.chartType === 'line' ? Line : p.chartType === 'pie' ? Pie : p.chartType === 'doughnut' ? Doughnut : Bar;

  return (
    <div className="chart-block">
      <div className="chart-canvas-wrap">
        <ChartC data={dataset} options={options} />
      </div>
      {p.controllable && (
        <div className="chart-sliders">
          {p.labels.map((lbl, i) => (
            <label key={i} className="chart-slider">
              <span>{lbl}: {values[i]}</span>
              <input
                type="range" min={p.min} max={p.max} value={values[i] ?? 0}
                onChange={(e) => {
                  const next = [...values];
                  next[i] = Number(e.target.value);
                  setValues(next);
                }}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function Edit({ block, update }: BlockEditProps) {
  const p = block.props as unknown as ChartProps;
  return (
    <>
      <label className="field">
        <span>차트 종류</span>
        <select value={p.chartType} onChange={(e) => update({ chartType: e.target.value })}>
          <option value="bar">막대</option>
          <option value="line">선</option>
          <option value="pie">파이</option>
          <option value="doughnut">도넛</option>
        </select>
      </label>
      <label className="field col"><span>라벨 (쉼표)</span>
        <input value={p.labels.join(', ')} onChange={(e) => update({ labels: e.target.value.split(',').map((s) => s.trim()) })} />
      </label>
      <label className="field col"><span>데이터 (쉼표)</span>
        <input value={p.data.join(', ')} onChange={(e) => update({ data: e.target.value.split(',').map((s) => Number(s.trim()) || 0) })} />
      </label>
      <label className="field col"><span>데이터셋 이름</span>
        <input value={p.label} onChange={(e) => update({ label: e.target.value })} />
      </label>
      <div className="grid2">
        <label className="field"><span>최소</span><input type="number" value={p.min} onChange={(e) => update({ min: Number(e.target.value) })} /></label>
        <label className="field"><span>최대</span><input type="number" value={p.max} onChange={(e) => update({ max: Number(e.target.value) })} /></label>
      </div>
      <label className="field"><span>슬라이더 조작 허용</span>
        <input type="checkbox" checked={p.controllable} onChange={(e) => update({ controllable: e.target.checked })} />
      </label>
    </>
  );
}

export const chartBlock: BlockDef = { type: 'chart', label: '차트', icon: '📊', Render, Edit };
