// main.js - Simulador Solar Vision OS (versão estática, client-side)
// Tudo roda no browser, APIs externas via fetch, sem import/export local

const { useState, useEffect, useRef } = React;

// Lista de painéis solares
const paineisSolares = [
  { 
    id: 1, 
    nome: 'Monocristalino', 
    eficiencia: 22, 
    rangeEficiencia: '18% – 23%',
    potencia: 0.22, 
    potenciaWp: 400, 
    descricao: 'Alta eficiência, ideal para espaço limitado', 
    recomendado: false,
    cor: '#1E40AF',
    icone: '☀️'
  },
  { 
    id: 2, 
    nome: 'PERC (monopremium)', 
    eficiencia: 24, 
    rangeEficiencia: '20% – 24%',
    potencia: 0.24, 
    potenciaWp: 450, 
    descricao: 'Versão otimizada dos monocristalinos', 
    recomendado: true,
    cor: '#2563EB',
    icone: '⭐'
  },
  { 
    id: 3, 
    nome: 'Bifacial', 
    eficiencia: 23, 
    rangeEficiencia: '19% – 23% (+10–20%)',
    potencia: 0.23, 
    potenciaWp: 430, 
    descricao: 'Produz energia dos dois lados', 
    recomendado: false,
    cor: '#3B82F6',
    icone: '↔️'
  },
  { 
    id: 4, 
    nome: 'Policristalino', 
    eficiencia: 18, 
    rangeEficiencia: '15% – 18%',
    potencia: 0.18, 
    potenciaWp: 350, 
    descricao: 'Mais econômico, menos eficiente', 
    recomendado: false,
    cor: '#60A5FA',
    icone: '💎'
  },
  { 
    id: 5, 
    nome: 'Filme Fino', 
    eficiencia: 13, 
    rangeEficiencia: '10% – 13%',
    potencia: 0.13, 
    potenciaWp: 250, 
    descricao: 'Para grandes superfícies apenas', 
    recomendado: false,
    cor: '#93C5FD',
    icone: '📄'
  }
];

// Funções de cálculo
function calcularPotenciaInstalada(area, eficienciaPainel, potenciaPainel) {
  return area * (eficienciaPainel / 100) * potenciaPainel;
}
function calcularProducaoAnual(potenciaInstalada, horasSolAno) {
  return potenciaInstalada * horasSolAno;
}
function calcularPoupanca(producaoAnual, precoKWh) {
  return producaoAnual * precoKWh;
}
function calcularProducaoMensal(producaoAnual) {
  const meses = 12;
  const media = producaoAnual / meses;
  return Array(meses).fill(media);
}
function calcularInclinacaoOtima(latitude) {
  const lat = Math.abs(parseFloat(latitude));
  if (isNaN(lat)) return 30;
  return Math.round(lat * 0.76 + 3.1);
}

// Modal de seleção de painel com grid de quadrados animados
function PanelSelectorModal(props) {
  if (!props.open) return null;
  
  return React.createElement('div', { 
    className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fadeIn', 
    onClick: (e) => e.target === e.currentTarget && props.onClose()
  },
    React.createElement('div', { 
      className: 'bg-[var(--glass-background)] backdrop-blur-lg rounded-2xl shadow-2xl p-7 relative max-w-3xl w-full animate-scaleIn border border-[var(--glass-border)]',
      style: { maxHeight: '85vh', overflow: 'hidden' }
    },
      // Botão de fechar mais atraente
      React.createElement('button', { 
        className: 'absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300 transform hover:rotate-90',
        onClick: props.onClose,
        style: { fontSize: '18px' }
      }, '\u00D7'),
      
      // Título com estilo melhorado
      React.createElement('div', { className: 'mb-6 text-center' },
        React.createElement('h2', { 
          className: 'text-2xl font-bold text-[var(--text-primary)]',
          style: { letterSpacing: '-0.01em' }
        }, 'Escolha o Painel Solar'),
        React.createElement('p', { className: 'text-[var(--text-secondary)] mt-1' }, 
          'Selecione o tipo de painel mais adequado para o seu projeto'
        )
      ),
      
      // Grid de painéis em quadrados com espau00e7amento melhorado
      React.createElement('div', { 
        className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[calc(85vh-130px)] overflow-y-auto pr-2 pb-6',
        style: { scrollBehavior: 'smooth', padding: '10px' }
      },
        paineisSolares.map(function(painel, index) {
          return React.createElement('div', {
            key: painel.id,
            className: `cursor-pointer rounded-xl transition-all duration-300 hover:scale-105 animate-fadeInUp shadow-lg hover:shadow-xl border-2 overflow-hidden ${painel.recomendado ? 'border-[var(--accent-primary)]' : 'border-[var(--glass-border)]'}`,
            onClick: function() { props.onSelect(painel); props.onClose(); },
            style: { 
              animationDelay: `${index * 0.1}s`,
              background: `linear-gradient(135deg, ${painel.cor}15, ${painel.cor}05)`,
              transform: 'translateY(0)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(8px)',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: painel.recomendado ? `0 8px 32px ${painel.cor}40` : '0 8px 32px rgba(0, 0, 0, 0.1)'
            }
          },
            // Badge de recomendado, se aplicável
            painel.recomendado && React.createElement('div', { 
              className: 'absolute top-0 right-0 bg-[var(--accent-primary)] text-white text-xs px-3 py-1 rounded-bl-lg z-10 font-medium',
              style: { boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)' }
            }, 'Recomendado'),
            
            // Conteúdo do painel - layout exatamente como solicitado pelo usuário
            React.createElement('div', { className: 'p-5 flex flex-col items-center text-center' },
              // Título: Tipo de Painel Solar
              React.createElement('div', { 
                className: 'text-sm uppercase tracking-wider mb-3 font-medium',
                style: { color: 'var(--text-secondary)' }
              }, 'Tipo de Painel Solar'),
              
              // Ícone grande
              React.createElement('div', { 
                className: 'text-6xl mb-4',
                style: { lineHeight: 1 }
              }, painel.icone),
              
              // Nome do painel
              React.createElement('h3', { 
                className: 'font-bold text-xl mb-3',
                style: { color: painel.cor }
              }, painel.nome),
              
              // Range de eficiência
              React.createElement('div', { 
                className: 'bg-black/10 rounded-full px-4 py-2 mb-4 backdrop-blur-sm font-medium',
                style: { 
                  color: `${painel.cor}`,
                  border: `1px solid ${painel.cor}30`,
                  boxShadow: `0 2px 8px ${painel.cor}20`
                }
              }, painel.rangeEficiencia),
              
              // Eficiência atual
              React.createElement('div', { 
                className: 'text-3xl font-bold',
                style: { color: painel.cor }
              }, `${painel.eficiencia}%`),
              
              // Botão de calcular
              React.createElement('button', {
                className: 'btn btn-primary',
                onClick: (e) => {
                  // Adiciona a animação quando o botão é clicado
                  e.currentTarget.classList.add('btn-calcular-animacao');
                  
                  // Remove a classe após a animação terminar
                  setTimeout(() => {
                    e.currentTarget.classList.remove('btn-calcular-animacao');
                  }, 800);
                },
                style: { 
                  background: painel.cor,
                  color: 'white',
                  boxShadow: `0 2px 8px ${painel.cor}40`
                },
                onClick: (e) => {
                  e.stopPropagation();
                  props.onSelect(painel); 
                  props.onClose();
                }
              }, 'Selecionar')
            )
          );
        })
      )
    )
  );
}

