import React, { useState } from 'react';

const paineisSolares = [
  { 
    id: 1, 
    nome: 'Monocristalino Premium', 
    eficiencia: 22, 
    potencia: 0.4, 
    custo: 350,
    imagem: 'https://img.freepik.com/premium-vector/solar-panel-icon-simple-style_144467-518.jpg',
    descricao: 'Alta eficiência, ideal para espaços limitados'
  },
  { 
    id: 2, 
    nome: 'Monocristalino', 
    eficiencia: 20, 
    potencia: 0.35, 
    custo: 280,
    imagem: 'https://img.freepik.com/premium-vector/solar-panel-icon-simple-style_144467-518.jpg',
    descricao: 'Boa relação custo-benefício'
  },
  { 
    id: 3, 
    nome: 'Policristalino', 
    eficiencia: 17, 
    potencia: 0.3, 
    custo: 220,
    imagem: 'https://static.vecteezy.com/system/resources/previews/011/016/152/non_2x/solar-panel-icon-simple-style-vector.jpg',
    descricao: 'Económico e durável'
  },
  { 
    id: 4, 
    nome: 'Película Fina', 
    eficiencia: 12, 
    potencia: 0.2, 
    custo: 180,
    imagem: 'https://cdn-icons-png.flaticon.com/512/3093/3093072.png',
    descricao: 'Flexível, leve e mais barato'
  },
  { 
    id: 5, 
    nome: 'Bifacial', 
    eficiencia: 24, 
    potencia: 0.45, 
    custo: 420,
    imagem: 'https://cdn-icons-png.flaticon.com/512/4834/4834467.png',
    descricao: 'Capta luz em ambos os lados, maior produção'
  },
];

// O componente visual foi migrado para o modal PanelSelectorModal.jsx. Este arquivo agora só exporta o array de painéis.

export default paineisSolares;
export { paineisSolares };

