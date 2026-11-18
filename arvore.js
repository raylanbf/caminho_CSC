// Na tela da árvore de serviços (IncidenteV2.aspx):
// 1) Recebe do arvore-main.js os serviços visíveis e junta no catálogo do Chrome.
// 2) Mostra o menu do botão direito ("Copiar link do serviço" / "Abrir em nova aba").
(() => {
  if (window.top !== window) return;
  if (!/\/chamados\/incidentev2\.aspx$/i.test(location.pathname)) return;

  const campoOrigem = document.getElementById('MainContent_hidorigem');
  const origem = (campoOrigem && campoOrigem.value) || new URLSearchParams(location.search).get('origem') || '';
  if (origem !== 'Incidente' && origem !== 'ChamadosGrupo') return;

  const montarLink = (id) =>
    `${location.origin}/Chamados/viewIncidenteDireto.aspx?id=${id}&origem=${encodeURIComponent(origem)}&width=1632&height=756&incidenteid=0&Userid=0`;

  // ---------- 1) Catálogo ----------
  // Aceita o formato antigo (lista) e o novo (objeto por ID).
  function normalizarCatalogo(c) {
    const itens = {};
    if (c && c.itens) {
      for (const it of Object.values(c.itens)) if (it && it.id) itens[it.id] = it;
    }
    return { atualizado: (c && (c.atualizado || c.quando)) || null, itens };
  }

  async function juntar(recebidos) {
    const { catalogo = {} } = await chrome.storage.local.get('catalogo');
    const atual = normalizarCatalogo(catalogo[origem]);
    let mudou = false;
    for (const it of recebidos) {
      if (!it || !/^\d+$/.test(String(it.id))) continue;
      const novo = { id: String(it.id), nome: String(it.nome || ''), caminho: String(it.caminho || ''), tipo: String(it.tipo || '') };
      const antes = atual.itens[novo.id];
      if (!antes || antes.nome !== novo.nome || antes.caminho !== novo.caminho) {
        if (antes && antes.grupos) novo.grupos = antes.grupos; // grupos vistos nos chamados
        atual.itens[novo.id] = novo;
        mudou = true;
      }
    }
    if (!mudou) return;
    atual.atualizado = new Date().toISOString();
    catalogo[origem] = atual;
    await chrome.storage.local.set({ catalogo });
  }

  // ---------- 2) Menu do botão direito ----------
  const host = document.createElement('div');
  host.id = 'caminho-csc-menu';
  host.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;';
  const sombra = host.attachShadow({ mode: 'open' });
  sombra.innerHTML = `
    <style>
      .menu { position: fixed; min-width: 230px; max-width: 380px; background: #fff; color: #111827;
              border: 1px solid #d1d5db; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.18);
              font: 13px/1.35 Segoe UI, Arial, sans-serif; padding: 4px 0; }
      .titulo { padding: 6px 12px 7px; font-size: 12px; color: #6b7280; border-bottom: 1px solid #e5e7eb;
                margin-bottom: 4px; word-break: break-word; }
      .titulo b { color: #111827; font-weight: 600; }
      button { display: block; width: 100%; text-align: left; background: none; border: 0;
               padding: 7px 12px; font: inherit; color: inherit; cursor: pointer; }
      button:hover, button:focus { background: #eff6ff; outline: none; }
      .aviso { position: fixed; right: 16px; bottom: 16px; background: #1f2937; color: #f9fafb;
               font: 13px/1.35 Segoe UI, Arial, sans-serif; padding: 9px 14px; border-radius: 8px;
               box-shadow: 0 6px 20px rgba(0,0,0,.3); max-width: 380px; }
      [hidden] { display: none !important; }
    </style>
    <div class="menu" hidden>
      <div class="titulo">🔗 Caminho CSC · <b></b></div>
      <button class="copiar">📋 Copiar link do serviço</button>
      <button class="abrir">↗ Abrir em nova aba</button>
    </div>
    <div class="aviso" hidden></div>`;
  document.documentElement.appendChild(host);

  const elMenu = sombra.querySelector('.menu');
  const elNome = sombra.querySelector('.titulo b');
  const elAviso = sombra.querySelector('.aviso');
  let servicoAtual = null;
  let timerAviso;

  function fecharMenu() {
    elMenu.hidden = true;
    servicoAtual = null;
  }

  function mostrarAviso(texto) {
    elAviso.textContent = texto;
    elAviso.hidden = false;
    clearTimeout(timerAviso);
    timerAviso = setTimeout(() => (elAviso.hidden = true), 2500);
  }

  function abrirMenu(x, y, servico) {
    servicoAtual = servico;
    elNome.textContent = servico.nome;
    elMenu.hidden = false;
    // Não deixa o menu sair da tela.
    const r = elMenu.getBoundingClientRect();
    elMenu.style.left = Math.max(4, Math.min(x, window.innerWidth - r.width - 4)) + 'px';
    elMenu.style.top = Math.max(4, Math.min(y, window.innerHeight - r.height - 4)) + 'px';
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

  sombra.querySelector('.copiar').addEventListener('click', async () => {
    if (!servicoAtual) return;
    const { nome, id } = servicoAtual;
    fecharMenu();
    const ok = await copiar(montarLink(id));
    mostrarAviso(ok ? `Link copiado: ${nome}` : 'Não consegui copiar o link.');
  });

  sombra.querySelector('.abrir').addEventListener('click', () => {
    if (!servicoAtual) return;
    const link = montarLink(servicoAtual.id);
    fecharMenu();
    window.open(link, '_blank', 'noopener');
  });

  // Fecha o menu ao clicar fora, apertar Esc, rolar a página ou trocar de janela.
  document.addEventListener('mousedown', (ev) => {
    if (!elMenu.hidden && !ev.composedPath().includes(host)) fecharMenu();
  }, true);
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') fecharMenu();
  }, true);
  window.addEventListener('scroll', fecharMenu, true);
  window.addEventListener('blur', fecharMenu);

  // ---------- Mensagens do arvore-main.js ----------
  let fila = Promise.resolve(); // processa um catálogo de cada vez
  window.addEventListener('message', (ev) => {
    if (ev.source !== window || !ev.data || ev.data.caminhoCscMain !== true) return;
    const d = ev.data;
    if (d.tipo === 'servicos') {
      const recebidos = Array.isArray(d.itens) ? d.itens : [];
      fila = fila.then(() => juntar(recebidos)).catch((e) => console.warn('[Caminho CSC] erro ao salvar catálogo:', e));
    } else if (d.tipo === 'menu' && d.servico && /^\d+$/.test(String(d.servico.id))) {
      abrirMenu(Number(d.x) || 0, Number(d.y) || 0, {
        id: String(d.servico.id),
        nome: String(d.servico.nome || ''),
      });
    }
  });

  // Avisa o arvore-main.js que já dá para receber a lista.
  window.postMessage({ caminhoCsc: true, tipo: 'pronto' }, location.origin);
})();
