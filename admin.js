/* ================= ADE'S GADGET — admin.js ================= */
'use strict';
(function () {
  'use strict';

  var LS_CATALOG  = 'ag_catalog';
  var LS_HERO     = 'ag_hero';
  var LS_ADMIN_KEY= 'ag_admin_key';
  var LS_PROMOS   = 'ag_promos';
  var CATALOG_VERSION = 2;

  var $  = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var toast, esc;

  // ---- storage ----
  function readCatalog() {
    try {
      var raw = localStorage.getItem(LS_CATALOG);
      if (!raw) return null;
      var d = JSON.parse(raw);
      if (d && d.v === CATALOG_VERSION && Array.isArray(d.phones)) return d.phones;
    } catch (e) { /* ignore */ }
    return null;
  }
  function writeCatalog(phones) {
    localStorage.setItem(LS_CATALOG, JSON.stringify({ v: CATALOG_VERSION, phones: phones }));
  }
  function readHero() { try { return localStorage.getItem(LS_HERO) || null; } catch (e) { return null; } }
  function writeHero(url) { if (url) { try { localStorage.setItem(LS_HERO, url); } catch (e) {} } else { try { localStorage.removeItem(LS_HERO); } catch (e) {} } }
  function readAdminKey() { try { return localStorage.getItem(LS_ADMIN_KEY) || null; } catch (e) { return null; } }
  function writeAdminKey(k) { if (k) { try { localStorage.setItem(LS_ADMIN_KEY, k); } catch (e) {} } else { try { localStorage.removeItem(LS_ADMIN_KEY); } catch (e) {} } }
  function readPromos() {
    try {
      var raw = localStorage.getItem(LS_PROMOS);
      if (raw) { var p = JSON.parse(raw); if (p && typeof p === 'object') return p; }
    } catch (e) { /* ignore */ }
    return null;
  }
  function writePromos(p) { try { localStorage.setItem(LS_PROMOS, JSON.stringify(p || {})); } catch (e) {} }

  // ---- server session + API (email/password login) ----
  var LS_SESSION_EMAIL = 'ag_session_email';
  function readSessionEmail() { try { return localStorage.getItem(LS_SESSION_EMAIL) || null; } catch (e) { return null; } }
  function writeSessionEmail(e) { if (e) { try { localStorage.setItem(LS_SESSION_EMAIL, e); } catch (ex) {} } else { try { localStorage.removeItem(LS_SESSION_EMAIL); } catch (ex) {} } }
  function sessionEmail() { return state.sessionEmail; }

  function apiGet(path) {
    return fetch(path, { method:'GET' }).then(function (r) { return r.json(); }).catch(function () { return null; });
  }
  function apiPost(path, body) {
    return fetch(path, {
      method:'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); }).catch(function () { return null; });
  }
  function adminHeaders() {
    var h = { 'Content-Type':'application/json' };
    // when logged in via session, the browser sends the cookie automatically;
    // for uploads we also support the legacy X-Admin-Key header as fallback.
    return h;
  }
  function uploadHeaders() {
    var h = { 'Content-Type':'application/json' };
    // prefer session cookie (browser sends it automatically); also attach legacy key if present
    if (state.key) h['X-Admin-Key'] = state.key;
    return h;
  }

  function login(email, password) {
    return apiPost('/admin-login', { email: email, password: password }).then(function (resp) {
      if (!resp || !resp.ok) throw new Error(resp && resp.error ? resp.error : 'Login failed.');
      state.sessionEmail = resp.email;
      writeSessionEmail(resp.email);
      state.key = null; // no longer need the legacy code
      state._catalogCache = null;
      return resp;
    });
  }
  function logout() {
    apiPost('/admin-logout', {}).catch(function () {});
    state.sessionEmail = null;
    writeSessionEmail(null);
    state._catalogCache = null;
  }
  function serverReachable() {
    return apiGet('/admin-api/catalog').then(function (resp) {
      return !!(resp && resp.ok);
    }).catch(function () { return false; });
  }

  // ---- promo access (file PROMOS is a global from app.js) ----
  function effectivePromos() {
    var file = (typeof PROMOS !== 'undefined') ? PROMOS : {};
    var saved = readPromos();
    if (!saved) return file;
    return Object.assign({}, file, saved);
  }

  // ---- id ----
  function freshId() { return 'ph_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7); }

  // ---- image upload (POST /admin-upload with base64 body) ----
  function uploadImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('No file chosen.'));
      if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'));
      if (file.size > 4 * 1024 * 1024) return reject(new Error('Image must be under 4 MB.'));
      var reader = new FileReader();
      reader.onload = function () {
        var dataUrl = reader.result;
        var idx = dataUrl.indexOf(',');
        if (idx < 0) return reject(new Error('Could not read image data.'));
        var base64 = dataUrl.slice(idx + 1);
        var ext = (file.name.match(/\.([a-z0-9]+)$/i) || [])[1] || 'jpg';
        var id = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
        var path = 'img-admin/uploads/' + id + '.' + ext;
        var body = JSON.stringify({ path: path, data: base64 });
        fetch('/admin-upload', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Key': (readAdminKey() || '') },
          body: body
        })
        .then(function (r) { return r.json().then(function (resp) { return { ok: resp.ok, error: resp.error, url: resp.url }; }); })
        .then(function (res) {
          if (res.ok && res.url) resolve(res.url);
          else if (res.error) reject(new Error(res.error));
          else reject(new Error('Upload failed. Is the server running? Try pasting an image URL instead.'));
        })
        .catch(function () { reject(new Error('Upload failed. Is the server running? You can paste an image URL instead.')); });
      };
      reader.onerror = function () { reject(new Error('Could not read the file.')); };
      reader.readAsDataURL(file);
    });
  }

  // ---- change admin code on server + locally ----
  function setServerKey(newKey) {
    var old = readAdminKey();
    return fetch('/admin-set-secret', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': (old || '') },
      body: JSON.stringify({ newKey: newKey })
    })
    .then(function (r) { return r.json(); })
    .then(function (resp) {
      if (resp.ok) { writeAdminKey(newKey); return true; }
      return Promise.reject(new Error(resp.error || 'Could not update the server code.'));
    })
    .catch(function (err) {
      writeAdminKey(newKey);
      throw new Error((err && err.message) ? err.message : 'Server not reachable — code updated in this browser only. Uploads will work once the server knows the new code.');
    });
  }

  // ---- state ----
  var state = {
    phones: null,
    editing: null,
    tab: 'phones',
    key: readAdminKey(),
    sessionEmail: readSessionEmail() || null,
    dirty: false,
    _serverOk: null
  };

  // ---- toast + esc (shared look with app) ----
  function ensureHelpers() {
    if (!toast) {
      toast = function (msg, kind) {
        var wrap = $('#toastWrap');
        if (!wrap) return;
        var el = document.createElement('div');
        el.className = 'toast' + (kind === 'err' ? ' toast--err' : kind === 'info' ? ' toast--info' : '');
        el.innerHTML = '<span>' + (kind === 'err' ? '\u26a0\ufe0f' : kind === 'info' ? '\u2139\ufe0f' : '\u2705') + '</span><span>' + (esc(msg)) + '</span>';
        wrap.appendChild(el);
        setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 380); }, 2600);
      };
    }
    if (!esc) {
      esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]); }); };
    }
  }

  // ---- open / close ----
  function open() {
    ensureHelpers();
    state.phones = catalog();
    state.editing = null;
    state.tab = 'phones';
    var modal = $('#adminModal');
    if (!modal) return;
    $$('.modal.on').forEach(function (m) { m.classList.remove('on'); });
    modal.classList.add('on');
    syncLock();
    if (state.sessionEmail) {
      // already signed in; show the logged-in state (re-render bar + tabs)
      renderLoggedInStatus(state.sessionEmail);
      showTab('phones');
    } else if (state.key) {
      // legacy code unlock still works
      showTab('phones');
    } else {
      showLoginForm();
    }
  }
  function close() {
    var modal = $('#adminModal');
    if (!modal) return;
    modal.classList.remove('on');
    state.editing = null;
    syncLock();
  }
  function showUnlock() {
    showLoginForm();
  }
  function showLoginForm() {
    $('#adminUnlock').hidden = false;
    $('#adminBody').hidden = true;
    $('#adminTitle').textContent = 'Catalog Manager';
    $('#adminSub').textContent = 'Sign in with your admin email and password.';
    var lf = $('#adminLoginForm');
    if (lf) lf.style.display = '';
    var cf = $('#adminCodeForm');
    if (cf) cf.style.display = 'none';
  }
  function doSignIn() {
    var emailInputEl = $('#adminEmailInput');
    var passInputEl = $('#adminPassInput');
    var signInBtnEl = $('#adminSignInBtn');
    var email = (emailInputEl ? emailInputEl.value : '').trim().toLowerCase();
    var password = (passInputEl ? passInputEl.value : '');
    if (!email) return toast('Enter your admin email', 'err');
    if (!password) return toast('Enter your password', 'err');
    // disable button during login
    if (signInBtnEl) { signInBtnEl.disabled = true; signInBtnEl.textContent = 'Signing in\u2026'; }
    login(email, password)
      .then(function (resp) {
        state.sessionEmail = resp.email;
        writeSessionEmail(resp.email);
        state.key = null;
        state._catalogCache = null;
        showLoggedIn(resp.email);
        toast('Signed in as ' + esc(resp.email));
      })
      .catch(function (err) {
        toast(err && err.message ? err.message : 'Sign in failed', 'err');
        if (signInBtnEl) { signInBtnEl.disabled = false; signInBtnEl.textContent = 'Sign in'; }
      })
      .finally(function () {
        if (emailInputEl) emailInputEl.focus();
      });
  }
  function showLoggedIn(email) {
    $('#adminUnlock').hidden = true;
    $('#adminBody').hidden = false;
    $('#adminTitle').textContent = 'Catalog Manager';
    $('#adminSub').textContent = 'Signed in as ' + esc(email) + ' \u2014 edit phones, prices and pictures.';
    renderLoggedInStatus(email);
    // refresh catalog from server so the panel reflects the server of truth
    reloadCatalogFromServer();
  }
  function adminLoggedInBar(email) {
    return '' +
      '<div class="admin__logged-in" id="adminLoggedInBar">' +
        '<span class="admin__logged-in-email">\ud83d\udd10 ' + esc(email) + '</span>' +
        '<button class="btn btn--ghost" id="adminLogoutBtn">Sign out</button>' +
      '</div>';
  }
  function renderLoggedInStatus(email) {
    var body = $('#adminBody');
    if (!body) return;
    body.removeChild($('#adminLoggedInBar'));
    if (email) {
      var bar = document.createElement('div');
      bar.innerHTML = adminLoggedInBar(email);
      var el = bar.firstElementChild;
      body.insertBefore(el, body.firstChild);
      var lb = $('#adminLogoutBtn');
      if (lb) lb.onclick = function () {
        logout();
        state.sessionEmail = null;
        writeSessionEmail(null);
        state._catalogCache = null;
        renderLoggedInStatus(null);
        showLoginForm();
        toast('Signed out');
      };
    }
  }
  function showTab(tab) {
    state.tab = tab;
    $('#adminUnlock').hidden = true;
    $('#adminBody').hidden = false;
    $$('#adminTabs .admin__tab').forEach(function (t) { t.classList.toggle('admin__tab--on', t.dataset.tab === tab); });
    if (tab === 'phones') renderPhonesTab();
    else if (tab === 'settings') renderSettingsTab();
    else if (tab === 'promos') renderPromosTab();
  }

  // ---- catalog access ----
  function catalog() {
    if (typeof catalog === 'undefined') { /* never */ }
    var cached = state._catalogCache;
    if (cached) return cached;
    var phones = readCatalog();
    if (phones) { state._catalogCache = phones; return phones; }
    // seed from file PRODUCTS (defined in app.js)
    var src = (typeof PRODUCTS !== 'undefined') ? PRODUCTS : [];
    var normalized = src.map(normalizePhone);
    writeCatalog(normalized);
    state._catalogCache = normalized;
    return normalized;
  }
  function resetCatalogCache() { state._catalogCache = null; }

  // ---- server-backed catalog access (used when signed in) ----
  function serverCatalog() {
    return apiGet('/admin-api/catalog').then(function (resp) {
      if (resp && resp.ok && Array.isArray(resp.phones)) {
        // mirror to browser localStorage so the shop (same browser) sees it
        writeCatalog(resp.phones);
        return resp.phones;
      }
      // server unreachable or empty: fall back to browser localStorage / default
      return null;
    }).catch(function () { return null; });
  }
  function reloadCatalogFromServer() {
    state._catalogCache = null;
    return serverCatalog().then(function (phones) {
      if (phones) {
        state.phones = phones;
        // the sync catalog() now reads the freshly-mirrored localStorage;
        // re-render the active tab so the admin panel reflects the server catalog
        renderPhonesTab();
      }
      return phones;
    }).catch(function () { return null; });
  }
  function saveCatalogToServer(phones) {
    // mirror to localStorage first (so shop updates immediately in this browser)
    writeCatalog(phones);
    resetCatalogCache();
    // persist to server (best effort)
    return apiPost('/admin-api/catalog', { phones: phones }).then(function (resp) {
      if (!resp || !resp.ok) {
        var msg = (resp && resp.error) ? resp.error : 'Server save failed (catalog kept in this browser).';
        toast(msg, 'info');
      }
      return resp && resp.ok;
    }).catch(function () { toast('Server unreachable — catalog saved in this browser only.', 'info'); });
  }
  function saveHeroToServer(url) {
    writeHero(url);
    return apiPost('/admin-api/hero', { hero: url }).catch(function () {});
  }
  function savePromosToServer(promos) {
    writePromos(promos);
    return apiPost('/admin-api/promos', { promos: promos }).catch(function () {});
  }

  function normalizePhone(p) {
    return {
      id: p.id || freshId(),
      name: p.name || '',
      brand: p.brand || '',
      chip: p.chip || '',
      rating: (typeof p.rating === 'number') ? p.rating : 4.5,
      reviews: (Number(p.reviews || 0) || 0),
      isNew: !!p.isNew,
      hot: !!p.hot,
      outOfStock: !!p.outOfStock,
      colors: (Array.isArray(p.colors) ? p.colors.slice() : []),
      variants: (p.variants || []).map(function (v) { return { label: String(v.label || ''), price: Number(v.price || 0), old: Number(v.old || 0) }; }),
      specs: {
        Display: p.specs && p.specs.Display || '',
        Chip: p.specs && p.specs.Chip || '',
        Camera: p.specs && p.specs.Camera || '',
        Battery: p.specs && p.specs.Battery || '',
        SIM: p.specs && p.specs.SIM || ''
      },
      img: p.img || ''
    };
  }

  // ---- phones tab ----
  function renderPhonesTab() {
    state.phones = catalog();
    ensureHelpers();
    if (!state.phones.length) {
      $('#adminBody').innerHTML =
        '<div class="admin__empty">' +
          '<div class="admin__empty-ic">\ud83d\udfed</div>' +
          '<h3>Your shop is empty</h3>' +
          '<p>Add your first phone to get started. You can add pictures by pasting an image URL or uploading a photo.</p>' +
          '<button class="btn btn--accent admin__add" id="adminAddPhone">+ Add a Phone</button>' +
        '</div>';
      $('#adminAddPhone').onclick = startNewPhone;
      return;
    }
    var cards = state.phones.map(function (p) {
      var lowestPrice = Infinity;
      for (var i = 0; i < p.variants.length; i++) { var v = p.variants[i]; if (v.price < lowestPrice) lowestPrice = v.price; }
      if (lowestPrice === Infinity) lowestPrice = 0;
      var badges = '';
      if (p.outOfStock) badges += '<span class="badge badge--new">Coming soon</span>';
      else if (p.isNew) badges += '<span class="badge badge--new">New</span>';
      if (p.hot) badges += '<span class="badge badge--hot">Hot</span>';
      return '' +
        '<div class="admin__card" data-id="' + p.id + '">' +
          '<div class="admin__card-media">' +
            '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" onerror="if(!this.dataset.fired){this.src=\'data:image/svg+xml;charset=utf-8,\'+encodeURIComponent(\'<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' viewBox=\\\'0 0 100 100\\\'><rect width=\\\'100\\\' height=\\\'100\\\' rx=\\\'16\\\' fill=\\\'%2312151d\\\'/><text x=\\\'50\\\' y=\\\'62\\\' font-size=\\\'30\\\' font-family=\\\'Arial\\\' text-anchor=\\\'middle\\\' fill=\\\'%236b7280\\\'>\ud83d\udcf1</text></svg>\');this.dataset.fired=\'1"}' +
            '">' +
            (badges ? '<div class="admin__card-badges">' + badges + '</div>' : '') +
          '</div>' +
          '<div class="admin__card-body">' +
            '<div class="admin__card-brand">' + esc(p.brand) + '</div>' +
            '<div class="admin__card-name">' + esc(p.name) + '</div>' +
            '<div class="admin__card-price">' + naira(lowestPrice) + '</div>' +
            '<div class="admin__card-meta">' + p.variants.length + ' storage' + (p.variants.length !== 1 ? 's' : '') + ' \u00b7 ' + p.colors.length + ' colour' + (p.colors.length !== 1 ? 's' : '') + '</div>' +
          '</div>' +
          '<button class="btn btn--ghost admin__edit-btn" data-edit="' + p.id + '">Edit</button>' +
        '</div>';
    }).join('');
    $('#adminBody').innerHTML =
      '<div class="admin__toolbar">' +
        '<span class="admin__count"><b>' + state.phones.length + '</b> phone' + (state.phones.length === 1 ? '' : 's') + ' in catalog</span>' +
        '<button class="btn btn--accent" id="adminAddPhone">+ Add a Phone</button>' +
      '</div>' +
      '<div class="admin__grid" id="adminPhonesGrid">' + cards + '</div>';
    $('#adminAddPhone').onclick = startNewPhone;
    $$('#adminPhonesGrid .admin__edit-btn').forEach(function (b) {
      b.onclick = function () { startEditPhone(b.dataset.edit); };
    });
  }

  function startNewPhone() {
    state.editing = makeEmptyPhone(freshId());
    state.editing._new = true;
    renderEditor();
  }
  function startEditPhone(id) {
    var p = null;
    for (var i = 0; i < state.phones.length; i++) { if (state.phones[i].id === id) { p = state.phones[i]; break; } }
    if (!p) { toast('Phone not found', 'err'); return; }
    state.editing = Object.assign({}, p, { _new: false, _id: p.id });
    renderEditor();
  }

  function makeEmptyPhone(id) {
    return {
      id: id,
      name: '',
      brand: '',
      chip: '',
      rating: 4.5,
      reviews: 0,
      isNew: false,
      hot: false,
      outOfStock: false,
      colors: ['Black'],
      variants: [{ label: '128GB', price: 0, old: 0 }],
      specs: { Display: '', Chip: '', Camera: '', Battery: '', SIM: '' },
      img: ''
    };
  }

  function renderEditor() {
    var e = state.editing;
    if (!e) { showTab('phones'); return; }
    ensureHelpers();
    $('#adminTitle').textContent = e._new ? 'Add a Phone' : 'Edit \u201c' + esc(e.name || 'Phone') + '\u201d';
    $('#adminSub').textContent = e._new ? 'Fill in the details and add pictures.' : 'Change anything \u2014 the shop updates when you save.';
    var specKeys = ['Display', 'Chip', 'Camera', 'Battery', 'SIM'];
    var colorsHtml = (e.colors || []).map(function (c, i) {
      return '<div class="admin__opt-row">' +
        '<input class="admin__input admin__opt-val" data-colors-index="' + i + '" value="' + esc(c) + '" placeholder="Colour name">' +
        '<button class="admin__opt-rm" data-colors-rm="' + i + '" aria-label="Remove colour">\u00d7</button>' +
      '</div>';
    }).join('');
    var variantsHtml = (e.variants || []).map(function (v, i) {
      return '<div class="admin__opt-row">' +
        '<input class="admin__input admin__opt-label" data-vars-index="' + i + '" value="' + esc(v.label) + '" placeholder="e.g. 256GB">' +
        '<input class="admin__input admin__opt-price" data-vars-index="' + i + '" value="' + v.price + '" type="number" inputmode="numeric" placeholder="Price">' +
        '<input class="admin__input admin__opt-old" data-vars-index="' + i + '" value="' + v.old + '" type="number" inputmode="numeric" placeholder="Old price (optional)">' +
        '<button class="admin__opt-rm" data-vars-rm="' + i + '" aria-label="Remove variant">\u00d7</button>' +
      '</div>';
    }).join('');
    var specHtml = specKeys.map(function (k) {
      return '<div class="admin__specs-row">' +
        '<div class="admin__l">' + k + '</div>' +
        '<input class="admin__input" data-spec="' + k + '" value="' + esc(e.specs[k] || '') + '" placeholder="e.g. 6.1\u2033 Super Retina XDR">' +
      '</div>';
    }).join('');

    $('#adminBody').innerHTML =
      '<div class="admin__editor">' +
        '<div class="admin__section">' +
          '<div class="admin__label">Phone name <span>*</span></div>' +
          '<input class="admin__input" data-field="name" value="' + esc(e.name) + '" placeholder="e.g. iPhone 15">' +
        '</div>' +
        '<div class="admin__row2">' +
          '<div class="admin__section">' +
            '<div class="admin__label">Brand <span>*</span></div>' +
            '<input class="admin__input" data-field="brand" value="' + esc(e.brand) + '" placeholder="Apple">' +
          '</div>' +
          '<div class="admin__section">' +
            '<div class="admin__label">Chipset</div>' +
            '<input class="admin__input" data-field="chip" value="' + esc(e.chip) + '" placeholder="A16 Bionic">' +
          '</div>' +
        '</div>' +
        '<div class="admin__section admin__img-section">' +
          '<div class="admin__label">Phone picture</div>' +
          '<div class="admin__img-row">' +
            (function () {
              var ph = e.img
                ? '<img src="' + esc(e.img) + '" alt="preview" onerror="this.parentElement.innerHTML=' + JSON.stringify('<div class="admin__img-placeholder">Image did not load — check the URL</div>') + '">'
                : '<div class="admin__img-placeholder">No image</div>';
              return '<div class="admin__img-preview" id="adminPreview">' + ph + '</div>';
            })() + '</div>' +
            '<div class="admin__img-actions">' +
              '<input type="text" class="admin__input admin__img-url" data-field="img" value="' + esc(e.img) + '" placeholder="Paste an image URL, or upload a photo">' +
              '<label class="admin__upload-btn"><input type="file" accept="image/*" id="adminUploadFile"><span class="btn btn--dark">\ud83d\udcc1 Upload Photo</span></label>' +
              '<button class="btn btn--ghost" data-field-img-clear>Remove</button>' +
            '</div>' +
          '</div>' +
          '<p class="admin__img-hint">If you don\u2019t add a picture, the phone shows a styled placeholder. Paste a direct image link or upload one (server must be running).</p>' +
        '</div>' +
        '<div class="admin__section">' +
          '<div class="admin__label">Colours</div>' +
          '<div class="admin__opts" data-colors>' + (colorsHtml || '<div class="admin__empty-inline">No colours added yet.</div>') + '</div>' +
          '<button class="btn btn--ghost admin__add-row" data-add-colors>+ Add colour</button>' +
        '</div>' +
        '<div class="admin__section">' +
          '<div class="admin__label">Storage &amp; prices <span>Each storage size is a separate price.</span></div>' +
          '<div class="admin__opts admin__opts--specs" data-vars>' + (variantsHtml || '<div class="admin__empty-inline">No storage sizes added yet.</div>') + '</div>' +
          '<button class="btn btn--ghost admin__add-row" data-add-vars>+ Add storage size</button>' +
        '</div>' +
        '<div class="admin__section admin__specs-section">' +
          '<div class="admin__label">Key specs</div>' +
          specHtml +
        '</div>' +
        '<div class="admin__row3">' +
          '<div class="admin__section">' +
            '<div class="admin__label">Rating / reviews</div>' +
            '<div class="admin__rating-row">' +
              '<input type="range" min="1" max="5" step="0.1" value="' + e.rating + '" class="admin__rating" data-field="rating">' +
              '<span class="admin__rating-val">' + e.rating.toFixed(1) + ' \u2605</span>' +
            '</div>' +
            '<input class="admin__input" data-field="reviews" value="' + e.reviews + '" type="number" inputmode="numeric" placeholder="Number of reviews" style="margin-top:8px">' +
          '</div>' +
          '<div class="admin__section admin__toggles">' +
            '<label class="admin__toggle"><input type="checkbox" data-field="isNew" ' + (e.isNew ? 'checked' : '') + '><span>New release</span></label>' +
            '<label class="admin__toggle"><input type="checkbox" data-field="hot" ' + (e.hot ? 'checked' : '') + '><span>Hot deal</span></label>' +
            '<label class="admin__toggle"><input type="checkbox" data-field="outOfStock" ' + (e.outOfStock ? 'checked' : '') + '><span>Out of stock</span></label>' +
          '</div>' +
        '</div>' +
        '<div class="admin__editor-actions">' +
          '<button class="btn btn--accent" id="adminSavePhone">Save phone</button>' +
          '<button class="btn btn--ghost" id="adminEditorCancel">Cancel</button>' +
          (e._id ? '<button class="btn btn--ghost admin__delete" id="adminDeletePhone">Delete phone</button>' : '') +
        '</div>' +
      '</div>';

    wireEditor();
  }

  function wireEditor() {
    var e = state.editing;
    if (!e) return;
    $$('.admin__input[data-field]').forEach(function (inp) {
      inp.oninput = function () {
        var k = inp.dataset.field;
        if (inp.type === 'number' || inp.type === 'range') {
          e[k] = (inp.value === '') ? (k === 'reviews' ? 0 : (k === 'rating' ? 4.5 : 0)) : Number(inp.value);
        } else {
          e[k] = inp.value;
        }
      };
    });
    var rating = $('#adminRating');
    if (rating) {
      rating.oninput = function () {
        e.rating = parseFloat(rating.value) || 4.5;
        var v = $('#adminRatingVal');
        if (v) v.textContent = e.rating.toFixed(1) + ' \u2605';
      };
    }
    // colours
    var addColors = $('#adminBody').querySelector('[data-add-colors]');
    if (addColors) addColors.onclick = function () { (e.colors = e.colors || []).push(''); renderEditor(); };
    $$('.admin__opt-rm[data-colors-rm]').forEach(function (b) {
      b.onclick = function () {
        var i = +b.dataset.colorsRm;
        e.colors.splice(i, 1);
        renderEditor();
      };
    });
    $$('.admin__opt-val').forEach(function (inp) {
      inp.oninput = function () { var i = +inp.dataset.colorsIndex; (e.colors[i] = inp.value); };
    });
    // variants
    var addVars = $('#adminBody').querySelector('[data-add-vars]');
    if (addVars) addVars.onclick = function () { (e.variants = e.variants || []).push({ label: '', price: 0, old: 0 }); renderEditor(); };
    $$('.admin__opt-rm[data-vars-rm]').forEach(function (b) {
      b.onclick = function () {
        var i = +b.dataset.varsRm;
        e.variants.splice(i, 1);
        renderEditor();
      };
    });
    $$('.admin__opt-label').forEach(function (inp) {
      inp.oninput = function () { var i = +inp.dataset.varsIndex; (e.variants[i] || (e.variants[i] = {})).label = inp.value; };
    });
    $$('.admin__opt-price').forEach(function (inp) {
      inp.oninput = function () { var i = +inp.dataset.varsIndex; (e.variants[i] || (e.variants[i] = {})).price = inp.value === '' ? 0 : Number(inp.value); };
    });
    $$('.admin__opt-old').forEach(function (inp) {
      inp.oninput = function () { var i = +inp.dataset.varsIndex; (e.variants[i] || (e.variants[i] = {})).old = inp.value === '' ? 0 : Number(inp.value); };
    });
    // specs
    $$('.admin__input[data-spec]').forEach(function (inp) {
      inp.oninput = function () { e.specs[inp.dataset.spec] = inp.value; };
    });
    // image
    var imgUrl = $('#adminBody').querySelector('.admin__img-url');
    if (imgUrl) imgUrl.oninput = function () { e.img = imgUrl.value; updatePreview(); };
    var clearImg = $('#adminBody').querySelector('[data-field-img-clear]');
    if (clearImg) clearImg.onclick = function () { e.img = ''; updatePreview(); };
    var fileInput = $('#adminUploadFile');
    if (fileInput) {
      fileInput.onchange = function () {
        var f = fileInput.files && fileInput.files[0];
        if (!f) return;
        var btn = fileInput.closest('label').querySelector('.btn');
        var prev = btn.textContent;
        btn.textContent = 'Uploading\u2026'; btn.disabled = true;
        uploadImage(f)
          .then(function (url) {
            e.img = url; imgUrl.value = url; updatePreview();
            toast('Photo uploaded');
          })
          .catch(function (err) { toast(err.message, 'err'); })
          .finally(function () { btn.textContent = prev; btn.disabled = false; if (fileInput) fileInput.value = ''; });
      };
    }
    // actions
    $('#adminSavePhone').onclick = savePhone;
    $('#adminEditorCancel').onclick = function () { state.editing = null; renderPhonesTab(); };
    var del = $('#adminDeletePhone');
    if (del) del.onclick = function () {
      if (!e._id) return;
      var disp = e.name || 'this phone';
      if (!confirm('Delete \u201c' + disp + '\u201d? This can\u2019t be undone.')) return;
      var phones = catalog();
      for (var i = 0; i < phones.length; i++) { if (phones[i].id === e._id) { phones.splice(i, 1); break; } }
      writeCatalog(phones);
      resetCatalogCache();
      state.phones = phones;
      toast('Phone deleted');
      state.editing = null;
      renderPhonesTab();
    };
  }

  function updatePreview() {
    var preview = $('#adminPreview');
    if (!preview || !state.editing) return;
    if (state.editing.img) {
      preview.innerHTML = (function () {
        var bad = '<div class="admin__img-placeholder">Image did not load — check the URL</div>';
        return '<img src="' + esc(state.editing.img) + '" alt="preview" onerror="this.parentElement.innerHTML=' + JSON.stringify(bad) + '">';
      })();
    } else {
      preview.innerHTML = '<div class="admin__img-placeholder">No image</div>';
    }
  }

  function savePhone() {
    var e = state.editing;
    if (!e) return;
    if (!e.name || !e.name.trim()) return toast('Phone name is required', 'err');
    if (!e.brand || !e.brand.trim()) return toast('Brand is required', 'err');
    var variants = e.variants || [];
    if (!variants.length) return toast('Add at least one storage size with a price', 'err');
    for (var i = 0; i < variants.length; i++) {
      var v = variants[i];
      if (!v.label || !v.label.trim()) return toast('Each storage size needs a label', 'err');
      if (!v.price || v.price <= 0) return toast('Each storage size needs a valid price', 'err');
    }
    e.colors = (e.colors || []).map(function (c) { return c.trim(); }).filter(Boolean);
    if (!e.colors.length) e.colors = ['Black'];
    var specKeys = ['Display', 'Chip', 'Camera', 'Battery', 'SIM'];
    for (var s = 0; s < specKeys.length; s++) { e.specs[specKeys[s]] = e.specs[specKeys[s]] || ''; }
    e.reviews = Math.max(0, (Number(e.reviews || 0) || 0));
    var rt = parseFloat(e.rating);
    e.rating = isNaN(rt) ? 4.5 : Math.min(5, Math.max(1, rt));
    e.isNew = !!e.isNew; e.hot = !!e.hot; e.outOfStock = !!e.outOfStock;

    var phones = catalog();
    if (e._new) {
      while (phones.some(function (p) { return p.id === e.id; })) e.id = freshId();
      phones.push(e);
    } else {
      var idx = -1;
      for (var j = 0; j < phones.length; j++) { if (phones[j].id === e._id) { idx = j; break; } }
      if (idx >= 0) { phones[idx] = e; }
    }
    writeCatalog(phones);
    saveCatalogToServer(phones); // persist to server (best effort; localStorage already updated)
    if (e._new) toast('\u201c' + e.name + '\u201d added');
    else toast('\u201c' + e.name + '\u201d updated');
    resetCatalogCache();
    state.phones = catalog();
    state.editing = null;
    refreshShop();
    renderPhonesTab();
  }

  // ---- settings tab ----
  function renderSettingsTab() {
    ensureHelpers();
    var hero = readHero() || '';
    var key = state.key || '';
    $('#adminBody').innerHTML =
      '<div class="admin__section">' +
        '<div class="admin__label">Hero banner image</div>' +
        '<p class="admin__hint">The big phone image at the top of the homepage. Paste an image URL or upload one.</p>' +
        '<div class="admin__img-row">' +
          (function () {
            var ph = hero
              ? '<img src="' + esc(hero) + '" alt="hero preview" onerror="this.parentElement.innerHTML=' + JSON.stringify('<div class="admin__img-placeholder">Image did not load — check the URL</div>') + '">'
              : '<div class="admin__img-placeholder">Using default hero</div>';
            return '<div class="admin__img-preview" id="heroPreview">' + ph + '</div>';
          })() + '</div>' +
          '<div class="admin__img-actions">' +
            '<input type="text" class="admin__input" id="heroUrlInput" value="' + esc(hero) + '" placeholder="Paste image URL, or upload">' +
            '<label class="admin__upload-btn"><input type="file" accept="image/*" id="heroUploadFile"><span class="btn btn--dark">\ud83d\udcc1 Upload</span></label>' +
            '<button class="btn btn--ghost" id="heroClear">Remove</button>' +
          '</div>' +
        '</div>' +
        '<p class="admin__img-hint">If you don\u2019t set a hero image, the site uses the default.</p>' +
      '</div>' +
      '<div class="admin__section">' +
        '<div class="admin__label">Admin access code</div>' +
        '<p class="admin__hint">This code opens the Catalog Manager. Anyone without it just sees the shop. You can change it anytime.</p>' +
        '<div class="admin__code-row">' +
          '<input type="text" class="admin__input" id="adminKeyDisplay" value="' + esc(key) + '" readonly>' +
          '<button class="btn btn--ghost" id="adminKeyEdit">Change</button>' +
        '</div>' +
      '</div>' +
      '<div class="admin__code-change-row" id="adminCodeChangeRow" style="display:none">' +
        '<div class="admin__label">New access code</div>' +
        '<input type="text" class="admin__input" id="adminKeyNew" placeholder="Choose a code you\u2019ll remember">' +
        '<div class="admin__code-actions">' +
          '<button class="btn btn--accent" id="adminKeySave">Save new code</button>' +
          '<button class="btn btn--ghost" id="adminKeyCancel">Cancel</button>' +
        '</div>' +
      '</div>' +
      '<div class="admin__section">' +
        '<button class="btn btn--ghost admin__reset" id="adminReset">Reset catalog to the shop defaults</button>' +
      '</div>' +
      '<div class="admin__danger" style="margin-top:10px">' +
        '<button class="btn btn--ghost admin__danger" id="adminClear">Remove all phones from the catalog</button>' +
        '<a class="admin__forgot" id="adminForgot" style="display:block;margin-top:14px">Forgot the code? Reset it</a>' +
      '</div>';

    var heroUrl = $('#heroUrlInput');
    if (heroUrl) heroUrl.oninput = function () { writeHero(heroUrl.value); updateHeroPreview(); };
    var heroClear = $('#heroClear');
    if (heroClear) heroClear.onclick = function () { writeHero(null); saveHeroToServer(null); if (heroUrl) heroUrl.value = ''; updateHeroPreview(); refreshShop(); toast('Hero image cleared'); };
    var heroUpload = $('#heroUploadFile');
    if (heroUpload) {
      heroUpload.onchange = function () {
        var f = heroUpload.files && heroUpload.files[0];
        if (!f) return;
        var btn = heroUpload.closest('label').querySelector('.btn');
        var prev = btn.textContent;
        btn.textContent = 'Uploading\u2026'; btn.disabled = true;
        uploadImage(f)
          .then(function (url) {
            writeHero(url); saveHeroToServer(url); if (heroUrl) heroUrl.value = url; updateHeroPreview(); refreshShop();
            toast('Hero image updated');
          })
          .catch(function (err) { toast(err.message, 'err'); })
          .finally(function () { btn.textContent = prev; btn.disabled = false; if (heroUpload) heroUpload.value = ''; });
      };
    }
    $('#adminKeyEdit').onclick = function () { $('#adminCodeChangeRow').style.display = ''; };
    $('#adminKeyCancel').onclick = function () { $('#adminCodeChangeRow').style.display = 'none'; $('#adminKeyNew').value = ''; };
    $('#adminKeySave').onclick = function () {
      var newKey = ($('#adminKeyNew').value || '').trim();
      if (!newKey) return toast('Enter a code', 'err');
      setServerKey(newKey)
        .then(function () { state.key = newKey; $('#adminKeyDisplay').value = newKey; toast('Access code updated'); })
        .catch(function (err) { toast(err.message, 'err'); });
    };
    $('#adminForgot').onclick = function () {
      writeAdminKey(null);
      state.key = null;
      logout();
      renderLoggedInStatus(null);
      showLoginForm();
      toast('Enter the new code from your server terminal');
    };
    $('#adminReset').onclick = function () {
      if (!confirm('Reset the catalog to the default shop phones? This replaces what you have saved.')) return;
      seedDefaultCatalog();
      writeHero(null); saveHeroToServer(null);
      resetCatalogCache();
      state.phones = catalog();
      saveCatalogToServer(state.phones);
      refreshShop();
      renderPhonesTab();
      toast('Catalog reset to defaults');
    };
    $('#adminClear').onclick = function () {
      if (!confirm('Remove ALL phones from your catalog? Your shop will be empty until you add phones back.')) return;
      writeCatalog([]);
      saveCatalogToServer([]);
      resetCatalogCache();
      state.phones = [];
      refreshShop();
      renderPhonesTab();
      toast('All phones removed');
    };
  }

  function updateHeroPreview() {
    var preview = $('#heroPreview');
    if (!preview) return;
    var hero = readHero() || ($('#heroUrlInput') ? $('#heroUrlInput').value : '');
    if (hero) {
      preview.innerHTML = (function () {
        var bad = '<div class="admin__img-placeholder">Image did not load — check the URL</div>';
        return '<img src="' + esc(hero) + '" alt="hero preview" onerror="this.parentElement.innerHTML=' + JSON.stringify(bad) + '">';
      })();
    } else {
      preview.innerHTML = '<div class="admin__img-placeholder">Using default hero</div>';
    }
  }

  // ---- promos tab ----
  function renderPromosTab() {
    ensureHelpers();
    var promos = effectivePromos();
    var keys = Object.keys(promos);
    if (!keys.length) {
      $('#adminBody').innerHTML =
        '<div class="admin__empty">' +
          '<h3>No promo codes yet</h3>' +
          '<p>Add a promo code customers can use at checkout.</p>' +
          '<button class="btn btn--accent" id="adminAddPromo">+ Add Promo Code</button>' +
        '</div>';
      $('#adminAddPromo').onclick = startNewPromo;
      return;
    }
    var rows = keys.map(function (code) {
      var p = promos[code];
      var typeLabel = (p.type === 'pct' ? 'Percentage' : p.type === 'flat' ? 'Fixed amount' : 'Free delivery');
      var valueLabel = (p.type === 'pct' ? (p.value || 0) + '%' : p.type === 'ship' ? 'Free delivery' : naira(p.value || 0));
      var extras = [];
      if (p.min && p.min > 0) extras.push('min ' + naira(p.min));
      if (p.cap && p.cap > 0 && p.type !== 'ship') extras.push('max ' + naira(p.cap));
      return '' +
        '<div class="admin__promo-row" data-code="' + code + '">' +
          '<div class="admin__promo-main">' +
            '<div class="admin__promo-code">' + esc(code) + '</div>' +
            '<div class="admin__promo-detail">' + typeLabel + ' \u00b7 ' + valueLabel + (extras.length ? ' \u00b7 ' + extras.join(' \u00b7 ') : '') + '</div>' +
          '</div>' +
          '<div class="admin__promo-actions">' +
            '<button class="btn btn--ghost" data-promo-edit="' + code + '">Edit</button>' +
            '<button class="btn btn--ghost" data-promo-rm="' + code + '">Remove</button>' +
          '</div>' +
        '</div>';
    }).join('');
    $('#adminBody').innerHTML =
      '<div class="admin__toolbar">' +
        '<span class="admin__count"><b>' + keys.length + '</b> promo code' + (keys.length === 1 ? '' : 's') + '</span>' +
        '<button class="btn btn--accent" id="adminAddPromo">+ Add Promo Code</button>' +
      '</div>' +
      '<div class="admin__promos">' + rows + '</div>' +
      '<p class="admin__hint" style="margin-top:14px">Promo codes are case-insensitive. Customers type them at checkout.</p>';
    $('#adminAddPromo').onclick = startNewPromo;
    $$('[data-promo-edit]').forEach(function (b) { b.onclick = function () { startEditPromo(b.dataset.promoEdit); }; });
    $$('[data-promo-rm]').forEach(function (b) {
      b.onclick = function () {
        var code = b.dataset.promoRm;
        var promos2 = effectivePromos();
        delete promos2[code];
        writePromos(promos2);
        savePromosToServer(promos2); // persist to server (best effort)
        renderPromosTab();
        toast('Removed \u201c' + code + '\u201d');
      };
    });
  }

  function startNewPromo() {
    state.editing = { _new: true, code: '', type: 'pct', value: 10, min: 0, cap: 0, label: '10% off' };
    renderPromoEditor();
  }
  function startEditPromo(code) {
    var p = effectivePromos()[code];
    if (!p) { toast('Promo not found', 'err'); return; }
    state.editing = {
      _new: false,
      code: code,
      type: p.type,
      value: (typeof p.value === 'number') ? p.value : 0,
      min: (typeof p.min === 'number') ? p.min : 0,
      cap: (typeof p.cap === 'number') ? p.cap : 0,
      label: p.label || ''
    };
    renderPromoEditor();
  }
  function renderPromoEditor() {
    var e = state.editing;
    if (!e) { showTab('promos'); return; }
    ensureHelpers();
    var types = [
      { value: 'pct', label: 'Percentage off' },
      { value: 'flat', label: 'Fixed amount off' },
      { value: 'ship', label: 'Free delivery' }
    ];
    var typeCards = types.map(function (t) {
      return '<label class="admin__opt-card' + (e.type === t.value ? ' admin__opt-card--on' : '') + '" data-type="' + t.value + '">' +
        '<input type="radio" name="ptype" value="' + t.value + '" ' + (e.type === t.value ? 'checked' : '') + '>' +
        '<span class="admin__opt-card-dot"></span>' + t.label +
      '</label>';
    }).join('');
    $('#adminTitle').textContent = e._new ? 'Add Promo Code' : 'Edit Promo Code';
    $('#adminSub').textContent = 'Creating a code customers type at checkout.';
    $('#adminBody').innerHTML =
      '<div class="admin__editor">' +
        '<div class="admin__section">' +
          '<div class="admin__label">Code <span>Case-insensitive</span></div>' +
          '<input class="admin__input" data-field="code" value="' + esc(e.code) + '" placeholder="e.g. ADE10">' +
        '</div>' +
        '<div class="admin__section">' +
          '<div class="admin__label">Type</div>' +
          '<div class="admin__opts" data-type>' + typeCards + '</div>' +
        '</div>' +
        '<div class="admin__row3">' +
          '<div class="admin__section">' +
            '<div class="admin__label">Value</div>' +
            '<input class="admin__input" data-field="value" value="' + e.value + '" type="number" inputmode="numeric" ' + (e.type === 'ship' ? 'disabled' : '') + '>' +
            '<div class="admin__hint">' + (e.type === 'pct' ? 'Percentage (e.g. 10 = 10%)' : e.type === 'flat' ? 'Amount in Naira' : 'Only used for percentage or fixed-amount promos.') + '</div>' +
          '</div>' +
          '<div class="admin__section">' +
            '<div class="admin__label">Minimum order (optional)</div>' +
            '<input class="admin__input" data-field="min" value="' + (e.min || '') + '" type="number" inputmode="numeric" placeholder="0 = no minimum">' +
          '</div>' +
          '<div class="admin__section">' +
            '<div class="admin__label">Max discount (optional, % promos)</div>' +
            '<input class="admin__input" data-field="cap" value="' + (e.cap || '') + '" type="number" inputmode="numeric" placeholder="0 = no cap">' +
          '</div>' +
        '</div>' +
        '<div class="admin__section">' +
          '<div class="admin__label">Label (what the customer sees)</div>' +
          '<input class="admin__input" data-field="label" value="' + esc(e.label) + '" placeholder="e.g. 10% off">' +
        '</div>' +
        '<div class="admin__editor-actions">' +
          '<button class="btn btn--accent" id="adminSavePromo">Save promo</button>' +
          '<button class="btn btn--ghost" id="adminPromoCancel">Cancel</button>' +
        '</div>' +
      '</div>';
    wirePromoEditor();
  }
  function wirePromoEditor() {
    var e = state.editing;
    if (!e) return;
    $$('.admin__input[data-field]').forEach(function (inp) {
      inp.oninput = function () {
        var k = inp.dataset.field;
        e[k] = (inp.type === 'number') ? (inp.value === '' ? 0 : Number(inp.value)) : inp.value;
      };
    });
    $$('[data-type] label').forEach(function (lbl) {
      lbl.onclick = function () {
        e.type = lbl.dataset.type;
        renderPromoEditor();
      };
    });
    $('#adminSavePromo').onclick = function () {
      var code = (e.code || '').trim();
      if (!code) return toast('Enter a promo code', 'err');
      if ((e.label || '').trim() === '') return toast('Enter a label', 'err');
      if (e.type !== 'ship' && (!e.value || e.value <= 0)) return toast('Enter a value', 'err');
      var promos = effectivePromos();
      promos[code.toUpperCase()] = {
        type: e.type,
        value: (e.type === 'ship') ? 0 : (Number(e.value) || 0),
        min: (e.type === 'ship') ? 0 : (Number(e.min) || 0),
        cap: (e.type === 'ship') ? 0 : (Number(e.cap) || 0),
        label: e.label
      };
      writePromos(promos);
      savePromosToServer(promos); // persist to server (best effort)
      toast(e._new ? ('Created \u201c' + code + '\u201d') : ('Updated \u201c' + code + '\u201d'));
      state.editing = null;
      renderPromosTab();
    };
    $('#adminPromoCancel').onclick = function () { state.editing = null; renderPromosTab(); };
  }

  // ---- shop refresh (called from app.js window.refreshShop too) ----
  function refreshShop() {
    resetCatalogCache();
    try {
      var h = localStorage.getItem(LS_HERO);
      var heroImg = document.getElementById('heroImg');
      if (h && heroImg) heroImg.src = h;
    } catch (e) { /* ignore */ }
    if (typeof window.refreshShop === 'function') window.refreshShop();
  }

  // ---- lock helper ----
  function syncLock() {
    if (typeof document === 'undefined') return;
    var n = 0;
    $$('.drawer.on').forEach(function () { n++; });
    $$('.modal.on').forEach(function () { n++; });
    document.body.classList.toggle('locked', n > 0);
  }

  // ---- export / import ----
  function exportCatalog() {
    var phones = catalog();
    var json = JSON.stringify({ v: 2, phones: phones }, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'ades-gadget-catalog.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).then(function () { toast('Catalog exported & copied'); })
        .catch(function () { toast('Catalog exported'); });
    } else {
      toast('Catalog exported');
    }
  }

  // ---- keyboard ----
  function onKey(e) {
    var modal = $('#adminModal');
    if (!modal || modal.classList.contains('on') === false) return;
    if (e.key === 'Escape') {
      if (state.editing) {
        if (!confirm('Discard unsaved changes?')) return;
      }
      close();
    }
  }

  // ---- init ----
  function init() {
    ensureHelpers();
    var modal = $('#adminModal');
    if (!modal) return;
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        if (state.editing && !confirm('Discard unsaved changes?')) return;
        close();
      }
    });
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-close-admin]');
      if (t) {
        if (state.editing && !confirm('Discard unsaved changes?')) return;
        close();
      }
      var tab = e.target.closest('[data-tab]');
      if (tab) showTab(tab.dataset.tab);
      var at = e.target.closest('#adminToggle');
      if (at) { if (state.editing && !confirm('Discard unsaved changes?')) return; open(); }
      var al = e.target.closest('#adminLink');
      if (al) { e.preventDefault(); if (state.editing && !confirm('Discard unsaved changes?')) return; open(); }
      var af = e.target.closest('#adminForgot');
      if (af) { writeAdminKey(null); state.key = null; showUnlock(); toast('Enter the new code from your server terminal'); }
    });
    // legacy code unlock (fallback)
    var uk = $('#adminUnlockBtn');
    if (uk) uk.onclick = function () {
      var code = ($('#adminKeyInput').value || '').trim();
      if (!code) return toast('Enter the admin code', 'err');
      writeAdminKey(code);
      state.key = code;
      state.sessionEmail = null;
      writeSessionEmail(null);
      state._catalogCache = null;
      showTab('phones');
      toast('Catalog Manager unlocked with access code');
    };
    var uki = $('#adminKeyInput');
    if (uki) uki.addEventListener('keydown', function (e) { if (e.key === 'Enter') uk.click(); });

    // email/password sign-in
    var signInBtn = $('#adminSignInBtn');
    if (signInBtn) signInBtn.onclick = function () { doSignIn(); };
    var emailInput = $('#adminEmailInput');
    var passInput = $('#adminPassInput');
    if (emailInput) emailInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); if (passInput) passInput.focus(); } });
    if (passInput) passInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); doSignIn(); } });
    var fallbackBtn = $('#adminFallbackCodeBtn');
    if (fallbackBtn) fallbackBtn.onclick = function () {
      $('#adminLoginForm').style.display = 'none';
      $('#adminCodeForm').style.display = '';
      toast('Enter the code from your server terminal', 'info');
    };
    var logOutBtn = $('#adminLogoutBtn');
    if (logOutBtn) logOutBtn.onclick = function () {
      logout();
      state.sessionEmail = null;
      writeSessionEmail(null);
      state._catalogCache = null;
      renderLoggedInStatus();
      showLoginForm();
      toast('Signed out');
    };
    // expose a global logout so the rendered bar can call it
    window.Admin.signOut = function () {
      logout();
      state.sessionEmail = null;
      writeSessionEmail(null);
      state._catalogCache = null;
      renderLoggedInStatus();
      showLoginForm();
      toast('Signed out');
    };

    // if a session email is already stored, try to resume
    if (state.sessionEmail) {
      // verify the session is still valid with the server
      apiGet('/admin-api/me').then(function (resp) {
        if (resp && resp.ok && resp.email) {
          state.sessionEmail = resp.email;
          writeSessionEmail(resp.email);
          state.key = null;
          state._catalogCache = null;
          showLoggedIn(resp.email);
        } else {
          writeSessionEmail(null);
          state.sessionEmail = null;
          showLoginForm();
        }
      }).catch(function () {
        // server unreachable — fall back to legacy code if we have one
        if (state.key) showTab('phones');
        else showLoginForm();
      });
    } else if (state.key) {
      showTab('phones');
    } else {
      showLoginForm();
    }
    var saveBtn = $('#adminSave');
    if (saveBtn) saveBtn.onclick = function () {
      if (state.editing) { if (!confirm('Save current phone and return to the catalog?')) return; savePhone(); }
      renderPhonesTab();
    };
    var exportBtn = $('#adminExport');
    if (exportBtn) exportBtn.onclick = exportCatalog;
    document.addEventListener('keydown', onKey);

    // if modal is already open (e.g. toggled before ready), refresh
    if (modal.classList.contains('on')) {
      if (state.key) showTab(state.tab || 'phones');
      else showUnlock();
    }
  }

  // expose
  window.Admin = window.Admin || {};
  window.Admin.open = open;
  window.Admin.close = close;
  window.Admin.refreshShop = refreshShop;
  window.Admin.catalog = catalog;
  window.Admin.uploadImage = uploadImage;
  window.Admin.setServerKey = setServerKey;
  window.Admin.adminKey = readAdminKey;
  window.Admin.restoreCatalog = function (paste) {
    try {
      var d = JSON.parse(paste);
      if (!d || !Array.isArray(d.phones)) throw new Error('Not a valid catalog file.');
      writeCatalog(d.phones);
      resetCatalogCache();
      state.phones = d.phones;
      refreshShop();
      renderPhonesTab();
      var isNew = false;
      for (var i = 0; i < d.phones.length; i++) {
        if (!d.phones[i].id || d.phones[i].id.indexOf('ph_') !== 0) { isNew = true; break; }
      }
      toast(isNew ? 'Catalog imported \u2014 phones added' : 'Catalog restored from file');
    } catch (err) { toast('That didn\u2019t look like a catalog file: ' + (err.message || err), 'err'); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
