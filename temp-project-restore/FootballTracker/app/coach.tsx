import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Link } from 'expo-router';

export default function CoachScreen() {
  const [sessionType, setSessionType] = useState('');
  const [fieldSize, setFieldSize] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [trackingData, setTrackingData] = useState([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const { data, error } = await supabase.from('sessions').select('*');
    if (error) {
      Alert.alert('Erro', error.message);
    } else {
      setSessions(data);
    }
  };

  const createSession = async () => {
    if (!sessionType || !fieldSize) {
      Alert.alert('Erro', 'Preencha tipo e tamanho do campo');
      return;
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert([{ type: sessionType, field_size: fieldSize, start_time: new Date() }])
      .select()
      .single();

    if (error) {
      Alert.alert('Erro', error.message);
    } else {
      Alert.alert('Sucesso', `Sessão criada com ID: ${data.id}`);
      fetchSessions();
    }
  };

  const endSession = async (id) => {
    const { error } = await supabase
      .from('sessions')
      .update({ end_time: new Date() })
      .eq('id', id);

    if (error) {
      Alert.alert('Erro', error.message);
    } else {
      fetchSessions();
    }
  };

  const viewSessionData = async (sessionId) => {
    setSelectedSession(sessionId);
    const { data, error } = await supabase
      .from('tracking_data')
      .select('*, players(name)')
      .eq('session_id', sessionId);

    if (error) {
      Alert.alert('Erro', error.message);
    } else {
      setTrackingData(data);
    }
  };

  const calculateStats = (data) => {
    if (data.length === 0) return {};

    const speeds = data.map(d => d.speed).filter(s => s > 0);
    const maxSpeed = Math.max(...speeds);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

    // Calculate distance (simplified, using haversine for real distance)
    let totalDistance = 0;
    for (let i = 1; i < data.length; i++) {
      const prev = data[i-1];
      const curr = data[i];
      const dist = Math.sqrt((curr.latitude - prev.latitude)**2 + (curr.longitude - prev.longitude)**2) * 111000; // approx meters
      totalDistance += dist;
    }

    return {
      maxSpeed: maxSpeed.toFixed(2),
      avgSpeed: avgSpeed.toFixed(2),
      totalDistance: (totalDistance / 1000).toFixed(2), // km
    };
  };

  const stats = calculateStats(trackingData);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modo Treinador</Text>
      <TextInput
        style={styles.input}
        placeholder="Tipo de Sessão (treino, amistoso, campeonato)"
        value={sessionType}
        onChangeText={setSessionType}
      />
      <TextInput
        style={styles.input}
        placeholder="Tamanho do Campo (ex: 100x60)"
        value={fieldSize}
        onChangeText={setFieldSize}
      />
      <TouchableOpacity style={styles.button} onPress={createSession}>
        <Text style={styles.buttonText}>Criar Sessão</Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>Sessões Ativas</Text>
      <FlatList
        data={sessions.filter(s => !s.end_time)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.sessionItem}>
            <Text>{item.type} - {item.field_size}</Text>
            <TouchableOpacity onPress={() => viewSessionData(item.id)}>
              <Text style={styles.link}>Ver Dados</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => endSession(item.id)}>
              <Text style={styles.link}>Finalizar</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {selectedSession && (
        <View style={styles.statsContainer}>
          <Text style={styles.subtitle}>Estatísticas da Sessão</Text>
          <Text>Velocidade Máxima: {stats.maxSpeed} m/s</Text>
          <Text>Velocidade Média: {stats.avgSpeed} m/s</Text>
          <Text>Distância Total: {stats.totalDistance} km</Text>
        </View>
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
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
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  subtitle: {
    fontSize: 18,
    marginVertical: 10,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  link: {
    color: '#007AFF',
  },
  statsContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
});