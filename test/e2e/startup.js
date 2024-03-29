import test from 'ava';
import { useSpectron, focusMain, focusChild } from '../helpers/spectron/index';

useSpectron({ showDll: true });

test('Main and child window visibility', async t => {
  const app = t.context.app;
  await focusMain(t);
  t.true(await app.browserWindow.isVisible());
  await focusChild(t);
  t.false(await app.browserWindow.isVisible());
});
