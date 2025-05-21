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
