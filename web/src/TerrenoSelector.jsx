import React, { useState } from "react";
import Mapa from "./Mapa";

export default function TerrenoSelector({ onCoords, onMethodChange }) {
  const [method, setMethod] = useState(null);
  const [coordenadas, setCoordenadas] = useState([
    { lat: "", lng: "" },
    { lat: "", lng: "" },
    { lat: "", lng: "" },
    { lat: "", lng: "" },
  ]);

  function handleCoordChange(idx, field, value) {
    const newCoords = coordenadas.map((c, i) =>
      i === idx ? { ...c, [field]: value } : c
    );
    setCoordenadas(newCoords);
    if (newCoords.every(c => c.lat && c.lng)) {
      onCoords(newCoords);
    }
  }

  return (
    <div className="glass-panel p-4 rounded-xl mt-4">
      <div className="flex gap-4 mb-4">
        <button className={`btn-primary ${method === "mapa" ? "opacity-100" : "opacity-70"}`} onClick={() => { setMethod("mapa"); onMethodChange("mapa"); }}>Selecionar no mapa</button>
        <button className={`btn-primary ${method === "coordenadas" ? "opacity-100" : "opacity-70"}`} onClick={() => { setMethod("coordenadas"); onMethodChange("coordenadas"); }}>Inserir coordenadas</button>
      </div>
      {method === "mapa" && (
        <Mapa updateCoordinates={(lat, lng) => onCoords([{ lat, lng }])} updateInclinacao={() => {}} />
      )}
      {method === "coordenadas" && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {coordenadas.map((c, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="number"
                  step="any"
                  placeholder={`Latitude canto ${idx + 1}`}
                  value={c.lat}
                  onChange={e => handleCoordChange(idx, "lat", e.target.value)}
                  className="input flex-1"
                />
                <input
                  type="number"
                  step="any"
                  placeholder={`Longitude canto ${idx + 1}`}
                  value={c.lng}
                  onChange={e => handleCoordChange(idx, "lng", e.target.value)}
                  className="input flex-1"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
