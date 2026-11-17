// SHREE FOOD COURT - COMPLETE app.js

const MENU = window.SHREE_MENU || [];

const categories = [
  "All",
  ...new Set(MENU.map(item => item.category))
];

const categoryEmoji = {
  Noodles: "🍜",
  Fries: "🍟",
  Roll: "🌯",
  "Pav Bhaji": "🍛",
  Coffee: "☕",
  Shake: "🥤",
  Sandwich: "🥪",
  Pizza: "🍕",
  Momos: "🥟",
  Pasta: "🍝",
  Starter: "🥔",
  Manchurian: "🥘",
  Paneer: "🍲",
  Burger: "🍔"
};

const categoryPhotos = {
  Noodles: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=700",
  Fries: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=700",
  Roll: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=700",
  "Pav Bhaji": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=700",
  Coffee: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=700",
  Shake: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=700",
  Sandwich: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=700",
  Pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=700",
  Momos: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=700",
  Pasta: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=700",
  Starter: "https://images.unsplash.com/photo-1547592180-85f173990554?w=700",
  Manchurian: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=700",
  Paneer: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=700",
  Burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700"
};

let cart = [];
let selectedCategory = "All";

const config = {
  phone: "918824180056",
  upiId: "Q050896036@ybl",
  restaurantName: "Shree Food Court"
};

const $ = id => document.getElementById(id);

const money = n =>
  Number(n || 0).toLocaleString("en-IN");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// START WEBSITE

function init() {
  if (!MENU.length) {
    console.error("Menu data not loaded!");
    $("menuGrid").textContent =
      "Menu could not load. Please refresh.";
    return;
  }

  $("year").textContent = new Date().getFullYear();

  renderFilters();
  renderMenu();
  renderCart();

  $("cartJump").addEventListener("click", () => {
    $("cart").scrollIntoView({
      behavior: "smooth"
    });
  });

  $("searchInput").addEventListener(
    "input",
    renderMenu
  );

  $("checkoutForm").addEventListener(
    "submit",
    submitOrder
  );

  $("closePayment").addEventListener(
    "click",
    closePayment
  );

  $("closePayment2").addEventListener(
    "click",
    closePayment
  );
}

// CATEGORY FILTERS

function renderFilters() {
  $("filters").innerHTML = categories.map(category => `
    <button
      type="button"
      class="${category === selectedCategory ? "active" : ""}"
      data-cat="${escapeHtml(category)}">

      ${categoryEmoji[category] || "🍽️"}
      ${escapeHtml(category)}

    </button>
  `).join("");

  $("filters").addEventListener("click", event => {
    const button = event.target.closest(
      "button[data-cat]"
    );

    if (!button) return;

    selectedCategory = button.dataset.cat;

    $("filters")
      .querySelectorAll("button")
      .forEach(item => {
        item.classList.toggle(
          "active",
          item === button
        );
      });

    renderMenu();
  });
}

// DISPLAY FOOD MENU

function renderMenu() {
  const search = $("searchInput")
    .value.trim().toLowerCase();

  const rows = MENU.filter(item => {
    const categoryMatch =
      selectedCategory === "All" ||
      item.category === selectedCategory;

    const searchMatch =
      item.name.toLowerCase().includes(search);

    return categoryMatch && searchMatch;
  });

  $("menuGrid").innerHTML = rows.map(item => `
    <article class="food-card">

      <img
        class="food-photo"
        src="${categoryPhotos[item.category] || ""}"
        alt="${escapeHtml(item.name)}"
        loading="lazy"
        onerror="this.outerHTML='<div class=&quot;food-photo food-fallback&quot;>${categoryEmoji[item.category] || "🍽️"}</div>'">

      <div class="food-info">

        <div class="food-category">
          ${escapeHtml(item.category)}
        </div>

        <h3>${escapeHtml(item.name)}</h3>

        <div class="food-bottom">

          <span class="food-price">
            ₹${money(item.price)}
          </span>

          <button
            type="button"
            class="add-btn"
            data-add="${item.id}">
            ＋ Add
          </button>

        </div>
      </div>
    </article>
  `).join("") || "<p>No food found.</p>";

  $("menuGrid")
    .querySelectorAll("[data-add]")
    .forEach(button => {
      button.addEventListener("click", () => {
        addToCart(Number(button.dataset.add));
      });
    });
}

// ADD FOOD TO CART

function addToCart(id) {
  const found = cart.find(item => item.id === id);

  if (found) {
    found.quantity++;
  } else {
    cart.push({
      id: id,
      quantity: 1
    });
  }

  renderCart();
}

// CHANGE QUANTITY

