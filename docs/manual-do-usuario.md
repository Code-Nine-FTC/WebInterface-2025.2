# WebInterface-2025.2 – Manual do Usuário

## Visão Geral

WebInterface-2025.2 é uma aplicação web para gestão de inventário, usuários, fornecedores e seções. Oferece interface moderna e responsiva com autenticação, controle de acesso por perfil e fluxos eficientes para tarefas do dia a dia.

---

## 1. Funcionalidades Principais

- **Dashboard (Home):** Ações rápidas, KPIs e resumo de itens críticos e fornecedores.
- **Estoque (Storage):** Listar, buscar e gerenciar itens do estoque.
- **Gestão de Usuários:** Listar, criar, atualizar e desabilitar usuários.
- **Gestão de Seções:** Gerenciar divisões lógicas (seções) para inventário e usuários.
- **Gestão de Fornecedores:** Cadastrar e editar informações de fornecedores.
- **Autenticação:** Login/logout seguro com token JWT e gerenciamento de sessão.

---

## 2. Navegação

- A navegação principal ocorre pela sidebar/app bar (ver `app/layouts/default.vue`).
- Menu principal inclui:
  - Home (`/home`)
  - Estoque (`/storage`)
  - Usuários (`/users`)
  - Fornecedores (`/suppliers`)
  - Seções (`/sections`)
  - Pedidos (`/orders`)

---

## 3. Fluxos de Uso Comuns

### 3.1. Login e Autenticação

- Informe suas credenciais na tela de login.
- A sessão é gerenciada pela store Pinia (`auth`).
- O logout está disponível no menu de perfil, no topo do app.

### 3.2. Gestão de Estoque

- Acesse **"Estoque"** pelo menu lateral ou ações rápidas.
- Visualize todos os itens com detalhes: nome, tipo, quantidade, fornecedor, seção e última atualização.
- Use o botão "Cadastrar" para adicionar novos itens.
- Acesse tipos de itens por "Tipos de Item".
- Itens podem ser criados, atualizados, desativados ou removidos (de acordo com permissões).

### 3.3. Gestão de Usuários e Seções

- **Usuários:** Em "Usuários" é possível visualizar, criar, atualizar ou desabilitar usuários.
- **Seções:** Em "Seções" é possível criar e editar divisões/seções.

### 3.4. Gestão de Fornecedores

- Acesse "Fornecedores" para gerenciar dados de fornecedores.

### 3.5. Ações Rápidas

- Na Home, use os botões de ações rápidas para navegação ágil a funcionalidades principais como Estoque, Fornecedores, Pedidos e Usuários.

---

## 4. Perfis e Permissões

- **ADMIN:** Acesso total a todas as áreas.
- **MANAGER:** Acesso extendido (ver cor azul).
- **ASSISTANT:** Acesso limitado (ver cor verde).
- Os nomes e cores dos perfis são definidos em `app/utils/index.ts`.

---

## 5. Visualização de Dados e Utilidades

- Tabelas (estoque, usuários) exibem atributos detalhados e ações por linha.
- Utilitários para formatação de datas, CNPJ, telefone estão em `app/utils/`.
- Itens críticos (baixo estoque) são destacados na Home.

---

## 6. Boas Práticas

- Use sempre a sidebar/app bar para navegação.
- Mantenha a padronização de formatação e evite duplicidade de cadastros.
- Respeite as permissões de perfil para ações sensíveis (desativar/remover usuários ou itens).

---

## 7. Resolução de Problemas

- Se não conseguir logar, confira suas credenciais ou a conectividade com a API backend.
- Se listas não carregam, verifique o endpoint da API configurado no Nuxt.
- Para problemas de interface, use navegador atualizado e compatível com JavaScript moderno.

---

## 8. Mais Informações

- Para setup, veja o Manual de Instalação.
- Para documentação de código, consulte as respectivas pastas (`pages/`, `stores/`, `utils/`, etc).

---
