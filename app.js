// ============================================================
//  Warung Nusantara — Logika Menu & Keranjang
// ============================================================

const cart = new Map(); // id -> { item, qty }

// ───────── Helpers ─────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function getMeja() {
  const params = new URLSearchParams(window.location.search);
  const m = params.get("meja");
  if (!m) return null;
  const n = parseInt(m, 10);
  return Number.isFinite(n) && n > 0 ? n : m.trim();
}

function fmtMoney(n) {
  return `${n} <span class="currency">${MENU_DATA.warung.mataUang}</span>`;
}
function fmtMoneyPlain(n) {
  return `${n} ${MENU_DATA.warung.mataUang}`;
}

// ───────── Cart ops ─────────
function addItem(id) {
  const existing = cart.get(id);
  if (existing) {
    existing.qty++;
  } else {
    const item = MENU_DATA.menu.find((m) => m.id === id);
    if (!item) return;
    cart.set(id, { item, qty: 1 });
  }
  renderAll();
}
function removeItem(id) {
  const existing = cart.get(id);
  if (!existing) return;
  existing.qty--;
  if (existing.qty <= 0) cart.delete(id);
  renderAll();
}
function totalQty() {
  let q = 0;
  cart.forEach((v) => (q += v.qty));
  return q;
}
function totalPrice() {
  let t = 0;
  cart.forEach((v) => (t += v.qty * v.item.harga));
  return t;
}

// ───────── Render: header / banner ─────────
function renderHeader() {
  document.title = MENU_DATA.warung.nama;
  $(".brand-name").textContent = MENU_DATA.warung.nama;
  $(".brand-tag").textContent = MENU_DATA.warung.tagline;

  const meja = getMeja();
  const badge = $("#mejaBadge");
  if (meja) {
    badge.textContent = `Meja ${meja}`;
    badge.style.background = "rgba(255,248,236,0.28)";
  } else {
    badge.textContent = "Bawa Pulang";
    insertNoMejaBanner();
  }
}

function insertNoMejaBanner() {
  if ($(".no-meja-banner")) return;
  const div = document.createElement("div");
  div.className = "no-meja-banner";
  div.innerHTML = `<span>ℹ️</span><span>Tidak terdeteksi nomor meja. Pesanan akan dianggap <b>bawa pulang</b>.</span>`;
  $(".categories").after(div);
}

// ───────── Render: kategori nav ─────────
function renderCategories() {
  const wrap = document.createElement("div");
  wrap.className = "categories-scroll";
  MENU_DATA.kategori.forEach((cat, i) => {
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (i === 0 ? " active" : "");
    btn.dataset.cat = cat.id;
    btn.innerHTML = `<span>${cat.icon}</span><span>${cat.nama}</span>`;
    btn.onclick = () => {
      const target = $(`#cat-${cat.id}`);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    wrap.appendChild(btn);
  });
  $("#categories").innerHTML = "";
  $("#categories").appendChild(wrap);
}

// Sync active cat tab on scroll
function setupScrollSpy() {
  const sections = MENU_DATA.kategori
    .map((c) => $(`#cat-${c.id}`))
    .filter(Boolean);
  const onScroll = () => {
    let activeId = sections[0]?.id;
    for (const s of sections) {
      const top = s.getBoundingClientRect().top;
      if (top < 90) activeId = s.id;
    }
    const id = activeId?.replace("cat-", "");
    $$(".cat-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.cat === id);
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}

// ───────── Render: menu list ─────────
function renderMenu() {
  const list = $("#menuList");
  list.innerHTML = "";
  MENU_DATA.kategori.forEach((cat) => {
    const items = MENU_DATA.menu.filter((m) => m.kategori === cat.id);
    if (!items.length) return;

    const section = document.createElement("section");
    section.className = "cat-section";
    section.id = `cat-${cat.id}`;
    section.innerHTML = `
      <h2 class="cat-title"><span class="cat-title-icon">${cat.icon}</span>${cat.nama}</h2>
      <p class="cat-subtitle">${items.length} pilihan menu</p>
    `;

    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "item";
      card.dataset.id = item.id;
      card.innerHTML = `
        <div class="item-thumb">${cat.icon}</div>
        <div class="item-body">
          <div class="item-name">${item.nama}${item.favorit ? `<span class="fav-tag">🔥 Favorit</span>` : ""}</div>
          <div class="item-desc">${item.deskripsi}</div>
          <div class="item-bottom">
            <span class="item-price">${fmtMoney(item.harga)}</span>
            <span class="item-action"></span>
          </div>
        </div>
      `;
      section.appendChild(card);
    });
    list.appendChild(section);
  });
}

// ───────── Render: per-item action button (add or stepper) ─────────
function renderItemActions() {
  $$(".item").forEach((card) => {
    const id = card.dataset.id;
    const slot = card.querySelector(".item-action");
    const inCart = cart.get(id);
    card.classList.toggle("in-cart", !!inCart);
    if (inCart) {
      slot.innerHTML = `
        <span class="stepper">
          <button data-act="dec" data-id="${id}" aria-label="Kurangi">−</button>
          <span class="stepper-qty">${inCart.qty}</span>
          <button data-act="inc" data-id="${id}" aria-label="Tambah">+</button>
        </span>
      `;
    } else {
      slot.innerHTML = `<button class="add-btn" data-act="add" data-id="${id}">Tambah</button>`;
    }
  });
}

// Single delegated click handler for menu list
function setupMenuClicks() {
  $("#menuList").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const { act, id } = btn.dataset;
    if (act === "add" || act === "inc") addItem(id);
    else if (act === "dec") removeItem(id);
  });
}

