import os
import json
import logging
from dotenv import load_dotenv
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, ContextTypes, filters
from telegram.constants import ParseMode

# Загружаем переменные окружения из .env файла
load_dotenv()

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Токен бота (получите его у @BotFather)
BOT_TOKEN = os.getenv('BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')

# Хранилище балансов пользователей (в реальном проекте используйте БД)
user_balances = {}

# Получить абсолютный путь к HTML файлу
def get_web_app_url():
    # Для локального тестирования используйте ngrok или другой туннель
    # В продакшене загрузите файлы на хостинг
    web_app_url = os.getenv('WEB_APP_URL', 'https://your-domain.com/roulette.html')
    return web_app_url

# Команда /start
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    # Инициализация баланса, если пользователь новый
    if user_id not in user_balances:
        user_balances[user_id] = 0
    
    keyboard = [
        [InlineKeyboardButton("🎰 Открыть рулетку", web_app=WebAppInfo(url=get_web_app_url()))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"Привет, {update.effective_user.first_name}! 👋\n\n"
        f"Ваш баланс: {user_balances[user_id]} $Mori\n\n"
        f"Нажмите кнопку ниже, чтобы открыть рулетку:",
        reply_markup=reply_markup
    )

# Команда /balance
async def balance(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    if user_id not in user_balances:
        user_balances[user_id] = 0
    
    await update.message.reply_text(
        f"💰 Ваш баланс: {user_balances[user_id]} $Mori"
    )

# Обработка данных из Web App
async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    try:
        # Получаем данные из Web App
        data = json.loads(update.message.web_app_data.data)
        logger.info(f"Received data from user {user_id}: {data}")
        
        if data.get('type') == 'spin_result':
            prize = data.get('prize', 0)
            if user_id not in user_balances:
                user_balances[user_id] = 0
            user_balances[user_id] += prize
            await update.message.reply_text(
                f"🎉 Поздравляем! Вы выиграли {prize} $Mori!\n"
                f"💰 Ваш новый баланс: {user_balances[user_id]} $Mori"
            )
        
        elif data.get('type') == 'top_up_balance':
            # Здесь должна быть интеграция с платежной системой
            # Для примера просто добавляем баланс
            if user_id not in user_balances:
                user_balances[user_id] = 0
            user_balances[user_id] += 100
            await update.message.reply_text(
                f"✅ Баланс пополнен на 100 $Mori\n"
                f"💰 Ваш баланс: {user_balances[user_id]} $Mori"
            )
        
        elif data.get('type') == 'get_balance':
            # Отправляем баланс обратно в веб-приложение
            if user_id not in user_balances:
                user_balances[user_id] = 0
            # К сожалению, нельзя напрямую отправить данные обратно в Web App
            # Баланс будет обновляться при каждом спин-результате
            logger.info(f"Balance requested by user {user_id}: {user_balances[user_id]}")
    
    except json.JSONDecodeError:
        logger.error(f"Failed to parse web app data from user {user_id}")
        await update.message.reply_text("❌ Ошибка обработки данных")

# Обработка обычных сообщений
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("🎰 Открыть рулетку", web_app=WebAppInfo(url=get_web_app_url()))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Используйте команды:\n"
        "/start - Начать работу с ботом\n"
        "/balance - Проверить баланс\n"
        "Или нажмите кнопку ниже, чтобы открыть рулетку:",
        reply_markup=reply_markup
    )

# Главная функция
def main():
    if BOT_TOKEN == 'YOUR_BOT_TOKEN_HERE':
        logger.error("Пожалуйста, установите BOT_TOKEN в переменных окружения или в коде!")
        return
    
    # Создаем приложение
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Регистрируем обработчики
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("balance", balance))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Запускаем бота
    logger.info("Бот запущен...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
