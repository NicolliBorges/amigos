"use strict";

// SHA-256 do primeiro nome normalizado: o nome não fica legível no código da página.
const HASH_FORA = "e121ce4e4096bdecfb4d2e5538a1b376097f5e46fada72e117c608e78340c5af";

const $ = (id) => document.getElementById(id);
const CALMO = matchMedia("(prefers-reduced-motion: reduce)").matches;
const TINTA = "#1a1423";

/* ---------- Pixel art ---------- */

function novaGrade(w, h) {
  return Array.from({ length: h }, () => Array(w).fill(null));
}

function pintar(g, x, y, w, h, cor) {
  for (let j = y; j < y + h; j += 1) {
    for (let i = x; i < x + w; i += 1) {
      if (g[j] && i >= 0 && i < g[j].length) g[j][i] = cor;
    }
  }
}

function contornar(g, cor) {
  const copia = g.map((l) => [...l]);
  g.forEach((linha, y) => linha.forEach((c, x) => {
    if (c) return;
    if (copia[y - 1]?.[x] || copia[y + 1]?.[x] || copia[y][x - 1] || copia[y][x + 1]) g[y][x] = cor;
  }));
  return g;
}

function gradeParaCanvas(g) {
  const c = document.createElement("canvas");
  c.width = g[0].length;
  c.height = g.length;
  const ctx = c.getContext("2d");
  g.forEach((linha, y) => linha.forEach((cor, x) => {
    if (!cor) return;
    ctx.fillStyle = cor;
    ctx.fillRect(x, y, 1, 1);
  }));
  return c;
}

function escurecer(hex, f = 0.72) {
  const n = parseInt(hex.slice(1), 16);
  const canal = (v) => Math.round(v * f).toString(16).padStart(2, "0");
  return `#${canal(n >> 16)}${canal((n >> 8) & 255)}${canal(n & 255)}`;
}

function linhasParaCanvas(linhas, cores, escala = 1) {
  const c = document.createElement("canvas");
  c.width = linhas[0].length * escala;
  c.height = linhas.length * escala;
  const ctx = c.getContext("2d");
  linhas.forEach((linha, y) => [...linha].forEach((ch, x) => {
    if (!cores[ch]) return;
    ctx.fillStyle = cores[ch];
    ctx.fillRect(x * escala, y * escala, escala, escala);
  }));
  return c;
}

/* ---------- Personagens ---------- */

function pintarCabelo(r, estilo, cor, dy, camisa) {
  const sombra = escurecer(cor);
  const brilho = escurecer(cor, 1.35);
  if (estilo === "longo") {
    r(7, 1 + dy, 10, 3, cor); r(6, 2 + dy, 12, 3, cor);
    r(7, 4 + dy, 10, 2, cor); r(7, 6 + dy, 2, 2, cor); r(15, 6 + dy, 2, 2, cor);
    r(9, 2 + dy, 3, 1, brilho);
  } else if (estilo === "partido") {
    r(7, 1 + dy, 10, 2, cor); r(6, 2 + dy, 12, 3, cor);
    r(6, 5 + dy, 2, 14, cor); r(16, 5 + dy, 2, 14, cor);
    r(8, 4 + dy, 3, 1, cor); r(14, 4 + dy, 2, 1, cor);
    r(8, 2 + dy, 3, 1, brilho); r(14, 2 + dy, 2, 1, brilho); r(6, 8 + dy, 1, 8, brilho); r(17, 8 + dy, 1, 8, sombra);
  } else if (estilo === "penteado") {
    r(7, 1 + dy, 10, 2, cor); r(6, 2 + dy, 12, 2, cor); r(7, 4 + dy, 10, 1, cor);
    r(6, 4 + dy, 1, 3, cor); r(17, 4 + dy, 1, 2, cor);
    r(9, 2 + dy, 6, 1, brilho);
    r(6, 10 + dy, 1, 1, "#d7dbe2");
  } else if (estilo === "curto") {
    r(7, 1 + dy, 10, 2, cor); r(6, 2 + dy, 12, 3, cor);
    r(6, 5 + dy, 2, 4, cor); r(16, 5 + dy, 2, 3, cor); r(8, 4 + dy, 5, 2, cor);
    r(9, 2 + dy, 3, 1, brilho); r(6, 7 + dy, 1, 2, sombra);
  } else if (estilo === "coque") {
    r(10, -1 + dy, 4, 2, cor); r(7, 1 + dy, 10, 2, cor); r(6, 2 + dy, 12, 3, cor);
    r(6, 5 + dy, 2, 2, cor); r(16, 5 + dy, 2, 2, cor); r(8, 4 + dy, 8, 1, cor);
    r(11, -1 + dy, 2, 1, brilho);
  } else if (estilo === "cacheado") {
    r(7, 0 + dy, 10, 3, cor); r(5, 2 + dy, 14, 3, cor); r(4, 4 + dy, 3, 8, cor); r(17, 4 + dy, 3, 8, cor);
    r(7, 4 + dy, 3, 2, cor); r(12, 4 + dy, 3, 1, cor); r(16, 4 + dy, 1, 2, cor);
    r(6, 1 + dy, 2, 1, brilho); r(13, 1 + dy, 2, 1, brilho); r(5, 8 + dy, 1, 2, sombra); r(18, 8 + dy, 1, 2, sombra);
  } else if (estilo === "bone") {
    r(6, 5 + dy, 2, 3, cor); r(16, 5 + dy, 2, 2, cor);
    r(7, 1 + dy, 10, 2, camisa); r(6, 2 + dy, 12, 3, camisa); r(7, 5 + dy, 13, 1, escurecer(camisa));
    r(10, 2 + dy, 3, 2, "#ffffff");
  }
}

