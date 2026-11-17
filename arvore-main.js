// Roda no "mundo" da própria página (world: MAIN) para enxergar os objetos do Telerik.
// 1) Lê SOMENTE os serviços que já estão carregados na árvore (as pastas que você
//    abriu navegando). Não abre pastas e não faz requisição ao servidor.
// 2) No botão direito em cima de um serviço, avisa o arvore.js para mostrar o menu
//    "Copiar link do serviço".
(() => {
  if (window.top !== window) return;
  if (!/\/chamados\/incidentev2\.aspx$/i.test(location.pathname)) return;

  const ID_ARVORE = 'ctl00_MainContent_rdTreeView';
  const elArvore = document.getElementById(ID_ARVORE);
  if (!elArvore) return;

  const campoOrigem = document.getElementById('MainContent_hidorigem');
  const origem = (campoOrigem && campoOrigem.value) || new URLSearchParams(location.search).get('origem') || '';
  if (origem !== 'Incidente' && origem !== 'ChamadosGrupo') return;

  const enviar = (dados) => window.postMessage({ caminhoCscMain: true, ...dados }, location.origin);
  const pegarArvore = () => (typeof window.$find === 'function' ? window.$find(ID_ARVORE) : null);
  const textoDo = (no) => (no.get_text() || '').replace(/\s+/g, ' ').trim();

  // Valor do item: "ID;S/N;...;tipo;..."  (S no 2º campo = serviço final)
  function lerServico(no) {
    const partes = String(no.get_value() || '').split(';');
    if (partes[1] === 'S' && /^\d+$/.test(partes[0])) return { id: partes[0], tipo: partes[3] || '' };
    return null;
  }

  // Percorre só o que já está carregado. get_nodes() de uma pasta que nunca
  // foi aberta vem vazio (nada é pedido ao servidor).
  function percorrer(arvore, aoVisitar) {
    const visitar = (colecao, caminho) => {
      for (let i = 0; i < colecao.get_count(); i++) {
        const no = colecao.getNode(i);
        if (aoVisitar(no, caminho) === false) return false;
        if (!lerServico(no) && visitar(no.get_nodes(), [...caminho, textoDo(no)]) === false) return false;
      }
      return true;
    };
    visitar(arvore.get_nodes(), []);
  }

  // ---------- 1) Aprender os serviços visíveis ----------
  let ultimaAssinatura = '';
  function lerArvore() {
    const arvore = pegarArvore();
    if (!arvore) return;
    const itens = [];
    percorrer(arvore, (no, caminho) => {
      const s = lerServico(no);
      if (s) itens.push({ id: s.id, nome: textoDo(no), caminho: caminho.join(' / '), tipo: s.tipo });
    });
    const assinatura = itens.map((it) => it.id).join(',');
    if (!itens.length || assinatura === ultimaAssinatura) return;
    ultimaAssinatura = assinatura;
    enviar({ tipo: 'servicos', itens });
  }

  let timer;
  const agendar = () => {
    clearTimeout(timer);
    timer = setTimeout(lerArvore, 500);
  };
  new MutationObserver(agendar).observe(elArvore, { childList: true, subtree: true });
  agendar(); // pastas que já vieram abertas
  setTimeout(agendar, 2500); // caso o Telerik ainda não estivesse pronto

  // O arvore.js avisa quando começou a ouvir: manda a lista de novo,
  // caso a primeira leitura tenha chegado antes dele.
  window.addEventListener('message', (ev) => {
    if (ev.source !== window || !ev.data || ev.data.caminhoCsc !== true || ev.data.tipo !== 'pronto') return;
    ultimaAssinatura = '';
    agendar();
  });

  // ---------- 2) Botão direito em cima de um serviço ----------
  elArvore.addEventListener('contextmenu', (ev) => {
    const li = ev.target && ev.target.closest ? ev.target.closest('li.rtLI') : null;
    const arvore = pegarArvore();
    if (!li || !arvore || !elArvore.contains(li)) return;

    let achado = null;
    percorrer(arvore, (no, caminho) => {
      if (no.get_element() === li) {
        achado = { no, caminho };
        return false; // para de procurar
      }
      return true;
    });
    if (!achado) return;
    const s = lerServico(achado.no);
    if (!s) return; // pasta: deixa o menu normal do Chrome

    ev.preventDefault();
    enviar({
      tipo: 'menu',
      x: ev.clientX,
      y: ev.clientY,
      servico: { id: s.id, nome: textoDo(achado.no), caminho: achado.caminho.join(' / '), tipo: s.tipo },
    });
  });
})();
