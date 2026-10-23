/**
 * Royal AI Matchmaker Chatbot Logic - Kunwar AI Advisor
 * 
 * Provides interactive matchmaking, gotra checks, automated FAQs,
 * and human agent handoff to WhatsApp.
 */

(function () {
  // Wait for DOM to load
  document.addEventListener('DOMContentLoaded', () => {
    initChatbotWidget();
  });

  function initChatbotWidget() {
    // 1. Create the Chatbot Trigger and Window dynamically if they do not exist
    if (document.getElementById('royalChatbotTrigger')) return;

    const chatContainer = document.createElement('div');
    chatContainer.id = 'royalChatbotContainer';
    chatContainer.innerHTML = `
      <!-- Chatbot Trigger Button -->
      <button id="royalChatbotTrigger" class="royal-chatbot-trigger" aria-label="Open Matchmaker Chat">
        <span class="pulse-ring"></span>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.13 2 11.22c0 2.87 1.42 5.43 3.65 7.15l-.65 2.63c-.1.4.26.77.66.66l3.14-1.22c1 .26 2.06.4 3.2.4 5.523 0 10-4.13 10-9.22S17.523 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
        </svg>
        <span class="trigger-tooltip">Matchmaker Chat</span>
      </button>

      <!-- Chatbot Window Panel -->
      <div id="royalChatbotWindow" class="royal-chatbot-window">
        <div class="chat-header">
          <div class="header-avatar">👑</div>
          <div class="header-info">
            <h3>Kunwar Matchmaker Desk</h3>
            <span class="header-status">Royal Matchmaker Desk (Online)</span>
          </div>
          <button id="closeChatbot" class="btn-close-chat" aria-label="Close Chat">×</button>
        </div>
        
        <div id="chatMessages" class="chat-messages">
          <div class="message bot-message">
            <div class="message-bubble">
              Khammaghani! I am <strong>Kunwar</strong> from Shree Rajput Sagai Sambandh Matchmaker Desk.
              <br><br>
              How can I assist your lineage discovery or partner search today?
            </div>
          </div>
          <div class="quick-replies">
            <button class="quick-reply-btn" data-query="show my type of match">👑 Show My Type of Match</button>
            <button class="quick-reply-btn" data-query="Rathore clan brides aged 23 to 27">🏰 Rathore Brides (23-27)</button>
            <button class="quick-reply-btn" data-query="Doctors and Engineers in Rajasthan">👨‍⚕️ Doctors & Engineers</button>
            <button class="quick-reply-btn" data-query="what are gotra rules">📜 Gotra Rules</button>
            <button class="quick-reply-btn" data-query="talk to human agent">📞 Connect to Agent</button>
          </div>
        </div>

        <div class="chat-input-area">
          <input type="text" id="chatInput" placeholder="Write your query..." aria-label="Message Input">
          <button id="sendChatBtn" class="btn-send-chat" aria-label="Send Message">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(chatContainer);

    // 2. Event Listeners for UI interaction
    const trigger = document.getElementById('royalChatbotTrigger');
    const windowPanel = document.getElementById('royalChatbotWindow');
    const closeBtn = document.getElementById('closeChatbot');
    const sendBtn = document.getElementById('sendChatBtn');
    const chatInput = document.getElementById('chatInput');
    const messagesContainer = document.getElementById('chatMessages');

    trigger.addEventListener('click', () => {
      windowPanel.classList.toggle('active');
      if (windowPanel.classList.contains('active')) {
        chatInput.focus();
        // Close one-on-one chat if active
        if (typeof closeOneOnOneChat === 'function') {
          closeOneOnOneChat();
        }
        // Remove pulse trigger ring once opened
        const pulse = trigger.querySelector('.pulse-ring');
        if (pulse) pulse.remove();
      }
    });

    closeBtn.addEventListener('click', () => {
      windowPanel.classList.remove('active');
    });

    // Handle Quick Reply Clicks
    messagesContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('quick-reply-btn')) {
        const query = e.target.getAttribute('data-query');
        submitUserQuery(query);
      }
    });

    sendBtn.addEventListener('click', () => {
      const query = chatInput.value.trim();
      if (query) {
        submitUserQuery(query);
        chatInput.value = '';
      }
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = chatInput.value.trim();
        if (query) {
          submitUserQuery(query);
          chatInput.value = '';
        }
      }
    });
  }

  // 3. User Message Submission Handler
  function submitUserQuery(query) {
    appendMessage(query, 'user-message');
    showTypingIndicator();

    setTimeout(() => {
      removeTypingIndicator();
      const response = processAIQuery(query);
      appendMessage(response, 'bot-message');
    }, 900);
  }

  function appendMessage(content, className) {
    const messagesContainer = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${className}`;
    
    // Check if content is HTML template or plain text
    if (content.startsWith('<')) {
      msgDiv.innerHTML = content;
    } else {
      msgDiv.innerHTML = `<div class="message-bubble">${content}</div>`;
    }
    
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'chatTypingIndicator';
    typingDiv.className = 'message bot-message';
    typingDiv.innerHTML = `
      <div class="message-bubble typing-dots">
        <span></span><span></span><span></span>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('chatTypingIndicator');
    if (indicator) indicator.remove();
  }

  // 4. Conversational Rules and Knowledge Engine
  function processAIQuery(query) {
    const cleanQuery = query.toLowerCase();

    // Gotra Rules Query
    if (cleanQuery.includes('gotra') || cleanQuery.includes('rule') || cleanQuery.includes('sagotra')) {
      return `📜 <strong>Rajput Gotra Marriage Rules:</strong><br>
              In traditional Rajput alliances, marriage within the same Gotra is strictly forbidden (Sagotra union) to respect genetics and ancestral lineage.
              <br><br>
              Typically, a noble union checks <strong>four Gotras</strong> to ensure zero conflicts:
              <ol>
                <li>Father's Gotra (Self Gotra)</li>
                <li>Mother's Gotra</li>
                <li>Father's Mother's Gotra</li>
                <li>Mother's Mother's Gotra</li>
              </ol>
              Our Matchmaker Desk automatically verifies these parameters for you!`;
    }

    // Agent Handoff / WhatsApp Handoff
    if (cleanQuery.includes('agent') || cleanQuery.includes('support') || cleanQuery.includes('human') || cleanQuery.includes('connect') || cleanQuery.includes('call') || cleanQuery.includes('whatsapp') || cleanQuery.includes('contact')) {
      // Trigger redirect after a short timeout
      setTimeout(() => {
        window.open('https://wa.me/919928592159', '_blank');
      }, 1500);

      return `📞 <strong>Connecting you to our Royal Relations Desk...</strong><br>
              Opening our official WhatsApp support channel (<strong>+91 99285 92159</strong>) in a new window. Please share your lineage details or query directly with our customer agent.`;
    }

    // Pricing / Membership Packages
    if (cleanQuery.includes('price') || cleanQuery.includes('plan') || cleanQuery.includes('cost') || cleanQuery.includes('membership') || cleanQuery.includes('starter') || cleanQuery.includes('silver') || cleanQuery.includes('gold') || cleanQuery.includes('package')) {
      return `💎 <strong>Royal Matrimonial Plans:</strong><br>
              Choose from our curated membership levels designed for the Rajput community:
              <ul>
                <li><strong>Starter Plan (₹4,999/mo):</strong> Basic listing search and up to 10 lineage unlocks.</li>
                <li><strong>Rajputana Silver (₹11,999/mo):</strong> Gotra compatibility analysis, verified badge tag, and palace ecosystem unlocks.</li>
                <li><strong>Rajputana Gold (₹24,999/mo):</strong> Premium matchmaking, Kundali matchmaking consultations, priority matching algorithms.</li>
              </ul>
              Type <strong>"connect to agent"</strong> to subscribe or upgrade your tier.`;
    }

    // Dynasties / Clans Information
    if (cleanQuery.includes('clan') || cleanQuery.includes('rathore') || cleanQuery.includes('sisodia') || cleanQuery.includes('chauhan') || cleanQuery.includes('bhati') || cleanQuery.includes('kachwaha') || cleanQuery.includes('dynasty')) {
      return `🏰 <strong>Rajput Royal Lineages:</strong><br>
              Our directory verifies ancestral lineages across major ruling dynasties:
              <ul>
                <li><strong>Suryavanshi:</strong> Sisodias of Mewar, Kachwahas of Amber/Jaipur.</li>
                <li><strong>Chandravanshi:</strong> Bhatis of Jaisalmer, Tanwars of Gwalior.</li>
                <li><strong>Agrivanshi:</strong> Chauhans of Ajmer/Delhi, Rathores of Marwar/Jodhpur.</li>
              </ul>
              Let me know if you want to find matches within a specific clan!`;
    }

    // AI Matchmaking & Lineage Search Query
    const matchTriggers = [
      'match', 'find', 'perfect', 'recommend', 'suggest', 'compatibility',
      'type of match', 'his type', 'my type', 'her type', 'preference',
      'mere type', 'dikhao', 'search', 'bride', 'groom', 'ladi', 'banna',
      'ladki', 'ladka', 'girl', 'boy', 'rathore', 'sisodia', 'chauhan',
      'bhati', 'shekhawat', 'kachwaha', 'tanwar', 'panwar', 'doctor', 'engineer'
    ];
    const isMatchQuery = matchTriggers.some(t => cleanQuery.includes(t));

    if (isMatchQuery) {
      if (window.KunwarAIMatchmaker) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const searchOutcome = window.KunwarAIMatchmaker.searchDatabase(query, currentUser);
        return window.KunwarAIMatchmaker.generateChatbotResponse(query, searchOutcome, currentUser);
      }
      return `⚠️ Kunwar AI engine is initializing. Please try again in a moment.`;
    }

    // Default Fallback Response
    return `Khammaghani! I am here to assist your Rajput partner search.
            <br><br>
            You can ask me anything, such as:
            <ul>
              <li><strong>"Show my type of match"</strong> to search database according to your saved preferences.</li>
              <li><strong>"Find Rathore brides aged 23 to 27 in Jaipur"</strong>.</li>
              <li><strong>"Show doctor or engineer grooms"</strong>.</li>
              <li><strong>"What are gotra rules"</strong> to see Sagotra guidelines.</li>
              <li><strong>"Connect to agent"</strong> to chat on WhatsApp.</li>
            </ul>`;
  }

  // 6. Global scope mapping function for detail triggers
  window.openChatMatchDetails = function (profileId) {
    // Close the chatbot window Panel
    const windowPanel = document.getElementById('royalChatbotWindow');
    if (windowPanel) windowPanel.classList.remove('active');

    // Trigger details modal inside dashboard
    if (typeof openProfileDetailModal === 'function') {
      openProfileDetailModal(profileId);
    } else {
      // Redirect to dashboard page with parameter
      sessionStorage.setItem('openProfileId', profileId);
      window.location.href = 'dashboard.html';
    }
  };
})();
