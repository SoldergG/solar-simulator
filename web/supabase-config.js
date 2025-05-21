// Configuração do Supabase para autenticação
// IMPORTANTE: Substitua os valores abaixo pelas suas chaves reais do Supabase
// 1. Crie uma conta em https://supabase.com/
// 2. Crie um novo projeto
// 3. Vá para Settings > API no menu lateral
// 4. Copie a URL e a chave anônima (anon public) para os campos abaixo
const supabaseConfig = {
  // URL da sua instância Supabase
  SUPABASE_URL: 'https://pqigrlarpectxbxipajw.supabase.co',
  // Chave pública anônima (segura para usar no frontend)
  // Encontrada em Settings > API > Project API keys > anon public
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxaWdybGFycGVjdHhieGlwYWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1OTQ5NjQsImV4cCI6MjA2MzE3MDk2NH0.mxkaK7ioLQWYolLYq2fAMGUT0XbsbJlCBIxQYqm7RtY',
  
  // Configurações de autenticação
  auth: {
    // Redirecionamento após login bem-sucedido
    redirectTo: window.location.origin + '/index.html',
    // Tempo de expiração da sessão (em segundos) - 7 dias
    expiryTime: 60 * 60 * 24 * 7,
    // Persistência da sessão
    persistSession: true,
    // Detecção automática de sessão
    autoRefreshToken: true,
    // Detecção de mudanças de sessão
    detectSessionInUrl: true
  }
};

// Exporta a configuração para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = supabaseConfig;
} else {
  window.supabaseConfig = supabaseConfig;
}
