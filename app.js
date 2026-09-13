const STORAGE_KEY = 'packing-list-state-v1';
const config = window.PACKING_LIST_CONFIG || {};

const BAG_LABELS = {
  suitcase: 'スーツケース',
  backpack: 'バックパック',
  optional: '行先別'
};

const DEFAULT_ITEMS = [
  ['パスポート', '貴重品・当日', 'backpack', false],
  ['グリーンカード', '貴重品・当日', 'backpack', false],
  ['日本円財布', '貴重品・当日', 'backpack', false],
  ['日本の銀行カード', '貴重品・当日', 'backpack', false],
  ['AMEX Green Card', '貴重品・当日', 'backpack', false],
  ['Marriott Card', '貴重品・当日', 'backpack', false],
  ['社員証', '貴重品・当日', 'backpack', false],
  ['財布', '貴重品・当日', 'backpack', false],
  ['時計 ×2', '貴重品・当日', 'backpack', false],
  ['白のiPhone 17', '貴重品・当日', 'backpack', false],
  ['家の鍵', '貴重品・当日', 'backpack', false],
  ['スマホ充電器', '電化製品', 'backpack', false],
  ['MacBook', '電化製品', 'backpack', false],
  ['MacBook充電器', '電化製品', 'backpack', false],
  ['電源延長ケーブル', '電化製品', 'suitcase', false],
  ['B&W Px8（Tan）', '電化製品', 'backpack', false],
  ['スマホ用ポータブルバッテリー', '電化製品', 'backpack', false],
  ['Oura Ring充電器', '電化製品', 'backpack', false],
  ['Apple Watch充電器', '電化製品', 'backpack', false],
  ['髭剃り', '衛生用品', 'suitcase', false],
  ['フロス', '衛生用品', 'suitcase', false],
  ['ヘアバンド', '衛生用品', 'suitcase', false],
  ['化粧水・洗顔料', '衛生用品', 'suitcase', false],
  ['薬', '衛生用品', 'suitcase', false],
  ['ビタミン剤', '衛生用品', 'suitcase', false],
  ['リップ', '衛生用品', 'backpack', false],
  ['睡眠薬', '衛生用品', 'suitcase', false],
  ['目薬', '衛生用品', 'backpack', false],
  ['歯ブラシ・舌ブラシ', '衛生用品', 'suitcase', false],
  ['Philips 電動歯ブラシ', '衛生用品', 'suitcase', false],
  ['ハンドクリーム', '衛生用品', 'suitcase', false],
  ['日焼け止め', '衛生用品', 'suitcase', false],
  ['注射', '衛生用品', 'suitcase', false],
  ['着替え', '衣類', 'suitcase', false],
  ['パジャマ', '衣類', 'suitcase', false],
  ['ジムウェア・シューズ', '衣類', 'suitcase', false],
  ['飛行機・ホテル用スリッパ', '衣類', 'suitcase', false],
  ['黒の縦型ボディバッグ', 'その他', 'backpack', false],
  ['傘', 'その他', 'suitcase', false],
  ['おやつ', 'その他', 'backpack', false],
  ['ハサミ', 'その他', 'suitcase', false],
  ['ハンディスケール', 'その他', 'suitcase', false],
  ['本', 'その他', 'backpack', false],
  ['エクストラバッグ', 'その他', 'suitcase', false],
  ['予備携帯', 'その他', 'backpack', false],
  ['白いペンライト ×2', 'その他', 'suitcase', false],
  ['サングラス', '車・移動', 'backpack', false],
  ['カリフォルニア運転免許証', '車・移動', 'backpack', false],
  ['メガネ', '車・移動', 'backpack', false],
  ['双眼鏡', '車・移動', 'backpack', false],
  ['お土産', '車・移動', 'suitcase', false],
  ['クロックス', '行先によって', 'optional', true],
  ['手袋', '行先によって', 'optional', true],
  ['ベルト・カフス', '行先によって', 'optional', true],
  ['コーヒーセット', '行先によって', 'optional', true],
  ['iPad', '行先によって', 'optional', true],
  ['スマホホルダー', '行先によって', 'optional', true]
].map(([name, category, bag, isOptional], index) => ({
  id: crypto.randomUUID(),
  name,
  category,
  bag,
  isOptional,
  active: true,
  sortOrder: index + 1
}));

