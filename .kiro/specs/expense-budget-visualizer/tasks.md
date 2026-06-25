# Implementation Plan: Expense & Budget Visualizer

## Overview

Implement a fully client-side expense tracker as a single-page web application using plain HTML, CSS, and vanilla JavaScript. The implementation follows the module pattern defined in the design, building up from project structure and data models through core logic, UI rendering, and event wiring.

## Tasks

- [x] 1. Set up project structure and static HTML skeleton
  - Create `index.html` at the project root with the full page layout: Balance_Display section, Input_Form (name text field, amount number field, category dropdown with Food/Transport/Fun options, submit button), Transaction_List container, and a `<canvas>` element for the pie chart with a fallback `<p>` placeholder
  - Create `css/style.css` inside a `css/` directory (file may be empty or contain basic resets for now)
  - Create `js/app.js` inside a `js/` directory (file may be empty or contain a DOMContentLoaded stub)
  - Link `css/style.css` and `js/app.js` from `index.html`
  - _Requirements: 6.1, 6.2_

- [x] 2. Implement StorageAPI and data model
  - [x] 2.1 Implement `StorageAPI` in `js/app.js`
    - Define the `StorageAPI` object with `KEY = "expense_transactions"`, `load()` (wraps `localStorage.getItem` + `JSON.parse` in try/catch, returns `[]` on any failure), and `save(transactions)` (wraps `JSON.stringify` + `localStorage.setItem` in try/catch, silently ignores errors)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_


- [x] 3. Implement Validator
  - [x] 3.1 Implement `Validator.validateName` and `Validator.validateAmount` in `js/app.js`
    - `validateName(name)`: trim input; return `{ valid: false, error: "..." }` if result is empty or length > 100; otherwise `{ valid: true }`
    - `validateAmount(amount)`: parse with `parseFloat`; return `{ valid: false, error: "..." }` if result is NaN, ≤ 0, or > 999999999.99; otherwise `{ valid: true }`
    - Implement `Validator.validate(input)` to call both sub-validators and return combined `{ valid, errors }` result
    - _Requirements: 1.1, 1.2, 1.3, 1.4_



- [x] 4. Implement State Manager and pure computation functions
  - [x] 4.1 Implement in-memory state and `computeBalance` / `computeCategoryTotals` in `js/app.js`
    - Declare module-level `let transactions = []`
    - Implement `computeBalance(transactions)`: returns the sum of all `tx.amount` values (returns `0` for empty array)
    - Implement `computeCategoryTotals(transactions)`: returns `{ Food: number, Transport: number, Fun: number }` by summing amounts per category
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1_


- [x] 5. Implement `addTransaction` and `deleteTransaction` with property tests
  - [x] 5.1 Implement `addTransaction(tx)` and `deleteTransaction(id)` in `js/app.js`
    - `addTransaction(tx)`: push `tx` onto `transactions`, call `StorageAPI.save(transactions)`
    - `deleteTransaction(id)`: filter out the transaction with matching `id`, reassign `transactions`, call `StorageAPI.save(transactions)`
    - Both functions call all renderers after mutating state
    - _Requirements: 1.2, 2.3, 5.2, 5.3_

 

- [ ] 6. Checkpoint — Ensure all logic tests pass
  - Run the test suite. Ensure all Validator, StorageAPI, computeBalance, computeCategoryTotals, addTransaction, and deleteTransaction tests pass. Ask the user if any questions arise before continuing.

- [x] 7. Implement UI Renderer functions
  - [x] 7.1 Implement `renderList(transactions)` in `js/app.js`
    - Clear the Transaction_List container and re-render all transactions as list items, each showing item name, formatted amount (currency symbol + 2 decimal places), category label, and a delete button with `data-id` attribute
    - Show "No transactions yet" placeholder when array is empty
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 7.2 Implement `renderBalance(transactions)` in `js/app.js`
    - Call `computeBalance(transactions)` and update the Balance_Display element with the result formatted as `$X.XX`
    - Show `$0.00` when array is empty
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 7.3 Implement `renderChart(transactions)` in `js/app.js`
    - Call `computeCategoryTotals(transactions)` and draw the pie chart onto the `<canvas>` element using the Canvas 2D API
    - Each segment: arc proportional to category share of total, distinct fill color, visible category label
    - Show "No data to display" placeholder (and hide canvas) when array is empty
    - Handle Canvas API being unavailable (hide canvas, show fallback `<p>`)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 7.4 Implement `renderErrors(errors)` in `js/app.js`
    - Accept `{ name?, amount?, category? }` errors object
    - Insert/update inline error message elements adjacent to the corresponding form fields
    - Clear all error messages when called with an empty object `{}`
    - _Requirements: 1.3, 1.4_

- [x] 8. Implement `initState`, `handleFormSubmit`, `handleDeleteClick`, and `init`
  - [x] 8.1 Implement `initState()` in `js/app.js`
    - Call `StorageAPI.load()`, assign result to `transactions`, then call `renderList`, `renderBalance`, and `renderChart`
    - _Requirements: 5.1_

  - [x] 8.2 Implement `handleFormSubmit(event)` in `js/app.js`
    - Prevent default form submission
    - Read name, amount, and category values from the form
    - Call `Validator.validate({ name, amount, category })`
    - On invalid: call `renderErrors(errors)` and return (do NOT reset form)
    - On valid: construct a Transaction object with a timestamp-based `id` and `createdAt`, call `addTransaction(tx)`, call `renderErrors({})` to clear errors, reset the form fields (name to empty, amount to empty, category to default)
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [x] 8.3 Implement `handleDeleteClick(event)` using event delegation in `js/app.js`
    - Listen on the Transaction_List container for clicks
    - If the clicked target has a `data-id` attribute (or is inside a delete button with one), extract the `id` and call `deleteTransaction(id)`
    - _Requirements: 2.3_

  - [x] 8.4 Implement `init()` and wire up `DOMContentLoaded` in `js/app.js`
    - Register `handleFormSubmit` on the `#expense-form` submit event
    - Register `handleDeleteClick` on the `#transaction-list` click event (event delegation)
    - Call `initState()`
    - Call `init()` on `DOMContentLoaded`
    - _Requirements: 5.1, 6.2_

- [x] 9. Implement CSS styling in `css/style.css`
  - Style the Balance_Display to be prominent at the top of the page
  - Style the Input_Form with appropriate field widths and inline error message styles
  - Style the Transaction_List as a vertically scrollable container (fixed height, `overflow-y: auto`) so it scrolls when entries overflow
  - Style the Chart canvas and its placeholder
  - Ensure the layout renders correctly in Chrome, Firefox, Edge, and Safari
  - _Requirements: 2.2, 6.2_

- [ ] 10. Final checkpoint — Ensure all tests pass and app loads correctly
  - Run the full test suite and confirm all tests pass
  - Open `index.html` in a browser and verify: initial render with persisted data, add a transaction (list, balance, and chart update), delete a transaction, and empty state placeholders all work correctly
  - Ensure no `console.error` or uncaught exceptions appear during normal operation
  - Ask the user if any questions arise.
  - _Requirements: 6.3, 7.1, 7.2_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) with a minimum of 100 iterations per property
- Each property test task references the corresponding property number from the design document
- Checkpoints (tasks 6 and 10) ensure incremental validation before moving on
- All state mutations go through `StorageAPI.save` before updating the UI to guarantee persistence

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.4", "3.5", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "7.1", "7.2", "7.3", "7.4"] },
    { "id": 5, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 6, "tasks": ["8.4"] }
  ]
}
```
