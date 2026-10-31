import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.korbazar.app',
  appName: 'KorBazar',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
