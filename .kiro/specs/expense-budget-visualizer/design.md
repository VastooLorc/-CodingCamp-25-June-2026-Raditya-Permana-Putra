# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a fully client-side, single-page web application built with plain HTML, CSS, and vanilla JavaScript. It lets users record expense transactions (item name, amount, category), browse a scrollable transaction list, monitor their running total balance, and visualize spending distribution through a pie chart. All data persists between sessions using the browser's `localStorage` API under the key `"expense_transactions"`. No server, build step, or third-party libraries are required.

### Goals

- Provide a fast, lightweight expense tracker that works directly in the browser
- Persist data locally so no account or backend is needed
- Render a real-time pie chart that updates on every add/delete action
- Maintain clean separation between data logic and UI rendering

### Non-Goals

- Multi-user support or cloud sync
- Currency conversion or multiple currency symbols
- Editing existing transactions (only add and delete)
- Exporting data to CSV/PDF

---

## Architecture

The application follows a **Module Pattern** inside a single `js/app.js` file, organized into clearly separated layers:

```
┌─────────────────────────────────────────────┐
│                  index.html                  │
│         (structure + canvas/svg element)     │
└────────────────┬────────────────────────────┘
                 │ loads
                 ▼
┌─────────────────────────────────────────────┐
│                  js/app.js                   │
│                                             │
│  ┌─────────────┐   ┌─────────────────────┐  │
│  │ StorageAPI  │   │     Validator        │  │
│  │ (read/write)│   │  (pure functions)    │  │
│  └──────┬──────┘   └──────────┬──────────┘  │
│         │                     │             │
│  ┌──────▼─────────────────────▼──────────┐  │
│  │           State Manager               │  │
│  │  (in-memory transaction array)        │  │
│  └──────────────────┬────────────────────┘  │
│                     │                       │
│  ┌──────────────────▼────────────────────┐  │
│  │            UI Renderer                │  │
│  │  renderList() │ renderBalance()       │  │
│  │  renderChart()│ renderErrors()        │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Data Flow

1. **App Init** → `StorageAPI.load()` → populate in-memory state → call all renderers
2. **Add Transaction** → `Validator.validate()` → on success: `StorageAPI.save()` + update state + call all renderers; on failure: `renderErrors()`
3. **Delete Transaction** → `StorageAPI.save()` + update state + call all renderers

All render calls are synchronous and complete within the 300 ms budget on modern hardware.

---

## Components and Interfaces

### 1. StorageAPI

Responsible for reading and writing the transaction list to `localStorage`.

```js
// StorageAPI
const StorageAPI = {
  KEY: "expense_transactions",

  /**
   * Load transactions from localStorage.
   * Returns an empty array if localStorage is unavailable or data is invalid.
   * @returns {Transaction[]}
   */
  load() { /* ... */ },

  /**
   * Persist the full transaction array to localStorage as JSON.
   * Silently catches errors if localStorage is unavailable.
   * @param {Transaction[]} transactions
   */
  save(transactions) { /* ... */ }
};
```

### 2. Validator

Pure functions that validate Input_Form fields. No side effects — returns structured result objects.

```js
// Validator
const Validator = {
  /**
   * Validates a raw form submission object.
   * @param {{ name: string, amount: string, category: string }} input
   * @returns {{ valid: boolean, errors: { name?: string, amount?: string, category?: string } }}
   */
  validate(input) { /* ... */ },

  /**
   * Validates item name: must contain at least one non-whitespace character,
   * max 100 characters.
   * @param {string} name
   * @returns {{ valid: boolean, error?: string }}
   */
  validateName(name) { /* ... */ },

  /**
   * Validates amount: must parse as a positive finite number greater than zero,
   * max 999,999,999.99.
   * @param {string} amount
   * @returns {{ valid: boolean, error?: string }}
   */
  validateAmount(amount) { /* ... */ }
};
```

### 3. State Manager

A plain module-level array holding the current transaction list in memory.

```js
let transactions = []; // Transaction[]

