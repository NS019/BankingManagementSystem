const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Nakli "user table". Ek demo user pehle se hai, taaki register kiye bina login test ho sake.
// MOCK mein password plain text hai, sirf isliye ki ye memory mein jaata hai aur kahin save nahi hota.
// REAL backend mein password KABHI plain nahi rakhte: BCrypt se hash karke DB mein jaata hai
// (Spring Security ka BCryptPasswordEncoder), aur kisi API response ya log mein wapas nahi aata.
const users = [{ name: "Neeti Sharma", email: "neeti@example.com", phone: "9876543210", password: "Password@123" }];

export async function loginUser({ email, password }) {
  await delay(600);

  // Email lowercase mein compare: "Neeti@Example.com" aur "neeti@example.com" ek hi insaan hain.
  const user = users.find((u) => u.email === email.trim().toLowerCase() && u.password === password);

  // Email galat ho ya password, DONO ke liye ek hi message. Alag messages ("email nahi mila" /
  // "password galat") attacker ko batate hain ki kaunsa email registered hai (user enumeration).
  if (!user) throw new Error("Email ya password galat hai");

  // Asli backend yahan JWT (signed token, expiry ke saath) return karega.
  return { token: `mock-jwt-${Date.now()}` };
  // BAAD MEIN: (await axiosClient.post("/api/auth/login", { email, password })).data
}

export async function registerUser({ name, email, phone, password }) {
  await delay(800);

  const normalizedEmail = email.trim().toLowerCase();

  // Duplicate email rokna. Real backend mein ye check ke saath DB ka UNIQUE constraint bhi hota hai,
  // kyunki do requests ek saath aayein toh akela check dono ko pass kar deta (race condition).
  if (users.some((u) => u.email === normalizedEmail)) {
    throw new Error("Is email se account pehle se bana hua hai");
  }

  users.push({ name: name.trim(), email: normalizedEmail, phone, password });
  return { message: "Account created" };
  // BAAD MEIN: (await axiosClient.post("/api/auth/register", { name, email, phone, password })).data
}