# Caminho CSC

Extensão para Google Chrome que **descobre e guarda o link direto** de cada serviço do CSC (https://csc.pucminas.br).
Com o link, você abre o formulário de um serviço com **um clique**, sem passar de novo por
Chamados → Abertura → árvore → pasta → subpasta → serviço.

- **Botão direito** em um serviço da árvore → **Copiar link do serviço**.
- **Digite o nome ou o caminho** do serviço no ícone da extensão para receber o link.
- **Cole o cabeçalho de um chamado** (`Código 1028224 - Csc - central de .../suporte ao canvas`) na busca
  para achar o link de abertura daquele serviço.
- **Não pesa no servidor:** a extensão só lê o que já está na sua tela e não faz nenhuma requisição a mais.

---

## 1. Como instalar

1. Baixe a extensão: nesta página do GitHub, clique no botão verde **Code** → **Download ZIP**.
   Extraia o ZIP numa pasta que você não vá apagar (ex.: `Documentos\caminho_CSC`).
2. No Chrome, abra o endereço `chrome://extensions`.
3. Ligue o **Modo do desenvolvedor** (chave no canto superior direito).
4. Clique em **Carregar sem compactação** e escolha a pasta extraída (a que tem o arquivo `manifest.json`).
5. Clique no ícone de quebra-cabeça 🧩 da barra do Chrome e **fixe** a extensão **Caminho CSC**.

Não apague nem mova a pasta depois de instalar, porque o Chrome carrega a extensão direto dela.
Se você atualizar os arquivos, volte em `chrome://extensions` e clique no botão de recarregar ↻ da extensão.

---

## 2. Como usar

### Copiar o link pelo botão direito (na árvore)

1. No CSC, vá em **Chamados → Abertura** e na aba **Buscar o serviço na árvore**.
2. Abra as pastas normalmente até chegar no serviço.
3. Clique com o **botão direito** em cima do serviço. Aparece o menu:

   ```
   🔗 Caminho CSC · Registro de Patentes (Solicitação)
   📋 Copiar link do serviço
   ↗ Abrir em nova aba
   ```

4. **Copiar link do serviço** copia o link direto, e um aviso "Link copiado" aparece no canto da tela.

O menu só aparece em cima de **serviços**. Em pastas e no resto da página continua o menu normal do Chrome.

### Buscar digitando (no ícone da extensão)

Clique no ícone da extensão e digite. Pode ser:

- uma parte do nome: `patentes`, `suporte docente`
- o caminho, do jeito que aparece no CSC: `Serviços do Núcleo de Educação Digital (NED)/Atendimento de SUPORTE`
- sem acento e em minúsculas, que também funciona: `nucleo educacao digital suporte`
- o ID: `6548`
- o cabeçalho de um chamado, copiado inteiro da tela:
  `Código 1028224 - Csc - central de serviços compartilhados/serviços de ti/rede acadêmica/acesso canvas/suporte ao canvas`
  (o "Código 1028224 -" do começo é ignorado, e o serviço com esse caminho exato vem em primeiro)
- um grupo (fila): `RES_NED/CEAD_Gestão_do_Ambiente_Virtual`. Aparecem os serviços cujos chamados
  **que você abriu** já passaram por esse grupo (seção 3.7)

A busca encontra o serviço se **todas as palavras** digitadas aparecerem no nome, no caminho ou nos grupos.

**De onde vêm os serviços da busca?** A extensão **aprende sozinha** enquanto você usa o CSC:

- toda pasta que você abre na **árvore** tem os serviços anotados na hora;
- todo **chamado** que você abre (pelas listas Pendentes, Todos, Meus chamados...) ensina o serviço daquele chamado
  e os grupos por onde ele passou.

Quanto mais você navega, mais serviços a busca conhece. Se um serviço não aparecer, abra na árvore
a pasta onde ele fica (ou abra um chamado desse serviço) e busque de novo.

### Barrinha no formulário

Quando você abre o formulário de um serviço (pela árvore ou pela busca do CSC), aparece uma barrinha escura
no canto inferior direito com o botão **Copiar link direto**. O serviço também vai para a sua lista de salvos.

### A janelinha da extensão (clique no ícone)

| Parte | O que faz |
|---|---|
| **Caixa de busca** | Vazia, mostra seus serviços salvos. Com texto, procura em todos os serviços conhecidos. |
| **Listas de chamados** | Botões que abrem direto: Todos, Pendentes, Minha responsabilidade, Meus chamados. |
| **Abrir** | Abre o formulário daquele serviço numa aba nova. |
| **Copiar link** | Copia o link para a área de transferência. |
| **☆ Salvar** | (resultados da busca) Põe o serviço na sua lista de salvos. |
| **Renomear** | (salvos) Troca o nome que aparece na lista (Enter salva, Esc cancela). |
| **Remover** | (salvos) Tira o serviço da lista (pede um segundo clique para confirmar). |
| **Catálogo de serviços** | Mostra quantos serviços a extensão já conhece e tem o botão **Abrir a árvore do CSC**. |
| **Copiar todos os links salvos** | Copia uma lista em texto com as listas e os serviços salvos, boa para mandar para um colega. |

### Criar um atalho na Área de Trabalho

Clique em **Abrir**. Depois **arraste o cadeado** 🔒 que fica à esquerda do endereço, na barra do Chrome, até a Área de Trabalho.
O Windows cria um atalho que abre direto aquele serviço.

---

## 3. Como o link é descoberto

**Resumo para explicar a alguém:**

> O link não foi inventado: é o mesmo endereço que o próprio CSC monta quando você dá duplo clique
> num serviço da árvore. O CSC abre o formulário numa janelinha dentro da página, por isso o endereço
> não aparece na barra do navegador. Essa janelinha tem um endereço próprio, que é sempre o mesmo
> e só muda o número do serviço. A extensão descobre esse número e monta o mesmo endereço que o CSC montaria.

### 3.1 Por que o endereço "não muda" no CSC

O CSC usa o sistema **GestaoX** (da EMX), feito em ASP.NET WebForms com componentes Telerik.
Nesse tipo de sistema, boa parte dos cliques **não troca o endereço da página**:

- Quando você abre uma pasta da árvore de serviços, o navegador manda uma requisição escondida ao servidor
  (um *callback*) e só redesenha aquele pedaço da árvore. A URL continua a mesma.
- Quando você dá duplo clique num serviço, o formulário abre numa **janela interna** (um *popup* dentro da página,
  tecnicamente um `iframe`). Por isso o endereço na barra do Chrome também não muda.

Só que essa janela interna **tem um endereço próprio**, e é ele que a extensão monta.

### 3.2 O caminho do clique até o link

Cada item da árvore guarda um valor escondido, por exemplo:

```
6548;S;S;S;1940;5;5
```

- O **1º número (`6548`)** é o **ID do serviço** no catálogo.
- O **2º campo (`S` ou `N`)** diz se é um serviço final (`S`) ou uma pasta (`N`).

No duplo clique, o próprio código do site faz isto. É o JavaScript que o CSC manda para o navegador
na página `IncidenteV2.aspx` (a tela da árvore); ele apareceu na gravação do Gravador de Ações (seção 7).
Resumido:

```js
function rdTreeview_DoubleClick() {
  var catid = valorDoItem.split(";");        // ["6548", "S", ...]
  if (catid[1] == "S") AbreTela(catid[0]);    // só abre se for serviço final
}

function AbreTela(id) {
  var width  = screen.width  * 0.85;          // 1920 × 0,85 = 1632
  var height = screen.height * 0.70;          // 1080 × 0,70 = 756
  janelaInterna.setUrl("../Chamados/viewIncidenteDireto.aspx?id=" + id +
                       "&origem=" + origem +
                       "&width=" + width + "&height=" + height +
                       "&incidenteid=0&Userid=" + Userid);
  janelaInterna.show();
}
```

Ou seja, o formulário de cada serviço é só esta página com o ID no final:

```
https://csc.pucminas.br/Chamados/viewIncidenteDireto.aspx?id=ID_DO_SERVIÇO&origem=Incidente&width=1632&height=756&incidenteid=0&Userid=0
```

Exemplo com o serviço **Suporte ao Canvas**
(`CSC - Central de Serviços Compartilhados / Serviços de TI / Rede Acadêmica / Acesso Canvas`), ID `4952`:

```
https://csc.pucminas.br/Chamados/viewIncidenteDireto.aspx?id=4952&origem=Incidente&width=1632&height=756&incidenteid=0&Userid=0
```

O ID pode vir de dois lugares:

- **da árvore:** o 1º número do valor escondido do item (`6548;S;...`);
- **de um chamado já existente:** o campo escondido `hidCatalogoServicosId`, junto com o caminho em `hidDesc` (seção 3.5).

### 3.3 O que significa cada parte do link

| Parâmetro | Exemplo | Significado |
|---|---|---|
| `id` | `6548` | ID do serviço (o número que vem da árvore). **Tem que ser número.** |
| `origem` | `Incidente` | `Incidente` = abrir como **solicitante** (botão "Abertura de chamado"). `ChamadosGrupo` = abrir como **atendente** (botão "Abertura de chamado atendente"). |
| `width` / `height` | `1632` / `756` | Tamanho da janela interna: o CSC calcula 85% da largura e 70% da altura da tela (numa tela 1920×1080, dá 1632×756). Não mudam o serviço; qualquer valor funciona. |
| `incidenteid` | `0` | `0` = chamado **novo**. Outro número seria um chamado já existente. |
| `Userid` | `0` | Usuário escolhido na abertura como atendente. `0` = nenhum. |

> Se o `id` não for um número (por exemplo, se ficar escrito `ID_DO_SERVIÇO`), o site mostra o erro
> **"Input string was not in a correct format"**. Isso só quer dizer que o ID está errado.

### 3.4 Como a extensão lê a árvore (sem pesar no servidor)

A árvore é um componente **RadTreeView** do Telerik. Os dados de cada item (texto e valor `ID;S;...`)
ficam guardados em objetos JavaScript da própria página.

1. O `arvore-main.js` roda **no mesmo ambiente da página** (`"world": "MAIN"` no `manifest.json`),
   porque só assim ele enxerga esses objetos. Ele pega a árvore com `$find('ctl00_MainContent_rdTreeView')`.
2. Ele percorre **só os itens que já estão carregados**. Uma pasta que você nunca abriu aparece vazia
   para ele, e ele **não a abre** (não chama `expand()`, não faz requisição nenhuma).
3. Um `MutationObserver` percebe quando a árvore muda na tela (quando **você** abre uma pasta e o site
   carrega os filhos) e lê de novo.
4. Cada item com valor `ID;S;...` vira um serviço com ID, nome e caminho das pastas. A lista vai por
   `window.postMessage` para o `arvore.js`, que junta no catálogo salvo no Chrome
   (separado por solicitante e atendente).
5. No **botão direito**, o `arvore-main.js` descobre qual item foi clicado (comparando o elemento da tela
   com `no.get_element()`). Se for um serviço, ele bloqueia o menu normal e o `arvore.js` mostra o menu
   **Copiar link do serviço / Abrir em nova aba**, montando o link com o formato da seção 3.2.

### 3.5 Como a extensão aprende com um chamado que já existe

Ao clicar num chamado das listas, o CSC abre numa janela interna a página
`viewHistoricoChamado.aspx?id=...&Codigo=1028224&origem=VisualizaChamadosGrupo`.
O cabeçalho mostra só o caminho em texto, mas a página traz em campos escondidos:

| Campo | Exemplo | Significado |
|---|---|---|
| `hidCatalogoServicosId` (e `hidServicoID`) | `4952` | ID do serviço: **o mesmo número** do 1º campo dos itens da árvore |
| `hidDesc` | `CSC - Central de Serviços Compartilhados/Serviços de TI/Rede Acadêmica/Acesso Canvas/Suporte ao Canvas` | Caminho completo do serviço |
| `hidTipoItem` | `S` | Serviço final (o mesmo `S` do 2º campo dos itens da árvore) |

Os outros campos batem com o resto do valor da árvore (`hidGrupoSolucionadorChamado` = grupo,
`hidEmpresaid` = empresa), o que confirma que o ID é o do catálogo.

Na aba **Histórico**, cada linha tem as colunas **Serviço** e **Grupo**: o grupo (fila) que estava com o chamado
naquele momento.

O `chamado.js` lê **só esses três campos e a coluna Grupo** e põe o serviço no catálogo de **solicitante**
(o link usa `origem=Incidente`). Do histórico, só conta as linhas cujo **Serviço** é o serviço atual do chamado
(se o chamado foi reclassificado, as linhas antigas são de outro serviço). Não lê o conteúdo do chamado
(descrição, solicitante, anexos) e não faz requisição nenhuma.

Se a árvore já tiver ensinado o mesmo serviço, o nome e o caminho que vieram da árvore são mantidos
e só os grupos são acrescentados.

### 3.6 E as listas de chamados (Todos, Pendentes...)?

Essas páginas **têm endereço próprio** e carregam a lista sozinhas ao abrir.
O site clica automaticamente num botão escondido (`btnLoadGrid`) logo depois que a página carrega:

| Lista | Link |
|---|---|
| Todos | https://csc.pucminas.br/Chamados/TodosV2 |
| Pendentes | https://csc.pucminas.br/Chamados/PendentesV2 |
| Minha responsabilidade | https://csc.pucminas.br/Chamados/MinhaResponsabilidadeV2 |
| Meus chamados | https://csc.pucminas.br/Chamados/UsuarioV2 |

**Os filtros não vão no link** (grupo, como `RES_NED/CEAD_Gestão_do_Ambiente_Virtual`, status etc.).
O sistema guarda os filtros na sua conta quando você clica em **Salvar** na tela da lista,
e o link abre a lista com esses filtros salvos.

### 3.7 Serviço x grupo (fila)

O link direto é de um **serviço** (um item da árvore), não de um grupo. O grupo (fila) é quem atende,
e o CSC escolhe sozinho para onde o chamado vai. Por isso, para um site, o que importa é o link do serviço.

Grupo e serviço **não são a mesma coisa**: um grupo atende vários serviços, e um chamado pode ser
transferido entre grupos. Exemplo real, o chamado 1028224 (serviço "Suporte ao Canvas") passou por três:

1. `RES_TI_PUC_Lourdes` (onde caiu na abertura)
2. `RES_NED/TED_Suporte_Canvas`
3. `RES_NED/CEAD_Gestão_do_Ambiente_Virtual`

A árvore não informa o grupo. A extensão anota os grupos que aparecem no **histórico dos chamados que você abre**
e mostra no popup, em cada serviço, a linha **"Grupos vistos nos chamados"**. Buscar
`RES_NED/CEAD_Gestão_do_Ambiente_Virtual` lista os serviços cujos chamados já passaram por esse grupo.

Isso é um **registro do que você já viu**, não um mapa oficial: um serviço só aparece na busca por grupo
depois que você abrir algum chamado dele que tenha passado por esse grupo.

### 3.8 Perguntas que podem fazer

**"Isso é burlar o sistema?"**
Não. É o mesmo endereço que o CSC usa quando você dá duplo clique no serviço. A pessoa precisa estar
logada, só consegue abrir o que já teria acesso pela árvore, e nada é criado até ela preencher e enviar o formulário.

**"Por que 1632 e 756 no link?"**
É só o tamanho da janela que o CSC calcula a partir da tela (seção 3.3). Não tem nada a ver com o serviço.

**"Por que pede login?"**
O link abre uma página do CSC como outra qualquer. Se a sessão expirou, o CSC manda para o login;
depois de entrar, é só clicar no link de novo.

**"Pode parar de funcionar?"**
Pode, se a EMX (empresa do GestaoX) mudar o nome da página (`viewIncidenteDireto.aspx`) ou dos parâmetros
numa atualização do sistema. Aí é preciso descobrir o novo formato e atualizar os links.

---

## 4. O que a extensão faz e o que ela NÃO faz

**Só consulta.** Ela não cria, não altera e não exclui nada no CSC:

- não preenche campos, não clica em botões do site e não envia formulários;
- não abre pastas da árvore sozinha e não faz requisições ao servidor;
- abrir um link só mostra o formulário vazio; o chamado só é criado se **você** preencher e enviar.

Ela também ignora, de propósito:

- o **"Novo chamado" genérico** (`id=0`), que não tem serviço escolhido;
- o **conteúdo dos chamados já existentes**: deles só lê o ID e o caminho do serviço e a coluna Grupo do histórico (seção 3.5);
- qualquer outra página do CSC.

## 5. Limitações

- Você precisa estar **logado** no CSC. Se a sessão tiver expirado, o link leva para o login.
  Depois de entrar, clique no link de novo.
- Aberto numa aba sozinha, o formulário pode ficar com o visual um pouco mais simples,
  porque foi feito para aparecer como janela interna. Mas funciona.
- A busca só conhece os serviços das pastas e dos chamados que você **já abriu** em algum momento.
- O serviço aprendido de um chamado entra como **solicitante**. Se ele só existir na árvore de atendente,
  abra a pasta dele na árvore de atendente para ter também o link de atendente.
- Os serviços de **solicitante** e de **atendente** ficam separados, porque o CSC mostra árvores diferentes.
  O link de atendente só funciona para quem tem acesso a abrir chamados como atendente.
- Se a EMX mudar o sistema (nome da página, dos parâmetros ou da árvore), a extensão pode parar de funcionar.
- Os dados ficam **só no seu navegador** (`chrome.storage.local`). A extensão não envia nada para
  nenhum servidor. Para passar links para outra pessoa, use **Copiar todos os links salvos**.

## 6. Arquivos

| Arquivo | Para que serve |
|---|---|
| `manifest.json` | "Ficha" da extensão: nome, permissão (`storage`) e em quais páginas ela roda (só `csc.pucminas.br`). |
| `content.js` | No formulário de um serviço: lê o ID e o nome, salva o link e mostra a barrinha. |
| `arvore-main.js` | No ambiente da página: lê os serviços já carregados na árvore e detecta o botão direito em um serviço. |
| `arvore.js` | Junta os serviços no catálogo do Chrome e mostra o menu do botão direito. |
| `chamado.js` | Num chamado já existente: lê o ID e o caminho do serviço (campos escondidos) e os grupos do histórico, e põe no catálogo. |
| `popup.html` / `popup.js` | A janelinha que abre ao clicar no ícone: busca, listas, abrir, copiar, salvar, renomear, remover. |

## 7. Como isso foi descoberto

A navegação no CSC foi gravada com a extensão **Gravador de Ações**, que salva em JSON os cliques,
as requisições escondidas (com respostas) e o HTML das páginas. Analisando esse arquivo deu para ver:

- as respostas da árvore, com o valor de cada item (`6548;S;S;S;...`);
- a função `rdTreeview_DoubleClick` → `AbreTela`, que monta o endereço `viewIncidenteDireto.aspx?id=...`;
- o script das listas que clica sozinho no `btnLoadGrid`;
- a configuração da árvore (`nodeData`), que mostra quais pastas já vêm carregadas;
- na tela de um chamado existente, os campos escondidos `hidCatalogoServicosId` e `hidDesc`,
  com o ID e o caminho do serviço, e a coluna Grupo da aba Histórico.
