import z, { uuidv4 } from "zod";

export const idSchema = z.object({
  id: uuidv4({ error: "Id param is invalid" })
});
