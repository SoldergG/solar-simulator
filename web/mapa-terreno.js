// Mapa 3D estilo Google Earth com MapLibre GL JS + MapTiler Satellite + desenho/importação de polígono + cálculo de área (turf.js)
// Requer: maplibre-gl, @maptiler/sdk, @maptiler/geocoding-control, @turf/turf, togeojson

(function(){
  // DEBUG: Se após 2s o mapa não inicializou, mostrar mensagem de erro
  setTimeout(function() {
    var mapDiv = document.getElementById('mapa-terreno');
    if (mapDiv && !mapDiv.querySelector('canvas')) {
      mapDiv.innerHTML = '<div style="color:red;font-weight:bold;padding:16px;">Erro: O mapa não foi inicializado. Verifique a consola do navegador!</div>';
    }
  }, 2000);
  // Carregar scripts se não existirem
  function loadScript(src, cb) {
    if (document.querySelector('script[src="'+src+'"]')) { cb && cb(); return; }
    var s = document.createElement('script'); s.src = src; s.onload = cb; document.head.appendChild(s);
  }
  function loadCSS(href) {
    if (document.querySelector('link[href="'+href+'"]')) return;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
  }
  loadCSS('https://unpkg.com/maplibre-gl@3.6.1/dist/maplibre-gl.css');
  loadScript('https://unpkg.com/maplibre-gl@3.6.1/dist/maplibre-gl.js', function() {
    loadScript('https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js', function() {
      loadScript('https://unpkg.com/@maptiler/sdk@1.5.0/dist/maptiler-sdk.umd.min.js', function() {
        loadScript('https://unpkg.com/@maptiler/geocoding-control@1.1.0/dist/index.umd.js', function() {
          loadScript('https://unpkg.com/togeojson@0.16.0/dist/togeojson.js', function() {
            window.initTerrenoMap && window.initTerrenoMap();
          });
        });
      });
    });
  });
})();

