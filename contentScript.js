console.log('Content script loaded');

const style = document.createElement('style');
style.textContent = `
    .simplified-text {
        background: linear-gradient(90deg, rgba(0,243,255,0.1), rgba(157,0,255,0.1)) !important;
        padding: 2px 4px;
        border-radius: 4px;
        transition: all 0.3s ease;
    }
    .simplified-text:hover {
        background: linear-gradient(90deg, rgba(0,243,255,0.2), rgba(157,0,255,0.2)) !important;
    }
    .original-text {
        color: #666;
        font-style: italic;
    }
`;
document.head.appendChild(style);

(async function () {
    // CEFR level word mappings
    const cefrLevels = {
      A1: {
        "utilize": "use",
        "commence": "start",
        "purchase": "buy",
        "terminate": "end",
        "demonstrate": "show",
        "assistance": "help",
        "approximately": "about",
        "sufficient": "enough",
        "inquire": "ask",
        "obtain": "get",
        "require": "need",
        "endure": "last",
        "allow": "let",
        "helpful": "useful",
        "choose": "pick",
        "explain": "say why",
        "answer": "reply",
        "need": "want",
        "try": "test"
      },
      A2: {
        "accomplish": "do",
        "sufficient": "enough",
        "inquire": "ask",
        "obtain": "get",
        "purchase": "buy",
        "demonstrate": "show",
        "assistance": "help",
        "approximately": "about",
        "terminate": "end",
        "utilize": "use",
        "difficult": "hard",
        "decide": "choose",
        "continue": "keep going",
        "examine": "look at",
        "mention": "talk about",
        "improve": "get better",
        "need": "want",
        "try": "test"
      },
      B1: {
        "accomplish": "do",
        "sufficient": "enough",
        "inquire": "ask",
        "obtain": "get",
        "purchase": "buy",
        "demonstrate": "show",
        "assistance": "help",
        "approximately": "about",
        "terminate": "end",
        "utilize": "use",
        "endeavor": "try",
        "commence": "start",
        "proceed": "go on",
        "require": "need",
        "consider": "think about",
        "maintain": "keep",
        "increase": "make bigger",
        "reduce": "make smaller",
        "express": "say",
        "rely on": "depend on",
        "create": "make",
        "prevent": "stop",
        "provide": "give"
      },
      B2: {
        "accomplish": "do",
        "sufficient": "enough",
        "inquire": "ask",
        "obtain": "get",
        "purchase": "buy",
        "demonstrate": "show",
        "assistance": "help",
        "approximately": "about",
        "terminate": "end",
        "utilize": "use",
        "endeavor": "try",
        "commence": "start",
        "proceed": "go on",
        "require": "need",
        "implement": "put in place",
        "facilitate": "make easier",
        "optimize": "make better",
        "leverage": "use",
        "conclude": "finish",
        "assess": "check",
        "emphasize": "stress",
        "demonstrate": "show",
        "interpret": "explain",
        "justify": "show reason for",
        "significant": "important",
        "contribute": "help",
        "resolve": "solve",
        "sustain": "keep going",
        "acknowledge": "accept",
        "compensate": "pay back",
        "allocate": "give out"
      }
    };
    

    const getTextNodes = (root) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) =>
                node.parentNode.nodeName !== 'SCRIPT' &&
                node.parentNode.nodeName !== 'STYLE' &&
                node.nodeValue.trim()
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT
        });
        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) textNodes.push(node);
        return textNodes;
    };

    const simplifyText = (text, targetLevel) => {
        let simplified = text;
        const words = cefrLevels[targetLevel] || {};
        
        // Replace complex words with simpler alternatives
        for (const [complex, simple] of Object.entries(words)) {
            const regex = new RegExp(`\\b${complex}\\b`, 'gi');
            simplified = simplified.replace(regex, simple);
        }

        // Add additional simplification rules based on CEFR level
        if (targetLevel === 'A1' || targetLevel === 'A2') {
            // Simplify sentence structure for beginners
            simplified = simplified
                .replace(/,/g, ' and ')
                .replace(/;/g, '. ')
                .replace(/however/g, 'but')
                .replace(/therefore/g, 'so')
                .replace(/although/g, 'but');
        }

        return simplified;
    };

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
            console.log('Otrzymano wiadomość:', request);
            
            if (request.action === 'simplify') {
                const textNodes = getTextNodes(document.body);
                let simplifiedCount = 0;
                
                for (const node of textNodes) {
                    try {
                        const original = node.nodeValue;
                        const simplified = simplifyText(original, request.level);
                        
                        if (original !== simplified) {
                            const span = document.createElement('span');
                            span.innerHTML = `
                                <span class="original-text" style="display:${request.showOriginal ? 'inline' : 'none'}">${original}</span>
                                <span class="simplified-text" style="background:#e6f7ff">${simplified}</span>
                            `;
                            node.parentNode.replaceChild(span, node);
                            simplifiedCount++;
                        }
                    } catch (error) {
                        console.error('Błąd podczas przetwarzania węzła:', error);
                    }
                }
                
                console.log(`Uproszczono ${simplifiedCount} fragmentów tekstu`);
                sendResponse({ success: true, count: simplifiedCount });
            } else if (request.action === 'toggleOriginal') {
                const originalTexts = document.querySelectorAll('.original-text');
                originalTexts.forEach(text => {
                    text.style.display = request.show ? 'inline' : 'none';
                });
                sendResponse({ success: true });
            }
        } catch (error) {
            console.error('Błąd podczas obsługi wiadomości:', error);
            sendResponse({ success: false, error: error.message });
        }
        return true;
    });
})();
  