function criarPersonagem(p, pose = {}) {
  const {
    bracoDir = "baixo", bracoEsq = "baixo", pernas = "juntas",
    olhar = 0, piscar = false, boca = "sorriso", ajoelhar = false, salto = 0, semCoroa = false,
  } = pose;
  const g = novaGrade(30, 36);
  const r = (x, y, w, h, cor) => pintar(g, x + 3, y + 1, w, h, cor);
  const dy = (ajoelhar ? 6 : 0) + salto;
  const peleSombra = escurecer(p.pele, 0.82);
  const roupaSombra = escurecer(p.roupa);
  const calcaSombra = escurecer(p.calca);

  // Cabelo de trás
  if (p.cabelo === "longo" || p.cabelo === "partido") {
    r(5, 3 + dy, 14, 18, p.corCabelo);
    r(5, 9 + dy, 1, 11, escurecer(p.corCabelo));
    r(18, 9 + dy, 1, 11, escurecer(p.corCabelo));
  } else if (p.cabelo === "penteado") {
    r(5, 5 + dy, 3, 9, p.corCabelo);
    r(4, 12 + dy, 2, 3, p.corCabelo);
  }

  // Pernas
  const topoPerna = p.saia ? 26 : 24;
  const corPerna = p.saia ? p.pele : p.calca;
  const alturaPerna = 29 - topoPerna;
  if (ajoelhar) {
    r(8, 28, 8, 2, p.calca);
    r(6, 29, 4, 2, calcaSombra); r(3, 30, 3, 1, p.sapato);
    r(14, 27, 5, 2, p.calca); r(17, 29, 2, 2, p.calca); r(17, 30, 4, 1, p.sapato);
  } else {
    if (pernas === "a") {
      r(7, topoPerna + salto, 3, alturaPerna, corPerna); r(6, 29 + salto, 4, 2, p.sapato);
      r(14, topoPerna + salto, 3, alturaPerna - 1, corPerna); r(14, 28 + salto, 4, 2, p.sapato);
    } else if (pernas === "b") {
      r(8, topoPerna + salto, 3, alturaPerna - 1, corPerna); r(7, 28 + salto, 4, 2, p.sapato);
      r(13, topoPerna + salto, 3, alturaPerna, corPerna); r(13, 29 + salto, 5, 2, p.sapato);
    } else {
      r(8, topoPerna + salto, 3, alturaPerna, corPerna); r(13, topoPerna + salto, 3, alturaPerna, corPerna);
      r(7, 29 + salto, 4, 2, p.sapato); r(13, 29 + salto, 4, 2, p.sapato);
    }
    if (p.saia) {
      r(7, 22 + salto, 10, 4, p.calca); r(7, 25 + salto, 10, 1, calcaSombra);
    } else {
      r(8, 22 + salto, 8, 2, p.calca); r(15, 22 + salto, 1, 2, calcaSombra);
    }
  }

  // Tronco
  r(8, 14 + dy, 8, 8, p.roupa);
  r(15, 14 + dy, 1, 8, roupaSombra);
  if (p.blazer) {
    r(9, 14 + dy, 1, 8, "#aab0bd"); r(13, 14 + dy, 1, 8, "#aab0bd");
    r(10, 14 + dy, 4, 5, "#17120f");
    r(10, 19 + dy, 1, 1, p.roupa); r(13, 19 + dy, 1, 1, p.roupa);
    r(11, 20 + dy, 2, 1, "#17120f");
  } else {
    r(8, 18 + dy, 7, 2, p.detalhe);
    r(10, 14 + dy, 4, 1, p.golaAlta ? roupaSombra : peleSombra);
  }

  // Braços
  if (bracoEsq === "lado") {
    r(3, 16 + dy, 5, 2, roupaSombra); r(1, 16 + dy, 2, 2, p.pele);
  } else if (bracoEsq === "alto") {
    r(6, 8 + dy, 2, 7, p.roupa); r(6, 6 + dy, 2, 2, p.pele);
  } else {
    r(6, 14 + dy, 2, 7, roupaSombra); r(6, 21 + dy, 2, 2, p.pele);
  }
  if (bracoDir === "lado") {
    r(16, 16 + dy, 5, 2, p.roupa); r(21, 16 + dy, 2, 2, p.pele);
  } else if (bracoDir === "alto") {
    r(16, 8 + dy, 2, 7, p.roupa); r(16, 6 + dy, 2, 2, p.pele);
  } else if (bracoDir === "acena") {
    r(16, 14 + dy, 2, 1, p.roupa); r(17, 8 + dy, 2, 6, p.roupa); r(18, 6 + dy, 2, 2, p.pele);
  } else {
    r(16, 14 + dy, 2, 7, p.roupa); r(16, 21 + dy, 2, 2, p.pele);
  }

  // Cabeça e rosto
  r(10, 13 + dy, 4, 1, p.golaAlta ? roupaSombra : peleSombra);
  r(8, 3 + dy, 8, 1, p.pele); r(7, 4 + dy, 10, 8, p.pele); r(8, 12 + dy, 8, 1, peleSombra);
  r(16, 6 + dy, 1, 5, peleSombra);
  pintarCabelo(r, p.cabelo, p.corCabelo, dy, p.roupa);
  if (piscar) {
    r(9 + olhar, 8 + dy, 2, 1, TINTA); r(13 + olhar, 8 + dy, 2, 1, TINTA);
  } else {
    r(9 + olhar, 7 + dy, 2, 2, TINTA); r(13 + olhar, 7 + dy, 2, 2, TINTA);
    r(9 + olhar, 7 + dy, 1, 1, "#ffffff"); r(13 + olhar, 7 + dy, 1, 1, "#ffffff");
  }
  r(8, 10 + dy, 1, 1, "#ef8d9a"); r(15, 10 + dy, 1, 1, "#ef8d9a");
  if (boca === "aberta") {
    r(11 + olhar, 10 + dy, 2, 2, "#8a2b3a");
  } else {
    r(10 + olhar, 10 + dy, 1, 1, TINTA); r(11 + olhar, 11 + dy, 2, 1, TINTA); r(13 + olhar, 10 + dy, 1, 1, TINTA);
  }
  if (p.coroa && !semCoroa) {
    r(8, 1 + dy, 8, 2, "#ffcb2e");
    r(8, 0 + dy, 1, 1, "#ffcb2e"); r(11, 0 + dy, 2, 1, "#ffcb2e"); r(15, 0 + dy, 1, 1, "#ffcb2e");
    r(11, 1 + dy, 2, 1, "#ff5c8a");
  }
  return gradeParaCanvas(contornar(g, TINTA));
}

const cacheSprite = new Map();
function sprite(p, pose = {}) {
  const chave = `${p.id}|${JSON.stringify(pose)}`;
  if (!cacheSprite.has(chave)) cacheSprite.set(chave, criarPersonagem(p, pose));
  return cacheSprite.get(chave);
}

const TURMA = [
  { id: "t1", pele: "#8d5a3b", cabelo: "cacheado", corCabelo: "#2d1a10", roupa: "#ff5c8a", detalhe: "#ffd1dd", calca: "#2b4c9b", sapato: "#f5f5f5" },
  { id: "t2", pele: "#f2c29b", cabelo: "bone", corCabelo: "#a35a1c", roupa: "#2ec4b6", detalhe: "#ffffff", calca: "#3a3a55", sapato: "#e4572e" },
  { id: "t3", pele: "#d9a074", cabelo: "longo", corCabelo: "#17120f", roupa: "#ffcb2e", detalhe: "#f08a24", calca: "#7a3e9d", sapato: "#3a2340", saia: true },
];

const ROTINA = [
  { }, { }, { bracoDir: "acena" }, { bracoDir: "alto" }, { bracoDir: "acena" },
  { }, { piscar: true }, { }, { olhar: 1 }, { olhar: 1 }, { },
];

function criarBoneco(p, atraso = 0) {
  const el = document.createElement("div");
  el.className = "boneco";
  const c = document.createElement("canvas");
  c.width = 30;
  c.height = 36;
  el.append(c);
  const ctx = c.getContext("2d");
  let tique = -atraso;
  el.desenhar = (forcarParado) => {
    ctx.clearRect(0, 0, 30, 36);
    tique += 1;
    let pose = {};
    if (!forcarParado) {
      pose = tique < 4 ? { pernas: tique % 2 ? "a" : "b" } : ROTINA[(tique + atraso * 3) % ROTINA.length];
    }
    ctx.drawImage(sprite(p, pose), 0, 0);
  };
  el.desenhar(CALMO);
  return el;
}

function montarTurma(alvo, meio) {
  const bonecos = TURMA.map((p, i) => criarBoneco(p, i));
  if (meio) bonecos.splice(1, 1, meio);
  alvo.replaceChildren(...bonecos);
}

