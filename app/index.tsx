import { useState, useEffect } from "react";
import { StyleSheet, View, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useRouter } from 'expo-router';
import { useDatabase } from '@/contexts/DatabaseContext'; 
import * as Location from 'expo-location'; // импортируем библиотеку для работы с геолокацией
import * as Notifications from 'expo-notifications'; // импортируем библиотеку для работы с локальными уведомлениями
import haversine from 'haversine'; // импортируем библиотеку для расчета расстояния между координатами

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%'
  },
});

export default function App() {
  const [markers, setMarkers] = useState([]) // состояние для хранения маркеров

  const [currentLocation, setCurrentLocation] = useState(null); // состояние для хранения текущей геолокации
  const [notifiedMarkers, setNotifiedMarkers] = useState([]); // состояние для хранения маркеров, для которых уже были отправлены уведомления
  
  const { addMarker, getMarkers, deleteMarker} = useDatabase(); // импортируем функции из контекста для работы с базой данных
  const router = useRouter() // используем роутер для навигации между экранами


  // Запрашиваем разрешение на отправку уведомлений при первом запуске приложения
  useEffect(() => {
    const requestNotificationPermission = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') { // если разрешение не получено, выводим сообщение об ошибке
        Alert.alert('Ошибка', 'Разрешение на отправку уведомлений отклонено');
      }
    };
    requestNotificationPermission();
  }, []);


  // Настройка обработчика уведомлений
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true, // показывать уведомление, даже если приложение активно
        shouldPlaySound: true, // воспроизводить звук уведомления
        shouldSetBadge: true, // устанавливать значок уведомления
      }),
    });
  }, []);


  // Получаем текущую геолокацию при монтировании компонента
  useEffect(() => {
    let locationSubscription; // переменная для хранения подписки на геолокацию

    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync(); // запрашиваем разрешение на доступ к геолокации
      if (status !== 'granted') { // если разрешение не получено, выходим из функции
        Alert.alert('Ошибка', 'Разрешение на доступ к геолокации отклонено'); // выводим сообщение об ошибке
        return;
      }

      locationSubscription = await Location.watchPositionAsync({
        accuracy: Location.Accuracy.High, // устанавливаем высокую точность геолокации
        timeInterval: 1000, // устанавливаем интервал обновления геолокации в 1 секунду
        distanceInterval: 1, // устанавливаем интервал обновления геолокации в 1 метр
      },
      (location) => {
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.005,
        });
      });
      
    };

    getLocation(); // вызываем функцию получения геолокации

    return () => {
      if (locationSubscription) { // если подписка на геолокацию существует
        locationSubscription.remove(); // удаляем подписку на геолокацию при размонтировании компонента
      }
    };

  }, []); // пустой массив зависимостей, чтобы функция выполнялась только при монтировании компонента


  // Загружаем маркеры из базы данных
  useEffect(() => {
    const loadMarkers = async () => {
      const loadedMarkers = await getMarkers();
      setMarkers(loadedMarkers);
    };
    loadMarkers();
  }, [getMarkers]);  // зависимость от getMarkers, чтобы перезагрузить маркеры при изменении состояния

  const handleLongPress = async (e) => { 
    const coordinate = e.nativeEvent.coordinate; // извлекаем координаты из события долгого нажатия
    const existingMarkerIndex = markers.findIndex(marker =>
      marker.latitude === coordinate.latitude && marker.longitude === coordinate.longitude
    ); 
    // Проверяем, существует ли уже маркер с такими координатами
    if (existingMarkerIndex === -1) {
      const markerId = await addMarker(coordinate.latitude, coordinate.longitude); // добавляем маркер в базу данных
      setMarkers([...markers, { id: markerId, ...coordinate }]); // обновляем состояние маркеров
    } else {
      const markerId = markers[existingMarkerIndex].id; // получаем id существующего маркера
      await deleteMarker(markerId); // Удаляем маркер из базы данных
      setMarkers(markers.filter((_, index) => index !== existingMarkerIndex)); // обновляем состояние маркеров
      setNotifiedMarkers((prev) => prev.filter((id) => id !== markerId)); // удаляем маркер из списка уведомленных маркеров
    }
  };

  const handleMarkerPress = (coordinate) => {
    router.push(`/marker/${encodeURIComponent(JSON.stringify(coordinate))}`); // используем в качестве id json c координатами и переходим на экран маркера
  };

  // отрисовка маркеров на карте
  const markersRendered = markers.map((elem, idx) => (
    <Marker coordinate={elem} key={idx}
      onPress={() => handleMarkerPress(elem)}
    />
  ));

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

 
  // отображаем карту с маркерами и текущей геолокацией
  return (
    <View style={styles.container}>
      <MapView style={styles.map}
        region={currentLocation}
        onLongPress={handleLongPress}
        showsUserLocation={true}
        loadMarkers={true}
      >
        {markersRendered}
      </MapView>
    </View>
  );
}