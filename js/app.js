// Expense & Budget Visualizer — app.js
// Entry point: wired up on DOMContentLoaded in init()

// ---------------------------------------------------------------------------
// StorageAPI — reads and writes the transaction list to localStorage
// Satisfies Requirements 5.1, 5.2, 5.3, 5.4
// ---------------------------------------------------------------------------
const StorageAPI = {
  KEY: "expense_transactions",

  /**
   * Load transactions from localStorage.
   * Returns an empty array if localStorage is unavailable,
   * the key is missing, or the stored value is not valid JSON.
   * @returns {Transaction[]}
   */
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      const parsed = JSON.parse(raw);
      // Ensure we always return an array, even if the stored value was null
      // (getItem returns null for missing keys, JSON.parse(null) === null)
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Persist the full transaction array to localStorage as JSON.
   * Silently catches errors if localStorage is unavailable or quota is exceeded.
   * @param {Transaction[]} transactions
   */
  save(transactions) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(transactions));
    } catch (e) {
      // Silently ignore — app continues without persistence
    }
  }
};

// ---------------------------------------------------------------------------
// Validator — pure input validation functions
// Satisfies Requirements 1.1, 1.2, 1.3, 1.4
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {{ name?: string, amount?: string, category?: string }} errors
 */

const Validator = {
  /**
   * Validates a raw form submission object.
   * Calls validateName and validateAmount, returns a combined result.
   * @param {{ name: string, amount: string, category: string }} input
   * @returns {ValidationResult}
   */
  validate(input) {
    const errors = {};

    const nameResult = this.validateName(input.name);
    if (!nameResult.valid) {
      errors.name = nameResult.error;
    }

    const amountResult = this.validateAmount(input.amount);
    if (!amountResult.valid) {
      errors.amount = amountResult.error;
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Validates item name: trim input first; must contain at least one
   * non-whitespace character and be at most 100 characters after trimming.
   * @param {string} name
   * @returns {{ valid: boolean, error?: string }}
   */
  validateName(name) {
    const trimmed = (name || "").trim();

    if (trimmed.length === 0) {
      return { valid: false, error: "Item name is required." };
    }

    if (trimmed.length > 100) {
      return { valid: false, error: "Item name must be 100 characters or fewer." };
    }

    return { valid: true };
  },

  /**
   * Validates amount: parse with parseFloat; must be a finite positive number
   * greater than zero and at most 999,999,999.99.
   * @param {string} amount
   * @returns {{ valid: boolean, error?: string }}
   */
  validateAmount(amount) {
    const parsed = parseFloat(amount);

    if (isNaN(parsed)) {
      return { valid: false, error: "Amount must be a valid number." };
    }

    if (parsed <= 0) {
      return { valid: false, error: "Amount must be a positive number greater than zero." };
    }

    if (parsed > 999999999.99) {
      return { valid: false, error: "Amount must not exceed 999,999,999.99." };
    }

    return { valid: true };
  }
};

// ---------------------------------------------------------------------------
// State Manager — in-memory transaction array
// Satisfies Requirements 3.1, 3.2, 3.3, 3.4, 4.1
// ---------------------------------------------------------------------------

/** @type {Transaction[]} */
let transactions = [];

/**
 * Computes the total balance by summing all transaction amounts.
 * Returns 0 for an empty array.
 * @param {Transaction[]} transactions
 * @returns {number}
 */
function computeBalance(transactions) {
  if (transactions.length === 0) return 0;
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * Computes per-category spending totals.
 * Returns an object with keys Food, Transport, Fun initialised to 0,
 * then sums amounts for each matching category.
 * @param {Transaction[]} transactions
 * @returns {{ Food: number, Transport: number, Fun: number }}
 */
function computeCategoryTotals(transactions) {
  const totals = { Food: 0, Transport: 0, Fun: 0 };
  for (const tx of transactions) {
    if (Object.prototype.hasOwnProperty.call(totals, tx.category)) {
      totals[tx.category] += tx.amount;
    }
  }
  return totals;
}

/**
 * Adds a new transaction to the in-memory list, persists it, and re-renders all UI.
 * Satisfies Requirements 1.2, 5.2
 * @param {Transaction} tx
 */
function addTransaction(tx) {
  transactions.push(tx);
  StorageAPI.save(transactions);
  renderList(transactions);
  renderBalance(transactions);
  renderChart(transactions);
}

/**
 * Removes the transaction with the given id from the in-memory list,
 * persists the updated list, and re-renders all UI.
 * Satisfies Requirements 2.3, 5.3
 * @param {string} id
 */
function deleteTransaction(id) {
  transactions = transactions.filter(tx => tx.id !== id);
  StorageAPI.save(transactions);
  renderList(transactions);
  renderBalance(transactions);
  renderChart(transactions);
}

// ---------------------------------------------------------------------------
// UI Renderer — DOM update functions
// ---------------------------------------------------------------------------

/**
 * Renders the transaction list. Clears the container and re-renders all
 * transactions as list items. Shows a placeholder when the array is empty.
 * Satisfies Requirements 2.1, 2.2, 2.4
 * @param {Transaction[]} transactions
 */
function renderList(transactions) {
  const list = document.getElementById("transaction-list");
  // Clear all existing items
  list.innerHTML = "";

  if (transactions.length === 0) {
    const placeholder = document.createElement("li");
    placeholder.className = "placeholder-message";
    placeholder.textContent = "No transactions yet";
    list.appendChild(placeholder);
    return;
  }

  for (const tx of transactions) {
    const li = document.createElement("li");
    li.className = "transaction-item";

    // Item name
    const nameSpan = document.createElement("span");
    nameSpan.className = "transaction-name";
    nameSpan.textContent = tx.name;

    // Amount formatted as $X.XX
    const amountSpan = document.createElement("span");
    amountSpan.className = "transaction-amount";
    amountSpan.textContent = "$" + tx.amount.toFixed(2);

    // Category label
    const categorySpan = document.createElement("span");
    categorySpan.className = "transaction-category";
    categorySpan.textContent = tx.category;

    // Delete button with data-id attribute
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("data-id", tx.id);
    deleteBtn.setAttribute("aria-label", "Delete " + tx.name);

    li.appendChild(nameSpan);
    li.appendChild(amountSpan);
    li.appendChild(categorySpan);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  }
}

/**
 * Calculates and displays the total balance.
 * Calls computeBalance(transactions), then updates the #balance-display element
 * with the result formatted as $X.XX (exactly 2 decimal places).
 * Shows $0.00 when the array is empty.
 * Satisfies Requirements 3.1, 3.2, 3.3, 3.4
 * @param {Transaction[]} transactions
 */
function renderBalance(transactions) {
  const total = computeBalance(transactions);
  const display = document.getElementById("balance-display");
  display.textContent = "$" + total.toFixed(2);
}

// ---------------------------------------------------------------------------
// renderChart — draws the spending-distribution pie chart
// Satisfies Requirements 4.1, 4.2, 4.3, 4.4, 4.5
// ---------------------------------------------------------------------------

/**
 * Renders a pie chart onto the #expense-chart <canvas> element showing
 * spending distribution across categories (Food, Transport, Fun).
 *
 * Behaviour:
 *  - Empty transactions  → hides canvas, shows #chart-placeholder text.
 *  - Canvas API missing  → hides canvas, shows #chart-placeholder text.
 *  - Data present        → draws proportional pie segments with fill colors
 *                          and white category-name labels inside each segment.
 *
 * Colors per category:
 *  Food      → #FF6384 (pink-red)
 *  Transport → #36A2EB (blue)
 *  Fun       → #FFCE56 (yellow)
 *
 * @param {Transaction[]} transactions - Current list of transactions.
 */
function renderChart(transactions) {
  const canvas = document.getElementById("expense-chart");
  const placeholder = document.getElementById("chart-placeholder");

  // ── Case 1: No transactions — show placeholder, hide canvas ────────────
  if (transactions.length === 0) {
    canvas.style.display = "none";
    placeholder.style.display = "";
    return;
  }

  // ── Case 2: Canvas 2D API unavailable — show placeholder, hide canvas ──
  if (!canvas.getContext || !canvas.getContext("2d")) {
    canvas.style.display = "none";
    placeholder.style.display = "";
    return;
  }

  // ── Case 3: Transactions exist and Canvas API is available ─────────────
  canvas.style.display = "";
  placeholder.style.display = "none";

  const ctx = canvas.getContext("2d");

  // Clear previous drawing
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Compute per-category totals and overall total
  const totals = computeCategoryTotals(transactions);
  const total = totals.Food + totals.Transport + totals.Fun;

  // Pie chart geometry
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) / 2 * 0.7;

  // Category metadata: name, color, total
  const CATEGORY_META = [
    { name: "Food",      color: "#FF6384", amount: totals.Food      },
    { name: "Transport", color: "#36A2EB", amount: totals.Transport },
    { name: "Fun",       color: "#FFCE56", amount: totals.Fun       }
  ];

  // Start drawing from the top of the circle (−π/2 = 12 o'clock)
  let startAngle = -Math.PI / 2;

  for (const cat of CATEGORY_META) {
    // Skip categories with no spending (Requirement 4.1: only categories with ≥1 tx)
    if (cat.amount <= 0) continue;

    const segmentAngle = (cat.amount / total) * 2 * Math.PI;
    const endAngle = startAngle + segmentAngle;

    // ── Draw pie segment ────────────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = cat.color;
    ctx.fill();

    // ── Draw category label inside the segment ──────────────────────────
    // Place label at 85% of the radius along the midpoint angle
    const midAngle = startAngle + segmentAngle / 2;
    const labelX = cx + radius * 0.85 * Math.cos(midAngle);
    const labelY = cy + radius * 0.85 * Math.sin(midAngle);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cat.name, labelX, labelY);

    // Advance start angle for the next segment
    startAngle = endAngle;
  }
}

// ---------------------------------------------------------------------------
// renderErrors — displays or clears inline validation error messages
// Satisfies Requirements 1.3, 1.4
// ---------------------------------------------------------------------------

/**
 * Renders inline validation error messages adjacent to their form fields.
 * Clears all error messages when called with an empty object `{}`.
 *
 * The HTML already contains dedicated error spans:
 *   #error-name      — adjacent to the item name input
 *   #error-amount    — adjacent to the amount input
 *   #error-category  — adjacent to the category dropdown
 *
 * @param {{ name?: string, amount?: string, category?: string }} errors
 */
function renderErrors(errors) {
  const fields = ["name", "amount", "category"];

  for (const field of fields) {
    const el = document.getElementById("error-" + field);
    if (!el) continue;

    const message = errors[field];
    if (message) {
      el.textContent = message;
    } else {
      el.textContent = "";
    }
  }
}

// ---------------------------------------------------------------------------
// initState — loads persisted data and populates all UI components
// Satisfies Requirements 5.1
// ---------------------------------------------------------------------------

/**
 * Loads transactions from localStorage, assigns them to the module-level
 * `transactions` variable, and renders the list, balance, and chart.
 */
function initState() {
  transactions = StorageAPI.load();
  renderList(transactions);
  renderBalance(transactions);
  renderChart(transactions);
}

// ---------------------------------------------------------------------------
// handleFormSubmit — validates and adds a new transaction
// Satisfies Requirements 1.2, 1.3, 1.4, 1.5
// ---------------------------------------------------------------------------

/**
 * Handles the expense form submit event.
 * Prevents the default browser submission, validates the inputs, and either
 * shows inline errors (on failure) or adds the transaction and resets the
 * form (on success).
 * @param {Event} event
 */
function handleFormSubmit(event) {
  event.preventDefault();

  const nameInput     = document.getElementById("expense-name");
  const amountInput   = document.getElementById("expense-amount");
  const categoryInput = document.getElementById("expense-category");

  const name     = nameInput.value;
  const amount   = amountInput.value;
  const category = categoryInput.value;

  const { valid, errors } = Validator.validate({ name, amount, category });

  if (!valid) {
    renderErrors(errors);
    return;
  }

  // Construct the Transaction object
  const tx = {
    id:        String(Date.now()),
    name:      name.trim(),
    amount:    parseFloat(amount),
    category:  category,
    createdAt: Date.now()
  };

  addTransaction(tx);
  renderErrors({});

  // Reset form fields to their default/empty state
  nameInput.value      = "";
  amountInput.value    = "";
  categoryInput.value  = "";
}

// ---------------------------------------------------------------------------
// handleDeleteClick — event-delegation handler for deleting a transaction
// Satisfies Requirements 2.3
// ---------------------------------------------------------------------------

/**
 * Handles click events on the #transaction-list container using event
 * delegation. Walks up the DOM tree from the clicked target looking for an
 * element with a `data-id` attribute; if found, deletes that transaction.
 * @param {Event} event
 */
function handleDeleteClick(event) {
  const list = document.getElementById("transaction-list");
  let target = event.target;

  // Walk up the DOM until we find a data-id or reach the list container itself
  while (target && target !== list) {
    if (target.dataset && target.dataset.id) {
      deleteTransaction(target.dataset.id);
      return;
    }
    target = target.parentElement;
  }
}

// ---------------------------------------------------------------------------
// init — wires up event listeners and initialises application state
// Satisfies Requirements 5.1, 6.2
// ---------------------------------------------------------------------------

/**
 * Registers all event listeners and loads persisted data.
 * Called once on DOMContentLoaded.
 */
function init() {
  document.getElementById("expense-form")
    .addEventListener("submit", handleFormSubmit);

  document.getElementById("transaction-list")
    .addEventListener("click", handleDeleteClick);

  initState();
}

// ---------------------------------------------------------------------------
// DOMContentLoaded — entry point
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", init);
