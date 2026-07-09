FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=10000
ENV TELEGRAM_PUBLIC_URL=https://t.me/mad_apes_gambles
ENV SCRAPE_INTERVAL_MS=8000
ENV PRICE_INTERVAL_MS=15000
ENV STATE_FILE=/var/data/runtime-state.json

EXPOSE 10000

CMD ["node", "server.mjs"]
