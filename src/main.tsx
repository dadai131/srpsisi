import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installAdBlock } from "./lib/adblock";

installAdBlock();

createRoot(document.getElementById("root")!).render(<App />);
