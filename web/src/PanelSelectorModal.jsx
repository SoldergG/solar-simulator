import React from "react";
import { paineisSolares } from "./PaineisSolares";

export default function PanelSelectorModal({ open, onClose, onSelect }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[var(--glass-background)] rounded-2xl shadow-xl p-8 relative max-w-2xl w-full">
        <button className="absolute top-4 right-4 text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-semibold mb-6 text-center text-[var(--text-primary)]">Escolha o tipo de painel solar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {paineisSolares.map(painel => (
            <div
              key={painel.id}
              className="cursor-pointer rounded-xl border-2 border-transparent hover:border-blue-400 bg-white/10 p-4 flex flex-col items-center transition-all"
              onClick={() => { onSelect(painel); onClose(); }}
            >
              <img src={painel.imagem} alt={painel.nome} className="w-24 h-24 object-contain mb-2 rounded-lg shadow" />
              <div className="font-medium text-lg text-[var(--text-primary)] mb-1">{painel.nome}</div>
              <div className="text-xs text-[var(--text-secondary)] mb-2">{painel.descricao}</div>
              <div className="flex gap-2 text-xs text-[var(--text-secondary)]">
                <span>Eficiência: <b>{painel.eficiencia}%</b></span>
                <span>Potência: <b>{painel.potencia}kW/m²</b></span>
                <span>Custo: <b>{painel.custo}€/m²</b></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
