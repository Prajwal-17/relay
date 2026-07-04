import Store from "electron-store";

export const store = new Store({
  defaults: {
    zoomFactor: 1
  }
});