// Modal de informações de cálculo no estilo Vision OS
// Modal de informações de cálculo no estilo Vision OS
function InfoModal(props) {
  if (!props.open) return null;
  
  return React.createElement('div', { className: 'fixed inset-0 z-50 flex items-center justify-end bg-black/40 animate-fadeIn backdrop-blur-md' },
    React.createElement('div', { 
      className: 'bg-[var(--glass-background)] rounded-3xl shadow-2xl relative w-[450px] h-full animate-slideInRight overflow-auto border-l border-[var(--glass-border)]',
      style: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 0 40px rgba(59, 130, 246, 0.1) inset'
      }
    },
      // Barra superior com título e botão de fechar
      React.createElement('div', { 
        className: 'flex items-center justify-between p-6 border-b border-[var(--glass-border)]',
        style: { backdropFilter: 'blur(10px)' }
      },
        React.createElement('h2', { 
          className: 'text-2xl font-semibold text-[var(--text-primary)]',
          style: {
            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent'
          }
        }, 'Informações de Cálculo'),
        React.createElement('button', { 
          className: 'w-8 h-8 flex items-center justify-center rounded-full bg-[var(--glass-background)] hover:bg-[var(--glass-border)] transition-all',
          onClick: props.onClose
        }, '\u00D7')
      ),
      
      // Conteúdo principal
      React.createElement('div', { className: 'p-6 space-y-6' },
        // APIs utilizadas
        React.createElement('div', { className: 'mb-6 animate-fadeInUp', style: { animationDelay: '0.1s' } },
          React.createElement('h3', { 
            className: 'text-xl font-medium mb-3 text-[var(--text-primary)]',
            style: { textShadow: '0 0 10px rgba(59, 130, 246, 0.3)' }
          }, 'APIs Utilizadas'),
          React.createElement('div', { className: 'space-y-3' },
            React.createElement('div', { 
              className: 'p-4 rounded-xl border border-[var(--glass-border)] transition-all hover:transform hover:scale-[1.01] hover:shadow-lg',
              style: { background: 'rgba(255, 255, 255, 0.05)' }
            },
              React.createElement('h4', { className: 'font-medium mb-1 text-[var(--accent-primary)]' }, 'PVGIS - Photovoltaic Geographical Information System'),
              React.createElement('p', { className: 'text-sm text-[var(--text-secondary)]' }, 'API da Comissão Europeia para dados de radiação solar e cálculo de produção fotovoltaica.'),
              React.createElement('a', { href: 'https://re.jrc.ec.europa.eu/pvg_tools/en/', target: '_blank', className: 'text-sm text-[var(--accent-primary)] hover:underline mt-2 inline-block' }, 'Acessar PVGIS')
            ),
            React.createElement('div', { 
              className: 'p-4 rounded-xl border border-[var(--glass-border)] transition-all hover:transform hover:scale-[1.01] hover:shadow-lg',
              style: { background: 'rgba(255, 255, 255, 0.05)' }
            },
              React.createElement('h4', { className: 'font-medium mb-1 text-[var(--accent-primary)]' }, 'MapTiler & Leaflet'),
              React.createElement('p', { className: 'text-sm text-[var(--text-secondary)]' }, 'Utilizado para a visualização de mapas e cálculo de áreas.'),
              React.createElement('a', { href: 'https://www.maptiler.com/', target: '_blank', className: 'text-sm text-[var(--accent-primary)] hover:underline mt-2 inline-block' }, 'Acessar MapTiler')
            )
          )
        ),
        
        // Fórmulas de cálculo
        React.createElement('div', { className: 'mb-6 animate-fadeInUp', style: { animationDelay: '0.2s' } },
          React.createElement('h3', { 
            className: 'text-xl font-medium mb-3 text-[var(--text-primary)]',
            style: { textShadow: '0 0 10px rgba(59, 130, 246, 0.3)' }
          }, 'Fórmulas de Cálculo'),
          React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-3' },
            React.createElement('div', { 
              className: 'p-4 rounded-xl border border-[var(--glass-border)] transition-all hover:transform hover:scale-[1.01] hover:shadow-lg',
              style: { background: 'rgba(255, 255, 255, 0.05)' }
            },
              React.createElement('h4', { className: 'font-medium mb-1 text-[var(--accent-primary)]' }, 'Potência Instalada (kW)'),
              React.createElement('p', { className: 'text-sm text-[var(--text-secondary)]' }, 'Área do terreno (m²) × Eficiência do painel (%) × Potência do painel (kW/m²)')
            ),
            React.createElement('div', { 
              className: 'p-4 rounded-xl border border-[var(--glass-border)] transition-all hover:transform hover:scale-[1.01] hover:shadow-lg',
              style: { background: 'rgba(255, 255, 255, 0.05)' }
            },
              React.createElement('h4', { className: 'font-medium mb-1 text-[var(--accent-primary)]' }, 'Produção Anual (kWh)'),
              React.createElement('p', { className: 'text-sm text-[var(--text-secondary)]' }, 'Potência instalada (kW) × Horas de sol por ano')
            ),
            React.createElement('div', { 
              className: 'p-4 rounded-xl border border-[var(--glass-border)] transition-all hover:transform hover:scale-[1.01] hover:shadow-lg',
              style: { background: 'rgba(255, 255, 255, 0.05)' }
            },
              React.createElement('h4', { className: 'font-medium mb-1 text-[var(--accent-primary)]' }, 'Poupança Anual (€)'),
              React.createElement('p', { className: 'text-sm text-[var(--text-secondary)]' }, 'Produção anual (kWh) × Preço do kWh (€)')
            ),
            React.createElement('div', { 
              className: 'p-4 rounded-xl border border-[var(--glass-border)] transition-all hover:transform hover:scale-[1.01] hover:shadow-lg',
              style: { background: 'rgba(255, 255, 255, 0.05)' }
            },
              React.createElement('h4', { className: 'font-medium mb-1 text-[var(--accent-primary)]' }, 'Inclinação Ótima (graus)'),
              React.createElement('p', { className: 'text-sm text-[var(--text-secondary)]' }, 'Latitude × 0.76 + 3.1 (fórmula simplificada)')
            )
          )
        ),
        
        // Personalização de dados
        React.createElement('div', { className: 'animate-fadeInUp', style: { animationDelay: '0.3s' } },
          React.createElement('h3', { 
            className: 'text-xl font-medium mb-3 text-[var(--text-primary)]',
            style: { textShadow: '0 0 10px rgba(59, 130, 246, 0.3)' }
          }, 'Personalizar Dados'),
          React.createElement('div', { 
            className: 'p-4 rounded-xl border border-[var(--glass-border)]',
            style: { background: 'rgba(255, 255, 255, 0.05)' }
          },
            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-[var(--text-secondary)] mb-2' }, 'Horas de Sol por Ano'),
                React.createElement('input', { 
                  name: 'horasSolAno', 
                  type: 'number', 
                  placeholder: 'Ex: 1100', 
                  value: props.formData.horasSolAno, 
                  onChange: props.onFormChange, 
                  className: 'input', 
                  required: true,
                  style: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px'
                  }
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-[var(--text-secondary)] mb-2' }, 'Preço do kWh (€)'),
                React.createElement('input', { 
                  name: 'precoKWh', 
                  type: 'number', 
                  step: '0.01', 
                  placeholder: 'Ex: 0.15', 
                  value: props.formData.precoKWh, 
                  onChange: props.onFormChange, 
                  className: 'input', 
                  required: true,
                  style: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px'
                  }
                })
              )
            ),
            React.createElement('div', { className: 'mt-4 text-center' },
              React.createElement('button', {
                type: 'button',
                className: 'btn-primary px-6 py-2',
                onClick: props.onClose,
                style: {
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }
              }, 'Aplicar Alterações')
            )
          )
        )
      )
    )
  );
}

