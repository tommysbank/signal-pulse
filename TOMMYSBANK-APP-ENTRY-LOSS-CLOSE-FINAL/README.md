# TOMYSBANK

PWA mobile-first per pubblicare e tracciare in tempo reale i segnali di un
canale Telegram pubblico. Include:

- feed realtime via Server-Sent Events;
- monitoraggio della pagina pubblica Telegram senza bot amministratore;
- filtro dei nuovi call che esclude update, vecchi risultati e promozioni;
- almeno cinque segnali live visibili e tracking simultaneo di tutti i call;
- storico permanente con risultato e picco di ogni segnale;
- P/L corrente esplicito: sotto l'ingresso viene mostrata una perdita, non un
  falso moltiplicatore positivo;
- recap giornaliero, settimanale, mensile, totale e personalizzato basato sul
  picco di ogni coin, con esempio del valore potenziale su 100 USD per call;
- chiusura conservativa delle coin inattive, mantenendo il picco finale;
- chiusura delle coin rimaste sotto 6.000 USD per almeno 5 ore, dopo aver
  toccato 3.000 USD e perso almeno il 65% dal proprio picco;
- grafico interno a candele rosse e verdi;
- copia del contract address in un tocco;
- ricerca per contract address: se l'address appartiene a un segnale già
  registrato, apre la relativa card con grafico, stats, P/L e link al chart;
- link rapido a Dexscreener;
- interfaccia inglese/italiana;
- guide iPhone e Android per l'installazione sulla Home Screen;
- cache offline e notifiche Web Push con messaggio immediato di conferma.
- account email/password condiviso con il sito TOMMYSBANK;
- API, feed realtime e notifiche riservati alle membership attive.

## Accesso membri

Quando sono presenti `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e
`MEMBERSHIP_API_URL`, il server richiede un token Supabase valido e controlla
la membership tramite il sito Netlify prima di restituire segnali o aprire il
feed realtime.

Variabili Render:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `MEMBERSHIP_SITE_URL`
- `MEMBERSHIP_API_URL`
- `REQUIRE_MEMBERSHIP=true`

L’health check pubblico usa `/healthz`; `/api/status` è riservato ai membri.

## Avvio locale con un canale pubblico

```bash
TELEGRAM_PUBLIC_URL=https://t.me/mad_apes_gambles node server.mjs
```

Apri `http://localhost:4173`. Al primo avvio il server fotografa i post già
presenti e non li importa: pubblica soltanto i call arrivati da quel momento in
poi. Controlla la pagina pubblica ogni 8 secondi e i reply con gli aggiornamenti
`2x`, `5x`, ecc. non generano nuovi segnali.

Ogni nuovo call viene collegato all'API Dexscreener. Il prezzo rilevato subito
dopo il call diventa il prezzo di ingresso; il server aggiorna prezzo, market
cap e moltiplicatore ogni 3 secondi. Conserva sia il moltiplicatore
corrente sia il picco massimo raggiunto: il picco non diminuisce quando il
prezzo scende. L'andamento raccolto alimenta il grafico interno, mentre il
pulsante "Apri grafico" porta alla pair Dexscreener selezionata.

Il picco è il massimo **rilevato dal polling**, non un tick-level ATH on-chain:
movimenti completi tra due campionamenti possono non essere osservati. Per una
misurazione tick-by-tick in produzione serve una sorgente streaming/on-chain
specifica per ciascuna rete.

Post, tutti i segnali, prezzi, picchi, storico e iscrizioni alle notifiche
vengono salvati in `data/runtime-state.json`, quindi non vengono persi al
riavvio.

La frequenza è configurabile con `SCRAPE_INTERVAL_MS`, con un minimo di 5
secondi. In caso di errori o rate limit il sistema applica automaticamente un
backoff fino a un minuto.

Per provare senza Telegram:

```bash
ALLOW_DEMO=true node server.mjs
```

## Alternativa: collegare Telegram tramite bot

1. Crea un bot con BotFather e aggiungilo come amministratore del canale.
2. Scegli un valore casuale per `TELEGRAM_WEBHOOK_SECRET`.
3. Pubblica il server su HTTPS.
4. Registra il webhook:

```text
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<DOMINIO>/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

Il bot riceverà i nuovi `channel_post`. Il parser riconosce ticker, contract
address, chain, entry, market cap e target dai formati più comuni.

## Nota sullo scraping

Lo scraping non richiede credenziali né permessi nel canale, ma dipende dalla
pagina pubblica `t.me/s/...`: Telegram può modificarne struttura, cache o limiti.
L'endpoint `/api/status` espone lo stato della sorgente e l'ultimo controllo
riuscito, così il servizio può essere monitorato in produzione.

## Pubblicazione

L'app richiede un processo Node sempre acceso; un deploy statico drag-and-drop
su Netlify pubblica soltanto l'interfaccia e non mantiene attivi scraper,
tracking prezzi, SSE e notifiche. Il repository include `Dockerfile` e
`render.yaml` per la pubblicazione come Web Service su Render.

Su Render:

1. carica il progetto in un repository GitHub;
2. scegli **New > Blueprint** e collega il repository;
3. conferma il servizio definito da `render.yaml`;
4. configura le tre variabili VAPID per le notifiche push.

Il disco persistente montato in `/var/data` conserva baseline Telegram,
segnali, prezzi e picchi tra riavvii e deploy.

## Notifiche quando l'app è chiusa

Installa la dipendenza opzionale `web-push`, genera una coppia di chiavi VAPID
e valorizza `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT`. Le
subscription vengono salvate sul disco persistente insieme allo storico.

## Formato messaggio consigliato

```text
🚨 NUOVO SEGNALE
$NOVA
Chain: Solana
CA: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHqD
Entry: $0.0042
MC: $420K
Target: 2x
```
