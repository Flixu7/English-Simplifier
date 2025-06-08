document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('level');
    const simplifyButton = document.getElementById('simplify');
    const showOriginalToggle = document.getElementById('showOriginal');

    // Dodaj obsługę błędów
    if (!select || !simplifyButton || !showOriginalToggle) {
        console.error('Nie znaleziono wymaganych elementów DOM');
        return;
    }

    // Load saved settings
    chrome.storage.local.get(['simplifyLevel', 'showOriginal'], (result) => {
        try {
            select.value = result.simplifyLevel || 'B1';
            showOriginalToggle.checked = result.showOriginal || false;
        } catch (error) {
            console.error('Błąd podczas ładowania ustawień:', error);
        }
    });

    // Save level when changed
    select.addEventListener('change', () => {
        try {
            chrome.storage.local.set({ simplifyLevel: select.value });
        } catch (error) {
            console.error('Błąd podczas zapisywania poziomu:', error);
        }
    });

    // Save toggle state when changed
    showOriginalToggle.addEventListener('change', () => {
        try {
            chrome.storage.local.set({ showOriginal: showOriginalToggle.checked });
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime.lastError) {
                    console.error('Błąd podczas wyszukiwania aktywnej karty:', chrome.runtime.lastError);
                    return;
                }
                if (tabs && tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'toggleOriginal',
                        show: showOriginalToggle.checked
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error('Błąd podczas wysyłania wiadomości:', chrome.runtime.lastError);
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Błąd podczas obsługi przełącznika:', error);
        }
    });

    // Handle simplify button click
    simplifyButton.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                console.error('Nie znaleziono aktywnej karty');
                return;
            }

            // Wstrzyknij content script
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['contentScript.js']
            });

            // Wyślij wiadomość do content script
            chrome.tabs.sendMessage(tab.id, { 
                action: 'simplify',
                level: select.value,
                showOriginal: showOriginalToggle.checked
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Błąd podczas upraszczania tekstu:', chrome.runtime.lastError);
                } else {
                    console.log('Upraszczanie zakończone pomyślnie');
                }
            });
        } catch (error) {
            console.error('Błąd podczas wykonywania operacji:', error);
        }
    });
});
  