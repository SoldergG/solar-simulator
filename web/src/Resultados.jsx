import React from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Resultados({ resultado, form }) {
  if (!resultado) return null;

  const { potenciaInstalada, producaoAnual, poupanca, producaoMensal } = resultado;
  const investimento = form.area * (form.painelSelecionado?.custo || 0);
  const retornoAnos = investimento > 0 ? (investimento / poupanca).toFixed(1) : 'N/A';

  // Configuração para o gráfico de barras (produção mensal)
  const chartData = {
    labels: meses,
    datasets: [
      {
        label: 'Produção Mensal (kWh)',
        data: producaoMensal,
        backgroundColor: 'rgba(75, 192, 255, 0.7)',
        borderColor: 'rgba(75, 192, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white'
        }
      },
      title: {
        display: true,
        text: 'Produção Mensal Estimada',
        color: 'white'
      },
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white'
        }
      }
    }
  };

  return (
    <div className="glass-panel p-4 rounded-xl mt-6 text-white">
      <h2 className="text-xl font-bold mb-4 text-center">Resultados da Simulação</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/10 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Produção</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Potência Instalada:</span>
              <span className="font-semibold">{potenciaInstalada.toFixed(2)} kWp</span>
            </div>
            <div className="flex justify-between">
              <span>Produção Anual:</span>
              <span className="font-semibold">{producaoAnual.toFixed(0)} kWh</span>
            </div>
            <div className="flex justify-between">
              <span>Média Mensal:</span>
              <span className="font-semibold">{(producaoAnual / 12).toFixed(0)} kWh</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Financeiro</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Poupança Anual:</span>
              <span className="font-semibold">{poupanca.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span>Investimento Estimado:</span>
              <span className="font-semibold">{investimento.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span>Retorno em:</span>
              <span className="font-semibold">{retornoAnos} anos</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-white/5 p-4 rounded-lg">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
