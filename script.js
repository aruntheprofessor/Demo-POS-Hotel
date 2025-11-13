/* AgroPOS Demo - script.js
   - Menu: Chicken Rice, Chapati, Dosa, Parotta, Tea
   - One-row per item layout
   - + / - buttons and manual number input between them
   - Cart updates live without Add button
   - Cart stored in localStorage; sales saved on print
*/

// Storage keys
const STORAGE = {
    MENU: 'pos_demo_menu_v1',
    CART: 'pos_demo_cart_v1',
    SALES: 'pos_demo_sales_v1'
};

// Simple SVG placeholders as data URLs
function svgData(text, bg = '#fff4e6', fg = '#ff7a18') {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='160'><rect width='100%' height='100%' fill='${bg}' rx='12'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='${fg}' font-family='Inter, Arial' font-weight='700' font-size='20'>${text}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Default menu items
const DEFAULT_MENU = [
    { id: 'm_chicken_rice', name: 'Chicken Rice', price: 100, img: 'images/cr.jpg', updated_at: Date.now() },
    { id: 'm_chapati', name: 'Chapati', price: 20, img: 'images/chapathi.jpg', updated_at: Date.now() },
    { id: 'm_dosa', name: 'Dosa', price: 30, img: 'images/dosa.png', updated_at: Date.now() },
    { id: 'm_parotta', name: 'Parotta', price: 25, img: 'images/parotta.jpg', updated_at: Date.now() },
    { id: 'm_tea', name: 'Tea', price: 10, img: 'images/chai.jpg', updated_at: Date.now() },
];

// Load / Save helpers
function loadJSON(k, fallback) {
    const raw = localStorage.getItem(k);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
}
function saveJSON(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

let menu = loadJSON(STORAGE.MENU, DEFAULT_MENU);
let cart = loadJSON(STORAGE.CART, {});   // { menuId: qty }
let sales = loadJSON(STORAGE.SALES, []); // array of bill objects

// Elements
const menuListEl = document.getElementById('menuList');
const cartListEl = document.getElementById('cartList');
const emptyCartEl = document.getElementById('emptyCart');
const subtotalEl = document.getElementById('subtotal');
const summaryGridEl = document.getElementById('summaryGrid');

function renderMenu() {
    menuListEl.innerHTML = '';
    menu.forEach(item => {
        const row = document.createElement('div');
        row.className = 'menu-row';

        const thumb = document.createElement('div'); thumb.className = 'thumb';
        const img = document.createElement('img'); img.src = item.img; img.alt = item.name;
        thumb.appendChild(img);

        const info = document.createElement('div'); info.className = 'info';
        const name = document.createElement('div'); name.className = 'name'; name.textContent = item.name;
        const price = document.createElement('div'); price.className = 'price'; price.textContent = '₹' + item.price;
        info.appendChild(name); info.appendChild(price);

        const controls = document.createElement('div'); controls.className = 'controls';

        const minus = document.createElement('button'); minus.className = 'qtyBtn'; minus.textContent = '−';
        const input = document.createElement('input'); input.type = 'number'; input.min = 0; input.step = 1; input.value = cart[item.id] ? cart[item.id] : 0;
        input.className = 'qtyInput';
        const plus = document.createElement('button'); plus.className = 'qtyBtn'; plus.textContent = '+';

        // Live update the cart whenever quantity changes
        function updateCartQty(id, qty) {
            qty = Math.max(0, parseInt(qty) || 0);
            if (qty === 0) {
                delete cart[id];
            } else {
                cart[id] = qty;
            }
            saveJSON(STORAGE.CART, cart);
            renderCart();
        }

        minus.addEventListener('click', () => {
            let v = Math.max(0, parseInt(input.value || 0) - 1);
            input.value = v;
            updateCartQty(item.id, v);
        });

        plus.addEventListener('click', () => {
            let v = Math.max(0, parseInt(input.value || 0) + 1);
            input.value = v;
            updateCartQty(item.id, v);
        });

        input.addEventListener('input', () => {
            let v = parseInt(input.value || 0);
            if (isNaN(v) || v < 0) v = 0;
            if (v > 999) v = 999;
            input.value = v;
            updateCartQty(item.id, v);
        });

        controls.appendChild(minus);
        controls.appendChild(input);
        controls.appendChild(plus);

        row.appendChild(thumb);
        row.appendChild(info);
        row.appendChild(controls);

        menuListEl.appendChild(row);
    });
}

function renderCart() {
    const entries = Object.entries(cart);
    if (entries.length === 0) {
        emptyCartEl.style.display = 'block';
        cartListEl.style.display = 'none';
        subtotalEl.textContent = '₹0';
        return;
    }
    emptyCartEl.style.display = 'none';
    cartListEl.style.display = 'block';
    cartListEl.innerHTML = '';
    let subtotal = 0;
    entries.forEach(([menuId, qty]) => {
        const item = menu.find(m => m.id === menuId);
        if (!item) return;
        const line = document.createElement('div'); line.className = 'cart-row';
        const left = document.createElement('div'); left.className = 'itemLeft';
        const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = item.name;
        const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = `₹${item.price} × ${qty}`;
        left.appendChild(nm); left.appendChild(meta);

        const right = document.createElement('div'); right.style.textAlign = 'right';
        const total = item.price * qty; subtotal += total;
        const totEl = document.createElement('div'); totEl.textContent = `₹${total.toFixed(0)}`; totEl.style.fontWeight = '700';

        right.appendChild(totEl);
        line.appendChild(left); line.appendChild(right);
        cartListEl.appendChild(line);
    });
    subtotalEl.textContent = '₹' + subtotal.toFixed(0);
}

// Bill generation
function generateBill() {
    const id = 'bill_' + Date.now();
    const created_at = new Date().toISOString();
    const items = Object.entries(cart).map(([menuId, qty]) => {
        const it = menu.find(m => m.id === menuId);
        return { id: menuId, name: it.name, unit_price: it.price, qty, total: it.price * qty };
    });
    const subtotal = items.reduce((s, it) => s + it.total, 0);
    return { id, created_at, items, subtotal };
}

function buildReceiptHtml(bill) {
    const shopName = 'Roadside Hotel Demo';
    const dt = new Date(bill.created_at);
    const dtStr = dt.toLocaleString();
    let html = `<div style="font-family:Inter, Arial;max-width:360px;margin:0 auto;color:#111">
  <div style="text-align:center">
    <h2 style="margin:6px 0 2px 0">${shopName}</h2>
    <div style="color:#555;margin-bottom:8px">Simple Receipt</div>
  </div>
  <div style="font-size:13px;color:#444;margin-bottom:8px">Date: ${dtStr}</div>
  <div style="border-top:1px dashed #ddd;margin-top:6px;padding-top:8px">
    <div style="display:flex;font-weight:700;margin-bottom:6px">
      <div style="flex:1">Item</div>
      <div style="width:50px;text-align:center">Qty</div>
      <div style="width:70px;text-align:right">Total</div>
    </div>`;

    bill.items.forEach(it => {
        const name = it.name.length > 20 ? it.name.slice(0, 18) + '…' : it.name;
        html += `<div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:4px"><div style="flex:1">${name}</div><div style="width:40px;text-align:center">${it.qty}</div><div style="width:70px;text-align:right">₹${it.total.toFixed(0)}</div></div>`;
    });
    html += `<div style="border-top:1px dashed #ddd;margin-top:6px;padding-top:8px"><div style="display:flex;justify-content:space-between;font-weight:700"><div>Subtotal</div><div>₹${bill.subtotal.toFixed(0)}</div></div></div>
    <div style="text-align:center;margin-top:14px;color:#777">Thank you! Visit again.</div></div>`;
    return html;
}

function onPrint() {
    const entries = Object.entries(cart);
    if (entries.length === 0) { alert('Cart is empty. Add items first.'); return; }

    const bill = generateBill();
    const receiptHtml = buildReceiptHtml(bill);

    // open print preview window
    const w = window.open('', '_blank', 'width=420,height=800');
    if (!w) { alert('Allow popups to see print preview.'); return; }
    w.document.write(`<html><head><title>Receipt</title><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>body{font-family:Inter, Arial;margin:18px;color:#111}</style></head><body>${receiptHtml}
    <script>
      setTimeout(()=>{ window.print(); }, 350);
      window.onafterprint = () => { window.close(); };
    </script></body></html>`);
    w.document.close();

    // save bill to sales and clear cart
    bill.printed = true;
    sales.push(bill);
    saveJSON(STORAGE.SALES, sales);

    // 🧹 After printing, clear cart and reset all inputs
    cart = {};
    saveJSON(STORAGE.CART, cart);
    renderCart();
    renderSummary();
    document.querySelectorAll('.qtyInput').forEach(input => {
        input.value = 0;
    });

    alert('Bill printed & saved to local sales history.');
}

// Sales Summary (today)
function startOfDayISO(d = new Date()) {
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return t.toISOString();
}
function renderSummary() {
    const todayStart = startOfDayISO();
    const todaySales = sales.filter(b => b.created_at >= todayStart);
    const totalToday = todaySales.reduce((s, b) => s + (b.subtotal || 0), 0);
    const itemCounts = {}; let totalItems = 0;
    todaySales.forEach(b => b.items.forEach(it => { itemCounts[it.name] = (itemCounts[it.name] || 0) + it.qty; totalItems += it.qty; }));
    let most = { name: '-', qty: 0 };
    Object.entries(itemCounts).forEach(([k, v]) => { if (v > most.qty) most = { name: k, qty: v }; });

    summaryGridEl.innerHTML = `
    <div class="stat"><div class="num">₹${totalToday.toFixed(0)}</div><div class="lbl">Total Sales (Today)</div></div>
    <div class="stat"><div class="num">${most.name}</div><div class="lbl">Most Sold</div></div>
    <div class="stat"><div class="num">${totalItems}</div><div class="lbl">Items Sold</div></div>
  `;
}

// Clear cart button
document.getElementById('clearCartBtn').addEventListener('click', () => {
    if (confirm('Clear current cart?')) {
        cart = {};
        saveJSON(STORAGE.CART, cart);
        renderCart();
        document.querySelectorAll('.qtyInput').forEach(input => { input.value = 0; });
    }
});

document.getElementById('printBtn').addEventListener('click', onPrint);

// Init
function init() {
    menu = loadJSON(STORAGE.MENU, DEFAULT_MENU);
    cart = loadJSON(STORAGE.CART, {});
    sales = loadJSON(STORAGE.SALES, []);
    renderMenu();
    renderCart();
    renderSummary();
}
init();

// Debug expose
window._Demo = { menu, cart, sales, saveJSON };