window.initTerrenoMap = function() {
  var mapDiv = document.getElementById('mapa-terreno');
  if (!mapDiv) {
    alert('Erro: div #mapa-terreno não encontrado!');
    return;
  }
  mapDiv.innerHTML = '';
  if (typeof maplibregl === 'undefined') {
    mapDiv.innerHTML = '<div style="color:red;font-weight:bold;padding:16px;">Erro: MapLibre GL não carregou!</div>';
    console.error('MapLibre GL JS não está disponível.');
    return;
  }
  if (typeof turf === 'undefined') {
    mapDiv.innerHTML = '<div style="color:red;font-weight:bold;padding:16px;">Erro: turf.js não carregou!</div>';
    console.error('turf.js não está disponível.');
    return;
  }
  // MapTiler chave demo pública (limite generoso)
  var key = 'get_your_own_D6rA4zTHduk6KOKTXzGB'; // Troque por sua chave se quiser
  var map = new maplibregl.Map({
    container: 'mapa-terreno',
    style: `https://api.maptiler.com/maps/satellite/style.json?key=${key}`,
    center: [-8, 39.5],
    zoom: 6,
    pitch: 45,
    bearing: 0,
    antialias: true
  });
  map.addControl(new maplibregl.NavigationControl(), 'top-right');
  // Geocoder MapTiler
  if (window.maptilersdk && window.maptilersdk.GeocodingControl) {
    // Estilos para o mapa - Imagens de satélite mais recentes de alta resolução
    const satelliteLayer = maptilersdk.SatelliteLayer.getDefault({
      apiKey: key,
      pane: 'overlayPane',
      renderWorldCopies: false,
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 22, // Suporte para zoom mais alto para melhor visualização
      updated: new Date().getTime(), // Força o carregamento da versão mais recente das imagens
      highDPI: true // Suporte para dispositivos retina com imagens mais nítidas
    });
    // Controle de geocodificação aprimorado com corretor ortográfico e sugestões
    const geocoder = new window.maptilersdk.GeocodingControl({
      apiKey: key, // Trocar por API key real
      maplibregl,
      showResultsWhileTyping: true,
      fuzzyMatch: true, // Ativa correção ortográfica
      hotelsAndRestaurants: true, // Adiciona pontos de interesse
      autocomplete: true, // Ativa autocompletar
      proximity: [38.7223, -9.1393], // Portugal como ponto de referencia
      placeholder: 'Pesquisar endereço (com autocorreção)',
      minLength: 2, // Começa a buscar com 2 caracteres
      language: 'pt' // Interface em português
    });
    
    // Estilizar o controle de geocodificação para combinar com o tema
    const geocoderContainer = geocoder.onAdd(map);
    geocoderContainer.className = 'maplibregl-ctrl maplibregl-ctrl-geocoder maplibregl-ctrl-geocoder--custom';
    geocoderContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    geocoderContainer.style.borderRadius = '8px';
    geocoderContainer.style.border = '1px solid var(--glass-border)';
    geocoderContainer.style.background = 'var(--glass-background)';
    geocoderContainer.style.backdropFilter = 'blur(8px)';
    
    // Adicionar controle ao mapa
    const geocoderDiv = document.createElement('div');
    geocoderDiv.className = 'maplibregl-ctrl-top-right';
    geocoderDiv.appendChild(geocoderContainer);
    map.getContainer().appendChild(geocoderDiv);
  }
  // Polígono desenhado
  var drawnPolygon = null;
  var drawPoints = [];
  // Upload KML/KMZ
  var kmlInput = document.getElementById('kml-upload');
  if (kmlInput) {
    kmlInput.addEventListener('change', function(e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        var ext = file.name.split('.').pop().toLowerCase();
        var xml;
        if (ext === 'kmz') {
          // KMZ: precisa de JSZip
          if (typeof JSZip === 'undefined') {
            alert('Para importar KMZ, inclua JSZip no HTML');
            return;
          }
          JSZip.loadAsync(ev.target.result).then(function(zip) {
            var kmlFile = Object.keys(zip.files).find(function(name){return name.endsWith('.kml');});
            if (!kmlFile) return alert('KMZ inválido');
            zip.files[kmlFile].async('string').then(function(kmlText){
              xml = (new window.DOMParser()).parseFromString(kmlText, 'text/xml');
              processKML(xml);
            });
          });
        } else {
          xml = (new window.DOMParser()).parseFromString(ev.target.result, 'text/xml');
          processKML(xml);
        }
      };
      if (file.name.endsWith('.kmz')) reader.readAsArrayBuffer(file);
      else reader.readAsText(file);
    });
  }
  // Botões
  var controlsDiv = document.createElement('div');
  controlsDiv.style.cssText = 'position:absolute;top:10px;left:10px;z-index:10;background:var(--glass-background);backdrop-filter:blur(var(--vision-blur));padding:10px 14px;border-radius:var(--card-radius);border:1px solid var(--glass-border);box-shadow:var(--glass-shadow);display:flex;gap:10px;align-items:center;';
  // Desenhar
  var btnDraw = document.createElement('button');
  btnDraw.textContent = 'Desenhar terreno';
  btnDraw.style.cssText = 'background:var(--accent-primary);color:white;border:none;border-radius:var(--input-radius);padding:8px 12px;cursor:pointer;font-weight:500;transition:var(--transition-fast);box-shadow:0 2px 6px rgba(59,130,246,0.2);';
  btnDraw.onmouseover = function() { this.style.background = 'var(--accent-secondary)'; this.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)'; };
  btnDraw.onmouseout = function() { this.style.background = 'var(--accent-primary)'; this.style.boxShadow = '0 2px 6px rgba(59,130,246,0.2)'; };
  btnDraw.onclick = function() {
    drawPoints = [];
    if (drawnPolygon) { map.removeLayer('terreno'); map.removeSource('terreno'); drawnPolygon = null; }
    map.getCanvas().style.cursor = 'crosshair';
    map.once('click', function addPoint(e) {
      drawPoints.push([e.lngLat.lng, e.lngLat.lat]);
      var marker = new maplibregl.Marker({color:'#3b82f6'}).setLngLat(e.lngLat).addTo(map);
      if (drawPoints.length > 2) {
        if (drawnPolygon) { map.removeLayer('terreno'); map.removeSource('terreno'); }
        map.addSource('terreno', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[...drawPoints, drawPoints[0]]] } } });
        map.addLayer({ id: 'terreno', type: 'fill', source: 'terreno', paint: { 'fill-color': 'var(--accent-primary)', 'fill-opacity': 0.25 } });
        map.addLayer({ id: 'terreno-borda', type: 'line', source: 'terreno', paint: { 'line-color': 'var(--accent-secondary)', 'line-width': 3, 'line-opacity': 0.9, 'line-dasharray': [3, 2] } });
        drawnPolygon = true;
      }
      if (drawPoints.length < 10) map.once('click', addPoint);
      else map.getCanvas().style.cursor = '';
    });
  };
  controlsDiv.appendChild(btnDraw);
  // Importar KML
  var inputKML = document.createElement('input');
  inputKML.type = 'file';
  inputKML.accept = '.kml,.kmz';
  inputKML.style.display = 'none';
  var btnKML = document.createElement('button');
  btnKML.textContent = 'Importar KML';
  btnKML.style.cssText = 'background:var(--accent-secondary);color:white;border:none;border-radius:var(--input-radius);padding:8px 12px;cursor:pointer;font-weight:500;transition:var(--transition-fast);box-shadow:0 2px 6px rgba(99,102,241,0.2);';
  btnKML.onmouseover = function() { this.style.background = 'var(--accent-tertiary)'; this.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)'; };
  btnKML.onmouseout = function() { this.style.background = 'var(--accent-secondary)'; this.style.boxShadow = '0 2px 6px rgba(99,102,241,0.2)'; };
  btnKML.onclick = function() { inputKML.click(); };
  inputKML.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      var parser = new DOMParser();
      var kml = parser.parseFromString(ev.target.result, 'text/xml');
      var geojson = toGeoJSON.kml(kml);
      if (drawnPolygon) { map.removeLayer('terreno'); map.removeSource('terreno'); drawnPolygon = null; }
      map.addSource('terreno', { type: 'geojson', data: geojson });
      map.addLayer({ id: 'terreno', type: 'fill', source: 'terreno', paint: { 'fill-color': 'var(--accent-primary)', 'fill-opacity': 0.25 } });
      map.addLayer({ id: 'terreno-borda', type: 'line', source: 'terreno', paint: { 'line-color': 'var(--accent-secondary)', 'line-width': 3, 'line-opacity': 0.9, 'line-dasharray': [3, 2] } });
      map.fitBounds(turf.bbox(geojson), {padding:30});
      var area = turf.area(geojson);
      
      // Calcular o centro do polígono
      var center = turf.centroid(geojson);
      var longitude = center.geometry.coordinates[0];
      var latitude = center.geometry.coordinates[1];
      
      window.dispatchEvent(new CustomEvent('terreno-kml', {
        detail:{
          area,
          geojson,
          center: {
            latitude,
            longitude
          }
        }
      }));
    };
    reader.readAsText(file);
  };
  controlsDiv.appendChild(btnKML);
  controlsDiv.appendChild(inputKML);
  // Calcular área do polígono desenhado e obter centro
  map.on('click', function() {
    if (drawPoints.length > 2) {
      var poly = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[...drawPoints, drawPoints[0]]] } };
      var area = turf.area(poly);
      
      // Calcular o centro do polígono
      var center = turf.centroid(poly);
      var longitude = center.geometry.coordinates[0];
      var latitude = center.geometry.coordinates[1];
      
      window.dispatchEvent(new CustomEvent('terreno-kml', {
        detail:{
          area,
          geojson: poly,
          center: {
            latitude,
            longitude
          }
        }
      }));
    }
  });
  mapDiv.appendChild(controlsDiv);
};