if (!CALMO) {
  setInterval(() => {
    document.querySelectorAll(".tela:not([hidden]) .boneco").forEach((b) => b.desenhar());
  }, 260);
}

/* ---------- Objetos ---------- */

const MAO = [
  "......KKKKKKK......",
  "......KSNNNSK......",
  "......KSNNNSK......",
  "......KSNNNSK......",
  "......KSSSSSK......",
  "......KSSSSSK......",
  "......KSSSSSK......",
  "......KSDDDSK......",
  "......KSSSSSK......",
  "......KSSSSSK......",
  ".KKKKKKSSSSSKKKKKK.",
  "KSSDSSDSSSSSDSSSSSK",
  "KSSDSSDSSSSSDSSSSSK",
  "KSSDSSDSSSSSDSSSSSK",
  "KDDDDDDDDDDDDDDDDDK",
  "KSSSSSSSSSSSSSSSSSK",
  "KSSSSKKKKKKKKKKKKK.",
  "KSSSSKSSSSSSSSSSSSK",
  "KSSSSKKKKKKKKKKKKK.",
  "KSSSSSSSSSSSSSSSSK.",
  ".KSSSSSSSSSSSSSSK..",
  "..KKSSSSSSSSSSKK...",
  "....KCCCCCCCCK.....",
  "....KCCCCCCCCK.....",
];

const CONTROLE = [
  "...KKKKKKKKKKKKKK...",
  "..KGGGGGGGGGGGGGGK..",
  ".KGGGWGGGGGGGGRGGGK.",
  "KGGGWWWGGGGGGRGRGGGK",
  "KGGGGWGGGGGGGGRGGGGK",
  "KGGGGGGKKKKKKGGGGGGK",
  ".KGGGGK......KGGGGK.",
  "..KKKK........KKKK..",
];

const CORACAO = [
  ".KK.KK.",
  "KRRKRRK",
  "KRRRRRK",
  ".KRRRK.",
  "..KRK..",
  "...K...",
];

const INTERROGACAO = [
  ".KKKKK.",
  "KWWWWWK",
  "KWKKKWK",
  ".KK.KWK",
  "...KWK.",
  "...KWK.",
  "....K..",
  "...KWK.",
  "....K..",
];

function criarBau(aberto) {
  const g = novaGrade(30, 26);
  const madeira = "#a0562a";
  const escura = "#6d3518";
  const ouro = "#ffcb2e";
  if (aberto) {
    pintar(g, 3, 1, 24, 7, escura); pintar(g, 3, 1, 24, 1, madeira); pintar(g, 13, 1, 4, 7, ouro);
    pintar(g, 5, 8, 20, 4, "#fff3a6");
    pintar(g, 9, 9, 3, 2, ouro); pintar(g, 18, 9, 3, 2, "#ff5c8a"); pintar(g, 14, 8, 2, 3, "#ffffff");
  } else {
    pintar(g, 3, 5, 24, 7, madeira); pintar(g, 5, 3, 20, 2, madeira); pintar(g, 3, 10, 24, 2, escura);
  }
  pintar(g, 3, 12, 24, 12, madeira); pintar(g, 3, 21, 24, 3, escura);
  pintar(g, 3, 12, 2, 12, ouro); pintar(g, 25, 12, 2, 12, ouro);
  if (!aberto) { pintar(g, 3, 5, 2, 7, ouro); pintar(g, 25, 5, 2, 7, ouro); }
  pintar(g, 13, 11, 4, 5, ouro); pintar(g, 14, 13, 2, 2, TINTA);
  return gradeParaCanvas(contornar(g, TINTA));
}

/* ---------- Conversas ---------- */

function conversar(balao, botao, falas) {
  return new Promise((resolve) => {
    let i = 0;
    let timer = null;
    let texto = "";
    const escrever = (fala) => {
      texto = fala;
      balao.setAttribute("aria-label", fala);
      if (CALMO) { balao.textContent = fala; return; }
      balao.textContent = "";
      let n = 0;
      timer = setInterval(() => {
        n += 1;
        balao.textContent = fala.slice(0, n);
        if (n >= fala.length) { clearInterval(timer); timer = null; }
      }, 26);
    };
    const clicar = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
        balao.textContent = texto;
        return;
      }
      i += 1;
      if (i >= falas.length) {
        botao.removeEventListener("click", clicar);
        resolve();
        return;
      }
      escrever(falas[i]);
    };
    botao.addEventListener("click", clicar);
    escrever(falas[0]);
  });
}

/* ---------- Telas ---------- */

function mostrar(id) {
  document.querySelectorAll(".tela").forEach((t) => { t.hidden = t.id !== id; });
  scrollTo(0, 0);
}

function normalizar(nome) {
  return nome.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .trim().toLowerCase().split(/\s+/)[0] || "";
}

async function sha256(texto) {
  const dados = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest("SHA-256", dados);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

let nomeAtual = "";
let primeiroNome = "";

$("start").addEventListener("click", async () => {
  $("start").hidden = true;
  $("capa").hidden = true;
  $("balao-entrada").hidden = false;
  $("prox-entrada").hidden = false;
  await conversar($("balao-entrada"), $("prox-entrada"), [
    "Psiu! Ei, você aí!",
    "Até que enfim! A gente estava te esperando.",
    "Tem uma surpresa guardada aqui, mas ela só abre para a pessoa certa.",
    "Então me conta: quem está jogando?",
  ]);
  $("prox-entrada").hidden = true;
  $("form-nome").hidden = false;
  $("nome").focus({ preventScroll: true });
});

$("form-nome").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = $("nome").value.trim().replace(/\s+/g, " ");
  if (!nome) return;
  nomeAtual = nome;
  primeiroNome = nome.split(" ")[0];

  if ((await sha256(normalizar(nome))) === HASH_FORA) {
    $("recado-fora").textContent = "NÃO SOMOS AMIGAS";
    prepararMusica();
    mostrar("tela-fora");
    return;
  }

  // Quem já confirmou volta direto para as listas, sem repetir o caminho.
  try {
    const confirmados = await carregarConfirmados();
    if (confirmados.some((c) => c.chave === chaveDoNome(nome))) {
      $("cena-bau").hidden = true;
      $("painel-bau").hidden = true;
      $("jogador").textContent = nomeAtual;
      $("revelacao").hidden = false;
      await montarPresenca($("presenca-amigos"));
      await abrirLista(false);
      return;
    }
  } catch { /* sem a lista, segue o caminho normal */ }

  montarTurma($("turma-amigos"));
  mostrar("tela-amigos");
  await conversar($("balao-amigos"), $("prox-amigos"), [
    `${primeiroNome}! Eu sabia que você vinha!`,
    "A surpresa é sua, mas antes preciso de um favor.",
    "Deixa um recadinho? Pode ser para todo mundo ver ou só para mim.",
  ]);
  $("prox-amigos").hidden = true;
  $("form-recado").hidden = false;
  $("recado").focus({ preventScroll: true });
});

$("voltar").addEventListener("click", () => {
  $("nome").value = "";
  mostrar("tela-entrada");
});

/* ---------- Mural ---------- */

