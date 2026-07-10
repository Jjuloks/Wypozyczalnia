import { pool } from '../db/pool.js';
import bcrypt from 'bcrypt';
import { Router } from 'express';
import 'dotenv/config';
import crypto from 'crypto';
import { wyslijMail } from '../mail/wysylkaMaili.js';
import {
  mail2FA,
  mailWlaczono2FA,
  mailWylaczono2FA
} from '../mail/formatyMaili.js';
import {
  generujKod,
  generujTokenWyzwania,
  hashujKod,
  hashujTokenWyzwania,
  KOD_2FA_WAZNY_MINUT,
  MAKSYMALNA_LICZBA_PROB_KODU,
  normalizujEmail,
  porownajKod
} from './zabezpieczenia.js';

const SESSION_MAX_AGE = 1000 * 60 * 60 * 24;

function stworzTokenSesji() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashujTokenSesji(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function ustawCookieSesji(res, tokenSesji) {
  res.cookie('session_id', tokenSesji, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'prod',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE
  });
}

async function utworzSesje(client, uzytkownikId) {
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

function odpowiedzZalogowano(res, tokenSesji, user) {
  ustawCookieSesji(res, tokenSesji);

  return res.status(200).json({
    message: 'Zalogowano',
    user: {
      id: user.id,
      email: user.email,
      rola: user.rola
    }
  });
}

function wyslijPowiadomienie2FAWTle(email, format, opis) {
  wyslijMail({ do: email, ...format }).catch((err) => {
    console.error(`Nie udalo sie wyslac maila (${opis}):`, err);
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
    'UPDATE sesje SET ostatnia_aktywnosc = NOW() WHERE session_hash = $1',
    [hashSesji]
  );

  return result.rows[0];
}

export async function pobierzRoleZSesji(req) {
  const uzytkownik = await pobierzUzytkownikaZSesji(req);
  return uzytkownik?.rola || null;
}

const router = Router();

router.post('/register-confirm', async (req, res) => {
  const client = await pool.connect();

  try {
    const email = normalizujEmail(req.body?.email);
    const kod = String(req.body?.code ?? req.body?.kod ?? '').trim();

    if (!email || !/^\d{6}$/.test(kod)) {
      return res.status(400).json({ error: 'Nieprawidlowy email lub kod.' });
    }

    await client.query('BEGIN');
    const result = await client.query(
      `
      SELECT email, imie, nazwisko, haslo_hash, kod_hash, data_wygasniecia, liczba_prob
      FROM rejestracje_oczekujace
      WHERE email = $1
      FOR UPDATE
      `,
      [email]
    );
    const rejestracja = result.rows[0];

    if (!rejestracja) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Nieprawidlowy lub wygasly kod.' });
    }

    if (
      new Date(rejestracja.data_wygasniecia).getTime() <= Date.now() ||
      rejestracja.liczba_prob >= MAKSYMALNA_LICZBA_PROB_KODU
    ) {
      await client.query('DELETE FROM rejestracje_oczekujace WHERE email = $1', [email]);
      await client.query('COMMIT');
      return res.status(400).json({ error: 'Nieprawidlowy lub wygasly kod.' });
    }

    const czyPoprawnyKod = await porownajKod(kod, rejestracja.kod_hash);

    if (!czyPoprawnyKod) {
      if (rejestracja.liczba_prob + 1 >= MAKSYMALNA_LICZBA_PROB_KODU) {
        await client.query('DELETE FROM rejestracje_oczekujace WHERE email = $1', [email]);
      } else {
        await client.query(
          'UPDATE rejestracje_oczekujace SET liczba_prob = liczba_prob + 1 WHERE email = $1',
          [email]
        );
      }

      await client.query('COMMIT');
      return res.status(400).json({ error: 'Nieprawidlowy lub wygasly kod.' });
    }

    const userResult = await client.query(
      `
      INSERT INTO uzytkownicy (imie, nazwisko, email, haslo_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, imie, nazwisko, email, rola, dwuetapowe, data_utworzenia
      `,
      [rejestracja.imie, rejestracja.nazwisko, rejestracja.email, rejestracja.haslo_hash]
    );

    await client.query('DELETE FROM rejestracje_oczekujace WHERE email = $1', [email]);
    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Konto zostalo utworzone.',
      user: userResult.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(console.error);

    if (err.code === '23505') {
      await pool.query(
        'DELETE FROM rejestracje_oczekujace WHERE email = $1',
        [normalizujEmail(req.body?.email)]
      ).catch(console.error);

      return res.status(409).json({ error: 'Konto z tym adresem email juz istnieje.' });
    }

    console.error(err);
    return res.status(500).json({ error: 'Blad serwera' });
  } finally {
    client.release();
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = normalizujEmail(req.body?.email);
    const password = req.body?.password ?? req.body?.haslo;

    if (!email || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Nieprawidlowe zapytanie.' });
    }

    const result = await pool.query(
      `
      SELECT haslo_hash, email, id, imie, rola, dwuetapowe
      FROM uzytkownicy
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [email]
    );

    if (result.rowCount < 1) {
      return res.status(401).json({ error: 'Nieprawidlowe haslo lub uzytkownik' });
    }

    const user = result.rows[0];
    const czyPoprawne = await bcrypt.compare(password, user.haslo_hash);

    if (!czyPoprawne) {
      return res.status(401).json({ error: 'Nieprawidlowe haslo lub uzytkownik' });
    }

    if (!user.dwuetapowe) {
      const tokenSesji = await utworzSesje(pool, user.id);
      return odpowiedzZalogowano(res, tokenSesji, user);
    }

    const kod = generujKod();
    const kodHash = await hashujKod(kod);
    const challenge = generujTokenWyzwania();
    const challengeHash = hashujTokenWyzwania(challenge);
    const dataWygasniecia = new Date(Date.now() + KOD_2FA_WAZNY_MINUT * 60 * 1000);

    await pool.query(
      `
      INSERT INTO wyzwania_2fa (
        challenge_hash, uzytkownik_id, kod_hash, data_wygasniecia, liczba_prob
      )
      VALUES ($1, $2, $3, $4, 0)
      ON CONFLICT (uzytkownik_id) DO UPDATE SET
        challenge_hash = EXCLUDED.challenge_hash,
        kod_hash = EXCLUDED.kod_hash,
        data_wygasniecia = EXCLUDED.data_wygasniecia,
        liczba_prob = 0,
        data_utworzenia = NOW()
      `,
      [challengeHash, user.id, kodHash, dataWygasniecia]
    );

    const mail = mail2FA({ kod, imie: user.imie, waznyMinut: KOD_2FA_WAZNY_MINUT });

    try {
      await wyslijMail({ do: user.email, ...mail });
    } catch (err) {
      await pool.query(
        'DELETE FROM wyzwania_2fa WHERE challenge_hash = $1',
        [challengeHash]
      ).catch(console.error);
      console.error('Nie udalo sie wyslac kodu 2FA:', err);

      return res.status(502).json({
        error: 'Nie udalo sie wyslac kodu 2FA. Sprobuj ponownie.'
      });
    }

    return res.status(202).json({
      message: 'Wyslano kod 2FA.',
      requires_2fa: true,
      challenge,
      expires_in: KOD_2FA_WAZNY_MINUT * 60,
      max_attempts: MAKSYMALNA_LICZBA_PROB_KODU
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Blad serwera' });
  }
});

router.post('/2fa', async (req, res) => {
  const client = await pool.connect();

  try {
    const challenge = String(req.body?.challenge ?? req.body?.wyzwanie ?? '').trim();
    const kod = String(req.body?.code ?? req.body?.kod ?? '').trim();

    if (!/^[a-f0-9]{64}$/.test(challenge) || !/^\d{6}$/.test(kod)) {
      return res.status(400).json({ error: 'Nieprawidlowe wyzwanie lub kod.' });
    }

    const challengeHash = hashujTokenWyzwania(challenge);
    await client.query('BEGIN');
    const result = await client.query(
      `
      SELECT
        w.challenge_hash,
        w.uzytkownik_id,
        w.kod_hash,
        w.data_wygasniecia,
        w.liczba_prob,
        u.id,
        u.email,
        u.rola
      FROM wyzwania_2fa w
      JOIN uzytkownicy u ON u.id = w.uzytkownik_id
      WHERE w.challenge_hash = $1
        AND u.dwuetapowe = TRUE
      FOR UPDATE
      `,
      [challengeHash]
    );
    const wyzwanie = result.rows[0];

    if (!wyzwanie) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Nieprawidlowy lub wygasly kod.' });
    }

    if (
      new Date(wyzwanie.data_wygasniecia).getTime() <= Date.now() ||
      wyzwanie.liczba_prob >= MAKSYMALNA_LICZBA_PROB_KODU
    ) {
      await client.query('DELETE FROM wyzwania_2fa WHERE challenge_hash = $1', [challengeHash]);
      await client.query('COMMIT');
      return res.status(400).json({ error: 'Nieprawidlowy lub wygasly kod.' });
    }

    const czyPoprawnyKod = await porownajKod(kod, wyzwanie.kod_hash);

    if (!czyPoprawnyKod) {
      if (wyzwanie.liczba_prob + 1 >= MAKSYMALNA_LICZBA_PROB_KODU) {
        await client.query('DELETE FROM wyzwania_2fa WHERE challenge_hash = $1', [challengeHash]);
      } else {
        await client.query(
          'UPDATE wyzwania_2fa SET liczba_prob = liczba_prob + 1 WHERE challenge_hash = $1',
          [challengeHash]
        );
      }

      await client.query('COMMIT');
      return res.status(400).json({ error: 'Nieprawidlowy lub wygasly kod.' });
    }

    const tokenSesji = await utworzSesje(client, wyzwanie.uzytkownik_id);
    await client.query('DELETE FROM wyzwania_2fa WHERE uzytkownik_id = $1', [wyzwanie.uzytkownik_id]);
    await client.query('COMMIT');

    return odpowiedzZalogowano(res, tokenSesji, {
      id: wyzwanie.id,
      email: wyzwanie.email,
      rola: wyzwanie.rola
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(console.error);
    console.error(err);
    return res.status(500).json({ error: 'Blad serwera' });
  } finally {
    client.release();
  }
});

router.post('/2fa/enable', async (req, res) => {
  try {
    const uzytkownik = await pobierzUzytkownikaZSesji(req);

    if (!uzytkownik) {
      return res.status(401).json({ error: 'Wymagane logowanie.' });
    }

    const result = await pool.query(
      `
      UPDATE uzytkownicy
      SET dwuetapowe = TRUE
      WHERE id = $1 AND dwuetapowe = FALSE
      RETURNING id
      `,
      [uzytkownik.id]
    );

    if (result.rowCount > 0) {
      wyslijPowiadomienie2FAWTle(
        uzytkownik.email,
        mailWlaczono2FA({ imie: uzytkownik.imie }),
        'wlaczenie 2FA'
      );
    }

    return res.status(200).json({
      message: result.rowCount > 0 ? 'Wlaczono 2FA.' : '2FA jest juz wlaczone.',
      dwuetapowe: true
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Blad serwera' });
  }
});

router.post('/2fa/disable', async (req, res) => {
  const client = await pool.connect();

  try {
    const uzytkownik = await pobierzUzytkownikaZSesji(req);

    if (!uzytkownik) {
      return res.status(401).json({ error: 'Wymagane logowanie.' });
    }

    await client.query('BEGIN');
    const result = await client.query(
      `
      UPDATE uzytkownicy
      SET dwuetapowe = FALSE
      WHERE id = $1 AND dwuetapowe = TRUE
      RETURNING id
      `,
      [uzytkownik.id]
    );

    await client.query('DELETE FROM wyzwania_2fa WHERE uzytkownik_id = $1', [uzytkownik.id]);
    await client.query('COMMIT');

    if (result.rowCount > 0) {
      wyslijPowiadomienie2FAWTle(
        uzytkownik.email,
        mailWylaczono2FA({ imie: uzytkownik.imie }),
        'wylaczenie 2FA'
      );
    }

    return res.status(200).json({
      message: result.rowCount > 0 ? 'Wylaczono 2FA.' : '2FA jest juz wylaczone.',
      dwuetapowe: false
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(console.error);
    console.error(err);
    return res.status(500).json({ error: 'Blad serwera' });
  } finally {
    client.release();
  }
});

router.post('/logout', async (req, res) => {
  try {
    const tokenSesji = req.cookies?.session_id;

    if (tokenSesji) {
      const hashSesji = hashujTokenSesji(tokenSesji);
      await pool.query('DELETE FROM sesje WHERE session_hash = $1', [hashSesji]);
    }

    res.clearCookie('session_id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'prod',
      sameSite: 'lax'
    });

    return res.status(200).json({ message: 'Wylogowano' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Blad serwera' });
  }
});

export default router;
