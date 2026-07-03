
import express from 'express';
import 'dotenv/config';
const app = express();
const port = 3000;
import authSession from './auth/sessions.js'
import cookieParser from 'cookie-parser';

app.use(express.json());
app.use(cookieParser());

app.get("/", async (req, res) => {
    const result = await pool.query(
        `
        SELECT * FROM kategorie;
        `
    )
    res.send(result.rows)
})

app.use("/auth", authSession)

app.listen(port, async () => {
    console.log(`Przykładowa apka na porcie ${port}`)
})