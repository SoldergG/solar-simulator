/**
 * Map Loader - Script dedicado para garantir o carregamento correto do mapa
 * Este arquivo resolve problemas de inicializu00e7u00e3o do mapa quando se navega entre pu00e1ginas
 */

// Varu00edaveis globais - usamos window para evitar conflitos de declarau00e7u00e3o
window.solarsimMap = null;
window.mapInitialized = false;
window.mapLibrary = null; // 'maplibre' ou 'leaflet' dependendo da biblioteca usada

// Funu00e7u00e3o para verificar se os recursos necessrios estt00e3o carregados
function areMapResourcesLoaded() {
  // Verifica se as bibliotecas de mapa estu00e3o disponu00edveis
  const mapLibreAvailable = typeof maplibregl !== 'undefined';
  const leafletAvailable = typeof L !== 'undefined';
  const mapTilerAvailable = typeof maptilersdk !== 'undefined';
  
  console.log('Recursos de mapa disponu00edveis:', {
    mapLibreGL: mapLibreAvailable,
    Leaflet: leafletAvailable,
    MapTilerSDK: mapTilerAvailable
  });
  
  return mapLibreAvailable || leafletAvailable;
}

// Funu00e7u00e3o para carregar os recursos de mapa dinamicamente se necessrio
function loadMapResources() {
  return new Promise((resolve, reject) => {
    if (areMapResourcesLoaded()) {
      resolve(true);
      return;
    }
    
    console.log('Carregando recursos de mapa dinamicamente...');
    
    // Funu00e7u00e3o para carregar script
    function loadScript(url) {
      return new Promise((resolveScript, rejectScript) => {
        // Verifica se o script ju00e1 foi carregado
        const existingScript = document.querySelector(`script[src="${url}"]`);
        if (existingScript) {
          console.log(`Script ${url} ju00e1 carregado, pulando...`);
          resolveScript();
          return;
        }
        
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolveScript();
        script.onerror = () => {
          console.warn(`Erro ao carregar script: ${url}, tentando fallback local`);
          // Tenta carregar de CDN alternativo ou pular
          resolveScript();
        };
        document.head.appendChild(script);
      });
    }
    
    // Funu00e7u00e3o para carregar CSS
    function loadCSS(url) {
      return new Promise((resolveCSS) => {
        // Verifica se o CSS ju00e1 foi carregado
        const existingLink = document.querySelector(`link[href="${url}"]`);
        if (existingLink) {
          console.log(`CSS ${url} ju00e1 carregado, pulando...`);
          resolveCSS();
          return;
        }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.onload = () => resolveCSS();
        link.onerror = () => {
          console.warn(`Erro ao carregar CSS: ${url}, continuando mesmo assim`);
          resolveCSS();
        };
        document.head.appendChild(link);
      });
    }
    
    // Carregar recursos em paralelo, mas com tratamento de erros individual
    // Primeiro carregamos apenas o MapLibre que u00e9 mais confu00edavel
    Promise.all([
      loadScript('https://cdn.jsdelivr.net/npm/maplibre-gl@3.6.1/dist/maplibre-gl.js'),
      loadCSS('https://cdn.jsdelivr.net/npm/maplibre-gl@3.6.1/dist/maplibre-gl.css')
    ])
    .then(() => {
      console.log('MapLibre carregado com sucesso, tentando carregar recursos adicionais...');
      // Agora tentamos carregar os outros recursos, mas nu00e3o falhamos se eles nu00e3o carregarem
      Promise.allSettled([
        loadScript('https://cdn.jsdelivr.net/npm/@maptiler/sdk@1.5.0/dist/maptiler-sdk.umd.min.js'),
        loadCSS('https://cdn.jsdelivr.net/npm/@maptiler/sdk@1.5.0/dist/maptiler-sdk.css'),
        loadScript('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js'),
        loadCSS('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css')
      ])
      .finally(() => {
        console.log('Todos os recursos de mapa tentados, continuando...');
        resolve(true);
      });
    })
    .catch((error) => {
      console.error('Erro ao carregar recursos de mapa essenciais:', error);
      // Tentamos o Leaflet como u00faltimo recurso
      Promise.all([
        loadScript('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js'),
        loadCSS('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css')
      ])
      .then(() => {
        console.log('Leaflet carregado como fallback');
        resolve(true);
      })
      .catch((leafletError) => {
        console.error('Falha no carregamento de todos os recursos de mapa:', leafletError);
        reject(error);
      });
    });
  });
}

