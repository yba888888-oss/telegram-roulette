# Telegram Bot - Рулетка

Telegram бот с веб-приложением рулетки.

## Установка

1. Установите Python 3.8 или выше
2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Получите токен бота у [@BotFather](https://t.me/BotFather)
4. Создайте файл `.env` на основе `.env.example` и укажите ваш токен:
```
BOT_TOKEN=your_actual_bot_token_here
WEB_APP_URL=https://your-domain.com/roulette.html
```

## Настройка Web App

Для работы веб-приложения нужно:

1. Загрузить файлы `roulette.html`, `roulette.js`, `roulette.css` и `coin_base64_data.js` на веб-хостинг
2. Убедиться, что файлы доступны по HTTPS
3. Указать URL в переменной окружения `WEB_APP_URL` или в коде

Для локальной разработки можно использовать:
- [ngrok](https://ngrok.com/) для создания HTTPS туннеля
- [localtunnel](https://localtunnel.github.io/www/)
- Любой другой туннель с HTTPS

## Запуск

```bash
python bot.py
```

## Команды бота

- `/start` - Начать работу с ботом
- `/balance` - Проверить баланс

## Деплой на облачный хостинг (для постоянной работы)

### Railway.app (рекомендуется)

1. Зарегистрируйтесь на [Railway.app](https://railway.app)
2. Создайте новый проект из GitHub репозитория
3. Добавьте переменную окружения `BOT_TOKEN` в настройках проекта
4. Добавьте переменную окружения `WEB_APP_URL` (URL вашего Web App на GitHub Pages)
5. Railway автоматически запустит бота

### Render.com

1. Зарегистрируйтесь на [Render.com](https://render.com)
2. Создайте новый "Web Service" из GitHub репозитория
3. Укажите:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python bot.py`
4. Добавьте переменные окружения `BOT_TOKEN` и `WEB_APP_URL`
5. Render запустит бота

### PythonAnywhere

1. Зарегистрируйтесь на [PythonAnywhere](https://www.pythonanywhere.com)
2. Загрузите код через Git или вручную
3. Установите зависимости: `pip3.10 install --user -r requirements.txt`
4. Создайте задачу в "Tasks" для запуска `bot.py`
5. Добавьте переменные окружения в "Files" → `.env`

### Важно при деплое

- Файл `user_data.json` будет создаваться автоматически на сервере
- При перезапуске сервера данные сохранятся (если используется постоянное хранилище)
- Убедитесь, что `WEB_APP_URL` указывает на ваш GitHub Pages или другой хостинг

## Примечания

- Балансы пользователей хранятся в файле `user_data.json` (сохраняется между перезапусками)
- Для продакшена рекомендуется использовать базу данных (SQLite, PostgreSQL, MongoDB)
- Для пополнения баланса нужно интегрировать платежную систему Telegram или другую
- Убедитесь, что Web App URL доступен по HTTPS и правильно настроен в BotFather
