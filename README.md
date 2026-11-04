# TG Studio - Sistema de Montagem e Preparação de Artes para Impressão

Inspirado nas funcionalidades de organização, preparação e aproveitamento de folha do **Silhouette Studio**, o **TG Studio** é uma aplicação web moderna voltada para gráficas rápidas, birôs de impressão e profissionais de comunicação visual.

---

## 🌟 Principais Funcionalidades

### 1. Área de Trabalho e Formatos de Papel
- **Formatos A4 e A3**: Simulação visual exata em milímetros:
  - **A4**: 210 × 297 mm
  - **A3**: 297 × 420 mm
- **Orientação Flexível**: Alternância instantânea entre Retrato (Portrait) e Paisagem (Landscape).
- **Réguas Milimétricas Físicas**: Réguas horizontal e vertical em mm com graduação a cada 10 mm, 5 mm e 1 mm, além de indicador dinâmico na régua acompanhando a posição do cursor.
- **Navegação & Zoom**:
  - Zoom livre de 15% a 600% centrado no cursor do mouse.
  - Botão de **Ajustar à Tela** (*Fit to Screen*) e atalho para 100%.
  - Pan com a Barra de Espaço pressionada ou com o Botão do Meio do mouse.
- **Área Externa (Mesa de Trabalho / Pasteboard)**: Área escura ao redor da folha onde você pode posicionar, comparar e organizar imagens antes de montá-las na folha.

### 2. Importação e Edição de Imagens
- **Formatos Suportados**: PNG, JPG, JPEG, SVG e **PDF** (renderização de páginas em alta resolução usando PDF.js).
- **Arrastar e Soltar (Drag & Drop)**: Solte imagens diretamente sobre qualquer parte da folha ou da mesa de trabalho, calculando a coordenada milimétrica exata da queda.
- **Manipulação de Medidas Exatas**:
  - Campos livres para digitação de Largura ($W$) e Altura ($H$) em milímetros.
  - **Redimensionamento com Distorção Geométrica**: Conforme especificado, a imagem é esticada ou achatada para atingir a medida exata sem nenhum tipo de corte, recorte ou zoom de preenchimento. Toda a imagem original permanece visível.
  - **Botão de Proporção Original**: Trava/destrava a proporção da imagem para alternar entre redimensionamento proporcional ou distorção livre.
  - Predefinições rápidas para gráficas (3×4 cm, 5×5 cm, Cartão 9×5 cm, Tag 7×4 cm, 10×15 cm).

### 3. Configuração de Bordas Externas
- **Borda Externa Contínua**: Adicione contorno retangular externo com espessura ajustável em milímetros ou pontos (pt), preservando o valor decimal digitado.
- **Preservação Integral**: A borda acompanha o contorno da arte sem cortar ou cobrir um único pixel da imagem original.
- **Impacto no Bounding Box**: A espessura da borda é somada às dimensões totais para cálculos de espaçamento e encaixe.
- **Paleta de Cores e Personalizada**: Cores rápidas (Preto, Branco, Vermelho, Azul, Verde, Amarelo, Cinza, Rosa, Ciano, Laranja) + Seletor RGB/HEX.
- **Ferramenta Conta-gotas (Eyedropper)**: Clique em qualquer ponto da arte importada para capturar o pixel exato e aplicá-lo instantaneamente à borda.

### 4. Sistema Inteligente de Encaixe e Alinhamento (Smart Snapping)
- **Detecção Automática**:
  - Bordas e centros de artes vizinhas.
  - Bordas, centros e margens de segurança da folha (ex: 5 mm).
- **Guias Visuais Magnéticas**: Linhas de alinhamento em rosa/magenta com indicação de coordenadas e tipo de encaixe.
- **Encaixe com Espaçamento Personalizado**:
  - Encaixe lado a lado ou empilhado com distância configurável em milímetros (ex: 0 mm para corte em guilhotina, 2 mm, 5 mm, etc.).
- **Modo de Referência**:
  - Encaixe pela **Borda Externa** (considerando a espessura da borda).
  - Encaixe pela **Borda da Imagem** (conteúdo original).
- **Ferramentas de Alinhamento e Distribuição**:
  - **Centralizar na Folha (H + V)**: Move todo o conjunto selecionado para o centro da folha preservando integralmente a formação e espaçamentos relativos.
  - Alinhar à Esquerda, Centro Horizontal, Direita, Topo, Centro Vertical, Base.
  - Distribuir uniformemente na horizontal e na vertical.
