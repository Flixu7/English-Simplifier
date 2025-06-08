chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.simplifyLevel) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['contentScript.js']
          });
        }
      });
    }
  });
  