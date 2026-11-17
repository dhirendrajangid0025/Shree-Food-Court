// Shree Food Court - app.js
// Static GitHub Pages version

const MENU = Array.isArray(window.SHREE_MENU)
  ? window.SHREE_MENU
  : [];

const config = {
  phone: "918824180056",
  upiId: "Q050896036@ybl",
  restaurantName: "Shree Food Court"
};

let cart = [];
let selectedCategory = "All";

const $ = (id) => document.getElementById(id);

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function init() {
  const requiredIds = [
    "year",
    "filters",
    "menuGrid",
    "searchInput",
    "cartJump",
    "cart",
    "checkoutForm",
    "closePayment",
    "closePayment2",
    "feedback"
  ];

  const missing = requiredIds.filter((id) => !$(id));

  if (missing.length) {
    console.error("Missing HTML elements:", missing);
    return;
  }

  $("year").textContent = new Date().getFullYear();

  if (!MENU.length) {
    $("menuGrid").textContent =
      "Menu could not load. Please refresh the page.";
    console.error("SHREE_MENU is empty. Check menu-data.js.");
    return;
  }

  renderFilters();
  renderMenu();
  renderCart();

  $("cartJump").addEventListener("click", () => {
    $("cart").scrollIntoView({ behavior: "smooth" });
  });

  $("searchInput").addEventListener("input", renderMenu);
  $("checkoutForm").addEventListener("submit", submitOrder);

  $("closePayment").addEventListener("click", closePayment);
  $("closePayment2").addEventListener("click", closePayment);
}

function renderFilters() {
  const categories = [
    "All",
    ...new Set(MENU.map((item) => item.category))
  ];

  $("filters").innerHTML = categories.map((category) => `
    <button type="button"
      class="${category === selectedCategory ? "active" : ""}"
      data-cat="${escapeHtml(category)}">
      ${escapeHtml(category)}
    </button>
  `).join("");

  $("filters").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-cat]");

    if (!button) return;

    selectedCategory = button.dataset.cat;

    $("filters").querySelectorAll("button").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    renderMenu();
  });
}

function renderMenu() {
  const searchText =
    $("searchInput").value.trim().toLowerCase();

  const filteredItems = MENU.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" ||
      item.category === selectedCategory;

    const matchesSearch =
      item.name.toLowerCase().includes(searchText);

    return matchesCategory && matchesSearch;
  });

  $("menuGrid").innerHTML = filteredItems.map((item) => `
    <article class="food-card">
      <div class="food-photo food-fallback">🍽️</div>

      <div class="food-info">
        <div class="food-category">
          ${escapeHtml(item.category)}
        </div>

        <h3>${escapeHtml(item.name)}</h3>

        <div class="food-bottom">
          <span class="food-price">
            ₹${money(item.price)}
          </span>

          <button type="button"
            class="add-btn"
            data-add="${Number(item.id)}">
            ＋ Add
          </button>
        </div>
      </div>
    </article>
  `).join("") || "<p>No food found.</p>";

  $("menuGrid").querySelectorAll("[data-add]").forEach((button) => {
    button.addEventListener("click", () => {
      addToCart(Number(button.dataset.add));
    });
  });
}

function addToCart(id) {
  const existing = cart.find((item) => item.id === id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id,
      quantity: 1
    });
  }

  renderCart();
}

function changeQty(id, difference) {
  const item = cart.find((row) => row.id === id);

  if (!item) return;

  item.quantity += difference;

  if (item.quantity <= 0) {
    cart = cart.filter((row) => row.id !== id);
  }

  renderCart();
}

