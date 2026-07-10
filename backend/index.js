import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import start from "./routes/start.js";
import authSession from "./routes/sessions.js";
import items from "./routes/items.js";
import kategorie from "./routes/kategorie.js";
import accounts from "./routes/accounts.js";
import ulubione from "./routes/ulubione.js";
import wypozyczenia from "./routes/wypozyczenia.js";
import recenzje from "./routes/recenzje.js";

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());

app.use("/", start);
app.use("/auth", authSession);
app.use("/items", items);
app.use("/kategorie", kategorie);
app.use("/account", accounts);
app.use("/ulubione", ulubione);
app.use("/wypozyczenia", wypozyczenia);
app.use("/recenzje", recenzje);

app.listen(port, "0.0.0.0", () => {
  console.log(`Przykladowa apka na porcie ${port}`);
});
