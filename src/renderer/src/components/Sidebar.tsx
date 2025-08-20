import { navLinks } from "@/constants/Navlinks";
import { Building2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";

export const Sidebar = () => {
  const location = useLocation();

  return (
    <>
      <div className="text-sidebar-foreground bg-sidebar border-border h-full w-full max-w-xs border-r px-4 py-4">
        <div className="flex h-full flex-col">
          <div className="flex w-full items-center justify-start gap-3">
            <div className="bg-primary text-foreground flex h-12 w-12 items-center justify-center rounded-lg">
              <Building2 className="text-background h-8 w-8" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-2xl font-extrabold">SuperBill</span>
              <span className="text-muted-foreground text-md font-medium">POS Billing</span>
            </div>
          </div>
          <div className="mt-5 flex w-full flex-col items-center justify-center gap-3">
            <Link to="/sales/new" className="w-full">
              <Button variant="default" size="lg" className="w-full text-lg font-medium">
                Create Sale
              </Button>
            </Link>
            <Link to="/estimate/new" className="w-full">
              <Button variant="default" size="lg" className="w-full text-lg font-medium">
                Add Estimate
              </Button>
            </Link>
          </div>
          <div className="mt-12 w-full flex-1 space-y-4">
            {navLinks.map((item, idx) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={idx}
                  to={item.href}
                  className={`${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-primary/25 border" : "text-sidebar-accent-foreground border border-transparent"} hover:text-sidebar-foreground hover:bg-sidebar-accent flex w-full transform items-center justify-start gap-3 rounded-lg px-3 py-3 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95`}
                >
                  {item.icon}
                  <span className="text-xl font-semibold">{item.title}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex w-full items-center px-1 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-green-100">
              <span className="text-md font-medium text-green-700"> MS</span>
            </div>
            <div className="ml-2 flex flex-col items-start justify-center leading-tight">
              <span className="text-sidebar-foreground text-base leading-none font-semibold">
                Sri Manjunatheshwara Stores
              </span>
              <span className="text-muted-foreground text-sm font-medium">
                kumarkrwelcome@gmail.com
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
