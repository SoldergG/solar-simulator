# Simulador Solar Vision OS (versão estática)

Este projeto é um simulador solar moderno, responsivo e sem dependências de backend ou servidor próprio. Você pode abrir o `index.html` diretamente no navegador ou hospedar em qualquer serviço de páginas estáticas (Netlify, GitHub Pages, etc).

## Como usar

1. **Abra o arquivo `index.html` no seu navegador**
   - Não precisa instalar nada, rodar comandos ou configurar servidor.
2. **Preencha os dados do sistema**
   - Escolha o tipo de painel, área, inclinação, horas de sol, etc.
3. **Clique em Calcular**
   - Os cálculos são feitos no próprio navegador.
   - O simulador faz chamadas diretas para APIs externas (como PVGIS) quando necessário, sem passar por nenhum backend próprio.

## Tecnologias usadas
- [React 18](https://react.dev/) (via CDN)
- [Chart.js](https://www.chartjs.org/) (via CDN)
- [Leaflet.js](https://leafletjs.com/) (via CDN)
- CSS customizado para visual Vision OS

## Estrutura dos arquivos
- `index.html` — HTML principal, importa tudo via CDN
- `main.js` — Código JS do aplicativo (React, lógica, chamadas API)
- `styles.css` — Estilo visual

## Observações
- **APIs externas**: O simulador faz fetch para APIs públicas (PVGIS, Nominatim, etc) diretamente do navegador. Não há backend próprio.
- **Compatibilidade**: Funciona em navegadores modernos. Se abrir localmente e algum recurso externo não carregar, tente hospedar em um serviço estático (Netlify, Vercel, GitHub Pages).
- **Sem build**: Não é necessário rodar `npm install`, `npm run build` ou qualquer comando.

## Deploy
- Basta subir os arquivos para Netlify, Vercel ou GitHub Pages.
- O site estará pronto para uso assim que publicado.

---

Se quiser adicionar novas funcionalidades ou estilos, basta editar os arquivos `main.js` e `styles.css`.

Dúvidas? Abra um issue ou peça ajuda!
