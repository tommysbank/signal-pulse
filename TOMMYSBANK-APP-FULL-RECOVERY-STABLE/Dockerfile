FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=10000
ENV TELEGRAM_PUBLIC_URL=https://t.me/mad_apes_gambles
ENV SCRAPE_INTERVAL_MS=3000
ENV PRICE_INTERVAL_MS=4000
ENV STARTUP_CATCHUP_MINUTES=20
ENV MAX_SIGNAL_AGE_MINUTES=120
ENV STATE_FILE=/var/data/runtime-state.json
ENV NODE_OPTIONS=--max-old-space-size=256

EXPOSE 10000

CMD ["node", "server.mjs"]