const demoTripId = crypto.randomUUID();
const defaultState = () => ({
  masterItems: structuredClone(DEFAULT_ITEMS),
  trips: [{
    id: demoTripId,
    name: 'ニューヨーク',
    startDate: '2026-09-18',
    endDate: '2026-09-22',
    status: 'preparing',
    createdAt: new Date().toISOString()
  }],
  tripItems: DEFAULT_ITEMS.filter(item => !item.isOptional).map((item, index) => ({
    id: crypto.randomUUID(),
    tripId: demoTripId,
    masterItemId: item.id,
    name: item.name,
    category: item.category,
    bag: item.bag,
    isOptional: item.isOptional,
    sortOrder: item.sortOrder,
    checked: index < 4
  })),
  activeTripId: demoTripId
});

const loadLocal = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.masterItems && saved?.trips && saved?.tripItems ? saved : defaultState();
  } catch {
    return defaultState();
  }
};

const data = loadLocal();
const ui = {
  view: 'packing',
  filter: 'all',
  uncheckedOnly: false,
  menuTripId: null,
  editingTripId: null,
  editingItemId: null,
  cloud: false,
  syncText: '端末内に保存',
  syncWarn: false,
  user: null,
  showInactive: false
};

let supabase = null;
const app = document.getElementById('app');

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const saveLocal = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
const currentTrip = () => data.trips.find(trip => trip.id === data.activeTripId) || null;
const itemsForTrip = tripId => data.tripItems.filter(item => item.tripId === tripId);
const activeMasterItems = () => data.masterItems.filter(item => item.active).sort((a, b) => a.sortOrder - b.sortOrder);

const formatDate = value => {
  if (!value) return '日程未設定';
  const [year, month, day] = value.split('-').map(Number);
  return `${year}年${month}月${day}日`;
};

const formatRange = (start, end) => {
  if (!start || !end) return '日程未設定';
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  return sy === ey
    ? `${sy}年${sm}月${sd}日〜${em}月${ed}日`
    : `${formatDate(start)}〜${formatDate(end)}`;
};

const tripProgress = tripId => {
  const items = itemsForTrip(tripId);
  const checked = items.filter(item => item.checked).length;
  return { total: items.length, checked, percent: items.length ? Math.round(checked / items.length * 100) : 0 };
};

