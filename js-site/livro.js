// Transforma os capítulos da página em um livro com páginas que viram.
// Inclua DEPOIS do auth.js e do barra-conta.js.
(function () {
  const NIVEL = "auto"; // "auto", "h2" ou "h3": o título que abre cada capítulo
  const reduzido = matchMedia("(prefers-reduced-motion: reduce)");

  const fora = (el) => el.closest("header, footer, nav, .livro, .barra-conta, .laterais");

  function elemento(tag, classe, texto) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  // ---------- achar os capítulos da página ----------
  function achar() {
    const lista = (n) => [...document.querySelectorAll(n)].filter((h) => !fora(h));
    let nivel = NIVEL;
    if (nivel === "auto") nivel = ["h2", "h3", "h4"].find((n) => lista(n).length >= 2);
    if (!nivel) return [];
    // títulos de nível menor (h3, h4...) dentro do capítulo viram subtítulos
    const sub = [3, 4, 5, 6].filter((n) => n > Number(nivel[1])).map((n) => "h" + n);
    const seletor = ["p", ...sub].join(",");

    const caps = [];
    lista(nivel).forEach((h) => {
      const itens = [];
      for (let s = h.nextElementSibling; s && !s.matches(nivel) && !s.querySelector(nivel); s = s.nextElementSibling) itens.push(s);
      const blocos = [];
      itens.forEach((s) => {
        [...(s.matches(seletor) ? [s] : []), ...s.querySelectorAll(seletor)].forEach((e) => {
          const texto = e.textContent.trim();
          if (texto) blocos.push({ sub: e.tagName !== "P", texto });
        });
      });
      if (blocos.some((b) => !b.sub)) caps.push({ nivel, h, itens, titulo: h.textContent.trim(), blocos });
    });
    return caps;
  }

  // ---------- páginas ----------
  function criarPagina(lado) {
    const p = elemento("div", "livro__pagina livro__pagina--" + lado);
    p.append(elemento("div", "livro__topo"), elemento("div", "livro__conteudo"), elemento("div", "livro__numero"));
    return p;
  }

  function preencher(pagEl, paginas, i) {
    const [topo, conteudo, numero] = pagEl.children;
    const d = paginas[i];
    conteudo.replaceChildren();
    pagEl.classList.toggle("livro__pagina--vazia", !d);
    if (!d) { topo.textContent = ""; numero.textContent = ""; return; }
    topo.textContent = d.cap;
    numero.textContent = i + 1;
    d.blocos.forEach((b) => {
      if (b.titulo) conteudo.append(elemento("h2", "livro__titulo", b.titulo));
      else if (b.sub) conteudo.append(elemento("h3", "livro__subtitulo", b.sub));
      else conteudo.append(elemento("p", "livro__paragrafo" + (b.continua ? " livro__paragrafo--continua" : ""), b.texto));
    });
  }

  // divide o texto em páginas medindo quanto cabe em cada uma
  function paginar(caps, conteudo) {
    const paginas = [];
    let pag;
    const nova = (cap) => { pag = { cap: cap.titulo, blocos: [] }; paginas.push(pag); conteudo.replaceChildren(); };
    const cabe = () => conteudo.scrollHeight <= conteudo.clientHeight + 1;

    caps.forEach((cap) => {
      nova(cap);
      conteudo.append(elemento("h2", "livro__titulo", cap.titulo));
      pag.blocos.push({ titulo: cap.titulo });

      cap.blocos.forEach((bloco) => {
        if (bloco.sub) {
          const h = elemento("h3", "livro__subtitulo", bloco.texto);
          conteudo.append(h);
          // o subtítulo precisa caber junto com algumas linhas do texto
          const prova = elemento("p", "livro__paragrafo", "palavra ".repeat(24).trim());
          conteudo.append(prova);
          const ok = cabe();
          prova.remove();
          if (!ok && pag.blocos.length) { h.remove(); nova(cap); conteudo.append(h); }
          pag.blocos.push({ sub: bloco.texto });
          return;
        }
        const texto = bloco.texto;
        const palavras = texto.split(/\s+/);
        let inicio = 0, continua = false;
        while (inicio < palavras.length) {
          const p = elemento("p", "livro__paragrafo" + (continua ? " livro__paragrafo--continua" : ""));
          conteudo.append(p);
          let lo = 0, hi = palavras.length - inicio;
          while (lo < hi) {
            const meio = Math.ceil((lo + hi) / 2);
            p.textContent = palavras.slice(inicio, inicio + meio).join(" ");
            if (cabe()) lo = meio; else hi = meio - 1;
          }
          if (lo === 0) {
            p.remove();
            if (pag.blocos.length) { nova(cap); continue; }
            lo = 1; // página vazia e nem uma palavra cabe: força para não travar
          }
          const trecho = palavras.slice(inicio, inicio + lo).join(" ");
          p.textContent = trecho;
          pag.blocos.push({ texto: trecho, continua });
          inicio += lo;
          continua = true;
          if (inicio < palavras.length) nova(cap);
        }
      });
    });
    return paginas;
  }

  // ---------- livro ----------
  const suave = (t) => (1 - Math.cos(Math.PI * t)) / 2; // começa e termina devagar

  function iniciar() {
    const caps = achar();
    if (!caps.length) return;

    // esconde os capítulos originais (o texto continua no HTML)
    const ocultos = [];
    caps.forEach((c) => {
      const pai = c.h.parentElement;
      const sozinho = pai && !["BODY", "MAIN"].includes(pai.tagName) && pai.querySelectorAll(c.nivel).length === 1;
      (sozinho ? [pai] : [c.h, ...c.itens]).forEach((e) => { e.classList.add("livro__oculto"); ocultos.push(e); });
    });

    const raiz = elemento("section", "livro");
    raiz.setAttribute("aria-label", "Livro");
    const livro = elemento("div", "livro__livro");
    const pEsq = criarPagina("esquerda");
    const pDir = criarPagina("direita");
    const sombra = elemento("div", "livro__sombra");
    const folha = elemento("div", "livro__folha");
    folha.hidden = true;
    const frente = elemento("div", "livro__face livro__face--frente");
    const verso = elemento("div", "livro__face livro__face--verso");
    folha.append(frente, verso);
    livro.append(pEsq, pDir, sombra, folha);

    const botao = (rotulo) => { const b = elemento("button", "livro__botao", rotulo); b.type = "button"; return b; };
    const ant = botao("‹ Anterior");
    const prox = botao("Próxima ›");
    const ind = elemento("span", "livro__indicador");
    ind.setAttribute("aria-live", "polite");
    const controles = elemento("div", "livro__controles");
    controles.append(ant, ind, prox);
    raiz.append(livro, controles);
    ocultos[0].before(raiz);

    let paginas = [], indice = 0, duplo = true, ocupado = false, pendente = 0, arraste = null;
    const passo = () => (duplo ? 2 : 1);

    function desenhar() {
      preencher(pEsq, paginas, indice);
      preencher(pDir, paginas, indice + 1);
      const a = indice + 1, b = Math.min(indice + passo(), paginas.length);
      ind.textContent = duplo && b > a ? `Páginas ${a}–${b} de ${paginas.length}` : `Página ${a} de ${paginas.length}`;
      ant.disabled = indice <= 0;
      prox.disabled = indice + passo() >= paginas.length;
    }

    function recalcular() {
      const proporcao = paginas.length ? indice / paginas.length : 0;
      duplo = matchMedia("(min-width: 900px)").matches;
      raiz.classList.toggle("livro--simples", !duplo);
      paginas = paginar(caps, pEsq.children[1]);
      const max = Math.max(0, paginas.length - 1);
      indice = Math.min(max, Math.floor((proporcao * paginas.length) / passo()) * passo());
      desenhar();
    }

    // ----- a folha que vira: o ângulo (0 a 180) controla tudo -----
    function angulo(sentido, a) {
      folha.style.transform = `rotateY(${sentido > 0 ? -a : a}deg)`;
      const t = Math.sin((a * Math.PI) / 180);
      folha.style.setProperty("--sombra", (t * 0.4).toFixed(3));
      sombra.style.opacity = (t * 0.7).toFixed(3);
    }

    function preparar(sentido, novo) {
      ocupado = true;
      const direita = sentido > 0;
      folha.className = "livro__folha livro__folha--" + (direita ? "direita" : "esquerda");
      const pFrente = criarPagina(direita ? "direita" : "esquerda");
      const pVerso = criarPagina(direita ? "esquerda" : "direita");
      preencher(pFrente, paginas, direita ? indice + 1 : indice);
      preencher(pVerso, paginas, direita ? novo : novo + 1);
      frente.replaceChildren(pFrente);
      verso.replaceChildren(pVerso);
      // por baixo da folha aparece a página que será revelada
      if (direita) preencher(pDir, paginas, novo + 1); else preencher(pEsq, paginas, novo);
      angulo(sentido, 0);
      folha.hidden = false;
    }

    function animar(sentido, de, para, aoFim) {
      const duracao = Math.max(280, (950 * Math.abs(para - de)) / 180);
      const inicio = performance.now();
      const quadro = (agora) => {
        const t = Math.min(1, (agora - inicio) / duracao);
        angulo(sentido, de + (para - de) * suave(t));
        if (t < 1) requestAnimationFrame(quadro); else aoFim();
      };
      requestAnimationFrame(quadro);
    }

    function concluir(novo, ok) {
      if (ok) indice = novo;
      desenhar();
      folha.hidden = true;
      sombra.style.opacity = 0;
      ocupado = false;
      if (pendente) { const s = pendente; pendente = 0; virar(s); }
    }

    function virar(sentido) {
      if (arraste && arraste.mov) return;
      if (ocupado) { pendente = sentido; return; } // guarda 1 virada para depois (teclas rápidas)
      const novo = indice + sentido * passo();
      if (novo < 0 || novo >= paginas.length) return;
      if (!duplo || reduzido.matches) {
        indice = novo;
        desenhar();
        if (!reduzido.matches) {
          pEsq.animate([{ opacity: 0, transform: `translateX(${sentido * 28}px)` }, { opacity: 1, transform: "none" }], { duration: 320, easing: "ease-out" });
        }
        return;
      }
      preparar(sentido, novo);
      animar(sentido, 0, 180, () => concluir(novo, true));
    }

    // ----- clicar ou arrastar a página -----
    livro.addEventListener("pointerdown", (e) => {
      if (ocupado || e.button > 0 || e.target.closest("button, a")) return;
      const r = livro.getBoundingClientRect();
      const sentido = duplo ? (e.clientX > r.left + r.width / 2 ? 1 : -1) : 0;
      arraste = { sentido, x0: e.clientX, mov: false, a: 0, meia: r.width / 2, id: e.pointerId };
      if (duplo) {
        arraste.novo = indice + sentido * passo();
        if (arraste.novo < 0 || arraste.novo >= paginas.length) arraste = null;
      }
    });

    livro.addEventListener("pointermove", (e) => {
      if (!arraste) return;
      const dx = e.clientX - arraste.x0;
      if (!arraste.mov && Math.abs(dx) < 8) return;
      if (!duplo) { arraste.mov = true; return; }
      const d = -arraste.sentido * dx; // arrastar para o lado oposto vira a página
      if (!arraste.mov) {
        if (d < 0) { arraste = null; return; }
        arraste.mov = true;
        livro.setPointerCapture(arraste.id);
        preparar(arraste.sentido, arraste.novo);
      }
      arraste.a = Math.max(0, Math.min(180, (d / arraste.meia) * 180));
      angulo(arraste.sentido, arraste.a);
    });

    function soltar(e) {
      const A = arraste;
      arraste = null;
      if (!A) return;
      if (!duplo) {
        const dx = e.clientX - A.x0;
        if (Math.abs(dx) > 50) virar(dx < 0 ? 1 : -1);
        return;
      }
      if (!A.mov) { virar(A.sentido); return; } // clique simples vira a página
      const ok = A.a > 50;
      animar(A.sentido, A.a, ok ? 180 : 0, () => concluir(A.novo, ok));
    }
    document.addEventListener("pointerup", soltar);
    document.addEventListener("pointercancel", soltar);

    ant.addEventListener("click", () => virar(-1));
    prox.addEventListener("click", () => virar(1));
    document.addEventListener("keydown", (e) => {
      if (raiz.hidden || e.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") virar(1);
      if (e.key === "ArrowLeft") virar(-1);
    });

    let espera;
    addEventListener("resize", () => {
      clearTimeout(espera);
      espera = setTimeout(() => { if (!raiz.hidden && !ocupado) recalcular(); }, 250);
    });

    // o admin entrou no modo de edição: mostra o texto original para poder editar
    document.addEventListener("site-edicao", () => {
      raiz.hidden = true;
      ocultos.forEach((e) => e.classList.remove("livro__oculto"));
    });

    recalcular();
  }

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(iniciar);
})();