# Caminho CSC

Extensão para Google Chrome que **descobre e guarda o link direto** de cada serviço do CSC (https://csc.pucminas.br).
Com o link, você abre o formulário de um serviço com **um clique**, sem passar de novo por
Chamados → Abertura → árvore → pasta → subpasta → serviço.

---

## 1. Como instalar

1. Baixe a extensão: nesta página do GitHub, clique no botão verde **Code** → **Download ZIP**.
   Extraia o ZIP numa pasta que você não vá apagar (ex.: `Documentos\caminho_CSC`).
2. No Chrome, abra o endereço `chrome://extensions`.
3. Ligue o **Modo do desenvolvedor** (chave no canto superior direito).
4. Clique em **Carregar sem compactação** e escolha a pasta extraída (a que tem o arquivo `manifest.json`).
5. Clique no ícone de quebra-cabeça 🧩 da barra do Chrome e **fixe** a extensão **Caminho CSC**.

Não apague nem mova a pasta depois de instalar, porque o Chrome carrega a extensão direto dela.

Se você alterar algum arquivo da extensão, volte em `chrome://extensions` e clique no botão de recarregar ↻ dela.

---

## 2. Como usar

### Descobrir o link de um serviço

1. Entre no CSC normalmente.
2. Abra o formulário do serviço do jeito de sempre: pela **árvore** (duplo clique no serviço) ou pela **busca**.
3. Quando o formulário abrir, aparece uma barrinha escura no canto inferior direito:

   ```
   🔗 Atendimento de suporte ao docente na gestão do ambiente virtual ...
   Link novo descoberto e salvo na lista da extensão.
   [ Copiar link direto ]
   ```

4. Pronto. O link já foi salvo. Se quiser, clique em **Copiar link direto** para colar onde quiser.

Cada serviço só precisa ser descoberto **uma vez**.

### A janelinha da extensão (clique no ícone)

| Parte | O que faz |
|---|---|
| **Buscar** | Filtra os serviços por nome, caminho ou ID. |
| **Listas de chamados** | Botões que abrem direto: Todos, Pendentes, Minha responsabilidade, Meus chamados. |
| **Abrir** | Abre o formulário daquele serviço numa aba nova. |
| **Copiar link** | Copia o link para a área de transferência. |
| **Renomear** | Troca o nome que aparece na lista (Enter salva, Esc cancela). |
| **Remover** | Tira o serviço da lista (pede um segundo clique para confirmar). |
| **Copiar todos os links** | Copia uma lista em texto com todas as listas e serviços, boa para mandar para um colega. |

As etiquetas de cada serviço mostram o **ID** e se o link é de **Solicitante** ou **Atendente** (veja a seção 3.3).

### Criar um atalho na Área de Trabalho

Clique em **Abrir**. Depois **arraste o cadeado** 🔒 que fica à esquerda do endereço, na barra do Chrome, até a Área de Trabalho.
O Windows cria um atalho que abre direto aquele serviço.

---

## 3. Como o link é descoberto

### 3.1 Por que o endereço "não muda" no CSC

O CSC usa o sistema **GestaoX** (da EMX), feito em ASP.NET WebForms com componentes Telerik.
Nesse tipo de sistema, boa parte dos cliques **não troca o endereço da página**:

- Quando você abre uma pasta da árvore de serviços, o navegador manda uma requisição escondida ao servidor
  (um *callback*) e só redesenha aquele pedaço da árvore. A URL continua a mesma.
- Quando você dá duplo clique num serviço, o formulário abre numa **janela interna** (um *popup* dentro da página,
  tecnicamente um `iframe`). Por isso o endereço na barra do Chrome também não muda.

Só que essa janela interna **tem um endereço próprio**, e é ele que a extensão captura.

### 3.2 O caminho do clique até o link

Cada item da árvore guarda um valor escondido, por exemplo:

```
6548;S;S;S;1940;5;5
```

- O **1º número (`6548`)** é o **ID do serviço** no catálogo.
- O **2º campo (`S` ou `N`)** diz se é um serviço final (`S`) ou uma pasta (`N`).

No duplo clique, o próprio código do site faz isto (resumido):

```js
function rdTreeview_DoubleClick() {
  var catid = valorDoItem.split(";");        // ["6548", "S", ...]
  if (catid[1] == "S") AbreTela(catid[0]);    // só abre se for serviço final
}

function AbreTela(id) {
  janelaInterna.setUrl("../Chamados/viewIncidenteDireto.aspx?id=" + id +
                       "&origem=" + origem + "&width=..." + "&height=..." +
                       "&incidenteid=0&Userid=" + Userid);
  janelaInterna.show();
}
```

Ou seja, o formulário de cada serviço é só esta página com o ID no final:

```
https://csc.pucminas.br/Chamados/viewIncidenteDireto.aspx?id=ID_DO_SERVIÇO&origem=Incidente&width=1632&height=756&incidenteid=0&Userid=0
```

O que a extensão faz:

1. Ela roda **dentro da janela interna** também (configuração `all_frames` do `manifest.json`).
2. Quando a página carregada é `viewIncidenteDireto.aspx` (ou `AberturaChamado.aspx`) com um `id` numérico,
   ela lê o ID e a origem **do próprio endereço da janela**.
3. Ela monta um link "limpo", no formato que já foi testado (largura e altura fixas, `Userid=0`).
4. Ela lê o título da tela, *"Abertura de chamado para o serviço csc - ... / ... / nome do serviço"*,
   e usa a última parte como nome.
5. Ela salva tudo no armazenamento local do Chrome e mostra a barrinha com o botão de copiar.

### 3.3 O que significa cada parte do link

| Parâmetro | Exemplo | Significado |
|---|---|---|
| `id` | `6548` | ID do serviço (o número que vem da árvore). **Tem que ser número.** |
| `origem` | `Incidente` | `Incidente` = abrir como **solicitante** (botão "Abertura de chamado"). `ChamadosGrupo` = abrir como **atendente** (botão "Abertura de chamado atendente"). |
| `width` / `height` | `1632` / `756` | Tamanho da janela interna. Valores fixos, não mudam o serviço. |
| `incidenteid` | `0` | `0` = chamado **novo**. Outro número seria um chamado já existente. |
| `Userid` | `0` | Usuário escolhido na abertura como atendente. `0` = nenhum. |

> Se o `id` não for um número (por exemplo, se ficar escrito `ID_DO_SERVIÇO`), o site mostra o erro
> **"Input string was not in a correct format"**. Isso só quer dizer que o ID está errado.

### 3.4 E as listas de chamados (Todos, Pendentes...)?

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

### 3.5 Serviço x grupo (fila)

O link direto é de um **serviço** (um item da árvore). Cada serviço é atendido por um **grupo/fila**
(ex.: `RES_NED/CEAD_Gestão_do_Ambiente_Virtual`). Para ter o link "da fila", descubra o link do serviço
que cai nessa fila.

---

## 4. O que a extensão ignora (de propósito)

- **"Novo chamado" genérico** (`id=0`): não tem serviço escolhido, então não há link útil.
- **Chamados já existentes** (`incidenteid` diferente de `0`): não é abertura de chamado.
- Qualquer outra página do CSC: a extensão não faz nada nelas.

## 5. Limitações

- Você precisa estar **logado** no CSC. Se a sessão tiver expirado, o link leva para o login.
  Depois de entrar, clique no link de novo.
- Aberto numa aba sozinha, o formulário pode ficar com o visual um pouco mais simples,
  porque foi feito para aparecer como janela interna. Mas funciona.
- Se a EMX mudar o sistema (nome da página ou dos parâmetros), a descoberta pode parar de funcionar.
- A lista de serviços fica **só no seu navegador** (`chrome.storage.local`). A extensão não envia nada para
  nenhum servidor. Para passar para outra pessoa, use **Copiar todos os links**.

## 6. Arquivos

| Arquivo | Para que serve |
|---|---|
| `manifest.json` | "Ficha" da extensão: nome, permissões (`storage`) e em quais páginas ela roda. |
| `content.js` | Roda dentro do CSC: detecta o formulário, lê o ID e o nome, salva o link e mostra a barrinha. |
| `popup.html` / `popup.js` | A janelinha que abre ao clicar no ícone: lista, busca, abrir, copiar, renomear, remover. |

## 7. Como isso foi descoberto

A navegação no CSC foi gravada com a extensão **Gravador de Ações**, que salva em JSON os cliques,
as requisições escondidas (com respostas) e o HTML das páginas. Analisando esse arquivo deu para ver:

- as respostas da árvore, com o valor de cada item (`6548;S;S;S;...`);
- a função `rdTreeview_DoubleClick` → `AbreTela`, que monta o endereço `viewIncidenteDireto.aspx?id=...`;
- o script das listas que clica sozinho no `btnLoadGrid`.
