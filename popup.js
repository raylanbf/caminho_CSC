const BASE = 'https://csc.pucminas.br/Chamados/';
const MAX_RESULTADOS = 60;

// Listas de chamados que já abrem direto pela URL.
const LISTAS = [
  ['Todos', 'TodosV2'],
  ['Pendentes', 'PendentesV2'],
  ['Minha responsabilidade', 'MinhaResponsabilidadeV2'],
  ['Meus chamados', 'UsuarioV2'],
];

// Tela da árvore de serviços (é navegando nela que a extensão aprende os serviços).
const PAGINA_ARVORE = `${BASE}IncidenteV2.aspx?origem=Incidente`;

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

// Deixa o texto "comparável": sem acento, minúsculo, e / > | - viram espaço.
function normalizar(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[\/>»|\\\-–—]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function lerTudo() {
  const dados = await chrome.storage.local.get(['servicos', 'semeado', 'catalogo']);
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
  return { servicos, catalogo: dados.catalogo || {} };
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

// Junta os serviços salvos com os do catálogo (sem repetir).
function juntar(servicos, catalogo) {
  const todos = new Map();
  for (const origem of Object.keys(catalogo)) {
    // itens pode ser lista (formato antigo) ou objeto por ID (formato novo)
    for (const it of Object.values((catalogo[origem] && catalogo[origem].itens) || {})) {
      todos.set(`${it.id}|${origem}`, { id: it.id, origem, nome: it.nome, caminho: it.caminho || '', link: montarLink(it.id, origem), salvo: false });
    }
  }
  for (const [chave, s] of Object.entries(servicos)) {
    todos.set(chave, { ...s, salvo: true });
  }
  return todos;
}

function pontuar(item, termos, consulta) {
  const nome = normalizar(item.nome);
  const tudo = normalizar(`${item.nome} ${item.caminho} ${item.id}`);
  if (!termos.every((t) => tudo.includes(t))) return -1;
  let pontos = termos.filter((t) => nome.includes(t)).length * 10;
  if (item.salvo) pontos += 5;
  // Caminho colado inteiro (ex.: o do cabeçalho do chamado) vai para o topo.
  if (normalizar(`${item.caminho} ${item.nome}`) === consulta) pontos += 1000;
  return pontos;
}

function desenharItem(ul, chave, s) {
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
  );
  if (s.salvo) {
    acoes.append(
      criarBotao('Renomear', '', () => renomear(chave, nome)),
      criarBotao('Remover', 'perigo', (ev) => remover(chave, ev.currentTarget)),
    );
  } else {
    acoes.append(criarBotao('☆ Salvar', '', () => salvarDoCatalogo(chave, s)));
  }

  li.append(nome, meta, acoes);
  ul.appendChild(li);
}

async function desenhar() {
  const { servicos, catalogo } = await lerTudo();
  // Aceita o cabeçalho do chamado colado inteiro: "Código 1028224 - Csc - central de .../suporte ao canvas".
  const consulta = normalizar(document.getElementById('busca').value).replace(/^codigo \d+ /, '');
  const termos = consulta.split(' ').filter(Boolean);
  const ul = document.getElementById('servicos');
  const aviso = document.getElementById('aviso');
  ul.innerHTML = '';
  aviso.textContent = '';
  desenharCatalogo(catalogo);

  let lista;
  if (!termos.length) {
    document.getElementById('tituloServicos').textContent = 'Serviços salvos';
    lista = Object.entries(servicos)
      .map(([chave, s]) => [chave, { ...s, salvo: true }])
      .sort(([, a], [, b]) => (b.ultimaVez || '').localeCompare(a.ultimaVez || ''));
  } else {
    document.getElementById('tituloServicos').textContent = 'Resultados da busca';
    lista = [...juntar(servicos, catalogo).entries()]
      .map(([chave, s]) => [chave, s, pontuar(s, termos, consulta)])
      .filter(([, , p]) => p >= 0)
      .sort(([, a, pa], [, b, pb]) => pb - pa || a.nome.length - b.nome.length)
      .map(([chave, s]) => [chave, s]);
    if (lista.length > MAX_RESULTADOS) {
      aviso.textContent = `Mostrando ${MAX_RESULTADOS} de ${lista.length}. Digite mais palavras para refinar.`;
      lista = lista.slice(0, MAX_RESULTADOS);
    }
  }

  if (!lista.length) {
    const li = document.createElement('li');
    li.className = 'vazio';
    if (termos.length) {
      li.textContent =
        'Nenhum serviço encontrado. Tente outras palavras (sem acento também funciona). ' +
        'Se ainda não achar, abra na árvore do CSC a pasta onde o serviço fica, ou abra um chamado ' +
        'desse serviço: a extensão aprende na hora.';
    } else {
      li.textContent = 'Nenhum serviço salvo ainda.';
    }
    ul.appendChild(li);
    return;
  }

  for (const [chave, s] of lista) desenharItem(ul, chave, s);
}

function desenharCatalogo(catalogo) {
  const partes = ['Incidente', 'ChamadosGrupo'].map((origem) => {
    const c = catalogo[origem];
    const total = c && c.itens ? Object.keys(c.itens).length : 0;
    return `${nomeOrigem(origem)}: ${total} serviço${total === 1 ? '' : 's'}`;
  });
  document.getElementById('statusCatalogo').textContent = `Conhecidos até agora: ${partes.join(' · ')}`;
}

async function salvarDoCatalogo(chave, s) {
  const { servicos } = await lerTudo();
  const agora = new Date().toISOString();
  servicos[chave] = {
    id: s.id,
    origem: s.origem,
    link: s.link,
    nome: s.nome,
    renomeado: false,
    caminho: s.caminho,
    primeiraVez: agora,
    ultimaVez: agora,
  };
  await salvarServicos(servicos);
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
      const { servicos } = await lerTudo();
      if (servicos[chave]) {
        servicos[chave].nome = novo;
        servicos[chave].renomeado = true;
        await salvarServicos(servicos);
        return; // o onChanged redesenha
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
  const { servicos } = await lerTudo();
  delete servicos[chave];
  await salvarServicos(servicos);
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
document.getElementById('abrirArvore').addEventListener('click', () => chrome.tabs.create({ url: PAGINA_ARVORE }));

document.getElementById('copiarTodos').addEventListener('click', async (ev) => {
  const { servicos } = await lerTudo();
  const linhas = [
    'LISTAS DE CHAMADOS',
    ...LISTAS.map(([nome, pagina]) => `${nome}: ${BASE}${pagina}`),
    '',
    'SERVIÇOS',
    ...Object.values(servicos).map((s) => `${s.nome} (${nomeOrigem(s.origem)}): ${s.link}`),
  ];
  copiar(linhas.join('\n'), ev.currentTarget);
});

// Se algo mudar (link descoberto, catálogo mapeado, item salvo), redesenha.
chrome.storage.onChanged.addListener((mudancas) => {
  if (mudancas.servicos || mudancas.catalogo) desenhar();
});

desenharListas();
desenhar();
