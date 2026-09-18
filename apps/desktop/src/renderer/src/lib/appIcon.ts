import productionIcon from "@assets/desktop/app-icon.svg";
import productionSmallIcon from "@assets/desktop/app-icon-small.svg";
import developmentIcon from "@assets/desktop/app-icon-dev.svg";
import developmentSmallIcon from "@assets/desktop/app-icon-dev-small.svg";

// MODE also distinguishes packaged development builds; DEV only describes serving/building.
const isDevelopment = import.meta.env.MODE === "development";
export const relayAppIcon = isDevelopment ? developmentIcon : productionIcon;
export const relaySmallAppIcon = isDevelopment ? developmentSmallIcon : productionSmallIcon;
