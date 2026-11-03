import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { dashboardController } from "./modules/dashboard/dashboard.controller";
import { authController } from "./modules/users/auth.controller";
import { houseController } from "./modules/houses/house.controller";
import { wasteController } from "./modules/wastes/waste.controller";
import { userController } from "./modules/users/user.controller";

export const app = new Elysia()
  .use(cors())
  .use(authController)
  .use(houseController)
  .use(wasteController)
  .use(dashboardController)
  .use(userController)
  .get("/", () => ({
    message: "KKN App API is running",
  }));

if (import.meta.main) {
  const port = process.env.PORT || 3000;
  app.listen(port);
  console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
}

export default app;
