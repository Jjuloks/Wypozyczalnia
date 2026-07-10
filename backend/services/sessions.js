import crypto from "crypto";
import { pool } from "../db/pool.js";

export const SESSION_MAX_AGE = 1000 * 60 * 60 * 24;

export function stworzTokenSesji() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashujTokenSesji(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function ustawCookieSesji(res, tokenSesji) {
  res.cookie("session_id", tokenSesji, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "prod",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE
  });
}

export function wyczyscCookieSesji(res) {
  res.clearCookie("session_id", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "prod",
    sameSite: "lax"
  });
}

export async function utworzSesje(client, uzytkownikId) {
  const tokenSesji = stworzTokenSesji();
  const hashSesji = hashujTokenSesji(tokenSesji);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);

  await client.query(
    `
    INSERT INTO sesje (session_hash, uzytkownik_id, data_wygasniecia)
    VALUES ($1, $2, $3)
    `,
    [hashSesji, uzytkownikId, expiresAt]
  );

  return tokenSesji;
}

export function odpowiedzZalogowano(res, tokenSesji, user) {
  ustawCookieSesji(res, tokenSesji);

  return res.status(200).json({
    message: "Zalogowano",
    user: {
      id: user.id,
      email: user.email,
      rola: user.rola
    }
  });
}

export async function pobierzUzytkownikaZSesji(req) {
  const tokenSesji = req.cookies?.session_id;

  if (!tokenSesji) {
    return null;
  }

  const hashSesji = hashujTokenSesji(tokenSesji);
  const result = await pool.query(
    `
    SELECT u.id, u.imie, u.nazwisko, u.email, u.rola, u.dwuetapowe
    FROM sesje s
    JOIN uzytkownicy u ON u.id = s.uzytkownik_id
    WHERE s.session_hash = $1
      AND s.data_wygasniecia > NOW()
    LIMIT 1
    `,
    [hashSesji]
  );

  if (result.rowCount < 1) {
    return null;
  }

  await pool.query(
    "UPDATE sesje SET ostatnia_aktywnosc = NOW() WHERE session_hash = $1",
    [hashSesji]
  );

  return result.rows[0];
}

export async function pobierzRoleZSesji(req) {
  const uzytkownik = await pobierzUzytkownikaZSesji(req);
  return uzytkownik?.rola || null;
}
