# Используем Node.js LTS версию
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json ./
RUN npm install --production

# Копируем исходный код
COPY main.js ./

# Открываем порт
EXPOSE 8000

# Запускаем приложение
CMD ["node", "main.js"]

