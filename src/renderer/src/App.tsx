import { Route, Routes } from "react-router-dom";
import SidebarLayout from "./components/layouts/SidebarLayout";
import { navLinks } from "./constants/Navlinks";
import NewEstimate from "./pages/NewEstimate";
import NewSale from "./pages/NewSale";

const App = () => {
  return (
    <div className="bg-sidebar">
      <Routes>
        <Route element={<SidebarLayout />}>
          {navLinks.map((item, idx) => (
            <Route key={idx} path={item.href} element={item.element} />
          ))}
          <Route path="/sales/new" element={<NewSale />} />
          <Route path="/estimates/new" element={<NewEstimate />} />
          <Route path="/sales/edit/:id" element={<NewSale />} />
          <Route path="/estimates/edit/:id" element={<NewEstimate />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
