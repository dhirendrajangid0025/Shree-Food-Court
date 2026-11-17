const MENU = window.SHREE_MENU || [];
const categories = ["All", ...new Set(MENU.map(x => x.category))];
const categoryEmoji = {Noodles:"🍜",Fries:"🍟",Roll:"🌯","Pav Bhaji":"🍛",Coffee:"☕",Shake:"🥤",Sandwich:"🥪",Pizza:"🍕",Momos:"🥟",Pasta:"🍝",Starter:"🥔",Manchurian:"🥘",Paneer:"🍲",Burger:"🍔"};
const categoryPhotos = {
  Noodles:"https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=700",
  Fries:"https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=700",
  Roll:"https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=700",
  "Pav Bhaji":"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=700",
  Coffee:"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=700",
  Shake:"https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=700",
  Sandwich:"https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=700",
  Pizza:"https://images.unsplash.com/photo-1513104890138-7c749659a591?w=700",
  Momos:"https://images.unsplash.com/photo-1563245372-f21724e3856d?w=700",
  Pasta:"https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=700",
  Starter:"https://images.unsplash.com/photo-1547592180-85f173990554?w=700",
  Manchurian:"https://images.unsplash.com/photo-1512058564366-18510be2db19?w=700",
  Paneer:"https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=700",
  Burger:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700"
};
let cart = [];
let selectedCategory = "All";
let config = {};

const $ = id => document.getElementById(id);
const money = n => Number(n).toLocaleString("en-IN");

