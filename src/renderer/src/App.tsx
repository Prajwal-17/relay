import { Route, Routes } from "react-router-dom";
import FullPageLayout from "./components/layouts/FullPageLayout";
import SidebarLayout from "./components/layouts/SidebarLayout";
import { navLinks } from "./constants/Navlinks";
import EstimatePage from "./pages/EstimatePage/EstimatePage";
import SalesPage from "./pages/SalesPage/SalesPage";

const App = () => {
  return (
    <>
      <Routes>
        <Route element={<SidebarLayout />}>
          {navLinks.map((item, idx) => (
            <Route key={idx} path={item.href} element={item.element} />
          ))}
        </Route>
        <Route element={<FullPageLayout />}>
          <Route path="/sales/new" element={<SalesPage />} />
          <Route path="/estimate/new" element={<EstimatePage />} />
          <Route path="/sales/edit/:id" element={<SalesPage />} />
          <Route path="/estimates/edit/:id" element={<EstimatePage />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
