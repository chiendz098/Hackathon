import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './modern-styles.css';
import App from './App';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { GamificationProvider } from './contexts/GamificationContext';
// import { EconomyProvider } from './contexts/EconomyContext';
// import { PetProvider } from './contexts/PetContext';
import { AISchedulerProvider } from './contexts/AISchedulerContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ItemApplicationProvider } from './contexts/ItemApplicationContext';


function OneSignalInit() {
  useEffect(() => {
    if (window.OneSignal) {
      window.OneSignal = window.OneSignal || [];
      window.OneSignal.push(function() {
        window.OneSignal.init({
          appId: 'YOUR_ONESIGNAL_APP_ID', // Thay bằng App ID thật
        });
      });
    }
  }, []);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AuthProvider>
          <ThemeProvider>
                          <NotificationProvider>
                {/* <EconomyProvider> */}
                  {/* <PetProvider> */}
                    <AISchedulerProvider>
                      <ItemApplicationProvider>
                          <GamificationProvider>
                            <OneSignalInit />
                            <App />
                          </GamificationProvider>
                      </ItemApplicationProvider>
                    </AISchedulerProvider>
                  {/* </PetProvider> */}
                {/* </EconomyProvider> */}
              </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);
