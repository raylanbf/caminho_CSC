const BASE = 'https://csc.pucminas.br/Chamados/';

// Listas de chamados que já abrem direto pela URL.
const LISTAS = [
  ['Todos', 'TodosV2'],
  ['Pendentes', 'PendentesV2'],
  ['Minha responsabilidade', 'MinhaResponsabilidadeV2'],
  ['Meus chamados', 'UsuarioV2'],
];

// Serviços que já descobrimos analisando as gravações (entram na lista na 1ª vez).
const SEMENTES = [
  {
    id: '6548',
    origem: 'Incidente',
    nome: 'Atendimento de SUPORTE AO DOCENTE na Gestão do Ambiente Virtual (apenas para lançamento das horas)',
    caminho: 'CSC - Central de Serviços Compartilhados / Serviços do Núcleo de Educação Digital (NED)',
  },
  {
    id: '6420',
    origem: 'ChamadosGrupo',
    nome: 'Registro de Patentes (Solicitação)',
    caminho: 'CSC - Central de Serviços Compartilhados / Serviços de Pesquisa e Pós-graduação / NIT (Núcleo de inovação tecnológica)',
  },
];

function montarLink(id, origem) {
  return `${BASE}viewIncidenteDireto.aspx?id=${id}&origem=${encodeURIComponent(origem)}&width=1632&height=756&incidenteid=0&Userid=0`;
}

function nomeOrigem(origem) {
  if (origem === 'ChamadosGrupo') return 'Atendente';
  if (origem === 'Incidente') return 'Solicitante';
  return origem;
}

async function lerServicos() {
  const dados = await chrome.storage.local.get(['servicos', 'semeado']);
  const servicos = dados.servicos || {};
  if (!dados.semeado) {
    const agora = new Date(0).toISOString();
    for (const s of SEMENTES) {
      const chave = `${s.id}|${s.origem}`;
      if (!servicos[chave]) {
        servicos[chave] = { ...s, link: montarLink(s.id, s.origem), renomeado: false, primeiraVez: agora, ultimaVez: agora };
      }
    }
    await chrome.storage.local.set({ servicos, semeado: true });
  }
  return servicos;
}

async function salvarServicos(servicos) {
  await chrome.storage.local.set({ servicos });
}

async function copiar(texto, botao) {
  const original = botao.textContent;
  try {
    await navigator.clipboard.writeText(texto);
    botao.textContent = 'Copiado!';
  } catch (e) {
    botao.textContent = 'Erro ao copiar';
  }
  setTimeout(() => (botao.textContent = original), 1500);
}

function criarBotao(texto, classe, aoClicar) {
  const b = document.createElement('button');
  b.textContent = texto;
  if (classe) b.className = classe;
  b.addEventListener('click', aoClicar);
  return b;
}

async function desenhar() {
  const servicos = await lerServicos();
  const termo = document.getElementById('busca').value.trim().toLowerCase();
  const ul = document.getElementById('servicos');
  ul.innerHTML = '';

  const lista = Object.entries(servicos)
    .filter(([, s]) => !termo || `${s.nome} ${s.caminho} ${s.id}`.toLowerCase().includes(termo))
    .sort(([, a], [, b]) => (b.ultimaVez || '').localeCompare(a.ultimaVez || ''));

  if (!lista.length) {
    const li = document.createElement('li');
    li.className = 'vazio';
    li.textContent = termo ? 'Nenhum serviço encontrado com essa busca.' : 'Nenhum serviço ainda. Abra o formulário de um serviço no CSC.';
    ul.appendChild(li);
    return;
  }

  for (const [chave, s] of lista) {
    const li = document.createElement('li');
    li.className = 'item';

    const nome = document.createElement('div');
    nome.className = 'nome';
    nome.textContent = s.nome;

    const meta = document.createElement('div');
    meta.className = 'meta';
    const tagId = document.createElement('span');
    tagId.className = 'tag';
    tagId.textContent = `ID ${s.id}`;
    const tagOrigem = document.createElement('span');
    tagOrigem.className = 'tag';
    tagOrigem.textContent = nomeOrigem(s.origem);
    meta.append(tagId, tagOrigem, document.createTextNode(s.caminho || ''));

    const acoes = document.createElement('div');
    acoes.className = 'acoes';
    acoes.append(
      criarBotao('Abrir', 'principal', () => chrome.tabs.create({ url: s.link })),
      criarBotao('Copiar link', '', (ev) => copiar(s.link, ev.currentTarget)),
      criarBotao('Renomear', '', () => renomear(chave, nome)),
      criarBotao('Remover', 'perigo', (ev) => remover(chave, ev.currentTarget)),
    );

    li.append(nome, meta, acoes);
    ul.appendChild(li);
  }
}

function renomear(chave, divNome) {
  const atual = divNome.textContent;
  const input = document.createElement('input');
  input.value = atual;
  divNome.textContent = '';
  divNome.appendChild(input);
  input.focus();
  input.select();

  let terminou = false;
  async function concluir(salvar) {
    if (terminou) return;
    terminou = true;
    const novo = input.value.trim();
    if (salvar && novo && novo !== atual) {
      const servicos = await lerServicos();
      if (servicos[chave]) {
        servicos[chave].nome = novo;
        servicos[chave].renomeado = true;
        await salvarServicos(servicos);
      }
    }
    desenhar();
  }
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') concluir(true);
    if (e.key === 'Escape') concluir(false);
  });
  input.addEventListener('blur', () => concluir(true));
}

// Remover pede um segundo clique para confirmar.
async function remover(chave, botao) {
  if (!botao.classList.contains('confirmar')) {
    botao.classList.add('confirmar');
    botao.textContent = 'Confirmar?';
    setTimeout(() => {
      botao.classList.remove('confirmar');
      botao.textContent = 'Remover';
    }, 3000);
    return;
  }
  const servicos = await lerServicos();
  delete servicos[chave];
  await salvarServicos(servicos);
  desenhar();
}

function desenharListas() {
  const div = document.getElementById('listas');
  for (const [nome, pagina] of LISTAS) {
    const b = criarBotao(nome, 'chip', () => chrome.tabs.create({ url: BASE + pagina }));
    b.title = BASE + pagina;
    div.appendChild(b);
  }
}

document.getElementById('busca').addEventListener('input', desenhar);

document.getElementById('copiarTodos').addEventListener('click', async (ev) => {
  const servicos = await lerServicos();
  const linhas = [
    'LISTAS DE CHAMADOS',
    ...LISTAS.map(([nome, pagina]) => `${nome}: ${BASE}${pagina}`),
    '',
    'SERVIÇOS',
    ...Object.values(servicos).map((s) => `${s.nome} (${nomeOrigem(s.origem)}): ${s.link}`),
  ];
  copiar(linhas.join('\n'), ev.currentTarget);
});

// Se a extensão descobrir um link novo com o popup aberto, atualiza a lista.
chrome.storage.onChanged.addListener((mudancas) => {
  if (mudancas.servicos) desenhar();
});

desenharListas();
desenhar();
