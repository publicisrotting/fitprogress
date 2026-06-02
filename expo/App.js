import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRef, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';

const DEFAULT_WEB_APP_PORT = 5174;
const FALLBACK_WEB_APP_URL = 'http://127.0.0.1:5174';

function extractHost(value) {
  if (!value) return null;
  const withoutProto = String(value).replace(/^[a-z]+:\/\//i, '');
  const hostPort = withoutProto.split('/')[0];
  if (!hostPort) return null;
  return hostPort.split(':')[0] || null;
}

function getDevHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoConfig?.debuggerHost ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    null;
  return extractHost(hostUri);
}

export default function App() {
  const webViewRef = useRef(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isWebLoading, setIsWebLoading] = useState(true);

  const config = Constants.expoConfig?.extra || {};
  const webAppPort = Number(config.webAppPort || DEFAULT_WEB_APP_PORT);
  const webAppUrlOverride = typeof config.webAppUrl === 'string' ? config.webAppUrl : '';
  const devHost = getDevHost();
  const webAppUrl =
    (webAppUrlOverride && webAppUrlOverride.trim()) ||
    (devHost ? `http://${devHost}:${webAppPort}` : FALLBACK_WEB_APP_URL);

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
          <Text style={styles.errorText}>URL: {webAppUrl}</Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsWebLoading(true);
              webViewRef.current?.reload?.();
            }}
          >
            <Text style={styles.retryText}>Повторить</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.webviewWrapper}>
          <WebView
            ref={webViewRef}
            source={{ uri: webAppUrl }}
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
            onLoadStart={() => setIsWebLoading(true)}
            onLoadEnd={() => setIsWebLoading(false)}
            onError={(e) => setError(e?.nativeEvent?.description || 'WebView error')}
            onHttpError={(e) => setError(`HTTP ${e?.nativeEvent?.statusCode || ''}`)}
          />
          {isWebLoading ? (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Загрузка…</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webviewWrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
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
