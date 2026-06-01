import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';


const WEB_APP_URL = 'http://192.168.3.148:5174';

export default function App() {
  const webViewRef = useRef(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Нет подключения к интернету</Text>
          <Text style={styles.errorText}>Проверьте соединение и попробуйте снова</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              NetInfo.refresh();
            }}
          >
            <Text style={styles.retryText}>Проверить</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Ошибка загрузки</Text>
          <Text style={styles.errorText}>{String(error)}</Text>
          <Text style={styles.errorText}>URL: {WEB_APP_URL}</Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              webViewRef.current?.reload?.();
            }}
          >
            <Text style={styles.retryText}>Повторить</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: WEB_APP_URL }}
          style={styles.webview}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={false}
          scrollEnabled={true}
          bounces={false}
          overScrollMode="never"
          allowsInlineMediaPlayback={true}
          onError={(e) =>
            setError(e?.nativeEvent?.description || 'WebView error')
          }
          onHttpError={(e) =>
            setError(`HTTP ${e?.nativeEvent?.statusCode || ''}`)
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#000',
    fontWeight: '700',
  },
});