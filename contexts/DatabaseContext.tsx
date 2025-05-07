import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { initDatabase } from '@/database/schema';

// Определяем интерфейс для маркеров
interface Marker {
  id: number;
  latitude: number;
  longitude: number;
}

// Определяем интерфейс для изображений маркеров
interface MarkerImage {
  id: number;
  marker_id: number;
  uri: string;
}

// Определяем интерфейс для контекста базы данных
interface DatabaseContextType {
  addMarker: (latitude: number, longitude: number) => Promise<number>;
  deleteMarker: (id: number) => Promise<void>;
  getMarkers: () => Promise<Marker[]>;
  addImage: (markerId: number, uri: string) => Promise<void>;
  deleteImage: (id: number) => Promise<void>;
  getMarkerImages: (markerId: number) => Promise<MarkerImage[]>;
  isLoading: boolean;
  error: Error | null;
}

// Создаем контекст базы данных
const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

// Создаем провайдер для контекста базы данных
export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<SQLite.WebSQLDatabase | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Инициализация базы данных при монтировании компонента
    initDatabase()
      .then(setDb)
      .catch(setError)
      .finally(() => setIsLoading(false));
    return () => {
      if (db) {
        db.closeAsync().catch(console.error);
      }
    };
  }, []);

  // Добавление маркера в базу данных
  const addMarker = async (latitude: number, longitude: number): Promise<number> => {
    if (!db) {
      throw new Error('База данных не инициализирована');
    }
    try {
      const result = await db.runAsync(
        'INSERT INTO markers (latitude, longitude) VALUES (?, ?)',
        [latitude, longitude]
      );
      console.log(`Маркер добавлен: id=${result.lastInsertRowId}, latitude=${latitude}, longitude=${longitude}`);
      return result.lastInsertRowId;
    } catch (error) {
      throw new Error(`Не удалось добавить маркер: ${error}`);
    }
  };

  // Удаление маркера из базы данных
  const deleteMarker = async (id: number): Promise<void> => {
    if (!db) {
      throw new Error('База данных не инициализирована');
    }
    try {
      const result = await db.runAsync('DELETE FROM markers WHERE id = ?', [id]);
      if (result.changes === 0) {
        throw new Error('Маркер не найден');
      }
      console.log(`Маркер удалён: id=${id}`);
    } catch (error) {
      throw new Error(`Не удалось удалить маркер: ${error}`);
    }
  };

  // Получение всех маркеров из базы данных
  const getMarkers = async (): Promise<Marker[]> => {
    if (!db) {
      throw new Error('База данных не инициализирована');
    }
    try {
      const markers = await db.getAllAsync<Marker>('SELECT * FROM markers');
      return markers;
    } catch (error) {
      throw new Error(`Не удалось получить маркеры: ${error}`);
    }
  };

  // Добавление изображения к маркеру
  const addImage = async (markerId: number, uri: string): Promise<void> => {
    if (!db) {
      throw new Error('База данных не инициализирована');
    }
    try {
      const result = await db.runAsync('INSERT INTO marker_images (marker_id, uri) VALUES (?, ?)', [markerId, uri]);
      console.log(`Изображение добавлено: id=${result.lastInsertRowId}, marker_id=${markerId}, uri=${uri}`);
    } catch (error) {
      throw new Error(`Не удалось добавить изображение: ${error}`);
    }
  };

  // Удаление изображения из базы данных
  const deleteImage = async (id: number): Promise<void> => {
    if (!db) {
      throw new Error('База данных не инициализирована');
    }
    try {
      const result = await db.runAsync('DELETE FROM marker_images WHERE id = ?', [id]);
      if (result.changes === 0) {
        throw new Error('Изображение не найдено');
      }
      console.log(`Изображение удалено: id=${id}`);
    } catch (error) {
      throw new Error(`Не удалось удалить изображение: ${error}`);
    }
  };

  // Получение всех изображений для маркера
  const getMarkerImages = async (markerId: number): Promise<MarkerImage[]> => {
    if (!db) {
      throw new Error('База данных не инициализирована');
    }
    try {
      const images = await db.getAllAsync<MarkerImage>(
        'SELECT * FROM marker_images WHERE marker_id = ?',
        [markerId]
      );
      return images;
    } catch (error) {
      throw new Error(`Не удалось получить изображения маркера: ${error}`);
    }
  };

  // Создаем объект контекста
  const contextValue = {
    addMarker,
    deleteMarker,
    getMarkers,
    addImage,
    deleteImage,
    getMarkerImages,
    isLoading,
    error,
  };

  // Возвращаем провайдер контекста с переданными значениями
  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

// Создаем хук для использования контекста базы данных
export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase должен использоваться внутри DatabaseProvider');
  }
  return context;
};