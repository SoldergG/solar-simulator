import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Corrigir os ícones do Leaflet (problema comum)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Ícone customizado em estilo Vision OS
const visionIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/5909/5909008.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  className: 'vision-marker'
});

// Calcula inclinação ótima com base na latitude
// Regra geral: latitude * 0.76 + 3.1 = ângulo ótimo
function calcularInclinacaoOtima(latitude) {
  // Converte para número
  const lat = Math.abs(parseFloat(latitude));
  if (isNaN(lat)) return 30; // Valor padrão
  
  // Fórmula baseada em pesquisas para otimização de painéis solares
  return Math.round(lat * 0.76 + 3.1);
}

// Componente para botões de escolha de mapa
function MapStyleControl({ onChange, currentStyle }) {
  const map = useMap();
  
  const mapStyles = [
    { id: 'dark', name: 'Escuro', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
    { id: 'light', name: 'Claro', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' },
    { id: 'satellite', name: 'Satélite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' }
  ];
  
  return (
    <div className="absolute top-3 right-3 z-[1000] vision-toggle">
      {mapStyles.map(style => (
        <div 
          key={style.id}
          className={`vision-toggle-option text-xs ${currentStyle === style.id ? 'active' : ''}`}
          onClick={() => onChange(style)}
        >
          {style.name}
        </div>
      ))}
    </div>
  );
}

function LocationMarker({ updateCoordinates, updateInclinacao }) {
  const [position, setPosition] = useState(null);
  
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      updateCoordinates(lat, lng);
      
      // Calcula e atualiza a inclinação ótima
      const inclinacaoOtima = calcularInclinacaoOtima(lat);
      updateInclinacao(inclinacaoOtima);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={visionIcon}>
      <Popup className="vision-popup">
        <div className="text-center">
          <div className="font-medium">Localização selecionada</div>
          <div className="text-sm opacity-75">
            {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
          </div>
          <div className="text-xs mt-1 font-medium">
            Inclinação ótima: {calcularInclinacaoOtima(position.lat)}°
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// Componente para busca de endereço
function AddressSearch({ onLocationFound }) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  
  const searchAddress = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        onLocationFound(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
      } else {
        alert('Endereço não encontrado. Tente outro ou use o mapa.');
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      alert('Erro ao buscar endereço. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={searchAddress} className="flex items-center gap-2 mb-3">
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Digite um endereço ou cidade..."
        className="input mb-0 flex-grow"
      />
      <button 
        type="submit"
        className="btn-primary py-2 px-4" 
        disabled={loading}
      >
        {loading ? '...' : 'Buscar'}
      </button>
    </form>
  );
}

export default function Mapa({ updateCoordinates, updateInclinacao }) {
  const [defaultPosition, setDefaultPosition] = useState([38.72, -9.14]); // Lisboa como padrão
  const [currentMapStyle, setCurrentMapStyle] = useState('dark');
  const [mapTileLayer, setMapTileLayer] = useState({
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  });
  
  // Atualiza o tile layer do mapa quando o estilo muda
  const handleMapStyleChange = (style) => {
    setCurrentMapStyle(style.id);
    setMapTileLayer({
      url: style.url,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
  };
  
  // Callback para quando um endereço é encontrado
  const handleAddressFound = (lat, lon, name) => {
    setDefaultPosition([lat, lon]);
    updateCoordinates(lat, lon);
    
    // Atualiza inclinação baseada na nova latitude
    const inclinacao = calcularInclinacaoOtima(lat);
    updateInclinacao(inclinacao);
  };
  
  useEffect(() => {
    // Tentar obter localização do usuário
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setDefaultPosition([latitude, longitude]);
          
          // Define inclinação inicial baseada na localização do usuário
          const inclinacao = calcularInclinacaoOtima(latitude);
          updateInclinacao(inclinacao);
        },
        (error) => {
          console.log('Erro ao obter a localização:', error);
        }
      );
    }
  }, []);

  return (
    <div className="glass-panel p-6 rounded-xl mt-6">
      <h3 className="text-lg font-medium mb-3 text-[var(--text-primary)]">Localização da Instalação</h3>
      
      {/* Busca de endereço */}
      <AddressSearch onLocationFound={handleAddressFound} />
      
      <div className="h-[350px] rounded-xl overflow-hidden relative vision-map-container">
        <MapContainer 
          center={defaultPosition} 
          zoom={8} 
          style={{ height: '100%', width: '100%' }}
          className="vision-map"
          key={`map-${defaultPosition[0]}-${defaultPosition[1]}-${currentMapStyle}`} // Forçar re-render ao mudar o centro
        >
          <TileLayer
            url={mapTileLayer.url}
            attribution={mapTileLayer.attribution}
          />
          <LocationMarker 
            updateCoordinates={updateCoordinates} 
            updateInclinacao={updateInclinacao}
          />
          <MapStyleControl 
            onChange={handleMapStyleChange}
            currentStyle={currentMapStyle}
          />
        </MapContainer>
        
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/30 to-transparent z-10 pointer-events-none">
          <div className="text-xs text-white opacity-90">Mapa Interativo • Clique para selecionar localização</div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-3 mt-4 text-sm text-[var(--text-secondary)]">
        <div className="flex-1">
          <p className="mb-2">
            <span className="font-medium">Dica:</span> Clique no mapa para calcular automaticamente a inclinação ótima para máxima eficiência.
          </p>
        </div>
        <div className="flex-1">
          <p>
            <span className="font-medium">Informação:</span> A inclinação ideal é calculada com base na latitude da localização, aumentando a energia produzida ao longo do ano.
          </p>
        </div>
      </div>
    </div>
  );
}
