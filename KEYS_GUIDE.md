# Руководство по ключам доступа

## Что это?

Система ключей доступа защищает приложение от несанкционированного использования. Каждый пользователь должен активировать приложение один раз с помощью уникального ключа.

## Как это работает?

1. **Первый запуск**: При первом открытии приложения пользователь видит окно активации
2. **Ввод ключа**: Пользователь вводит ключ из 16 больших букв (A-Z)
3. **Активация**: После успешной активации ключ становится использованным
4. **Бесконечный доступ**: Активированное устройство получает постоянный доступ

## Генерация ключей

### Способ 1: Через Python скрипт

```bash
cd python-backend
python key_manager.py
```

Выберите пункт `1` для создания новых ключей.

### Способ 2: Через API

```bash
curl -X POST http://localhost:5000/api/keys/generate \
  -H "Content-Type: application/json" \
  -d '{"count": 5}'
```

## Тестовый ключ

Для тестирования создан ключ:
```
TESTKEYMASTERABC
```

Чтобы его активировать:
```bash
cd python-backend
python -c "from key_manager import load_keys, save_keys; data = load_keys(); data['active'].append('TESTKEYMASTERABC'); save_keys(data); print('Тестовый ключ создан!')"
```

## Управление ключами

### Просмотр всех ключей

```bash
cd python-backend
python key_manager.py
# Выберите пункт 2
```

### Просмотр через API

```bash
curl http://localhost:5000/api/keys/list
```

### Сброс активации (для тестирования)

Удалите файл `access_keys.json` и перезапустите сервер:
```bash
cd python-backend
rm access_keys.json
```

Или очистите localStorage в браузере:
```javascript
localStorage.removeItem("app_activated");
```

## Структура файла ключей

Файл `access_keys.json`:
```json
{
  "active": [
    "ABCDEFGHIJKLMNOP",
    "QRSTUVWXYZABCDEF"
  ],
  "used": [
    "TESTKEYMASTERABC"
  ]
}
```

- **active**: Ключи, которые еще не использовались (только большие буквы A-Z)
- **used**: Ключи, которые уже были активированы

## Безопасность

- Ключи генерируются криптографически безопасным методом (`secrets`)
- Каждый ключ можно использовать только один раз
- После активации ключ перемещается из `active` в `used`
- Информация об активации хранится только на устройстве пользователя (localStorage)

## Отключение системы ключей

Если нужно отключить проверку ключей для разработки, измените в `src/App.tsx`:

```typescript
// Было:
const activated = localStorage.getItem("app_activated");
setHasAccess(activated === "true");

// Станет:
setHasAccess(true); // Всегда разрешать доступ
```

## API Endpoints

### POST /api/keys/validate
Проверка и активация ключа
```json
{
  "key": "ABCDEFGHIJKLMNOP"
}
```

### POST /api/keys/generate
Создание новых ключей
```json
{
  "count": 5
}
```

### GET /api/keys/list
Просмотр всех ключей

## Примеры использования

### Создать 10 ключей
```bash
cd python-backend
python -c "from key_manager import create_keys; keys = create_keys(10); print('\\n'.join(keys))"
```

### Проверить ключ
```bash
cd python-backend
python -c "from key_manager import validate_key; result = validate_key('YOUR_KEY_HERE'); print(result)"
```
