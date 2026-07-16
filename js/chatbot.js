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
      <button id="royalChatbotTrigger" class="royal-chatbot-trigger" aria-label="Open Royal AI Advisor">
        <span class="pulse-ring"></span>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.13 2 11.22c0 2.87 1.42 5.43 3.65 7.15l-.65 2.63c-.1.4.26.77.66.66l3.14-1.22c1 .26 2.06.4 3.2.4 5.523 0 10-4.13 10-9.22S17.523 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
        </svg>
        <span class="trigger-tooltip">Royal AI Matchmaker</span>
      </button>

      <!-- Chatbot Window Panel -->
      <div id="royalChatbotWindow" class="royal-chatbot-window">
        <div class="chat-header">
          <div class="header-avatar">👑</div>
          <div class="header-info">
            <h3>Kunwar AI Advisor</h3>
            <span class="header-status">Royal Matchmaker (Online)</span>
          </div>
          <button id="closeChatbot" class="btn-close-chat" aria-label="Close Chat">×</button>
        </div>
        
        <div id="chatMessages" class="chat-messages">
          <div class="message bot-message">
            <div class="message-bubble">
              Khammaghani! I am <strong>Kunwar AI Advisor</strong>, your personal matchmaker for Shree Rajput Sagai Sambandh. 
              <br><br>
              How can I assist your lineage discovery today?
            </div>
          </div>
          <div class="quick-replies">
            <button class="quick-reply-btn" data-query="find perfect match">🔍 Find Perfect Match</button>
            <button class="quick-reply-btn" data-query="what are gotra rules">📜 Gotra Rules</button>
            <button class="quick-reply-btn" data-query="talk to human agent">📞 Connect to Agent</button>
            <button class="quick-reply-btn" data-query="view pricing plans">💎 View Royal Plans</button>
          </div>
        </div>

        <div class="chat-input-area">
          <input type="text" id="chatInput" placeholder="Write to Kunwar AI..." aria-label="Message Input">
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
              Our AI Matchmaker automatically verifies these parameters for you!`;
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

    // AI Matchmaking Perfect Match Query
    if (cleanQuery.includes('match') || cleanQuery.includes('perfect') || cleanQuery.includes('find') || cleanQuery.includes('recommend') || cleanQuery.includes('compatibility')) {
      return performAIMatchmaking();
    }

    // Default Fallback Response
    return `Khammaghani! I understand you are asking about: "<em>${query}</em>". 
            <br><br>
            Try typing:
            <ul>
              <li><strong>"Find perfect match"</strong> to run AI matchmaking.</li>
              <li><strong>"Gotra rules"</strong> to see compatibility guidelines.</li>
              <li><strong>"View plans"</strong> to check pricing packages.</li>
              <li><strong>"Connect to agent"</strong> to talk to our WhatsApp customer support.</li>
            </ul>`;
  }

  // 5. Dynamic AI Matchmaking Scoring Core
  function performAIMatchmaking() {
    const currentUserRaw = localStorage.getItem('currentUser');
    if (!currentUserRaw) {
      return `🔐 <strong>Access Restricted:</strong><br>
              Khammaghani! Please log in or register your noble profile to run our AI Matchmaker and reveal compatible Rajput brides/grooms.
              <br><br>
              <a href="login.html" class="btn btn-primary" style="display: block; text-align: center; margin-top: 10px; text-decoration: none; padding: 8px;">Log In Now</a>
              <a href="register.html" class="btn btn-minimal" style="display: block; text-align: center; margin-top: 5px; text-decoration: none; padding: 8px;">Register Lineage</a>`;
    }

    const currentUser = JSON.parse(currentUserRaw);
    
    // Safety fallback properties if profile lacks full setup
    const userGender = currentUser.gender || 'Groom';
    const userCaste = currentUser.clan || currentUser.caste || 'Rathore';
    const userGotra = (currentUser.gotra || 'Not Specified').split(' ')[0].trim();
    const userMotherGotra = (currentUser.motherGotra || 'Not Specified').split(' ')[0].trim();
    const userPrefMinAge = parseInt(currentUser.prefMinAge) || 20;
    const userPrefMaxAge = parseInt(currentUser.prefMaxAge) || 30;
    const userPrefCaste = currentUser.prefCaste || 'Any';
    const userPrefLocation = currentUser.prefLocation || 'Any';

    // Retrieve database profiles
    if (typeof getAllProfiles !== 'function') {
      return `⚠️ Lineage database is currently updating. Please try again in a moment.`;
    }

    const allProfiles = getAllProfiles();
    
    // Filter profiles:
    // 1. Opposite gender (Groom looks for Bride, Bride looks for Groom)
    const oppositeGender = userGender.toLowerCase() === 'groom' ? 'bride' : 'groom';
    let candidates = allProfiles.filter(p => (p.gender || '').toLowerCase() === oppositeGender);

    if (candidates.length === 0) {
      return `I could not find matching profiles in our lineage catalog. Try adjusting your preferences.`;
    }

    // 2. Gotra Conflict Filter (Strict Rajput Rule: No Sagotra unions!)
    // Candidate cannot share the user's father's gotra OR mother's gotra
    candidates = candidates.filter(candidate => {
      const candidateGotra = (candidate.gotra || '').split(' ')[0].trim().toLowerCase();
      const fatherGotraLower = userGotra.toLowerCase();
      const motherGotraLower = userMotherGotra.toLowerCase();
      
      // Reject match if their primary gotra matches the user's paternal or maternal gotras
      if (candidateGotra === fatherGotraLower || candidateGotra === motherGotraLower) {
        return false;
      }
      return true;
    });

    if (candidates.length === 0) {
      return `📜 <strong>Sagotra Union Alert:</strong> All profiles in our catalog share your paternal or maternal Gotra. No matches were recommended to respect traditional Rajput endogamy guidelines.`;
    }

    // 3. AI Scoring Weights Loop
    const scoredCandidates = candidates.map(candidate => {
      let score = 50; // baseline score

      // Age alignment (+15 points)
      const candidateAge = parseInt(candidate.age) || 25;
      if (candidateAge >= userPrefMinAge && candidateAge <= userPrefMaxAge) {
        score += 15;
      }

      // Location alignment (+15 points)
      const candidateLocation = (candidate.location || '').toLowerCase();
      if (userPrefLocation.toLowerCase() !== 'any' && candidateLocation.includes(userPrefLocation.toLowerCase())) {
        score += 15;
      }

      // Clan alliance alignment (+15 points)
      const candidateClan = (candidate.clan || '').toLowerCase();
      if (userPrefCaste.toLowerCase() !== 'any' && candidateClan.includes(userPrefCaste.toLowerCase())) {
        score += 15;
      } else {
        // Natural Rajput historical clan matches (e.g. Sisodia marrying Rathore/Bhati)
        if (userCaste.toLowerCase() === 'sisodia' && ['rathore', 'bhati'].includes(candidateClan)) {
          score += 10;
        } else if (userCaste.toLowerCase() === 'rathore' && ['sisodia', 'chauhan'].includes(candidateClan)) {
          score += 10;
        }
      }

      // Verification verification (+5 points)
      if (candidate.isVerified) {
        score += 5;
      }

      return {
        profile: candidate,
        matchScore: Math.min(score, 99) // Cap at 99%
      };
    });

    // Sort by highest score first
    scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);
    const topMatch = scoredCandidates[0];

    if (!topMatch) {
      return `Our Matchmaker did not find a perfect match in our archive at this time.`;
    }

    const match = topMatch.profile;
    const matchScore = topMatch.matchScore;
    
    // Split initials for avatar display
    const initials = match.initials || 'NM';

    return `
      <div class="message-bubble ai-match-bubble" style="padding: 12px; border: 1.5px solid var(--gold-antique); background: var(--bg-card); border-radius: 12px; box-shadow: 0 4px 15px rgba(170, 124, 17, 0.15);">
        <div style="font-size: 0.85rem; font-weight: bold; color: var(--gold-antique); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
          ✨ AI Perfect Match: ${matchScore}% Compatible
        </div>
        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
          <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, var(--maroon-royal), var(--maroon-light)); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.1rem; border: 1px solid var(--gold-antique);">
            ${initials}
          </div>
          <div>
            <h4 style="margin: 0; color: var(--maroon-royal); font-family: var(--font-header);">${match.name}</h4>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${match.age} Yrs • ${match.clan} Clan</span>
          </div>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-dark); margin-bottom: 10px; line-height: 1.4; border-top: 1px solid rgba(170, 124, 17, 0.15); padding-top: 8px;">
          <strong>Lineage:</strong> ${match.gotra}<br>
          <strong>Native:</strong> ${match.native}<br>
          <strong>Education:</strong> ${match.education}
        </div>
        <button onclick="openChatMatchDetails('${match.id}')" class="btn btn-royal" style="width: 100%; padding: 8px; font-size: 0.85rem; cursor: pointer;">
          View Full Lineage
        </button>
      </div>
    `;
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
