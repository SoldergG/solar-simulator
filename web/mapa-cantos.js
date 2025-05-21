// Script para mapa de seleção dos 4 cantos do terreno - Vision OS Style
// Usa Leaflet com MapTiler e comunica com main.js via window events
// Usa turf.js para área precisa e geocoder para pesquisa

(function() {
  // Verificar dependências necessárias
  if (!window.L || typeof turf === 'undefined') {
    console.error('Leaflet ou turf.js não estão carregados. O mapa não funcionará corretamente.');
    return;
  }
  
  let map, polygon, markers = [], points = [], areaInfo, polyPoints = [];
  let modoMaisPontos = false; // Controla se está no modo de mais de 4 pontos
  let dadosSolares = null; // Armazenar dados de exposição solar e inclinação
  
  // Usar OpenStreetMap como fonte principal (não requer chave API)
  // Se precisar de MapTiler no futuro, registre uma chave em https://www.maptiler.com/cloud/
  const useOpenStreetMap = true; // Forçar uso do OpenStreetMap que não precisa de chave
  
  // Calcular área do polígono com turf.js (preciso)
  function calcularAreaPoligono(pontos) {
    console.log('Calculando área para pontos:', pontos);
    if (pontos.length < 3) {
      console.log('Não há pontos suficientes para formar um polígono');
      return 0;
    }
    // turf espera [lng, lat]
    try {
      const coordsArray = [...pontos.map(p => [p.lng, p.lat])];
      console.log('Coordenadas para cálculo de área:', coordsArray);
      
      // Fechar o polígono adicionando o primeiro ponto novamente
      if (coordsArray[0][0] !== coordsArray[coordsArray.length-1][0] || 
          coordsArray[0][1] !== coordsArray[coordsArray.length-1][1]) {
        coordsArray.push(coordsArray[0]);
        console.log('Polígono fechado adicionando o primeiro ponto novamente');
      }
      
      const turfPoly = turf.polygon([coordsArray]);
      const area = turf.area(turfPoly); // metros quadrados
      console.log('Área calculada com sucesso:', area, 'm²');
      return area;
    } catch (e) {
      console.error('Erro ao calcular área:', e);
      // Calcular área aproximada como fallback
      try {
        // Método alternativo para calcular área aproximada
        let area = 0;
        for (let i = 0; i < pontos.length; i++) {
          const j = (i + 1) % pontos.length;
          area += pontos[i].lng * pontos[j].lat;
          area -= pontos[j].lng * pontos[i].lat;
        }
        area = Math.abs(area) * 111319.9 * 111319.9 / 2; // Conversão aproximada para metros quadrados
        console.log('Área calculada pelo método alternativo:', area, 'm²');
        return area;
      } catch (fallbackError) {
        console.error('Erro no cálculo alternativo de área:', fallbackError);
        return 1000; // Valor padrão em caso de erro (1000 m²)
      }
    }
  }
  
  // Obter dados de exposição solar e inclinação do terreno da API PVGIS
  async function obterDadosSolares(latitude, longitude) {
    try {
      console.log('Obtendo dados solares para:', latitude, longitude);
      
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
      
      // Estimar inclinação ótima (geralmente próxima à latitude)
      const inclinacaoOtima = Math.round(Math.abs(latitude));
      
      // Criar dados mensais estimados
      const dadosMensais = Array(12).fill(0).map((_, i) => ({
        mes: i + 1,
        radiacao: horasSolAno / 12 // Distribuição uniforme ao longo do ano
      }));
      
      console.log('Dados solares estimados:', { horasSolAno, inclinacaoOtima });
      
      return {
        horasSolAno,
        inclinacaoOtima,
        dadosMensais,
        latitude,
        longitude
      };
      
    } catch (error) {
      console.error('Erro ao obter dados solares:', error);
      // Retornar valores padrão em caso de erro
      return {
        horasSolAno: 1600,
        inclinacaoOtima: 30,
        dadosMensais: Array(12).fill(0).map((_, i) => ({
          mes: i + 1,
          radiacao: 133 // ~1600/12
        })),
        latitude,
        longitude
      };
    }
  }
  
  // Atualizar painel de informações de área
  function atualizarAreaInfo() {
    if (!areaInfo) return;
    
    // Texto para o limite de pontos
    const limitePontos = modoMaisPontos ? 'Multiplos' : '4';
    const textoSelecao = modoMaisPontos ? 'Selecione pontos no mapa' : 'Selecione até 4 pontos no mapa';
    
    if (points.length < 3) {
      areaInfo.innerHTML = `
        <div style="font-weight:500;margin-bottom:6px;color:var(--text-primary);">Terreno</div>
        <div style="color:var(--text-secondary);">${textoSelecao}</div>
        <div style="display:flex;justify-content:space-between;margin-top:6px;">
          <span style="color:var(--text-secondary);">Pontos:</span>
          <span style="font-weight:500;color:var(--text-primary);">${points.length}${modoMaisPontos ? '' : '/4'}</span>
        </div>
      `;
      areaInfo.style.display = 'block';
      return;
    }
    
    // Calcular a área se tivermos 3 ou mais pontos
    const areaEmMetros = calcularAreaPoligono(points);
    const areaEmHectares = areaEmMetros / 10000;
    
    console.log('Atualizando exibição da área:', areaEmMetros.toFixed(2), 'm²');
    
    // Formatar os números para exibição
    const areaFormatada = areaEmMetros.toLocaleString('pt-BR', {maximumFractionDigits: 2});
    const hectaresFormatados = areaEmHectares.toLocaleString('pt-BR', {maximumFractionDigits: 4});
    
    areaInfo.innerHTML = `
      <div style="font-weight:500;margin-bottom:6px;color:var(--text-primary);">Terreno Selecionado</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="color:var(--text-secondary);">Área total:</span>
        <span style="font-weight:500;color:var(--text-primary);">${areaFormatada} m²</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="color:var(--text-secondary);">Hectares:</span>
        <span style="font-weight:500;color:var(--text-primary);">${hectaresFormatados} ha</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;">
        <span style="color:var(--text-secondary);">Pontos:</span>
        <span style="font-weight:500;color:var(--text-primary);">${points.length}${modoMaisPontos ? '' : '/4'}</span>
      </div>
    `;
    
    // Disparar um evento personalizado para notificar que a área foi atualizada
    // Isso ajuda a garantir que o componente principal seja notificado mesmo se
    // houver problemas com o evento terreno-cantos
    const areaAtualizadaEvento = new CustomEvent('area-atualizada', {
      detail: {
        area: areaEmMetros,
        hectares: areaEmHectares.toFixed(4),
        pontos: points.map(p => ({lat: p.lat, lng: p.lng}))
      }
    });
    console.log('Disparando evento area-atualizada:', areaEmMetros);
    window.dispatchEvent(areaAtualizadaEvento);
    
    areaInfo.style.display = 'block';
  }
  
  // Criar ícone SVG personalizado para marcadores
  function criarIconePersonalizado(index) {
    return L.divIcon({
      html: `<div style="
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.9);
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
      ">${index + 1}</div>`,
      className: 'marker-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  }
  
  // Remover um marcador específico por índice
  function removerPonto(index) {
    if (index >= 0 && index < markers.length) {
      // Remover marcador do mapa
      if (markers[index]) map.removeLayer(markers[index]);
      
      // Remover ponto e marcador das arrays
      markers.splice(index, 1);
      points.splice(index, 1);
      
      // Recriação dos marcadores com índices atualizados
      for (let i = 0; i < markers.length; i++) {
        if (markers[i]) map.removeLayer(markers[i]);
        markers[i] = L.marker(points[i], {icon: criarIconePersonalizado(i)}).addTo(map);
        
        // Adicionar popup ao marcador
        markers[i].bindPopup(`
          <div style="text-align:center;">
            <div style="font-weight:bold;margin-bottom:5px;">Ponto ${i+1}</div>
            <button class="delete-marker btn-danger" data-index="${i}" style="
              background:var(--accent-danger);
              color:white;
              border:none;
              border-radius:var(--input-radius);
              padding:4px 10px;
              cursor:pointer;
              font-size:12px;
              transition:var(--transition-fast);
              box-shadow:0 2px 6px rgba(0,0,0,0.1);
            ">Remover</button>
          </div>
        `);
        
        markers[i].on('popupopen', function() {
          setTimeout(() => {
            const deleteBtn = document.querySelector(`.delete-marker[data-index="${i}"]`);
            if (deleteBtn) {
              deleteBtn.addEventListener('click', function() {
                removerPonto(parseInt(this.getAttribute('data-index')));
              });
            }
          }, 10);
        });
      }
      
      // Atualizar polígono se tiver pelo menos 3 pontos
      if (polygon) map.removeLayer(polygon);
      if (points.length >= 3) {
        polygon = L.polygon(points, {color: '#3b82f6', fillOpacity: 0.15, weight: 2}).addTo(map);
      } else {
        polygon = null;
      }
      
      // Atualizar informações de área
      atualizarAreaInfo();
      
      // Disparar evento se tivermos exatamente 4 pontos
      if (points.length === 4) {
        const area = calcularAreaPoligono(points);
        window.dispatchEvent(new CustomEvent('terreno-cantos', {
          detail: {
            pontos: points.map(p => ({lat: p.lat, lng: p.lng})),
            area: area
          }
        }));
      }
    }
  }
  
  // Inicializar o mapa com opções modernas
  function initMap() {
    if (map) return; // Evitar inicialização duplicada
    
    // Inicializar o mapa com opções modernas
    map = L.map('mapa-cantos', {
      center: [39.5, -8], // Centro em Portugal
      zoom: 8, // Aumentado o zoom inicial
      zoomControl: false, // Vamos adicionar os controles em uma posição personalizada
      attributionControl: false,
      doubleClickZoom: false, // Desabilitar zoom com duplo clique
      scrollWheelZoom: true,
      fadeAnimation: true,
      zoomAnimation: true
    });
    
    // Adicionar controle de zoom em uma posição melhor
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);
    
    // Usar OpenStreetMap como fonte principal (não requer chave API)
    let tileLayer;
    
    // Usar OpenStreetMap (gratuito e sem necessidade de chave API)
    tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      minZoom: 2
    });
    
    // Opção alternativa: Esri World Imagery (satélite gratuito)
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19,
      minZoom: 2
    });
    
    // Adicionar controle de camadas para alternar entre mapa normal e satélite
    const baseMaps = {
      "Mapa": tileLayer,
      "Satélite": satelliteLayer
    };
    // Adicionar a camada base (OpenStreetMap) ao mapa
    tileLayer.addTo(map);
    
    // Adicionar controle de camadas para permitir alternar entre mapa normal e satélite
    L.control.layers(baseMaps, {}, {
      position: 'topright',
      collapsed: false
    }).addTo(map);
    
    // Adicionar controle de geocoding para pesquisa de endereços
    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false,
      position: 'topleft',
      placeholder: 'Pesquisar endereço...',
      errorMessage: 'Nada encontrado.',
      geocoder: L.Control.Geocoder.nominatim({
        geocodingQueryParams: { countrycodes: 'pt,es' } // Priorizar Portugal e Espanha
      })
    }).addTo(map);
    
    // Personalizar o estilo do controle de pesquisa
    setTimeout(() => {
      const geocoderContainer = document.querySelector('.leaflet-control-geocoder');
      if (geocoderContainer) {
        geocoderContainer.style.cssText = 'border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);';
      }
    }, 100);
    
    // Quando um resultado for clicado, vá para o local
    geocoder.on('markgeocode', function(e) {
      const latLng = e.geocode.center;
      map.setView(latLng, 16); // Zoom mais próximo para o endereço
    });
    
    // Adicionar painel de informações de área (janelinha flutuante)
    areaInfo = document.createElement('div');
    areaInfo.className = 'glass-panel'; // Usar estilo Vision OS
    areaInfo.style.cssText = `
      position:absolute;
      bottom:20px;
      left:20px;
      width:240px;
      padding:16px;
      z-index:1000;
      border-radius:12px;
      font-size:14px;
    `;
    areaInfo.innerHTML = `
      <div style="font-weight:500;margin-bottom:6px;color:var(--text-primary);">Terreno</div>
      <div style="color:var(--text-secondary);">Selecione até 4 pontos no mapa</div>
    `;
    map.getContainer().appendChild(areaInfo);
    
    // Adicionar botões de controle (estilo Vision OS)
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'glass-panel';
    controlsDiv.style.cssText = `
      position:absolute;
      top:20px;
      right:20px;
      z-index:1000;
      border-radius:12px;
      padding:12px;
      display:flex;
      flex-direction:column;
      gap:10px;
    `;
    
    // Botão para limpar todos os pontos
    const clearButton = document.createElement('button');
    clearButton.className = 'multi-point-button'; // Usar estilo Vision OS
    clearButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      Limpar Todos os Pontos
    `;
    clearButton.style.cssText = `
      display:flex;
      align-items:center;
      justify-content:center;
      background: linear-gradient(135deg, rgba(244, 67, 54, 0.9), rgba(229, 57, 53, 1));
      color: white;
      font-weight: 600;
      border: none;
      box-shadow: 0 4px 16px rgba(244, 67, 54, 0.3);
      transition: all 0.3s cubic-bezier(.4,2.2,.2,1);
    `;
    clearButton.onmouseover = function() {
      this.style.transform = 'translateY(-2px) scale(1.03)';
      this.style.boxShadow = '0 8px 24px rgba(244, 67, 54, 0.4)';
    };
    clearButton.onmouseout = function() {
      this.style.transform = '';
      this.style.boxShadow = '0 4px 16px rgba(244, 67, 54, 0.3)';
    };
    clearButton.onclick = function(e) {
      e.stopPropagation(); // Prevent click from reaching the map
      // Adicionar efeito visual ao clicar
      this.classList.add('animate-shimmer');
      setTimeout(() => this.classList.remove('animate-shimmer'), 800);
      resetMap();
    };
    // Prevent map click events from propagating through the button
    L.DomEvent.disableClickPropagation(clearButton);
    controlsDiv.appendChild(clearButton);
    map.getContainer().appendChild(controlsDiv);
    
    // Adicionar botão para concluir seleção (visível apenas no modo de mais de 4 pontos)
    const concluirBtn = document.createElement('button');
    concluirBtn.className = 'multi-point-button animate-pulse';
    concluirBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Concluir Seleção
    `;
    concluirBtn.style.cssText = `
      display:none;
      align-items:center;
      justify-content:center;
      margin-top:10px;
      background: linear-gradient(135deg, rgba(76, 175, 80, 0.9), rgba(56, 142, 60, 1));
      color: white;
      font-weight: 600;
      border: none;
      box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
      transition: all 0.3s cubic-bezier(.4,2.2,.2,1);
    `;
    concluirBtn.onmouseover = function() {
      this.style.transform = 'translateY(-2px) scale(1.03)';
      this.style.boxShadow = '0 8px 24px rgba(76, 175, 80, 0.4)';
    };
    concluirBtn.onmouseout = function() {
      this.style.transform = '';
      this.style.boxShadow = '0 4px 16px rgba(76, 175, 80, 0.3)';
    };
    concluirBtn.onclick = function(e) {
      e.stopPropagation(); // Evitar que o clique chegue ao mapa
      if (points.length >= 3) {
        // Adicionar efeito visual ao clicar
        this.classList.add('animate-shimmer');
        setTimeout(() => this.classList.remove('animate-shimmer'), 1000);
        
        const area = calcularAreaPoligono(points);
        window.dispatchEvent(new CustomEvent('terreno-cantos', {
          detail: {
            pontos: points.map(p => ({lat: p.lat, lng: p.lng})),
            area: area
          }
        }));
      } else {
        alert('Selecione pelo menos 3 pontos para formar um polígono válido.');
      }
    };
    // Prevenir eventos de clique do mapa de se propagarem pelo botão
    L.DomEvent.disableClickPropagation(concluirBtn);
    controlsDiv.appendChild(concluirBtn);
    
    // Adicionar manipulador de clique para adicionar pontos no mapa
    map.on('click', function(e) {
      // Verificar se podemos adicionar mais pontos
      if (modoMaisPontos || points.length < 4) {
        // Adicionar o ponto à lista
        points.push(e.latlng);
        
        // Criar e adicionar marcador com um ícone personalizado
        const index = points.length - 1;
        const marker = L.marker(e.latlng, {
          icon: criarIconePersonalizado(index)
        }).addTo(map);
        
        // Adicionar popup ao marcador com botão para excluir
        marker.bindPopup(`
          <div style="text-align:center;">
            <div style="font-weight:bold;margin-bottom:5px;">Ponto ${index+1}</div>
            <button class="delete-marker" data-index="${index}" style="
              background:#f44336;
              color:white;
              border:none;
              border-radius:4px;
              padding:3px 8px;
              cursor:pointer;
              font-size:12px;
            ">Remover</button>
          </div>
        `);
        
        // Adicionar evento para o botão de exclusão no popup
        marker.on('popupopen', function() {
          setTimeout(() => {
            const deleteBtn = document.querySelector(`.delete-marker[data-index="${index}"]`);
            if (deleteBtn) {
              deleteBtn.addEventListener('click', function() {
                removerPonto(parseInt(this.getAttribute('data-index')));
              });
            }
          }, 10);
        });
        
        markers.push(marker);
        
        // Atualizar o polígono se tivermos pelo menos 3 pontos
        if (polygon) map.removeLayer(polygon);
        if (points.length >= 3) {
          polygon = L.polygon(points, {
            color: '#3b82f6', 
            fillOpacity: 0.15, 
            weight: 2
          }).addTo(map);
        }
        
        // Atualizar informações de área
        atualizarAreaInfo();
        
        // Mostrar ou esconder o botão de concluir
        concluirBtn.style.display = modoMaisPontos && points.length >= 3 ? 'flex' : 'none';
        
        // Disparar evento quando tivermos pontos suficientes
        if (points.length >= 3) {
          const area = calcularAreaPoligono(points);
          console.log('Área calculada para envio:', area);
          
          // Calcular o centro do polígono para obter dados solares
          // Criar uma cópia dos pontos e garantir que o polígono esteja fechado (primeiro e último pontos iguais)
          let coordsArray = points.map(p => [p.lng, p.lat]);
          let centroLat, centroLng; // Declarar as variáveis fora do bloco try/catch
          
          // Verificar se o polígono está fechado (primeiro e último pontos iguais)
          if (coordsArray[0][0] !== coordsArray[coordsArray.length-1][0] || 
              coordsArray[0][1] !== coordsArray[coordsArray.length-1][1]) {
            // Fechar o polígono adicionando o primeiro ponto novamente
            coordsArray.push(coordsArray[0]);
          }
          
          try {
            const turfPoly = turf.polygon([coordsArray]);
            const centro = turf.center(turfPoly);
            centroLat = centro.geometry.coordinates[1];
            centroLng = centro.geometry.coordinates[0];
          } catch (error) {
            console.error('Erro ao criar polígono ou calcular centro:', error);
            // Calcular o centro manualmente como fallback
            let sumLat = 0, sumLng = 0;
            points.forEach(p => {
              sumLat += p.lat;
              sumLng += p.lng;
            });
            centroLat = sumLat / points.length;
            centroLng = sumLng / points.length;
          }
          
          console.log('Centro calculado:', { centroLat, centroLng });
          
          // Sempre enviar o evento, mesmo se não tivermos exatamente 4 pontos
          // Isso garante que a área seja atualizada conforme o usuário adiciona pontos
          
          // Obter dados solares e então disparar o evento com todos os dados
          obterDadosSolares(centroLat, centroLng).then(dados => {
            dadosSolares = dados;
            const hectares = (area / 10000).toFixed(4);
            
            console.log('Disparando evento terreno-cantos com área:', area);
            // Disparar evento com todos os dados
            window.dispatchEvent(new CustomEvent('terreno-cantos', {
              detail: {
                pontos: points.map(p => ({lat: p.lat, lng: p.lng})),
                area: area,
                hectares: hectares,
                center: {
                  latitude: centroLat,
                  longitude: centroLng
                },
                dadosSolares: dados
              }
            }));
          }).catch(error => {
            console.error('Erro ao obter dados solares:', error);
            const hectares = (area / 10000).toFixed(4);
            
            console.log('Disparando evento terreno-cantos sem dados solares, área:', area);
            // Disparar evento mesmo sem dados solares
            window.dispatchEvent(new CustomEvent('terreno-cantos', {
              detail: {
                pontos: points.map(p => ({lat: p.lat, lng: p.lng})),
                area: area,
                hectares: hectares,
                center: {
                  latitude: centroLat,
                  longitude: centroLng
                }
              }
            }));
          });
        }
      }
    });
  }
  
  // Resetar o mapa e limpar todos os pontos
  function resetMap() {
    if (!map) return;
    
    // Remover todos os marcadores
    markers.forEach(marker => {
      if (marker) map.removeLayer(marker);
    });
    markers = [];
    
    // Remover polígono
    if (polygon) { 
      map.removeLayer(polygon); 
      polygon = null; 
    }
    
    // Limpar pontos
    points = [];
    
    // Atualizar informações de área
    atualizarAreaInfo();
    
    // Disparar evento para atualizar a área no componente principal
    window.dispatchEvent(new CustomEvent('terreno-cantos', {
      detail: {
        pontos: [],
        area: 0,
        hectares: 0,
        center: null,
        dadosSolares: null
      }
    }));
  }
  
  // Adicionar listeners para eventos externos
  window.addEventListener('marcar-cantos', function() {
    resetMap();
    setTimeout(initMap, 100);
  });
  
  window.addEventListener('reset-cantos', resetMap);
  
  // Listener para alternar entre modos de seleção (4 pontos ou mais pontos)
  window.addEventListener('modo-selecao', function(e) {
    if (e.detail && typeof e.detail.modo === 'string') {
      modoMaisPontos = e.detail.modo === 'mapaMaisPontos';
      resetMap();
      setTimeout(() => {
        initMap();
        atualizarAreaInfo();
      }, 100);
    }
  });
  
  // Inicializar mapa automaticamente
  setTimeout(initMap, 300);
})();
