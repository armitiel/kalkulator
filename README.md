# Kalkulator Inwestycji TSQ

Aplikacja webowa do śledzenia i przewidywania inwestycji w programie TSQ. Aplikacja umożliwia śledzenie dziennych sygnałów inwestycyjnych, obliczanie zysków oraz planowanie wypłat.

## Funkcje

- Śledzenie dziennych sygnałów inwestycyjnych (0.6% zysku na sygnał)
- Możliwość ustawienia liczby sygnałów dziennie (1-5)
- Przewidywania na 6 miesięcy do przodu
- Ręczna aktualizacja stanu konta
- Planowanie dodatkowych wpłat zewnętrznych
- Obliczanie czasu potrzebnego do osiągnięcia określonej kwoty
- Planowanie wypłat z uwzględnieniem strategii procentowego wzrostu kapitału
- Historia transakcji z możliwością edycji i usuwania wpisów
- System logowania i rejestracji użytkowników
- Przechowywanie danych w bazie SQLite

## Wymagania

- Node.js (wersja 14 lub nowsza)
- npm (wersja 6 lub nowsza)

## Instalacja

1. Sklonuj repozytorium:
```
git clone https://github.com/twoj-username/tsq-investment-tracker.git
cd tsq-investment-tracker
```

2. Zainstaluj zależności:
```
npm install
```

## Uruchomienie

1. Uruchom serwer backend:
```
npm run server
```

2. W nowym terminalu uruchom aplikację frontend:
```
npm start
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

## Struktura projektu

- `server.js` - Serwer Express.js z obsługą bazy danych SQLite
- `src/` - Kod źródłowy aplikacji React
  - `components/` - Komponenty React
  - `api.js` - Funkcje do komunikacji z API
  - `App.js` - Główny komponent aplikacji
  - `index.js` - Punkt wejścia aplikacji

## Baza danych

Aplikacja używa bazy danych SQLite, która jest automatycznie tworzona przy pierwszym uruchomieniu serwera. Baza danych zawiera następujące tabele:

- `users` - Dane użytkowników
- `portfolios` - Dane portfeli inwestycyjnych
- `transactions` - Historia transakcji

## Bezpieczeństwo

- Hasła użytkowników są hashowane przed zapisem do bazy danych
- Używany jest system tokenów JWT do autoryzacji
- Wszystkie endpointy API (oprócz rejestracji i logowania) wymagają tokenu autoryzacji

## Licencja

MIT

## Generowanie miniaturek i ikon

W folderze `/public` znajdują się następujące pliki szablonów SVG, które możesz użyć do wygenerowania miniaturek i ikon:

1. `og-image-template.svg` - szablon dla obrazu Open Graph (miniaturka przy udostępnianiu linku)
2. `favicon-template.svg` - szablon dla favicon
3. `apple-touch-icon-template.svg` - szablon dla ikony Apple Touch

Aby wygenerować pliki:

1. Otwórz pliki SVG w przeglądarce lub edytorze graficznym
2. Wyeksportuj/zapisz jako pliki PNG:
   - `og-image-template.svg` → `og-image.png` (1200x630px)
   - `favicon-template.svg` → `favicon.ico` (64x64px)
   - `apple-touch-icon-template.svg` → `apple-touch-icon.png` (180x180px)
   - Dodatkowo wygeneruj `logo192.png` (192x192px) i `logo512.png` (512x512px)

3. Umieść wszystkie wygenerowane pliki w folderze `/public`

Możesz również użyć pliku `create-images.html` w folderze `/public`, który ułatwia wygenerowanie wszystkich potrzebnych plików.

Dla favicon.ico możesz użyć konwertera online, np. [convertio.co](https://convertio.co/png-ico/) do konwersji PNG na ICO. 