async function init() {
 config = {
    phone: "918824180056",
    upiId: "Q050896036@ybl",
    restaurantName: "Shree Food Court"
};
  $("year").textContent = new Date().getFullYear();
  renderFilters();
  renderMenu();
  renderCart();
  $("cartJump").addEventListener("click", () => $("cart").scrollIntoView({behavior:"smooth"}));
  $("searchInput").addEventListener("input", renderMenu);
  $("checkoutForm").addEventListener("submit", submitOrder);
  $("closePayment").addEventListener("click", closePayment);
  $("closePayment2").addEventListener("click", closePayment);
}
function renderFilters() {
  $("filters").innerHTML = categories.map(c =>
    `<button class="${c === selectedCategory ? "active" : ""}" data-cat="${escapeHtml(c)}">${categoryEmoji[c] || "🍽️"} ${escapeHtml(c)}</button>`
  ).join("");
  $("filters").addEventListener("click", e => {
    const btn = e.target.closest("button[data-cat]");
    if (!btn) return;
    selectedCategory = btn.dataset.cat;
    $("filters").querySelectorAll("button").forEach(b => b.classList.toggle("active", b === btn));
    renderMenu();
  });
}
function renderMenu() {
  const q = $("searchInput").value.trim().toLowerCase();
  const rows = MENU.filter(item =>
    (selectedCategory === "All" || item.category === selectedCategory) &&
    item.name.toLowerCase().includes(q)
  );
  $("menuGrid").innerHTML = rows.map(item => `
    <article class="food-card">
      <img class="food-photo" src="${categoryPhotos[item.category] || ""}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.outerHTML='<div class=&quot;food-photo food-fallback&quot;>${categoryEmoji[item.category] || "🍽️"}</div>'">
      <div class="food-info">
        <div class="food-category">${escapeHtml(item.category)}</div>
        <h3>${escapeHtml(item.name)}</h3>
        <div class="food-bottom">
          <span class="food-price">₹${money(item.price)}</span>
          <button class="add-btn" data-add="${item.id}">＋ Add</button>
        </div>
      </div>
    </article>`).join("") || "<p>No food found. Try another search.</p>";
  $("menuGrid").querySelectorAll("[data-add]").forEach(btn =>
    btn.addEventListener("click", () => addToCart(Number(btn.dataset.add)))
  );
}
function addToCart(id) {
  const found = cart.find(x => x.id === id);
  if (found) found.quantity++;
  else cart.push({id, quantity:1});
  renderCart();
}
function changeQty(id, diff) {
  const row = cart.find(x => x.id === id);
  if (!row) return;
  row.quantity += diff;
  if (row.quantity <= 0) cart = cart.filter(x => x.id !== id);
  renderCart();
}
function renderCart() {
  const detailed = cart.map(row => ({...MENU.find(x => x.id === row.id), quantity:row.quantity})).filter(x => x.id);
  const count = detailed.reduce((s,x) => s+x.quantity, 0);
  const total = detailed.reduce((s,x) => s+x.price*x.quantity, 0);
  $("cartCount").textContent = count;
  $("cartItems").innerHTML = detailed.length ? detailed.map(x => `
    <div class="cart-line">
      <div><b>${escapeHtml(x.name)}</b><br><small>₹${money(x.price)} each</small></div>
      <div class="qty-controls">
        <button data-minus="${x.id}">−</button><b>${x.quantity}</b><button data-plus="${x.id}">+</button>
        <b>₹${money(x.price*x.quantity)}</b>
      </div>
    </div>`).join("") : "Your cart is empty.";
  $("cartTotal").textContent = money(total);
  $("cartItems").querySelectorAll("[data-minus]").forEach(b => b.onclick = () => changeQty(Number(b.dataset.minus),-1));
  $("cartItems").querySelectorAll("[data-plus]").forEach(b => b.onclick = () => changeQty(Number(b.dataset.plus),1));
}
async function submitOrder(e) {
    e.preventDefault();

    $("feedback").textContent = "";

    if (!cart.length) {
        $("feedback").textContent = "Please add food first.";
        return;
    }

    const mobile = $("mobile").value.trim();

    if (!/^[6-9]\d{9}$/.test(mobile)) {
        $("feedback").textContent = "Enter valid mobile number.";
        return;
    }

    const paymentMethod =
        document.querySelector('input[name="payment"]:checked').value;

    const payload = {
        name: $("customerName").value.trim(),
        mobile,
        address: $("address").value.trim(),
        paymentMethod,
        items: cart.map(x => ({...x}))
    };

    const total = payload.items.reduce((sum, row) => {
        const item = MENU.find(x => x.id === row.id);
        return sum + item.price * row.quantity;
    }, 0);

    const data = {
        orderCode: "SFC-" + Date.now().toString().slice(-8),
        total: total,
        upiId: config.upiId,
        restaurantName: config.restaurantName
    };

    if (paymentMethod === "UPI") {
        if (!window.QRCode) {
            $("feedback").textContent = "QR library not loaded. Refresh and try again.";
            return;
        }

        showPayment(data, payload);

    } else {
        notifyWhatsApp(
            data,
            payload,
            "Cash on delivery selected."
        );

        $("feedback").textContent =
            "WhatsApp opened. Press Send to place your order.";
    }
}

      
    cart = []; renderCart(); $("checkoutForm").reset();
  } catch(err) {
    $("feedback").textContent = err.message;
  } finally {
    button.disabled = false; button.textContent = "Place order";
  }
}
function showPayment(data, payload) {
  $("orderCode").textContent = data.orderCode;
  $("qrAmount").textContent = money(data.total);
  $("upiText").textContent = data.upiId;
  const upiUri = `upi://pay?pa=${encodeURIComponent(data.upiId)}&pn=${encodeURIComponent(data.restaurantName)}&am=${Number(data.total).toFixed(2)}&cu=INR&tn=${encodeURIComponent("Order "+data.orderCode)}`;
  $("qrCode").innerHTML = "";
  if (window.QRCode) {
    new QRCode($("qrCode"), {text:upiUri,width:190,height:190,correctLevel:QRCode.CorrectLevel.M});
  } else {
    $("qrCode").textContent = "QR library unavailable. Please refresh and try again.";
  }
  const items = payload.items.map(row => {
    const item = MENU.find(x => x.id === row.id);
    return `${item.name} x ${row.quantity}`;
  }).join(", ");
  const message = `Hello Shree Food Court, I placed order ${data.orderCode}.\nName: ${payload.name}\nMobile: ${payload.mobile}\nAddress: ${payload.address}\nItems: ${items}\nTotal: ₹${data.total}\nI selected UPI. I will share payment confirmation if needed.`;
  $("whatsappOrder").href = `https://wa.me/${config.phone}?text=${encodeURIComponent(message)}`;
  $("paymentModal").hidden = false;
}
function notifyWhatsApp(data, payload, note) {

    const items = payload.items.map(row => {
        const item = MENU.find(x => x.id === row.id);
        return `${item.name} x ${row.quantity}`;
    }).join(", ");

    const message = `
New Order: ${data.orderCode}

Name: ${payload.name}
Mobile: ${payload.mobile}
Address: ${payload.address}

Items: ${items}

Total: ₹${data.total}

${note}
`;

    const url = `https://wa.me/${config.phone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank", "noopener,noreferrer");
}
function closePayment() { $("paymentModal").hidden = true; }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
init().catch(err => $("feedback").textContent = "Website could not load. Please refresh.");
