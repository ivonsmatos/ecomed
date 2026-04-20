import { Hono } from "hono";
import { handle } from "hono/vercel";
import { pontosRouter } from "./routes/pontos";
import { favoritosRouter } from "./routes/favoritos";
import { reportesRouter } from "./routes/reportes";
import { authRouter } from "./routes/authRoutes";
import { chatRouter } from "./routes/chat";
import { pushRouter } from "./routes/push";
import { adminRouter } from "./routes/admin";
import { parceiroRouter } from "./routes/parceiro";
import { notificacoesRouter } from "./routes/notificacoes";
import qr from "./routes/qr";
import checkin from "./routes/checkin";
import onboarding from "./routes/onboarding";
import indexnow from "./routes/indexnow";
import coins from "./routes/coins";
import missions from "./routes/missions";
import rewards from "./routes/rewards";
import quiz from "./routes/quiz";
import { userRouter } from "./routes/user";

export const maxDuration = 60;

const app = new Hono().basePath("/api");

app.get("/health", (c) =>
  c.json({ status: "ok", service: "ecomed-app", timestamp: new Date().toISOString() })
);

app.route("/pontos", pontosRouter);
app.route("/favoritos", favoritosRouter);
app.route("/reportes", reportesRouter);
app.route("/auth", authRouter);
app.route("/chat", chatRouter);
app.route("/push", pushRouter);
app.route("/admin", adminRouter);
app.route("/parceiro", parceiroRouter);
app.route("/notificacoes", notificacoesRouter);
app.route("/qr", qr);
app.route("/checkin", checkin);
app.route("/onboarding", onboarding);
app.route("/indexnow", indexnow);
app.route("/coins", coins);
app.route("/missions", missions);
app.route("/rewards", rewards);
app.route("/quiz", quiz);
app.route("/user", userRouter);

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
