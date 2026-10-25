import { accounts, transactions } from "../mock/data";

// Nakli network delay. Real API 200-800ms leti hai. Delay ke bina hum "loading"
// state kabhi dekhenge hi nahi, aur baad mein asli backend par UI ki ye
// kamzori achanak pakdi jaayegi. Isliye ab hi delay rakh ke test karte hain.
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// "async" function hamesha Promise return karta hai, bilkul axios ke jaisa.
// Isliye jab baad mein body badal ke axios call karenge, calling code (pages)
// mein ek bhi line nahi badlegi. Yahi poore design ka raaz hai.
export async function getAccounts() {
  await delay(600);
  // Copy return karte hain ([...accounts]), original nahi, taaki koi page
  // galti se mock data ko badal na de (mutation bug se bachne ke liye).
  return [...accounts];

  // BAAD MEIN yahan ye aayega:
  // const res = await axiosClient.get("/api/accounts");
  // return res.data;
}

export async function getTransactions(accountId) {
  await delay(400);
  return transactions.filter((t) => t.accountId === accountId);
}
// Ek account ka data. Parameter "id" URL se string ban ke aata hai ("2"), number nahi.
// Isliye neeche Number(id) se convert karte hain. Ye sabse common beginner bug hai:
// "2" === 2 false hota hai, toh find() kuch nahi dhundta aur page blank aata hai.
export async function getAccountById(id) {
  await delay(400);
  const account = accounts.find((a) => a.id === Number(id));

  // Account na mile toh error throw karo, jaise real API 404 deti hai.
  // Calling page ka try/catch ise pakad ke user ko message dikhayega.
  if (!account) throw new Error("Account not found");
// PEHLE: return [...accounts];  (sirf array ki copy, andar ke objects wahi purane)
// Ab transfer mock data ke balance badlega. [...accounts] sirf bahar ka dabba copy karta hai,
// andar ke account objects same rehte hain. Isliye har object ki bhi copy banate hain.
// Real backend mein ye masla hi nahi hoga, kyunki har response naya JSON hota hai.
return account;

  // BAAD MEIN: const res = await axiosClient.get(`/api/accounts/${id}`); return res.data;
}
// Transfer ka nakli backend. Ye function asli kaam ki jagah le raha hai, isliye
// isme wahi validations hain jo real backend karega (frontend par bharosa nahi).
export async function transferFunds({ fromAccountId, toAccountNumber, amount, remark }) {
  await delay(800);

  const from = accounts.find((a) => a.id === Number(fromAccountId));
  if (!from) throw new Error("Source account not found");
  if (amount <= 0) throw new Error("Amount must be greater than zero");
  if (from.balance < amount) throw new Error("Insufficient balance");
  if (from.accountNumber === toAccountNumber) throw new Error("Cannot transfer to the same account");

  // Debit: mock data seedha badal rahe hain (mutation). Ye SIRF mock ke liye hai.
  // Asli backend mein ye ek DB transaction hoga (@Transactional), jisme debit aur credit
  // dono saath hote hain ya dono nahi. Microservices mein ye Saga pattern se hoga.
  from.balance -= amount;

  // Agar "to" account humare mock mein hai toh credit karo (apne accounts ke beech transfer).
  // Nahi hai toh maan lo wo doosre bank ka beneficiary hai.
  const to = accounts.find((a) => a.accountNumber === toAccountNumber);
  if (to) to.balance += amount;

  const date = new Date().toISOString().slice(0, 10); // "2026-10-25" format
  transactions.push({ id: Date.now(), accountId: from.id, type: "DEBIT", amount, description: remark || `Transfer to ${toAccountNumber}`, date });
  if (to) transactions.push({ id: Date.now() + 1, accountId: to.id, type: "CREDIT", amount, description: remark || `Transfer from ${from.accountNumber}`, date });

  // Reference ID user ko dikhate hain, taaki complaint par bank ye ID se transaction dhundh sake.
  return { referenceId: `TXN${Date.now()}`, newBalance: from.balance };

  // BAAD MEIN: axiosClient.post("/api/transactions/transfer", body, { headers: { "Idempotency-Key": ... } })
  // Idempotency key isliye ki network atakne par user button dobara dabaye toh paise DO baar na kate.
}

// Business rules ke limits. Real backend mein ye database ya config se aate hain
// (RBI/bank ke rules badal sakte hain), code mein hard-code nahi hote. Frontend mein
// copy sirf jaldi feedback ke liye hai. Asli check backend hi karega.
const DEPOSIT_LIMIT = 200000;
const WITHDRAW_LIMIT = 50000;

// Deposit aur withdraw ka kaam 90% same hai, isliye ek internal helper (export nahi kiya).
// DRY (Don't Repeat Yourself): bug fix ek jagah karna padega, do jagah nahi.
function applyTransaction({ accountId, amount, remark, type }) {
  const account = accounts.find((a) => a.id === Number(accountId));
  if (!account) throw new Error("Account not found");
  if (amount <= 0) throw new Error("Amount must be greater than zero");

  if (type === "CREDIT") {
    if (amount > DEPOSIT_LIMIT) throw new Error("Deposit limit per transaction is ₹2,00,000");
    account.balance += amount;
  } else {
    if (amount > WITHDRAW_LIMIT) throw new Error("Withdrawal limit per transaction is ₹50,000");
    if (account.balance < amount) throw new Error("Insufficient balance");
    account.balance -= amount;
  }

  const date = new Date().toISOString().slice(0, 10);
  transactions.push({
    id: Date.now(),
    accountId: account.id,
    type,
    amount,
    description: remark || (type === "CREDIT" ? "Cash deposit" : "Cash withdrawal"),
    date,
  });

  return { referenceId: `TXN${Date.now()}`, newBalance: account.balance };
}

// CREDIT = account mein paisa aaya, DEBIT = paisa gaya. Ye banking ki standard bhasha hai,
// aur backend ke enum (TransactionType) mein bhi yahi naam rakhenge.
export async function depositFunds(payload) {
  await delay(600);
  return applyTransaction({ ...payload, type: "CREDIT" });
  // BAADMEIN: (await axiosClient.post("/api/transactions/deposit", payload)).data
}

export async function withdrawFunds(payload) {
  await delay(600);
  return applyTransaction({ ...payload, type: "DEBIT" });
  // BAADMEIN: (await axiosClient.post("/api/transactions/withdraw", payload)).data
}

// Saare accounts ki saari transactions. Real backend mein ye endpoint PAGINATED hoga
// (GET /api/transactions?page=0&size=20&type=DEBIT&from=...&to=...), kyunki 5 saal
// ki history 50,000+ rows ho sakti hai aur sab browser mein laana na network ke liye
// theek hai na memory ke liye. Filtering bhi tab server (SQL WHERE) par hogi, browser par nahi.
// Abhi mock hai, isliye saara data laakar frontend par filter karenge (seekhne ke liye).
export async function getAllTransactions() {
  await delay(500);
  // Har object ki copy, taaki page galti se mock data na badal de.
  return transactions.map((t) => ({ ...t }));
  // BAAD MEIN: (await axiosClient.get("/api/transactions", { params })).data
}