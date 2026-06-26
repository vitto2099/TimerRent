# TimerRent

Sistema especialista de precificação de projetos freelancers + cronômetro de horas integrado.
O sistema ajuda a padronizar a cobrança de serviços com base em perguntas rápidas e registra as horas gastas em cada projeto.

## Recursos
- **Assistente de Precificação (Wizard):** Perguntas para calcular a estimativa baseada nos seus custos.
- **Configurações Pessoais:** Defina seu custo de vida e horas para descobrir o seu valor/hora.
- **Regras Customizáveis:** Adicione perguntas com multiplicadores (+20%) ou horas exatas para customizar seus orçamentos.
- **Cronômetro Otimizado:** Controle quantas horas você está trabalhando.
- **Nuvem e Offline:** Escolha entre vincular a sua conta do Google (Firestore) ou salvar apenas na máquina.

## Como Desenvolver (Rodar Localmente)
1. Baixe o repositório (`git clone`).
2. Entre na pasta do projeto e rode `npm install` no terminal.
3. Para abrir o modo desenvolvedor e testar: `npm start` (ou `electron .`)

## Como Gerar o Executável (Build)
Sempre que baixar o projeto em um novo computador ou fizer atualizações, dê um duplo clique no arquivo **`build.bat`** que está na pasta principal.
O script irá:
1. Instalar as bibliotecas faltantes.
2. Converter o ícone `icon.png` em `icon.ico` (exigido pelo Windows).
3. Compilar um instalador e um executável limpo na pasta `dist/`.

> **Importante:** Se você for usar a Nuvem (Firebase), lembre-se de configurar suas chaves em `firebase-config.js` antes de compilar o executável!

## Tecnologias Usadas
- Electron
- Node.js
- Firebase (Auth e Firestore)
- Bootstrap 5 + UI Personalizada
