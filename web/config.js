// Configurações do servidor e credenciais
// Importação do Supabase (será carregado via CDN no HTML)
// Inicialização do cliente Supabase
let supabaseClient = null;

// Função para inicializar o cliente Supabase
function initSupabase() {
  if (typeof supabase !== 'undefined' && window.supabaseConfig) {
    supabaseClient = supabase.createClient(
      window.supabaseConfig.SUPABASE_URL,
      window.supabaseConfig.SUPABASE_KEY,
      {
        auth: window.supabaseConfig.auth
      }
    );
    console.log('Supabase client inicializado');
    return supabaseClient;
  } else {
    console.warn('Supabase não está disponível ou não está configurado');
    return null;
  }
}

// Configuração principal do aplicativo
const config = {
  // Credenciais de usuários para demonstração - estes são os únicos que funcionam no modo demonstração
  users: [
    {
      id: 'demo1',
      email: 'demo@solarsim.com',
      password: 'demo123',
      name: 'Usuário Demo',
      avatar: 'D',
      type: 'demo',
      registrationDate: '2023-01-01T00:00:00.000Z',
      lastLogin: new Date().toISOString()
    },
    {
      id: 'admin1',
      email: 'admin@solarsim.com',
      password: 'admin123',
      name: 'Administrador',
      avatar: 'A',
      type: 'admin',
      registrationDate: '2023-01-01T00:00:00.000Z',
      lastLogin: new Date().toISOString()
    }
  ],
  
  // Configurações do servidor
  server: {
    apiUrl: 'https://meteo-mapa-api.netlify.app/.netlify/functions/api',
    weatherApiKey: 'demo_key_123456',
    // Chave API segura do MapTiler (gratuita para uso público)
    mapTilerApiKey: 'jvSusSYXzlB0Qg0YEpFo'
  },
  
  // Configurações do aplicativo
  app: {
    name: 'SolarSim',
    version: '1.0.0',
    defaultTheme: 'light',
    autoLogin: false, // Desativa o login automático por padrão
    testMode: false, // Desativa o modo de teste para usar a autenticação real
    localStorageEnabled: true, // Verificado na inicialização para garantir que o armazenamento local funcione
    cookiesEnabled: true // Verificado na inicialização para garantir que cookies funcionem
  },
  
  // Painéis solares disponíveis
  solarPanels: [
    {
      id: 'monocristalino',
      name: 'Monocristalino',
      icon: '☀️',
      color: '#3b82f6',
      efficiency: 21,
      range: '18% – 23%',
      description: 'Alta eficiência e durabilidade, ideal para espaços limitados.',
      performance: {
        solarRadiation: 0.95, // Eficiência com radiação solar
        temperature: 0.90, // Resistência a altas temperaturas
        lifetime: 30 // Anos de vida útil
      }
    },
    {
      id: 'perc',
      name: 'PERC (monopremium)',
      efficiency: 22,
      range: '20% – 24%',
      color: '#8b5cf6',
      description: 'Tecnologia avançada com melhor desempenho em condições de pouca luz.',
      icon: '🔆'
    },
    {
      id: 'bifacial',
      name: 'Bifacial',
      efficiency: 21,
      range: '19% – 23% + 10-20%',
      color: '#ec4899',
      description: 'Captura luz de ambos os lados, aumentando a produção em até 20%.',
      icon: '⚡'
    },
    {
      id: 'policristalino',
      name: 'Policristalino',
      efficiency: 17,
      range: '15% – 18%',
      color: '#10b981',
      description: 'Boa relação custo-benefício, ideal para grandes instalações.',
      icon: '🌞'
    },
    {
      id: 'filme-fino',
      name: 'Filme Fino',
      efficiency: 12,
      range: '10% – 13%',
      color: '#f59e0b',
      description: 'Flexível e leve, ideal para superfícies curvas ou aplicações especiais.',
      icon: '📱'
    }
  ]
};

// Exporta a configuração para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} else {
  window.appConfig = config;
}

// ----- Funções de gerenciamento de usuários -----

// Verifica se o armazenamento local está disponível
window.isStorageAvailable = function(type) {
  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
};

// Inicializa o sistema de armazenamento ao carregar
(function() {
  if (typeof window !== 'undefined') {
    // Verifica se o localStorage está disponível
    window.appConfig.app.localStorageEnabled = window.isStorageAvailable('localStorage');
    console.log('LocalStorage disponível:', window.appConfig.app.localStorageEnabled);
    
    // Inicializa a lista de usuários registrados se não existir
    if (window.appConfig.app.localStorageEnabled) {
      try {
        if (!localStorage.getItem('registeredUsers')) {
          localStorage.setItem('registeredUsers', JSON.stringify([]));
        }
      } catch (e) {
        console.error('Erro ao inicializar armazenamento:', e);
      }
    }
  }
})();

