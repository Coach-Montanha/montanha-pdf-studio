# MANUAL TÉCNICO DO DESENVOLVEDOR — MONTANHA PDF STUDIO
> **Classificação:** Documento Interno e Confidencial de Engenharia de Software  
> **Localização:** Raiz do repositório (`/DEV_GUIDE.md`). **NUNCA** mova este arquivo para a pasta `public/` ou `dist/` para evitar exposição pública via HTTP.  
> **Data de Atualização:** 22/09/2026  
> **Versão do Documento:** 1.0.0

---

## 1. Visão Geral & Escopo do Projeto

### 1.1. O que é o Montanha PDF Studio?
O **Montanha PDF Studio** é o estúdio de diagramação editorial, editoração gráfica e geração automatizada de publicações de alto nível do **Ecossistema Montanha**. O sistema permite compor e-books, manuais técnicos de treino, revistas digitais, prescrições de alta fidelidade e lâminas visuais com inteligência artificial, renderização em tempo real e exportação de PDFs vetoriais prontos para impressão ou compartilhamento digital.

### 1.2. Links e Referências de Produção
- **URL Canônica em Produção:** `https://montanha-pdf-studio.vercel.app`
- **Repositório GitHub:** `https://github.com/Coach-Montanha/montanha-pdf-studio`
- **Time Vercel:** `Ecossistema Montanha` (Plano Hobby)
- **Tecnologia Base:** TanStack Start (SSR via Nitro / Vercel Serverless Function) + React 19 + Tailwind CSS v4 + PDF.js + jsPDF + Supabase

---

## 2. Arquitetura do Sistema & Stack Tecnológica

### 2.1. Motor de Renderização e Diagramação PDF
- **PDF.js (`pdfjs-dist` v6.3.289):** Leitura, inspeção de páginas e extração vetorial de PDFs existentes. O worker dedicado está localizado em `public/pdf.worker.mjs`.
- **jsPDF (`jspdf` v4.2.1):** Geração programática de documentos PDF vetoriais, controle milimétrico de margens, tipografia e sangrias de impressão.
- **html2canvas (`html2canvas` v1.4.1):** Captura de elementos DOM complexos com aceleração para inserção de lâminas visuais no PDF.
- **TanStack Start & Router:** Roteamento SSR de alto desempenho via Nitro.

### 2.2. Backend & Armazenamento (Supabase)
- **Storage:** Armazenamento de arquivos PDF gerados e imagens de alta resolução em buckets seguros do Supabase Storage.
- **Banco de Dados:** Registro de publicações, templates de diagramação e metadados de edição.

---

## 3. Estrutura de Pastas e Componentes Críticos

```
Montanha PDF Studio/
├── .vercel/                 # Saída da compilação Nitro para a Vercel
├── public/                  # Arquivos estáticos
│   ├── pdf.worker.mjs       # Worker essencial para execução assíncrona do PDF.js
│   ├── mockups/             # Templates visuais e mockups de publicações
│   ├── splash-mobile.jpg    # Imagem de splash e preview social
│   ├── robots.txt           # Rastreamento de SEO apontando para o sitemap
│   └── sitemap.xml          # Rotas públicas do estúdio
├── src/
│   ├── components/          # Componentes do estúdio editorial
│   │   ├── ImpersonationBanner.tsx # Banner de suporte técnico
│   │   └── ui/              # Botões, diálogos, controles deslizantes
│   ├── integrations/
│   │   └── supabase/        # Conexão com Supabase
│   ├── routes/              # Rotas
│   │   ├── __root.tsx       # Head global, SEO, JSON-LD, SplashScreen
│   │   ├── index.tsx        # Editor principal de diagramação e visualização
│   │   ├── auth.tsx / login.tsx # Autenticação unificada (PIN 10 dígitos / e-mail)
│   │   ├── boost.tsx        # Acelerador Booster
│   │   ├── create.tsx       # Módulo Creator com IA
│   │   ├── eco.tsx          # Central do Ecossistema Montanha
│   │   ├── master-admin.tsx # Link para o painel Master Admin
│   │   └── api/             # Endpoints serverless (ai.ts, project.ts)
│   ├── styles.css           # Estilos e temas do estúdio
│   └── database/            # Esquema SQL unificado no repositório canônico: montanha-master-admin/database/ecosystem_schema.sql
├── DEV_GUIDE.md             # ESTE MANUAL TÉCNICO INTERNO (Atualizado)
├── package.json             # Dependências e scripts
├── tsconfig.json            # Configurações do compilador
└── vite.config.ts           # Configuração de build, Nitro e inlining
```

---

## 4. Regras Críticas de Build e Deploy

### ⚠️ REGRA 1: Bloqueio de Autor Git na Vercel (Cadeado 🔒 / Deploy Blocked)
- **O Problema:** A conta Vercel do projeto pertence à equipe `Ecossistema Montanha` no **plano Hobby**. Commits enviados com e-mails secundários (ex: `coach@montanha.com`) são rejeitados pela Vercel com o erro de colaboração não permitida em contas gratuitas.
- **A Solução Obrigatória:** O Git DEVE estar configurado com:
  ```bash
  git config --global user.name "Coach-Montanha"
  git config --global user.email "Coach-Montanha@users.noreply.github.com"
  ```
  Ao commitar:
  ```bash
  git commit --author="Coach-Montanha <Coach-Montanha@users.noreply.github.com>" -m "feat/fix: mensagem"
  ```

### ⚠️ REGRA 2: Erro 500 no SSR da Vercel (`tslib`)
- **O Problema:** Durante a execução serverless do Nitro na Vercel, a falta do pacote `tslib` no ambiente de produção derruba o aplicativo com `500 Internal Server Error`.
- **A Salvaguarda:**
  1. `"tslib": "^2.8.1"` em `"dependencies"` no `package.json`.
  2. `nitro.externals.inline: ["tslib"]` no `vite.config.ts`.

### ⚠️ REGRA 3: Worker do PDF.js (`public/pdf.worker.mjs`)
- Nunca remova ou altere o caminho de `public/pdf.worker.mjs`. O PDF.js depende desse arquivo servido estaticamente para não bloquear a thread principal do navegador durante a renderização de documentos pesados.

---

## 5. Guia Passo a Passo de Execução Local e Testes

```bash
# 1. Instalação de dependências
bun install

# 2. Iniciar servidor local
bun run dev

# 3. Compilação para produção
bun run build

# 4. Executar testes E2E
bun run test:e2e
```

---

## 6. Troubleshooting e Resolução Rápida de Falhas

| Sintoma | Causa Mais Provável | Como Resolver |
| :--- | :--- | :--- |
| **PDF.js não renderiza páginas** | Caminho do worker incorreto ou ausente. | Verifique se `public/pdf.worker.mjs` existe e se a URL configurada no client aponta para `/pdf.worker.mjs`. |
| **Erro de estouro de memória no canvas (Mobile)** | Canvas muito grande gerado pelo `html2canvas`. | Limite a resolução de escala (`scale: 2` ao invés de `scale: 4`) em dispositivos móveis. |
| **Deploy bloqueado na Vercel** | Autor de commit não vinculado à conta. | Reenvie o commit com o autor `Coach-Montanha <Coach-Montanha@users.noreply.github.com>`. |
