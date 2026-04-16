/* CROCHETGLAM — Web con secciones dinámicas desde Google Sheet
   Fuentes: Anton (títulos), Merienda (texto), Nunito (botones)
*/

const CONFIG = {
  // Sustituye por tu CSV publicado si usas otro
  SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmSE9E50p9xjqGEZQmNYV-r-9mx2KNezfPikkz_PIU1AEAdtBOdF8yQXOlQNm3u_PWjQrd9IQad4wn/pub?output=csv',
  DEFAULT_WHATSAPP_PHONE: '34605409617',
  CURRENCY: '€'
};

let STATE = { products: [], sections: [] };

/* ====================== Utils ====================== */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const norm  = (v) => (v ?? '').toString().trim();
const lower = (v) => norm(v).toLowerCase();

/* Si falta 'section', dedúcela a partir de la categoría */
function autoSectionFromCategory(category) {
  const c = lower(category);
  if (!c) return 'Colección';
  if (['triangulares','clásicos','clasicos','dos colores','bikinis'].includes(c)) return 'Bikinis';
  if (['bufandas con flecos','bufandas','gorros'].includes(c)) return 'Bufandas & Gorros';
  if (c.includes('beanie')) return 'Beanie Crochet';
  if (c.startsWith('colección') || c.startsWith('coleccion')) return 'Bolsos';
  if (c === 'tops' || c.includes('top')) return 'Tops';
  return 'Colección';
}

/* WhatsApp links */
function buildWhatsAppGeneralLink(phone){
  const tel = (phone || CONFIG.DEFAULT_WHATSAPP_PHONE || '').replace(/[^0-9]/g, '');
  const msg = 'Hola 👋, me gustaría recibir información general.';
  return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
}
function buildWhatsAppLink({ phone, title, image_url }){
  const tel = (phone || CONFIG.DEFAULT_WHATSAPP_PHONE || '').replace(/[^0-9]/g, '');
  const msg = `Hola 👋, estoy interesad@ en el producto ${title}. Es este 👉 ${image_url}`;
  return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
}

/* Agrupar por sección */
function groupBySection(products){
  const map = new Map();
  products.forEach(p => {
    const sec = norm(p.section) || 'Colección';
    if (!map.has(sec)) map.set(sec, { section: sec, section_sort: p.section_sort, categories: new Set(), items: [] });
    map.get(sec).items.push(p);
    if (p.category) map.get(sec).categories.add(norm(p.category));
  });
  return Array.from(map.values())
    .sort((a, b) => a.section_sort - b.section_sort)
    .map(sec => { sec.items.sort((a, b) => a.sort - b.sort); return sec; });
}

/* ====================== Carrusel hero ====================== */
function buildHeroCarousel(products){
  const track = document.getElementById('hero-track');
  if (!track) return;

  const slides = products.filter(p => p.slide && p.image_url)
    .sort(() => Math.random() - 0.5);
  if (!slides.length) return;

  // Duplicar para loop infinito seamless
  [...slides, ...slides].forEach(p => {
    const img = document.createElement('img');
    img.src = p.image_url;
    img.alt = p.title || '';
    img.className = 'hero-slide-img';
    img.loading = 'lazy';
    track.appendChild(img);
  });

  // Distancia exacta: N imágenes × ancho de cada una (25vw escritorio, 100vw móvil)
  const imgVw = window.innerWidth <= 640 ? 100 : 25;
  track.style.setProperty('--scroll-dist', `-${slides.length * imgVw}vw`);

  // ~5s por imagen → sensación lenta y elegante
  track.style.animationDuration = `${slides.length * 5}s`;
}

