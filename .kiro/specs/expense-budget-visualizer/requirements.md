# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web application that allows users to track personal spending by entering transactions, viewing a categorized list, monitoring their total balance, and visualizing spending distribution through a pie chart. The application requires no backend or server — all data persists in the browser via the Local Storage API. It is built with plain HTML, CSS, and vanilla JavaScript, and can run as a standalone web page or browser extension.

## Glossary

- **App**: The Expense & Budget Visualizer single-page web application
- **Transaction**: A single expense entry consisting of an item name, a monetary amount, and a category
- **Category**: A classification label for a transaction; one of: Food, Transport, or Fun
- **Transaction_List**: The scrollable UI component that displays all stored transactions
- **Input_Form**: The HTML form component used to enter new transaction data
- **Balance_Display**: The UI component at the top of the page that shows the total sum of all transaction amounts
- **Chart**: The pie chart component that visualizes spending distribution across categories
- **Local_Storage**: The browser's Web Storage API used for client-side data persistence
- **Validator**: The input validation logic that checks form fields before submission

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to fill in a form with an item name, amount, and category so that I can record a new expense transaction.

#### Acceptance Criteria

1. THE Input_Form SHALL contain a text field for item name (maximum 100 characters), a numeric field for amount (maximum value 999,999,999.99), and a dropdown selector for category with options Food, Transport, and Fun.
2. WHEN the user submits the Input_Form with all fields filled, the item name containing at least one non-whitespace character, and the amount a positive number greater than zero, THE App SHALL add the transaction to the Transaction_List and persist it to Local_Storage.
3. WHEN the user submits the Input_Form with one or more empty fields or the item name containing only whitespace, THE Validator SHALL display an inline error message adjacent to each invalid field indicating what is missing or invalid.
4. WHEN the user submits the Input_Form with an amount of zero, a negative number, or a non-numeric value in the amount field, THE Validator SHALL display an inline error message stating that the amount must be a positive number greater than zero.
5. WHEN a transaction is successfully added, THE Input_Form SHALL reset the item name field to empty, the amount field to empty, and the category dropdown to its default placeholder state.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to see a scrollable list of all my transactions so that I can review what I have recorded.

#### Acceptance Criteria

1. THE Transaction_List SHALL display each transaction as a list item showing the item name, monetary amount (formatted with a currency symbol and two decimal places), and category label.
2. WHILE the number of transactions exceeds the visible area of the Transaction_List container, THE Transaction_List SHALL be vertically scrollable so that all entries remain accessible without resizing the page layout.
3. WHEN the user clicks the delete control on a transaction list item, THE App SHALL immediately remove that specific transaction from the Transaction_List UI and delete it from Local_Storage, leaving all other transactions intact.
4. WHEN no transactions are stored, THE Transaction_List SHALL display a visible placeholder message (e.g., "No transactions yet") in place of the list entries.

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my total spending balance at the top of the page so that I know how much I have spent in total.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all transaction amounts formatted as a currency symbol followed by the numeric total with exactly two decimal places (e.g., "$10.50").
2. WHEN a transaction is added, THE Balance_Display SHALL recalculate the total as the sum of all current transaction amounts and update the displayed value without requiring a page reload.
3. WHEN a transaction is deleted, THE Balance_Display SHALL recalculate the total as the sum of all remaining transaction amounts and update the displayed value without requiring a page reload.
4. WHEN no transactions are stored, THE Balance_Display SHALL display a total of zero formatted as a currency symbol followed by "0.00" (e.g., "$0.00").

---

### Requirement 4: Spending Distribution Chart

**User Story:** As a user, I want to see a pie chart of my spending by category so that I can understand where my money is going.

#### Acceptance Criteria

1. WHERE at least one transaction exists, THE Chart SHALL render a pie chart in which each segment represents a category (Food, Transport, Fun) that has at least one transaction, with each segment's arc proportional to that category's share of total spending, and each segment visually distinguishable by a distinct fill color and a visible label identifying the category name.
2. WHEN a transaction is added, THE Chart SHALL recalculate category totals and re-render the updated pie chart within 1 second without requiring a page reload.
3. WHEN a transaction is deleted, THE Chart SHALL recalculate category totals and re-render the updated pie chart within 1 second without requiring a page reload.
4. WHEN only one category has transactions, THE Chart SHALL render a full single-segment pie chart covering 360 degrees for that category.
5. WHEN no transactions are stored, THE Chart SHALL display a visible placeholder containing text (e.g., "No data to display") instead of rendering any chart segments; this placeholder takes precedence over all other chart rendering criteria.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my transactions to be saved between sessions so that I do not lose my data when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN the App initializes, THE App SHALL read all previously stored transactions from Local_Storage using a fixed key (e.g., `"expense_transactions"`) and populate the Transaction_List, Balance_Display, and Chart with that data before the user can interact.
2. WHEN a transaction is added, THE App SHALL serialize the complete updated transaction list as a JSON string and write it to Local_Storage under the fixed key before updating the UI.
3. WHEN a transaction is deleted, THE App SHALL serialize the complete remaining transaction list as a JSON string and write it to Local_Storage under the fixed key before updating the UI.
4. IF Local_Storage is unavailable or read returns invalid data, THE App SHALL initialize with an empty transaction list without throwing an unhandled error.

---

### Requirement 6: File and Code Structure

**User Story:** As a developer, I want the project to follow a clean folder structure so that the code is easy to maintain and extend.

#### Acceptance Criteria

1. THE App SHALL be structured with exactly one HTML file at the project root (`index.html`), exactly one CSS file inside a `css/` directory (`css/style.css`), and exactly one JavaScript file inside a `js/` directory (`js/app.js`); no other HTML, CSS, or JS source files shall exist in these locations.
2. THE App SHALL load and render the full UI correctly in the latest stable versions of Chrome, Firefox, Edge, and Safari using only standard web platform APIs, without requiring polyfills, transpilation, or a build step.
3. THE App SHALL produce no `console.error` or uncaught exception output during normal operation (add, delete, load) in any supported browser.

---

### Requirement 7: Performance and Responsiveness

**User Story:** As a user, I want the app to feel fast and responsive so that my interactions are smooth and immediate.

#### Acceptance Criteria

1. WHEN the App loads in a modern browser on a standard consumer device over a standard broadband connection (≥10 Mbps), THE App SHALL complete initial render and display all persisted transactions within 3 seconds of the page load event.
2. WHEN the user adds or deletes a transaction on a device with at least 4 GB RAM and a modern browser, THE App SHALL complete all updates to the Transaction_List, Balance_Display, and Chart and return control to the user within 300 milliseconds.