- **Agrupamento de Artes (Group / Ungroup)**:
  - Permite agrupar múltiplas imagens em um único bloco coeso (`Ctrl + G`), mantendo sua disposição exata intacta ao arrastar ou centralizar na folha.
  - Opção de desagrupar a qualquer momento (`Ctrl + Shift + G`).

### 5. Aproveitamento de Folha (Duplicação em Grade)
- Ferramenta para multiplicar artes automaticamente em linhas e colunas com espaçamento configurado em milímetros.
- **Correção da Primeira Imagem**: A arte original agora se posiciona exatamente na célula inicial `(0, 0)` da grade, formando a matriz perfeita com os clones.
- Opção de iniciar na margem ou a partir da posição atual da arte.
- Opção de agrupar automaticamente toda a grade gerada.
- Botão **"Preencher Máximo na Folha"**: Calcula matematicamente a quantidade máxima de cópias que cabem na folha A4 ou A3.

### 6. Exportação e Impressão de Alta Precisão
- **Exportação em PDF**:
  - PDF gerado em **tamanho real físico** (unidade milimétrica) com fidelidade vetorial das bordas e alta qualidade raster via `jsPDF`.
- **Exportação em Imagem (PNG e JPG)**:
  - Resoluções configuráveis: **300 DPI** (Padrão Gráfico / Alta Resolução), **150 DPI** e **72 DPI**.
- **Impressão Direta 100%**:
  - Janela de impressão com estilização CSS `@page` exata para impressão direta física sem redimensionamento pelo navegador.
- **Salvar & Abrir Projetos (.tgstudio)**:
  - Salva todo o projeto em formato editável `.tgstudio` com as imagens embutidas e estados de objetos.
  - Auto-salvamento local no navegador via `LocalStorage`.

### 7. PWA & Funcionamento Offline
- Configurado com `manifest.json` e Service Worker para instalação no computador (Windows, macOS, Linux).
- Funciona 100% offline após o primeiro carregamento, sem depender de internet.

---

## ⌨️ Teclas de Atalho

| Atalho | Ação |
| :--- | :--- |
| `Ctrl + Z` | Desfazer (*Undo*) |
| `Ctrl + Y` ou `Ctrl + Shift + Z` | Refazer (*Redo*) |
| `Ctrl + D` | Duplicar objeto selecionado |
| `Ctrl + G` | Agrupar objetos selecionados em um único bloco |
| `Ctrl + Shift + G` | Desagrupar objetos |
| `Delete` ou `Backspace` | Excluir objeto selecionado |
| `Espaço + Arrastar` ou `Botão Meio` | Navegar pela folha (*Pan*) |
| `Roda do Mouse` | Zoom centrado no cursor |
| `S` | Ativar/Desativar Encaixe Inteligente |
| `V` | Ferramenta Selecionar / Mover |
| `H` | Ferramenta Navegar (Mão) |
| `Shift + Clique` | Seleção múltipla de artes |

---

## 🛠️ Tecnologias Utilizadas

- **React 19 + TypeScript**: Tipagem estrita e arquitetura baseada em componentes.
- **Vite 8**: Compilação ultrarrápida e bundling otimizado.
- **Tailwind CSS v4**: Interface profissional com tema escuro e visual de estúdio de design.
- **jsPDF**: Criação de PDFs físicos em milímetros com precisão vetorial.
- **PDF.js (`pdfjs-dist`)**: Extração e renderização de páginas de PDF como objetos gráficos.
- **Lucide Icons**: Conjunto completo de ícones de controle visual.

---

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Gerar build de produção
npm run build

# Executar testes automatizados
npm test

# Abrir a versão desktop local
npm run electron:dev

# Gerar instalador Windows (NSIS + portátil)
npm run dist:win

# Gerar instaladores Linux (AppImage + .deb)
npm run dist:linux

# Visualizar build localmente
npm run preview
```

## Publicação

O workflow `.github/workflows/deploy-pages.yml` publica automaticamente a versão web no GitHub Pages após cada envio para a branch `main`. O workflow `.github/workflows/build-electron.yml` gera os instaladores Windows e Linux em runners próprios de cada sistema.

Os artefatos Electron são gravados em `release/` quando gerados localmente. A versão Windows exige assinatura digital para evitar alertas do sistema; a versão Linux é gerada no Ubuntu pelo workflow para produzir `.AppImage` e `.deb` compatíveis.

Antes da distribuição pública, substitua `homepage` e o e-mail técnico do mantenedor no `package.json` pelos dados reais do projeto.
