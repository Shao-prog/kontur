(() => {
  'use strict';

  const data = window.KONTUR_DATA;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const image = key => data.images[key] || data.images.houseDusk;
  const arrow = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 12h16m-7-7 7 7-7 7" stroke="currentColor" stroke-width="1.5"/></svg>';
  const arrowDiagonal = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 19 19 5M8 5h11v11" stroke="currentColor" stroke-width="1.5"/></svg>';

  function initNavigation() {
    const header = $('[data-header]');
    const toggle = $('[data-menu-toggle]');
    const panel = $('[data-mobile-menu]');
    if (!header || !toggle || !panel) return;
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 34);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    function setMenu(open) {
      panel.classList.toggle('is-open', open);
      panel.setAttribute('aria-hidden', String(!open));
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      document.body.classList.toggle('menu-open', open);
      if (open) $('a', panel)?.focus();
      else toggle.focus();
    }
    toggle.addEventListener('click', () => setMenu(!panel.classList.contains('is-open')));
    $$('a', panel).forEach(link => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && panel.classList.contains('is-open')) setMenu(false);
    });
    panel.addEventListener('click', event => {
      if (event.target === panel) setMenu(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 980 && panel.classList.contains('is-open')) setMenu(false);
    });
  }

  function initReveal() {
    const nodes = $$('.reveal');
    if (!('IntersectionObserver' in window) || reducedMotion.matches) {
      nodes.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -35px 0px' });
    nodes.forEach(el => observer.observe(el));
  }

  function initHero() {
    const hero = $('[data-hero-slider]');
    if (!hero) return;
    const slides = $$('.hero-slide', hero);
    const controls = $$('[data-slide-to]', hero);
    const indicator = $('[data-slide-current]', hero);
    const previous = $('[data-slide-prev]', hero);
    const next = $('[data-slide-next]', hero);
    let active = 0;
    let timer = null;

    const show = (target) => {
      active = (target + slides.length) % slides.length;
      slides.forEach((slide, index) => {
        slide.classList.toggle('is-active', index === active);
        slide.setAttribute('aria-hidden', String(index !== active));
      });
      controls.forEach((control, index) => {
        control.classList.toggle('is-active', index === active);
        control.setAttribute('aria-label', 'Показать слайд ' + (index + 1));
        control.setAttribute('aria-pressed', String(index === active));
      });
      if (indicator) indicator.textContent = String(active + 1).padStart(2, '0');
    };
    const stop = () => { if (timer) window.clearInterval(timer); timer = null; };
    const start = () => {
      stop();
      if (!reducedMotion.matches && !document.hidden) timer = window.setInterval(() => show(active + 1), 6700);
    };
    previous?.addEventListener('click', () => { show(active - 1); start(); });
    next?.addEventListener('click', () => { show(active + 1); start(); });
    controls.forEach((control, index) => control.addEventListener('click', () => { show(index); start(); }));
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    hero.addEventListener('focusin', stop);
    hero.addEventListener('focusout', event => { if (!hero.contains(event.relatedTarget)) start(); });
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    reducedMotion.addEventListener?.('change', start);
    show(0);
    start();
  }

  function card(project, position = 0) {
    return `<a class="project-card reveal card-pos-${position % 4}" href="project.html?slug=${encodeURIComponent(project.id)}" aria-label="Открыть проект ${project.title}">
      <div class="project-card__visual media-wrap" aria-hidden="true">
        <img src="${image(project.cover)}" alt="" loading="lazy" decoding="async">
        <span class="project-card__open">${arrowDiagonal}</span>
        <span class="project-card__index">${project.index} / 08</span>
      </div>
      <div class="project-card__footer">
        <div><h3 class="project-card__title">${project.title}</h3><p>${project.caption}</p></div>
        <span class="project-card__type">${project.tag}</span>
      </div>
    </a>`;
  }

  function renderFeatured() {
    const target = $('[data-featured-projects]');
    if (!target) return;
    const ids = ['forest-house', 'quiet-form', 'line-residence', 'atelier'];
    const featured = ids.map(id => data.projects.find(project => project.id === id)).filter(Boolean);
    target.innerHTML = featured.map((project, index) => card(project, index)).join('');
  }

  function renderProjects() {
    const target = $('[data-projects-grid]');
    if (!target) return;
    const buttons = $$('[data-filter]');
    const count = $('[data-projects-count]');
    const filters = ['all', 'architecture', 'interiors'];
    const url = new URL(window.location.href);
    let current = filters.includes(url.searchParams.get('category')) ? url.searchParams.get('category') : 'all';

    function render(category) {
      current = category;
      const list = category === 'all' ? data.projects : data.projects.filter(p => p.type === category);
      target.innerHTML = list.map((project, index) => card(project, index)).join('');
      buttons.forEach(button => {
        const selected = button.dataset.filter === category;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      if (count) count.textContent = String(list.length).padStart(2, '0');
      initImages(target);
      initReveal();
      try {
        const next = new URL(window.location.href);
        if (category === 'all') next.searchParams.delete('category');
        else next.searchParams.set('category', category);
        window.history.replaceState({}, '', next);
      } catch (_) { /* Some file:// browsers restrict history mutation. */ }
    }
    buttons.forEach(button => button.addEventListener('click', () => render(button.dataset.filter)));
    window.addEventListener('popstate', () => {
      const fromUrl = new URL(window.location.href).searchParams.get('category');
      render(filters.includes(fromUrl) ? fromUrl : 'all');
    });
    render(current);
  }

  let lightbox = null;
  function ensureLightbox() {
    if (lightbox) return lightbox;
    lightbox = document.createElement('dialog');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('aria-label', 'Просмотр фотографии');
    lightbox.innerHTML = `<div class="lightbox__frame">
      <button class="lightbox__close" type="button" aria-label="Закрыть галерею">×</button>
      <button class="lightbox__arrow lightbox__arrow--prev" type="button" aria-label="Предыдущее фото">←</button>
      <img alt="Фотография проекта" class="lightbox__image">
      <button class="lightbox__arrow lightbox__arrow--next" type="button" aria-label="Следующее фото">→</button>
      <div class="lightbox__bottom"><span class="lightbox__title"></span><span class="lightbox__count"></span></div>
    </div>`;
    document.body.appendChild(lightbox);
    lightbox.querySelector('.lightbox__close').addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
    return lightbox;
  }

  function setupGallery(images, title) {
    const dialog = ensureLightbox();
    let current = 0;
    const img = $('.lightbox__image', dialog);
    const count = $('.lightbox__count', dialog);
    const name = $('.lightbox__title', dialog);
    function update() {
      img.src = images[current];
      img.alt = title + ' — фотография ' + (current + 1);
      count.textContent = `${String(current + 1).padStart(2,'0')} / ${String(images.length).padStart(2,'0')}`;
      name.textContent = title;
    }
    function shift(delta) { current = (current + delta + images.length) % images.length; update(); }
    const prev = $('.lightbox__arrow--prev', dialog);
    const next = $('.lightbox__arrow--next', dialog);
    prev.onclick = () => shift(-1);
    next.onclick = () => shift(1);
    dialog.onkeydown = event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); shift(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); shift(1); }
    };
    return index => { current = index; update(); if (!dialog.open) dialog.showModal(); };
  }

  function renderProjectDetail() {
    const target = $('[data-project-detail]');
    if (!target) return;
    const params = new URLSearchParams(window.location.search);
    const project = data.projects.find(p => p.id === params.get('slug')) || data.projects[0];
    const position = data.projects.indexOf(project);
    const next = data.projects[(position + 1) % data.projects.length];
    document.title = `${project.title} — КОНТУР | Архитектура и интерьеры`;
    const photos = project.images.map(key => image(key));
    target.innerHTML = `
      <section class="detail-hero">
        <div class="detail-hero__image media-wrap"><img src="${photos[0]}" alt="${project.title}: архитектурное пространство"></div>
        <div class="detail-hero__shade"></div>
        <div class="container detail-hero__inside">
          <a class="back-link" href="projects.html">← Все проекты</a>
          <div class="detail-hero__bottom"><span class="eyebrow eyebrow--light">${project.tag} / ${project.index}</span><h1>${project.title}</h1></div>
        </div>
        <span class="detail-hero__vertical">КОНТУР / АРХИТЕКТУРА И ИНТЕРЬЕРЫ</span>
      </section>
      <section class="section detail-intro"><div class="container detail-intro__grid">
        <div class="reveal"><span class="eyebrow">01 / КОНЦЕПЦИЯ ПРОСТРАНСТВА</span><h2 class="section-heading">Каждая деталь<br><em>имеет смысл.</em></h2></div>
        <div class="detail-intro__text reveal"><p class="lead-text">${project.description}</p><p>${project.detail}</p>
          <dl class="detail-facts"><div><dt>Направление</dt><dd>${project.tag}</dd></div><div><dt>Идея</dt><dd>${project.focus}</dd></div><div><dt>Материалы</dt><dd>${project.materials}</dd></div></dl>
        </div>
      </div></section>
      <section class="section detail-gallery"><div class="container"><div class="section-heading-row reveal"><span class="eyebrow">02 / ГАЛЕРЕЯ</span><p>Нажмите на изображение<br>для полноэкранного просмотра</p></div>
        <div class="detail-gallery__grid">${photos.map((src, i) => `<button class="detail-photo media-wrap reveal detail-photo--${i}" type="button" data-photo="${i}" aria-label="Открыть фото ${i + 1} проекта ${project.title}"><img loading="lazy" decoding="async" src="${src}" alt="${project.title}, вид ${i + 1}"><span class="detail-photo__zoom">↗ УВЕЛИЧИТЬ</span></button>`).join('')}</div>
      </div></section>
      <section class="section detail-next"><a href="project.html?slug=${next.id}" class="detail-next__link"><div class="container detail-next__inner"><div><span class="eyebrow eyebrow--light">СЛЕДУЮЩИЙ ПРОЕКТ / ${next.index}</span><h2>${next.title}</h2></div><span class="detail-next__arrow">${arrowDiagonal}</span></div><img src="${image(next.cover)}" loading="lazy" alt="" class="detail-next__photo"></a></section>
    `;
    const open = setupGallery(photos, project.title);
    $$('[data-photo]', target).forEach(button => button.addEventListener('click', () => open(Number(button.dataset.photo))));
    initImages(target);
    initReveal();
  }

  function initImages(root = document) {
    $$('img', root).forEach(img => {
      if (img.dataset.imageWatch) return;
      img.dataset.imageWatch = '1';
      const fallback = () => img.classList.add('image-unavailable');
      img.addEventListener('error', fallback);
      if (img.complete && !img.naturalWidth) fallback();
    });
  }

  function initContactForms() {
    const ENDPOINT = ''; // Добавьте адрес своего обработчика, чтобы включить реальную отправку заявок.
    $$('[data-contact-form]').forEach(form => {
      const result = $('[data-form-result]', form);
      const button = $('[data-form-submit]', form);
      const copy = $('[data-copy-request]', form);
      const summary = $('[data-form-message]', form);
      if (!result || !button || !copy || !summary) return;
      let preparedText = '';
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const fields = Object.fromEntries(new FormData(form).entries());
        const phone = String(fields.phone || '').replace(/\D/g, '');
        const name = String(fields.name || '').trim();
        if (name.length < 2 || phone.length < 10) {
          result.hidden = false;
          summary.textContent = 'Укажите имя и номер телефона (не менее 10 цифр).';
          copy.hidden = true;
          return;
        }
        preparedText = `Новая заявка — КОНТУР\nИмя: ${name}\nТелефон: ${fields.phone || ''}\nИнтересующая услуга: ${fields.service || 'Не указана'}\nСообщение: ${fields.message || 'Не указано'}`;
        if (ENDPOINT) {
          button.disabled = true;
          button.textContent = 'Отправляем…';
          try {
            const response = await fetch(ENDPOINT, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(fields) });
            if (!response.ok) throw new Error('Request failed');
            summary.textContent = 'Спасибо! Ваша заявка отправлена.';
            result.hidden = false;
            copy.hidden = true;
            form.reset();
          } catch (_) {
            summary.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз.';
            result.hidden = false;
            copy.hidden = true;
          } finally {
            button.disabled = false;
            button.textContent = 'Отправить заявку';
          }
        } else {
          summary.textContent = 'Заявка подготовлена, но ещё не отправлена: для этого сайту нужно подключить обработчик формы. Вы можете скопировать текст.';
          result.hidden = false;
          copy.hidden = false;
        }
        result.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block:'nearest' });
      });
      copy.addEventListener('click', async () => {
        if (!preparedText) return;
        try {
          if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(preparedText);
          else throw new Error('Clipboard API unavailable');
        } catch (_) {
          const temp = document.createElement('textarea');
          temp.value = preparedText;
          temp.style.position = 'fixed';
          temp.style.opacity = '0';
          document.body.appendChild(temp);
          temp.select();
          const copied = document.execCommand('copy');
          temp.remove();
          if (!copied) { summary.textContent = preparedText; return; }
        }
        copy.textContent = 'Скопировано ✓';
        window.setTimeout(() => { copy.textContent = 'Скопировать текст заявки'; }, 2200);
      });
    });
  }

  function initAccordions() {
    $$('details[data-faq]').forEach(details => {
      details.addEventListener('toggle', () => {
        if (!details.open) return;
        $$('details[data-faq]').forEach(other => { if (other !== details) other.open = false; });
      });
    });
  }

  function init() {
    initNavigation();
    initHero();
    renderFeatured();
    renderProjects();
    renderProjectDetail();
    initReveal();
    initImages();
    initContactForms();
    initAccordions();
    const year = $('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
