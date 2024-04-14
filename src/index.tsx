/* @refresh reload */
import { render } from 'solid-js/web';
import { lazy } from 'solid-js';

import './index.css'
import { MetaProvider, Title } from "@solidjs/meta";
import { Router, Route } from '@solidjs/router';
import Search from './pages/Search';

const View = lazy(() => import('./pages/View'))
const root = document.getElementById('root');

const App = (props: any) => (
  <MetaProvider>
    <Title>BMS Score Viewer</Title>
    {props.children}
  </MetaProvider>
)

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => (
  <Router root={App}>
    <Route path="/" component={Search} />
    <Route path="/view" component={View} />
  </Router>
), root!);