// Função helper para verificar se o usuário está logado
window.isUserLoggedIn = function() {
  // Se o modo de teste estiver ativado, considera logado para fins de demonstração
  if (window.appConfig.app.testMode) return true;
  
  // Verifica primeiro no sessionStorage (sessão atual)
  if (sessionStorage.getItem('currentUser')) return true;
  
  // Se não encontrou na sessão, tenta recuperar do localStorage
  if (window.appConfig.app.localStorageEnabled && localStorage.getItem('lastLoggedUser')) {
    // Recupera o usuário e salva na sessão atual
    try {
      const savedUser = JSON.parse(localStorage.getItem('lastLoggedUser'));
      if (savedUser) {
        sessionStorage.setItem('currentUser', JSON.stringify(savedUser));
        return true;
      }
    } catch (e) {
      console.error('Erro ao recuperar usuário do localStorage:', e);
    }
  }
  
  return false;
};

// Obtém o usuário atual
window.getCurrentUser = function() {
  // Se estiver no modo de teste e não houver usuário logado, usa o usuário demo
  if (window.appConfig.app.testMode && !sessionStorage.getItem('currentUser')) {
    return window.appConfig.users[0]; // Retorna o usuário demo em modo de teste
  }
  
  // Tenta obter o usuário da sessão atual
  try {
    const userDataSession = sessionStorage.getItem('currentUser');
    if (userDataSession) {
      return JSON.parse(userDataSession);
    }
    
    // Se não encontrou na sessão, tenta recuperar do localStorage
    if (window.appConfig.app.localStorageEnabled) {
      const userDataLocal = localStorage.getItem('lastLoggedUser');
      if (userDataLocal) {
        const userData = JSON.parse(userDataLocal);
        // Salva na sessão atual para uso futuro
        sessionStorage.setItem('currentUser', userDataLocal);
        return userData;
      }
    }
  } catch (e) {
    console.error('Erro ao obter usuário atual:', e);
  }
  
  return null;
};

// Login de usuário usando Supabase
window.loginUser = async function(email, password) {
  // Verifica se o Supabase está disponível
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (error) {
        console.error('Erro ao fazer login com Supabase:', error.message);
        return { success: false, error: error.message };
      }
      
      // Login bem-sucedido
      const user = data.user;
      
      // Salva os dados do usuário na sessão
      sessionStorage.setItem('currentUser', JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.user_metadata.name || user.email.split('@')[0],
        avatar: user.user_metadata.avatar || user.email[0].toUpperCase(),
        type: user.user_metadata.type || 'user',
        lastLogin: new Date().toISOString()
      }));
      
      // Se o localStorage estiver disponível, salva também para persistência
      if (window.appConfig.app.localStorageEnabled) {
        localStorage.setItem('lastLoggedUser', sessionStorage.getItem('currentUser'));
      }
      
      return { success: true, user: user };
    } catch (e) {
      console.error('Erro inesperado ao fazer login:', e);
      return { success: false, error: 'Erro inesperado ao fazer login' };
    }
  } else if (!user) {
    return { success: false, error: 'Dados de usuário inválidos' };
  } else {
    // Fallback para o sistema de login original quando Supabase não está disponível
    try {
      // Salva os dados do usuário na sessão atual
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    // Se o localStorage estiver disponível, salva também para persistência
    if (window.appConfig.app.localStorageEnabled) {
      localStorage.setItem('lastLoggedUser', JSON.stringify(user));
    }
    
    console.log('Usuário logado com sucesso:', user.name);
    return true;
  } catch (e) {
    console.error('Erro ao fazer login:', e);
    return false;
  }
};