function renderCart() {
  const detailedCart = cart.map((row) => {
    const menuItem = MENU.find((item) => item.id === row.id);

    return menuItem
      ? { ...menuItem, quantity: row.quantity }
      : null;
  }).filter(Boolean);

  const count = detailedCart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const total = detailedCart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  $("cartCount").textContent = count;

  $("cartItems").innerHTML = detailedCart.length
    ? detailedCart.map((item) => `
      <div class="cart-line">
        <div>
          <b>${escapeHtml(item.name)}</b><br>
          <small>₹${money(item.price)} each</small>
        </div>

        <div class="qty-controls">
          <button type="button"
            data-minus="${item.id}">−</button>

          <b>${item.quantity}</b>

          <button type="button"
            data-plus="${item.id}">+</button>

          <b>₹${money(item.price * item.quantity)}</b>
        </div>
      </div>
    `).join("")
    : "Your cart is empty.";

  $("cartTotal").textContent = money(total);

  $("cartItems").querySelectorAll("[data-minus]").forEach((button) => {
    button.onclick = () => {
      changeQty(Number(button.dataset.minus), -1);
    };
  });

  $("cartItems").querySelectorAll("[data-plus]").forEach((button) => {
    button.onclick = () => {
      changeQty(Number(button.dataset.plus), 1);
    };
  });
}

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
      "Enter a valid 10-digit mobile number.";
    return;
  }

  const selectedPayment =
    document.querySelector(
      'input[name="payment"]:checked'
    );

  if (!selectedPayment) {
    $("feedback").textContent =
      "Please select a payment method.";
    return;
  }

  const payload = {
    name: $("customerName").value.trim(),
    mobile,
    address: $("address").value.trim(),
    paymentMethod: selectedPayment.value,
    items: cart.map((item) => ({ ...item }))
  };

  const total = payload.items.reduce((sum, row) => {
    const menuItem = MENU.find(
      (item) => item.id === row.id
    );

    return sum + (
      menuItem
        ? menuItem.price * row.quantity
        : 0
    );
  }, 0);

  const orderData = {
    orderCode: "SFC-" + Date.now().toString().slice(-8),
    total,
    upiId: config.upiId,
    restaurantName: config.restaurantName
  };

  if (payload.paymentMethod === "UPI") {
    if (typeof window.QRCode === "undefined") {
      $("feedback").textContent =
        "QR code library did not load. Refresh the page.";
      return;
    }

    showPayment(orderData, payload);
  } else {
    notifyWhatsApp(
      orderData,
      payload,
      "Cash on delivery selected."
    );

    $("feedback").textContent =
      "WhatsApp opened. Press Send to place your order.";
  }
}

function showPayment(data, payload) {
  $("orderCode").textContent = data.orderCode;
  $("qrAmount").textContent = money(data.total);
  $("upiText").textContent = data.upiId;
  $("qrCode").innerHTML = "";

  const upiUri =
    `upi://pay?pa=${encodeURIComponent(data.upiId)}` +
    `&pn=${encodeURIComponent(data.restaurantName)}` +
    `&am=${Number(data.total).toFixed(2)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent("Order " + data.orderCode)}`;

  new window.QRCode($("qrCode"), {
    text: upiUri,
    width: 190,
    height: 190,
    correctLevel: window.QRCode.CorrectLevel.M
  });

  const itemText = payload.items.map((row) => {
    const menuItem = MENU.find(
      (item) => item.id === row.id
    );

    return `${menuItem ? menuItem.name : "Food"} x ${row.quantity}`;
  }).join(", ");

  const message =
    `Hello Shree Food Court, I placed order ${data.orderCode}.\n` +
    `Name: ${payload.name}\n` +
    `Mobile: ${payload.mobile}\n` +
    `Address: ${payload.address}\n` +
    `Items: ${itemText}\n` +
    `Total: ₹${data.total}\n` +
    `I selected UPI.`;

  $("whatsappOrder").href =
    `https://wa.me/${config.phone}?text=${encodeURIComponent(message)}`;

  $("paymentModal").hidden = false;
}

function notifyWhatsApp(data, payload, note) {
  const itemText = payload.items.map((row) => {
    const menuItem = MENU.find(
      (item) => item.id === row.id
    );

    return `${menuItem ? menuItem.name : "Food"} x ${row.quantity}`;
  }).join(", ");

  const message =
    `New Order: ${data.orderCode}\n\n` +
    `Name: ${payload.name}\n` +
    `Mobile: ${payload.mobile}\n` +
    `Address: ${payload.address}\n\n` +
    `Items: ${itemText}\n\n` +
    `Total: ₹${data.total}\n\n` +
    `${note}`;

  const whatsappUrl =
    `https://wa.me/${config.phone}?text=${encodeURIComponent(message)}`;

  window.open(whatsappUrl, "_blank");
}

function closePayment() {
  $("paymentModal").hidden = true;
}

init();
