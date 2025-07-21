import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';

import { Provider } from 'react-redux'; // Importa Provider de react-redux
import { store } from './store'; // Importa tu store de Redux

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="light">
      {/* Ahora envolvemos la aplicación con el Provider de Redux */}
      <Provider store={store}>
        <App />
      </Provider>
    </MantineProvider>
  </React.StrictMode>,
);