const showToast = message => {
  const toast = document.querySelector('.toast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 2400);
};

const cloudRow = {
  master: item => ({
    id: item.id,
    user_id: ui.user?.id || null,
    name: item.name,
    category: item.category,
    bag: item.bag,
    is_optional: item.isOptional,
    is_active: item.active,
    sort_order: item.sortOrder
  }),
  trip: trip => ({
    id: trip.id,
    user_id: ui.user?.id || null,
    name: trip.name,
    start_date: trip.startDate || null,
    end_date: trip.endDate || null,
    status: trip.status
  }),
  tripItem: item => ({
    id: item.id,
    trip_id: item.tripId,
    master_item_id: item.masterItemId || null,
    name: item.name,
    category: item.category,
    bag: item.bag,
    is_optional: item.isOptional,
    sort_order: item.sortOrder,
    checked: item.checked
  })
};

const QUEUE_KEY = 'packing-list-queue-v1';
const TABLE_LOOKUP = {
  master_items: id => data.masterItems.find(candidate => candidate.id === id),
  trips: id => data.trips.find(candidate => candidate.id === id),
  trip_items: id => data.tripItems.find(candidate => candidate.id === id)
};
const TABLE_ROW = { master_items: cloudRow.master, trips: cloudRow.trip, trip_items: cloudRow.tripItem };

const loadQueue = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(QUEUE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

let queue = loadQueue();
let flushing = false;
const saveQueue = () => localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

// Keeping only the latest pending operation per row means the queue always
// converges on current state instead of replaying a history of edits.
const enqueue = (table, op, id) => {
  queue = queue.filter(entry => !(entry.table === table && entry.id === id));
  queue.push({ table, op, id });
  saveQueue();
};

const flushQueue = async () => {
  if (flushing || !supabase || !ui.user || !navigator.onLine || queue.length === 0) return;
  flushing = true;
  ui.syncText = '同期中…';
  ui.syncWarn = false;
  render();
  while (queue.length > 0) {
    const entry = queue[0];
    let error = null;
    if (entry.op === 'delete') {
      ({ error } = await supabase.from(entry.table).delete().eq('id', entry.id));
    } else {
      const row = TABLE_LOOKUP[entry.table](entry.id);
      if (!row) {
        queue.shift();
        saveQueue();
        continue;
      }
      ({ error } = await supabase.from(entry.table).upsert(TABLE_ROW[entry.table](row)));
    }
    if (error) break;
    queue.shift();
    saveQueue();
  }
  // A leftover queue while online (not just "haven't reconnected yet") means the
  // request itself failed server-side — e.g. a paused Supabase project — which
  // looks identical to being offline unless we check navigator.onLine here.
  if (queue.length && navigator.onLine) {
    ui.syncText = '⚠ クラウド同期エラー・端末には保存済み（データベースが停止中の可能性）';
    ui.syncWarn = true;
  } else if (queue.length) {
    ui.syncText = '端末に保存・オフライン中';
    ui.syncWarn = false;
  } else {
    ui.syncText = 'クラウドに保存済み';
    ui.syncWarn = false;
  }
  flushing = false;
  render();
};

const persistAndQueue = (table, ids) => {
  saveLocal();
  (Array.isArray(ids) ? ids : [ids]).forEach(id => enqueue(table, 'upsert', id));
  render();
  flushQueue();
};

const persistAndQueueDelete = (table, id) => {
  saveLocal();
  enqueue(table, 'delete', id);
  render();
  flushQueue();
};

const authScreen = () => `
  <section class="auth">
    <div class="auth-panel">
      <div class="auth-emoji" aria-hidden="true">🧳</div>
      <h1>パッキングリスト</h1>
      <p>PCとスマホで持ち物を同期します。</p>
      <button class="primary" type="button" data-action="sign-in">GitHubでログイン</button>
      <div class="demo-note">ログイン後、自分のデータだけを表示します。</div>
    </div>
  </section>`;

const packingScreen = () => {
  const trip = currentTrip();
  if (!trip) {
    return `
      <section class="screen">
        <header class="hero"><div class="eyebrow">PACKING</div><h1 class="app-title">パッキングリスト 🧳</h1></header>
        <div class="empty">旅行・出張がまだありません。<br><button class="primary" type="button" data-action="go-trips">旅行・出張一覧へ</button></div>
      </section>`;
  }

  const progress = tripProgress(trip.id);
  const visible = itemsForTrip(trip.id)
    .filter(item => (ui.filter === 'all' || item.bag === ui.filter) && (!ui.uncheckedOnly || !item.checked));
  const groups = [];
  visible.forEach(item => {
    const key = `${item.bag}|${item.category}`;
    let group = groups.find(candidate => candidate.key === key);
    if (!group) {
      group = { key, bag: item.bag, category: item.category, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  });

  const listHtml = groups.length ? groups.map(group => `
    <section class="group">
      <h2 class="group-heading" data-bag="${group.bag}">${escapeHtml(group.category)} · ${BAG_LABELS[group.bag]}</h2>
      ${group.items.sort((a, b) => Number(a.checked) - Number(b.checked) || a.sortOrder - b.sortOrder).map(item => `
        <label class="check-row ${item.checked ? 'done' : ''}">
          <input type="checkbox" data-action="toggle-check" data-id="${item.id}" ${item.checked ? 'checked' : ''}>
          <span class="check-name">${escapeHtml(item.name)}</span>
          <span class="bag-chip">${BAG_LABELS[item.bag]}</span>
        </label>`).join('')}
    </section>`).join('') : '<div class="empty">この表示の未確認項目はありません ✓</div>';

  return `
    <section class="screen">
      <header class="hero">
        <div class="eyebrow">PACKING</div>
        <h1 class="app-title">パッキングリスト 🧳</h1>
        <div class="trip-title">${escapeHtml(trip.name)}</div>
        <div class="trip-dates">📅 <span>${formatRange(trip.startDate, trip.endDate)}</span></div>
        <div class="progress-wrap">
          <div class="progress-value">${progress.percent}<small>%</small></div>
          <div><div class="progress-track" role="progressbar" aria-valuenow="${progress.percent}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width:${progress.percent}%"></div></div><div class="progress-label">${progress.checked} / ${progress.total} 準備済み</div></div>
        </div>
      </header>
      <nav class="tabs" aria-label="持ち物の表示切り替え">
        ${[['all','すべて'],['suitcase','スーツケース'],['backpack','バックパック'],['optional','行先別']].map(([value, label]) => `<button class="tab ${ui.filter === value ? 'active' : ''}" type="button" data-action="filter" data-filter="${value}">${label}</button>`).join('')}
      </nav>
      <div class="toolbar">
        <label class="switch"><input type="checkbox" data-action="unchecked-only" ${ui.uncheckedOnly ? 'checked' : ''}>未確認だけ表示</label>
        <span class="sync-state ${ui.syncWarn ? 'warn' : ''}">${ui.syncText}</span>
      </div>
      <div class="checklist">${listHtml}</div>
    </section>`;
};

const tripsScreen = () => {
  const sortedTrips = [...data.trips].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'preparing' ? -1 : 1;
    return (a.startDate || '').localeCompare(b.startDate || '');
  });
  return `
    <section class="screen">
      <header class="page-head">
        <div><div class="eyebrow">PACKING</div><h1>旅行・出張一覧</h1><p class="page-subtitle">行を押すとパッキングリストを開きます</p></div>
        <button class="primary" type="button" data-action="new-trip">＋ 新規作成</button>
      </header>
      <div class="section-actions"><button class="secondary" type="button" data-action="manage-items">基本リスト管理</button>${ui.cloud ? '<button class="ghost" type="button" data-action="sign-out">ログアウト</button>' : ''}</div>
      <div class="trip-list">
        ${sortedTrips.length ? sortedTrips.map(trip => {
          const progress = tripProgress(trip.id);
          const done = progress.total > 0 && progress.checked === progress.total;
          return `<article class="trip-card">
            <button class="trip-open" type="button" data-action="open-trip" data-id="${trip.id}">
              <div class="trip-copy"><div class="trip-name">${escapeHtml(trip.name)}</div><div class="trip-meta">${formatRange(trip.startDate, trip.endDate)} · ${progress.checked} / ${progress.total}</div></div>
              <span class="status">${done ? '完了' : '準備中'}</span>
            </button>
            <button class="more" type="button" data-action="trip-menu" data-id="${trip.id}" aria-label="${escapeHtml(trip.name)}のメニュー">•••</button>
            <div class="menu" ${ui.menuTripId === trip.id ? '' : 'hidden'}>
              <button type="button" data-action="edit-trip" data-id="${trip.id}">✎ 名前と日程を編集</button>
              <button class="danger" type="button" data-action="delete-trip" data-id="${trip.id}">削除</button>
            </div>
          </article>`;
        }).join('') : '<div class="empty">旅行・出張がまだありません。</div>'}
      </div>
    </section>`;
};

const tripFormScreen = () => {
  const trip = data.trips.find(candidate => candidate.id === ui.editingTripId);
  const existingOptionalIds = new Set(trip ? itemsForTrip(trip.id).filter(item => item.isOptional).map(item => item.masterItemId) : []);
  const optionalItems = activeMasterItems().filter(item => item.isOptional);
  return `
    <section class="screen form-page">
      <h1>${trip ? '旅行・出張を編集' : '新しい旅行・出張'}</h1>
      <p class="form-copy">行き先と日程を設定します。</p>
      <form id="trip-form">
        <label class="field">行き先・名前<input name="name" required autocomplete="off" value="${escapeHtml(trip?.name || '')}" placeholder="例：ニューヨーク"></label>
        <div class="date-grid">
          <label class="field">出発日<input name="startDate" type="date" required value="${trip?.startDate || ''}"></label>
          <label class="field">帰宅日<input name="endDate" type="date" required value="${trip?.endDate || ''}"></label>
        </div>
        <div class="optional-box">
          <h2>行先によって持っていくもの</h2>
          <p>この旅行に必要なものだけ選択します。</p>
          ${optionalItems.map(item => `<label class="optional-choice"><input type="checkbox" name="optional" value="${item.id}" ${existingOptionalIds.has(item.id) ? 'checked' : ''}>${escapeHtml(item.name)}</label>`).join('')}
        </div>
        <div class="form-actions"><button class="secondary" type="button" data-action="cancel-form">キャンセル</button><button class="primary" type="submit">${trip ? '保存する' : '作成する'}</button></div>
      </form>
    </section>`;
};

const manageScreen = () => {
  const visibleItems = [...data.masterItems]
    .filter(item => ui.showInactive || item.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return `
    <section class="screen">
      <header class="page-head"><div><h1>基本リスト管理</h1><p class="page-subtitle">今後作成する旅行に使われます</p></div><button class="primary" type="button" data-action="new-item">＋ 追加</button></header>
      <div class="section-actions"><button class="secondary" type="button" data-action="back-trips">旅行・出張一覧へ</button><label class="switch"><input type="checkbox" data-action="show-inactive" ${ui.showInactive ? 'checked' : ''}>使用停止も表示</label></div>
      <div class="manage-list">
        ${visibleItems.map(item => `<div class="manage-row">
          <div><div class="manage-name">${escapeHtml(item.name)}${item.active ? '' : '（使用停止）'}</div><div class="manage-meta">${escapeHtml(item.category)} · ${BAG_LABELS[item.bag]}</div></div>
          <div class="manage-actions"><button type="button" data-action="move-up" data-id="${item.id}" aria-label="上へ">↑</button><button type="button" data-action="move-down" data-id="${item.id}" aria-label="下へ">↓</button><button type="button" data-action="edit-item" data-id="${item.id}" aria-label="編集">✎</button></div>
        </div>`).join('')}
      </div>
    </section>`;
};

const itemFormScreen = () => {
  const item = data.masterItems.find(candidate => candidate.id === ui.editingItemId);
  return `
    <section class="screen form-page">
      <h1>${item ? '持ち物を編集' : '持ち物を追加'}</h1>
      <p class="form-copy">コードを変更せず、ここから基本リストを管理できます。</p>
      <form id="item-form">
        <label class="field">持ち物の名前<input name="name" required autocomplete="off" value="${escapeHtml(item?.name || '')}"></label>
        <label class="field">カテゴリー<input name="category" required autocomplete="off" value="${escapeHtml(item?.category || 'その他')}"></label>
        <label class="field">入れる場所<select name="bag"><option value="suitcase" ${item?.bag === 'suitcase' ? 'selected' : ''}>スーツケース</option><option value="backpack" ${item?.bag === 'backpack' ? 'selected' : ''}>バックパック</option><option value="optional" ${item?.bag === 'optional' ? 'selected' : ''}>行先別</option></select></label>
        <label class="optional-choice"><input type="checkbox" name="isOptional" ${item?.isOptional ? 'checked' : ''}>旅行ごとに選択する</label>
        ${item ? '<label class="optional-choice"><input type="checkbox" name="applyPreparing">準備中の旅行にも名称・分類を反映</label>' : ''}
        <div class="form-actions">${item ? `<button class="danger-button" type="button" data-action="archive-item" data-id="${item.id}">${item.active ? '使用停止' : '使用を再開'}</button>` : ''}<button class="secondary" type="button" data-action="cancel-item">キャンセル</button><button class="primary" type="submit">保存する</button></div>
      </form>
    </section>`;
};

const bottomNav = () => `
  <nav class="bottom-nav" aria-label="メインメニュー">
    <button class="nav-button ${ui.view === 'packing' ? 'active' : ''}" type="button" data-action="nav-packing"><span aria-hidden="true">✓</span>持ち物</button>
    <button class="nav-button ${['trips','trip-form','manage','item-form'].includes(ui.view) ? 'active' : ''}" type="button" data-action="nav-trips"><span aria-hidden="true">⌖</span>旅行・出張</button>
  </nav>`;

const render = () => {
  if (ui.cloud && !ui.user) {
    app.innerHTML = authScreen();
    return;
  }
  const screens = {
    packing: packingScreen,
    trips: tripsScreen,
    'trip-form': tripFormScreen,
    manage: manageScreen,
    'item-form': itemFormScreen
  };
  app.innerHTML = `<div class="shell">${screens[ui.view]()}${bottomNav()}<div class="toast" hidden></div></div>`;
};

const updateTripStatus = tripId => {
  const trip = data.trips.find(candidate => candidate.id === tripId);
  const progress = tripProgress(tripId);
  if (trip) trip.status = progress.total > 0 && progress.checked === progress.total ? 'completed' : 'preparing';
};

const createTripItems = (tripId, optionalIds) => activeMasterItems()
  .filter(item => !item.isOptional || optionalIds.includes(item.id))
  .map(item => ({
    id: crypto.randomUUID(), tripId, masterItemId: item.id, name: item.name,
    category: item.category, bag: item.bag, isOptional: item.isOptional,
    sortOrder: item.sortOrder, checked: false
  }));

const handleTripSubmit = async form => {
  const formData = new FormData(form);
  const name = formData.get('name').trim();
  const startDate = formData.get('startDate');
  const endDate = formData.get('endDate');
  if (endDate < startDate) {
    showToast('帰宅日は出発日以降にしてください。');
    return;
  }
  const optionalIds = formData.getAll('optional');
  let trip = data.trips.find(candidate => candidate.id === ui.editingTripId);
  if (trip) {
    Object.assign(trip, { name, startDate, endDate });
    const existing = itemsForTrip(trip.id);
    const selected = new Set(optionalIds);
    const removedOptionalIds = existing.filter(item => item.isOptional && !selected.has(item.masterItemId)).map(item => item.id);
    data.tripItems = data.tripItems.filter(item => item.tripId !== trip.id || !item.isOptional || selected.has(item.masterItemId));
    const existingMasterIds = new Set(existing.map(item => item.masterItemId));
    const additions = activeMasterItems().filter(item => item.isOptional && selected.has(item.id) && !existingMasterIds.has(item.id));
    data.tripItems.push(...additions.map(item => ({ id: crypto.randomUUID(), tripId: trip.id, masterItemId: item.id, name: item.name, category: item.category, bag: item.bag, isOptional: true, sortOrder: item.sortOrder, checked: false })));
    persistAndQueue('trips', trip.id);
    persistAndQueue('trip_items', itemsForTrip(trip.id).map(tripItem => tripItem.id));
    removedOptionalIds.forEach(itemId => enqueue('trip_items', 'delete', itemId));
    flushQueue();
  } else {
    trip = { id: crypto.randomUUID(), name, startDate, endDate, status: 'preparing', createdAt: new Date().toISOString() };
    const tripItems = createTripItems(trip.id, optionalIds);
    data.trips.push(trip);
    data.tripItems.push(...tripItems);
    data.activeTripId = trip.id;
    persistAndQueue('trips', trip.id);
    persistAndQueue('trip_items', tripItems.map(tripItem => tripItem.id));
  }
  ui.view = 'packing';
  ui.editingTripId = null;
  render();
};

const handleItemSubmit = async form => {
  const formData = new FormData(form);
  let item = data.masterItems.find(candidate => candidate.id === ui.editingItemId);
  const values = {
    name: formData.get('name').trim(),
    category: formData.get('category').trim(),
    bag: formData.get('bag'),
    isOptional: formData.get('isOptional') === 'on'
  };
  if (values.bag === 'optional') values.isOptional = true;
  if (values.isOptional) values.bag = 'optional';
  if (item) {
    Object.assign(item, values);
    if (formData.get('applyPreparing') === 'on') {
      data.tripItems.filter(tripItem => tripItem.masterItemId === item.id && !tripItem.checked).forEach(tripItem => Object.assign(tripItem, values));
      persistAndQueue('trip_items', data.tripItems.filter(tripItem => tripItem.masterItemId === item.id).map(tripItem => tripItem.id));
    }
  } else {
    item = { id: crypto.randomUUID(), ...values, active: true, sortOrder: Math.max(0, ...data.masterItems.map(candidate => candidate.sortOrder)) + 1 };
    data.masterItems.push(item);
  }
  persistAndQueue('master_items', item.id);
  ui.view = 'manage';
  ui.editingItemId = null;
  render();
};

app.addEventListener('submit', event => {
  event.preventDefault();
  if (event.target.id === 'trip-form') handleTripSubmit(event.target);
  if (event.target.id === 'item-form') handleItemSubmit(event.target);
});

app.addEventListener('change', async event => {
  const action = event.target.dataset.action;
  if (action === 'toggle-check') {
    const item = data.tripItems.find(candidate => candidate.id === event.target.dataset.id);
    item.checked = event.target.checked;
    updateTripStatus(item.tripId);
    const trip = data.trips.find(candidate => candidate.id === item.tripId);
    persistAndQueue('trip_items', item.id);
    persistAndQueue('trips', trip.id);
  }
  if (action === 'unchecked-only') {
    ui.uncheckedOnly = event.target.checked;
    render();
  }
  if (action === 'show-inactive') {
    ui.showInactive = event.target.checked;
    render();
  }
});

app.addEventListener('click', async event => {
  const target = event.target.closest('[data-action]');
  if (!target) {
    if (ui.menuTripId) { ui.menuTripId = null; render(); }
    return;
  }
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (action === 'filter') { ui.filter = target.dataset.filter; render(); }
  if (action === 'nav-packing') { ui.view = 'packing'; render(); }
  if (action === 'nav-trips' || action === 'go-trips' || action === 'back-trips') { ui.view = 'trips'; ui.menuTripId = null; render(); }
  if (action === 'open-trip') { data.activeTripId = id; ui.view = 'packing'; ui.menuTripId = null; saveLocal(); render(); }
  if (action === 'trip-menu') { ui.menuTripId = ui.menuTripId === id ? null : id; render(); }
  if (action === 'new-trip') { ui.editingTripId = null; ui.view = 'trip-form'; render(); }
  if (action === 'edit-trip') { ui.editingTripId = id; ui.menuTripId = null; ui.view = 'trip-form'; render(); }
  if (action === 'cancel-form') { ui.editingTripId = null; ui.view = 'trips'; render(); }
  if (action === 'delete-trip') {
    const trip = data.trips.find(candidate => candidate.id === id);
    if (trip && confirm(`「${trip.name}」を削除しますか？`)) {
      data.trips = data.trips.filter(candidate => candidate.id !== id);
      data.tripItems = data.tripItems.filter(item => item.tripId !== id);
      if (data.activeTripId === id) data.activeTripId = data.trips[0]?.id || null;
      ui.menuTripId = null;
      persistAndQueueDelete('trips', id);
    }
  }
  if (action === 'manage-items') { ui.view = 'manage'; render(); }
  if (action === 'new-item') { ui.editingItemId = null; ui.view = 'item-form'; render(); }
  if (action === 'edit-item') { ui.editingItemId = id; ui.view = 'item-form'; render(); }
  if (action === 'cancel-item') { ui.editingItemId = null; ui.view = 'manage'; render(); }
  if (action === 'archive-item') {
    const item = data.masterItems.find(candidate => candidate.id === id);
    item.active = !item.active;
    persistAndQueue('master_items', item.id);
    ui.view = 'manage';
    ui.editingItemId = null;
    render();
  }
  if (action === 'move-up' || action === 'move-down') {
    const ordered = activeMasterItems();
    const index = ordered.findIndex(item => item.id === id);
    const otherIndex = action === 'move-up' ? index - 1 : index + 1;
    if (index >= 0 && otherIndex >= 0 && otherIndex < ordered.length) {
      [ordered[index].sortOrder, ordered[otherIndex].sortOrder] = [ordered[otherIndex].sortOrder, ordered[index].sortOrder];
      persistAndQueue('master_items', [ordered[index].id, ordered[otherIndex].id]);
    }
  }
  if (action === 'sign-in' && supabase) {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: location.href.split('#')[0] } });
    if (error) alert('ログインに失敗しました。データベースが停止中か、通信状況をご確認ください。');
  }
  if (action === 'sign-out' && supabase) {
    await supabase.auth.signOut();
    ui.user = null;
    render();
  }
});

