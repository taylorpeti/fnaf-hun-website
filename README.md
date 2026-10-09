# FNaF HUN – közösségi weboldal

Reszponzív, sötét neonpiros/lila gaming weboldal a magyar FNaF közösségnek: nyilvános tartalmi oldal + Supabase-hitelesítésű adminpanel a hírek kezeléséhez.

> **Státusz röviden:** a nyilvános oldal, a reszponzív megjelenés, a belső hivatkozások és a biztonsági ellenőrzések **ellenőrizve vannak** (lásd *Tesztelés*). A Supabase-hitelesítés, az adatbázis-írás és az éles publikálás **addig NEM működik, amíg a *Szükséges kézi beállítások* rész lépéseit el nem végzed** – ezek fiókhozzáférést igényelnek, helyetted nem végezhetők el.

---

## Tartalom

| Fájl | Szerep |
|---|---|
| `index.html`, `style.css`, `script.js` | Nyilvános weboldal (főoldal, közösség, hírek, stáb) |
| `admin.html`, `admin.css`, `admin.js` | Adminpanel: belépés, hírek létrehozása / szerkesztése / törlése |
| `common.js` | Supabase-kapcsolat és konfiguráció-ellenőrzés (mindkét oldal használja) |
| `supabase-config.js` | A saját Supabase-projekt URL-je és anon/publishable kulcsa (helyettesítő értékekkel) |
| `supabase-config.example.js` | Ugyanennek a mintája, biztonsági másolatként |
| `schema.sql` | Adatbázistáblák, indexek, RLS-szabályok, admin szerepkör – újrafuttatható |
| `tests/verify.mjs` | Automatikus ellenőrzés: szintaxis, linkek, asset-utak, titkos kulcsok |
| `tests/dom-test.mjs` | Böngésző-DOM teszt (jsdom): menü, hivatkozások, admin bejelentkezés/CRUD útvonalak |
| `package.json`, `.gitignore`, `.nojekyll` | Tesztparancsok, a `node_modules` kihagyása és a Jekyll-feldolgozás kikapcsolása |

---

## Mi működik és mi nincs beállítva

**Ellenőrizve (helyi gépen futtatva):**

- `node tests/verify.mjs` – minden ellenőrzés sikeres (JS-szintaxis, HTML belső hivatkozások, asset-utak, duplikált `id`-k, gyökeres útvonalak hiánya, titkos kulcsok hiánya, Roblox-link, `schema.sql` RLS-e).
- `npm run test:dom` – minden DOM-teszt sikeres (menü, hivatkozások, modális figyelmeztetés, admin belépés/CRUD/kijelentkezés szimulált backenddel).
- Minden hivatkozott fájl helyi szervertől `200` választ ad (`index.html`, `admin.html`, `*.css`, `*.js`, `supabase-config.js`).
- A HTML szerkezete (nyitó/záró tagok) hibátlan.
- A reszponzív elrendezés CDP-probe-szal ellenőrizve (Chrome, valódi `Emulation.setDeviceMetricsOverride`): mindkét oldal a 320 / 360 / 414 / 600 / 820 / 1280 px szélességeken – nincs vízszintes túlfolyás, levágott szöveg, hiányzó elem, duplikált `id` vagy JS-hiba; a menü 650 px alatt hamburgerre vált; a rácsok egy oszlopra törnek.
- A Roblox-megosztólink élőben `200`-at ad (átirányít a Roblox share-kezelőjére).
- A `@supabase/supabase-js` CDN-elérhető (`200`).

**Kézi beállítást igényel (ezért nem állítom, hogy működik):**

1. **Supabase-projekt** létrehozása + `schema.sql` lefuttatása.
2. **Admin-felhasználó** létrehozása és `role = admin` beállítása.
3. **`supabase-config.js`** kitöltése a saját projekt URL-jével és anon/publishable kulcsával.
4. **Discord-meghívó** – ki van töltve: `https://discord.gg/RysRKHkjaU` (cserélhető a `script.js` `communityLinks.discord` értékében).
5. **GitHub Pages publikálás** (repository létrehozása, Pages bekapcsolása).

---

## Helyi megnyitás

Egyszerűen nyisd meg az `index.html` fájlt egy modern böngészőben, vagy indítsd el a csomagot helyi szerverről (ajánlott, hogy a fájlok úgy viselkedjenek, mint a valódi tárhelyen):

```bash
# bármelyik megoldás jó:
python -m http.server 8080
# vagy: npx serve .
```

Majd nyisd meg a `http://localhost:8080` címet.

> Ha a Supabase még nincs beállítva, az oldal **hibamentesen** működik: a beépített kezdő hírek maradnak láthatóan, az adminpanel pedig a beállításra kéri a látogatót.

---

## Szükséges kézi beállítások

### 1. Supabase-projekt és adatbázis

