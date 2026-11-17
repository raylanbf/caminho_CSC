// Mostra o painel "Mapear serviços" na tela da árvore do CSC (IncidenteV2.aspx),
// conversa com o mapa-main.js e salva o catálogo de serviços no Chrome.
(() => {
  if (window.top !== window) return;
  if (!/\/chamados\/incidentev2\.aspx$/i.test(location.pathname)) return;
  if (!document.getElementById('ctl00_MainContent_rdTreeView')) return;

  const campoOrigem = document.getElementById('MainContent_hidorigem');
  const origem = (campoOrigem && campoOrigem.value) || new URLSearchParams(location.search).get('origem') || '';
  if (origem !== 'Incidente' && origem !== 'ChamadosGrupo') return;
  const nomeOrigem = origem === 'ChamadosGrupo' ? 'atendente' : 'solicitante';
  const GATILHO = '#caminho-csc-mapear';

  // ---------- Painel (shadow DOM para o visual do site não interferir) ----------
  const host = document.createElement('div');
  host.id = 'caminho-csc-mapa';
  host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483646;';
  const sombra = host.attachShadow({ mode: 'open' });
  sombra.innerHTML = `
    <style>
      .painel { font: 13px/1.35 Segoe UI, Arial, sans-serif; background: #1f2937; color: #f9fafb;
                border-radius: 10px; padding: 10px 12px; box-shadow: 0 6px 20px rgba(0,0,0,.35);
                width: 300px; display: flex; flex-direction: column; gap: 8px; }
      .topo { display: flex; align-items: center; gap: 6px; font-weight: 600; }
      .topo span { flex: 1; }
      .status { color: #d1d5db; font-size: 12px; word-break: break-word; }
      .acoes { display: flex; gap: 6px; }
      button { font: inherit; border: 0; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
      .principal { background: #3b82f6; color: #fff; }
      .principal:hover { background: #2563eb; }
      .secundario { background: #374151; color: #f9fafb; }
      .fechar { background: transparent; color: #9ca3af; padding: 0 4px; font-size: 16px; line-height: 1; }
      .fechar:hover { color: #fff; }
      [hidden] { display: none !important; }
    </style>
    <div class="painel">
      <div class="topo"><span>🗺️ Caminho CSC</span><button class="fechar" title="Fechar">×</button></div>
      <div class="status"></div>
      <div class="acoes">
        <button class="principal mapear">Mapear todos os serviços</button>
        <button class="secundario cancelar" hidden>Cancelar</button>
      </div>
    </div>`;
  const elStatus = sombra.querySelector('.status');
  const btnMapear = sombra.querySelector('.mapear');
  const btnCancelar = sombra.querySelector('.cancelar');
  sombra.querySelector('.fechar').addEventListener('click', () => host.remove());
  document.documentElement.appendChild(host);

  function formatarData(iso) {
    try {
      return new Date(iso).toLocaleDateString('pt-BR');
    } catch (e) {
      return iso;
    }
  }

  async function mostrarSituacao() {
    const { catalogo = {} } = await chrome.storage.local.get('catalogo');
    const atual = catalogo[origem];
    if (atual && atual.itens && atual.itens.length) {
      elStatus.textContent = `Catálogo (${nomeOrigem}): ${atual.itens.length} serviços, mapeado em ${formatarData(atual.quando)}. Busque pelo ícone da extensão.`;
      btnMapear.textContent = 'Atualizar mapa';
    } else {
      elStatus.textContent = `Abre todas as pastas da árvore (como ${nomeOrigem}) e guarda o link de cada serviço para você buscar digitando. Leva de 1 a 3 minutos.`;
      btnMapear.textContent = 'Mapear todos os serviços';
    }
  }

  function iniciar() {
    btnMapear.hidden = true;
    btnCancelar.hidden = false;
    elStatus.textContent = 'Começando...';
    window.postMessage({ caminhoCsc: true, tipo: 'mapear' }, location.origin);
  }

  btnMapear.addEventListener('click', iniciar);
  btnCancelar.addEventListener('click', () => {
    window.postMessage({ caminhoCsc: true, tipo: 'cancelar' }, location.origin);
    elStatus.textContent = 'Cancelando...';
  });

  // ---------- Respostas do mapa-main.js ----------
  window.addEventListener('message', async (ev) => {
    if (ev.source !== window || !ev.data || ev.data.caminhoCscMain !== true) return;
    const d = ev.data;

    if (d.tipo === 'progresso') {
      elStatus.textContent = `Abrindo pastas... ${d.pastas} pastas, ${d.servicos} serviços. Agora: ${d.atual}`;
      return;
    }

    btnMapear.hidden = false;
    btnCancelar.hidden = true;

    if (d.tipo === 'fim') {
      const { catalogo = {} } = await chrome.storage.local.get('catalogo');
      catalogo[origem] = { quando: new Date().toISOString(), itens: d.itens };
      await chrome.storage.local.set({ catalogo });
      await mostrarSituacao();
      const aviso = d.falhas ? ` (${d.falhas} pasta(s) não carregaram; tente "Atualizar mapa" depois)` : '';
      elStatus.textContent = `Pronto! ${d.itens.length} serviços salvos${aviso}. Clique no ícone da extensão e digite o nome ou o caminho.`;
    } else if (d.tipo === 'cancelado') {
      elStatus.textContent = 'Mapeamento cancelado. Nada foi alterado.';
    } else if (d.tipo === 'erro') {
      elStatus.textContent = `Erro: ${d.mensagem}`;
    }
  });

  mostrarSituacao().then(() => {
    // Aberto pelo botão "Mapear" do popup: começa sozinho.
    if (location.hash === GATILHO) {
      history.replaceState(null, '', location.pathname + location.search);
      iniciar();
    }
  });
})();
