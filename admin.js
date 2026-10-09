(() => {
  const $ = id => document.getElementById(id);
  const loginPanel = $('login-panel'), dashboard = $('dashboard');
  let client = null;
  let currentUserId = null;
  let verifying = false;

  const setStatus = (id, message) => { const el = $(id); if (el) el.textContent = message; };
  const setBusy = (button, busy, busyLabel) => {
    if (!button) return;
    if (busy) { button.dataset.label = button.textContent; button.textContent = busyLabel || '…'; button.disabled = true; }
    else { button.textContent = button.dataset.label || button.textContent; button.disabled = false; }
  };
  const readableError = error => {
    const map = {
      'Invalid login credentials': 'Hibás e-mail-cím vagy jelszó.',
      'Email not confirmed': 'Az e-mail-cím még nincs megerősítve.',
      'Rate limit exceeded': 'Túl sok kísérlet. Próbáld újra kicsivel később.',
      'Failed to fetch': 'Nincs kapcsolat a Supabase-szal. Ellenőrizd a hálózatot és a supabase-config.js beállításait.'
    };
    return map[error?.message] || error?.message || 'Ismeretlen hiba.';
  };

  function showLogin(message) {
    loginPanel.classList.remove('hidden');
    dashboard.classList.add('hidden');
    currentUserId = null;
    if (message) setStatus('login-status', message);
  }

  function showDashboard(user) {
    loginPanel.classList.add('hidden');
    dashboard.classList.remove('hidden');
    currentUserId = user.id;
    const info = $('session-info');
    if (info) info.textContent = `Bejelentkezve: ${user.email || user.id} · jogosultság: admin`;
    setStatus('login-status', '');
    setStatus('news-status', '');
  }

  async function checkAdmin(user) {
    if (verifying || currentUserId === user.id) return;
    verifying = true;
    try {
      const { data, error } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (error) {
        await client.auth.signOut();
        showLogin('Nem sikerült lekérni a jogosultságot: ' + readableError(error));
        return;
      }
      if (!data || data.role !== 'admin') {
        await client.auth.signOut();
        showLogin('Ehhez a fiókhoz nincs adminjogosultság. A projekt adminisztrátora a profiles táblában állíthatja be a role = admin értéket.');
        return;
      }
      showDashboard(user);
      await loadNews();
    } finally {
      verifying = false;
    }
  }

  async function init() {
    client = window.FNAF?.createClient();
    if (!client) {
      showLogin('Még nincs beállítva a Supabase. Kövesd a README-ben leírt telepítési lépéseket (supabase-config.js + schema.sql).');
      return;
    }
    setStatus('login-status', 'Kapcsolat létesítése…');
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session) await checkAdmin(session.user);
      else setStatus('login-status', 'Add meg az admin e-mail-címét és jelszavát.');
    } catch (error) {
      setStatus('login-status', 'Nem sikerült kapcsolódni: ' + readableError(error));
    }
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        const status = $('login-status');
        const current = status ? status.textContent.trim() : '';
        showLogin(current || 'A munkamenet véget ért. Jelentkezz be újra.');
        return;
      }
      if (session) setTimeout(() => checkAdmin(session.user), 0);
    });
  }

  $('login-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) { setStatus('login-status', 'Előbb konfiguráld a Supabase-t a supabase-config.js fájlban.'); return; }
    const button = event.submitter;
    setStatus('login-status', 'Bejelentkezés…');
    setBusy(button, true, 'BELÉPÉS…');
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: $('email').value.trim(),
        password: $('password').value
      });
      if (error) { setStatus('login-status', 'Sikertelen bejelentkezés: ' + readableError(error)); return; }
      $('password').value = '';
      await checkAdmin(data.user);
    } catch (error) {
      setStatus('login-status', 'Bejelentkezési hiba: ' + readableError(error));
    } finally {
      setBusy(button, false);
    }
  });

  $('logout').addEventListener('click', async () => {
    try { if (client) await client.auth.signOut(); } catch (_) { /* ignore */ }
    showLogin('Sikeres kijelentkezés.');
  });

  $('reset-news').addEventListener('click', () => {
    $('news-form').reset();
    $('news-id').value = '';
    $('news-category').value = 'KÖZÖSSÉG';
    setStatus('news-status', '');
  });

  $('news-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) return;
    const button = event.submitter;
    const payload = {
      category: $('news-category').value.trim(),
      title: $('news-title').value.trim(),
      body: $('news-body').value.trim()
    };
    if (!payload.category || !payload.title || !payload.body) {
      setStatus('news-status', 'Minden mező kitöltése kötelező.');
      return;
    }
    const id = $('news-id').value;
    setStatus('news-status', 'Mentés…');
    setBusy(button, true, 'MENTÉS…');
    try {
      const result = id
        ? await client.from('news').update(payload).eq('id', id)
        : await client.from('news').insert(payload);
      if (result.error) { setStatus('news-status', 'Mentési hiba: ' + readableError(result.error)); return; }
      $('news-form').reset();
      $('news-id').value = '';
      $('news-category').value = 'KÖZÖSSÉG';
      setStatus('news-status', id ? 'A hír frissítve.' : 'Az új hír elmentve.');
      await loadNews();
    } catch (error) {
      setStatus('news-status', 'Mentési hiba: ' + readableError(error));
    } finally {
      setBusy(button, false);
    }
  });

  async function loadNews() {
    const target = $('news-list');
    target.innerHTML = '<p class="status">Betöltés…</p>';
    try {
      const { data, error } = await client
        .from('news')
        .select('id,category,title,body,created_at')
        .order('created_at', { ascending: false });
      if (error) { target.textContent = 'Nem sikerült betölteni a híreket: ' + readableError(error); return; }
      target.replaceChildren();
      if (!data.length) {
        target.textContent = 'Még nincs hír. A fenti űrlappal létrehozhatod az elsőt.';
        return;
      }
      for (const item of data) {
        const row = document.createElement('article');
        row.className = 'news-item';
        const content = document.createElement('div');
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.textContent = item.category;
        const title = document.createElement('h3');
        title.textContent = item.title;
        const body = document.createElement('p');
        body.textContent = item.body;
        const meta = document.createElement('span');
        meta.className = 'small';
        const parsed = new Date(item.created_at);
        meta.textContent = Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleString('hu-HU');
        content.append(tag, title, body, meta);

        const actions = document.createElement('div');
        actions.className = 'actions';
        const edit = document.createElement('button');
        edit.className = 'btn secondary';
        edit.type = 'button';
        edit.textContent = 'SZERKESZTÉS';
        edit.addEventListener('click', () => {
          $('news-id').value = item.id;
          $('news-category').value = item.category;
          $('news-title').value = item.title;
          $('news-body').value = item.body;
          setStatus('news-status', 'Szerkesztés: ' + item.title);
          $('news-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
          $('news-title').focus();
        });
        const del = document.createElement('button');
        del.className = 'btn danger';
        del.type = 'button';
        del.textContent = 'TÖRLÉS';
        del.addEventListener('click', async () => {
          if (!confirm('Biztosan törlöd ezt a hírt?')) return;
          setBusy(del, true, 'TÖRLÉS…');
          try {
            const { error } = await client.from('news').delete().eq('id', item.id);
            if (error) { setStatus('news-status', 'Törlési hiba: ' + readableError(error)); return; }
            setStatus('news-status', 'A hír törölve.');
            await loadNews();
          } catch (error) {
            setStatus('news-status', 'Törlési hiba: ' + readableError(error));
          } finally {
            setBusy(del, false);
          }
        });
        actions.append(edit, del);
        row.append(content, actions);
        target.append(row);
      }
    } catch (error) {
      target.textContent = 'Nem sikerült betölteni a híreket: ' + readableError(error);
    }
  }

  init();
})();