1. Hozz létre egy ingyenes Supabase-projektet: <https://supabase.com> → **New project**.
2. A Dashboardon nyisd meg a **SQL Editor** menüt → **New query**.
3. Illeszd be a `schema.sql` teljes tartalmát, és futtasd le. A fájl újrafuttatható, nem hagy duplikátumot.
   - Létrehozza: `profiles` és `news` táblákat, indexeket, RLS-szabályokat, az `is_admin()` segédfüggvényt és az új felhasználónál automatikus profilt létrehozó triggert.

### 2. Admin-felhasználó

1. Supabase Dashboard → **Authentication** → **Users** → **Add user** → *Create new user*.
   - Add meg az admin e-mail-címet és egy **erős, egyedi** jelszót (ne másold át más szolgáltatás jelszavát).
   - A *Auto Confirm User* bekapcsolása egyszerűbb (nem kell megerősíteni az e-mailt).
2. SQL Editorban lekérdezed az UUID-t:

   ```sql
   select id, email from auth.users;
   ```

3. Ugyanitt beállítod az admin szerepkört (a saját UUID-ddel):

   ```sql
   insert into public.profiles (id, role)
   values ('A-FELHASZNALO-UUID-JE', 'admin')
   on conflict (id) do update set role = 'admin';
   ```

### 3. `supabase-config.js` kitöltése

1. Supabase Dashboard → **Project Settings** → **API**:
   - *Project URL* → `url`
   - *Project API keys* → **Publishable key** (régebbi projekteken: `anon public`) → `anonKey`
2. Nyisd meg a `supabase-config.js` fájlt, és cseréld le a helyettesítő értékeket:

   ```js
   window.FNAF_SUPABASE_CONFIG = {
     url: 'https://xyzabcd.supabase.co',
     anonKey: 'sb_publishable_...'
   };
   ```

**Biztonság:** a böngészőben **kizárólag** a publishable/anon kulcs használható. `service_role`, `sb_secret_` vagy bármilyen titkos kulcs **soha** ne kerüljön HTML, JS vagy CSS fájlba – azok bárki számára olvashatók lesznek. Az adatbiztonságot az RLS-szabályok adják, nem a kulcs elrejtése.

### 4. Discord-meghívó

Beállítva: `https://discord.gg/RysRKHkjaU` – ez jelenik meg a közösségi kártyán és a CTA gombon is, új lapon, `noopener`-rel.

Ha cserélni kell, nyisd meg a `script.js` fájlt:

```js
const communityLinks = {
  discord: 'https://discord.gg/RysRKHkjaU',
  roblox: 'https://www.roblox.com/share?...'
};
```

A Roblox-játék linkje már be van állítva:

`https://www.roblox.com/share?code=8c8eed3906a6844abc9cd09e75449092&type=ExperienceDetails&stamp=1791544366153`

---

## Éles tesztelése (Supabase beállítása után)

Ezeket a lépéseket **kézzel kell lefuttatni**, mert valódi fiókot és adatbázist igényelnek:

1. **Belépés:** `admin.html` → hibás jelszó → *„Hibás e-mail-cím vagy jelszó."* üzenet; helyes jelszóval → megjelenik a dashboard és a *Bejelentkezve: …* sor.
2. **Jogosultság:** jelentkezz be egy **nem admin** felhasználóval → elutasítás + kijelentkezés; a `news` tábla írása RLS miatt elutasításra kerül.
3. **CRUD:** hír létrehozása → megjelenik a listában és a főoldalon (`index.html`); szerkesztés; törlés megerősítéssel.
4. **Kijelentkezés:** a dashboard eltűnik, a státuszüzenet visszaáll.
5. **Nyilvános oldal:** frissítés nélkül is jelenjenek meg az új hírek a főoldalon; ha a Supabase elérhetetlen, a beépített kezdő hírek maradnak.
6. **Reszponzív:** 360 / 650 / 900 / 1440 px-es szélesség ellenőrzése (mobil menü, kártyák, lábléc).
7. **Akadálymentesség:** Tab-lengetéssel végighaladva látható fókuszgyűrű; `prefers-reduced-motion` bekapcsolásakor leállnak az animációk.

---

## Tesztelés

```bash
# 1) statikus ellenőrzés (nem igényel hálózatot és függőséget)
node tests/verify.mjs        # vagy: npm test

# 2) böngésző-DOM teszt (egyszer: npm install)
npm install
npm run test:dom
```

**`tests/verify.mjs` mit ellenőriz:**

