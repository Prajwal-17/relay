import { Route, Routes } from "react-router-dom";
import FullPageLayout from "./components/layouts/FullPageLayout";
import SidebarLayout from "./components/layouts/SidebarLayout";
import { navLinks } from "./constants/Navlinks";
import NewEstimate from "./pages/NewEstimate";
import NewSale from "./pages/NewSale";

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
          <Route path="/sales/new" element={<NewSale />} />
          <Route path="/estimate/new" element={<NewEstimate />} />
          <Route path="/sales/edit/:id" element={<NewSale />} />
          <Route path="/estimates/edit/:id" element={<NewEstimate />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
