// Roda em todas as páginas do CSC (inclusive dentro da janelinha que abre o formulário).
// Só faz algo na tela de abertura de chamado de um serviço específico.
(() => {
  const caminhoPagina = location.pathname.toLowerCase();
  const ehViewDireto = caminhoPagina.endsWith('/chamados/viewincidentedireto.aspx');
  const ehAberturaPagina = caminhoPagina.endsWith('/chamados/aberturachamado.aspx');
  if (!ehViewDireto && !ehAberturaPagina) return;

  const params = new URLSearchParams(location.search);
  const id = params.get('id') || '';
  const origem = params.get('origem') || 'Incidente';
  const incidenteid = params.get('incidenteid') || '0';

  // id 0 = botão "Novo chamado" genérico (sem serviço escolhido).
  // incidenteid diferente de 0 = chamado que já existe (não é abertura).
  if (!/^\d+$/.test(id) || id === '0' || incidenteid !== '0') return;

  // Monta um link "limpo", no mesmo formato que já foi testado e funcionou.
  const link = ehViewDireto
    ? `${location.origin}${location.pathname}?id=${id}&origem=${encodeURIComponent(origem)}&width=1632&height=756&incidenteid=0&Userid=0`
    : `${location.origin}${location.pathname}?id=${id}&origem=${encodeURIComponent(origem)}&OrigemChamadaAbertura=Arvore`;

  const PREFIXO = 'abertura de chamado para o serviço';

  // Procura o título "Abertura de chamado para o serviço ..." e devolve o que vem depois.
  function lerCaminhoServico() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let no;
    while ((no = walker.nextNode())) {
      if (!no.nodeValue.toLowerCase().includes(PREFIXO)) continue;
      let el = no.parentElement;
      for (let i = 0; i < 3 && el; i++) {
        const texto = el.textContent.replace(/\s+/g, ' ').trim();
        const pos = texto.toLowerCase().indexOf(PREFIXO);
        const resto = texto.slice(pos + PREFIXO.length).replace(/^[\s:\-]+/, '').trim();
        if (resto) return resto;
        el = el.parentElement;
      }
    }
    return '';
  }

  function capitalizar(t) {
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
  }

  async function salvar(caminhoServ) {
    const partes = caminhoServ.split('/').map((p) => capitalizar(p.trim())).filter(Boolean);
    const nomeLido = partes.length ? partes[partes.length - 1] : `Serviço ${id}`;
    const chave = `${id}|${origem}`;
    const agora = new Date().toISOString();

    const { servicos = {} } = await chrome.storage.local.get('servicos');
    const antigo = servicos[chave];
    servicos[chave] = {
      id,
      origem,
      link,
      nome: antigo && antigo.renomeado ? antigo.nome : nomeLido,
      renomeado: !!(antigo && antigo.renomeado),
      caminho: partes.length ? partes.join(' / ') : (antigo && antigo.caminho) || '',
      primeiraVez: (antigo && antigo.primeiraVez) || agora,
      ultimaVez: agora,
    };
    await chrome.storage.local.set({ servicos });
    return { novo: !antigo, nome: servicos[chave].nome };
  }

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    }
  }

  // Barrinha flutuante no canto da tela. Fica dentro de um "shadow DOM"
  // para o visual do site não bagunçar o da extensão (e vice-versa).
  function mostrarBarra(nome, novo) {
    if (document.getElementById('csc-links-host')) return;
    const host = document.createElement('div');
    host.id = 'csc-links-host';
    host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;';
    const sombra = host.attachShadow({ mode: 'open' });
    sombra.innerHTML = `
      <style>
        .barra { font: 13px/1.35 Segoe UI, Arial, sans-serif; background: #1f2937; color: #f9fafb;
                 border-radius: 10px; padding: 10px 12px; box-shadow: 0 6px 20px rgba(0,0,0,.35);
                 max-width: 420px; display: flex; flex-direction: column; gap: 8px; }
        .topo { display: flex; align-items: flex-start; gap: 8px; }
        .nome { font-weight: 600; flex: 1; word-break: break-word; }
        .status { color: #86efac; font-size: 12px; }
        .acoes { display: flex; gap: 6px; }
        button { font: inherit; border: 0; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
        .copiar { background: #3b82f6; color: #fff; }
        .copiar:hover { background: #2563eb; }
        .fechar { background: transparent; color: #9ca3af; padding: 0 4px; font-size: 16px; line-height: 1; }
        .fechar:hover { color: #fff; }
      </style>
      <div class="barra">
        <div class="topo">
          <span>🔗</span>
          <span class="nome"></span>
          <button class="fechar" title="Fechar">×</button>
        </div>
        <div class="status"></div>
        <div class="acoes"><button class="copiar">Copiar link direto</button></div>
      </div>`;
    sombra.querySelector('.nome').textContent = nome;
    sombra.querySelector('.status').textContent = novo
      ? 'Link novo descoberto e salvo na lista da extensão.'
      : 'Este link já estava salvo na lista da extensão.';
    sombra.querySelector('.fechar').addEventListener('click', () => host.remove());
    const btn = sombra.querySelector('.copiar');
    btn.addEventListener('click', async () => {
      const ok = await copiar(link);
      btn.textContent = ok ? 'Copiado!' : 'Não consegui copiar';
      setTimeout(() => (btn.textContent = 'Copiar link direto'), 2000);
    });
    document.documentElement.appendChild(host);
  }

  // O título às vezes demora um pouco para aparecer: tenta algumas vezes.
  let tentativas = 0;
  function iniciar() {
    const caminhoServ = lerCaminhoServico();
    if (!caminhoServ && tentativas < 4) {
      tentativas++;
      setTimeout(iniciar, 800);
      return;
    }
    salvar(caminhoServ)
      .then(({ novo, nome }) => mostrarBarra(nome, novo))
      .catch((e) => console.warn('[Caminho CSC] erro ao salvar:', e));
  }
  iniciar();
})();
