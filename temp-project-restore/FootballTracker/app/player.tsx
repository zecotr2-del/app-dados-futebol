import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { Link } from 'expo-router';

export default function PlayerScreen() {
  const [playerName, setPlayerName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState(null);

  const startTracking = async () => {
    if (!playerName || !sessionId) {
      Alert.alert('Erro', 'Preencha nome e ID da sessão');
      return;
    }

    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert([{ name: playerName }])
      .select()
      .single();

    if (playerError) {
      Alert.alert('Erro', playerError.message);
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à localização');
      return;
    }

    setIsTracking(true);

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // 5 seconds
        distanceInterval: 10, // 10 meters
      },
      async (location) => {
        const { latitude, longitude, speed } = location.coords;
        await supabase.from('tracking_data').insert([
          {
            player_id: player.id,
            session_id: sessionId,
            latitude,
            longitude,
            speed: speed || 0,
          },
        ]);
      }
    );

    setLocationSubscription(subscription);
  };

  const stopTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
    }
    setIsTracking(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modo Jogador</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome do Jogador"
        value={playerName}
        onChangeText={setPlayerName}
      />
      <TextInput
        style={styles.input}
        placeholder="ID da Sessão"
        value={sessionId}
        onChangeText={setSessionId}
      />
      {!isTracking ? (
        <TouchableOpacity style={styles.button} onPress={startTracking}>
          <Text style={styles.buttonText}>Iniciar Rastreamento</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopTracking}>
          <Text style={styles.buttonText}>Parar Rastreamento</Text>
        </TouchableOpacity>
      )}
      <Link href="/" style={styles.link}>
        <Text>Voltar</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    marginBottom: 10,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  link: {
    marginTop: 20,
    color: '#007AFF',
  },
});