# Etap 1: Budowanie aplikacji
FROM node:16 as build

WORKDIR /app

# Kopiowanie plików package.json i instalacja zależności
COPY package*.json ./
RUN npm install

# Kopiowanie kodu źródłowego
COPY . .

# Budowanie aplikacji React
RUN npm run build

# Etap 2: Uruchomienie serwera
FROM node:16-slim

WORKDIR /app

# Kopiowanie plików serwera i zbudowanej aplikacji
COPY --from=build /app/build ./build
COPY --from=build /app/server.js ./
COPY --from=build /app/package*.json ./
COPY --from=build /app/database.sqlite ./

# Instalacja tylko produkcyjnych zależności
RUN npm install --production

# Port, na którym działa serwer
EXPOSE 5000

# Uruchomienie serwera
CMD ["node", "server.js"] 