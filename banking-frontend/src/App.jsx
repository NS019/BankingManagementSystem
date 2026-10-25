import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AccountDetails from "./pages/AccountDetails";
import Transfer from "./pages/Transfer";
import DepositWithdraw from "./pages/DepositWithdraw";
import TransactionHistory from "./pages/TransactionHistory";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes: token nahi chahiye. */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Layout route: iske andar ke saare pages automatic protected. */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/accounts/:id" element={<AccountDetails />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/deposit-withdraw" element={<DepositWithdraw />} />
          <Route path="/history" element={<TransactionHistory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/* path="*" = "jo upar kisi se match na hua". Ye hamesha SABSE NEECHE rakhte hain.
            React Router v6+ khud sabse specific route chunta hai, toh order ka asar nahi hota,
            par padhne mein aasaan rehta hai ki catch-all aakhir mein hai. */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}