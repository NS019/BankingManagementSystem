// Ye file sirf TEMPORARY dummy data rakhti hai. Backend ready hote hi poora
// src/mock folder delete ho jaayega. Isliye alag folder mein rakha, taaki
// asli code se mix na ho.
//
// Shape (field ke naam) dhyan se rakhe hain: id, accountNumber, type, balance...
// Yahi shape baad mein Spring Boot ke DTO mein jaayegi. Abhi sahi socha toh
// backend banate waqt frontend badalna nahi padega.
// Paise: abhi number use kar rahe hain. Backend mein BigDecimal hoga (float
// mein 0.1 + 0.2 = 0.30000000000000004 jaisi galtiyan aati hain, banking mein nahi chalta).

export const accounts = [
  { id: 1, accountNumber: "SB1001234567", holder: "Neeti Sharma", type: "Savings", balance: 125000, status: "ACTIVE" },
  { id: 2, accountNumber: "CA2009876543", holder: "Neeti Sharma", type: "Current", balance: 48000, status: "ACTIVE" },
  { id: 3, accountNumber: "FD3005550001", holder: "Neeti Sharma", type: "Fixed Deposit", balance: 300000, status: "ACTIVE" },
];

// accountId se link hai (foreign key jaisa). Real DB mein ye alag table hogi
// jiska account_id column accounts table ko point karega.
export const transactions = [
  { id: 101, accountId: 1, type: "CREDIT", amount: 50000, description: "Salary", date: "2026-10-01" },
  { id: 102, accountId: 1, type: "DEBIT", amount: 1200, description: "Electricity bill", date: "2026-10-05" },
  { id: 103, accountId: 1, type: "DEBIT", amount: 8000, description: "Transfer to Shweta", date: "2026-10-12" },
  { id: 104, accountId: 2, type: "CREDIT", amount: 15000, description: "Freelance payment", date: "2026-10-15" },
];

// Logged-in user ki profile. kycStatus ke 4 haalat: PENDING -> SUBMITTED -> VERIFIED / REJECTED.
// Ye status backend ke enum (KycStatus) mein bhi aayega.
// panNumber abhi khaali hai, kyunki user ne KYC bhara hi nahi.
export const profile = {
  id: 1,
  name: "Neeti Sharma",
  email: "neeti.sharma@example.com",
  phone: "+91 98765 43210",
  kycStatus: "PENDING",
  panNumber: "",
  address: "",
};

// createdAt ISO format mein (timezone ke saath sorting aur formatting dono safe rehte hain).
// Real mein ye notification-service ki apni DB table hogi, jise RabbitMQ events bharenge.
export const notifications = [
  { id: 1, title: "Salary credited", message: "₹50,000 credited to Savings SB1001234567", createdAt: "2026-10-01T09:30:00", read: false },
  { id: 2, title: "Bill payment", message: "₹1,200 debited for Electricity bill", createdAt: "2026-10-05T18:10:00", read: false },
  { id: 3, title: "Transfer successful", message: "₹8,000 sent to Shweta", createdAt: "2026-10-12T11:45:00", read: true },
];