const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.CONFIG || {};
const TEM_BANCO = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const CHAVE_LOCAL = "mural-teste";
const CABECALHOS = TEM_BANCO
  ? { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" }
  : {};

function lerLocal() {
  try { return JSON.parse(localStorage.getItem(CHAVE_LOCAL)) || []; } catch { return []; }
}

async function salvarMensagem(nome, texto, publica) {
  if (!TEM_BANCO) {
    try { localStorage.setItem(CHAVE_LOCAL, JSON.stringify([{ nome, texto, publica }, ...lerLocal()])); } catch { /* modo de teste */ }
    return;
  }
  const r = await fetch(`${SUPABASE_URL}/rest/v1/mensagens`, {
    method: "POST",
    headers: { ...CABECALHOS, Prefer: "return=minimal" },
    body: JSON.stringify({ nome, texto, publica }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
}

async function carregarMural() {
  if (!TEM_BANCO) return lerLocal().filter((m) => m.publica);
  const r = await fetch(`${SUPABASE_URL}/rest/v1/mensagens?select=nome,texto&publica=eq.true&order=criado_em.desc&limit=100`, { headers: CABECALHOS });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function itemMural(texto, autor) {
  const li = document.createElement("li");
  if (autor) {
    const s = document.createElement("strong");
    s.textContent = autor;
    li.append(s);
  }
  li.append(texto);
  return li;
}

async function preencherMural() {
  $("modo-teste").hidden = TEM_BANCO;
  const mural = $("mural");
  try {
    const mensagens = await carregarMural();
    mural.replaceChildren(...(mensagens.length
      ? mensagens.map((m) => itemMural(m.texto, m.nome))
      : [itemMural("Nenhum recado público por enquanto.")]));
  } catch {
    mural.replaceChildren(itemMural("Não deu para carregar o mural agora. Tente de novo mais tarde."));
  }
}

async function abrirBau(fala) {
  const bauFechado = createBauEl(false);
  montarTurma($("turma-convite"), bauFechado);
  mostrar("tela-convite");
  const botao = $("prox-convite");
  await conversar($("balao-convite"), botao, [
    fala,
    "Agora, a surpresa. Ela estava trancada neste baú...",
    "...e a chave sempre foi sua. Vai lá!",
  ]);
  botao.textContent = "ABRIR O BAÚ";
  await new Promise((resolve) => botao.addEventListener("click", resolve, { once: true }));
  botao.disabled = true;
  bauFechado.replaceChildren(criarBau(true));
  $("balao-convite").textContent = "Tcharam!";
  await new Promise((resolve) => setTimeout(resolve, CALMO ? 0 : 800));
  $("cena-bau").hidden = true;
  $("painel-bau").hidden = true;
  $("jogador").textContent = nomeAtual;
  $("revelacao").hidden = false;
  scrollTo(0, 0);
  await montarPresenca($("presenca-amigos"));
}

function createBauEl(aberto) {
  const el = document.createElement("div");
  el.className = "bau";
  el.append(criarBau(aberto));
  return el;
}

$("form-recado").addEventListener("submit", async (e) => {
  e.preventDefault();
  const texto = $("recado").value.trim();
  if (!texto) return;
  const publica = e.target.elements.visibilidade.value === "publica";
  const botao = $("enviar");
  botao.disabled = true;
  $("erro-recado").hidden = true;
  try {
    await salvarMensagem(nomeAtual, texto, publica);
  } catch {
    $("erro-recado").textContent = "Sua mensagem não foi enviada. Tente de novo.";
    $("erro-recado").hidden = false;
    botao.disabled = false;
    return;
  }
  $("recado").value = "";
  botao.disabled = false;
  abrirBau(publica ? "Prontinho, seu recado já está no mural!" : "Prontinho! Seu recado fica só entre nós.");
});

$("pular-recado").addEventListener("click", () => abrirBau("Sem problema, fica para depois!"));

/* ---------- Filme ---------- */

const PERSONA_RUIVA = { id: "ruiva", coroa: true, golaAlta: true, pele: "#f0c0a0", cabelo: "partido", corCabelo: "#b4541c", roupa: "#6f3a2a", detalhe: "#6f3a2a", calca: "#9c5a3f", sapato: "#4a2418", saia: true };
const PERSONA_BLAZER = { id: "blazer", coroa: true, blazer: true, pele: "#d9a57e", cabelo: "penteado", corCabelo: "#17120f", roupa: "#f4f4f0", detalhe: "#f4f4f0", calca: "#22222e", sapato: "#111111" };

// PAR_A recebe o anel. PAR_B se ajoelha e acorda do sonho.
const PAR_A = PERSONA_RUIVA;
const PAR_B = PERSONA_BLAZER;

const FILME_W = 120;
const FILME_H = 110;
const CHAO_FILME = 94;
const TOPO_ATOR = CHAO_FILME - 32;
const DURACAO = 30;

const LEGENDAS = [
  [0.8, "Era uma vez, em um reino muito distante..."],
  [2.6, "...uma princesa que trazia uma caixinha."],
  [5, "Diante da sua amada, ela se ajoelhou."],
  [6, "Lá dentro, um anel encantado!"],
  [7.4, "— Aceita ser minha princesa?"],
  [9.2, "— ACEITO!"],
  [11.6, "E o anel encontrou o seu lugar."],
  [14, "De mãos dadas, seguiram até o castelo..."],
  [15.8, "Teve casamento, teve festa..."],
  [17.4, "...e viveram felizes para sempre."],
  [19.2, "FIM"],
  [21, "Bem... quase."],
  [24.8, "Foi só um sonho!"],
  [26.8, "Mas uma coisa era de verdade..."],
];

const faixa = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const mistura = (a, b, f) => a + (b - a) * f;

function criarCenario() {
  const c = document.createElement("canvas");
  c.width = FILME_W;
  c.height = FILME_H;
  const ctx = c.getContext("2d");
  const faixas = ["#2c1f63", "#4a2a7d", "#7a3a8f", "#b84b8c", "#ec6f7d", "#fb9c63", "#ffc65c"];
  faixas.forEach((cor, i) => {
    ctx.fillStyle = cor;
    ctx.fillRect(0, i * 11, FILME_W, 11);
    if (i > 0) {
      ctx.fillStyle = cor;
      for (let x = i % 2 * 2; x < FILME_W; x += 4) ctx.fillRect(x, i * 11 - 1, 2, 1);
    }
  });
  ctx.fillStyle = "#fff3a6";
  for (let y = -11; y <= 11; y += 1) {
    const w = Math.round(Math.sqrt(121 - y * y));
    ctx.fillRect(56 - w, 62 + y, w * 2, 1);
  }
  // Castelo
  const pedra = "#d9c8e8";
  const pedraSombra = "#a58fc4";
  ctx.fillStyle = pedra;
  ctx.fillRect(92, 50, 24, 30);
  ctx.fillRect(88, 38, 8, 42);
  ctx.fillRect(112, 38, 8, 42);
  ctx.fillRect(100, 32, 8, 18);
  ctx.fillStyle = pedraSombra;
  ctx.fillRect(95, 38, 1, 42);
  ctx.fillRect(119, 38, 1, 42);
  ctx.fillRect(101, 66, 6, 14);
  ctx.fillStyle = "#b3134a";
  [[87, 34, 10], [111, 34, 9], [99, 28, 10]].forEach(([x, y, w]) => {
    for (let i = 0; i < 4; i += 1) ctx.fillRect(x + i, y + i - 3, w - i * 2, 1);
    ctx.fillRect(x, y + 1, w, 2);
  });
  ctx.fillStyle = "#ffcb2e";
  ctx.fillRect(91, 44, 2, 3);
  ctx.fillRect(115, 44, 2, 3);
  ctx.fillRect(103, 38, 2, 3);
  ctx.fillStyle = "#ffffff";
  [[8, 5], [24, 14], [41, 4], [62, 11], [98, 6], [111, 16]].forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
  const morro = (cor, base, amp, passo) => {
    ctx.fillStyle = cor;
    for (let x = 0; x < FILME_W; x += 1) {
      const h = Math.round(Math.sin(x / passo) * amp);
      ctx.fillRect(x, base - h, 1, FILME_H - base + h);
    }
  };
  morro("#5d3a7e", 72, 6, 17);
  morro("#32557a", 78, 3, 9);
  ctx.fillStyle = "#3fa34d";
  ctx.fillRect(0, 82, FILME_W, 28);
  ctx.fillStyle = "#2f8a3e";
  ctx.fillRect(0, 96, FILME_W, 14);
  ctx.fillStyle = "#5ac05f";
  for (let x = 3; x < FILME_W; x += 9) ctx.fillRect(x, 82 + (x % 4), 1, 2);
  [[9, 100, "#ff5c8a"], [31, 104, "#ffffff"], [52, 99, "#ffcb2e"], [73, 105, "#ff5c8a"], [96, 100, "#ffffff"], [112, 104, "#ffcb2e"]].forEach(([x, y, cor]) => {
    ctx.fillStyle = cor;
    ctx.fillRect(x - 1, y, 3, 1);
    ctx.fillRect(x, y - 1, 1, 3);
  });
  // Árvore
  ctx.fillStyle = "#5a3418";
  ctx.fillRect(9, 56, 5, 28);
  ctx.fillStyle = "#256a3a";
  ctx.fillRect(0, 34, 24, 24);
  ctx.fillStyle = "#2f8a3e";
  ctx.fillRect(2, 30, 18, 8);
  ctx.fillRect(16, 40, 10, 12);
  return c;
}

const cenario = criarCenario();
const spriteCoracao = linhasParaCanvas(CORACAO, { K: TINTA, R: "#ff5c8a" });
const spriteDuvida = linhasParaCanvas(INTERROGACAO, { K: TINTA, W: "#ffffff" });

const ANEL_GRANDE = [
  "...........",
  "....BBB....",
  "...BWWBB...",
  "....BBB....",
  "...GGGGG...",
  "..GG...GG..",
  "..G.....G..",
  "..G.....G..",
  "..GG...GG..",
  "...GGGGG...",
  "...........",
];

function criarAnelGrande() {
  const cores = { G: "#ffcb2e", B: "#7fe3ff", W: "#ffffff" };
  const g = ANEL_GRANDE.map((l) => [...l].map((ch) => cores[ch] || null));
  return gradeParaCanvas(contornar(g, TINTA));
}
const spriteAnel = criarAnelGrande();

function desenharAnelGrande(ctx, x, y, t) {
  ctx.drawImage(spriteAnel, Math.round(x) - 5, Math.round(y) - 5);
  if (Math.floor(t * 5) % 2) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(Math.round(x), Math.round(y) - 8, 1, 3);
    ctx.fillRect(Math.round(x) + 6, Math.round(y) - 5, 3, 1);
    ctx.fillRect(Math.round(x) - 8, Math.round(y) - 3, 3, 1);
  }
}

function desenharAnel(ctx, x, y, t) {
  ctx.fillStyle = "#ffcb2e";
  ctx.fillRect(x, y + 1, 3, 1);
  ctx.fillRect(x, y + 3, 3, 1);
  ctx.fillRect(x - 1, y + 2, 1, 1);
  ctx.fillRect(x + 3, y + 2, 1, 1);
  ctx.fillStyle = "#bdf3ff";
  ctx.fillRect(x + 1, y, 1, 1);
  if (Math.floor(t * 5) % 2) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + 1, y - 3, 1, 2);
    ctx.fillRect(x + 4, y - 1, 2, 1);
    ctx.fillRect(x - 3, y - 1, 2, 1);
  }
}

function desenharCaixa(ctx, x, y, aberta) {
  ctx.fillStyle = TINTA;
  ctx.fillRect(x - 1, y - 1, 8, 6);
  ctx.fillStyle = "#b3134a";
  ctx.fillRect(x, y, 6, 4);
  ctx.fillStyle = "#ffcb2e";
  ctx.fillRect(x, y + 1, 6, 1);
  if (aberta) {
    ctx.fillStyle = TINTA;
    ctx.fillRect(x - 1, y - 5, 8, 4);
    ctx.fillStyle = "#7c0d33";
    ctx.fillRect(x, y - 4, 6, 3);
  }
}

function coracoes(ctx, t, inicio, origemX, origemY) {
  const decorrido = t - inicio;
  if (decorrido < 0) return;
  for (let i = 0; i < 5; i += 1) {
    const fase = (decorrido * 0.45 + i * 0.2) % 1;
    const x = origemX + Math.sin(i * 2.4 + fase * 5) * (8 + i * 2);
    const y = origemY - fase * 34;
    ctx.drawImage(spriteCoracao, Math.round(x), Math.round(y));
  }
}

const spriteExclamacao = linhasParaCanvas(["KWWK", "KWWK", "KWWK", ".KK.", "KWWK", ".KK."], { K: TINTA, W: "#ffffff" });
const spriteEnvelope = linhasParaCanvas([
  "KKKKKKKKKKKKKKKKKK",
  "KCFCCCCCCCCCCCCFCK",
  "KCCFFCCCCCCCCFFCCK",
  "KCCCCFFCCCCFFCCCCK",
  "KCCCCCCFRRFCCCCCCK",
  "KCCCCCCRRRRCCCCCCK",
  "KCCCCCCCRRCCCCCCCK",
  "KCCCCCCCCCCCCCCCCK",
  "KCCCCCCCCCCCCCCCCK",
  "KCCCCCCCCCCCCCCCCK",
  "KKKKKKKKKKKKKKKKKK",
], { K: TINTA, C: "#fff4d6", F: "#d9c49a", R: "#ff5c8a" });

function criarQuarto() {
  const c = document.createElement("canvas");
  c.width = FILME_W;
  c.height = FILME_H;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#6b5a9c";
  ctx.fillRect(0, 0, FILME_W, 92);
  ctx.fillStyle = "#8a5a3b";
  ctx.fillRect(0, 92, FILME_W, 18);
  ctx.fillStyle = "#6d4326";
  for (let y = 96; y < FILME_H; y += 6) ctx.fillRect(0, y, FILME_W, 1);
  // Janela com o amanhecer
  ctx.fillStyle = TINTA;
  ctx.fillRect(74, 12, 34, 34);
  ["#7a3a8f", "#ec6f7d", "#fb9c63", "#ffc65c"].forEach((cor, i) => {
    ctx.fillStyle = cor;
    ctx.fillRect(76, 14 + i * 7.5, 30, 8);
  });
  ctx.fillStyle = "#fff3a6";
  ctx.fillRect(86, 34, 10, 10);
  ctx.fillStyle = TINTA;
  ctx.fillRect(90, 14, 2, 30);
  ctx.fillRect(76, 28, 30, 2);
  // Prateleira com o controle: a pista da surpresa
  ctx.fillStyle = "#6d4326";
  ctx.fillRect(36, 34, 30, 3);
  ctx.drawImage(linhasParaCanvas(CONTROLE, { K: TINTA, G: "#9aa0b5", W: "#ffffff", R: "#ff5c8a" }), 41, 26);
  // Cama
  ctx.fillStyle = "#5a3418";
  ctx.fillRect(14, 58, 5, 36);
  ctx.fillRect(14, 80, 92, 12);
  ctx.fillRect(101, 68, 5, 26);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(19, 70, 82, 10);
  ctx.fillRect(20, 62, 16, 9);
  return c;
}
const quarto = criarQuarto();

function pintarCoberta(ctx, x) {
  ctx.fillStyle = "#ff5c8a";
  ctx.fillRect(x, 64, 101 - x, 16);
  ctx.fillStyle = "#ffd1dd";
  ctx.fillRect(x, 64, 101 - x, 3);
  ctx.fillStyle = "#b3134a";
  ctx.fillRect(x, 78, 101 - x, 2);
}

function letraZ(ctx, x, y, n) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, n, 1);
  ctx.fillRect(x, y + n - 1, n, 1);
  for (let i = 1; i < n - 1; i += 1) ctx.fillRect(x + n - 1 - i, y + i, 1, 1);
}

