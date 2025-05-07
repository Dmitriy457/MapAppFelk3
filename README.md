# Инструкция по установке

**Требования:**

- Node.js
- Expo CLI
- Приложение Expo Go на смартфоне



**Установка и запуск:**

1. `https://github.com/Dmitriy457/MapAppFelk.git`
   `cd MapAppFelk`

2. `npx expo install expo-image`

   `npx expo install expo-image-picker`

   `npx expo install react-native-maps`

3. `npx expo start`

4. Просканируйте появившийся QR-код через приложение Expo Go

5. Готово!

   



# Краткoe описание принятых решений

- Хранение координат маркеров и изображений в `AsyncStorage`.

- В качестве id маркеров использовался json c координатами

- Использование `expo-image-picker` для выбора изображений из галереи.

- Использование `AsyncStorage` для хранения изображений

- Маршрутизация с помощью `expo-router`.

  

# Дополнительные реализованные функции

- Удаление маркеров по долгому нажатию.


# Видео работы приложения

https://github.com/user-attachments/assets/dbf78c0e-851c-4370-b098-353471ab76da