/* ====================== Renders ====================== */
function renderAll(){
  const nav = $('#nav-links');
  const container = $('#secciones');
  nav.innerHTML = '';
  container.innerHTML = '';

  if (!STATE.sections.length) {
    container.innerHTML = `<div class="wrap"><p style="color:#666">No hay productos visibles en la hoja.</p></div>`;
    return;
  }

  STATE.sections.forEach(sec => {
    // Nav
    const anchorId = sec.section.toLowerCase().replace(/\s+/g,'-');
    const a = document.createElement('a');
    a.href = `#${anchorId}`;
    a.textContent = sec.section;
    nav.appendChild(a);

    // Section
    const sectionEl = document.createElement('section');
    sectionEl.className = 'catalog-section';
    sectionEl.id = anchorId;

    const wrap = document.createElement('div');
    wrap.className = 'wrap';

    const head = document.createElement('div');
    head.className = 'section-head';

    const h2 = document.createElement('h2');
    h2.className = 'section-title';
    h2.textContent = sec.section;

    const note = document.createElement('p');
    note.className = 'section-note';
    note.textContent = '';

    head.append(h2, note);

    const filters = document.createElement('div');
    filters.className = 'filters';
    const grid = document.createElement('div');
    grid.className = 'grid';

    wrap.append(head);
    if (sec.categories.size > 1) wrap.append(filters);
    wrap.append(grid);
    sectionEl.append(wrap);
    container.append(sectionEl);

    // Filtros + grid
    const cats = Array.from(sec.categories);
    let activeCat = 'Todo';

    function paint(){
      grid.innerHTML = '';
      let list = sec.items.slice();
      if (activeCat !== 'Todo') list = list.filter(p => norm(p.category) === activeCat);

      if (!list.length){
        grid.innerHTML = '<p style="color:#666">Pronto añadiremos productos aquí.</p>';
        return;
      }

      list.forEach(p => {
        const card = document.createElement('article');
        card.className = 'card';

        const img = document.createElement('img');
        img.className = 'card-img';
        img.loading = 'lazy';
        img.alt = p.title;
        img.src = p.image_url || '';
        card.appendChild(img);

        const body = document.createElement('div');
        body.className = 'card-body';

        const title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = p.title;

        const meta = document.createElement('div');
        meta.className = 'card-meta';
        const price = document.createElement('span');
        price.textContent = p.price ? `${CONFIG.CURRENCY}${p.price}` : '';
        const cat = document.createElement('span');
        cat.className = 'card-category';
        cat.textContent = p.category || '';

        meta.append(price, cat);
        body.append(title, meta);

        if (p.info){
          const desc = document.createElement('p');
          desc.className = 'card-info';
          desc.textContent = p.info;
        
          // Mostrar "ver más…" solo si hay contenido extra (desc_larga o alguna imgsec)
          const hasDetails =
            (p.desc_larga && p.desc_larga.trim().length > 0) ||
            [p.imgsec1, p.imgsec2, p.imgsec3, p.imgsec4].some(u => (u || '').trim().length > 0);
        
          if (hasDetails) {
            const more = document.createElement('button');
            more.type = 'button';
            more.className = 'more-link';
            more.textContent = ' ver más…';  // con espacio inicial
            more.style.cssText = 'background:none;border:none;color:#555;cursor:pointer;font-size:.9em;padding:0;margin-left:4px;text-decoration:underline;';
            more.dataset.index = String(STATE.products.indexOf(p));
            desc.appendChild(more);
          }
        
          body.appendChild(desc);
        }



        const btn = document.createElement('a');
        btn.className = 'buy-btn';
        btn.textContent = 'Comprar por WhatsApp';
        const hasCheckout = p.buy_link && /^https?:\/\//i.test(p.buy_link.trim());
        const link = hasCheckout ? p.buy_link.trim() : buildWhatsAppLink({
          phone: p.whatsapp_phone,
          title: p.title,
          image_url: p.image_url
        });
        btn.href = link; btn.target = '_blank'; btn.rel = 'noopener';

        body.appendChild(btn);
        card.appendChild(body);
        grid.appendChild(card);
      });
    }

    if (sec.categories.size > 1){
      filters.innerHTML = '';
      const allBtn = document.createElement('button');
      allBtn.className = 'filter-btn is-active';
      allBtn.textContent = 'Todo';
      allBtn.addEventListener('click', ()=>{
        activeCat = 'Todo';
        Array.from(filters.children).forEach(b=>b.classList.remove('is-active'));
        allBtn.classList.add('is-active');
        paint();
      });
      filters.appendChild(allBtn);

      cats.forEach(c => {
        const b = document.createElement('button');
        b.className = 'filter-btn';
        b.textContent = c;
        b.addEventListener('click', ()=>{
          activeCat = norm(c);
          Array.from(filters.children).forEach(bb=>bb.classList.remove('is-active'));
          b.classList.add('is-active');
          paint();
        });
        filters.appendChild(b);
      });
    }

    paint();
  });
}

