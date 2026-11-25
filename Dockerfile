# ---- Build image for the whole app (API + static frontend) ----
FROM node:20-alpine

WORKDIR /app

# 1) Install dependencies first. Docker caches this layer, so rebuilds are fast
#    as long as package.json does not change.
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# 2) Copy the source code
COPY backend ./backend
COPY frontend ./frontend

# 3) Run as a non-root user (safer)
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

WORKDIR /app/backend
CMD ["node", "server.js"]
