import { Outlet } from "react-router-dom";
import { Sidebar } from "../Sidebar";

const RootLayout = () => {
  return (
    <>
      <div className="relative mx-auto flex h-screen min-h-screen w-full">
        <Sidebar />
        <div className="my-3 flex-1 overflow-y-auto rounded-xl shadow-lg">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default RootLayout;
