import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, useTheme } from './src/ThemeContext';
import Mapa from './src/Mapa';
import Resultados from './src/Resultados';
import { paineisSolares } from './src/PaineisSolares';
import PanelSelectorModal from './src/PanelSelectorModal';
import TerrenoSelector from './src/TerrenoSelector';
import './src/styles.css';
import {
  calcularPotenciaInstalada,
  calcularProducaoAnual,
  calcularPoupanca,
  calcularProducaoMensal
} from './src/solarCalculatorFrontend';

// Componente para alternar entre tema claro e escuro
function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();
  
  return (
    <div 
      className="theme-switch" 
      onClick={toggleTheme}
      data-mode={isDarkMode ? 'dark' : 'light'}
    >
      <div className="theme-switch-ball"></div>
      <span className="theme-switch-icon moon">🌙</span>
      <span className="theme-switch-icon sun">☀️</span>
    </div>
  );
}

function App() {
  const [form, setForm] = useState({
    area: '', 
    inclinacao: '30', // Valor padrão para inclinação 
    horasSolAno: '1100', 
    eficienciaPainel: '', 
    potenciaPainel: '', 
    precoKWh: '0.15',
    latitude: '', 
    longitude: '', 
    orcamento: ''
  });

  const [painelSelecionado, setPainelSelecionado] = useState(null);
  const [panelModalOpen, setPanelModalOpen] = useState(false);
  const [terrenoCoords, setTerrenoCoords] = useState(null);
  const [terrenoMetodo, setTerrenoMetodo] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isDarkMode } = useTheme();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePainelSelect = painel => {
    setPainelSelecionado(painel);
    setForm({
      ...form,
      eficienciaPainel: painel.eficiencia,
      potenciaPainel: painel.potencia,
      painelSelecionado: painel
    });
  };

  const handleTerrenoCoords = coords => {
    setTerrenoCoords(coords);
    // Se for um ponto único, atualiza latitude/longitude
    if (Array.isArray(coords) && coords.length === 1 && coords[0].lat && coords[0].lng) {
      setForm({ ...form, latitude: coords[0].lat, longitude: coords[0].lng });
    }
    // Se for polígono/quadrilátero, pode calcular área depois
  };

  const handleTerrenoMetodo = metodo => {
    setTerrenoMetodo(metodo);
  };

  const updateCoordinates = (lat, lng) => {
    setForm({
      ...form,
      latitude: lat.toFixed(4),
      longitude: lng.toFixed(4)
    });
  };
  
  // Função para atualizar inclinação a partir do mapa
  const updateInclinacao = (inclinacao) => {
    setForm({
      ...form,
      inclinacao: String(inclinacao)
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    
    if (!painelSelecionado) {
      alert("Por favor, selecione um tipo de painel solar.");
      return;
    }
    
    setLoading(true);
    try {
      // Cálculo local (frontend)
      const area = Number(form.area);
      const inclinacao = Number(form.inclinacao);
      const horasSolAno = Number(form.horasSolAno);
      const eficienciaPainel = Number(form.eficienciaPainel);
      const potenciaPainel = Number(form.potenciaPainel);
      const precoKWh = Number(form.precoKWh);
      
      const potenciaInstalada = calcularPotenciaInstalada(area, eficienciaPainel, potenciaPainel);
      const producaoAnual = calcularProducaoAnual(potenciaInstalada, horasSolAno);
      const poupanca = calcularPoupanca(producaoAnual, precoKWh);
      const producaoMensal = calcularProducaoMensal(producaoAnual);

      setResultado({
        potenciaInstalada,
        producaoAnual,
        poupanca,
        producaoMensal
      });
      
      // Scroll para resultados
      document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Erro:', error);
      alert("Erro ao calcular. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-light text-[var(--text-primary)] mb-2">
              Simulador <span className="font-semibold">Solar</span>
            </h1>
            <p className="text-[var(--text-secondary)]">Calcule a produção e retorno do seu sistema fotovoltaico</p>
          </div>
          <ThemeToggle />
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-xl">
              <h2 className="text-xl font-medium mb-4 text-[var(--text-primary)]">Dados do Sistema</h2>
              
              <div className="space-y-4">
                {/* Botão para abrir modal de seleção de painel */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Tipo de Painel Solar
                  </label>
                  <button type="button" className="btn-primary w-full mb-2" onClick={() => setPanelModalOpen(true)}>
                    {painelSelecionado ? `Selecionado: ${painelSelecionado.nome}` : 'Escolher tipo de painel'}
                  </button>
                  <PanelSelectorModal open={panelModalOpen} onClose={() => setPanelModalOpen(false)} onSelect={handlePainelSelect} />
                  {painelSelecionado && (
                    <div className="flex items-center gap-2 mt-2">
                      <img src={painelSelecionado.imagem} alt={painelSelecionado.nome} className="w-8 h-8 rounded shadow" />
                      <span className="text-sm text-[var(--text-secondary)]">{painelSelecionado.nome}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Área Disponível (m²)
                  </label>
                  <input 
                    name="area" 
                    type="number" 
                    placeholder="Área em metros quadrados" 
                    value={form.area} 
                    onChange={handleChange} 
                    className="input" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Inclinação (graus) • <span className="text-xs italic opacity-80">Calculada automaticamente</span>
                  </label>
                  <input 
                    name="inclinacao" 
                    type="number"
                    min="0"
                    max="90" 
                    placeholder="Inclinação em graus" 
                    value={form.inclinacao} 
                    onChange={handleChange} 
                    className="input" 
                    required 
                  />
                </div>
                
                {/* Seletor de terreno: mapa real ou coordenadas */}
                <TerrenoSelector onCoords={handleTerrenoCoords} onMethodChange={handleTerrenoMetodo} />
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Preço kWh (€)
                  </label>
                  <input 
                    name="precoKWh" 
                    type="number"
                    step="0.01"
                    placeholder="Preço por kWh em euros" 
                    value={form.precoKWh} 
                    onChange={handleChange} 
                    className="input" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Orçamento (€)
                  </label>
                  <input 
                    name="orcamento" 
                    type="number" 
                    placeholder="Orçamento disponível" 
                    value={form.orcamento} 
                    onChange={handleChange} 
                    className="input" 
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="btn-primary w-full mt-6"
                disabled={loading}
              >
                {loading ? 'A calcular...' : 'Calcular Produção'}
              </button>
            </form>
            
            <Mapa 
              updateCoordinates={updateCoordinates} 
              updateInclinacao={updateInclinacao}
            />
          </div>
          
          <div>
            <PaineisSolares 
              onChange={handlePainelSelect} 
              selecionado={painelSelecionado?.id} 
            />
            
            {resultado && (
              <div id="resultados">
                <Resultados resultado={resultado} form={{...form, painelSelecionado}} />
              </div>
            )}
          </div>
        </div>
        
        <footer className="mt-12 text-center text-[var(--text-secondary)] text-sm">
          <p> {new Date().getFullYear()} Simulador Solar • Painel de Vidro Vision OS</p>
        </footer>
      </div>
    </div>
  );
}

const AppWithTheme = () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

createRoot(document.getElementById('root')).render(<AppWithTheme />);
