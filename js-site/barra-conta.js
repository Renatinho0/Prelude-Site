// Coloque em TODAS as páginas do site (depois do auth.js).
// Todos: mostra Entrar / Olá, nome · Sair.  Admin: ganha "Painel" e "Editar página".
(function () {
  const pagina = location.pathname.split("/").pop() || "index.html";
  const CHAVE = "prelude_conteudo";
  const sessao = lerSessao();
  const lerConteudo = () => { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) { return {}; } };
  const gravarConteudo = (c) => { try { localStorage.setItem(CHAVE, JSON.stringify(c)); return true; } catch (e) { return false; } };

  // elementos editáveis: textos sem filhos e imagens, na ordem da página
  const fora = (el) => !el.closest(".barra-conta");
  const textos = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,figcaption,label,li a")].filter((e) => fora(e) && e.children.length === 0);
  const imagens = [...document.querySelectorAll("img")].filter(fora);
  const textoOriginal = textos.map((e) => e.textContent);
  const imagemOriginal = imagens.map((e) => e.getAttribute("src"));

  // aplica o que o admin já editou nesta página
  const salvo = lerConteudo()[pagina] || {};
  Object.entries(salvo.textos || {}).forEach(([i, t]) => { if (textos[i]) textos[i].textContent = t; });
  Object.entries(salvo.imagens || {}).forEach(([i, s]) => { if (imagens[i]) imagens[i].setAttribute("src", s); });

  // ----- barra -----
  const barra = document.createElement("div");
  barra.className = "barra-conta";
  const status = document.createElement("span");
  status.className = "barra-conta__status";

  function botao(rotulo, aoClicar) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "barra-conta__botao"; b.textContent = rotulo;
    b.addEventListener("click", aoClicar);
    return b;
  }
  function link(rotulo, href) {
    const a = document.createElement("a");
    a.className = "barra-conta__link"; a.href = href; a.textContent = rotulo;
    return a;
  }
  function montarBarra(editando) {
    barra.replaceChildren();
    if (!sessao) { barra.append(link("Entrar / Registrar-se", "login.html")); }
    else {
      const ola = document.createElement("span");
      ola.className = "barra-conta__texto"; ola.textContent = "Olá, " + sessao.nome;
      barra.append(ola);
      if (sessao.role === "admin") {
        if (editando) barra.append(botao("Salvar", salvar), botao("Cancelar", () => location.reload()), botao("Restaurar página", restaurar));
        else barra.append(link("Painel", "admin.html"), botao("Editar página", iniciarEdicao));
      }
      if (!editando) barra.append(botao("Sair", sair));
    }
    barra.append(status);
  }

  // ----- edição (só admin) -----
  let editando = false;
  function iniciarEdicao() {
    editando = true;
    document.dispatchEvent(new CustomEvent("site-edicao"));
    textos.forEach((e) => { e.contentEditable = "true"; e.classList.add("barra-conta__editavel"); });
    imagens.forEach((i) => i.classList.add("barra-conta__editavel", "barra-conta__editavel--imagem"));
    status.textContent = "Clique num texto para editar ou numa imagem para trocar.";
    montarBarra(true);
  }
  document.addEventListener("click", (e) => {
    if (!editando || e.target.closest(".barra-conta")) return;
    const img = e.target.closest("img");
    if (e.target.closest("a") || img) e.preventDefault();
    if (img && imagens.includes(img)) escolherImagem(img);
  }, true);

  function escolherImagem(img) {
    const entrada = document.createElement("input");
    entrada.type = "file"; entrada.accept = "image/*";
    entrada.addEventListener("change", async () => {
      if (!entrada.files[0]) return;
      try { img.setAttribute("src", await reduzirImagem(entrada.files[0])); status.textContent = "Imagem trocada. Clique em Salvar."; }
      catch (err) { status.textContent = err.message; }
    });
    entrada.click();
  }

  function salvar() {
    const reg = { textos: {}, imagens: {} };
    textos.forEach((e, i) => { if (e.textContent !== textoOriginal[i]) reg.textos[i] = e.textContent; });
    imagens.forEach((img, i) => { if (img.getAttribute("src") !== imagemOriginal[i]) reg.imagens[i] = img.getAttribute("src"); });
    const tudo = lerConteudo();
    if (Object.keys(reg.textos).length || Object.keys(reg.imagens).length) tudo[pagina] = reg; else delete tudo[pagina];
    if (!gravarConteudo(tudo)) { status.textContent = "Sem espaço para salvar. Use imagens menores."; return; }
    location.reload();
  }
  function restaurar() {
    if (!confirm("Voltar esta página ao original?")) return;
    const tudo = lerConteudo(); delete tudo[pagina]; gravarConteudo(tudo); location.reload();
  }

  function reduzirImagem(arquivo, max = 900) {
    return new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      leitor.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Arquivo de imagem inválido."));
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.8));
        };
        img.src = leitor.result;
      };
      leitor.readAsDataURL(arquivo);
    });
  }

  montarBarra(false);
  document.body.append(barra);
})();