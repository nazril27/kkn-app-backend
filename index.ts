import app from "./src/index";

if (import.meta.main) {
  const port = process.env.PORT || 3000;
  app.listen(port);
  console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
}

export default app;
