// Cria as tochas e as brasas nas laterais. Basta incluir este script na página.
(function () {
  if (document.querySelector(".laterais")) return;

  const raiz = document.createElement("div");
  raiz.className = "laterais";
  raiz.setAttribute("aria-hidden", "true");

  function criar(classe) {
    const el = document.createElement("div");
    el.className = classe;
    return el;
  }

  ["esquerda", "direita"].forEach((lado) => {
    const tocha = criar("laterais__tocha laterais__tocha--" + lado);
    tocha.append(criar("laterais__halo"), criar("laterais__chama"), criar("laterais__suporte"), criar("laterais__cabo"));
    raiz.append(tocha);
  });

  for (let i = 0; i < 24; i++) {
    const brasa = criar("laterais__brasa");
    const esquerda = i % 2 === 0;
    const x = esquerda ? 2 + Math.random() * 14 : 84 + Math.random() * 14;
    brasa.style.setProperty("--x", x + "%");
    brasa.style.setProperty("--dur", 6 + Math.random() * 8 + "s");
    brasa.style.setProperty("--delay", -Math.random() * 12 + "s");
    brasa.style.setProperty("--deriva", Math.random() * 60 - 30 + "px");
    raiz.append(brasa);
  }

  document.body.append(raiz);
})();// Cria as brasas nas laterais. Basta incluir este script na página.
(function () {
  if (document.querySelector(".laterais")) return;

  const raiz = document.createElement("div");
  raiz.className = "laterais";
  raiz.setAttribute("aria-hidden", "true");

  for (let i = 0; i < 24; i++) {
    const brasa = document.createElement("span");
    brasa.className = "laterais__brasa";
    const esquerda = i % 2 === 0;
    const x = esquerda ? 2 + Math.random() * 14 : 84 + Math.random() * 14;
    brasa.style.setProperty("--x", x + "%");
    brasa.style.setProperty("--dur", 6 + Math.random() * 8 + "s");
    brasa.style.setProperty("--delay", -Math.random() * 12 + "s");
    brasa.style.setProperty("--deriva", Math.random() * 60 - 30 + "px");
    raiz.append(brasa);
  }

  document.body.append(raiz);
})();