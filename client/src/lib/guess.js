// Best guess for unconfirmed questions: never stored, only shown. Mirrors suggest() in extension/shared.js.
const norm = (text = '') => String(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function suggestAnswer(item) {
  if (item.answer || !item.options?.length) return null;
  const wrongKeys = new Set((item.wrong || []).map(norm));
  const remaining = item.options.filter((option) => !wrongKeys.has(norm(option)));
  if (!remaining.length) return null;

  const isCombo = item.options.every((option) => /^[a-z](\s*,\s*[a-z])*$/i.test(option.trim()));
  const letters = (option) => new Set(option.toLowerCase().match(/\b[a-z]\b/g) || []);
  const questionTokens = new Set(norm(item.question).split(' '));

  const scoreOf = (option) => {
    if (isCombo) {
      const mine = letters(option);
      return item.options.filter((other) => other !== option)
        .reduce((sum, other) => sum + [...letters(other)].filter((l) => mine.has(l)).length, 0);
    }
    const tokens = norm(option).split(' ').filter(Boolean);
    return tokens.length ? tokens.filter((t) => questionTokens.has(t)).length / tokens.length : 0;
  };

  const best = remaining.map((option) => ({ option, score: scoreOf(option) })).sort((a, b) => b.score - a.score)[0];
  return { option: best.option, remaining: remaining.length };
}
