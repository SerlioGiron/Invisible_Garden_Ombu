import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { MantineProvider } from "@mantine/core";
import '@mantine/core/styles.css';
import { mantineTheme } from "./styles/theme.ts";
import { BrowserRouter } from "react-router";
import PrivyProvider from "./components/PrivyProvider.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PrivyProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MantineProvider theme={mantineTheme}>
            <App />
          </MantineProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </PrivyProvider>
  </StrictMode>
);