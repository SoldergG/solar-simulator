import React from 'react';
// Para mapa, podes usar Leaflet (npm i leaflet react-leaflet), mas aqui fica mockup simples
export default function Mapa({ setForm }) {
  // Exemplo: ao clicar no mapa, atualiza latitude/longitude
  const handleClick = e => {
    // Mock: define valores aleatórios
    setForm(f => ({ ...f, latitude: '38.72', longitude: '-9.14' }));
  };
  return (
    <div className="bg-gray-200 h-40 flex items-center justify-center cursor-pointer" onClick={handleClick}>
      <span>Clica para escolher localização (mockup)</span>
    </div>
  );
}
