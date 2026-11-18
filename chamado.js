// Na tela de um chamado que já existe (viewHistoricoChamado.aspx, a janelinha que abre
// pelas listas Pendentes, Todos, Meus chamados...).
// A página já traz em campos escondidos o ID do serviço e o caminho dele:
//   hidCatalogoServicosId = "4952"
//   hidDesc               = "CSC - Central.../Serviços de TI/Rede Acadêmica/Acesso Canvas/Suporte ao Canvas"
// Este script lê SÓ esses campos e põe o serviço no catálogo, para a busca da extensão
// encontrar o link pelo caminho. Não lê o conteúdo do chamado (descrição, solicitante etc.)
// e não faz nenhuma requisição.
(() => {
  if (!/\/chamados\/viewhistoricochamado\.aspx$/i.test(location.pathname)) return;

  // O link de abertura usa a árvore de solicitante ("Abertura de chamado").
  const ORIGEM = 'Incidente';

  const valor = (id) => {
    const el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  };

  // S = serviço final (o mesmo "S" do 2º campo do valor dos itens da árvore).
  const tipoItem = valor('hidTipoItem');
  if (tipoItem && tipoItem !== 'S') return;

  const id = valor('hidCatalogoServicosId') || valor('hidServicoID');
  const descricao = valor('hidDesc');
  if (!/^\d+$/.test(id) || id === '0' || !descricao) return;

  const partes = descricao.split('/').map((p) => p.trim()).filter(Boolean);
  const nome = partes.pop();
  const caminho = partes.join(' / ');

  async function guardar() {
    const { catalogo = {} } = await chrome.storage.local.get('catalogo');

    // Se a árvore já ensinou este serviço (em qualquer origem), ela manda: não mexe.
    // Se veio de um chamado antes, só atualiza quando o nome ou o caminho mudou.
    for (const c of Object.values(catalogo)) {
      for (const it of Object.values((c && c.itens) || {})) {
        if (!it || String(it.id) !== id) continue;
        if (it.fonte !== 'chamado') return;
        if (it.nome === nome && it.caminho === caminho) return;
      }
    }

    // itens pode ser lista (formato antigo) ou objeto por ID (formato novo).
    const atual = catalogo[ORIGEM] || {};
    const itens = {};
    for (const it of Object.values(atual.itens || {})) if (it && it.id) itens[it.id] = it;
    itens[id] = { id, nome, caminho, tipo: '', fonte: 'chamado' };

    catalogo[ORIGEM] = { atualizado: new Date().toISOString(), itens };
    await chrome.storage.local.set({ catalogo });
  }

  guardar().catch((e) => console.warn('[Caminho CSC] erro ao salvar serviço do chamado:', e));
})();
