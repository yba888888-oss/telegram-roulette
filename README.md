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

## Примечания

- Балансы пользователей хранятся в памяти (в словаре). Для продакшена используйте базу данных
- Для пополнения баланса нужно интегрировать платежную систему Telegram или другую
- Убедитесь, что Web App URL доступен по HTTPS и правильно настроен в BotFather
