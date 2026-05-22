import { useState } from "react";
import { isAuthenticated } from "./auth.js";
import AdminPanel from "./components/AdminPanel.jsx";
import LoginPage from "./components/LoginPage.jsx";

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());

  if (!authed) {
    return <LoginPage onSuccess={() => setAuthed(true)} />;
  }

  return <AdminPanel />;
}