function changeQty(id, difference) {
  const item = cart.find(row => row.id === id);

  if (!item) return;

  item.quantity += difference;

  if (item.quantity <= 0) {
    cart = cart.filter(row => row.id !== id);
  }

  renderCart();
}

// DISPLAY CART

function renderCart() {
  const detailed = cart.map(row => {
    const item = MENU.find(
      food => food.id === row.id
    );

    return item
      ? { ...item, quantity: row.quantity }
      : null;
  }).filter(Boolean);

  const count = detailed.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const total = detailed.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  $("cartCount").textContent = count;

  $("cartItems").innerHTML = detailed.length
    ? detailed.map(item => `
      <div class="cart-line">

        <div>
          <b>${escapeHtml(item.name)}</b>
          <br>
          <small>₹${money(item.price)} each</small>
        </div>

        <div class="qty-controls">

          <button
            type="button"
            data-minus="${item.id}">
            −
          </button>

          <b>${item.quantity}</b>

          <button
            type="button"
            data-plus="${item.id}">
            +
          </button>

          <b>
            ₹${money(item.price * item.quantity)}
          </b>

        </div>
      </div>
    `).join("")
    : "Your cart is empty.";

  $("cartTotal").textContent = money(total);

  $("cartItems")
    .querySelectorAll("[data-minus]")
    .forEach(button => {
      button.onclick = () => {
        changeQty(
          Number(button.dataset.minus),
          -1
        );
      };
    });

  $("cartItems")
    .querySelectorAll("[data-plus]")
    .forEach(button => {
      button.onclick = () => {
        changeQty(
          Number(button.dataset.plus),
          1
        );
      };
    });
}

// PLACE ORDER

function submitOrder(event) {
  event.preventDefault();

  $("feedback").textContent = "";

  if (!cart.length) {
    $("feedback").textContent =
      "Please add food first.";
    return;
  }

  const mobile = $("mobile").value.trim();

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    $("feedback").textContent =
      "Enter valid 10 digit mobile number.";
    return;
  }

  const selectedPayment = document.querySelector(
    'input[name="payment"]:checked'
  );

  if (!selectedPayment) {
    $("feedback").textContent =
      "Please select payment method.";
    return;
  }

  const paymentMethod = selectedPayment.value;

  const payload = {
    name: $("customerName").value.trim(),
    mobile: mobile,
    address: $("address").value.trim(),
    paymentMethod: paymentMethod,
    items: cart.map(item => ({ ...item }))
  };

  const total = payload.items.reduce((sum, row) => {
    const item = MENU.find(
      food => food.id === row.id
    );

    return sum + (
      item ? item.price * row.quantity : 0
    );
  }, 0);

  const data = {
    orderCode:
      "SFC-" + Date.now().toString().slice(-8),
    total: total,
    upiId: config.upiId,
    restaurantName: config.restaurantName
  };

  if (paymentMethod === "UPI") {
    if (!window.QRCode) {
      $("feedback").textContent =
        "QR library not loaded. Refresh page.";
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
      "WhatsApp opened. Press Send to place order.";
  }
}

// UPI PAYMENT QR CODE

function showPayment(data, payload) {
  $("orderCode").textContent = data.orderCode;

  $("qrAmount").textContent =
    money(data.total);

  $("upiText").textContent =
    data.upiId;

  $("qrCode").innerHTML = "";

  const upiUri =
    `upi://pay?pa=${encodeURIComponent(data.upiId)}` +
    `&pn=${encodeURIComponent(data.restaurantName)}` +
    `&am=${Number(data.total).toFixed(2)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent("Order " + data.orderCode)}`;

  new QRCode($("qrCode"), {
    text: upiUri,
    width: 190,
    height: 190,
    correctLevel: QRCode.CorrectLevel.M
  });

  const items = payload.items.map(row => {
    const item = MENU.find(
      food => food.id === row.id
    );

    return `${item.name} x ${row.quantity}`;
  }).join(", ");

  const message =
    `Hello Shree Food Court, I placed order ${data.orderCode}.\n` +
    `Name: ${payload.name}\n` +
    `Mobile: ${payload.mobile}\n` +
    `Address: ${payload.address}\n` +
    `Items: ${items}\n` +
    `Total: ₹${data.total}\n` +
    `I selected UPI. I will share payment confirmation if needed.`;

  $("whatsappOrder").href =
    `https://wa.me/${config.phone}?text=${encodeURIComponent(message)}`;

  $("paymentModal").hidden = false;
}

// WHATSAPP ORDER

function notifyWhatsApp(data, payload, note) {
  const items = payload.items.map(row => {
    const item = MENU.find(
      food => food.id === row.id
    );

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

  const url =
    `https://wa.me/${config.phone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
}

// CLOSE PAYMENT WINDOW

function closePayment() {
  $("paymentModal").hidden = true;
}

// START

init();