function addTransaction(tx) { /* push + save + render */ }
function deleteTransaction(id) { /* filter + save + render */ }
function initState() { /* load + render */ }
```

### 4. UI Renderer

Functions that read from the `transactions` array and update the DOM. Each renderer is idempotent — calling it multiple times with the same state produces the same result.

```js
/**
 * Renders the transaction list. Shows placeholder if empty.
 * @param {Transaction[]} transactions
 */
function renderList(transactions) { /* ... */ }

/**
 * Calculates and displays the total balance.
 * @param {Transaction[]} transactions
 */
function renderBalance(transactions) { /* ... */ }

/**
 * Draws the pie chart using Canvas API.
 * Shows placeholder text if transactions is empty.
 * @param {Transaction[]} transactions
 */
function renderChart(transactions) { /* ... */ }

/**
 * Renders inline validation error messages.
 * Clears all errors if called with an empty errors object.
 * @param {{ name?: string, amount?: string, category?: string }} errors
 */
function renderErrors(errors) { /* ... */ }
```

### 5. Event Handlers

Wired up in a single `init()` function called on `DOMContentLoaded`.

```js
function init() {
  document.getElementById("expense-form")
    .addEventListener("submit", handleFormSubmit);
  document.getElementById("transaction-list")
    .addEventListener("click", handleDeleteClick); // event delegation
  initState();
}
```

---

## Data Models

### Transaction Object

```js
/**
 * @typedef {Object} Transaction
 * @property {string}  id        - UUID or timestamp-based unique identifier
 * @property {string}  name      - Item name (1–100 non-whitespace-trimmed chars)
 * @property {number}  amount    - Positive float, max 999999999.99
 * @property {string}  category  - One of: "Food" | "Transport" | "Fun"
 * @property {number}  createdAt - Unix timestamp (ms) of creation
 */
```

### localStorage Schema

The single key `"expense_transactions"` stores a JSON-serialized array of Transaction objects:

```json
[
  {
    "id": "1718000000000",
    "name": "Lunch",
    "amount": 12.50,
    "category": "Food",
    "createdAt": 1718000000000
  }
]
```

### ValidationResult Object

```js
/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {{ name?: string, amount?: string, category?: string }} errors
 */
```

### CategoryTotals Object (internal, used by renderChart)

```js
/**
 * @typedef {Object} CategoryTotals
 * @property {number} Food
 * @property {number} Transport
 * @property {number} Fun
 */
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Whitespace-only names are always invalid

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), `Validator.validateName` SHALL return `{ valid: false }`.

**Validates: Requirements 1.3**

---

### Property 2: Non-positive amounts are always invalid

*For any* numeric string representing zero, a negative number, or the string `"0"`, `Validator.validateAmount` SHALL return `{ valid: false }`.

**Validates: Requirements 1.4**

---

### Property 3: Valid input passes validation

*For any* non-whitespace item name with 1–100 characters and any amount string representing a positive finite number ≤ 999,999,999.99, `Validator.validate` SHALL return `{ valid: true, errors: {} }`.

**Validates: Requirements 1.2, 1.3, 1.4**

---

### Property 4: Transaction serialization round-trip

*For any* array of Transaction objects, `JSON.parse(JSON.stringify(transactions))` SHALL produce an array that is deeply equal to the original — meaning that loading after saving always recovers the exact same data.

**Validates: Requirements 5.2, 5.3**

---

### Property 5: Balance equals sum of amounts

*For any* array of Transaction objects, `computeBalance(transactions)` SHALL equal the sum of every `transaction.amount` in the array, to within floating-point tolerance (±0.001).

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

---

### Property 6: Chart category totals are consistent with transaction list

*For any* array of Transaction objects, `computeCategoryTotals(transactions)` SHALL produce totals where the sum of all category values equals `computeBalance(transactions)` to within floating-point tolerance (±0.001).

**Validates: Requirements 4.1, 4.2, 4.3**

---

### Property 7: Adding a transaction grows the list by exactly one

*For any* existing transaction list and any valid new transaction, after calling `addTransaction`, the resulting list SHALL have exactly one more element than before, and the new element SHALL appear in the list.

**Validates: Requirements 1.2, 2.1**

---

