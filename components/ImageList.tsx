import React from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';

// Интерфейс для пропсов компонента ImageList
interface ImageListProps {
  images: string[]; // массив uri изображений
  onLongPress: (uri: string) => void; // функция обратного вызова для долгого нажатия
}

const ImageList: React.FC<ImageListProps> = ({ images, onLongPress }) => { // принимает массив изображений и функцию обратного вызова
  return (
    <FlatList
      data={images}
      keyExtractor={(index) => index.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity onLongPress={() => onLongPress(item)}>
          <Image source={{ uri: item }} style={styles.image} />
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    width: 100,
    height: 100,
    margin: 5,
  },
});

export default ImageList;