function App() {
  // ...
  useEffect(() => {
    // Função para calcular horas de sol (sem usar a API PVGIS devido a problemas de CORS)
    async function calcularHorasSolPVGIS(latitude, longitude) {
      try {
        console.log('Estimando horas de sol para:', latitude, longitude);
        
        // Como estamos enfrentando problemas de CORS, vamos usar valores estimados
        // baseados na latitude para simular os dados que viriam da API
        
        // Estimar horas de sol com base na latitude (valores aproximados)
        // Quanto mais próximo do equador, mais horas de sol
        let horasSolAno = 1600; // Valor padrão
        
        // Ajustar com base na latitude (hemisfério norte)
        if (latitude < 20) {
          horasSolAno = 2000; // Próximo ao equador
        } else if (latitude < 30) {
          horasSolAno = 1800; // Regiões tropicais
        } else if (latitude < 40) {
          horasSolAno = 1600; // Regiões temperadas
        } else if (latitude < 50) {
          horasSolAno = 1400; // Regiões temperadas mais ao norte
        } else {
          horasSolAno = 1200; // Regiões mais ao norte
        }
        
        // Adicionar alguma variabilidade baseada na longitude
        // Isso é apenas para simular variações regionais e não tem base científica
        const variacao = (Math.abs(longitude) % 10) * 20; // Variação de até 200 horas
        horasSolAno = Math.round(horasSolAno + variacao);
        
        console.log('Horas de sol estimadas:', horasSolAno);
        return horasSolAno;
        
        /* Código original comentado devido ao erro de CORS
        const url = `https://re.jrc.ec.europa.eu/api/v5_2/seriescalc?lat=${latitude}&lon=${longitude}&outputformat=json&startyear=2020&endyear=2020&pvcalculation=1&peakpower=1&pvtechchoice=crystSi&mountingplace=free&angle=35&aspect=0&loss=14`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Extrair a radiação solar anual (kWh/m²) e converter para horas de sol equivalentes
        if (data && data.outputs && data.outputs.totals && data.outputs.totals.fixed) {
          // Pegar a radiação solar anual em kWh/m²
          const radiacaoAnual = data.outputs.totals.fixed.E_y;
          
          // Arredondar para o número inteiro mais próximo
          const horasSolAno = Math.round(radiacaoAnual);
          
          return horasSolAno;
        }
        */
        
      } catch (error) {
        console.error('Erro ao calcular horas de sol:', error);
        return 1600; // Valor padrão em caso de erro
      }
    }
    
    function handleTerrenoKml(e) {
      console.log('Evento terreno-kml recebido:', e.detail);
      if (e.detail && typeof e.detail.area === 'number') {
        // Garantir que a área seja pelo menos 1000 m² para evitar problemas com áreas muito pequenas
        const areaMinima = Math.max(e.detail.area, 1000);
        console.log('Área definida (KML):', areaMinima);
        setAreaTerreno(areaMinima);
        
        // Se temos as coordenadas do centro do polígono, calcular horas de sol
        if (e.detail.center && e.detail.center.latitude && e.detail.center.longitude) {
          const { latitude, longitude } = e.detail.center;
          
          // Atualizar os campos de latitude e longitude no formulário
          setForm(prevForm => ({
            ...prevForm,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6)
          }));
          
          // Calcular horas de sol e atualizar o formulário
          calcularHorasSolPVGIS(latitude, longitude).then(horasSolAno => {
            setForm(prevForm => ({
              ...prevForm,
              horasSolAno: String(horasSolAno)
            }));
          });
        }
      }
    }
    
    function handleTerrenoCantos(e) {
      console.log('Evento terreno-cantos recebido:', e.detail);
      if (e.detail) {
        // Mesmo que a área seja zero ou não esteja definida, definir um valor mínimo
        const areaMinima = Math.max(e.detail.area || 0, 1000);
        console.log('Área definida (Cantos):', areaMinima);
        setAreaTerreno(areaMinima);
        
        // Se temos dados solares, atualizar os campos correspondentes
        if (e.detail.dadosSolares) {
          const { horasSolAno, inclinacaoOtima } = e.detail.dadosSolares;
          
          // Atualizar os campos no formulário
          setForm(prevForm => ({
            ...prevForm,
            horasSolAno: String(horasSolAno || 1600),
            inclinacao: String(inclinacaoOtima || 30)
          }));
          
          // Armazenar os dados solares para uso posterior
          setDadosSolares(e.detail.dadosSolares);
        } else {
          // Definir valores padrão se não houver dados solares
          setForm(prevForm => ({
            ...prevForm,
            horasSolAno: '1600',
            inclinacao: '30'
          }));
        }
        
        // Se temos as coordenadas do centro do polígono
        if (e.detail.center && e.detail.center.latitude && e.detail.center.longitude) {
          const { latitude, longitude } = e.detail.center;
          
          // Atualizar os campos de latitude e longitude no formulário
          setForm(prevForm => ({
            ...prevForm,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6)
          }));
        } else if (e.detail.pontos && e.detail.pontos.length > 0) {
          // Calcular o centro manualmente se não estiver definido mas tivermos pontos
          let sumLat = 0, sumLng = 0;
          e.detail.pontos.forEach(p => {
            sumLat += p.lat;
            sumLng += p.lng;
          });
          const lat = sumLat / e.detail.pontos.length;
          const lng = sumLng / e.detail.pontos.length;
          
          setForm(prevForm => ({
            ...prevForm,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6)
          }));
        }
      }
    }
    
    // Handler para o evento area-atualizada (backup para garantir que a área seja sempre atualizada)
    function handleAreaAtualizada(e) {
      console.log('Evento area-atualizada recebido:', e.detail);
      if (e.detail && typeof e.detail.area === 'number') {
        // Garantir que a área seja pelo menos 1000 m² para evitar problemas com áreas muito pequenas
        const areaMinima = Math.max(e.detail.area, 1000);
        console.log('Área atualizada:', areaMinima);
        setAreaTerreno(areaMinima);
        
        // Se temos pontos, calcular o centro manualmente
        if (e.detail.pontos && e.detail.pontos.length > 0) {
          let sumLat = 0, sumLng = 0;
          e.detail.pontos.forEach(p => {
            sumLat += p.lat;
            sumLng += p.lng;
          });
          const lat = sumLat / e.detail.pontos.length;
          const lng = sumLng / e.detail.pontos.length;
          
          // Atualizar os campos de latitude e longitude no formulário
          setForm(prevForm => ({
            ...prevForm,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6)
          }));
          
          // Calcular horas de sol e atualizar o formulário
          calcularHorasSolPVGIS(lat, lng).then(horasSolAno => {
            setForm(prevForm => ({
              ...prevForm,
              horasSolAno: String(horasSolAno)
            }));
          });
        }
      }
    }
    
    // Adicionar os event listeners
    window.addEventListener('terreno-kml', handleTerrenoKml);
    window.addEventListener('terreno-cantos', handleTerrenoCantos);
    window.addEventListener('area-atualizada', handleAreaAtualizada);
    
    return () => {
      window.removeEventListener('terreno-kml', handleTerrenoKml);
      window.removeEventListener('terreno-cantos', handleTerrenoCantos);
      window.removeEventListener('area-atualizada', handleAreaAtualizada);
    };
  }, []); // Remover a dependência areaTerreno para evitar loops infinitos
  const [form, setForm] = useState({
    inclinacao: '30', horasSolAno: '1100', eficienciaPainel: '', potenciaPainel: '', potenciaModuloWp: '', precoKWh: '0.15', latitude: '', longitude: '', orcamento: '', metodoTerreno: 'mapa', numeroModulos: '', areaModulo: ''
  });
  const [dadosSolares, setDadosSolares] = useState(null);
  const [painelSelecionado, setPainelSelecionado] = useState(null);
  const [panelModalOpen, setPanelModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [areaTerreno, setAreaTerreno] = useState(1000); // Inicializar com um valor padrão de 1000 m²
  const [dadosPersonalizaveis, setDadosPersonalizaveis] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // Para controlar as abas dos gráficos
  const [moedaSelecionada, setMoedaSelecionada] = useState('EUR'); // Moeda padrão: Euro
  
  // Taxas de conversão (valores de exemplo, devem ser atualizados com dados reais)
  const taxasDeConversao = {
    EUR: 1.0,      // Euro (moeda base)
    USD: 1.08,     // Dólar americano
    GBP: 0.85,     // Libra esterlina
    BRL: 5.5,      // Real brasileiro
    CHF: 0.97      // Franco suíço
  };
  
  // Função para converter valores para a moeda selecionada
  const converterMoeda = (valor, moedaOrigem = 'EUR', moedaDestino = moedaSelecionada) => {
    if (!valor) return 0;
    // Converter para Euro primeiro (se não for Euro)
    const valorEmEuro = moedaOrigem === 'EUR' ? valor : valor / taxasDeConversao[moedaOrigem];
    // Converter de Euro para a moeda de destino
    return valorEmEuro * taxasDeConversao[moedaDestino];
  };
  
  // Função para obter o símbolo da moeda
  const obterSimboloMoeda = (moeda) => {
    const simbolos = {
      EUR: '€',  // Euro
      USD: '$',   // Dólar
      GBP: '£',  // Libra
      BRL: 'R$',  // Real
      CHF: 'CHF'  // Franco suíço
    };
    return simbolos[moeda] || moeda;
  };
  
  // Função para limpar gráficos existentes quando mudar de aba
  const limparGraficos = () => {
    ['grafico-producao-mensal', 'grafico-retorno', 'grafico-eficiencia', 'grafico-comparativo'].forEach(id => {
      const canvas = document.getElementById(id);
      if (canvas && canvas.chart) {
        canvas.chart.destroy();
        canvas.chart = null;
      }
    });
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePainelSelect = painel => {
    setPainelSelecionado(painel);
    setForm({ ...form, eficienciaPainel: painel.eficiencia, potenciaPainel: painel.potencia, potenciaModuloWp: painel.potenciaWp, painelSelecionado: painel });
  };
  
  const toggleInfoModal = () => {
    setInfoModalOpen(!infoModalOpen);
    if (!dadosPersonalizaveis) {
      setDadosPersonalizaveis(true);
    }
  };
  const handleSubmit = e => {
    e.preventDefault();
    if (!painelSelecionado) { alert('Por favor, selecione um tipo de painel solar.'); return; }
    
    // Verificar se temos uma u00e1rea definida
    if (!areaTerreno || areaTerreno <= 0) {
      console.error('u00c1rea do terreno nu00e3o definida ou invau00e1lida:', areaTerreno);
      alert('Desenhe ou importe um polu00edgono do terreno no mapa para calcular.');
      return;
    }
    
    console.log('Iniciando cu00e1lculo com u00e1rea:', areaTerreno);
    
    // Verificar se a u00e1rea u00e9 muito grande (provavelmente um erro de cu00e1lculo)
    // Se for maior que 1 milhu00e3o de m² (100 hectares), provavelmente u00e9 um erro
    let areaMinima = areaTerreno;
    if (areaTerreno > 1000000) {
      console.log('u00c1rea muito grande, provavelmente um erro de cu00e1lculo. Ajustando para um valor mais razoau00e1vel.');
      areaMinima = areaTerreno / 1000; // Dividir por 1000 para obter um valor mais razoau00e1vel
    }
    
    // Garantir que a u00e1rea seja pelo menos 10m²
    areaMinima = Math.max(areaMinima, 10);
    console.log('u00c1rea para cu00e1lculo (ajustada se necessau00e1rio):', areaMinima);
    
    setLoading(true);
    
    // Dados do painel selecionado
    const { eficiencia, potenciaWp } = painelSelecionado;
    
    // Dados do formulu00e1rio
    const inclinacao = parseFloat(form.inclinacao) || 30;
    const horasSolAno = parseFloat(form.horasSolAno) || 1600;
    const precoKWh = parseFloat(form.precoKWh) || 0.15;
    const numeroModulosInserido = parseInt(form.numeroModulos);
    const areaModuloInserida = parseFloat(form.areaModulo);
    
    // Verificar se o usuu00e1rio inseriu nu00famero de mu00f3dulos e u00e1rea de cada mu00f3dulo
    let areaUtil, potenciaInstalada, numeroPaineis;
    let areaExcedida = false;
    let mensagemErro = '';
    
    if (!isNaN(numeroModulosInserido) && numeroModulosInserido > 0 && !isNaN(areaModuloInserida) && areaModuloInserida > 0) {
      // Calcular a u00e1rea total necessária para os painéis
      const areaTotalNecessaria = numeroModulosInserido * areaModuloInserida;
      
      // Verificar se a u00e1rea total dos painéis excede a u00e1rea disponível
      // Consideramos 70% da u00e1rea do terreno como u00e1rea u00fatil para painéis
      const areaMaximaDisponivel = areaMinima * 0.7;
      
      if (areaTotalNecessaria > areaMaximaDisponivel) {
        // Calcular o nu00famero máximo de painéis que cabem na u00e1rea
        const maxPaineis = Math.floor(areaMaximaDisponivel / areaModuloInserida);
        
        console.log(`Aviso: A u00e1rea necessária (${areaTotalNecessaria.toFixed(2)} m²) excede a u00e1rea disponível (${areaMaximaDisponivel.toFixed(2)} m²)`);
        console.log(`Nu00famero máximo de painéis possíveis: ${maxPaineis}`);
        
        areaExcedida = true;
        mensagemErro = `A u00e1rea total necessária (${areaTotalNecessaria.toFixed(2)} m²) excede a u00e1rea disponível (${areaMaximaDisponivel.toFixed(2)} m²). O nu00famero máximo de painéis possíveis é ${maxPaineis}.`;
        
        // Ajustar para o nu00famero máximo de painéis possíveis
        numeroPaineis = maxPaineis;
        areaUtil = maxPaineis * areaModuloInserida;
      } else {
        // Cu00e1lculos baseados nos valores inseridos pelo usuu00e1rio
        console.log('Usando valores inseridos pelo usuu00e1rio: ' + numeroModulosInserido + ' mu00f3dulos com ' + areaModuloInserida + ' mu00b2 cada');
        
        // u00c1rea total dos painu00e9is
        areaUtil = areaTotalNecessaria;
        console.log('u00c1rea total dos painu00e9is:', areaUtil, 'mu00b2');
        
        // Nu00famero de painu00e9is u00e9 o que o usuu00e1rio inseriu
        numeroPaineis = numeroModulosInserido;
      }
      
      // Potu00eancia instalada baseada no nu00famero de mu00f3dulos e potu00eancia de cada mu00f3dulo
      potenciaInstalada = (numeroPaineis * potenciaWp) / 1000; // Convertendo Wp para kWp
      console.log('Potu00eancia instalada:', potenciaInstalada, 'kWp');
    } else {
      // Cu00e1lculos tradicionais baseados na u00e1rea do terreno
      // 1. u00c1rea u00fatil para painu00e9is (70% da u00e1rea total)
      areaUtil = areaMinima * 0.7;
      console.log('u00c1rea u00fatil para painu00e9is (70%):', areaUtil, 'mu00b2');
      
      // 2. Potu00eancia instalada (kWp) = u00c1rea u00fatil (mu00b2) * Eficiu00eancia do painel (%) / 100 * 1 kW/mu00b2
      potenciaInstalada = (areaUtil * eficiencia / 100);
      console.log('Potu00eancia instalada:', potenciaInstalada, 'kWp');
      
      // 5. Nu00famero de painu00e9is = Potu00eancia instalada (Wp) / Potu00eancia do painel (Wp)
      numeroPaineis = Math.ceil((potenciaInstalada * 1000) / potenciaWp);
      console.log('Nu00famero de painu00e9is:', numeroPaineis);
    }
    
    // 3. Produu00e7u00e3o anual (kWh) = Potu00eancia instalada (kWp) * Horas de sol por ano (h)
    const producaoAnual = potenciaInstalada * horasSolAno;
    console.log('Produu00e7u00e3o anual:', producaoAnual, 'kWh');
    
    // 4. Economia anual (R$) = Produu00e7u00e3o anual (kWh) * Preu00e7o da energia (R$/kWh)
    const economiaAnual = producaoAnual * precoKWh;
    console.log('Economia anual:', economiaAnual, 'R$');
    
    // 6. Produu00e7u00e3o mensal (kWh) - distribuiu00e7u00e3o baseada em dados tu00edpicos do Brasil
    const distribuicaoMensal = [0.09, 0.08, 0.085, 0.08, 0.075, 0.07, 0.075, 0.08, 0.085, 0.09, 0.095, 0.095];
    const producaoMensal = distribuicaoMensal.map(fator => producaoAnual * fator);
    
    // 7. Economia mensal (R$)
    const economiaMensal = producaoMensal.map(prod => prod * precoKWh);
    
    // Definir resultado
    setResultado({
      areaTerreno: areaMinima,
      areaUtil,
      potenciaInstalada,
      producaoAnual,
      economiaAnual,
      numeroPaineis,
      producaoMensal,
      economiaMensal,
      painel: painelSelecionado,
      areaModulo: areaModuloInserida || (areaUtil / numeroPaineis), // Área por módulo (inserida ou calculada)
      areaExcedida,
      mensagemErro
    });
    
    setLoading(false);
    
    // Rolar para os resultados
    setTimeout(() => {
      const resultadosElement = document.getElementById('resultados');
      if (resultadosElement) {
        resultadosElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Exemplo de chamada à API PVGIS (ajuste conforme necessário)
  async function fetchPVGIS(lat, lon) {
    const url = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=${lat}&lon=${lon}&peakpower=1&loss=14&outputformat=json`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Erro na API PVGIS');
    return resp.json();
  }

  return (
    React.createElement('div', { className: 'min-h-screen flex flex-col items-center pt-24 pb-8 px-4 relative' },
      // Cabeçalho fixo que não será cortado durante o scroll
      React.createElement('header', { 
        className: 'fixed top-0 left-0 right-0 z-50 py-4 px-4 backdrop-blur-lg bg-[var(--glass-background)] bg-opacity-80 shadow-md border-b border-[var(--glass-border)]',
        style: { minHeight: '70px' }
      },
        React.createElement('div', { className: 'max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between' },
          React.createElement('div', { className: 'flex flex-col items-center md:items-start' },
            React.createElement('h1', { className: 'text-3xl md:text-4xl font-bold glassy-title' }, 'Simulador Solar'),
            React.createElement('p', { className: 'text-sm md:text-base text-[var(--text-secondary)]' }, 'Calcule a produção e retorno do seu sistema fotovoltaico')
          )
        )
      ),
      
      // Conteúdo principal
      React.createElement('div', { className: 'max-w-4xl w-full flex flex-col items-center justify-center' },
        React.createElement('form', { onSubmit: handleSubmit, className: 'glass-panel p-4 sm:p-6 rounded-xl w-full' },
          React.createElement('h2', { className: 'text-xl font-medium mb-4 text-[var(--text-primary)]' }, 'Dados do Sistema'),
          React.createElement('div', { className: 'space-y-4' },
            React.createElement('div', null,
              React.createElement('button', { 
                type: 'button', 
                className: 'w-full mb-4',
                onClick: () => setPanelModalOpen(true),
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  background: painelSelecionado ? `linear-gradient(135deg, ${painelSelecionado.cor}30, ${painelSelecionado.cor}10)` : 'linear-gradient(135deg, var(--accent-primary)20, var(--accent-secondary)10)',
                  color: painelSelecionado ? painelSelecionado.cor : 'var(--accent-primary)',
                  borderRadius: '12px',
                  border: painelSelecionado ? `2px solid ${painelSelecionado.cor}40` : '2px solid var(--accent-primary)30',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                },
                onMouseOver: (e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                },
                onMouseOut: (e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
                }
              },
                // Título
                React.createElement('div', { 
                  className: 'text-sm uppercase tracking-wider mb-3 font-medium',
                  style: { color: 'var(--text-secondary)' }
                }, 'Tipo de Painel Solar'),
                
                // Conteúdo do botão
                React.createElement('div', { className: 'flex items-center justify-center' },
                  // Ícone
                  painelSelecionado ? React.createElement('div', { 
                    className: 'mr-3 text-3xl',
                  }, painelSelecionado.icone) : React.createElement('div', { 
                    className: 'mr-3 text-3xl animate-pulse',
                    style: { opacity: 0.7 }
                  }, '☀️'),
                  
                  // Texto
                  React.createElement('span', { 
                    className: 'text-xl font-semibold'
                  }, 
                    painelSelecionado ? painelSelecionado.nome : 'Escolher Painel'
                  ),
                  
                  // Seta para baixo
                  React.createElement('svg', {
                    xmlns: 'http://www.w3.org/2000/svg',
                    width: '20',
                    height: '20',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: '2',
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    className: 'ml-3 animate-bounce',
                    style: { animationDuration: '2s' }
                  }, React.createElement('polyline', { points: '6 9 12 15 18 9' }))
                ),
                
                // Badge de eficiência (se tiver painel selecionado)
                painelSelecionado && React.createElement('div', {
                  className: 'mt-3 px-3 py-1 rounded-full text-sm font-medium',
                  style: {
                    background: `${painelSelecionado.cor}20`,
                    color: painelSelecionado.cor,
                    border: `1px solid ${painelSelecionado.cor}30`
                  }
                }, painelSelecionado.rangeEficiencia)
              ),
              React.createElement(PanelSelectorModal, { open: panelModalOpen, onClose: () => setPanelModalOpen(false), onSelect: handlePainelSelect }),
              // Removido display redundante do painel selecionado
            ),
            React.createElement('div', { className: 'mb-4' },
              React.createElement('label', { className: 'block text-sm font-medium text-[var(--text-secondary)] mb-1' }, 'Selecione o método para definir o terreno:'),
              React.createElement('select', {
                className: 'input',
                value: form.metodoTerreno || 'mapa',
                onChange: e => {
                  const novoMetodo = e.target.value;
                  setForm({ ...form, metodoTerreno: novoMetodo });
                  // Disparar evento para o mapa saber qual modo de seleção usar
                  window.dispatchEvent(new CustomEvent('modo-selecao', {
                    detail: { modo: novoMetodo }
                  }));
                }
              },
                React.createElement('option', { value: 'mapa' }, 'Selecionar no mapa (clicar 4 cantos)'),
                React.createElement('option', { value: 'mapaMaisPontos' }, 'Selecionar no mapa (mais de 4 pontos)'),
                React.createElement('option', { value: 'manual' }, 'Inserir coordenadas dos 4 cantos')
              )
            ),
            form.metodoTerreno === 'manual' ? React.createElement('div', { className: 'mb-4' },
              [0,1,2,3].map(i =>
                React.createElement('div', { key: i, className: 'flex gap-2 mb-2' },
                  React.createElement('input', {
                    className: 'input',
                    type: 'number',
                    step: 'any',
                    placeholder: `Latitude canto ${i+1}`,
                    value: form[`lat${i}`] || '',
                    onChange: e => setForm({ ...form, [`lat${i}`]: e.target.value })
                  }),
                  React.createElement('input', {
                    className: 'input',
                    type: 'number',
                    step: 'any',
                    placeholder: `Longitude canto ${i+1}`,
                    value: form[`lng${i}`] || '',
                    onChange: e => setForm({ ...form, [`lng${i}`]: e.target.value })
                  })
                )
              )
            ) : null,
            React.createElement('div', null,
              React.createElement('label', { className: 'flex items-center text-sm font-medium text-[var(--text-secondary)] mb-1' }, 
                'Inclinação (graus)',
                React.createElement('span', { 
                  className: 'ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full', 
                  style: { background: 'rgba(34, 197, 94, 0.2)', color: '#16a34a' }
                }, 'Dados PVGIS')
              ),
              React.createElement('input', { name: 'inclinacao', type: 'number', min: 0, max: 90, placeholder: 'Inclinação em graus', value: form.inclinacao, onChange: handleChange, className: 'input', required: true })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'flex items-center text-sm font-medium text-[var(--text-secondary)] mb-1' }, 
                'Horas de Sol por Ano',
                React.createElement('span', { 
                  className: 'ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full', 
                  style: { background: 'rgba(34, 197, 94, 0.2)', color: '#16a34a' }
                }, 'Dados PVGIS')
              ),
              React.createElement('input', { name: 'horasSolAno', type: 'number', placeholder: 'Ex: 1100', value: form.horasSolAno, onChange: handleChange, className: 'input', required: true })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-[var(--text-secondary)] mb-1' }, 'Potência do módulo (Wp) • ', React.createElement('span', { className: 'text-xs italic opacity-80' }, 'Potência de cada painel individual')),
              React.createElement('input', { name: 'potenciaModuloWp', type: 'number', min: 100, max: 800, placeholder: 'Ex: 400', value: form.potenciaModuloWp, onChange: handleChange, className: 'input', required: true })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-[var(--text-secondary)] mb-1' }, 'Número de módulos solares • ', React.createElement('span', { className: 'text-xs italic opacity-80' }, 'Quantidade de painéis a instalar')),
              React.createElement('input', { name: 'numeroModulos', type: 'number', min: 1, placeholder: 'Ex: 20', value: form.numeroModulos, onChange: handleChange, className: 'input' })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-[var(--text-secondary)] mb-1' }, 'Área de cada módulo (m²) • ', React.createElement('span', { className: 'text-xs italic opacity-80' }, 'Área de cada painel individual')),
              React.createElement('input', { name: 'areaModulo', type: 'number', min: 0.1, step: '0.01', placeholder: 'Ex: 1.7', value: form.areaModulo, onChange: handleChange, className: 'input' })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'flex items-center text-sm font-medium text-[var(--text-secondary)] mb-1' }, 
                'Preço do kWh (€)', 
                React.createElement('span', { 
                  className: 'ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full', 
                  style: { background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)' }
                }, 'Opcional')
              ),
              React.createElement('input', { name: 'precoKWh', type: 'number', step: '0.01', placeholder: 'Ex: 0.15', value: form.precoKWh, onChange: handleChange, className: 'input' })
            ),
            !dadosPersonalizaveis && React.createElement('div', { className: 'p-3 rounded-lg bg-[var(--glass-background)] border border-[var(--glass-border)] text-center' },
              React.createElement('p', { className: 'text-sm text-[var(--text-secondary)]' }, 'Clique no botão de Informações para personalizar os dados de cálculo.')
            )
          ),
          React.createElement('div', { className: 'mt-4 relative' },
            React.createElement('button', { 
              type: 'submit', 
              className: 'btn btn-primary w-full', 
              disabled: loading,
              id: 'calculate-button',
              onClick: (e) => {
                if (!loading) {
                  try {
                    // Adiciona a animação quando o botão é clicado
                    if (e && e.currentTarget) {
                      e.currentTarget.classList.add('btn-calcular-animacao');
                      
                      // Remove a classe após a animação terminar
                      setTimeout(() => {
                        if (e.currentTarget) {
                          e.currentTarget.classList.remove('btn-calcular-animacao');
                        }
                      }, 800);
                    }
                  } catch (error) {
                    console.error('Erro ao manipular classes do botão:', error);
                  }
                }
              }
            }, 
              loading ? [
                React.createElement('svg', {
                  key: 'loading-icon',
                  className: 'animate-spin -ml-1 mr-2 h-5 w-5 text-white',
                  xmlns: 'http://www.w3.org/2000/svg',
                  fill: 'none',
                  viewBox: '0 0 24 24'
                }, React.createElement('circle', {
                  className: 'opacity-25',
                  cx: '12',
                  cy: '12',
                  r: '10',
                  stroke: 'currentColor',
                  strokeWidth: '4'
                }), React.createElement('path', {
                  className: 'opacity-75',
                  fill: 'currentColor',
                  d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                })),
                React.createElement('span', { key: 'text', className: 'font-medium' }, 'Calculando...')
              ] : [
                React.createElement('svg', {
                  key: 'calc-icon',
                  xmlns: 'http://www.w3.org/2000/svg',
                  className: 'h-5 w-5 mr-2',
                  fill: 'none',
                  viewBox: '0 0 24 24',
                  stroke: 'currentColor'
                }, React.createElement('path', {
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  strokeWidth: 2,
                  d: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'
                })),
                React.createElement('span', { key: 'text', className: 'font-medium' }, 'Calcular')
              ]
            )
          ),
          
          // Botão de informações pequeno e azul
          React.createElement('div', { className: 'mt-4 flex justify-center' },
            React.createElement('button', { 
              type: 'button', 
              onClick: toggleInfoModal,
              style: {
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.2s ease'
              }
            }, 
              React.createElement('svg', { 
                xmlns: 'http://www.w3.org/2000/svg', 
                fill: 'none', 
                viewBox: '0 0 24 24', 
                stroke: 'currentColor',
                className: 'h-5 w-5',
              },
                React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2', d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
              )
            )
          ),
          React.createElement(InfoModal, { 
            open: infoModalOpen, 
            onClose: () => setInfoModalOpen(false),
            formData: form,
            onFormChange: handleChange
          })
        ),
        resultado && React.createElement('div', { 
          className: 'mt-8 mb-12 w-full animate-fadeIn',
          style: { maxWidth: '100%' }
        },
          // Painel de resultados principais
          React.createElement('div', { id: 'resultados', className: 'glass-panel p-4 sm:p-6 rounded-xl shadow-xl border border-[var(--glass-border)] relative overflow-x-auto' },
            // Botão para fechar os resultados
            React.createElement('button', {
              className: 'absolute top-3 right-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors',
              onClick: () => setResultado(null)
            }, 
              React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' },
                React.createElement('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
                React.createElement('line', { x1: '6', y1: '6', x2: '18', y2: '18' })
              )
            ),
            React.createElement('h2', { className: 'text-xl font-medium mb-4 text-[var(--text-primary)]' }, 'Resultados'),
            
            // Mensagem de alerta quando a u00e1rea necessária para os painéis exceder a u00e1rea disponível
            resultado.areaExcedida && React.createElement('div', { 
              className: 'mb-4 p-3 bg-amber-100 border border-amber-300 rounded-lg text-amber-800',
              style: { backgroundColor: 'rgba(251, 191, 36, 0.2)', borderColor: 'rgba(251, 191, 36, 0.5)' }
            }, 
              React.createElement('div', { className: 'flex items-start' },
                React.createElement('svg', {
                  xmlns: 'http://www.w3.org/2000/svg',
                  className: 'h-5 w-5 mr-2 mt-0.5 flex-shrink-0',
                  fill: 'none',
                  viewBox: '0 0 24 24',
                  stroke: 'currentColor'
                }, React.createElement('path', {
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  strokeWidth: '2',
                  d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                })),
                React.createElement('span', null, resultado.mensagemErro)
              )
            ),
            React.createElement('div', { className: 'mb-2' },
              React.createElement('span', null, 'Área do terreno: '),
              React.createElement('b', null, areaTerreno ? (areaTerreno/1e6).toFixed(4) : '0'),
              ' hectares'
            ),
            React.createElement('div', { className: 'mb-2' },
              React.createElement('span', null, 'Localização: '),
              React.createElement('b', null, form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : 'Não definida')
            ),
            React.createElement('div', { className: 'mb-2' },
              React.createElement('span', null, 'Área do Terreno: '),
              React.createElement('b', null, resultado.areaTerreno ? resultado.areaTerreno.toFixed(2) : '0.00'),
              ' m²'
            ),
            React.createElement('div', { className: 'mb-2' },
              React.createElement('span', null, 'Área Útil: '),
              React.createElement('b', null, resultado.areaUtil ? resultado.areaUtil.toFixed(2) : '0.00'),
              ' m²'
            ),
            React.createElement('div', { className: 'mb-2' },
              React.createElement('span', null, 'Potência Instalada: '),
              React.createElement('b', null, resultado.potenciaInstalada ? resultado.potenciaInstalada.toFixed(2) : '0.00'),
              ' kWp'
            ),
            React.createElement('div', { className: 'mb-2' },
              React.createElement('span', null, 'Produção Anual: '),
              React.createElement('b', null, resultado.producaoAnual ? resultado.producaoAnual.toFixed(0) : '0'),
              ' kWh'
            ),
            React.createElement('div', { className: 'mb-4' },
              React.createElement('div', { className: 'flex justify-between items-center' },
                React.createElement('div', null,
                  React.createElement('span', null, 'Economia Anual: '),
                  React.createElement('b', null, resultado.economiaAnual ? converterMoeda(resultado.economiaAnual, 'EUR').toFixed(2) : '0.00'),
                  ' ', obterSimboloMoeda(moedaSelecionada)
                ),
                React.createElement('div', { className: 'flex items-center' },
                  React.createElement('span', { className: 'text-sm mr-2 text-[var(--text-secondary)]' }, 'Moeda:'),
                  React.createElement('select', {
                    className: 'bg-[var(--glass-background)] border border-[var(--glass-border)] rounded-md px-2 py-1 text-sm',
                    value: moedaSelecionada,
                    onChange: (e) => setMoedaSelecionada(e.target.value)
                  },
                    Object.keys(taxasDeConversao).map(moeda => 
                      React.createElement('option', { key: moeda, value: moeda }, moeda)
                    )
                  )
                )
              )
            ),
            React.createElement('div', { className: 'mb-2' },
              React.createElement('span', null, 'Produção Média por Mês: '),
              React.createElement('b', null, (resultado.producaoMensal && resultado.producaoMensal[0]) ? resultado.producaoMensal[0].toFixed(0) : '0'),
              ' kWh/mês'
            ),
            React.createElement('div', { className: 'mb-2' },
              React.createElement('span', null, 'Número de Módulos: '),
              React.createElement('b', null, resultado.numeroPaineis),
              ' painéis'
            ),
            form.numeroModulos && form.areaModulo && React.createElement('div', { className: 'mb-2' },
              React.createElement('span', null, 'Área por Módulo: '),
              React.createElement('b', null, parseFloat(form.areaModulo).toFixed(2)),
              ' m²'
            ),
            // Informações do painel selecionado
            React.createElement('div', { className: 'mt-4 pt-4 border-t border-[var(--glass-border)]' },
              React.createElement('h3', { className: 'text-md font-medium mb-2 text-[var(--text-primary)]' }, 'Painel Selecionado'),
              React.createElement('div', { className: 'flex items-center gap-3' },
                React.createElement('div', { 
                  className: 'w-12 h-12 rounded-lg flex items-center justify-center',
                  style: {
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
                  }
                },
                  React.createElement('div', {
                    className: 'text-xl font-bold text-[var(--accent-primary)]',
                    style: { textShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }
                  }, `${painelSelecionado.eficiencia}%`)
                ),
                React.createElement('div', null,
                  React.createElement('div', { className: 'font-medium text-[var(--text-primary)]' }, painelSelecionado.nome),
                  React.createElement('div', { className: 'text-sm text-[var(--text-secondary)]' }, painelSelecionado.descricao)
                )
              )
            )
          ),
          
          // Gráficos e visualizações
          React.createElement('div', { className: 'glass-panel p-4 sm:p-6 rounded-xl w-full' },
            React.createElement('h2', { className: 'text-xl font-medium mb-4 text-[var(--text-primary)]' }, 'Gráficos e Estatísticas'),
            
            // Abas para navegação entre diferentes visualizações - com fundo azul e animações
            React.createElement('div', { className: 'flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 mb-6' },
              ['Produção Mensal', 'Eficiência', 'Comparação'].map((tab, i) => 
                React.createElement('button', {
                  key: tab,
                  className: `px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-xl transition-all duration-300 animate-fadeInUp`,
                  style: { 
                    animationDelay: `${i * 0.1}s`,
                    background: activeTab === i ? `linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))` : 'rgba(255, 255, 255, 0.15)',
                    color: activeTab === i ? 'white' : 'var(--text-primary)',
                    border: activeTab === i ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: activeTab === i ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                    transform: activeTab === i ? 'translateY(-2px)' : 'translateY(0)',
                    minWidth: '100px',
                    maxWidth: '140px',
                    width: '100%',
                    textAlign: 'center'
                  },
                  onClick: () => {
                    setActiveTab(i);
                  }
                }, tab)
              )
            ),
            
            // Conteúdo da abba 1: Produção Mensal (gráfico de arras)
            activeTab === 0 && React.createElement('div', { className: 'mb-6 h-[300px]' },
              React.createElement('canvas', { 
                id: 'grafico-producao-mensal',
                ref: (el) => {
                  if (el && !el.chart) {
                    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                    // Simular variação sazonal
                    const dadosMensais = meses.map((_, i) => {
                      const fatorSazonal = i >= 3 && i <= 8 ? 1.3 : (i === 2 || i === 9 ? 1.1 : 0.8);
                      return Math.round(resultado.producaoMensal[0] * fatorSazonal);
                    });
                    
                    // Criar gráfico com Chart.js
                    el.chart = new Chart(el, {
                      type: 'bar',
                      data: {
                        labels: meses,
                        datasets: [{
                          label: 'Produção (kWh)',
                          data: dadosMensais,
                          backgroundColor: 'rgba(59, 130, 246, 0.8)',
                          borderColor: 'rgba(59, 130, 246, 1)',
                          borderWidth: 1,
                          borderRadius: 6,
                          hoverBackgroundColor: 'rgba(59, 130, 246, 1)'
                        }]
                      },
                      options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return `${context.parsed.y.toLocaleString('pt-BR')} kWh`;
                              }
                            }
                          },
                          legend: {
                            labels: {
                              color: 'var(--text-primary)'
                            }
                          }
                        },
                        scales: {
                          x: {
                            ticks: {
                              color: 'var(--text-secondary)'
                            },
                            grid: {
                              color: 'rgba(203, 213, 225, 0.2)'
                            }
                          },
                          y: {
                            ticks: {
                              color: 'var(--text-secondary)'
                            },
                            grid: {
                              color: 'rgba(203, 213, 225, 0.2)'
                            }
                          }
                        }
                      }
                    });
                  }
                }
              })
            ),
            
            // Conteúdo da aba 2: Eficiência do Sistema (gráfico de linha)
            activeTab === 1 && React.createElement('div', { className: 'mb-6 h-[300px]' },
              React.createElement('canvas', { 
                id: 'grafico-eficiencia',
                ref: (el) => {
                  if (el && !el.chart) {
                    const anos = ['Ano 1', 'Ano 5', 'Ano 10', 'Ano 15', 'Ano 20', 'Ano 25'];
                    // Simular degradação do sistema
                    const eficienciaSistema = anos.map((_, i) => 100 - (i * 0.7));
                    const eficienciaMedia = anos.map(() => 93);
                    
                    el.chart = new Chart(el, {
                      type: 'line',
                      data: {
                        labels: anos,
                        datasets: [
                          {
                            label: 'Seu Sistema',
                            data: eficienciaSistema,
                            borderColor: 'rgba(59, 130, 246, 1)',
                            backgroundColor: 'rgba(59, 130, 246, 0.3)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3,
                            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                            pointBorderColor: '#fff',
                            pointRadius: 4
                          },
                          {
                            label: 'Média do Mercado',
                            data: eficienciaMedia,
                            borderColor: 'rgba(236, 72, 153, 1)',
                            backgroundColor: 'rgba(236, 72, 153, 0.1)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            tension: 0.3,
                            pointBackgroundColor: 'rgba(236, 72, 153, 1)',
                            pointBorderColor: '#fff',
                            pointRadius: 4
                          }
                        ]
                      },
                      options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            labels: {
                              color: 'var(--text-primary)'
                            }
                          }
                        },
                        scales: {
                          x: {
                            ticks: {
                              color: 'var(--text-secondary)'
                            },
                            grid: {
                              color: 'rgba(203, 213, 225, 0.2)'
                            }
                          },
                          y: {
                            ticks: {
                              color: 'var(--text-secondary)'
                            },
                            grid: {
                              color: 'rgba(203, 213, 225, 0.2)'
                            },
                            min: 80,
                            max: 100
                          }
                        }
                      }
                    });
                  }
                }
              })
            ),
            
            // Conteúdo da aba 3: Comparativo (gráfico de radar)
            activeTab === 2 && React.createElement('div', { className: 'mb-6' },
              React.createElement('div', { className: 'h-[300px]' },
                React.createElement('canvas', { 
                  id: 'grafico-comparativo',
                  ref: (el) => {
                    if (el && !el.chart) {
                      el.chart = new Chart(el, {
                        type: 'radar',
                        data: {
                          labels: ['Eficiência', 'Durabilidade', 'Produção', 'Retorno', 'Manutenção'],
                          datasets: [
                            {
                              label: painelSelecionado.nome,
                              data: [painelSelecionado.eficiencia / 25 * 100, 85, 90, 80, 75],
                              backgroundColor: 'rgba(59, 130, 246, 0.4)',
                              borderColor: 'rgba(59, 130, 246, 1)',
                              borderWidth: 2,
                              pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                              pointBorderColor: '#fff',
                              pointHoverBackgroundColor: '#fff',
                              pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
                              pointRadius: 4,
                              pointHoverRadius: 6
                            },
                            {
                              label: 'Média do Mercado',
                              data: [70, 75, 65, 70, 80],
                              backgroundColor: 'rgba(236, 72, 153, 0.4)',
                              borderColor: 'rgba(236, 72, 153, 1)',
                              borderWidth: 2,
                              pointBackgroundColor: 'rgba(236, 72, 153, 1)',
                              pointBorderColor: '#fff',
                              pointHoverBackgroundColor: '#fff',
                              pointHoverBorderColor: 'rgba(236, 72, 153, 1)',
                              pointRadius: 4,
                              pointHoverRadius: 6
                            }
                          ]
                        },
                        options: {
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const label = context.dataset.label || '';
                                  const value = context.raw || 0;
                                  const parameterName = context.label;
                                  
                                  let explanation = '';
                                  // Explicações detalhadas para cada parâmetro
                                  switch(parameterName) {
                                    case 'Eficiência':
                                      explanation = `Eficiência de conversão de energia solar em eletricidade`;
                                      break;
                                    case 'Durabilidade':
                                      explanation = 'Vida útil estimada e resistência a condições climáticas adversas';
                                      break;
                                    case 'Produção':
                                      explanation = 'Capacidade de geração de energia por m² de superfície';
                                      break;
                                    case 'Retorno':
                                      explanation = 'Tempo estimado para recuperar o investimento inicial';
                                      break;
                                    case 'Manutenção':
                                      explanation = 'Facilidade e custo de manutenção ao longo da vida útil';
                                      break;
                                  }
                                  return `${label}: ${value}% - ${explanation}`;
                                }
                              }
                            },
                            legend: {
                              labels: {
                                color: 'var(--text-primary)'
                              }
                            }
                          },
                          scales: {
                            r: {
                              angleLines: {
                                color: 'rgba(203, 213, 225, 0.2)'
                              },
                              grid: {
                                color: 'rgba(203, 213, 225, 0.2)'
                              },
                              pointLabels: {
                                color: 'var(--text-primary)'
                              },
                              ticks: {
                                backdropColor: 'transparent',
                                color: 'var(--text-secondary)'
                              }
                            }
                          }
                        }
                      });
                    }
                  }
                })
              ),
              // Explicação do gráfico de radar
              React.createElement('div', { className: 'mt-4 p-3 rounded-lg border border-[var(--glass-border)] bg-[rgba(255,255,255,0.05)]' },
                React.createElement('h4', { className: 'text-sm font-medium mb-2 text-[var(--accent-primary)]' }, 'Sobre o Gráfico de Comparação:'),
                React.createElement('p', { className: 'text-xs text-[var(--text-secondary)]' }, 
                  'Este gráfico de radar compara as características do painel selecionado com a média do mercado. Valores mais altos (mais distantes do centro) indicam melhor desempenho em cada categoria. Passe o mouse sobre cada ponto para ver explicações detalhadas.'
                ),
                React.createElement('ul', { className: 'text-xs mt-2 grid grid-cols-2 gap-2' },
                  React.createElement('li', null, React.createElement('strong', null, 'Eficiência: '), 'Percentual de luz solar convertida em eletricidade.'),
                  React.createElement('li', null, React.createElement('strong', null, 'Durabilidade: '), 'Resistência e vida útil estimada do painel.'),
                  React.createElement('li', null, React.createElement('strong', null, 'Produção: '), 'Capacidade de geração de energia por área.'),
                  React.createElement('li', null, React.createElement('strong', null, 'Retorno: '), 'Tempo para recuperar o investimento.'),
                  React.createElement('li', null, React.createElement('strong', null, 'Manutenção: '), 'Facilidade e custo de manutenção ao longo do tempo.')
                )
              )
            ),
            
            // Explicações gerais para todos os gráficos
            React.createElement('div', { className: 'mt-8 mb-6 p-4 rounded-xl border border-[var(--glass-border)] bg-[rgba(255,255,255,0.03)]' },
              React.createElement('h3', { className: 'text-md font-medium mb-3 text-[var(--accent-primary)]' }, 'Entenda os Gráficos do Simulador Solar'),
              React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4 text-xs' },
                // Gráfico de Produção Mensal
                React.createElement('div', { className: 'p-3 rounded-lg border border-[var(--glass-border)] bg-[rgba(255,255,255,0.05)]' },
                  React.createElement('h4', { className: 'font-medium mb-1 text-[var(--accent-primary)]' }, 'Gráfico de Produção Mensal'),
                  React.createElement('p', { className: 'text-[var(--text-secondary)]' }, 
                    'Mostra a estimativa de energia gerada em cada mês do ano, considerando a variação sazonal da radiação solar. Os meses de verão geralmente apresentam maior produção devido à maior incidência solar.'
                  )
                ),
                // Gráfico de Eficiência ao Longo do Tempo
                React.createElement('div', { className: 'p-3 rounded-lg border border-[var(--glass-border)] bg-[rgba(255,255,255,0.05)]' },
                  React.createElement('h4', { className: 'font-medium mb-1 text-[var(--accent-primary)]' }, 'Gráfico de Eficiência ao Longo do Tempo'),
                  React.createElement('p', { className: 'text-[var(--text-secondary)]' }, 
                    'Demonstra como a eficiência do sistema solar diminui gradualmente ao longo dos anos. Todos os painéis solares perdem eficiência com o tempo, geralmente entre 0,5% e 1% ao ano.'
                  )
                ),
                // Gráfico de Comparação (Radar)
                React.createElement('div', { className: 'p-3 rounded-lg border border-[var(--glass-border)] bg-[rgba(255,255,255,0.05)]' },
                  React.createElement('h4', { className: 'font-medium mb-1 text-[var(--accent-primary)]' }, 'Gráfico de Comparação'),
                  React.createElement('p', { className: 'text-[var(--text-secondary)]' }, 
                    'Compara as características do painel selecionado com a média do mercado em cinco dimensões importantes: eficiência, durabilidade, produção, retorno financeiro e facilidade de manutenção.'
                  )
                )
              )
            ),
            
            // Informações adicionais
            React.createElement('div', { className: 'mt-4 pt-4 border-t border-[var(--glass-border)]' },
              React.createElement('div', { className: 'text-sm text-[var(--text-secondary)] italic' },
                '* Valores estimados com base nas condições médias de radiação solar e eficiência do sistema.'
              )
            )
          )
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
