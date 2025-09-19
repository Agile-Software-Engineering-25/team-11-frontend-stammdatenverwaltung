import { BrowserRouter } from 'react-router';
import RoutingComponent from '@components/RoutingComponent/RoutingComponent';
import { createCustomTheme } from '@agile-software/shared-components';
import { THEME_ID as MATERIAL_THEME_ID, ThemeProvider } from '@mui/material';
import { CssVarsProvider as JoyCssVarsProvider } from '@mui/joy';
import './i18n';
import { Provider } from 'react-redux';
import store from '@stores/index.ts';
import { MessageProvider } from '@/components/MessageProvider/MessageProvider';

const theme = createCustomTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          500: '#your-primary-color',
        },
      },
    },
  },
  components: {
    JoyButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
  },
});

type AppProps = {
  basename?: string;
};

function App({ basename }: AppProps) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={{ [MATERIAL_THEME_ID]: theme }}>
        <JoyCssVarsProvider>
          <MessageProvider>
            <BrowserRouter basename={basename}>
              <RoutingComponent />
            </BrowserRouter>
          </MessageProvider>
        </JoyCssVarsProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
