import { profile, notifications } from "../mock/data";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// PAN ka standard format: 5 letters + 4 digits + 1 letter (jaise AAAAA9999A).
// Ye regex backend mein bhi lagegi. Frontend ki copy sirf jaldi feedback ke liye hai.
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

// PAN ko mask karte hain: "ABCDE1234F" -> "AB******4F".
// PRODUCTION RULE: browser ko poora PAN kabhi wapas nahi bhejte. Backend masked hi return
// karta hai, aur DB mein encrypt karke rakhta hai. Isse XSS ya logs se leak ka risk kam hota.
// Mock mein bhi wahi aadat daal rahe hain, taaki frontend kabhi poora PAN dekh hi na paaye.
const maskPan = (pan) => (pan ? `${pan.slice(0, 2)}******${pan.slice(-2)}` : "");

// Mock object ko seedha return nahi karte (copy + masked), taaki page use badal na sake.
const toClient = (p) => ({ ...p, panNumber: maskPan(p.panNumber) });

export async function getProfile() {
  await delay(400);
  return toClient(profile);
  // BAAD MEIN: (await axiosClient.get("/api/customers/me")).data
}

export async function submitKyc({ panNumber, address }) {
  await delay(800);

  // Backend frontend ki validation par bharosa nahi karta, wo sab dobara check karta hai.
  const pan = panNumber.trim().toUpperCase();
  if (!PAN_REGEX.test(pan)) throw new Error("PAN ka format galat hai (jaise ABCDE1234F)");
  if (address.trim().length < 10) throw new Error("Address kam se kam 10 characters ka hona chahiye");
  if (profile.kycStatus === "VERIFIED") throw new Error("KYC pehle se verified hai");

  profile.panNumber = pan;
  profile.address = address.trim();
  profile.kycStatus = "SUBMITTED"; // verified nahi: asli bank mein koi officer review karta hai

  // unshift = array ke shuru mein jodta hai. Backend mein ye kaam event se hoga:
  // customer-service "KycSubmitted" event RabbitMQ par bhejegi, notification-service sunke
  // notification banayegi. Frontend ko khud notification banane ki zaroorat nahi padegi.
  notifications.unshift({
    id: Date.now(),
    title: "KYC submitted",
    message: "Aapke KYC documents review mein hain.",
    createdAt: new Date().toISOString(),
    read: false,
  });

  return toClient(profile);
  // BAAD MEIN: (await axiosClient.post("/api/customers/me/kyc", { panNumber, address })).data
}

export async function getNotifications() {
  await delay(400);
  // Naye upar: ISO strings ko localeCompare se compare karna sahi chalta hai.
  return notifications
    .map((n) => ({ ...n }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markAsRead(id) {
  await delay(200);
  const n = notifications.find((x) => x.id === id);
  if (!n) throw new Error("Notification not found");
  n.read = true;
}

export async function markAllAsRead() {
  await delay(200);
  notifications.forEach((n) => {
    n.read = true;
  });
}