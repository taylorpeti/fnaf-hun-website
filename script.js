(() => {
  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();

  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const setMenu = open => {
    nav?.classList.toggle('open', open);
    menuToggle?.setAttribute('aria-expanded', String(open));
    if (menuToggle) menuToggle.textContent = open ? '×' : '☰';
  };
  menuToggle?.addEventListener('click', () => setMenu(!nav?.classList.contains('open')));
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });

  // Community URLs are intentionally configurable and blank until the owner supplies the official links.
  const communityLinks = {
    discord: 'https://discord.gg/RysRKHkjaU',
    roblox: 'https://www.roblox.com/share?code=8c8eed3906a6844abc9cd09e75449092&type=ExperienceDetails&stamp=1791544366153'
  };

  const infoDialog = document.querySelector('#info-dialog');
  const infoDialogText = document.querySelector('#info-dialog-text');
  const openInfo = message => {
    if (infoDialog && typeof infoDialog.showModal === 'function') {
      if (infoDialogText) infoDialogText.textContent = message;
      infoDialog.showModal();
    } else {
      alert(message);
    }
  };
  document.querySelector('#info-dialog-ok')?.addEventListener('click', () => infoDialog?.close());
  infoDialog?.addEventListener('click', event => { if (event.target === infoDialog) infoDialog.close(); });

  document.querySelectorAll('[data-link]').forEach(link => {
    const type = link.dataset.link;
    const url = communityLinks[type];
    if (url) {
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      return;
    }
    link.setAttribute('aria-disabled', 'true');
    link.classList.add('link-pending');
    link.addEventListener('click', event => {
      event.preventDefault();
      openInfo(type === 'discord'
        ? 'A Discord-meghívó linkjét még be kell állítani. Állítsd be a script.js fájlban: communityLinks.discord'
        : 'A Roblox-játék linkje még nem érhető el.');
    });
  });

  const renderNews = items => {
    const grid = document.querySelector('#news-grid');
    if (!grid || !items.length) return;
    grid.replaceChildren();
    for (const item of items) {
      const card = document.createElement('article');
      card.className = 'news-card';
      const tag = document.createElement('div');
      tag.className = 'news-tag';
      tag.textContent = item.category;
      const date = document.createElement('div');
      date.className = 'news-date';
      const parsed = new Date(item.created_at);
      date.textContent = Number.isNaN(parsed.getTime())
        ? 'FRISSÍTÉS'
        : parsed.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
      const title = document.createElement('h3');
      title.textContent = item.title;
      const body = document.createElement('p');
      body.textContent = item.body;
      const index = document.createElement('span');
      index.className = 'news-index';
      index.textContent = 'FNAF HUN // KÖZLEMÉNY';
      card.append(tag, date, title, body, index);
      grid.append(card);
    }
  };

  // Optional: show the latest published news when Supabase is configured.
  // The static starter cards stay visible if the backend is unavailable.
  (async () => {
    const grid = document.querySelector('#news-grid');
    if (!grid) return;
    const client = window.FNAF?.createClient();
    if (!client) return;
    try {
      const { data, error } = await client
        .from('news')
        .select('category,title,body,created_at')
        .order('created_at', { ascending: false })
        .limit(6);
      if (error || !data) return;
      renderNews(data);
    } catch (_) { /* Keep starter news visible if the optional backend is unavailable. */ }
  })();
})();
