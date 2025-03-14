
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // ✅ Import AuthProvider
import App from "./App";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter> {/* ✅ Wrap inside BrowserRouter */}
    <AuthProvider> 
      <App />
    </AuthProvider>
  </BrowserRouter>
);