### Property 8: Deleting a transaction removes only that transaction

*For any* transaction list containing a transaction with a given `id`, after calling `deleteTransaction(id)`, the resulting list SHALL not contain any transaction with that `id`, and all other transactions SHALL remain intact.

**Validates: Requirements 2.3**

---

## Error Handling

| Scenario | Behavior |
|---|---|
| `localStorage` unavailable (private browsing, quota exceeded) | `StorageAPI.load()` returns `[]`; `StorageAPI.save()` silently catches the error; app continues normally |
| `localStorage` contains malformed JSON | `JSON.parse` is wrapped in try/catch; falls back to `[]` |
| Form submitted with empty or whitespace name | Validator returns error; `renderErrors()` shows inline message; form is NOT reset |
| Form submitted with zero, negative, or non-numeric amount | Validator returns error; inline error shown; form is NOT reset |
| Canvas API unsupported | Canvas element hidden; placeholder text shown via fallback `<p>` |
| Transaction array is empty | `renderChart()` shows "No data to display" placeholder; `renderList()` shows "No transactions yet"; `renderBalance()` shows "$0.00" |

All error paths are handled without `console.error` or uncaught exceptions during normal operation (add, delete, load).

---

## Testing Strategy

### Unit Tests

Unit tests cover specific examples and edge cases for the pure logic modules (`Validator`, `StorageAPI`, balance calculation, category totals).

**Key unit test cases:**

- `validateName("")` → invalid
- `validateName("   ")` → invalid (whitespace only)
- `validateName("a".repeat(101))` → invalid (exceeds max length)
- `validateName("Lunch")` → valid
- `validateAmount("0")` → invalid
- `validateAmount("-5")` → invalid
- `validateAmount("abc")` → invalid
- `validateAmount("12.50")` → valid
- `computeBalance([])` → `0`
- `computeBalance([{amount:5},{amount:3.25}])` → `8.25`
- `StorageAPI.load()` with invalid JSON in `localStorage` → returns `[]`
- `StorageAPI.load()` with `localStorage` unavailable → returns `[]`

### Property-Based Tests

Property-based testing is appropriate for this feature's pure logic layer (Validator, balance computation, serialization, list mutation). UI rendering is excluded from PBT.

**Library**: [fast-check](https://github.com/dubzzz/fast-check) (JavaScript PBT library)

**Configuration**: Minimum 100 iterations per property test.

**Tag format**: `Feature: expense-budget-visualizer, Property {N}: {property_text}`

| Property | Test Description | Arbitraries |
|---|---|---|
| P1: Whitespace names invalid | Generate strings of `\t`, `\n`, `\r`, ` ` only | `fc.stringOf(fc.constantFrom(' ','\t','\n'))` |
| P2: Non-positive amounts invalid | Generate 0, negative numbers, non-numeric strings | `fc.oneof(fc.constant("0"), fc.integer({max:0}).map(String), fc.string())` |
| P3: Valid input passes validation | Generate valid names + amounts | `fc.tuple(validNameArb, validAmountArb)` |
| P4: Serialization round-trip | Generate arrays of Transaction objects | `fc.array(transactionArb)` |
| P5: Balance equals sum | Generate arrays of Transaction objects | `fc.array(transactionArb)` |
| P6: Category totals sum to balance | Generate arrays of Transaction objects | `fc.array(transactionArb)` |
| P7: Add grows list by one | Generate list + valid new transaction | `fc.tuple(fc.array(transactionArb), transactionArb)` |
| P8: Delete removes only target | Generate list with ≥1 transaction | `fc.array(transactionArb, {minLength:1})` |

### Integration / Smoke Tests

- App loads in Chrome, Firefox, Edge, Safari without `console.error`
- Initial render completes with persisted data before first interaction
- Add then refresh: transaction persists across page reload
- Delete then refresh: transaction is gone after page reload
- `localStorage` full: app does not crash, shows a graceful notice

### Performance Targets

- Initial render < 3 s (verified manually or with Lighthouse)
- Add/delete updates to list, balance, and chart < 300 ms (verified with `performance.now()` timing in tests)
