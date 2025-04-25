// Funções de cálculo solar
// Todos os valores em kW, kWh, €, etc.

// Exemplo de função para potência instalada
function calcularPotenciaInstalada(area, eficienciaPainel, potenciaPainel) {
    // area em m2, eficiencia em %, potenciaPainel em kW
    // Exemplo: area * eficiencia * potenciaPainel
    return area * (eficienciaPainel / 100) * potenciaPainel;
}

// Exemplo de função para produção anual
function calcularProducaoAnual(potenciaInstalada, horasSolAno) {
    // horasSolAno = horas de sol por ano
    return potenciaInstalada * horasSolAno;
}

// Exemplo de função para poupança
function calcularPoupanca(producaoAnual, precoKWh) {
    // precoKWh em €
    return producaoAnual * precoKWh;
}

// Exemplo de função para produção mensal
function calcularProducaoMensal(producaoAnual) {
    // Retorna array com produção média por mês
    const meses = 12;
    const media = producaoAnual / meses;
    return Array(meses).fill(media);
}

module.exports = {
    calcularPotenciaInstalada,
    calcularProducaoAnual,
    calcularPoupanca,
    calcularProducaoMensal
};