// Funu00e7u00e3o para inicializar o mapa
async function initMap() {
  // Evita inicializar o mapa mu00faltiplas vezes
  if (window.mapInitialized && window.solarsimMap) {
    console.log('Mapa ju00e1 inicializado, ignorando');
    return window.solarsimMap;
  }
  
  console.log('Iniciando inicializau00e7u00e3o do mapa...');
  
  try {
    // Verifica se o container do mapa existe
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      throw new Error('Container do mapa nu00e3o encontrado (elemento com id="map")');
    }
    
    // Garante que os recursos do mapa estt00e3o carregados
    await loadMapResources();
    
    // Verifica se o appu00e9 et00e1 configurado
    if (!window.appConfig) {
      throw new Error('Configurau00e7u00f5es do aplicativo nu00e3o encontradas');
    }
    
    // Obtu00e9m a chave da API
    const apiKey = window.appConfig.server.mapTilerApiKey;
    if (!apiKey) {
      throw new Error('Chave da API MapTiler nu00e3o encontrada nas configurau00e7u00f5es');
    }
    
    // Configura o MapTiler SDK se disponvel
    if (typeof maptilersdk !== 'undefined' && maptilersdk.config) {
      maptilersdk.config.apiKey = apiKey;
    }
    
    // Tenta inicializar com MapLibre GL
    if (typeof maplibregl !== 'undefined') {
      try {
        console.log('Inicializando mapa com MapLibre GL...');
        
        // Inicializa o mapa com OpenStreetMap como fonte de dados (sem depender de chave API)
        window.solarsimMap = new maplibregl.Map({
          container: 'map',
          style: {
            version: 8,
            sources: {
              'osm': {
                type: 'raster',
                tiles: [
                  'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                ],
                tileSize: 256,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              }
            },
            layers: [
              {
                id: 'osm',
                type: 'raster',
                source: 'osm',
                minzoom: 0,
                maxzoom: 19
              }
            ]
          },
          center: [-46.647, -23.549], // Su00e3o Paulo
          zoom: 12
        });
        
        // Adiciona controles de navegau00e7u00e3o
        if (typeof maplibregl.NavigationControl === 'function') {
          window.solarsimMap.addControl(new maplibregl.NavigationControl());
        }
        
        // Adiciona controle de geolocalizau00e7u00e3o
        if (typeof maplibregl.GeolocateControl === 'function') {
          window.solarsimMap.addControl(new maplibregl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
            trackUserLocation: true
          }));
        }
        
        // Define a biblioteca usada
        window.mapLibrary = 'maplibre';
        window.mapInitialized = true;
        
        // Adiciona evento quando o mapa carrega
        window.solarsimMap.on('load', function() {
          console.log('Mapa carregado com sucesso (usando OpenStreetMap)!');
          hideLoading();
          onMapLoaded(window.solarsimMap);
        });
        
        // Adiciona evento de erro
        window.solarsimMap.on('error', function(error) {
          console.error('Erro no mapa MapLibre:', error);
          showMapError('Ocorreu um erro ao carregar o mapa.');
        });
        
        return window.solarsimMap;
      } catch (maplibreError) {
        console.error('Erro ao inicializar MapLibre GL:', maplibreError);
        throw maplibreError;
      }
    }
    
    // Fallback para Leaflet se MapLibre nu00e3o estiver disponvel
    if (typeof L !== 'undefined') {
      try {
        console.log('Inicializando mapa com Leaflet (fallback)...');
        // Limpa o container por precauu00e7u00e3o
        mapContainer.innerHTML = '';
        
        window.solarsimMap = L.map('map').setView([-23.549, -46.647], 12);
        
        L.tileLayer(`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${apiKey}`, {
          attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18
        }).addTo(window.solarsimMap);
        
        // Define a biblioteca usada
        window.mapLibrary = 'leaflet';
        window.mapInitialized = true;
        
        // Notifica que o mapa foi carregado
        setTimeout(() => {
          console.log('Mapa Leaflet carregado com sucesso!');
          hideLoading();
          onMapLoaded(window.solarsimMap);
        }, 500);
        
        return window.solarsimMap;
      } catch (leafletError) {
        console.error('Erro ao inicializar Leaflet:', leafletError);
        throw leafletError;
      }
    }
    
    throw new Error('Nenhuma biblioteca de mapa disponvel');
  } catch (error) {
    console.error('Falha na inicializau00e7u00e3o do mapa:', error);
    hideLoading();
    showMapError(`Falha ao carregar o mapa: ${error.message}`);
    window.mapInitialized = false;
    return null;
  }
}

