/* =====================================================
   Heróis do Prelude: salva e mostra os cadastros
   Os dados ficam no localStorage (só neste navegador).
   Funciona em duas páginas:
   - CadastroHerois.html (tem o formulário .carta)
   - Herois.html (só precisa de um <div class="galeria">)
   ===================================================== */

const CHAVE = 'prelude:herois';

function lerHerois() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || [];
  } catch {
    return [];
  }
}

function salvarHerois(lista) {
  localStorage.setItem(CHAVE, JSON.stringify(lista));
}

/* Reduz a foto para caber no localStorage (limite de ~5 MB) */
function reduzirImagem(arquivo, larguraMax = 300) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = reject;
    leitor.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const escala = Math.min(1, larguraMax / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}

function criarElemento(tag, classe, texto) {
  const el = document.createElement(tag);
  el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function criarCarta(heroi) {
  const carta = criarElemento('article', 'mini-carta');

  const titulo = criarElemento('header', 'mini-carta__titulo');
  titulo.append(
    criarElemento('h3', 'mini-carta__nome', heroi.nome),
    criarElemento('p', 'mini-carta__classe', heroi.classe)
  );

  const arte = criarElemento('div', 'mini-carta__arte');
  if (heroi.foto) {
    const imagem = criarElemento('img', 'mini-carta__imagem');
    imagem.src = heroi.foto;
    imagem.alt = 'Imagem de ' + heroi.nome;
    arte.appendChild(imagem);
  } else {
    arte.appendChild(criarElemento('span', 'mini-carta__sem-imagem', 'Sem imagem'));
  }

  const dados = criarElemento('div', 'mini-carta__dados');
  dados.appendChild(criarElemento('span', 'mini-carta__dado', 'Idade: ' + heroi.idade + ' anos'));
  if (heroi.pais) {
    dados.appendChild(criarElemento('span', 'mini-carta__dado', 'País: ' + heroi.pais));
  }

  const remover = criarElemento('button', 'mini-carta__remover', 'Remover');
  remover.type = 'button';
  remover.addEventListener('click', () => {
    salvarHerois(lerHerois().filter(h => h.id !== heroi.id));
    mostrarGaleria();
  });

  carta.append(titulo, arte, dados);
  if (heroi.lema) {
    carta.appendChild(criarElemento('p', 'mini-carta__lema', heroi.lema));
  }
  carta.appendChild(remover);
  return carta;
}

function mostrarGaleria() {
  const galeria = document.querySelector('.galeria');
  if (!galeria) return;

  galeria.replaceChildren();
  const lista = lerHerois();

  if (lista.length === 0) {
    galeria.appendChild(
      criarElemento('p', 'galeria__vazio', 'Nenhum herói cadastrado ainda.')
    );
    return;
  }
  lista.forEach(heroi => galeria.appendChild(criarCarta(heroi)));
}

/* Formulário de cadastro */
const formulario = document.querySelector('.carta');

if (formulario) {
  const aviso = document.querySelector('.carta__aviso');

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    aviso.textContent = '';

    const dados = new FormData(formulario);
    const arquivo = dados.get('foto');
    let foto = '';

    try {
      if (arquivo && arquivo.size > 0) foto = await reduzirImagem(arquivo);
    } catch {
      aviso.textContent = 'Não foi possível ler essa imagem. Escolha outro arquivo.';
      return;
    }

    const lista = lerHerois();
    lista.push({
      id: Date.now(),
      nome: dados.get('nome').trim(),
      idade: Number(dados.get('idade')),
      pais: dados.get('pais').trim(),
      lema: dados.get('lema').trim(),
      classe: formulario.classe.selectedOptions[0].textContent,
      foto
    });

    try {
      salvarHerois(lista);
    } catch {
      aviso.textContent = 'Sem espaço para salvar. Remova algum herói e tente de novo.';
      return;
    }

    formulario.reset();
    aviso.textContent = 'Herói cadastrado!';
    mostrarGaleria();
  });
}

mostrarGaleria();