// ───────── Render: cart FAB ─────────
function renderCartFab() {
  const fab = $("#cartFab");
  const count = totalQty();
  if (count > 0) {
    fab.classList.add("visible");
    $("#cartCount").textContent = count;
    $("#cartTotal").textContent = fmtMoneyPlain(totalPrice());
  } else {
    fab.classList.remove("visible");
  }
}

// ───────── Render: cart modal ─────────
function renderCartModal() {
  const wrap = $("#cartItems");
  wrap.innerHTML = "";

  if (cart.size === 0) {
    wrap.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Belum ada pesanan.<br>Pilih menu favorit Anda dulu ya 🙂</p>
      </div>
    `;
    $("#cartFinalTotal").textContent = fmtMoneyPlain(0);
    $("#orderBtn").classList.add("disabled");
    $("#orderBtn").removeAttribute("href");
    return;
  }

  cart.forEach(({ item, qty }, id) => {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div class="cart-row-info">
        <div class="cart-row-name">${item.nama}</div>
        <div class="cart-row-meta">${qty} × ${item.harga} = ${qty * item.harga} ${MENU_DATA.warung.mataUang}</div>
      </div>
      <span class="stepper">
        <button data-act="dec" data-id="${id}">−</button>
        <span class="stepper-qty">${qty}</span>
        <button data-act="inc" data-id="${id}">+</button>
      </span>
    `;
    wrap.appendChild(row);
  });

  $("#cartFinalTotal").textContent = fmtMoneyPlain(totalPrice());

  const orderBtn = $("#orderBtn");
  orderBtn.classList.remove("disabled");
  orderBtn.href = buildWAUrl();
}

// Cart modal interactions
function setupCart() {
  $("#cartFab").onclick = openCart;
  $("#closeCart").onclick = closeCart;
  $("#cartModal").addEventListener("click", (e) => {
    if (e.target.id === "cartModal") closeCart();
  });
  $("#cartItems").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const { act, id } = btn.dataset;
    if (act === "inc") addItem(id);
    else if (act === "dec") removeItem(id);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCart();
  });
}
function openCart() {
  renderCartModal();
  $("#cartModal").hidden = false;
  document.body.style.overflow = "hidden";
}
function closeCart() {
  $("#cartModal").hidden = true;
  document.body.style.overflow = "";
}

// ───────── WhatsApp message ─────────
function buildWAUrl() {
  const meja = getMeja();
  const lines = [];
  lines.push(`*PESANAN ${meja ? "MEJA " + meja : "BAWA PULANG"}*`);
  lines.push("━━━━━━━━━━━━━━━━");
  lines.push("");

  const byCat = new Map();
  cart.forEach((v) => {
    if (!byCat.has(v.item.kategori)) byCat.set(v.item.kategori, []);
    byCat.get(v.item.kategori).push(v);
  });

  MENU_DATA.kategori.forEach((cat) => {
    const items = byCat.get(cat.id);
    if (!items) return;
    lines.push(`${cat.icon} *${cat.nama}*`);
    items.forEach(({ item, qty }) => {
      lines.push(`• ${qty}× ${item.nama}`);
      lines.push(`  ${qty * item.harga} ${MENU_DATA.warung.mataUang}`);
    });
    lines.push("");
  });

  lines.push("━━━━━━━━━━━━━━━━");
  lines.push(`*Total: ${totalPrice()} ${MENU_DATA.warung.mataUang}*`);
  lines.push("");
  lines.push("Terima kasih 🙏");

  const msg = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${MENU_DATA.warung.whatsapp}?text=${msg}`;
}

// ───────── Re-render driver ─────────
function renderAll() {
  renderItemActions();
  renderCartFab();
  if (!$("#cartModal").hidden) renderCartModal();
}

// ───────── Init ─────────
function init() {
  renderHeader();
  renderCategories();
  renderMenu();
  renderItemActions();
  setupMenuClicks();
  setupCart();
  setupScrollSpy();
  renderCartFab();
  renderCartModal();
}
document.addEventListener("DOMContentLoaded", init);
