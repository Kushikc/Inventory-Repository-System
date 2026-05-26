// ==========================
// LOCAL STORAGE SETUP
// ==========================

let products = JSON.parse(
  localStorage.getItem("products")
);

if (!products) {

  products = [

    {
      id: 1,
      name: "iPhone 15",
      warehouse: "Chennai Warehouse",
      stock: 5,
      image:
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9"
    },

    {
      id: 2,
      name: "Laptop",
      warehouse: "Bangalore Warehouse",
      stock: 5,
      image:
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853"
    },

    {
      id: 3,
      name: "Headphones",
      warehouse: "Hyderabad Warehouse",
      stock: 5,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
    }

  ];

  localStorage.setItem(
    "products",
    JSON.stringify(products)
  );
}


// ==========================
// DOM ELEMENTS
// ==========================

const productContainer =
  document.getElementById("productContainer");

const modal =
  document.getElementById("checkoutModal");


// ==========================
// GLOBAL VARIABLES
// ==========================

let currentReservation = JSON.parse(
  localStorage.getItem("currentReservation")
);

let timerInterval;

let reservationHistory =
  JSON.parse(
    localStorage.getItem("history")
  ) || [];


// ==========================
// TOAST NOTIFICATION
// ==========================

function showToast(message, type) {

  const toastBox =
    document.getElementById("toastBox");

  const toast =
    document.createElement("div");

  toast.classList.add("toast");

  toast.classList.add(type);

  toast.innerText = message;

  toastBox.appendChild(toast);

  setTimeout(() => {

    toast.remove();

  }, 3000);
}


// ==========================
// DISPLAY PRODUCTS
// ==========================

function displayProducts() {

  productContainer.innerHTML = "";

  products.forEach((product) => {

    productContainer.innerHTML += `

      <div class="card">

        <img src="${product.image}">

        <div class="card-content">

          <h2>${product.name}</h2>

          <p>
            <b>Warehouse:</b>
            ${product.warehouse}
          </p>

          <p>
            <b>Available Stock:</b>
            ${product.stock}
          </p>

          <input
            type="number"
            min="1"
            value="1"
            id="qty-${product.id}"
            class="qty-input"
          />

          <button
            class="reserve-btn"
            onclick="reserveProduct(${product.id})"
            ${product.stock <= 0 ? "disabled" : ""}
          >

            ${product.stock <= 0
              ? "Out Of Stock"
              : "Reserve"}

          </button>

        </div>

      </div>
    `;
  });
}

displayProducts();


// ==========================
// RESERVE PRODUCT
// ==========================

function reserveProduct(id) {

  // PREVENT MULTIPLE ACTIVE RESERVATIONS

  if (currentReservation) {

    showToast(
      "Complete current reservation first",
      "warning"
    );

    return;
  }

  const product =
    products.find((p) => p.id === id);

  const quantity =
    parseInt(
      document.getElementById(`qty-${id}`).value
    );

  // VALIDATION

  if (quantity <= 0) {

    showToast(
      "Invalid quantity",
      "error"
    );

    return;
  }

  // CONCURRENCY HANDLING

  if (product.stock < quantity) {

    showToast(
      "Not enough stock",
      "error"
    );

    return;
  }

  // TEMPORARY STOCK REDUCTION

  product.stock -= quantity;

  localStorage.setItem(
    "products",
    JSON.stringify(products)
  );

  displayProducts();

  // CREATE RESERVATION

  currentReservation = {

    productId: product.id,

    productName: product.name,

    warehouse: product.warehouse,

    quantity: quantity,

    status: "PENDING",

    expiresAt: Date.now() + 10 * 60 * 1000
  };

  localStorage.setItem(
    "currentReservation",
    JSON.stringify(currentReservation)
  );

  // CHECKOUT DETAILS

  document.getElementById("productName")
    .innerText = product.name;

  document.getElementById("warehouse")
    .innerText =
      "Warehouse: " + product.warehouse;

  document.getElementById("quantity")
    .innerText =
      "Quantity: " + quantity;

  document.getElementById("status")
    .innerText =
      "Status: PENDING";

  modal.style.display = "flex";

  startTimer();

  // SAVE HISTORY

  reservationHistory.push({

    productName: product.name,

    warehouse: product.warehouse,

    quantity: quantity,

    status: "PENDING",

    expiry: new Date(
      currentReservation.expiresAt
    ).toLocaleTimeString()

  });

  localStorage.setItem(
    "history",
    JSON.stringify(reservationHistory)
  );

  updateHistory();

  showToast(
    "Reservation Created Successfully",
    "success"
  );
}


