# Instrukcja Konfiguracji Proxy CORS

Ta instrukcja pomoże Ci skonfigurować i uruchomić proxy CORS, które rozwiąże problemy z CORS podczas lokalnego rozwoju aplikacji.

## Problem CORS

Gdy uruchamiasz aplikację lokalnie (na localhost:3000), możesz napotkać błędy CORS podczas próby dostępu do API na `https://kalkulatortsq.vercel.app/api`. Dzieje się tak, ponieważ serwer nie ma skonfigurowanych nagłówków CORS, aby zezwalać na żądania z Twojego lokalnego środowiska deweloperskiego.

Proxy CORS działa jako pośrednik, umożliwiając Twojej lokalnej aplikacji komunikację z API bez błędów CORS.

## Kroki Konfiguracji

### 1. Instalacja zależności

Otwórz terminal i wykonaj następujące polecenia:

```bash
# Utwórz folder dla proxy
mkdir -p proxy-server

# Zainstaluj zależności
npm install --prefix ./proxy-server cors-anywhere
```

### 2. Uruchomienie serwera proxy

Aby uruchomić serwer proxy, wykonaj poniższe polecenie w terminalu:

```bash
# Najprostszy sposób (działa na wszystkich systemach)
node start-proxy.js

# Alternatywnie, w systemie Windows
start-proxy.bat

# Alternatywnie, w systemie macOS/Linux
chmod +x start-proxy.sh
./start-proxy.sh
```

Powinieneś zobaczyć komunikat: `CORS Proxy running on localhost:8080`

### 3. Pozostaw to okno terminala otwarte podczas pracy nad aplikacją

Serwer proxy musi działać, aby aplikacja mogła komunikować się z API.

### 4. W osobnym terminalu uruchom swoją aplikację React jak zwykle:

```bash
npm start
```

## Jak to działa

Aplikacja została skonfigurowana do wysyłania żądań API przez serwer proxy:

1. Twoja aplikacja wysyła żądanie do `http://localhost:8080/https://kalkulatortsq.vercel.app/api`
2. Serwer proxy przekazuje to żądanie do `https://kalkulatortsq.vercel.app/api`
3. Serwer proxy otrzymuje odpowiedź i dodaje niezbędne nagłówki CORS
4. Serwer proxy wysyła odpowiedź z powrotem do Twojej aplikacji

## Rozwiązywanie problemów

### Problem: Nie można uruchomić pliku .bat lub .sh

Jeśli masz problemy z uruchomieniem plików skryptowych, możesz uruchomić serwer proxy bezpośrednio:

```bash
node proxy-server.js
```

### Problem: Nadal występują błędy CORS

Jeśli nadal występują błędy CORS:

1. Upewnij się, że serwer proxy działa (powinieneś widzieć `CORS Proxy running on localhost:8080` w terminalu)
2. Sprawdź, czy API_BASE_URL w `src/api.js` jest poprawnie skonfigurowane do korzystania z proxy
3. Spróbuj wyczyścić pamięć podręczną przeglądarki i odświeżyć stronę
4. Sprawdź konsolę przeglądarki, aby uzyskać konkretne komunikaty o błędach

### Problem: Nie można edytować stanu konta

Jeśli nie możesz edytować stanu konta, mimo że używasz proxy:

1. Aplikacja została zaktualizowana, aby zawsze zapisywać zmiany lokalnie, nawet jeśli serwer jest niedostępny
2. Spróbuj odświeżyć stronę po uruchomieniu proxy
3. Upewnij się, że klikasz bezpośrednio na wartość salda lub ikonę ołówka, aby rozpocząć edycję

## Wdrożenie produkcyjne

Ta konfiguracja proxy jest tylko do celów rozwojowych. W środowisku produkcyjnym aplikacja powinna łączyć się bezpośrednio z API bez używania proxy. Serwer API powinien być skonfigurowany tak, aby umożliwiać żądania z Twojej domeny produkcyjnej.