import { pool } from '../db/pool.js';
import bcrypt from 'bcrypt';
import { Router } from 'express';
import 'dotenv/config';
import crypto from 'crypto';

const SESSION_MAX_AGE = 1000 * 60 * 60 * 24;

function stworzTokenSesji() {
  return crypto.randomBytes(32).toString('hex');
}

function hashujTokenSesji(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const router = Router();

router.post("/login", async (req, res) => {
    const { email, password } = req.body || {};
    
    if (!email || !password) {
        return res.status(400).json({error: 'Nieprawidłowe zapytanie.'})
    }

    const result = await pool.query(
        `
        SELECT haslo_hash, email, id, rola FROM uzytkownicy WHERE email = $1
        `,
        [email]
    )

    if (result.rowCount < 1){
        return res.status(401).json({error: 'Nie prawidłowe hasło lub użytkownik'})
    }

    const czyPoprawne = await bcrypt.compare(password, result.rows[0].haslo_hash);
    
    
    if (!czyPoprawne) {
        return res.status(401).json({error: 'Nie prawidłowe hasło lub użytkownik'})
    }

    const tokenSesji = stworzTokenSesji();
    const hashSesji = hashujTokenSesji(tokenSesji);

    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);

    await pool.query(
      `
      INSERT INTO sesje (
        session_hash,
        uzytkownik_id,
        data_wygasniecia
      )
      VALUES ($1, $2, $3)
      `,
      [hashSesji, result.rows[0].id, expiresAt]
    );

    res.cookie('session_id', tokenSesji, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'prod',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE
    });

    return res.status(200).json({
      message: 'Zalogowano',
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        rola: result.rows[0].rola
      }
    });
    
    return res.status(500).json({
      error: 'Błąd serwera'
    });

})

router.post('/logout', async (req, res) => {
  try {
    const tokenSesji = req.cookies?.session_id;

    if (tokenSesji) {
      const hashSesji = hashujTokenSesji(tokenSesji);

      await pool.query(
        `
        DELETE FROM sesje
        WHERE session_hash = $1
        `,
        [hashSesji]
      );
    }

    res.clearCookie('session_id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'prod',
      sameSite: 'lax'
    });

    return res.status(200).json({
      message: 'Wylogowano'
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: 'Błąd serwera'
    });
  }
});

router.post('/register', async (req, res) => {

    const { imie, nazwisko, email, password } = req.body || {};

    if (!email || !password || !imie || !nazwisko) {
        return res.status(400).json({error: 'Nieprawidłowe zapytanie.'})
    }

    const result = await pool.query(
      `
      SELECT email FROM uzytkownicy WHERE email = $1
      `,
      [email]
    );

    if (result.rowCount > 1){
        res.status(409).json({error:"Podany email jest już w bazie."})
    }
    
    const hasloHash = await bcrypt.hash(password, 12);
    
    await pool.query(
      `
      INSERT INTO uzytkownicy (imie, nazwisko, email, haslo_hash)
      VALUES ($1, $2, $3, $4)
      `,
      [imie, nazwisko, email, hasloHash]
    );

    return res.status(200).json({"message": "Zarejstrowano"})

})

export default router;