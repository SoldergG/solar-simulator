const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const solar = require('../shared/solarCalculator');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

app.post('/calcular', async (req, res) => {
    const { area, inclinacao, horasSolAno, eficienciaPainel, potenciaPainel, precoKWh, latitude, longitude } = req.body;
    let horasSol = Number(horasSolAno);

    // Se houver coordenadas, buscar dados ao PVGIS
    if (latitude && longitude) {
        try {
            // PVGIS: dados anuais de produção (kWh/kWp)
            const url = `https://re.#jrc.ec.europa.eu/api/v5_2/PVcalc?lat=${latitude}&lon=${longitude}&peakpower=1&loss=14&outputformat=json`;
            const resp = await fetch(url);
            const data = await resp.json();
            // Pega produção anual específica (kWh/kWp)
            if (data && data.outputs && data.outputs.totals && data.outputs.totals.fixed) {
                horasSol = data.outputs.totals.fixed.E_y; // kWh/kWp/ano
            }
        } catch (e) {
            console.error('Erro ao buscar PVGIS:', e);
        }
    }

    // Cálculos básicos
    const potenciaInstalada = solar.calcularPotenciaInstalada(area, eficienciaPainel, potenciaPainel);
    // Se usou PVGIS, horasSol é produção anual por kWp, multiplica pela potência instalada
    const producaoAnual = latitude && longitude ? potenciaInstalada * horasSol : solar.calcularProducaoAnual(potenciaInstalada, horasSol);
    const poupanca = solar.calcularPoupanca(producaoAnual, precoKWh);
    const producaoMensal = solar.calcularProducaoMensal(producaoAnual);
    res.json({ potenciaInstalada, producaoAnual, poupanca, producaoMensal });
});

app.listen(PORT, () => {
    console.log(`API a correr em http://localhost:${PORT}`);
});
