CREATE TYPE typ_konta AS ENUM (
    'uzytkownik',
    'admin'
);

CREATE TYPE status_sprzetu AS ENUM (
    'dostepny',
    'wypozyczony',
    'w_naprawie'
);

CREATE TYPE status_wypozyczenia AS ENUM (
    'oczekujacy',
    'zaakceptowany',
    'odrzucony',
    'aktywny',
    'zwrocony'
);

CREATE TABLE uzytkownicy (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    imie VARCHAR(100) NOT NULL,
    nazwisko VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    haslo_hash TEXT NOT NULL, 
    rola typ_konta NOT NULL DEFAULT 'uzytkownik',
    data_utworzenia TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kategorie (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(100) NOT NULL
);

CREATE TABLE sprzety (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nazwa VARCHAR(100) NOT NULL,
    opis TEXT,
    kategoria_id INTEGER NOT NULL,
    zdjecie_url TEXT,
    status status_sprzetu NOT NULL,
    data_dodania TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sprzet_uzytkownicy 
        FOREIGN KEY (kategoria_id)
        REFERENCES kategorie(id)
        ON DELETE RESTRICT
);

CREATE TABLE wypozyczenia (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sprzet_id INTEGER NOT NULL,
    uzytkownik_id INTEGER NOT NULL,
    data_zlozenia TIMESTAMP NOT NULL,
    data_od TIMESTAMP NOT NULL,
    data_do TIMESTAMP NOT NULL,
    status status_wypozyczenia NOT NULL,
    data_zwrotu_rzeczywista TIMESTAMP,

    CONSTRAINT fk_wypozyczenia_sprzet 
        FOREIGN KEY (sprzet_id)
        REFERENCES sprzety(id)
        ON DELETE RESTRICT,
    
    CONSTRAINT fk_wypozyczenia_uzytkownicy
        FOREIGN KEY (uzytkownik_id)
        REFERENCES uzytkownicy(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_wypozyczenia_dat
        CHECK (data_do >= data_od)
);

CREATE TABLE powiadomienia (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uzytkownik_id INTEGER NOT NULL,
    tresc TEXT NOT NULL,
    przeczytane BOOL NOT NULL,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sesje (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_hash TEXT UNIQUE NOT NULL,
    uzytkownik_id INTEGER NOT NULL,
    data_utworzenia TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ostatnia_aktywnosc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_wygasniecia TIMESTAMP NOT NULL,

    CONSTRAINT fk_sesje_uzytkownicy
        FOREIGN KEY (uzytkownik_id)
        REFERENCES uzytkownicy(id)
        ON DELETE CASCADE
);