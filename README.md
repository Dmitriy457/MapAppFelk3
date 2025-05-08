# Инструкция по установке

**Основные требования:**

- Node.js
- Expo CLI
- Приложение Expo Go на смартфоне



**Установка и запуск:**

1. ```shell
   git clone https://github.com/Dmitriy457/MapAppFelk3.git
   cd MapAppFelk3
   ```

2. ```shell
   npx expo install expo-image
   npx expo install expo-image-picker
   npx expo install react-native-maps
   npx expo install expo-sqlite
   npx expo install expo-location
   npx expo install expo-notifications
   ```

3. ```shell
   npx expo start
   ```

4. Просканируйте появившийся QR-код через приложение Expo Go

5. Готово!





# Тестирование

Для тестирования было использовано приложение [Fake GPS](https://play.google.com/store/apps/details?id=com.blogspot.newapphorizons.fakegps) для задания произвольных координат. Для этого необходимо включить режим разработчика на устройстве и задать приложение в качестве источника фиктивных местоположений.

В самом приложении можно указать нужную геопозицию: 

<img src="/home/dfelk/.config/Typora/typora-user-images/image-20250508142752936.png" alt="image-20250508142752936" style="zoom: 25%;" />



И уже в приложении Expo локация также изменится:



<img src="/home/dfelk/.config/Typora/typora-user-images/image-20250508142926278.png" alt="image-20250508142926278" style="zoom:25%;" />





# Управление уведомлениями

Уведомление отправляется, когда пользователь приближается к метке ближе 50 метров. Для вычисления расстояния используется библиотека *haversine*:

```typescript
import haversine from 'haversine'; // импортируем библиотеку для расчета расстояния между координатами

useEffect(() => {
    if (!currentLocation || markers.length === 0) return; // если нет текущей геолокации или маркеров, выходим

    markers.forEach(async marker => {
      const distance = haversine( // считаем растояние между текущей геолокацией и маркером
        { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
        { latitude: marker.latitude, longitude: marker.longitude }
      );

      if (distance < 0.05 && !notifiedMarkers.includes(marker.id)) { // если расстояние меньше 50 метров и уведомление для данного маркера еще не отправлено
        await Notifications.scheduleNotificationAsync({ // отправляем уведомление
          content: {
            title: 'Вы рядом с маркером!',
            body: `Маркер: ${JSON.stringify(marker)}`,
          },
          trigger: null, // уведомление будет показано немедленно
        });
        console.log(`Вы находитесь рядом с маркером: ${JSON.stringify(marker)}`);
        setNotifiedMarkers((prev) => [...prev, marker.id]); // добавляем id маркера в список уведомленных маркеров
      } else if (distance >= 0.05 && notifiedMarkers.includes(marker.id)) { // если пользователь покинул зону
        setNotifiedMarkers((prev) => prev.filter((id) => id !== marker.id)); // удаляем маркер из списка уведомленных маркеров
      }
    });
  }, [currentLocation, markers, notifiedMarkers]); // зависимость от текущей геолокации и маркеров
```



Для отслеживания отправленных уведомлений, чтобы они не дублировались, используется *useState*. При нахождении в радиусе 50 метров от маркера уведомление считается отправленным и его *id* хранится в массиве, если пользователь удаляется от маркера, или удаляет его с карты, то *id* соответствующего уведомления также убирается из массива.  

```typescript
const [notifiedMarkers, setNotifiedMarkers] = useState([]); // состояние для хранения маркеров, для которых уже были отправлены уведомления

```




# Видео работы приложения



