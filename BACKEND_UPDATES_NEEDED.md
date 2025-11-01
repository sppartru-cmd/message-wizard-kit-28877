# Необходимые изменения в Python Backend

## 1. Проверка номеров (CheckNumbers)

### Текущая проблема:
Когда номер телефона недействителен, WhatsApp показывает всплывающее окно "Номер телефона, отправленный по ссылке, недействительный", но номер не добавляется в список незарегистрированных.

### Необходимые изменения в `whatsapp_sender.py`:

```python
def check_number(self, phone_number):
    """
    Проверяет, зарегистрирован ли номер в WhatsApp
    """
    try:
        # Существующая логика проверки
        # ...
        
        # ДОБАВИТЬ: Обработку всплывающего окна об ошибке
        try:
            # Ждем появления окна с ошибкой (на русском)
            error_popup = WebDriverWait(self.driver, 3).until(
                EC.presence_of_element_located((
                    By.XPATH, 
                    "//div[contains(text(), 'недействительный') or contains(text(), 'invalid')]"
                ))
            )
            
            # Если окно найдено - номер недействителен
            if error_popup:
                # Закрываем окно
                ok_button = self.driver.find_element(
                    By.XPATH, 
                    "//div[@role='button' and (contains(text(), 'OK') or contains(text(), 'ОК'))]"
                )
                ok_button.click()
                time.sleep(0.5)
                
                # Возвращаем, что номер НЕ зарегистрирован
                return {
                    'phone': phone_number,
                    'registered': False,
                    'reason': 'Invalid phone number'
                }
        except TimeoutException:
            # Окна с ошибкой нет - продолжаем обычную проверку
            pass
        
        # Остальная логика проверки
        # ...
        
    except Exception as e:
        logger.error(f"Error checking number {phone_number}: {e}")
        return {
            'phone': phone_number,
            'registered': False,
            'reason': f'Error: {str(e)}'
        }
```

### В `api_server.py` обновите endpoint `/api/check-numbers`:

```python
@app.route('/api/check-numbers', methods=['POST'])
def check_numbers():
    data = request.get_json()
    profile_name = data.get('profile_name')
    phone_numbers = data.get('phone_numbers', [])
    
    if not profile_name or not phone_numbers:
        return jsonify({
            'success': False,
            'message': 'Profile name and phone numbers are required'
        }), 400
    
    try:
        sender = get_or_create_sender(profile_name)
        
        registered = []
        unregistered = []
        
        for phone in phone_numbers:
            try:
                result = sender.check_number(phone)
                
                if result['registered']:
                    registered.append(phone)
                else:
                    unregistered.append(phone)
                    
            except Exception as e:
                logger.error(f"Error checking {phone}: {e}")
                # При ошибке считаем номер незарегистрированным
                unregistered.append(phone)
        
        return jsonify({
            'success': True,
            'registered': registered,
            'unregistered': unregistered,
            'message': f'Checked {len(phone_numbers)} numbers'
        })
        
    except Exception as e:
        logger.error(f"Error in check_numbers: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
```

## 2. Случайная задержка (1-4 минуты)

### В `whatsapp_sender.py`:

```python
def mass_send(self, phone_numbers, messages, delay_config):
    """
    Массовая рассылка с улучшенной логикой задержек
    """
    random_delay = delay_config.get('random', False)
    
    for phone in phone_numbers:
        # Отправка сообщения
        # ...
        
        # Применяем задержку
        if random_delay:
            # Случайная задержка от 1 до 4 минут (60-240 секунд)
            delay_seconds = random.randint(60, 240)
        else:
            delay_seconds = delay_config.get('delay', 30)
        
        logger.info(f"Waiting {delay_seconds} seconds before next message...")
        time.sleep(delay_seconds)
```

## 3. Логирование и управление процессом

Для полной поддержки логирования, паузы и остановки потребуется более сложная архитектура с использованием:
- WebSocket для real-time обновлений
- Очереди задач (например, Celery)
- Хранение состояния процесса

### Пример минимальной реализации:

```python
# global state для управления процессом
mass_send_state = {
    'active': False,
    'paused': False,
    'progress': {'current': 0, 'total': 0}
}

@app.route('/api/mass-send/status', methods=['GET'])
def get_mass_send_status():
    return jsonify(mass_send_state)

@app.route('/api/mass-send/pause', methods=['POST'])
def pause_mass_send():
    mass_send_state['paused'] = True
    return jsonify({'success': True})

@app.route('/api/mass-send/resume', methods=['POST'])
def resume_mass_send():
    mass_send_state['paused'] = False
    return jsonify({'success': True})

@app.route('/api/mass-send/stop', methods=['POST'])
def stop_mass_send():
    mass_send_state['active'] = False
    return jsonify({'success': True})
```

## 4. Группы профилей

Группы профилей хранятся в `localStorage` на фронтенде, поэтому изменения в backend не требуются.
Backend уже поддерживает отправку с нескольких профилей через существующий API.

## Примечания

- Все изменения должны быть протестированы в dev окружении
- Рекомендуется добавить логирование всех операций
- Для production желательно использовать WebSocket для real-time обновлений
- Рассмотрите использование Celery или RQ для фоновых задач

## Тестирование

После внесения изменений проверьте:
1. ✅ Недействительные номера добавляются в "Не зарегистрированы"
2. ✅ Всплывающие окна WhatsApp закрываются автоматически
3. ✅ Случайная задержка работает в диапазоне 1-4 минуты
4. ✅ Процесс проверки продолжается после ошибок
