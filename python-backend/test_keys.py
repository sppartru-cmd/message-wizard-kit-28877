"""
Тестовый скрипт для проверки системы ключей
"""

from key_manager import create_keys, validate_key, list_keys

print("=== Тест системы ключей ===\n")

# 1. Загрузка ключей
print("1. Загрузка ключей...")
keys_data = list_keys()
print(f"   Активных ключей: {len(keys_data['active'])}")
print(f"   Использованных ключей: {len(keys_data['used'])}")
print(f"   Активные: {keys_data['active']}")
print()

# 2. Проверка тестового ключа
print("2. Проверка тестового ключа...")
if "TESTKEYMASTERABC" in keys_data['active']:
    print("   ✅ Тестовый ключ найден в активных")
elif "TESTKEYMASTERABC" in keys_data['used']:
    print("   ⚠️ Тестовый ключ уже использован")
    print("   Создаю новый тестовый ключ...")
    keys_data['active'].append("TESTKEYMASTERABC")
    from key_manager import save_keys
    save_keys(keys_data)
    print("   ✅ Тестовый ключ добавлен обратно")
else:
    print("   ❌ Тестовый ключ не найден, создаю...")
    keys_data['active'].append("TESTKEYMASTERABC")
    from key_manager import save_keys
    save_keys(keys_data)
    print("   ✅ Тестовый ключ создан")
print()

# 3. Создание нового ключа
print("3. Создание нового ключа...")
new_keys = create_keys(1)
print(f"   ✅ Создан ключ: {new_keys[0]}")
print()

# 4. Проверка валидации
print("4. Проверка валидации...")
result = validate_key("INVALIDKEY")
print(f"   Невалидный ключ: {result}")

print("\n=== Тест завершен ===")
print(f"\nИспользуйте этот ключ для входа: TESTKEYMASTERABC")
