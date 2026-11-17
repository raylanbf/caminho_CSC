// Roda no "mundo" da própria página (world: MAIN) para poder usar os objetos
// do Telerik ($find). Recebe pedidos do mapa.js por window.postMessage e abre,
// uma por uma, todas as pastas da árvore de serviços, anotando cada serviço.
(() => {
  if (window.top !== window) return;
  if (!/\/chamados\/incidentev2\.aspx$/i.test(location.pathname)) return;

  const ID_ARVORE = 'ctl00_MainContent_rdTreeView';
  const VEM_DO_SERVIDOR = 2; // expandMode 2 = filhos carregados do servidor ao abrir a pasta
  const PAUSA_ENTRE_PASTAS = 150; // ms, para não sobrecarregar o servidor
  const TEMPO_MAXIMO_PASTA = 20000; // ms

  let rodando = false;
  let cancelar = false;

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const enviar = (dados) => window.postMessage({ caminhoCscMain: true, ...dados }, location.origin);

  async function acharArvore() {
    for (let i = 0; i < 50; i++) {
      const arvore = typeof window.$find === 'function' ? window.$find(ID_ARVORE) : null;
      if (arvore) return arvore;
      await esperar(200);
    }
    return null;
  }

  // Abre a pasta e espera o servidor mandar os filhos.
  // Quando termina, o Telerik troca o expandMode de 2 para 0.
  async function carregarFilhos(no) {
    if (no.get_expandMode() !== VEM_DO_SERVIDOR) return true;
    no.expand();
    const inicio = Date.now();
    while (no.get_expandMode() === VEM_DO_SERVIDOR) {
      if (cancelar || Date.now() - inicio > TEMPO_MAXIMO_PASTA) return false;
      await esperar(100);
    }
    await esperar(PAUSA_ENTRE_PASTAS);
    return true;
  }

  async function mapear() {
    const arvore = await acharArvore();
    if (!arvore) {
      enviar({ tipo: 'erro', mensagem: 'Não achei a árvore de serviços nesta tela.' });
      return;
    }

    const itens = [];
    let pastas = 0;
    let falhas = 0;
    const pilha = [];
    const empilhar = (colecao, caminho) => {
      for (let i = colecao.get_count() - 1; i >= 0; i--) pilha.push({ no: colecao.getNode(i), caminho });
    };
    empilhar(arvore.get_nodes(), []);

    while (pilha.length && !cancelar) {
      const { no, caminho } = pilha.pop();
      const texto = (no.get_text() || '').replace(/\s+/g, ' ').trim();
      // Valor do item: "ID;S/N;...;tipo;..."  (S no 2º campo = serviço final)
      const partes = String(no.get_value() || '').split(';');

      if (partes[1] === 'S' && /^\d+$/.test(partes[0])) {
        itens.push({ id: partes[0], nome: texto, caminho: caminho.join(' / '), tipo: partes[3] || '' });
        continue;
      }

      pastas++;
      enviar({ tipo: 'progresso', pastas, servicos: itens.length, atual: texto });
      const ok = await carregarFilhos(no);
      if (!ok) {
        if (!cancelar) falhas++;
        continue;
      }
      empilhar(no.get_nodes(), [...caminho, texto]);
    }

    try {
      arvore.collapseAllNodes();
    } catch (e) {
      /* se não der para fechar as pastas, tudo bem */
    }
    enviar({ tipo: cancelar ? 'cancelado' : 'fim', itens, pastas, falhas });
  }

  window.addEventListener('message', async (ev) => {
    if (ev.source !== window || !ev.data || ev.data.caminhoCsc !== true) return;
    if (ev.data.tipo === 'cancelar') {
      cancelar = true;
      return;
    }
    if (ev.data.tipo === 'mapear' && !rodando) {
      rodando = true;
      cancelar = false;
      try {
        await mapear();
      } catch (e) {
        enviar({ tipo: 'erro', mensagem: String((e && e.message) || e) });
      }
      rodando = false;
    }
  });
})();
