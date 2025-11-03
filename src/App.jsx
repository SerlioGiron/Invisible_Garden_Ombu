import "./App.css";
import { Route, Routes } from "react-router";
import Layout from "./components/Layout";
import rutas from "./services/routing";

function App() {
  return (
    <Layout>
      <Routes>
        {rutas.map((ruta) => {
          const Component = ruta.component;
          return (
            <Route
              key={ruta.route}
              path={ruta.route}
              element={<Component />}
            />
          );
        })}
      </Routes>
    </Layout>
  );
}

export default App;