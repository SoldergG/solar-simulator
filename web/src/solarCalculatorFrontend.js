// Funções de cálculo solar (frontend)
// Todos os valores em kW, kWh, €, etc.

export function calcularPotenciaInstalada(area, eficienciaPainel, potenciaPainel) {
    // area em m2, eficiencia em %, potenciaPainel em kW
    return area * (eficienciaPainel / 100) * potenciaPainel;
}

export function calcularProducaoAnual(potenciaInstalada, horasSolAno) {
    return potenciaInstalada * horasSolAno;
}

export function calcularPoupanca(producaoAnual, precoKWh) {
    return producaoAnual * precoKWh;
}

export function calcularProducaoMensal(producaoAnual) {
    const meses = 12;
    const media = producaoAnual / meses;
    return Array(meses).fill(media);
}
