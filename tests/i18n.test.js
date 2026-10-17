import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createI18n } from 'vue-i18n';

test('mood email placeholders compile and render an @ sign', () => {
  const probe = createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      en: { emailPlaceholder: "name{'@'}example.com" },
      sv: { emailPlaceholder: "namn{'@'}exempel.se" }
    }
  });

  for (const locale of ['sv', 'en']) {
    probe.global.locale.value = locale;
    const text = String(probe.global.t('emailPlaceholder'));
    assert.match(text, /@/);
    assert.doesNotMatch(text, /\{'@'\}/);
  }
});
