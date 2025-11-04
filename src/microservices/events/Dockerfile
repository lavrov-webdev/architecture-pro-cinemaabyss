# Используем Node.js LTS версию
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json для кэширования зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --production

# Копируем исходный код
COPY main.js ./

# Открываем порт
EXPOSE 8082

# Запускаем приложение
CMD ["node", "main.js"]