const loadCloudData = async () => {
  await flushQueue();
  const [masterResult, tripsResult, tripItemsResult] = await Promise.all([
    supabase.from('master_items').select('*').order('sort_order'),
    supabase.from('trips').select('*').order('start_date'),
    supabase.from('trip_items').select('*').order('sort_order')
  ]);
  if ([masterResult, tripsResult, tripItemsResult].some(result => result.error)) {
    // Same ambiguity as flushQueue: only call this a real problem (vs. just
    // being offline) when the browser itself reports a live connection.
    if (navigator.onLine) {
      ui.syncText = '⚠ クラウド接続に失敗・端末データを表示中（データベースが停止中の可能性）';
      ui.syncWarn = true;
    } else {
      ui.syncText = '端末データを表示・オフライン中';
      ui.syncWarn = false;
    }
    return;
  }
  if (masterResult.data.length === 0) {
    const seedRows = structuredClone(DEFAULT_ITEMS);
    // onConflict + ignoreDuplicates guards against two devices both seeding
    // the default list the moment the same brand-new account first logs in;
    // re-select afterwards so both devices converge on whichever rows won.
    await supabase.from('master_items').upsert(seedRows.map(cloudRow.master), { onConflict: 'user_id,name', ignoreDuplicates: true });
    const { data: freshMaster } = await supabase.from('master_items').select('*').order('sort_order');
    data.masterItems = freshMaster?.length
      ? freshMaster.map(row => ({ id: row.id, name: row.name, category: row.category, bag: row.bag, isOptional: row.is_optional, active: row.is_active, sortOrder: row.sort_order }))
      : seedRows;
  } else {
    data.masterItems = masterResult.data.map(row => ({ id: row.id, name: row.name, category: row.category, bag: row.bag, isOptional: row.is_optional, active: row.is_active, sortOrder: row.sort_order }));
  }
  data.trips = tripsResult.data.map(row => ({ id: row.id, name: row.name, startDate: row.start_date || '', endDate: row.end_date || '', status: row.status, createdAt: row.created_at }));
  data.tripItems = tripItemsResult.data.map(row => ({ id: row.id, tripId: row.trip_id, masterItemId: row.master_item_id, name: row.name, category: row.category, bag: row.bag, isOptional: row.is_optional, sortOrder: row.sort_order, checked: row.checked }));
  data.activeTripId = data.trips.find(trip => trip.id === data.activeTripId)?.id || data.trips[0]?.id || null;
  ui.syncText = 'クラウドに保存済み';
  saveLocal();
};

const initialize = async () => {
  const configured = Boolean(config.supabaseUrl && config.supabasePublishableKey);
  if (!configured) {
    render();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
    return;
  }
  ui.cloud = true;
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    supabase = createClient(config.supabaseUrl, config.supabasePublishableKey);
    const { data: sessionData } = await supabase.auth.getSession();
    ui.user = sessionData.session?.user || null;
    if (ui.user) await loadCloudData();
    supabase.auth.onAuthStateChange(async (_event, session) => {
      ui.user = session?.user || null;
      if (ui.user) {
        await loadCloudData();
      } else {
        queue = [];
        saveQueue();
      }
      render();
    });
  } catch (error) {
    console.error(error);
    ui.cloud = false;
    if (navigator.onLine) {
      ui.syncText = '⚠ クラウドに接続できません・端末データを表示中（データベースが停止中の可能性）';
      ui.syncWarn = true;
    } else {
      ui.syncText = '端末内に保存・オフライン中';
      ui.syncWarn = false;
    }
  }
  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
};

window.addEventListener('online', flushQueue);
initialize();
