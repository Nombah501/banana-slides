const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createTranslator,
  normalizeLocale,
  resolveLocale,
} = require('./i18n');

test('normalizeLocale accepts supported locale prefixes', () => {
  assert.equal(normalizeLocale('ru-RU'), 'ru');
  assert.equal(normalizeLocale('zh_CN'), 'zh');
  assert.equal(normalizeLocale('en-US'), 'en');
  assert.equal(normalizeLocale('fr-FR'), null);
});

test('resolveLocale prefers frontend, then environment, then app locale', () => {
  assert.equal(resolveLocale({ frontendLocale: 'ru-RU', envLocale: 'zh-CN', appLocale: 'en-US' }), 'ru');
  assert.equal(resolveLocale({ envLocale: 'ru', appLocale: 'zh-CN' }), 'ru');
  assert.equal(resolveLocale({ appLocale: 'zh-CN' }), 'zh');
});

test('resolveLocale skips unsupported candidates and falls back to English', () => {
  assert.equal(resolveLocale({ frontendLocale: 'fr', envLocale: 'ru-RU', appLocale: 'zh-CN' }), 'ru');
  assert.equal(resolveLocale({ frontendLocale: 'fr', envLocale: 'de', appLocale: 'ja' }), 'en');
});

test('createTranslator interpolates localized shell messages', () => {
  const translate = createTranslator('ru');
  assert.equal(translate('tray.showMainWindow'), 'Показать главное окно');
  assert.equal(
    translate('update.available.message', { version: '1.2.3' }),
    'Доступна новая версия v1.2.3',
  );
});