- minden JS-fájl szintaxisát (`node --check`);
- a HTML belső hivatkozásait (`#home`, `#community`, `#news`, `#staff`, `#content`) és a helyi fájlhivatkozásokat (`style.css`, `admin.html`, `common.js`, …);
- nincs-e gyökeres (`/…`) útvonal, ami a GitHub Pages alkönyvtárában eltörne;
- nincs-e duplikált `id` a HTML-ben;
- nincs-e JWT, `service_role`, `sb_secret_` vagy más titkos kulcs a frontendfájlokban;
- a `supabase-config.js` csak helyettesítő értékeket tartalmaz-e (tehát nem került éles kulcs a repositoryba);
- a Roblox-link és a Discord-link megőrzését (mindkettő `https://` kezdetű és érvényes formájú);
- a `schema.sql` RLS-beállításait és újrafuttathatóságát, valamint hogy a `role` nem ön-megadható (nincs insert/update policy a `profiles` táblán);
- a CSS-fájlok zárójel-egyensúlyát.

A layout-probe eszközei (`cdp-probe.mjs`, `probe.js`) a repository-n kívül, a temp mappában élnek: a runner minden futás elején másolja a `probe.js`-t a projekt gyökerébe, és a futás végén törli (a produkciós fájlok nem módosulnak).

Kilépési kód `0`, ha minden rendben; `1`, ha bármelyik ellenőrzés hibás.

**`tests/dom-test.mjs` mit ellenőriz** (jsdom + szimulált Supabase-backenda, valódi hálózat nélkül):

- a mobil menü nyit/zár gombbal és Escape-szel;
- a Roblox- és Discord-hivatkozások beállítását (új lap, `noopener`), valamint a „nincs még link" állapotot és a figyelmeztető ablakot (üres link esetén);
- hogy a beépített kezdő hírek megmaradnak Supabase nélkül;
- az admin folyamatot három esetben: nincs konfiguráció, **admin** (dashboard, munkamenet-megjelenítés, hírbetöltés, hírmentés, kijelentkezés), **nem admin** (automatikus kijelentkezés és jogosultsági üzenet);
- a magyar hibaüzeneteket rossz jelszóra.

> A `node_modules` mappa a `.gitignore` miatt nem kerül fel a repositoryba; a GitHub Pages-en csak a statikus fájlok jelennek meg.

---

## Közzététel GitHub Pages-szel

1. Hozz létre egy **nyilvános** GitHub repository-t (pl. `fnaf-hun-site`).
2. Töltsd fel a fájlokat a repository **gyökerébe** (`index.html` legyen a gyökérben, nem egy alkönyvtárban):

   ```bash
   git init
   git add .
   git commit -m "FNaF HUN weboldal"
   git branch -M main
   git remote add origin https://github.com/FELHASZNALO/fnaf-hun-site.git
   git push -u origin main
   ```

3. Repository → **Settings** → **Pages**:
   - *Source:* `Deploy from a branch`
   - *Branch:* `main` / `/(root)` → **Save**.
4. Néhány perc múlva elérhető lesz: `https://FELHASZNALO.github.io/fnaf-hun-site/`
5. Ellenőrizd a főoldalt és az `admin.html`-t mobilon és asztali gépen is; futtasd újra a `node tests/verify.mjs` parancsot a push előtt.

> A `.nojekyll` fájl biztosítja, hogy a GitHub Pages a fájlokat változtatás nélkül szolgálja ki (a Jekyll-feldolgozás kikapcsolva).

**Előnyök:** minden útvonal relatív (`style.css`, `admin.html`, `common.js`), így az oldal **alkönyvtárban is működik** – nem kell `base href` vagy külön útvonal-konfiguráció. A hitelesítést és az adatbázist a Supabase kezeli, a GitHub Pages csak statikus fájlokat szolgál ki.

**Figyelem:** a `supabase-config.js` csak akkor kerüljön fel, ha benne kizárólag publishable/anon kulcs van. Titkos kulcsot soha ne tölts fel, és ne is legyen a repositoryban.

---

## Hibakeresés

| Tünet | Ok / megoldás |
|---|---|
| *„Még nincs beállítva a Supabase…"* az adminon | A `supabase-config.js` helyettesítő értékeken van, vagy rossz a URL/kulcs. |
| *„Ehhez a fiókhoz nincs adminjogosultság."* | A `profiles` táblában nincs `role = admin` sor ehhez az UUID-hez (lásd 2. lépés). |
| *„Hibás e-mail-cím vagy jelszó."* | Nem megfelelő adatok, vagy a felhasználó e-mailje nincs megerősítve (használd a *Auto Confirm* opciót). |
| Nem töltődnek az adatbázisból érkező hírek | Futtasd le a `schema.sql`-t, és ellenőrizd a `news` tábla RLS `select` szabályát. |
| 404 a `supabase-config.js`-re | A fájl hiányzik a gyökérből; a csomagban benne van (helyettesítő értékekkel), töltsd fel. |
| A Discord gomb nem nyit meg semmit | Üres vagy elavult meghívó; ellenőrizd a `communityLinks.discord` értékét a `script.js`-ben. |

---

## Licenc és jogi megjegyzés

Fan community oldal, nem hivatalos Five Nights at Freddy's tartalom. A Roblox- és Discord-nevek a tulajdonosokéi.
