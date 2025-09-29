# WebInterface-2025.2 – Manual de Instalação

## Visão Geral

**WebInterface-2025.2** é uma aplicação web Nuxt (Vue 3) para gestão de inventário e usuários, escrita majoritariamente em Vue e TypeScript. Possui estrutura modular para escalabilidade, manutenibilidade e uma interface moderna.

---

## 1. Pré-requisitos

- **Node.js** (recomendado v18+)
- **Gerenciador de pacotes**: npm, yarn, pnpm ou bun

---

## 2. Clonando o Repositório

```bash
git clone https://github.com/Code-Nine-FTC/WebInterface-2025.2.git
cd WebInterface-2025.2
```

---

## 3. Instalando Dependências

Escolha seu gerenciador de pacotes preferido e instale:

```bash
# npm
npm install

# yarn
yarn install

# pnpm
pnpm install

# bun
bun install
```

---

## 4. Rodando o Servidor de Desenvolvimento

Inicie o servidor de desenvolvimento em [http://localhost:3000](http://localhost:3000):

```bash
# npm
npm run dev

# yarn
yarn dev

# pnpm
pnpm dev

# bun
bun run dev
```

---

## 5. Build para Produção

Para gerar um build de produção:

```bash
# npm
npm run build

# yarn
yarn build

# pnpm
pnpm build

# bun
bun run build
```

Para visualizar o build de produção localmente:

```bash
# npm
npm run preview

# yarn
yarn preview

# pnpm
pnpm preview

# bun
bun run preview
```

Para instruções de deploy, veja a [documentação de deployment do Nuxt](https://nuxt.com/docs/getting-started/deployment).

---

## 6. Estrutura do Projeto (Principais Pastas/Arquivos)

- `app/pages/` – Componentes de páginas principais (ex: `home.vue`, `storage.vue`, `sections.vue`)
- `app/layouts/` – Layouts (navegação, shell do app)
- `app/stores/` – Stores Pinia para gerenciamento de estado (ex: `auth.ts`, `items.ts`, `users.ts`, `section.ts`, `supplier.ts`)
- `app/types/` – Tipos TypeScript
- `app/utils/` – Funções utilitárias (formatação, helpers)
- `README.md` – Referência rápida de setup do projeto

---

## 7. Notas Adicionais

- O app usa Pinia para gerenciamento de estado e composables do Nuxt para chamadas à API.
- Temas/UI são configurados via Vuetify e CSS customizado.
- Certifique-se de que sua API backend está rodando e configurada com o `apiBase` correto no Nuxt config/ambiente.

---
