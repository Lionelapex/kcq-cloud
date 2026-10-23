importScripts('shared.js', 'ai.js');

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

let bankCache = { rows: null, at: 0 };
const getBank = async () => {
  if (!bankCache.rows || Date.now() - bankCache.at > 10 * 60 * 1000) {
    bankCache = { rows: await KCQ.loadAll().catch(() => []), at: Date.now() };
  }
  return bankCache.rows;
};

async function callModel(prompt) {
  const { aiEndpoint, aiKey, aiModel } = await chrome.storage.local.get(['aiEndpoint', 'aiKey', 'aiModel']);
  if (!aiEndpoint || !aiKey || !aiModel) throw new Error('Set the AI endpoint, key and model in the extension options.');
  const response = await fetch(aiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aiKey}` },
    body: JSON.stringify({ model: aiModel, temperature: 0, max_tokens: 12, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Model request failed (${response.status}).`);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

const answerer = KCQAI.createAnswerer({
  getGuides: async () => (await chrome.storage.local.get('guides')).guides || {},
  getBank,
  callModel,
  cacheGet: async () => (await chrome.storage.local.get('aiCache')).aiCache || {},
  cacheSet: (aiCache) => chrome.storage.local.set({ aiCache }),
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'answer') {
    answerer.answer(message).then(sendResponse);
    return true;
  }
  if (message?.type === 'load') {
    KCQ.loadAll()
      .then((rows) => sendResponse({ ok: true, rows }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type !== 'save') return false;
  KCQ.saveQuestions(message.moduleName, message.items)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});
