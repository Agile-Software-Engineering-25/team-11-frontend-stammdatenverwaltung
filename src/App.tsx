import { BrowserRouter } from 'react-router';
import RoutingComponent from '@components/RoutingComponent/RoutingComponent';
import {
  createCustomJoyTheme,
  createCustomMuiTheme,
} from '@agile-software/shared-components';
import { THEME_ID as MATERIAL_THEME_ID, ThemeProvider } from '@mui/material';
import {
  CssBaseline,
  GlobalStyles,
  CssVarsProvider as JoyCssVarsProvider,
} from '@mui/joy';
import './i18n';
import { Provider } from 'react-redux';
import store from '@stores/index.ts';
import { MessageProvider } from '@/components/MessageProvider/MessageProvider';

const joyTheme = createCustomJoyTheme();
const muiTheme = createCustomMuiTheme();

type AppProps = {
  basename?: string;
};

/**
 * @param props - AppProps, contains customProps delivered from the rootUi (user is handled separately via useUser hook)
 */
function App(props: AppProps) {
  const { basename } = props;
  return (
    <Provider store={store}>
      <ThemeProvider theme={{ [MATERIAL_THEME_ID]: muiTheme }}>
        <JoyCssVarsProvider
          theme={joyTheme}
          defaultMode="light"
          modeStorageKey="joy-mode"
          colorSchemeStorageKey="joy-color-scheme"
        >
          <CssBaseline />
          <GlobalStyles
            styles={(theme) => ({
              html: {
                backgroundColor: theme.vars.palette.background.body,
                minHeight: '100%',
              },
              body: {
                backgroundColor: theme.vars.palette.background.body,
                minHeight: '100vh',
                margin: 0,
                padding: 0,
              },
            })}
          />
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
