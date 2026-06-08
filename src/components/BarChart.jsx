import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export default function BarChart({ labels, values, color = '#FFEE00', horizontal = false, label = '' }) {
  const data = {
    labels,
    datasets: [{
      label,
      data: values,
      backgroundColor: color,
      borderWidth: 0,
    }],
  }

  const options = {
    indexAxis: horizontal ? 'y' : 'x',
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
      },
    },
    scales: {
      x: { grid: { color: '#ffffff10' }, ticks: { color: '#ffffff40', font: { family: 'IBM Plex Mono', size: 10 } } },
      y: { grid: { color: '#ffffff10' }, ticks: { color: '#ffffff40', font: { family: 'IBM Plex Mono', size: 10 } } },
    },
  }

  return (
    <div style={{
      height: horizontal ? Math.max(200, labels.length * 36) : 180,
      background: '#1A1A1A',
      padding: 16,
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <Bar data={data} options={options} />
    </div>
  )
}
