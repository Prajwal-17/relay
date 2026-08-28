import { vi } from "vitest";
import { databaseMock } from "./database.ref";

vi.mock("../../db/db", () => ({
  get db() {
    return databaseMock.instance;
  }
}));
