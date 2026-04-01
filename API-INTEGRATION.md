# API Integration Specifications

This document outlines the required backend API endpoints based on the current front-end implementation of the **Policy-First Expense Auditor**. The backend (expected to be built in Python/FastAPI) must implement these endpoints to fully support the React frontend.

## 1. Employee Portal

### 1.1. Submit New Expense Claim
Accepts a receipt file and user justification to be processed by the OCR and AI Policy Auditor.

- **Endpoint:** `POST /api/v1/expenses`
- **Content-Type:** `multipart/form-data`
- **Request Payload:**
  - `file`: (File) The uploaded receipt image or PDF (Accepted formats: PNG, JPG, JPEG, PDF. Max size: 10MB).
  - `businessPurpose`: (String) The employee's explanation for the expense.
- **Expected Responses:**
  - **202 Accepted:** Expense successfully uploaded and sent to the asynchronous AI auditor queue.
    ```json
    {
      "status": "success",
      "message": "Receipt securely sent to AI Auditor",
      "expenseId": "exp_12345"
    }
    ```
  - **400 Bad Request (Validation Error):** The frontend relies on backend validation for dates and other rules.
    ```json
    {
      "status": "error",
      "code": "VALIDATION_FAILED",
      "message": "The date on the receipt does not match the claimed expense date. Please review."
    }
    ```

---

## 2. Finance Dashboard

### 2.1. Get Pending Claims List
Fetches a list of processed expenses to display on the Finance Auditor Dashboard.

- **Endpoint:** `GET /api/v1/expenses`
- **Query Parameters:**
  - `status`: (Optional) Filter by status (e.g., `pending`, `reviewed`).
- **Expected Response:**
  - **200 OK:**
    ```json
    {
      "data": [
        {
          "id": "exp_12345",
          "employeeName": "John Doe",
          "date": "2026-10-24",
          "amount": 450.00,
          "category": "Lodging",
          "riskLevel": "Rejected" // Options: "Approved", "Flagged", "Rejected"
        },
        {
          "id": "exp_12346",
          "employeeName": "Jane Smith",
          "date": "2026-10-25",
          "amount": 120.50,
          "category": "Meals",
          "riskLevel": "Flagged"
        }
      ],
      "meta": {
        "totalCount": 2
      }
    }
    ```

---

## 3. Audit Detail View

### 3.1. Get Expense Audit Details
Fetches detailed extracted OCR data and the AI's reasoning for a specific expense claim.

- **Endpoint:** `GET /api/v1/expenses/{id}`
- **Path Parameters:**
  - `id`: The unique identifier of the expense claim.
- **Expected Response:**
  - **200 OK:**
    ```json
    {
      "id": "exp_12345",
      "receiptImageUrl": "https://storage.provider.com/receipts/exp_12345.jpg",
      "extractedData": {
        "merchantName": "Starbucks",
        "date": "2025-10-24",
        "totalAmount": 15.50,
        "currency": "USD"
      },
      "aiAudit": {
        "status": "Flagged",
        "reasoning": "Meal expense on a weekend requires manual review per Policy Section 4.B. (Weekend & Off-Hours Spend)."
      }
    }
    ```

### 3.2. Override / Finalize Claim Decision
Allows the human auditor to approve or reject a claim, overriding or confirming the AI's decision.

- **Endpoint:** `POST /api/v1/expenses/{id}/decision`
- **Content-Type:** `application/json`
- **Request Payload:**
  - `action`: (String) `"APPROVE"` or `"REJECT"`.
  - `auditorComments`: (String) Text from the override textarea.
- **Expected Response:**
  - **200 OK:**
    ```json
    {
      "status": "success",
      "message": "Claim decision recorded successfully."
    }
    ```

---

## 4. Global Navigation & Notifications

### 4.1. Get User Notifications
Fetches the dropdown notifications for the current user.

- **Endpoint:** `GET /api/v1/notifications`
- **Expected Response:**
  - **200 OK:**
    ```json
    {
      "data": [
        {
          "id": "notif_001",
          "type": "error", // Use "error" for red dot, "success" for green dot
          "title": "Action Required",
          "message": "Uber receipt is too blurry. Please re-upload.",
          "isRead": false,
          "createdAt": "2026-04-01T10:00:00Z"
        },
        {
          "id": "notif_002",
          "type": "success",
          "title": "Success",
          "message": "Team Lunch expense has been approved.",
          "isRead": false,
          "createdAt": "2026-04-01T09:30:00Z"
        }
      ]
    }
    ```