function quadroSonho(ctx, t) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(quarto, 0, 0);
  const acordou = t >= 24.8;

  if (!acordou) {
    ctx.save();
    ctx.translate(20, 80);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(sprite(PAR_B, { semCoroa: true, piscar: true }), 0, 0);
    ctx.restore();
    pintarCoberta(ctx, 36);
    [0, 0.33, 0.66].forEach((f, i) => {
      const fase = (t * 0.4 + f) % 1;
      letraZ(ctx, 36 + i * 3 + Math.round(fase * 8), 54 - Math.round(fase * 18), 3 + i);
    });
    // Nuvem do sonho, com o anel
    const nuvem = faixa(t, 22, 22.6) * (1 - faixa(t, 24.4, 24.8));
    if (nuvem > 0) {
      ctx.globalAlpha = nuvem;
      ctx.fillStyle = TINTA;
      ctx.fillRect(25, 5, 22, 18);
      ctx.fillRect(22, 8, 28, 12);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(26, 6, 20, 16);
      ctx.fillRect(23, 9, 26, 10);
      ctx.fillRect(30, 26, 4, 3);
      ctx.fillRect(31, 33, 3, 2);
      ctx.globalAlpha = 1;
      desenharAnelGrande(ctx, 35, 13, t);
    }
  } else {
    const olhar = t >= 26.8 ? 1 : 0;
    const pose = { semCoroa: true, olhar, boca: t >= 26.8 ? "sorriso" : "aberta", bracoDir: t >= 27.6 ? "lado" : "baixo", piscar: t < 25.1 };
    ctx.drawImage(sprite(PAR_B, pose), 14, 38);
    pintarCoberta(ctx, 21);
    if (t < 26.5) ctx.drawImage(spriteExclamacao, 27, 28);
    if (t >= 26.8) {
      const f = faixa(t, 26.8, 28.4);
      ctx.drawImage(spriteEnvelope, Math.round(mistura(124, 40, f)), Math.round(mistura(20, 46, f) + Math.sin(t * 5) * (1 - f) * 3));
    }
    if (t >= 28.4) {
      const fase = (t * 0.6) % 1;
      ctx.drawImage(spriteCoracao, 47, Math.round(42 - fase * 18));
    }
  }

  // Quarto escuro enquanto dorme, claro quando acorda
  const escuro = 0.5 * (1 - faixa(t, 24.8, 25.8));
  if (escuro > 0) {
    ctx.fillStyle = `rgba(16, 12, 48, ${escuro})`;
    ctx.fillRect(0, 0, FILME_W, FILME_H);
  }
  const preto = 1 - faixa(t, 20.5, 21.5);
  if (preto > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${preto})`;
    ctx.fillRect(0, 0, FILME_W, FILME_H);
  }
}

function quadroFilme(ctx, t) {
  if (t >= 20.5) {
    quadroSonho(ctx, t);
    return;
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cenario, 0, 0);

  const passo = Math.floor(t / 0.16) % 2 ? "a" : "b";
  let ax = 78;
  let bx = -30;
  let poseA = { olhar: -1 };
  let poseB = { olhar: 1 };

  if (t < 3.8) {
    bx = mistura(-30, 38, faixa(t, 0.8, 3.8));
    poseB = { olhar: 1, bracoDir: "lado", pernas: passo };
  } else if (t < 5) {
    bx = 38;
    poseB = { olhar: 1, bracoDir: "lado" };
  } else if (t < 11.6) {
    bx = 38;
    poseB = { olhar: 1, bracoDir: "lado", ajoelhar: true };
  } else if (t < 12.2) {
    bx = 38;
    poseB = { olhar: 1 };
  } else if (t < 13.2) {
    bx = mistura(38, 56, faixa(t, 12.2, 13.2));
    poseB = { olhar: 1, pernas: passo };
  } else if (t < 14) {
    bx = 56;
    poseB = { olhar: 1, bracoDir: "lado", piscar: Math.floor(t * 4) % 3 === 0 };
    poseA = { olhar: -1, bracoEsq: "lado", boca: "aberta" };
  } else {
    ax = mistura(78, 152, faixa(t, 14, 19));
    bx = ax - 22;
    poseB = { olhar: 1, bracoDir: "lado", pernas: passo };
    poseA = { olhar: 1, bracoEsq: "lado", pernas: passo === "a" ? "b" : "a", boca: "aberta" };
  }

  if (t >= 9.2 && t < 11.6) {
    poseA = { olhar: -1, bracoDir: "alto", bracoEsq: "alto", boca: "aberta", salto: Math.floor(t * 6) % 2 ? -3 : 0 };
  } else if (t >= 11.6 && t < 13.2) {
    poseA = { olhar: -1, bracoEsq: "lado", boca: "aberta" };
  } else if (t >= 5 && t < 9.2) {
    poseA = { olhar: -1, boca: t >= 6 ? "aberta" : "sorriso" };
  }

  // Sombras
  ctx.fillStyle = "#2f8a3e";
  ctx.fillRect(Math.round(ax) + 9, CHAO_FILME - 2, 14, 2);
  ctx.fillRect(Math.round(bx) + 9, CHAO_FILME - 2, 14, 2);

  ctx.drawImage(sprite(PAR_A, poseA), Math.round(ax), TOPO_ATOR);
  ctx.drawImage(sprite(PAR_B, poseB), Math.round(bx), TOPO_ATOR);

  const maoB = t >= 5 ? { x: Math.round(bx) + 24, y: TOPO_ATOR + 23 } : { x: Math.round(bx) + 24, y: TOPO_ATOR + 17 };

  // Caixa e anel
  if (t < 11.6) {
    desenharCaixa(ctx, maoB.x, maoB.y - 4, t >= 6);
  }
  if (t >= 6 && t < 11.6) {
    desenharAnelGrande(ctx, maoB.x + 3, maoB.y - 16 - faixa(t, 6, 6.6) * 2, t);
  } else if (t >= 11.6 && t < 13) {
    const f = faixa(t, 11.6, 12.6);
    desenharAnelGrande(ctx, mistura(65, 82, f), mistura(TOPO_ATOR + 5, TOPO_ATOR + 16, f), t);
  } else if (t >= 13) {
    desenharAnel(ctx, Math.round(ax) + 4, TOPO_ATOR + 15, t);
  }

  // Reações
  if (t >= 3.4 && t < 5) ctx.drawImage(spriteDuvida, Math.round(ax) + 12, TOPO_ATOR - 11);
  if (t >= 7.4 && t < 9.2) {
    const y = Math.round(Math.sin(t * 4)) + TOPO_ATOR - 2;
    ctx.drawImage(spriteCoracao, Math.round(bx) + 12, y);
  }
  if (t >= 9.2 && t < 14) coracoes(ctx, t, 9.2, ax + 12, TOPO_ATOR + 4);
  if (t >= 14) coracoes(ctx, t, 14, ax - 6, TOPO_ATOR + 4);

  // Cortina
  const abre = 1 - faixa(t, 0, 0.8);
  const fecha = faixa(t, 18.8, 19.8);
  const cortina = Math.max(abre, fecha) * (FILME_W / 2);
  if (cortina > 0) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, Math.ceil(cortina), FILME_H);
    ctx.fillRect(FILME_W - Math.ceil(cortina), 0, Math.ceil(cortina), FILME_H);
  }
  if (t >= 19.8) {
    const grande = 4;
    ctx.drawImage(spriteCoracao, (FILME_W - CORACAO[0].length * grande) / 2, (FILME_H - CORACAO.length * grande) / 2, CORACAO[0].length * grande, CORACAO.length * grande);
  }
}

/* ---------- Música (player oficial do YouTube) ---------- */

const VIDEOS_MUSICA = ["-BjZmE2gtdo", "uLL2xTK35Qc"];
let player = null;
let playerPronto = false;
let querTocar = false;
let videoAtual = 0;

function prepararMusica() {
  if (document.getElementById("yt-api")) return;
  window.onYouTubeIframeAPIReady = () => {
    player = new window.YT.Player("player", {
      width: 200,
      height: 200,
      videoId: VIDEOS_MUSICA[0],
      playerVars: { playsinline: 1, rel: 0 },
      events: {
        onReady: () => {
          playerPronto = true;
          if (querTocar) player.playVideo();
        },
        onError: () => {
          videoAtual += 1;
          if (videoAtual < VIDEOS_MUSICA.length) player.loadVideoById(VIDEOS_MUSICA[videoAtual]);
        },
      },
    });
  };
  const s = document.createElement("script");
  s.id = "yt-api";
  s.src = "https://www.youtube.com/iframe_api";
  document.head.append(s);
}

function tocarMusica() {
  querTocar = true;
  if (!playerPronto) return;
  player.seekTo(0, true);
  player.playVideo();
}

function pausarMusica() {
  querTocar = false;
  if (playerPronto) player.pauseVideo();
}

let quadroAtual = null;

function pararFilme() {
  if (quadroAtual) cancelAnimationFrame(quadroAtual);
  quadroAtual = null;
}

function encerrarFilme(ctx) {
  pararFilme();
  quadroFilme(ctx, DURACAO);
  $("legenda").textContent = LEGENDAS[LEGENDAS.length - 1][1];
  $("pular").hidden = true;
  $("rever").hidden = false;
  $("abrir-especial").hidden = false;
}

function tocarFilme() {
  pararFilme();
  mostrar("tela-filme");
  tocarMusica();
  $("pular").hidden = false;
  $("rever").hidden = true;
  $("abrir-especial").hidden = true;
  const ctx = $("filme").getContext("2d");
  $("legenda").textContent = "";
  let t = 0;
  let anterior = null;
  let legendaAtual = -1;
  const avancar = (agora) => {
    if (anterior !== null) t += Math.min(0.25, (agora - anterior) / 1000);
    anterior = agora;
    if (t >= DURACAO) { encerrarFilme(ctx); return; }
    quadroFilme(ctx, t);
    let i = -1;
    LEGENDAS.forEach(([inicio], j) => { if (t >= inicio) i = j; });
    if (i !== legendaAtual) {
      legendaAtual = i;
      if (i >= 0) $("legenda").textContent = LEGENDAS[i][1];
    }
    quadroAtual = requestAnimationFrame(avancar);
  };
  quadroAtual = requestAnimationFrame(avancar);
}

$("abrir-filme").addEventListener("click", tocarFilme);
$("rever").addEventListener("click", tocarFilme);
$("pular").addEventListener("click", () => encerrarFilme($("filme").getContext("2d")));
$("rever-especial").addEventListener("click", tocarFilme);
$("abrir-especial").addEventListener("click", () => {
  pararFilme();
  pausarMusica();
  mostrar("tela-especial");
  $("player2").textContent = nomeAtual;
  montarPresenca($("presenca-especial"));
});

/* ---------- Presença ---------- */

const CHAVE_PRESENCA = "presenca-teste";

function chaveDoNome(nome) {
  return nome.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

function lerPresencaLocal() {
  try { return JSON.parse(localStorage.getItem(CHAVE_PRESENCA)) || []; } catch { return []; }
}

async function carregarConfirmados() {
  if (!TEM_BANCO) return lerPresencaLocal();
  const r = await fetch(`${SUPABASE_URL}/rest/v1/confirmados?select=nome,chave&order=criado_em.asc&limit=200`, { headers: CABECALHOS });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function confirmarPresenca(nome) {
  const chave = chaveDoNome(nome);
  if (!TEM_BANCO) {
    const lista = lerPresencaLocal();
    if (!lista.some((c) => c.chave === chave)) {
      try { localStorage.setItem(CHAVE_PRESENCA, JSON.stringify([...lista, { nome, chave }])); } catch { /* modo de teste */ }
    }
    return;
  }
  const r = await fetch(`${SUPABASE_URL}/rest/v1/confirmados?on_conflict=chave`, {
    method: "POST",
    headers: { ...CABECALHOS, Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({ nome, chave }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
}

let telaDoConvite = "tela-convite";
let aoVoltarDaLista = () => {};

function selecionarAba(aba) {
  [["convidados", "painel-convidados"], ["mensagens", "painel-mensagens"]].forEach(([nome, painel]) => {
    const ativa = nome === aba;
    $(`aba-${nome}`).setAttribute("aria-selected", String(ativa));
    $(painel).hidden = !ativa;
  });
}

async function preencherConvidados() {
  $("teste-convidados").hidden = TEM_BANCO;
  const lista = $("lista-convidados");
  const aba = $("aba-convidados");
  try {
    const confirmados = await carregarConfirmados();
    aba.textContent = `CONVIDADOS (${confirmados.length})`;
    lista.replaceChildren(...(confirmados.length
      ? confirmados.map((c) => itemMural(c.nome))
      : [itemMural("Ninguém confirmou ainda. Seja a primeira pessoa!")]));
  } catch {
    aba.textContent = "CONVIDADOS";
    lista.replaceChildren(itemMural("Não deu para carregar a lista agora. Tente de novo mais tarde."));
  }
}

async function abrirLista(acabouDeConfirmar) {
  $("lista-aviso").hidden = !acabouDeConfirmar;
  $("aviso-aba").hidden = true;
  alternarFormAba(false);
  selecionarAba("convidados");
  mostrar("tela-lista");
  await Promise.all([preencherConvidados(), preencherMural()]);
}

function alternarFormAba(aberto) {
  $("form-aba").hidden = !aberto;
  $("nova-mensagem").hidden = aberto;
  if (aberto) {
    $("aviso-aba").hidden = true;
    $("recado-aba").focus();
  }
}

$("nova-mensagem").addEventListener("click", () => alternarFormAba(true));
$("cancelar-aba").addEventListener("click", () => alternarFormAba(false));
$("form-aba").addEventListener("submit", async (e) => {
  e.preventDefault();
  const texto = $("recado-aba").value.trim();
  if (!texto) return;
  const publica = e.target.elements.visibilidade.value === "publica";
  const botao = $("enviar-aba");
  botao.disabled = true;
  $("erro-aba").hidden = true;
  try {
    await salvarMensagem(nomeAtual, texto, publica);
  } catch {
    $("erro-aba").textContent = "Sua mensagem não foi enviada. Tente de novo.";
    $("erro-aba").hidden = false;
    botao.disabled = false;
    return;
  }
  botao.disabled = false;
  e.target.reset();
  alternarFormAba(false);
  $("aviso-aba").textContent = publica ? "Mensagem publicada!" : "Mensagem enviada em segredo!";
  $("aviso-aba").hidden = false;
  await preencherMural();
});

$("aba-convidados").addEventListener("click", () => selecionarAba("convidados"));
$("aba-mensagens").addEventListener("click", () => selecionarAba("mensagens"));
$("voltar-convite").addEventListener("click", () => {
  mostrar(telaDoConvite);
  aoVoltarDaLista();
});

async function montarPresenca(alvo) {
  telaDoConvite = alvo.closest(".tela").id;
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "confirmar";
  botao.textContent = "CONFIRMAR PRESENÇA";
  const erro = document.createElement("p");
  erro.className = "aviso";
  erro.setAttribute("role", "alert");
  erro.hidden = true;
  const ver = document.createElement("button");
  ver.type = "button";
  ver.className = "secundario ver-lista";
  ver.textContent = "VER CONVIDADOS E MENSAGENS";
  alvo.replaceChildren(botao, erro, ver);

  const marcarConfirmado = () => {
    botao.textContent = "PRESENÇA CONFIRMADA. ATÉ LÁ!";
    botao.disabled = true;
    botao.classList.add("confirmado");
  };

  const atualizar = async () => {
    try {
      const confirmados = await carregarConfirmados();
      if (confirmados.some((c) => c.chave === chaveDoNome(nomeAtual))) marcarConfirmado();
    } catch { /* o botão continua disponível para tentar confirmar */ }
  };
  aoVoltarDaLista = atualizar;

  ver.addEventListener("click", () => abrirLista(false));
  botao.addEventListener("click", async () => {
    botao.disabled = true;
    erro.hidden = true;
    try {
      await confirmarPresenca(nomeAtual);
    } catch {
      erro.textContent = "Sua presença não foi confirmada. Tente de novo.";
      erro.hidden = false;
      botao.disabled = false;
      return;
    }
    marcarConfirmado();
    await abrirLista(true);
  });

  await atualizar();
}

/* ---------- Início ---------- */

// Endereço criptografado: sem a senha, ele não pode ser lido nem no código da página.
const LOCAL_CIFRADO = {
  sal: "pkwYm/QGP5Z0eV113V1C4A==",
  iv: "NxVNMpzaUv/2GYcO",
  dados: "PC/7xvxISwMfePcg8aOi8JHJw1MIfAixsWl5+UplolexRx6mXEE=",
};

const deBase64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function abrirLocal(senha) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(senha), "PBKDF2", false, ["deriveKey"]);
  const chave = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: deBase64(LOCAL_CIFRADO.sal), iterations: 200000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const claro = await crypto.subtle.decrypt({ name: "AES-GCM", iv: deBase64(LOCAL_CIFRADO.iv) }, chave, deBase64(LOCAL_CIFRADO.dados));
  return new TextDecoder().decode(claro);
}

document.querySelectorAll(".js-local").forEach((alvo, i) => {
  const form = document.createElement("form");
  form.className = "senha";
  const rotulo = document.createElement("label");
  rotulo.htmlFor = `senha-${i}`;
  rotulo.textContent = "Digite a senha que você recebeu:";
  const linha = document.createElement("div");
  linha.className = "senha-linha";
  const campo = document.createElement("input");
  campo.id = `senha-${i}`;
  campo.autocomplete = "off";
  campo.required = true;
  const botao = document.createElement("button");
  botao.textContent = "VER";
  const erro = document.createElement("p");
  erro.className = "aviso";
  erro.setAttribute("role", "alert");
  erro.hidden = true;
  linha.append(campo, botao);
  form.append(rotulo, linha, erro);
  alvo.append(form);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    botao.disabled = true;
    erro.hidden = true;
    try {
      alvo.textContent = await abrirLocal(campo.value.trim().toLowerCase());
    } catch {
      erro.textContent = "Senha incorreta. Tente de novo.";
      erro.hidden = false;
      botao.disabled = false;
    }
  });
});

function desenharCasal() {
  const c = document.createElement("canvas");
  c.width = 56;
  c.height = 36;
  const ctx = c.getContext("2d");
  ctx.drawImage(sprite(PAR_B, { semCoroa: true, bracoDir: "lado", olhar: 1 }), 0, 0);
  ctx.drawImage(sprite(PAR_A, { semCoroa: true, bracoEsq: "lado", olhar: -1 }), 22, 0);
  ctx.drawImage(spriteCoracao, 24, 1);
  return c;
}
$("casal").append(desenharCasal());

for (let i = 0; i < 10; i += 1) {
  const coracao = linhasParaCanvas(CORACAO, { K: TINTA, R: "#ff5c8a" }, 3);
  coracao.style.left = `${i * 10 + 2}%`;
  coracao.style.animationDelay = `${(i * 0.73) % 4}s`;
  coracao.style.animationDuration = `${5 + (i % 3)}s`;
  $("chuva").append(coracao);
}

montarTurma($("turma-entrada"));
$("dedo").append(linhasParaCanvas(MAO, { K: TINTA, S: "#f2c29b", D: "#d99f75", N: "#ffe6d6", C: "#c1121f" }, 11));
$("controle").append(linhasParaCanvas(CONTROLE, { K: TINTA, G: "#9aa0b5", W: "#ffffff", R: "#ff5c8a" }, 6));