/* ===== Modal helpers ===== */
function openProductModal(product){
  const modal = document.getElementById('product-modal');
  if (!modal) return;

  // Título
  const titleEl = document.getElementById('modal-title');
  titleEl.textContent = product?.title || 'Producto';

  // Descripción larga
  const textEl = document.getElementById('modal-text');
  const longTxt = product?.desc_larga || '';
  if (longTxt) {
    textEl.textContent = longTxt;
    textEl.style.display = '';
  } else {
    textEl.textContent = '';
    textEl.style.display = 'none';
  }

  // Galería 2x2 con hasta 4 imágenes (si existen)
  const galEl = document.getElementById('modal-gallery');
  galEl.innerHTML = '';
  const imgs = [product?.imgsec1, product?.imgsec2, product?.imgsec3, product?.imgsec4]
    .map(x => (x||'').trim())
    .filter(Boolean);

  if (imgs.length){
    imgs.slice(0,4).forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = product.title || 'Imagen de producto';
      img.loading = 'lazy';
      galEl.appendChild(img);
    });
    galEl.style.display = '';
  } else {
    // Si no hay imágenes secundarias, oculta la galería
    galEl.style.display = 'none';
  }

  // Mostrar modal
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeProductModal(){
  const modal = document.getElementById('product-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// Cerrar por backdrop, botón o ESC
document.addEventListener('click', (e) => {
  const t = e.target;
  if (t.matches('[data-close-modal]')) closeProductModal();
});

// Delegación: click en "ver más…"
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.more-link');
  if (!btn) return;
  const idx = parseInt(btn.dataset.index || '-1', 10);
  if (idx >= 0 && STATE.products[idx]) {
    openProductModal(STATE.products[idx]);
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeProductModal();
});


/* ====================== Carga CSV ====================== */
function loadSheet(){
  const loading = $('#loading');
  const errorBox = $('#error');
  if (loading) loading.style.display = 'flex';
  if (errorBox) errorBox.hidden = true;

  Papa.parse(CONFIG.SHEET_CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      try {
        const rows = results.data || [];
        // Debug de encabezados
        if (rows[0]) console.log('[CSV headers]', Object.keys(rows[0]));

        STATE.products = rows.map(r => {
          const sectionRaw = norm(r.section || r.seccion || '');
          const category = norm(r.category || r.categoria || '');
          const section = sectionRaw || autoSectionFromCategory(category);

          return {
            section,
            category,
            title: norm(r.title || 'Producto'),
            price: (r.price || '').toString().trim(),
            image_url: norm(r.image_url || ''),
            video_url: norm(r.video_url || ''),
            buy_link: norm(r.buy_link || ''),
            whatsapp_phone: norm(r.whatsapp_phone || ''),
            info: norm(r.info || ''),
            visible: String(r.visible || 'TRUE').toUpperCase() !== 'FALSE',
            sort: parseInt(r.sort || '0', 10) || 0,
            section_sort: parseInt(r['section-sort'] || '0', 10) || 0,
            slide: String(r.slide || 'FALSE').toUpperCase() === 'TRUE',
            imgsec1: norm(r.imgsec1 || ''),
            imgsec2: norm(r.imgsec2 || ''),
            imgsec3: norm(r.imgsec3 || ''),
            imgsec4: norm(r.imgsec4 || ''),
            desc_larga: norm(r.desc_larga || '')
          };
        })
        .filter(p => p.visible && p.section);

        STATE.sections = groupBySection(STATE.products);

        buildHeroCarousel(STATE.products);

        // CTA general
        const phoneFallback = STATE.products.find(p => p.whatsapp_phone)?.whatsapp_phone || CONFIG.DEFAULT_WHATSAPP_PHONE;
        const cta = $('#cta-whatsapp');
        if (cta) cta.href = buildWhatsAppGeneralLink(phoneFallback);

        renderAll();

        const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
      } catch (e) {
        console.error('Error procesando CSV', e);
        if (errorBox) { errorBox.hidden = false; errorBox.textContent = 'Error procesando la hoja.'; }
      } finally {
        if (loading) loading.style.display = 'none';
      }
    },
    error: (err) => {
      console.error('Error cargando CSV', err);
      if (errorBox) { errorBox.hidden = false; errorBox.textContent = 'No pudimos cargar la hoja (red/CORS).'; }
      if (loading) loading.style.display = 'none';
    }
  });
  
  // Failsafe por si quedara bloqueado
  setTimeout(() => {
    if (loading && getComputedStyle(loading).display !== 'none') {
      console.warn('Timeout: ocultando loading por failsafe');
      loading.style.display = 'none';
    }
  }, 8000);
}


/* ====================== Init ====================== */
document.addEventListener('DOMContentLoaded', loadSheet);