// Logout de usuário
window.logoutUser = async function() {
  // Verifica se o Supabase está disponível
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        console.error('Erro ao fazer logout com Supabase:', error.message);
        return false;
      }
      
      // Remove da sessão atual
      sessionStorage.removeItem('currentUser');
      
      // Não remove do localStorage para permitir login fácil posteriormente
      // mas marca como deslogado
      if (window.appConfig.app.localStorageEnabled) {
        const savedUser = localStorage.getItem('lastLoggedUser');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          userData.isLoggedOut = true;
          localStorage.setItem('lastLoggedUser', JSON.stringify(userData));
        }
      }
      
      console.log('Logout realizado com sucesso');
      return true;
    } catch (e) {
      console.error('Erro ao fazer logout:', e);
      return false;
    }
  } else {
    // Fallback para o sistema de logout original quando Supabase não está disponível
    try {
      // Remove da sessão atual
      sessionStorage.removeItem('currentUser');
      
      // Não remove do localStorage para permitir login fácil posteriormente
      // mas marca como deslogado
      if (window.appConfig.app.localStorageEnabled) {
        const savedUser = localStorage.getItem('lastLoggedUser');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          userData.isLoggedOut = true;
          localStorage.setItem('lastLoggedUser', JSON.stringify(userData));
        }
      }
      
      console.log('Logout realizado com sucesso');
      return true;
    } catch (e) {
      console.error('Erro ao fazer logout:', e);
      return false;
    }
  }
};

// Funu00e7u00e3o helper para obter o usuu00e1rio atual
window.getCurrentUser = function() {
  if (window.appConfig.app.testMode && !sessionStorage.getItem('currentUser')) {
    return window.appConfig.users[0]; // Retorna o usuu00e1rio demo em modo de teste
  }
  const userData = sessionStorage.getItem('currentUser');
  return userData ? JSON.parse(userData) : null;
};

// Registra um novo usuário
window.registerUser = async function(userData) {
  if (!userData || !userData.email || !userData.password || !userData.name) {
    console.error('Dados de usuário inválidos para registro');
    return { success: false, error: 'Dados de usuário inválidos para registro' };
  }
  
  // Verifica se o Supabase está disponível
  if (supabaseClient) {
    try {
      // Registra o usuário no Supabase
      const { data, error } = await supabaseClient.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            avatar: userData.avatar || userData.name.charAt(0).toUpperCase(),
            type: 'user'
          }
        }
      });
      
      if (error) {
        console.error('Erro ao registrar com Supabase:', error.message);
        return { success: false, error: error.message };
      }
      
      // Registro bem-sucedido
      console.log('Usuário registrado com sucesso:', userData.name);
      
      // Se o registro for bem-sucedido mas precisar de confirmação de email
      if (data?.user && data?.session === null) {
        return { 
          success: true, 
          requiresEmailConfirmation: true,
          message: 'Registro realizado com sucesso! Por favor, verifique seu email para confirmar sua conta.'
        };
      }
      
      // Se o registro for bem-sucedido e já estiver logado
      if (data?.user && data?.session) {
        // Salva os dados do usuário na sessão
        const user = data.user;
        sessionStorage.setItem('currentUser', JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.user_metadata.name || user.email.split('@')[0],
          avatar: user.user_metadata.avatar || user.email[0].toUpperCase(),
          type: user.user_metadata.type || 'user',
          lastLogin: new Date().toISOString()
        }));
        
        // Se o localStorage estiver disponível, salva também para persistência
        if (window.appConfig.app.localStorageEnabled) {
          localStorage.setItem('lastLoggedUser', sessionStorage.getItem('currentUser'));
        }
        
        return { success: true, user: user };
      }
      
      return { success: true, message: 'Registro realizado com sucesso!' };
    } catch (e) {
      console.error('Erro inesperado ao registrar usuário:', e);
      return { success: false, error: 'Erro inesperado ao registrar usuário' };
    }
  } else {
    // Fallback para o sistema de registro original quando Supabase não está disponível
    try {
      const newUser = {
        id: 'user_' + Date.now(),
        email: userData.email,
        password: userData.password,
        name: userData.name,
        avatar: userData.avatar || userData.name.charAt(0).toUpperCase(),
        type: 'user',
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      // Se o localStorage estiver disponível, salva o usuário na lista de registrados
      if (window.appConfig.app.localStorageEnabled) {
        let usersList = [];
        const savedUsers = localStorage.getItem('registeredUsers');
        
        if (savedUsers) {
          usersList = JSON.parse(savedUsers);
        }
        
        // Verifica se o email já está sendo usado
        if (usersList.some(user => user.email === newUser.email)) {
          console.error('Email já está em uso');
          return { success: false, error: 'Email já está em uso' };
        }
        
        // Adiciona o novo usuário à lista
        usersList.push(newUser);
        localStorage.setItem('registeredUsers', JSON.stringify(usersList));
      }
      
      // Faz login com o novo usuário
      const loginResult = await window.loginUser(newUser.email, newUser.password);
      return loginResult.success ? { success: true, user: newUser } : { success: false, error: 'Falha ao fazer login após registro' };
    } catch (e) {
      console.error('Erro ao registrar usuário:', e);
      return { success: false, error: 'Erro ao registrar usuário' };
    }
  }
};