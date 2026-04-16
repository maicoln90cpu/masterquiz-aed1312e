import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/quiz-templates.css";
import "./i18n/config";
import App from "./App.tsx";
import { installGlobalErrorCapture } from "./lib/errorCapture";

// Instala captura global de erros do frontend
installGlobalErrorCapture();

createRoot(document.getElementById("root")!).render(<App />);
