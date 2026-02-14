
# Toasts com Estilo Dev/Terminal

## O que muda

Os toasts do Sonner ("Login realizado!", "Erro ao fazer login", etc.) vao ganhar visual de terminal/console, combinando com a estetica IDE do app.

## Visual

- Borda lateral colorida por tipo: verde para sucesso, vermelho para erro, amarelo para info
- Prefixo de terminal no texto: `> success:`, `> error:`, `> info:`
- Fonte monospace (JetBrains Mono)
- Background escuro com backdrop-blur, borda sutil
- Icone de terminal (chevron `>`) no lugar dos icones padrao
- Status bar mini no rodape do toast (tipo "exit code 0" para sucesso, "exit code 1" para erro)

## Implementacao Tecnica

### 1. Customizar o Sonner Toaster (`src/components/ui/sonner.tsx`)

Aplicar classes customizadas via `toastOptions.classNames` para:
- `toast`: fundo escuro, borda, font-mono, backdrop-blur
- `success`: borda verde lateral
- `error`: borda vermelha lateral  
- `info`: borda amarela lateral
- `description`: texto muted monospace

### 2. Adicionar estilos CSS (`src/index.css`)

Adicionar regras para os toasts com:
- Borda lateral de 3px colorida por tipo
- Font-family JetBrains Mono
- Prefixo visual via pseudo-elementos ou classes customizadas

### 3. Trocar chamadas de toast no Auth (`src/pages/Auth.tsx`)

Usar `toast.success()` e `toast.error()` com mensagens formatadas em estilo terminal:
- `"> auth.login() — sucesso"` em vez de `"Login realizado!"`
- `"> error: ${message}"` em vez da mensagem crua
- `"> auth.signUp() — conta criada"` para signup

### Arquivos modificados
- `src/components/ui/sonner.tsx` — estilos do Toaster
- `src/index.css` — CSS customizado para toasts
- `src/pages/Auth.tsx` — mensagens reformatadas