// ==========================
// TIMER
// ==========================

function startTimer() {

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {

    if (!currentReservation) {

      clearInterval(timerInterval);

      return;
    }

    const remaining =
      currentReservation.expiresAt - Date.now();

    if (remaining <= 0) {

      clearInterval(timerInterval);

      autoRelease();

    } else {

      const minutes =
        Math.floor(remaining / 1000 / 60);

      const seconds =
        Math.floor((remaining / 1000) % 60);

      document.getElementById("timer")
        .innerText =
          `Time Left: ${minutes}:${String(seconds).padStart(2, "0")}`;

      // PROGRESS BAR

      const progress =
        (remaining / (10 * 60 * 1000)) * 100;

      document.getElementById("progressBar")
        .style.width = progress + "%";
    }

  }, 1000);
}


// ==========================
// CONFIRM PURCHASE
// ==========================

function confirmPurchase() {

  clearInterval(timerInterval);

  reservationHistory[
    reservationHistory.length - 1
  ].status = "CONFIRMED";

  localStorage.setItem(
    "history",
    JSON.stringify(reservationHistory)
  );

  updateHistory();

  document.getElementById("status")
    .innerText =
      "Status: CONFIRMED";

  showToast(
    "Purchase Confirmed",
    "success"
  );

  modal.style.display = "none";

  currentReservation = null;

  localStorage.removeItem(
    "currentReservation"
  );
}


// ==========================
// CANCEL RESERVATION
// ==========================

function cancelReservation() {

  clearInterval(timerInterval);

  releaseStock();

  reservationHistory[
    reservationHistory.length - 1
  ].status = "RELEASED";

  localStorage.setItem(
    "history",
    JSON.stringify(reservationHistory)
  );

  updateHistory();

  showToast(
    "Reservation Cancelled",
    "warning"
  );

  modal.style.display = "none";
}


// ==========================
// AUTO RELEASE
// ==========================

function autoRelease() {

  releaseStock();

  reservationHistory[
    reservationHistory.length - 1
  ].status = "EXPIRED";

  localStorage.setItem(
    "history",
    JSON.stringify(reservationHistory)
  );

  updateHistory();

  showToast(
    "Reservation Expired",
    "error"
  );

  modal.style.display = "none";
}


// ==========================
// RELEASE STOCK
// ==========================

function releaseStock() {

  const product =
    products.find(
      (p) =>
        p.id === currentReservation.productId
    );

  product.stock += currentReservation.quantity;

  localStorage.setItem(
    "products",
    JSON.stringify(products)
  );

  displayProducts();

  currentReservation = null;

  localStorage.removeItem(
    "currentReservation"
  );
}


// ==========================
// UPDATE HISTORY TABLE
// ==========================

function updateHistory() {

  const historyBody =
    document.getElementById("historyBody");

  historyBody.innerHTML = "";

  reservationHistory.forEach((item) => {

    historyBody.innerHTML += `

      <tr>

        <td>${item.productName}</td>

        <td>${item.warehouse}</td>

        <td>${item.quantity}</td>

        <td>${item.status}</td>

        <td>${item.expiry}</td>

      </tr>
    `;
  });
}

updateHistory();


// ==========================
// RESTORE ACTIVE RESERVATION
// ==========================

if (currentReservation) {

  document.getElementById("productName")
    .innerText =
      currentReservation.productName;

  document.getElementById("warehouse")
    .innerText =
      "Warehouse: " +
      currentReservation.warehouse;

  document.getElementById("quantity")
    .innerText =
      "Quantity: " +
      currentReservation.quantity;

  document.getElementById("status")
    .innerText =
      "Status: " +
      currentReservation.status;

  modal.style.display = "flex";

  startTimer();
}


// ==========================
// RESET PRODUCTS
// ==========================

function resetProducts() {

  products[0].stock = 5;
  products[1].stock = 5;
  products[2].stock = 5;

  localStorage.setItem(
    "products",
    JSON.stringify(products)
  );

  displayProducts();

  showToast(
    "Products Reset Successfully",
    "success"
  );
}