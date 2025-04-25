# Simulador Solar • Vision OS Style

Simulador para cálculo de energia solar fotovoltaica com interface moderna no estilo Vision OS, mapa interativo e cálculos precisos.

## Características

✅ Design Vision OS com efeitos de vidro e transparência  
✅ Mapa interativo para seleção da localização  
✅ Alternância entre modo claro e escuro  
✅ Cálculo automático da inclinação com base na latitude  
✅ Catálogo de painéis solares com especificações  
✅ Gráficos de produção mensal  
✅ Integração com API PVGIS para dados reais  
✅ Busca de endereços no mapa  

## Estrutura do Projeto

O projeto está organizado em 3 partes:

- `/web` - Frontend em React + Vite + Tailwind CSS com design Vision OS
- `/api` - API em Node.js + Express para cálculos
- `/shared` - Funções compartilhadas de cálculo solar

## Instalação e Execução

### 1. Backend (API)

```bash
cd api
npm install
node index.js
```

### 2. Frontend (Web)

```bash
cd web
npm install
npm run dev
```

## Como Usar

> **Importante:**
> O comando `npm run dev:all` deve ser executado dentro da pasta `/web`.
>
> Se você estiver na raiz do projeto, use:
> ```bash
> cd web
> npm run dev:all
> ```


1. **Selecione o Tipo de Painel**: Escolha entre diferentes tecnologias (monocristalino, policristalino, etc.)
2. **Indique a Localização**: Use o mapa interativo ou busque um endereço para definir o local da instalação
3. **Defina a Área Disponível**: Indique quantos metros quadrados estão disponíveis para instalação
4. **A inclinação será calculada automaticamente** baseada na latitude para maximizar a produção energética
5. **Clique em "Calcular Produção"** para ver resultados detalhados com gráficos

## Acessos

- Frontend: http://localhost:5173
- API: http://localhost:3001

## Tecnologias Usadas

- **Frontend**: React, Vite, Tailwind CSS, Leaflet (mapas), Chart.js (gráficos)
- **Backend**: Node.js, Express
- **Dados solares**: API PVGIS (European Commission Joint Research Centre)
