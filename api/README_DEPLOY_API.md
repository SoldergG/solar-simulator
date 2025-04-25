# Deploy da API Solar (Node.js) no Render

Este guia mostra como publicar sua API Node.js/Express do simulador solar para que ela fique **sempre ligada** e acessível pelo site publicado!

---

## 1. Crie sua conta gratuita no Render
- Acesse: https://render.com
- Clique em "Sign Up" e crie sua conta (pode usar GitHub para facilitar)

## 2. Suba o código da API para um repositório no GitHub
- Crie um repositório novo (ex: `solar-api`)
- Faça upload da pasta `/api` do seu projeto (ou suba o projeto inteiro, se preferir)

## 3. Crie um novo serviço Web no Render
- Clique em **New +** > **Web Service**
- Conecte ao seu repositório `solar-api`
- Escolha:
  - **Environment:** Node
  - **Build Command:** (deixe em branco ou use `npm install` se tiver `package.json`)
  - **Start Command:** `node index.js`
- O Render irá instalar as dependências e rodar sua API

## 4. Pegue a URL pública da sua API
- Após o deploy, você verá uma URL como:
  `https://solar-api-xxxx.onrender.com`
- Teste no navegador: `https://solar-api-xxxx.onrender.com/calcular` (deve responder com erro 400 se acessar via GET, mas está funcionando)

---

## 5. Configure o frontend para usar a API publicada

### a) Crie um arquivo `.env` na pasta `/web`:
```
VITE_API_URL=https://solar-api-xxxx.onrender.com
```

### b) No código React, troque fetch para usar a variável de ambiente:
```js
const API_URL = import.meta.env.VITE_API_URL;

fetch(`${API_URL}/calcular`, { ... })
```

Assim, quando rodar localmente, pode usar um `.env.local` com a URL local se quiser.

---

## 6. Dica: Alternar entre local e produção
- Use `.env` para produção (deploy)
- Use `.env.local` para desenvolvimento

---

## 7. Pronto!
Agora seu frontend publicado pode acessar a API online, sem precisar rodar nada no terminal!

Se quiser, posso automatizar o uso da variável de ambiente no seu código React para você.

---

Dúvidas? Só pedir!
