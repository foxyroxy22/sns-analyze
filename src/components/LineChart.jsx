import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

export default function LineChart({ labels, values, color = '#FFEE00', label = '' }) {
  const data = {
    labels,
    datasets: [{
      label,
      data: values,
      borderColor: color,
      backgroundColor: color + '18',
      fill: true,
      tension: 0,
      pointRadius: 2,
      pointBackgroundColor: color,
      borderWidth: 1,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0A0A0A',
        borderColor: color,
        borderWidth: 1,
        titleColor: color,
        bodyColor: '#F5F5F0',
        titleFont: { family: 'IBM Plex Mono', size: 12 },
      },
    },
    scales: {
      x: {
        grid: { color: '#ffffff10' },
        ticks: { color: '#ffffff40', font: { family: 'IBM Plex Mono', size: 10 } },
      },
      y: {
        grid: { color: '#ffffff10' },
        ticks: { color: '#ffffff40', font: { family: 'IBM Plex Mono', size: 10 } },
      },
    },
  }

  return (
    <div style={{ height: 180, background: '#1A1A1A', padding: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
      <Line data={data} options={options} />
    </div>
  )
}
