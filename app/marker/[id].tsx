import { useLocalSearchParams } from "expo-router";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect } from "react";
import { useDatabase } from '@/contexts/DatabaseContext'; 
import ImageList from '@/components/ImageList'; 

export default function MarkerDetails() {
  const { id } = useLocalSearchParams(); // Получаем id
  const coordinate = JSON.parse(decodeURIComponent(id)); // Получаем координаты
  const [images, setImages] = useState<string[]>([]); 
  const { getMarkerImages, addImage, deleteImage, getMarkers } = useDatabase(); // Добавили getMarkers

  useEffect(() => {
    const loadImages = async () => {
      try {
        const markerId = await getMarkerId(coordinate.latitude, coordinate.longitude);
        if (markerId) {
          const loadedImages = await getMarkerImages(markerId);
          setImages(loadedImages.map(image => image.uri));
        }
      } catch (error) {
        console.error('Ошибка загрузки изображений:', error);
      }
    };
    loadImages();
  }, [coordinate]);

  // Обработчик нажатия на кнопку "Добавить изображение"
  const pickImageAsync = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const markerId = await getMarkerId(coordinate.latitude, coordinate.longitude);
        if (markerId) { // Если маркер найден
          await addImage(markerId, result.assets[0].uri);
          const loadedImages = await getMarkerImages(markerId);
          setImages(loadedImages.map(image => image.uri));
        } else { // Если маркер не найден
          throw new Error('Маркер не найден');
        }
      } else { // Если пользователь отменил выбор изображения
        alert('Вы не выбрали изображение');
      }
    } catch (error) { // Обработка ошибок
      console.error('Ошибка добавления изображения:', error);
      alert('Не удалось добавить изображение');
    }
  };

  // Обработчик долгого нажатия для удаления изображения
  const handleLongPress = async (uri: string) => {
    try {
      const markerId = await getMarkerId(coordinate.latitude, coordinate.longitude);
      if (markerId) {
        const imageId = await getImageId(markerId, uri);
        if (imageId) {
          await deleteImage(imageId);
          const loadedImages = await getMarkerImages(markerId);
          setImages(loadedImages.map(image => image.uri));
        }
      }
    } catch (error) {
      console.error('Ошибка удаления изображения:', error);
      alert('Не удалось удалить изображение');
    }
  };

  // Получаем ID маркера по координатам
  const getMarkerId = async (latitude: number, longitude: number): Promise<number | null> => {
    try {
      const markers = await getMarkers();
      const marker = markers.find(m => m.latitude === latitude && m.longitude === longitude);
      return marker ? marker.id : null;
    } catch (error) {
      console.error('Ошибка получения ID маркера:', error);
      return null;
    }
  };
  
  // Получаем ID изображения по URI
  const getImageId = async (markerId: number, uri: string): Promise<number | null> => {
    try {
      const images = await getMarkerImages(markerId);
      const image = images.find(img => img.uri === uri);
      return image ? image.id : null;
    } catch (error) {
      console.error('Ошибка получения ID изображения:', error);
      return null;
    }
  }; 

  

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        <Text style={styles.boldText}>Координаты маркера:</Text> {coordinate.latitude} {coordinate.longitude}
      </Text>

      <ImageList images={images} onLongPress={handleLongPress} />

      <TouchableOpacity style={styles.button} onPress={pickImageAsync}>
        <Text style={styles.buttonText}>Добавить изображение</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "top",
    alignItems: "center",
    padding: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },
  image: {
    width: 100,
    height: 100,
    margin: 5,
  },
  button: {
    marginTop: 20,
    padding: 20,
    borderRadius: 50,
    backgroundColor: '#00ff0055',
  },
  buttonText: {
    color: '#000000',
    fontSize: 20,
  }
});