// Exibir mensagem de erro do mapa
function showMapError(message) {
  console.error('Erro do mapa:', message);
  const mapContainer = document.getElementById('map');
  if (mapContainer) {
    mapContainer.innerHTML = `
      <div class="map-error">
        <div class="error-icon">u26A0uFE0F</div>
        <h3>Erro ao carregar o mapa</h3>
        <p>${message}</p>
        <button onclick="retryInitMap()" class="retry-button">Tentar novamente</button>
      </div>
    `;
  }
  
  // Exibe notificau00e7u00e3o se a funu00e7u00e3o estiver disponvel
  if (typeof showNotification === 'function') {
    showNotification(message, 'error');
  } else if (typeof alert === 'function') {
    alert(`Erro do mapa: ${message}`);
  }
}

// Ocultar indicador de carregamento
function hideLoading() {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
  
  const mapContainer = document.getElementById('map-container');
  if (mapContainer) {
    mapContainer.classList.add('loaded');
  }
}

// Funu00e7u00e3o para tentar inicializar o mapa novamente
function retryInitMap() {
  const mapContainer = document.getElementById('map');
  if (mapContainer) {
    mapContainer.innerHTML = '';
  }
  
  window.mapInitialized = false;
  window.solarsimMap = null;
  
  // Mostra overlay de carregamento
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'flex';
  }
  
  // Tenta inicializar novamente com um pequeno delay
  setTimeout(() => {
    initMap().catch(error => {
      console.error('Nova tentativa falhou:', error);
    });
  }, 1000);
}

// Funu00e7u00e3o chamada quando o mapa u00e9 carregado com sucesso
function onMapLoaded(map) {
  // Restaura o painel solar selecionado anteriormente, se existir
  try {
    const savedPanel = localStorage.getItem('selectedPanel');
    if (savedPanel) {
      const panelData = JSON.parse(savedPanel);
      
      // Atualiza a interface com as informau00e7u00f5es do painel
      const selectedPanelInfo = document.getElementById('selected-panel-info');
      if (selectedPanelInfo) {
        const panelName = document.getElementById('selected-panel-name');
        if (panelName) panelName.textContent = panelData.name;
        
        selectedPanelInfo.style.display = 'flex';
        
        const panelIcon = document.getElementById('selected-panel-icon');
        if (panelIcon) panelIcon.textContent = panelData.icon;
        
        const panelEfficiency = document.getElementById('selected-panel-efficiency');
        if (panelEfficiency) panelEfficiency.textContent = `${panelData.efficiency}%`;
      }
      
      // Exibe notificau00e7u00e3o se a funu00e7u00e3o estiver disponvel
      if (typeof showNotification === 'function') {
        showNotification(`Painel solar selecionado: ${panelData.name}`, 'info');
      }
    }
  } catch (error) {
    console.error('Erro ao restaurar painel selecionado:', error);
  }
  
  // Atualiza a interface com o usuu00e1rio atual
  try {
    if (window.getCurrentUser) {
      const currentUser = window.getCurrentUser();
      if (currentUser) {
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
          userNameElement.textContent = currentUser.name || 'Usuu00e1rio';
        }
        
        const userAvatarElement = document.getElementById('user-avatar');
        if (userAvatarElement) {
          userAvatarElement.textContent = currentUser.avatar || 'U';
        }
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar informau00e7u00f5es do usuu00e1rio:', error);
  }
  
  // Configura os controles de camadas
  setupLayerControls(map);
}

// Configurar controles de camadas
function setupLayerControls(map) {
  // Configurar controles de camadas
  document.querySelectorAll('input[type="checkbox"][id^="layer-"]').forEach(checkbox => {
    checkbox.addEventListener('change', function(e) {
      const layerType = this.id.replace('layer-', '');
      console.log(`Camada ${layerType}: ${e.target.checked ? 'ativada' : 'desativada'}`);
      
      // Abre o modal de painu00e9is solares quando a camada solar u00e9 ativada
      if (layerType === 'solar' && e.target.checked) {
        const panelModal = document.getElementById('panel-modal');
        if (panelModal) {
          panelModal.style.display = 'flex';
        }
      }
    });
  });
}

// Função global para inicializar o mapa (pode ser chamada de outros scripts)
window.initializeMap = function() {
  console.log('Inicializando mapa via API pública...');
  return initMap().catch(error => {
    console.error('Erro ao inicializar o mapa:', error);
    showMapError(`Falha ao carregar o mapa: ${error.message}`);
    return null;
  });
};

// Inicializar o mapa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM carregado. Preparando para inicializar o mapa...');
  
  // Verifica se o mapa já foi inicializado
  if (window.mapInitialized && window.solarsimMap) {
    console.log('Mapa já inicializado, ignorando');
    return;
  }
  
  // Inicia o processo de carregamento do mapa com um pequeno delay
  // para garantir que todos os recursos foram carregados
  setTimeout(() => {
    window.initializeMap();
  }, 500);
});

// Exportar funu00e7u00f5es para uso global
window.initMap = initMap;
window.retryInitMap = retryInitMap;
