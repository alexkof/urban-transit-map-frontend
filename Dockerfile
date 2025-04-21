# Шаг 1: Сборка приложения
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --force
COPY . .
RUN npm run build

# Шаг 2: Запуск
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
RUN npm install --only=production --force

CMD ["npm", "start"]

#docker build -t next-app-prod .
#docker run -p 3000:3000 next-app-prod