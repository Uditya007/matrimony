// Sagai Sambaandh - Central State Controller & Application Logic

// Web Onboarding Splash Screen Controller (safeguarded against script load race condition)
function handleWebSplash() {
  const webSplash = document.getElementById('webSplash');
  if (webSplash) {
    setTimeout(() => {
      webSplash.classList.add('fade-out');
    }, 1000); // 1.0 second snappier delay
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', handleWebSplash);
} else {
  handleWebSplash();
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize dynamic user database in LocalStorage if not present
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([]));
  }
  
  // Initialize interests list in LocalStorage if not present
  if (!localStorage.getItem('interests')) {
    localStorage.setItem('interests', JSON.stringify({}));
  }

  // Initialize shortlist list in LocalStorage if not present
  if (!localStorage.getItem('shortlisted')) {
    localStorage.setItem('shortlisted', JSON.stringify([]));
  }

  // Handle Stateful Header across pages
  updateNavigationState();

  // Sync Supabase Auth Session globally on page load
  if (window.supabaseActive) {
    window.supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const cachedUser = localStorage.getItem('currentUser');
        if (!cachedUser || JSON.parse(cachedUser).email !== session.user.email) {
          // Fetch profile record from database
          const { data: profile } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            localStorage.setItem('currentUser', JSON.stringify(profile));
            updateNavigationState();
            
            // Auto redirect landing/auth pages if logged in
            const path = window.location.pathname;
            const pageRaw = path.split('/').pop() || 'index.html';
            const page = pageRaw.split('?')[0].split('#')[0];
            if (page === 'index.html' || page === '' || page === 'index' || page === 'login.html' || page === 'login' || page === 'register.html' || page === 'register') {
              window.location.href = 'dashboard.html';
            }
          } else {
            // New Google/OAuth sign up! Create a default profile row in profiles table.
            const userMetadata = session.user.user_metadata || {};
            const fullName = userMetadata.full_name || userMetadata.name || 'Noble Member';
            const defaultProfile = {
              id: session.user.id,
              name: fullName,
              email: session.user.email,
              gender: 'Groom', // default placeholder
              age: 25,
              dob: '1998-06-15',
              religion: 'Hindu',
              caste: 'Rajput',
              clan: 'Rathore',
              gotra: 'Not Specified',
              motherGotra: 'Not Specified',
              thikana: 'Not Specified',
              height: "5'8\"",
              location: 'Rajasthan, India',
              familyType: 'Traditional',
              about: 'Proud descendant of a noble Rajput lineage.',
              expectations: 'Seeking gotra-compatible Rajput matches.',
              tier: 'Starter',
              phone: ''
            };

            const { data: newProfile, error: insertError } = await window.supabaseClient
              .from('profiles')
              .insert([defaultProfile])
              .select()
              .maybeSingle();

            if (!insertError && newProfile) {
              localStorage.setItem('currentUser', JSON.stringify(newProfile));
              notifyAdminNewRegistration(newProfile); // Notify admin on WhatsApp
              updateNavigationState();
              showToast('Khammaghani! Setting up your noble profile...', 'gold');
              setTimeout(() => {
                window.location.href = 'profile.html'; // Send to edit profile to complete setup!
              }, 1500);
            } else if (insertError) {
              console.error("Failed to create default OAuth profile:", insertError);
            }
          }
        } else {
          // If cachedUser already exists, still auto-redirect from login/register pages
          const path = window.location.pathname;
          const pageRaw = path.split('/').pop() || 'index.html';
          const page = pageRaw.split('?')[0].split('#')[0];
          if (page === 'login.html' || page === 'login' || page === 'register.html' || page === 'register') {
            window.location.href = 'dashboard.html';
          }
        }
      }
    });
  }

  // Initialize mobile responsive menu drawer
  initMobileMenu();

  // Initialize native scroll reveal observers for elegant page scroll entries
  initScrollReveal();

  // Trigger active user last seen heartbeat updates
  updateMyLastSeen();
  setInterval(updateMyLastSeen, 60000);

  // Initialize global real-time interest watcher & notification poller (runs on all pages)
  initGlobalInterestWatcher();

  // Configure drag-and-drop listeners for edit profile Biodata PDF Upload
  const editDropZone = document.getElementById('editBiodataUploadContainer');
  if (editDropZone) {
    editDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      editDropZone.style.borderColor = 'var(--gold-bright)';
      editDropZone.style.backgroundColor = 'rgba(255,255,255,0.06)';
    });
    editDropZone.addEventListener('dragleave', () => {
      editDropZone.style.borderColor = 'rgba(201, 162, 39, 0.4)';
      editDropZone.style.backgroundColor = 'rgba(255,255,255,0.02)';
    });
    editDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const fileInput = document.getElementById('editBiodataPdf');
        if (fileInput) {
          fileInput.files = files;
          if (typeof handleEditBiodataPdfChange === 'function') {
            handleEditBiodataPdfChange({ target: fileInput });
          }
        }
      }
    });
  }

  // Route-Specific Initializations
  const path = window.location.pathname;
  const pageRaw = path.split('/').pop() || 'index.html';
  const page = pageRaw.split('?')[0].split('#')[0];

  if (page === 'index.html' || page === '' || page === 'index') {
    initHomepage();
  } else if (page === 'login.html' || page === 'login') {
    initLoginPage();
  } else if (page === 'register.html' || page === 'register') {
    initRegisterPage();
  } else if (page === 'dashboard.html' || page === 'dashboard') {
    initDashboardPage();
  }

  // Show page entry notification alert banner after initial render
  setTimeout(() => {
    if (typeof showPageEntryNotificationAlert === 'function') {
      showPageEntryNotificationAlert();
    }
  }, 900);

  // Hook tab/subnav transitions across dashboard/profile pages to trigger notification alerts
  document.querySelectorAll('.subnav-tab, .filter-tab-btn, .dashboard-tab-btn, #shortlistToggleBtn').forEach(tab => {
    tab.addEventListener('click', () => {
      setTimeout(() => {
        if (typeof showPageEntryNotificationAlert === 'function') {
          showPageEntryNotificationAlert(true);
        }
      }, 400);
    });
  });

  // Also re-check and display alert when user returns to this browser tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (typeof showPageEntryNotificationAlert === 'function') {
        showPageEntryNotificationAlert();
      }
      if (typeof renderNotifications === 'function') {
        renderNotifications();
      }
    }
  });
});

// ==========================================
// 1. HELPER FUNCTIONS
// ==========================================

// Gender normalization & matching helpers
function normalizeGender(genderStr) {
  if (!genderStr) return 'Groom';
  const g = genderStr.trim().toLowerCase();
  if (g.startsWith('f') || g === 'bride' || g === 'ladi') {
    return 'Bride';
  }
  return 'Groom';
}

function getOppositeGender(genderStr) {
  const normalized = normalizeGender(genderStr);
  return normalized === 'Groom' ? 'Bride' : 'Groom';
}

function updateNavigationState() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const authContainer = document.getElementById('navAuthButtons');
  
  if (!authContainer) return;

  let html = '';
  if (currentUser) {
    const tier = currentUser.tier || 'Starter';
    html = `
      <!-- Dynamic Royal Notification Bell (Enlarged & Animated) -->
      <div class="notification-bell-container" id="navNotificationBell" title="Royal Notifications & Requests">
        <svg class="notification-bell-icon" id="navNotificationBellSvg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span class="notification-badge" id="navNotificationBadge" style="display: none;">0</span>
        
        <!-- Bigger Royal Notification Dropdown (380px wide) -->
        <div class="notification-dropdown" id="navNotificationDropdown">
          <div class="notification-dropdown-header">
            <div class="notif-header-title">
              <span>👑 Royal Notifications</span>
              <span class="notif-header-count-pill" id="notifHeaderCountPill">0 Requests</span>
            </div>
            <button type="button" onclick="markAllNotificationsAsRead(event)" class="btn btn-minimal" style="font-size: 0.72rem; padding: 2px 8px; color: var(--gold-bright); border: 1px solid rgba(201, 162, 39, 0.3); border-radius: 4px;" title="Mark non-request notifications as read">Mark all read</button>
          </div>
          <div class="notification-dropdown-list" id="notificationList">
            <div style="padding: 25px 15px; text-align: center; color: var(--text-muted); font-size: 0.82rem;">No notifications yet.</div>
          </div>
        </div>
      </div>

      <span style="font-size: 0.9rem; font-weight: 500; font-family: var(--font-royal); color: var(--primary-color); display: flex; align-items: center; gap: 8px; margin-right: 15px;">
        Khammaghani, <strong style="color: var(--gold-antique);">${currentUser.name.split(' ')[0]}</strong>
        <span style="font-size: 0.7rem; font-family: var(--font-body); padding: 2px 10px; background-color: var(--gold-light); border: 1px solid var(--gold-antique); border-radius: 12px; color: var(--primary-color); font-weight: bold;">
          ${tier} Plan
        </span>
      </span>
      <a href="dashboard.html" class="btn btn-minimal" style="margin-right: 8px;">Dashboard</a>
      <button onclick="handleLogout()" class="btn btn-primary">Logout</button>
    `;
  } else {
    html = `
      <a href="login.html" class="btn btn-minimal" style="margin-right: 12px; font-weight: 600;">Log In</a>
      <a href="register.html" class="btn btn-royal" id="navSignUpBtn">Sign Up</a>
    `;
  }

  authContainer.innerHTML = html;

  // Initialize event listeners for the notifications dropdown
  if (currentUser) {
    const bell = document.getElementById('navNotificationBell');
    const dropdown = document.getElementById('navNotificationDropdown');
    if (bell && dropdown) {
      bell.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpening = dropdown.style.display !== 'flex' && dropdown.style.display !== 'block';
        dropdown.style.display = isOpening ? 'flex' : 'none';
        
        if (isOpening) {
          // Mark informational alerts as read while keeping pending requests active
          let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
          notifications = notifications.map(n => {
            if (n.type !== 'interest_request') {
              return { ...n, read: true };
            }
            return n;
          });
          localStorage.setItem('notifications', JSON.stringify(notifications));
          renderNotifications();
        }
      });

      dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      document.addEventListener('click', () => {
        dropdown.style.display = 'none';
      });
      
      // Clean up any stale/mock notifications and render real notifications
      if (typeof cleanupMockNotifications === 'function') {
        cleanupMockNotifications(currentUser);
      }
      setTimeout(() => {
        if (typeof renderNotifications === 'function') {
          renderNotifications();
        }
      }, 50);
    }
  }

  // Also sync state with mobile drawer container if present
  const mobileAuth = document.getElementById('mobileNavAuth');
  if (mobileAuth) {
    mobileAuth.innerHTML = html;
  }
}

// Initialize Mobile Hamburger Menu
function initMobileMenu() {
  const container = document.querySelector('header .nav-container');
  if (!container) return;

  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return; // Only create mobile menu button if navigation links exist on this page

  // Prevent multiple menus being appended
  if (document.getElementById('mobileMenuBtn')) return;

  // Create hamburger button dynamically
  const burger = document.createElement('button');
  burger.className = 'mobile-menu-toggle';
  burger.id = 'mobileMenuBtn';
  burger.setAttribute('aria-label', 'Toggle Navigation Menu');
  burger.innerHTML = `<span></span><span></span><span></span>`;

  // Always append hamburger button at the far right of the navbar container
  container.appendChild(burger);

  // Append a mobile-specific auth container inside the .nav-links drawer if not already present
  if (navLinks && !document.getElementById('mobileNavAuth')) {
    const mobileAuth = document.createElement('div');
    mobileAuth.className = 'mobile-nav-auth';
    mobileAuth.id = 'mobileNavAuth';
    navLinks.appendChild(mobileAuth);
    
    // Sync state immediately
    updateNavigationState();
  }

  // Toggle drawer and burger animations on click
  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    if (navLinks) {
      navLinks.classList.toggle('active');
    }
  });

  // Close menu when clicking a link
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      if (navLinks) {
        navLinks.classList.remove('active');
      }
    });
  });
}

// User Logout handler
window.handleLogout = function() {
  if (window.supabaseActive) {
    window.supabaseClient.auth.signOut()
      .then(() => {
        localStorage.removeItem('currentUser');
        showToast('Logged out successfully', 'gold');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      })
      .catch(err => {
        console.error("Logout failed:", err);
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
      });
  } else {
    localStorage.removeItem('currentUser');
    showToast('Logged out successfully', 'gold');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  }
};

// Toast notification trigger
function showToast(message, type = 'normal') {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  
  toast.innerHTML = `
    <span class="toast-icon">✨</span>
    <span class="${type === 'gold' ? 'toast-gold' : ''}">${message}</span>
  `;
  
  toast.classList.add('active');
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3500);
}

// ─── Shared Telegram notification helper ───────────────────────────────────
async function sendTelegramNotification(text) {
  try {
    const tgToken = localStorage.getItem('telegram_bot_token') || '8830114400:AAHA6xhuANxZjYu0iie-sAF67A2jRxy_i7U';
    const tgChatId = localStorage.getItem('telegram_chat_id') || '5124029961';
    if (!tgToken || !tgChatId) return false;

    const response = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: tgChatId, text, parse_mode: 'Markdown' })
    });
    return response.ok;
  } catch (e) {
    console.error('Telegram notification failed:', e);
    return false;
  }
}

// ─── 1. New Profile Registration Alert ─────────────────────────────────────
async function notifyAdminNewRegistration(profile) {
  try {
    const tgToken = localStorage.getItem('telegram_bot_token');
    const tgChatId = localStorage.getItem('telegram_chat_id');

    if (tgToken && tgChatId) {
      const text = `👑 *New Profile Registered* 👑\n\n` +
                   `• *Name:* ${profile.name}\n` +
                   `• *Gender:* ${profile.gender}\n` +
                   `• *Clan:* ${profile.clan}\n` +
                   `• *Gotra:* ${profile.gotra || 'Not specified'}\n` +
                   `• *Location:* ${profile.location || 'Not specified'}\n` +
                   `• *Phone:* ${profile.phone || 'Not specified'}\n` +
                   `• *Email:* ${profile.email || 'Not specified'}\n\n` +
                   `📅 _Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}_`;
      const ok = await sendTelegramNotification(text);
      if (ok) { console.log('Registration notification sent via Telegram for:', profile.name); return; }
    }

    // OpenWA Gateway fallback
    const openwaUrl = localStorage.getItem('openwa_api_url') || 'https://1d5905f1d44ce4.lhr.life';
    const openwaKey = localStorage.getItem('openwa_api_key') || 'owa_k1_21f959a8005ca7d9941383be23e1dc8104fa8622c26c080b043b860d6bc7fb50';
    const openwaSession = localStorage.getItem('openwa_session_id') || 'default';
    const openwaPhone = localStorage.getItem('openwa_admin_phone') || '917665941949';
    if (openwaUrl && openwaKey && openwaPhone) {
      let chatId = openwaPhone.trim();
      if (!chatId.endsWith('@c.us') && !chatId.endsWith('@g.us')) chatId = `${chatId.replace(/[^0-9]/g, '')}@c.us`;
      const text = `👑 *New Profile Registered* 👑\n\n• *Name:* ${profile.name}\n• *Gender:* ${profile.gender}\n• *Clan:* ${profile.clan}\n• *Phone:* ${profile.phone || 'Not specified'}\n• *Email:* ${profile.email || 'Not specified'}\n\n📅 _${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}_`;
      const endpoint = `${openwaUrl.replace(/\/$/, '')}/api/sessions/${openwaSession}/messages/send-text`;
      await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Key': openwaKey }, body: JSON.stringify({ chatId, text }) });
      return;
    }

    const webhookUrl = localStorage.getItem('whatsapp_registration_webhook');
    if (webhookUrl) {
      await fetch(webhookUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'new_registration', name: profile.name, gender: profile.gender, clan: profile.clan, phone: profile.phone || 'Not specified', email: profile.email || 'Not specified', timestamp: new Date().toISOString() }) });
    }
  } catch (error) {
    console.error('Failed to send registration notification:', error);
  }
}

// ─── 2. Matchmaker Bot / Chat Opened Alert ──────────────────────────────────
async function notifyAdminChatOpened(user, targetProfile) {
  try {
    const text = `💬 *Chat Opened* 💬\n\n` +
                 `• *From:* ${user.name || 'A user'} _(${user.clan || 'Unknown Clan'})_\n` +
                 `• *To:* ${targetProfile ? targetProfile.name : 'Matchmaker Bot'} _(${targetProfile ? targetProfile.clan : ''})_\n\n` +
                 `📅 _Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}_`;
    await sendTelegramNotification(text);
  } catch (e) {
    console.error('Failed to send chat opened notification:', e);
  }
}

// ─── 3. Interest Request Sent Alert ────────────────────────────────────────
async function notifyAdminInterestSent(fromUser, toProfile) {
  try {
    const text = `💌 *Interest Request Sent* 💌\n\n` +
                 `• *From:* ${fromUser.name || 'A user'} _(${fromUser.clan || 'Unknown Clan'})_\n` +
                 `• *To:* ${toProfile ? toProfile.name : 'Unknown'} _(${toProfile ? toProfile.clan : ''})_\n\n` +
                 `📅 _Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}_`;
    await sendTelegramNotification(text);
  } catch (e) {
    console.error('Failed to send interest notification:', e);
  }
}
// Resolve profile image URL helper
function resolveProfileImageUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('/') || trimmed.startsWith('images/')) {
    return trimmed;
  }
  // If it's a local mock avatar string, resolve it to images/avatar.png
  if (!trimmed.includes('.') && !trimmed.includes('/')) {
    return `images/${trimmed}.png`;
  }
  return trimmed;
}

// Get combined profiles (Registered users from Supabase database)
function getAllProfiles() {
  // Fetch from Supabase database cache if active, otherwise fall back to LocalStorage
  let localUsers = [];
  if (window.supabaseActive && window.firestoreUsers) {
    localUsers = window.firestoreUsers;
  } else {
    localUsers = JSON.parse(localStorage.getItem('users')) || [];
  }
  
  // Merge database/localStorage users with SEED_PROFILES
  const seedProfiles = window.SEED_PROFILES || [];
  
  // Combine them, ensuring we don't have duplicate IDs
  const combined = [...localUsers];
  seedProfiles.forEach(seed => {
    // If database already has a profile with the same ID, don't duplicate
    if (!combined.some(u => u.id === seed.id || u.email === seed.email)) {
      combined.push(seed);
    }
  });
  
  const formattedLocals = combined.map(user => {
    const rawPic = user.profilePic || user.img || '';
    const resolvedPic = resolveProfileImageUrl(rawPic);
    
    return {
      id: user.id || `U_${user.email}`,
      name: user.name || "Noble Member",
      img: resolvedPic,
      profilePic: resolvedPic,
      gender: user.gender || "Groom",
      age: parseInt(user.age) || 25,
      dob: user.dob || "1998-06-15",
      religion: user.religion || "Hindu",
      caste: user.caste || "Rajput",
      height: user.height || "5'6\"",
      clan: user.clan || "Rathore",
      gotra: user.gotra && user.gotra.includes('(Father)') ? user.gotra : `${user.gotra || 'Not Specified'} (Father) / ${user.motherGotra || 'Not Specified'} (Mother)`,
      native: user.pob || user.native || user.location || 'Rajasthan',
      rashi: user.rashi || 'Not Specified',
      nakshatra: user.nakshatra || 'Not Specified',
      manglik: user.manglik || 'Non-Manglik',
      education: user.education || 'Graduate',
      occupation: user.occupation || 'Professional',
      income: user.income ? (user.income.includes('Lakhs') || user.income.includes('Crore') ? user.income : `₹${user.income} Lakhs PA`) : '₹12 Lakhs PA',
      location: user.location || 'Jaipur, Rajasthan',
      familyType: user.familyType || 'Traditional',
      familyDetails: user.familyDetails || 'Respectable family based in Rajasthan.',
      about: user.about || 'A simple and career-oriented individual.',
      expectations: user.expectations || 'An understanding partner.',
      prefMinAge: user.prefMinAge || 21,
      prefMaxAge: user.prefMaxAge || 29,
      prefCaste: user.prefCaste || 'Any',
      prefLocation: user.prefLocation || 'Any',
      initials: user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'NM',
      isRegisteredUser: true,
      email: user.email,
      isRecentlyActive: user.isRecentlyActive !== undefined ? user.isRecentlyActive : true,
      isVerified: user.isVerified !== undefined ? user.isVerified : true,
      aiScore: user.aiScore || 92,
      tier: user.tier || 'Starter'
    };
  });

  return formattedLocals;
}
// Check auth before loading dashboard
function checkAuth() {
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) {
    showToast('Please login to explore matches', 'gold');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);
    return false;
  }
  return JSON.parse(currentUser);
}

// ==========================================
// 2. HOMEPAGE HANDLER
// ==========================================
function initHomepage() {
  // Redirect logged-in users to dashboard automatically
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    window.location.href = 'dashboard.html';
    return;
  }

  const searchBtn = document.getElementById('homepageSearchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const gender = document.getElementById('searchGender').value;
      const caste = document.getElementById('searchCaste').value;
      const ageRange = document.getElementById('searchAge').value;

      // Store quick search parameters in sessionStorage to apply on dashboard load
      sessionStorage.setItem('quickSearch', JSON.stringify({ gender, caste, ageRange }));
      
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        window.location.href = 'dashboard.html';
      } else {
        showToast('Please log in or sign up to view complete royal matches!', 'gold');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      }
    });
  }

  // Pre-render a few featured profiles on homepage
  const featuredContainer = document.getElementById('featuredProfilesSlider');
  if (featuredContainer) {
    const allProfiles = getAllProfiles();
    // Grab 8 noble profiles with real visual portrait imagery
    const featured = allProfiles.filter(p => ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'].includes(p.id));
    
    featuredContainer.innerHTML = featured.map(profile => createProfileCardHtml(profile, false)).join('');
  }

  // Initialize hero slideshow
  initHeroSlideshow();

  // Initialize FAQ Accordion details toggles
  initFaqAccordion();
}

function initHeroSlideshow() {
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length === 0) return;

  let currentSlideIdx = 0;
  setInterval(() => {
    slides[currentSlideIdx].classList.remove('active');
    currentSlideIdx = (currentSlideIdx + 1) % slides.length;
    slides[currentSlideIdx].classList.add('active');
  }, 4000);
}

function initFaqAccordion() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isActive = item.classList.contains('active');
      
      // Close all items first (optional, makes it look extremely clean!)
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('active');
        const icon = i.querySelector('.faq-icon');
        if (icon) icon.textContent = '+';
      });

      if (!isActive) {
        item.classList.add('active');
        const icon = item.querySelector('.faq-icon');
        if (icon) icon.textContent = '−';
      }
    });
  });
}

// ==========================================
// 3. AUTH PAGE HANDLERS
// ==========================================
function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const btnGoogle = document.getElementById('btnGoogleAuth');

  if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
      if (!window.supabaseActive) {
        showToast('Google login is active in mock fallback mode. Please configure credentials in supabase-config.js!', 'normal');
        // Fallback mock login for local testing
        const demoUser = {
          name: 'Kunwar Shivraj Singh',
          gender: 'Groom',
          email: 'royal@shreerajputsagaisambandh.com',
          caste: 'Rajput',
          clan: 'Rathore',
          age: 28,
          tier: 'Starter'
        };
        localStorage.setItem('currentUser', JSON.stringify(demoUser));
        showToast('Mock Google Login Success!', 'gold');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1200);
        return;
      }

      // Supabase Google Sign-In (Redirect flow)
      const { error } = await window.supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard.html'
        }
      });

      if (error) {
        console.error("Google Auth error:", error);
        showToast('Google connection failed: ' + error.message, 'normal');
      }
    });
  }

  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showToast('Please fill all fields');
      return;
    }

    // Supabase Auth login flow
    if (window.supabaseActive) {
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        showToast('Login failed: ' + error.message, 'normal');
        return;
      }

      // Load user profile from profiles table
      const { data: profile, error: dbError } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile) {
        localStorage.setItem('currentUser', JSON.stringify(profile));
        showToast(`Khammaghani, Welcome ${profile.name.split(' ')[0]}`, 'gold');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1200);
      } else {
        // Auth succeeded but profile records are missing, redirect to register onboarding
        const tempGoogleUser = {
          uid: data.user.id,
          name: 'Noble Member',
          email: email
        };
        localStorage.setItem('tempGoogleUser', JSON.stringify(tempGoogleUser));
        showToast('Welcome! Please complete your lineage details to finish registration.', 'gold');
        setTimeout(() => {
          window.location.href = 'register.html';
        }, 1200);
      }
      return;
    }

    // Standard static credentials for seed testing (Fallback mode)
    if ((email === 'royal@shreerajputsagaisambandh.com' || email === 'royal@lifepartnerconnects.com') && password === 'royal123') {
      const demoUser = {
        name: 'Kunwar Shivraj Singh',
        gender: 'Groom',
        email: email,
        caste: 'Rajput',
        clan: 'Rathore',
        age: 28,
        tier: 'Starter' // Default Starter Tier
      };
      localStorage.setItem('currentUser', JSON.stringify(demoUser));
      showToast('Khammaghani! Welcome to Shree Rajput Sagai Sambandh', 'gold');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1200);
      return;
    }

    // Check LocalStorage registered users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (matchedUser) {
      matchedUser.tier = matchedUser.tier || 'Starter';
      localStorage.setItem('currentUser', JSON.stringify(matchedUser));
      showToast(`Khammaghani, Welcome ${matchedUser.name.split(' ')[0]}`, 'gold');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1200);
    } else {
      showToast('Invalid credentials. Try royal@shreerajputsagaisambandh.com / royal123', 'normal');
    }
  });
}

function initRegisterPage() {
  const steps = document.querySelectorAll('.register-step-panel');
  const indicators = document.querySelectorAll('.progress-step');
  const nextBtns = document.querySelectorAll('.btn-next');
  const prevBtns = document.querySelectorAll('.btn-prev');
  const registerForm = document.getElementById('registerForm');
  const btnGoogle = document.getElementById('btnGoogleAuth');
  let currentStep = 0;

  // Google Login redirect prefill check
  const tempGoogleUser = JSON.parse(localStorage.getItem('tempGoogleUser'));
  if (tempGoogleUser) {
    document.getElementById('regName').value = tempGoogleUser.name || '';
    document.getElementById('regEmail').value = tempGoogleUser.email || '';
    document.getElementById('regPassword').value = 'GoogleAuthenticated';
    const pwdGroup = document.getElementById('regPassword').closest('.form-group');
    if (pwdGroup) pwdGroup.style.display = 'none';
    window.googleUserUid = tempGoogleUser.uid;
    localStorage.removeItem('tempGoogleUser'); // Consume
    showToast('Google account linked! Please complete your lineage details.', 'gold');
  }

  // Google Auth Button trigger
  if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
      if (!window.supabaseActive) {
        showToast('Google auth is active in mock fallback mode. Prefilled details!', 'gold');
        document.getElementById('regName').value = 'Kunwar Vikram Singh';
        document.getElementById('regEmail').value = 'vikram.singh@gmail.com';
        document.getElementById('regPassword').value = 'GoogleAuthenticated';
        const pwdGroup = document.getElementById('regPassword').closest('.form-group');
        if (pwdGroup) pwdGroup.style.display = 'none';
        window.googleUserUid = 'mock_google_uid_' + Date.now();
        return;
      }

      // Supabase Google Sign-In (Redirect flow)
      const { error } = await window.supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard.html'
        }
      });

      if (error) {
        console.error("Google Register Auth error:", error);
        showToast('Google connection failed: ' + error.message, 'normal');
      }
    });
  }

  const regCasteSelect = document.getElementById('regCaste');
  if (regCasteSelect) {
    regCasteSelect.addEventListener('change', function() {
      const otherGroup = document.getElementById('regCasteOtherGroup');
      if (this.value === 'Other') {
        if (otherGroup) otherGroup.style.display = 'block';
        const otherInput = document.getElementById('regCasteOther');
        if (otherInput) otherInput.required = true;
      } else {
        if (otherGroup) otherGroup.style.display = 'none';
        const otherInput = document.getElementById('regCasteOther');
        if (otherInput) {
          otherInput.required = false;
          otherInput.value = '';
        }
      }
    });
  }

  if (!registerForm) return;

  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        currentStep++;
        updateRegisterSteps();
      }
    });
  });

  prevBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentStep--;
      updateRegisterSteps();
    });
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    const email = document.getElementById('regEmail').value.trim();
    
    // Check if user already exists locally
    const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
    if (existingUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      showToast('This email is already registered. Please login.', 'gold');
      return;
    }

    const newUser = {
      id: `U_${Date.now()}`,
      name: document.getElementById('regName').value.trim(),
      gender: document.getElementById('regGender').value,
      email: email,
      password: document.getElementById('regPassword').value,
      age: parseInt(document.getElementById('regAge').value) || 25,
      dob: document.getElementById('regDOB').value,
      religion: document.getElementById('regReligion').value,
      caste: document.getElementById('regCasteType').value,
      clan: document.getElementById('regCaste').value === 'Other' ? document.getElementById('regCasteOther').value.trim() : document.getElementById('regCaste').value,
      pob: document.getElementById('regPOB').value.trim(),
      gotra: document.getElementById('regGotra').value.trim(),
      motherGotra: document.getElementById('regMotherGotra').value.trim(),
      rashi: document.getElementById('regRashi').value,
      manglik: document.getElementById('regManglik').value,
      education: document.getElementById('regEducation').value.trim(),
      occupation: document.getElementById('regOccupation').value.trim(),
      income: document.getElementById('regIncome').value.trim(),
      location: document.getElementById('regLocation').value.trim(),
      familyType: document.getElementById('regFamilyType').value,
      prefMinAge: parseInt(document.getElementById('regPrefMinAge').value) || 21,
      prefMaxAge: parseInt(document.getElementById('regPrefMaxAge').value) || 29,
      prefCaste: document.getElementById('regPrefCaste').value.trim(),
      prefLocation: document.getElementById('regPrefLocation').value.trim(),
      about: document.getElementById('regAbout').value.trim(),
      expectations: document.getElementById('regExpectations').value.trim(),
      tier: 'Starter' // Default to Starter Tier on registration
    };

    if (window.supabaseActive) {
      const saveToSupabase = async (uid) => {
        newUser.id = uid;
        delete newUser.password; // Don't save cleartext password to DB
        
        const { error: dbError } = await window.supabaseClient
          .from('profiles')
          .insert([newUser]);

        if (dbError) {
          console.error(dbError);
          if (dbError.code === '23503') {
            showToast('This email is already registered. Please log in!', 'gold');
          } else {
            showToast('Error saving profile: ' + dbError.message, 'normal');
          }
          return;
        }

        localStorage.setItem('currentUser', JSON.stringify(newUser));
        notifyAdminNewRegistration(newUser); // Notify admin on WhatsApp
        showToast('Royal Profile Created successfully!', 'gold');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      };

      // If already authenticated via Google (exclude mock Google login strings)
      if (window.googleUserUid && !window.googleUserUid.startsWith('mock_')) {
        await saveToSupabase(window.googleUserUid);
      } else {
        const { data, error } = await window.supabaseClient.auth.signUp({
          email: newUser.email,
          password: newUser.password
        });

        if (error) {
          showToast('Registration failed: ' + error.message, 'normal');
          return;
        }

        if (data && data.user) {
          await saveToSupabase(data.user.id);
        } else {
          showToast('This email is already registered. Please log in!', 'gold');
        }
      }
      return;
    }

    // Save to LocalStorage fallback mode
    existingUsers.push(newUser);
    localStorage.setItem('users', JSON.stringify(existingUsers));
    
    // Auto-login
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    notifyAdminNewRegistration(newUser); // Notify admin on WhatsApp

    showToast('Royal Profile Created successfully!', 'gold');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
  });

  function updateRegisterSteps() {
    steps.forEach((step, idx) => {
      step.classList.toggle('active', idx === currentStep);
    });

    indicators.forEach((indicator, idx) => {
      indicator.classList.toggle('active', idx === currentStep);
      indicator.classList.toggle('completed', idx < currentStep);
    });
  }

  function validateStep(stepIdx) {
    if (stepIdx === 0) {
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const pass = document.getElementById('regPassword').value;
      const gender = document.getElementById('regGender').value;

      if (!name || !email || !pass || !gender) {
        showToast('Please fill all credentials');
        return false;
      }
      if (pass.length < 6) {
        showToast('Password should be at least 6 characters');
        return false;
      }
      return true;
    } else if (stepIdx === 1) {
      const clanSelect = document.getElementById('regCaste').value;
      const clan = clanSelect === 'Other' ? document.getElementById('regCasteOther').value.trim() : clanSelect;
      const gotra = document.getElementById('regGotra').value.trim();
      const age = document.getElementById('regAge').value;
      const religion = document.getElementById('regReligion').value;
      const casteType = document.getElementById('regCasteType').value;
      const dob = document.getElementById('regDOB').value;
      const pob = document.getElementById('regPOB').value.trim();

      if (!clan || !gotra || !age || !religion || !casteType || !dob || !pob) {
        showToast('Please fill all lineage, heritage and birth details');
        return false;
      }
      return true;
    } else if (stepIdx === 2) {
      const education = document.getElementById('regEducation').value.trim();
      const occupation = document.getElementById('regOccupation').value.trim();
      const location = document.getElementById('regLocation').value.trim();

      if (!education || !occupation || !location) {
        showToast('Please provide your professional credentials');
        return false;
      }
      return true;
    } else if (stepIdx === 3) {
      const prefMinAge = document.getElementById('regPrefMinAge').value;
      const prefMaxAge = document.getElementById('regPrefMaxAge').value;
      const prefCaste = document.getElementById('regPrefCaste').value.trim();
      const prefLocation = document.getElementById('regPrefLocation').value.trim();

      if (!prefMinAge || !prefMaxAge || !prefCaste || !prefLocation) {
        showToast('Please specify all partner preferences');
        return false;
      }
      return true;
    }
    return true;
  }
}

// ==========================================
// 4. MATCHMAKING DASHBOARD HANDLER
// ==========================================
let activeFilters = {
  gender: 'All',
  caste: 'All',
  age: 'All',
  search: '',
  shortlistOnly: false
};

async function initDashboardPage() {
  // Handle Supabase OAuth redirection & async user loading before checkAuth executes
  const isOAuthRedirect = window.location.hash.includes('access_token=') || window.location.hash.includes('id_token=');
  
  if (isOAuthRedirect && window.supabaseActive) {
    try {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      if (session) {
        // Fetch user profile record
        const { data: profile } = await window.supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          localStorage.setItem('currentUser', JSON.stringify(profile));
          window.location.hash = ''; // Clear redirect hash params
          window.location.reload();
          return;
        } else {
          // OAuth succeeded but no profile details created yet, redirect to onboarding/register wizard
          const tempGoogleUser = {
            uid: session.user.id,
            name: session.user.user_metadata.full_name || 'Noble Member',
            email: session.user.email
          };
          localStorage.setItem('tempGoogleUser', JSON.stringify(tempGoogleUser));
          window.location.hash = ''; // Clear redirect hash params
          window.location.href = 'register.html';
          return;
        }
      }
    } catch (e) {
      console.error("Google Auth session load failed:", e);
    }
  }

  const currentUser = checkAuth();
  if (!currentUser) return;

  // 1. Populate the left user profile card widget dynamically
  populateLeftUserCard(currentUser);

  // 2. Populate the right-side active online matches list dynamically
  populateOnlineSidebar(currentUser);

  if (window.supabaseActive) {
    // Load all matching profiles from database
    window.supabaseClient.from('profiles').select('*')
      .then(({ data, error }) => {
        if (!error && data) {
          window.firestoreUsers = data; // cache in memory to sync matches grid
          renderMatchesGrid();
          updateDashboardStats();
          // Re-populate online sidebar with real database users if available
          populateOnlineSidebar(currentUser);
        } else if (error) {
          console.error("Error loading Supabase profiles:", error);
        }
      });

    // Start periodic background sync for profiles & incoming interests every 8 seconds
    setInterval(() => {
      window.supabaseClient.from('profiles').select('*')
        .then(({ data, error }) => {
          if (!error && data) {
            window.firestoreUsers = data;
            renderMatchesGrid();
            updateDashboardStats();
            populateOnlineSidebar(currentUser);
          }
        });
    }, 8000);
  }

  const userTier = currentUser.tier || 'Starter';

  // Customize greeting based on membership level
  document.getElementById('dashboardGreetingHeader').innerHTML = `
    Khammaghani, ${currentUser.name.split(' ')[0]}! 
    <span style="font-size: 0.95rem; font-weight: bold; color: var(--gold-antique); font-family: var(--font-body); display: inline-block; margin-left: 10px; padding: 2px 10px; background-color: var(--gold-light); border: 1.5px solid var(--gold-antique); border-radius: 15px;">
      ${userTier} Plan
    </span>
  `;

  // Render stats in dashboard top greeting bar
  updateDashboardStats();

  // Load and apply quick search session overrides if any
  const quickSearch = sessionStorage.getItem('quickSearch');
  if (quickSearch) {
    const qs = JSON.parse(quickSearch);
    activeFilters.gender = qs.gender;
    activeFilters.caste = qs.caste;
    activeFilters.age = qs.ageRange;
    
    // Sync filters in HTML input fields
    document.getElementById('filterGender').value = qs.gender;
    document.getElementById('filterCaste').value = qs.caste;
    document.getElementById('filterAge').value = qs.ageRange;

    sessionStorage.removeItem('quickSearch'); // Clean up
  } else {
    const targetGender = getOppositeGender(currentUser.gender);
    activeFilters.gender = targetGender;
    const filterGenderEl = document.getElementById('filterGender');
    if (filterGenderEl) {
      filterGenderEl.value = targetGender;
    }
  }

  // Display initial profiles grid
  renderMatchesGrid();

  // If redirected from chatbot on home page, open the suggested profile details modal
  const chatbotTriggerProfileId = sessionStorage.getItem('openProfileId');
  if (chatbotTriggerProfileId) {
    sessionStorage.removeItem('openProfileId');
    setTimeout(() => {
      if (typeof openProfileDetailModal === 'function') {
        openProfileDetailModal(chatbotTriggerProfileId);
      }
    }, 500);
  }

  // Setup sidebar filter event listeners (Real-time live filtering!)
  document.getElementById('filterGender').addEventListener('change', (e) => {
    activeFilters.gender = e.target.value;
    renderMatchesGrid();
  });

  document.getElementById('filterCaste').addEventListener('change', (e) => {
    // Intercept advanced caste/gotra filtering for Starter Plan users to enforce paywall!
    if (userTier === 'Starter' && e.target.value !== 'All') {
      e.target.value = 'All'; // Reset input
      document.getElementById('paywallModal').classList.add('active');
      showToast('Advanced Caste filters require Silver Plan upgrade!', 'gold');
      return;
    }
    activeFilters.caste = e.target.value;
    renderMatchesGrid();
  });

  document.getElementById('filterAge').addEventListener('change', (e) => {
    activeFilters.age = e.target.value;
    renderMatchesGrid();
  });

  document.getElementById('filterSearch').addEventListener('input', (e) => {
    activeFilters.search = e.target.value.trim().toLowerCase();
    renderMatchesGrid();
  });

  // Shortlist toggle filter button
  const shortlistFilterToggle = document.getElementById('shortlistToggleBtn');
  if (shortlistFilterToggle) {
    shortlistFilterToggle.addEventListener('click', () => {
      activeFilters.shortlistOnly = !activeFilters.shortlistOnly;
      shortlistFilterToggle.classList.toggle('btn-primary', activeFilters.shortlistOnly);
      shortlistFilterToggle.classList.toggle('btn-minimal', !activeFilters.shortlistOnly);
      shortlistFilterToggle.textContent = activeFilters.shortlistOnly ? 'Showing Shortlisted ❤️' : 'View Shortlisted';
      renderMatchesGrid();
    });
  }

  // Clear filters trigger
  document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    activeFilters = {
      gender: currentUser.gender === 'Groom' ? 'Bride' : (currentUser.gender === 'Bride' ? 'Groom' : 'All'),
      caste: 'All',
      age: 'All',
      search: '',
      shortlistOnly: false
    };

    document.getElementById('filterGender').value = activeFilters.gender;
    document.getElementById('filterCaste').value = 'All';
    document.getElementById('filterAge').value = 'All';
    document.getElementById('filterSearch').value = '';
    
    if (shortlistFilterToggle) {
      shortlistFilterToggle.classList.add('btn-minimal');
      shortlistFilterToggle.classList.remove('btn-primary');
      shortlistFilterToggle.textContent = 'View Shortlisted';
    }

    renderMatchesGrid();
    showToast('Filters Reset', 'gold');
  });

  // Setup modal closing triggers
  const modal = document.getElementById('profileDetailModal');
  const closeBtn = document.querySelector('.modal-close-btn');
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }

  // Paywall modal close triggers
  const paywallModal = document.getElementById('paywallModal');
  const paywallClose = document.getElementById('paywallCloseBtn');
  if (paywallClose && paywallModal) {
    paywallClose.addEventListener('click', () => {
      paywallModal.classList.remove('active');
    });
    paywallModal.addEventListener('click', (e) => {
      if (e.target === paywallModal) {
        paywallModal.classList.remove('active');
      }
    });
  }
}

// Render dynamic matches grid based on activeFilters
function renderMatchesGrid() {
  const container = document.getElementById('matchesGrid');
  if (!container) return;

  // Scan and register any incoming interests from other users to unlock chats
  checkIncomingInterests();

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const profiles = getAllProfiles();
  const shortlists = JSON.parse(localStorage.getItem('shortlisted')) || [];

  const filtered = profiles.filter(profile => {
    if (currentUser && profile.id === currentUser.id) return false;
    if (activeFilters.gender !== 'All' && normalizeGender(profile.gender) !== normalizeGender(activeFilters.gender)) return false;
    if (activeFilters.caste !== 'All' && profile.caste !== activeFilters.caste) return false;
    
    if (activeFilters.age !== 'All') {
      const [min, max] = activeFilters.age.split('-').map(Number);
      if (profile.age < min || profile.age > max) return false;
    }

    if (activeFilters.search) {
      const matchText = `${profile.name} ${profile.gotra} ${profile.location} ${profile.occupation}`.toLowerCase();
      if (!matchText.includes(activeFilters.search)) return false;
    }

    if (activeFilters.shortlistOnly) {
      if (!shortlists.includes(profile.id)) return false;
    }

    return true;
  });

  if (currentUser && currentUser.caste && activeFilters.caste === 'All') {
    filtered.sort((a, b) => {
      if (a.caste === currentUser.caste && b.caste !== currentUser.caste) return -1;
      if (a.caste !== currentUser.caste && b.caste === currentUser.caste) return 1;
      return 0;
    });
  }

  const countSpan = document.getElementById('resultsCountSpan');
  if (countSpan) {
    countSpan.textContent = filtered.length;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background-color: var(--bg-card); border-radius: var(--border-radius-lg); border: 1px dashed var(--gold-antique);">
        <p style="font-family: var(--font-royal); font-size: 1.3rem; color: var(--primary-color); margin-bottom: 10px;">No Royal Match Found</p>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Try adjusting the lineage castes or age criteria.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(profile => createProfileCardHtml(profile, true)).join('');
}

function getAvatarGradient(clan) {
  switch (clan) {
    case 'Rathore':
      return 'linear-gradient(135deg, #4A0D18 0%, #6B1220 50%, #D45B12 100%)';
    case 'Sisodia':
      return 'linear-gradient(135deg, #4A0D18 0%, #6B1220 50%, #C41E3A 100%)';
    case 'Chauhan':
      return 'linear-gradient(135deg, #4A0D18 0%, #6B1220 50%, #C9A227 100%)';
    case 'Kachwaha':
      return 'linear-gradient(135deg, #4A0D18 0%, #6B1220 50%, #1D2B53 100%)';
    case 'Bhati':
      return 'linear-gradient(135deg, #4A0D18 0%, #6B1220 50%, #E8C766 100%)';
    case 'Shekhawat':
      return 'linear-gradient(135deg, #4A0D18 0%, #6B1220 50%, #0D6646 100%)';
    default:
      return 'linear-gradient(135deg, #4A0D18 0%, #6B1220 100%)';
  }
}

// Supabase-backed decentralized peer-to-peer interest helpers
function getProfileInterests(profile) {
  let interests = {};
  if (profile && profile.about) {
    const interestsRegex = /\[Interests: ([^\n\r]*)\]/;
    const match = profile.about.match(interestsRegex);
    if (match) {
      try {
        interests = JSON.parse(match[1].trim());
      } catch (e) {
        console.error("Failed to parse interests JSON:", e);
      }
    }
  }
  return interests;
}

function setProfileInterestsInAbout(aboutText, interestsObj) {
  let cleanAbout = aboutText || '';
  cleanAbout = cleanAbout.replace(/\[Interests: [^\n\r]*\]/g, '').trim();
  return (cleanAbout + `\n[Interests: ${JSON.stringify(interestsObj)}]`).trim();
}

function getProfileLastSeen(profile) {
  if (!profile) return null;

  // 1. Direct last_seen / lastSeen properties if present
  if (profile.last_seen) return profile.last_seen;
  if (profile.lastSeen) return profile.lastSeen;

  // 2. Check metadata tag in about field: [Last Seen: ISOString]
  if (profile.about) {
    const match = profile.about.match(/\[Last Seen: ([^\]]*)\]/);
    if (match && match[1]) {
      const parsed = new Date(match[1].trim());
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
  }

  // 3. Fallback to updated_at if available
  if (profile.updated_at) {
    const updateVal = new Date(profile.updated_at);
    if (!isNaN(updateVal.getTime())) return updateVal.toISOString();
  }

  // 4. If this is the current active session user, they are online right now
  try {
    const currentLogged = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentLogged && (currentLogged.id === profile.id || (currentLogged.email && currentLogged.email === profile.email))) {
      return new Date().toISOString();
    }
  } catch (e) {}

  // Real, not fake: if no activity recorded, return null
  return null;
}

function formatLastSeen(isoString) {
  if (!isoString) return 'Offline';
  const lastSeenDate = new Date(isoString);
  if (isNaN(lastSeenDate.getTime())) return 'Offline';

  const now = new Date();
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMins = Math.floor(diffMs / 1000 / 60);

  // Active within 5 minutes or slight future clock skew -> Online now
  if (diffMins < 5) {
    return 'Online now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else {
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
      return 'Offline';
    }
  }
}

function getProfileOnlineStatus(profile) {
  const lastSeenIso = getProfileLastSeen(profile);
  if (!lastSeenIso) {
    return {
      isOnline: false,
      statusClass: 'status-offline',
      text: 'Offline',
      formattedText: 'Offline',
      rawDate: null,
      timestamp: 0
    };
  }

  const lastSeenDate = new Date(lastSeenIso);
  const time = isNaN(lastSeenDate.getTime()) ? 0 : lastSeenDate.getTime();
  const diffMs = Date.now() - time;
  const diffMins = Math.floor(diffMs / 1000 / 60);

  if (diffMins < 5) {
    return {
      isOnline: true,
      statusClass: 'status-online',
      text: 'Online now',
      formattedText: 'Online now',
      rawDate: lastSeenDate,
      timestamp: time
    };
  } else if (diffMins < 1440) { // Active within 24 hours
    const relText = formatLastSeen(lastSeenIso);
    return {
      isOnline: false,
      statusClass: 'status-recent',
      text: relText,
      formattedText: `Active ${relText}`,
      rawDate: lastSeenDate,
      timestamp: time
    };
  } else {
    const relText = formatLastSeen(lastSeenIso);
    return {
      isOnline: false,
      statusClass: 'status-offline',
      text: relText,
      formattedText: relText === 'Offline' ? 'Offline' : `Active ${relText}`,
      rawDate: lastSeenDate,
      timestamp: time
    };
  }
}

async function updateMyLastSeen() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) return;
  
  const nowIso = new Date().toISOString();
  
  // 1. Update in localStorage currentUser immediately
  let about = currentUser.about || '';
  if (about.includes('[Last Seen:')) {
    about = about.replace(/\[Last Seen: [^\]]*\]/g, `[Last Seen: ${nowIso}]`);
  } else {
    about = `${about} [Last Seen: ${nowIso}]`.trim();
  }
  currentUser.about = about;
  currentUser.last_seen = nowIso;
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  
  // 2. Also update firestoreUsers in-memory cache if active
  if (window.firestoreUsers && Array.isArray(window.firestoreUsers)) {
    const userIndex = window.firestoreUsers.findIndex(u => u.id === currentUser.id || u.email === currentUser.email);
    if (userIndex !== -1) {
      window.firestoreUsers[userIndex].about = about;
      window.firestoreUsers[userIndex].last_seen = nowIso;
    }
  }

  // 3. Sync to Supabase profiles table
  if (window.supabaseClient && window.supabaseActive) {
    try {
      const { data: profile } = await window.supabaseClient
        .from('profiles')
        .select('about')
        .eq('id', currentUser.id)
        .maybeSingle();
        
      if (profile) {
        let dbAbout = profile.about || '';
        if (dbAbout.includes('[Last Seen:')) {
          dbAbout = dbAbout.replace(/\[Last Seen: [^\]]*\]/g, `[Last Seen: ${nowIso}]`);
        } else {
          dbAbout = `${dbAbout} [Last Seen: ${nowIso}]`.trim();
        }
        
        await window.supabaseClient
          .from('profiles')
          .update({ about: dbAbout })
          .eq('id', currentUser.id);
      }
    } catch (err) {
      console.warn("Last seen sync error:", err);
    }
  }
}

function areProfilesConnected(profileA, profileB) {
  if (!profileA || !profileB) return false;
  
  const interestsA = getProfileInterests(profileA);
  const interestsB = getProfileInterests(profileB);
  
  // Real security rule: profiles are connected ONLY if accepted by either party
  return (interestsA[profileB.id] === 'accepted' || interestsB[profileA.id] === 'accepted');
}

// Clean up any previously auto-seeded mock notifications so requests strictly come ONLY when genuinely sent
function cleanupMockNotifications(currentUser) {
  if (!currentUser) return;
  let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  const profiles = getAllProfiles();

  const filtered = notifications.filter(n => {
    // Purge fake auto-seeded likes
    if (n.notifKey && n.notifKey.startsWith('like_from_')) return false;

    // Purge mock requests where the sender did not actually send an interest to currentUser
    if (n.type === 'interest_request') {
      const senderId = n.senderId || n.profileId;
      const sender = profiles.find(p => p.id === senderId);
      if (!sender) return false;
      const senderInterests = getProfileInterests(sender);
      // Strictly keep only if the sender's profile ACTUALLY has currentUser marked as 'sent'
      return senderInterests[currentUser.id] === 'sent';
    }

    return true;
  });

  if (filtered.length !== notifications.length) {
    localStorage.setItem('notifications', JSON.stringify(filtered));
  }
}

function checkIncomingInterests() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) return;

  // Clean up any mock/stale notifications
  cleanupMockNotifications(currentUser);
  
  const profiles = getAllProfiles();
  const myInterests = getProfileInterests(currentUser);
  let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  let updated = false;
  
  for (const p of profiles) {
    if (p.id === currentUser.id) continue;
    const incomingInterests = getProfileInterests(p);
    
    // Check if member p sent an interest to currentUser that is not yet accepted or declined
    if (incomingInterests[currentUser.id] === 'sent' && myInterests[p.id] !== 'accepted' && myInterests[p.id] !== 'declined') {
      const notifKey = `interest_from_${p.id}`;
      const existingIdx = notifications.findIndex(n => n.notifKey === notifKey);
      
      if (existingIdx === -1) {
        const newNotif = {
          id: Date.now() + Math.random(),
          notifKey: notifKey,
          type: 'interest_request',
          senderId: p.id,
          senderName: p.name,
          message: `${p.name} (${p.clan || 'Rajput'} Clan, ${p.age || '25'} Yrs) sent you a Royal Match Interest! Review profile to accept or decline.`,
          profileId: p.id,
          timestamp: 'Just now',
          read: false,
          status: 'pending'
        };
        notifications.unshift(newNotif);
        updated = true;
      }
      
      // Trigger floating alert banner on ANY page if not dismissed in this session
      const dismissedKey = `dismissed_alert_${p.id}`;
      if (!sessionStorage.getItem(dismissedKey) && !document.getElementById(`royalInterestAlert_${p.id}`) && !document.getElementById('royalPageAlertBanner')) {
        showFloatingInterestAlert(p);
      }
    } else if (incomingInterests[currentUser.id] === 'accepted' && myInterests[p.id] === 'sent') {
      // The other user accepted our sent interest!
      myInterests[p.id] = 'accepted';
      currentUser.about = setProfileInterestsInAbout(currentUser.about, myInterests);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      
      const notifKey = `interest_accepted_${p.id}`;
      const existingIdx = notifications.findIndex(n => n.notifKey === notifKey);
      if (existingIdx === -1) {
        notifications.unshift({
          id: Date.now() + Math.random(),
          notifKey: notifKey,
          type: 'interest_accepted',
          senderId: p.id,
          senderName: p.name,
          message: `${p.name} accepted your Royal Match Interest! Contact details and chat are now unlocked.`,
          profileId: p.id,
          timestamp: 'Just now',
          read: false
        });
        updated = true;
      }
    }
  }
  
  if (updated) {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    if (typeof renderNotifications === 'function') {
      renderNotifications();
    }
  }
}

// Generate Profile Card Markup
function createProfileCardHtml(profile, isDashboard = true) {
  const shortlists = JSON.parse(localStorage.getItem('shortlisted')) || [];
  const isShortlisted = shortlists.includes(profile.id);
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const mySentInterests = getProfileInterests(currentUser);
  const theirInterests = getProfileInterests(profile);
  
  const hasSentInterest = mySentInterests[profile.id] === 'sent';
  const isAccepted = areProfilesConnected(currentUser, profile);
  const isIncomingPending = currentUser && theirInterests[currentUser.id] === 'sent' && mySentInterests[profile.id] !== 'accepted' && mySentInterests[profile.id] !== 'declined';
  const isLoggedIn = !!localStorage.getItem('currentUser');

  // Business badges: Dynamic Last Seen status with real indicators
  const onlineStatus = getProfileOnlineStatus(profile);
  const badgeDotColor = onlineStatus.isOnline ? '#2ecc71' : (onlineStatus.statusClass === 'status-recent' ? '#f39c12' : '#a0aec0');
  const badgeDotClass = onlineStatus.isOnline ? 'pulse-green' : (onlineStatus.statusClass === 'status-recent' ? 'pulse-amber' : '');
  
  const recentlyActiveBadge = `
    <div class="badge-active" style="margin-top: 10px; display: inline-flex; align-items: center; gap: 5px;">
      <span class="${badgeDotClass}" style="background-color: ${badgeDotColor}; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
      ${onlineStatus.formattedText}
    </div>
  `;
  
  // Rajput Circular Wax Seal Verification Badge
  const verifiedBadge = profile.isVerified ? `
    <div class="wax-seal-container" title="Lineage, Gotra & Family Verified">
      <div class="wax-seal-badge">
        <svg viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      </div>
      <span class="wax-seal-label">Lineage Verified</span>
    </div>
  ` : '';

  const aiScoreBadge = isIncomingPending ? 
    `<div class="ai-score-badge" style="background: rgba(39, 174, 96, 0.9); color: #FFFFFF; border: 1.5px solid #2ECC71; font-weight: bold;">👑 Interest Received</div>` : 
    `<div class="ai-score-badge">✨ ${profile.aiScore || 92}% Match</div>`;

  // Privacy-first photo state (blurred/locked for non-logged-in homepage visitors)
  const isPhotoLocked = !isLoggedIn && !isDashboard;

  let imageAreaHtml = `
    <div class="jharokha-frame-container" onclick="openProfileDetailModal('${profile.id}')" style="cursor: pointer;">
      <!-- Clipped frame block containing either profile image or locked blur, with velvet gradient background -->
      <div class="jharokha-frame" style="background: ${getAvatarGradient(profile.clan)}; width: 100%; height: 100%;">
        ${isPhotoLocked ? `
          <div class="photo-locked-container" style="width: 100%; height: 100%; background: transparent;">
            ${profile.img ? `<img src="${profile.img}" class="photo-locked-img" alt="Locked Match" />` : `<div class="profile-avatar-placeholder photo-locked-img" style="font-size: 3rem; display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-white);">${profile.initials}</div>`}
            <div class="photo-locked-overlay" style="background: rgba(74, 13, 24, 0.4); clip-path: none;">
              <div class="photo-locked-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </div>
              <div class="photo-locked-title">Photo Locked</div>
              <div class="photo-locked-desc">Requires Mutual Connect</div>
            </div>
          </div>
        ` : `
          ${profile.img ? `<img src="${profile.img}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="${profile.name}" />` : `<div class="profile-avatar-placeholder" style="font-size: 3rem; display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-white);">${profile.initials}</div>`}
        `}
      </div>
      
      <!-- Jharokha absolute border outline SVG -->
      <svg class="jharokha-border" viewBox="0 0 100 125" preserveAspectRatio="none">
        <path d="M 50,2 C 65,14 85,17 90,32 C 95,47 98,57 98,98 L 2,98 C 2,57 5,47 10,32 C 15,17 35,14 50,2 Z" fill="none" stroke="var(--gold-antique)" stroke-width="2" />
      </svg>
 
      <span class="profile-gender-badge ${profile.gender === 'Groom' ? 'badge-groom' : 'badge-bride'}">${profile.gender}</span>
      ${aiScoreBadge}
      <div class="profile-details-preview">
        <h4>${isPhotoLocked ? (profile.name.split(' ')[0] + ' ' + (profile.name.split(' ')[1] ? profile.name.split(' ')[1][0] + '.' : '')) : profile.name}</h4>
        <span class="profile-caste-tag">${profile.clan} Clan • ${profile.age} Yrs</span>
      </div>
    </div>
  `;

  let interestBtnHtml = '';
  if (isAccepted) {
    interestBtnHtml = `
      <button onclick="openOneOnOneChat('${profile.id}')" class="btn btn-royal" style="font-size: 0.8rem; background: var(--gold-gradient); color: var(--primary-color); border: none; font-weight: bold; padding: 10px 14px;">
        Chat Now 💬
      </button>
    `;
  } else if (isIncomingPending) {
    interestBtnHtml = `
      <button onclick="handleAcceptInterest('${profile.id}')" class="btn btn-royal" style="font-size: 0.8rem; background: #27ae60; border-color: #27ae60; color: #FFFFFF;" title="Accept Match Interest">
        Accept 👑
      </button>
    `;
  } else if (hasSentInterest) {
    interestBtnHtml = `
      <button class="btn btn-royal" style="font-size: 0.8rem; opacity: 0.75; pointer-events: none;" disabled>
        Pending ⏳
      </button>
    `;
  } else {
    interestBtnHtml = `
      <button onclick="handleSendInterest('${profile.id}')" class="btn btn-royal" style="font-size: 0.8rem;">
        Send Interest
      </button>
    `;
  }

  return `
    <div class="profile-card" data-id="${profile.id}">
      ${imageAreaHtml}
      
      <div class="profile-card-body" style="padding-bottom: 15px; cursor: pointer;" onclick="openProfileDetailModal('${profile.id}')">
        <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px;">
          ${recentlyActiveBadge}
          ${verifiedBadge}
        </div>
        
        <div class="profile-meta-list">
          <div class="profile-meta-item">
            <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            <span>${profile.location.split(',')[0]}</span>
          </div>
          <div class="profile-meta-item">
            <svg viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>
            <span>${profile.occupation.split(',')[0].substring(0, 15)}...</span>
          </div>
          <div class="profile-meta-item" style="grid-column: span 2;">
            <strong style="color: var(--primary-color); font-size: 0.75rem; text-transform: uppercase; font-family: var(--font-eyebrow);">Gotra:</strong>
            <span style="font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${profile.gotra}</span>
          </div>
        </div>
      </div>

      ${isDashboard ? `
        <div class="profile-card-footer">
          <button onclick="handleShortlist('${profile.id}')" class="btn btn-minimal" style="padding: 10px;" title="Shortlist Match">
            ${isShortlisted ? '❤️' : '🤍'}
          </button>
          ${interestBtnHtml}
          <button onclick="openProfileDetailModal('${profile.id}')" class="btn btn-primary" style="font-size: 0.8rem;">
            Details
          </button>
        </div>
      ` : `
        <div class="profile-card-footer">
          <a href="login.html" class="btn btn-royal" style="width: 100%; font-size: 0.8rem;">Connect with ${profile.gender === 'Groom' ? 'Banna' : 'Ladi'}</a>
        </div>
      `}
    </div>
  `;
}

function updateDashboardStats() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const shortlists = JSON.parse(localStorage.getItem('shortlisted')) || [];
  
  if (!currentUser) return;
  const mySentInterests = getProfileInterests(currentUser);
  const profiles = getAllProfiles();

  const shortCount = document.getElementById('statShortlistedCount');
  if (shortCount) shortCount.textContent = shortlists.length;

  const intCount = document.getElementById('statInterestsCount');
  if (intCount) intCount.textContent = Object.keys(mySentInterests).length;

  // Sync new dashboard activity summary grid elements
  const actShort = document.getElementById('dashboardActivityShortlists');
  if (actShort) actShort.textContent = shortlists.length;

  const actInt = document.getElementById('dashboardActivityInterests');
  if (actInt) actInt.textContent = Object.keys(mySentInterests).length;

  const actChats = document.getElementById('dashboardActivityChats');
  if (actChats) {
    const acceptedCount = profiles.filter(p => areProfilesConnected(currentUser, p)).length;
    actChats.textContent = acceptedCount;
  }
}

// Shortlisting handler
window.handleShortlist = function(id) {
  let shortlists = JSON.parse(localStorage.getItem('shortlisted')) || [];
  const isIncluded = shortlists.includes(id);

  if (isIncluded) {
    shortlists = shortlists.filter(x => x !== id);
    showToast('Match removed from shortlist');
  } else {
    shortlists.push(id);
    showToast('Match added to shortlist ❤️', 'gold');
  }

  localStorage.setItem('shortlisted', JSON.stringify(shortlists));
  updateDashboardStats();
  renderMatchesGrid();
};

// Interest Sender handler
window.handleSendInterest = async function(id) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    showToast('Please log in to send interest');
    return;
  }

  const mySentInterests = getProfileInterests(currentUser);
  if (mySentInterests[id] === 'accepted') {
    showToast('You are already connected with this noble profile!');
    return;
  }
  if (mySentInterests[id] === 'sent') {
    showToast('Match interest already sent. Awaiting acceptance.');
    return;
  }

  // 1. Mark as 'sent' in currentUser's local interests mapping (PENDING, NOT accepted yet!)
  mySentInterests[id] = 'sent';
  currentUser.about = setProfileInterestsInAbout(currentUser.about, mySentInterests);
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  // Also update this user in LocalStorage 'users' list
  let localUsersList = JSON.parse(localStorage.getItem('users')) || [];
  const uIdx = localUsersList.findIndex(u => u.id === currentUser.id || u.email === currentUser.email);
  if (uIdx !== -1) {
    localUsersList[uIdx].about = currentUser.about;
    localStorage.setItem('users', JSON.stringify(localUsersList));
  }

  // Update in-memory firestoreUsers cache
  if (window.firestoreUsers && Array.isArray(window.firestoreUsers)) {
    const idx = window.firestoreUsers.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) window.firestoreUsers[idx].about = currentUser.about;
  }

  // Find target profile name
  const profiles = getAllProfiles();
  const targetProfile = profiles.find(p => p.id === id);
  const profileName = targetProfile ? targetProfile.name : 'Match';
  
  // Real toast: Contact details unlock ONLY once accepted!
  showToast(`Royal Match Interest sent to ${profileName}! Contact details will be unlocked upon acceptance.`, 'gold');

  // Notify admin
  notifyAdminInterestSent(currentUser, targetProfile);

  // Save notification to sender and queue for recipient
  let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  notifications.unshift({
    id: Date.now() + Math.random(),
    recipientId: currentUser.id,
    type: 'interest_sent',
    message: `You sent a Match Interest to ${profileName}. Awaiting their response.`,
    profileId: id,
    timestamp: 'Just now',
    read: false
  });
  notifications.unshift({
    id: Date.now() + Math.random() + 1,
    notifKey: `interest_from_${currentUser.id}_to_${id}`,
    recipientId: id,
    type: 'interest_request',
    senderId: currentUser.id,
    senderName: currentUser.name,
    message: `${currentUser.name} (${currentUser.clan || 'Rajput'} Clan, ${currentUser.age || '25'} Yrs) sent you a Royal Match Interest! Review profile to accept or decline.`,
    profileId: currentUser.id,
    timestamp: 'Just now',
    read: false,
    status: 'pending'
  });
  localStorage.setItem('notifications', JSON.stringify(notifications));

  if (typeof renderNotifications === 'function') {
    renderNotifications();
  }

  // Sync updated about field to Supabase profiles database row for currentUser
  if (window.supabaseActive && window.supabaseClient) {
    try {
      const { error } = await window.supabaseClient
        .from('profiles')
        .update({ about: currentUser.about })
        .eq('id', currentUser.id);
        
      if (error) {
        console.error("Error syncing sent interest to Supabase:", error);
      }
    } catch (e) {
      console.warn("Supabase interest sync error:", e);
    }
  }

  if (typeof updateDashboardStats === 'function') updateDashboardStats();
  if (typeof renderMatchesGrid === 'function') renderMatchesGrid();

  // If detailed modal is open for this profile, refresh modal to update lock box to "Pending"
  const modal = document.getElementById('profileDetailModal');
  if (modal && modal.classList.contains('active')) {
    openProfileDetailModal(id);
  }
};

// Real-time Accept Interest Handler
window.handleAcceptInterest = async function(senderId) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    showToast('Please log in to accept interest');
    return;
  }

  const profiles = getAllProfiles();
  const senderProfile = profiles.find(p => p.id === senderId);
  const senderName = senderProfile ? senderProfile.name : 'Noble Member';

  // 1. Mark as 'accepted' in currentUser's local interests mapping
  const myInterests = getProfileInterests(currentUser);
  myInterests[senderId] = 'accepted';
  currentUser.about = setProfileInterestsInAbout(currentUser.about, myInterests);
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  // Update in-memory firestoreUsers cache
  if (window.firestoreUsers && Array.isArray(window.firestoreUsers)) {
    const idx = window.firestoreUsers.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) window.firestoreUsers[idx].about = currentUser.about;
  }

  // 2. Dismiss floating banner alert if visible
  dismissInterestAlert(senderId);

  // 3. Update notifications
  let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  notifications = notifications.map(n => {
    if (n.profileId === senderId || n.senderId === senderId) {
      return {
        ...n,
        read: true,
        status: 'accepted',
        type: 'interest_accepted',
        message: `You accepted match interest from ${senderName}! Contact details and chat are now unlocked.`
      };
    }
    return n;
  });
  localStorage.setItem('notifications', JSON.stringify(notifications));
  if (typeof renderNotifications === 'function') {
    renderNotifications();
  }

  // 4. Sync acceptance to Supabase profiles database
  if (window.supabaseActive && window.supabaseClient) {
    try {
      await window.supabaseClient
        .from('profiles')
        .update({ about: currentUser.about })
        .eq('id', currentUser.id);
    } catch (e) {
      console.warn("Supabase accept sync error:", e);
    }
  }

  // 5. Celebratory toast
  showToast(`Khammaghani! You accepted ${senderName}'s Match Interest. Phone, email, and chat are now unlocked!`, 'gold');

  // 6. Refresh UI components
  if (typeof updateDashboardStats === 'function') updateDashboardStats();
  if (typeof renderMatchesGrid === 'function') renderMatchesGrid();

  // If detailed modal is open for this profile, refresh modal immediately to show decrypted contact info!
  const modal = document.getElementById('profileDetailModal');
  if (modal && modal.classList.contains('active')) {
    openProfileDetailModal(senderId);
  }
};

// Real-time Decline Interest Handler
window.handleDeclineInterest = async function(senderId) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) return;

  const profiles = getAllProfiles();
  const senderProfile = profiles.find(p => p.id === senderId);
  const senderName = senderProfile ? senderProfile.name : 'Member';

  // 1. Mark as 'declined' in currentUser's local interests mapping
  const myInterests = getProfileInterests(currentUser);
  myInterests[senderId] = 'declined';
  currentUser.about = setProfileInterestsInAbout(currentUser.about, myInterests);
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  // Update in-memory firestoreUsers cache
  if (window.firestoreUsers && Array.isArray(window.firestoreUsers)) {
    const idx = window.firestoreUsers.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) window.firestoreUsers[idx].about = currentUser.about;
  }

  // 2. Dismiss floating banner alert
  dismissInterestAlert(senderId);

  // 3. Update notifications
  let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  notifications = notifications.map(n => {
    if (n.profileId === senderId || n.senderId === senderId) {
      return {
        ...n,
        read: true,
        status: 'declined',
        type: 'interest_declined',
        message: `Match interest from ${senderName} was declined.`
      };
    }
    return n;
  });
  localStorage.setItem('notifications', JSON.stringify(notifications));
  if (typeof renderNotifications === 'function') {
    renderNotifications();
  }

  // 4. Sync decline to Supabase profiles database
  if (window.supabaseActive && window.supabaseClient) {
    try {
      await window.supabaseClient
        .from('profiles')
        .update({ about: currentUser.about })
        .eq('id', currentUser.id);
    } catch (e) {
      console.warn("Supabase decline sync error:", e);
    }
  }

  showToast(`Match interest from ${senderName} declined.`);

  if (typeof updateDashboardStats === 'function') updateDashboardStats();
  if (typeof renderMatchesGrid === 'function') renderMatchesGrid();

  // If detailed modal is open for this profile, refresh modal
  const modal = document.getElementById('profileDetailModal');
  if (modal && modal.classList.contains('active')) {
    openProfileDetailModal(senderId);
  }
};

// Real-time floating alert banner renderer
window.showFloatingInterestAlert = function(p) {
  if (document.getElementById(`royalInterestAlert_${p.id}`)) return;

  const container = document.createElement('div');
  container.id = `royalInterestAlert_${p.id}`;
  container.className = 'royal-interest-alert-banner';

  const existingAlerts = document.querySelectorAll('.royal-interest-alert-banner');
  if (existingAlerts.length > 0) {
    const topOffset = 24 + (existingAlerts.length * 190);
    container.style.top = `${topOffset}px`;
  }
  
  let avatarHtml = '';
  if (p.profilePic && !p.profilePic.startsWith('mock_')) {
    avatarHtml = `<img src="${p.profilePic}" alt="${p.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
  } else if (p.img) {
    avatarHtml = `<img src="${p.img}" alt="${p.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
  } else {
    const initials = p.initials || (p.name ? p.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'NM');
    avatarHtml = `<span style="color:var(--gold-bright); font-weight:bold; font-size:1.1rem;">${initials}</span>`;
  }

  const locationCity = p.location ? p.location.split(',')[0].trim() : 'Rajasthan';

  container.innerHTML = `
    <div class="royal-alert-header">
      <div class="royal-alert-badge">👑 Royal Match Interest</div>
      <button class="royal-alert-close" onclick="dismissInterestAlert('${p.id}')" title="Dismiss for now">&times;</button>
    </div>
    <div class="royal-alert-body">
      <div class="royal-alert-avatar" style="background: ${getAvatarGradient(p.clan)}">
        ${avatarHtml}
      </div>
      <div class="royal-alert-info">
        <div class="royal-alert-name">${p.name}</div>
        <div class="royal-alert-sub">${p.clan || 'Rajput'} • ${p.age || '25'} Yrs • ${locationCity}</div>
        <div class="royal-alert-msg">Has expressed royal match interest with your profile. Review their noble background before accepting.</div>
        <div class="royal-alert-privacy-note">🔒 Contact details (Phone & Email) protected until accepted</div>
      </div>
    </div>
    <div class="royal-alert-actions">
      <button type="button" class="btn btn-outline btn-alert-action" onclick="openProfileDetailModal('${p.id}')">
        👁️ View Profile
      </button>
      <button type="button" class="btn btn-royal btn-alert-action" style="background: #27ae60; border-color: #27ae60;" onclick="handleAcceptInterest('${p.id}')">
        👑 Accept
      </button>
      <button type="button" class="btn btn-minimal btn-alert-action btn-alert-decline" onclick="handleDeclineInterest('${p.id}')">
        ✕ Decline
      </button>
    </div>
  `;

  document.body.appendChild(container);
};

window.dismissInterestAlert = function(id) {
  const el = document.getElementById(`royalInterestAlert_${id}`);
  if (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-15px)';
    setTimeout(() => el.remove(), 300);
  }
  sessionStorage.setItem(`dismissed_alert_${id}`, 'true');
};

// Global interest watcher that polls across all pages
window.initGlobalInterestWatcher = function() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) return;

  // Run immediately on page load
  checkIncomingInterests();

  // Poll Supabase & check incoming interests every 7 seconds
  setInterval(async () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    if (window.supabaseActive && window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient.from('profiles').select('*');
        if (!error && data) {
          window.firestoreUsers = data;
          if (typeof renderMatchesGrid === 'function') renderMatchesGrid();
          if (typeof populateOnlineSidebar === 'function') populateOnlineSidebar(user);
        }
      } catch (e) {}
    }

    checkIncomingInterests();
  }, 7000);
};

// One-on-One chat window overlay handlers
// Dynamic database fallback helpers for decentralized peer-to-peer chatting
function getProfileChats(profile) {
  let chats = {};
  if (profile && profile.about) {
    const chatsRegex = /\[Chats: ([^\n\r]*)\]/;
    const match = profile.about.match(chatsRegex);
    if (match) {
      try {
        chats = JSON.parse(match[1].trim());
      } catch (e) {
        console.error("Failed to parse chats JSON from profile about:", e);
      }
    }
  }
  return chats;
}

function setProfileChatsInAbout(aboutText, chatsObj) {
  let cleanAbout = aboutText || '';
  cleanAbout = cleanAbout.replace(/\[Chats: [^\n\r]*\]/g, '').trim();
  return (cleanAbout + `\n[Chats: ${JSON.stringify(chatsObj)}]`).trim();
}

function getCombinedConversation(profileA, profileB) {
  const chatsA = getProfileChats(profileA);
  const chatsB = getProfileChats(profileB);
  
  const listA = chatsA[profileB.id] || [];
  const listB = chatsB[profileA.id] || [];
  
  const combined = [...listA, ...listB];
  
  const unique = [];
  const seen = new Set();
  for (const msg of combined) {
    const key = `${msg.s}_${msg.t}_${msg.time}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(msg);
    }
  }
  
  return unique.sort((a, b) => a.time - b.time);
}

let chatPollingInterval = null;

function renderConversation(messagesContainer, conversation, profile) {
  if (conversation.length === 0) {
    messagesContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 20px; width: 100%;">
        This is the beginning of your connection with ${profile.name}.
      </div>
    `;
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  messagesContainer.innerHTML = conversation.map(msg => {
    const isMe = msg.s === currentUser.id;
    return `
      <div class="message ${isMe ? 'user-message' : 'bot-message'}" style="margin-bottom: 10px; align-self: ${isMe ? 'flex-end' : 'flex-start'};">
        <div class="message-bubble" style="padding: 8px 12px; border-radius: 12px; max-width: 80%; word-break: break-word; background-color: ${isMe ? 'var(--primary-color)' : '#EDF2F7'}; color: ${isMe ? 'var(--text-white)' : '#2D3748'};">
          ${msg.t}
        </div>
      </div>
    `;
  }).join('');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

window.openOneOnOneChat = function(profileId) {
  // Close any existing chatbot window first
  const chatbotWindow = document.getElementById('royalChatbotWindow');
  if (chatbotWindow) chatbotWindow.classList.remove('active');

  const profiles = getAllProfiles();
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return;

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    showToast('Please log in to chat with matches');
    return;
  }

  // Notify admin on Telegram about chat open
  notifyAdminChatOpened(currentUser, profile);

  // Check if chat container already exists
  let chatBox = document.getElementById('oneOnOneChatWindow');
  if (!chatBox) {
    chatBox = document.createElement('div');
    chatBox.id = 'oneOnOneChatWindow';
    chatBox.className = 'royal-chatbot-window'; 
    chatBox.style.background = '#FFFFFF';
    chatBox.style.zIndex = '99999';
    document.body.appendChild(chatBox);
  }

  // Create avatar HTML
  let avatarHtml = '';
  if (profile.profilePic && !profile.profilePic.startsWith('mock_')) {
    avatarHtml = `<img src="${profile.profilePic}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`;
  } else if (profile.img) {
    avatarHtml = `<img src="${profile.img}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`;
  } else {
    avatarHtml = `<div class="profile-avatar-placeholder" style="font-size: 1.1rem; color: var(--text-white); font-weight: bold; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">${profile.initials}</div>`;
  }

  // Setup the layout
  chatBox.innerHTML = `
    <div class="chat-header">
      <div class="header-avatar" style="background: ${getAvatarGradient(profile.clan)}; display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:50%; border: 1.5px solid var(--gold-antique); overflow:hidden;">
        ${avatarHtml}
      </div>
      <div class="header-info">
        <h3>${profile.name}</h3>
        <span class="header-status">Online</span>
      </div>
      <button onclick="closeOneOnOneChat()" class="btn-close-chat" aria-label="Close Chat">×</button>
    </div>
    
    <div id="oneOnOneMessages" class="chat-messages" style="height: 280px; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 10px;">
      <!-- Conversation loaded dynamically -->
    </div>

    <div class="chat-input-area" style="padding: 10px; display: flex; gap: 8px; border-top: 1px solid rgba(170,124,17,0.15); background-color: var(--bg-dark);">
      <input type="text" id="oneOnOneInput" placeholder="Write to ${profile.name.split(' ')[0]}..." style="flex: 1; padding: 8px 12px; border-radius: 4px; border: 1px solid rgba(170,124,17,0.3); background-color: var(--bg-card); color: var(--text-dark); font-size: 0.85rem;" onkeypress="handleOneOnOneKeyPress(event, '${profileId}')">
      <button onclick="sendOneOnOneMessage('${profileId}')" class="btn btn-royal" style="padding: 8px 15px; font-size: 0.8rem;" aria-label="Send Message">
        Send
      </button>
    </div>
  `;

  // Render conversation initially
  const messagesContainer = document.getElementById('oneOnOneMessages');
  const conversation = getCombinedConversation(currentUser, profile);
  renderConversation(messagesContainer, conversation, profile);

  // Open the window
  chatBox.classList.add('active');
  
  // Focus input
  const inputEl = document.getElementById('oneOnOneInput');
  if (inputEl) inputEl.focus();

  // Start polling for new messages from this candidate every 4 seconds
  if (chatPollingInterval) clearInterval(chatPollingInterval);
  chatPollingInterval = setInterval(async () => {
    if (!chatBox.classList.contains('active')) {
      clearInterval(chatPollingInterval);
      return;
    }
    
    if (window.supabaseActive) {
      const { data: latestPartner, error } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();
        
      if (!error && latestPartner) {
        const latestUser = JSON.parse(localStorage.getItem('currentUser'));
        const updatedConv = getCombinedConversation(latestUser, latestPartner);
        renderConversation(messagesContainer, updatedConv, latestPartner);
      }
    }
  }, 4000);
};

window.closeOneOnOneChat = function() {
  const chatBox = document.getElementById('oneOnOneChatWindow');
  if (chatBox) chatBox.classList.remove('active');
  if (chatPollingInterval) {
    clearInterval(chatPollingInterval);
    chatPollingInterval = null;
  }
};

window.handleOneOnOneKeyPress = function(e, profileId) {
  if (e.key === 'Enter') {
    sendOneOnOneMessage(profileId);
  }
};

window.sendOneOnOneMessage = async function(profileId) {
  const inputEl = document.getElementById('oneOnOneInput');
  if (!inputEl) return;
  const text = inputEl.value.trim();
  if (!text) return;

  const messagesContainer = document.getElementById('oneOnOneMessages');
  if (!messagesContainer) return;

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) return;

  const profiles = getAllProfiles();
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return;

  // Append new message to sender's own local conversation
  const userChats = getProfileChats(currentUser);
  const conversation = userChats[profileId] || [];
  
  const newMsg = {
    s: currentUser.id,
    t: text,
    time: Date.now()
  };
  conversation.push(newMsg);
  
  userChats[profileId] = conversation;
  currentUser.about = setProfileChatsInAbout(currentUser.about, userChats);
  
  // Save updated sender profile to local cache
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  
  // Render immediately
  const combined = getCombinedConversation(currentUser, profile);
  renderConversation(messagesContainer, combined, profile);
  
  // Clear input
  inputEl.value = '';

  // Synchronize to Supabase profiles database row for currentUser
  if (window.supabaseActive) {
    const { error } = await window.supabaseClient
      .from('profiles')
      .update({ about: currentUser.about })
      .eq('id', currentUser.id);
      
    if (error) {
      console.error("Error syncing sent message to Supabase:", error);
    }
  }
};

// ==========================================
// 5. PROFILE DETAIL MODAL HANDLER
function getProfileSocials(profile) {
  let instagram = profile.instagram || '';
  let facebook = profile.facebook || '';
  
  if (profile.about) {
    const socialRegex = /\[Social Links: ([^\]]*)\]/;
    const match = profile.about.match(socialRegex);
    if (match) {
      try {
        const socialObj = JSON.parse(match[1].trim());
        if (!instagram) instagram = socialObj.instagram || '';
        if (!facebook) facebook = socialObj.facebook || '';
      } catch (e) {
        console.error("Failed to parse serialized socials in app.js:", e);
      }
    }
  }
  return { instagram, facebook };
}

function getProfileBiodata(profile) {
  let biodataUrl = profile.biodataUrl || '';
  
  if (profile.about) {
    const biodataRegex = /\[Biodata Link: ([^\]]*)\]/;
    const match = profile.about.match(biodataRegex);
    if (match) {
      biodataUrl = match[1].trim();
    }
  }
  return biodataUrl;
}

window.closeProfileDetailModal = function() {
  const modal = document.getElementById('profileDetailModal');
  if (modal) {
    modal.classList.remove('active');
  }
};

window.ensureProfileDetailModalExists = function() {
  if (document.getElementById('profileDetailModal')) return;

  const modal = document.createElement('div');
  modal.className = 'profile-modal';
  modal.id = 'profileDetailModal';
  modal.innerHTML = `
    <div class="modal-content" id="modalCard" style="max-height: 90vh; overflow-y: auto;">
      <button class="modal-close-btn" onclick="closeProfileDetailModal()" aria-label="Close detailed profile">&times;</button>
      
      <!-- Edit Profile Action Button (Only visible on user's own profile) -->
      <button type="button" class="btn btn-royal" id="modalEditProfileBtn" onclick="if (typeof toggleEditProfileForm === 'function') toggleEditProfileForm(true)" style="position: absolute; top: 20px; right: 80px; font-size: 0.8rem; padding: 10px 18px; display: none; z-index: 10;">Edit Profile</button>
      
      <!-- Dynamic Read-Only Profile View Container -->
      <div id="modalViewContainer">
        <!-- Hero Header inside Modal -->
        <div class="modal-hero">
          <div class="modal-photo-area" id="modalInitials">
            <!-- Populated Dynamically -->
          </div>
          
          <div class="modal-header-info">
            <div class="modal-headline">
              <h2 id="modalName">Name Placeholder</h2>
              <span class="modal-caste-badge" id="modalCaste">Clan</span>
            </div>
            <p class="modal-subline" id="modalSubline">Age • Height • Location</p>
            
            <div class="modal-quick-stats" style="grid-template-columns: repeat(4, 1fr);">
              <div class="modal-stat-box">
                <label>Income Index</label>
                <span id="statIncome">Income</span>
              </div>
              <div class="modal-stat-box">
                <label>Zodiac / Rashi</label>
                <span id="statRashi">Rashi</span>
              </div>
              <div class="modal-stat-box">
                <label>Horoscope Check</label>
                <span id="statManglik">Manglik</span>
              </div>
              <div class="modal-stat-box" style="background: rgba(201, 162, 39, 0.08); border-color: rgba(201, 162, 39, 0.35);">
                <label style="color: var(--gold-bright); font-weight: bold;">Match Score</label>
                <span id="statAiMatch" style="color: var(--gold-bright); font-weight: bold;">96%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Inner Subnav Tabs -->
        <div class="modal-tabs" style="display: flex; border-bottom: 1.5px solid rgba(170, 124, 17, 0.2); padding: 0 40px; gap: 25px;">
          <button class="modal-tab-btn active" id="modalBtnDetailedProfile" onclick="switchModalTab('detailed')">Detailed Profile</button>
          <button class="modal-tab-btn" id="modalBtnPartnerPreferences" onclick="switchModalTab('preferences')">Partner Preferences</button>
        </div>

        <!-- Modal Body Details -->
        <div class="modal-body" style="padding: 30px 40px;">
          
          <!-- Tab 1: Detailed Profile View -->
          <div id="modalTabDetailedProfile" class="modal-tab-pane">
            
            <!-- About Section -->
            <div style="margin-bottom: 25px;">
              <h3 class="modal-section-title">Royal Persona</h3>
              <p class="modal-bio" id="modalBio">Biography details will be shown here...</p>
            </div>

            <!-- Ancestral Lineage & Cultural Details -->
            <div style="margin-bottom: 25px;">
              <h3 class="modal-section-title">Heritage & Lineage Info</h3>
              <div class="details-grid">
                <div class="detail-item"><label>Religion</label><span id="detailReligion">Religion</span></div>
                <div class="detail-item"><label>Caste / Clan</label><span id="detailCaste">Caste</span></div>
                <div class="detail-item"><label>Date of Birth</label><span id="detailDOB">DOB</span></div>
                <div class="detail-item"><label>Place of Birth</label><span id="detailPOB">POB</span></div>
                <div class="detail-item"><label>Father's Gotra</label><span id="detailGotra">Gotra</span></div>
                <div class="detail-item"><label>Ancestral Native</label><span id="detailNative">Native</span></div>
                <div class="detail-item"><label>Professional Degree</label><span id="detailEducation">Education</span></div>
                <div class="detail-item"><label>Current Profession</label><span id="detailOccupation">Occupation</span></div>
                <div class="detail-item"><label>Astro Nakshatra</label><span id="detailNakshatra">Nakshatra</span></div>
                <div class="detail-item"><label>Ancestral Values</label><span id="detailFamilyType">Family Background</span></div>
              </div>
            </div>

            <!-- Family Background Summary -->
            <div style="margin-bottom: 25px;">
              <h3 class="modal-section-title">Family & Lineage Background</h3>
              <p class="modal-bio" id="modalFamily">Family descriptions...</p>
            </div>

            <!-- Expectations -->
            <div style="margin-bottom: 25px;">
              <h3 class="modal-section-title">Alignment Expectations</h3>
              <p class="modal-bio" id="modalExpectations">Lineage preferences and expectations...</p>
            </div>

            <!-- Dynamic Unlock Contact Details Section -->
            <div>
              <h3 class="modal-section-title">Regal Connection Desk</h3>
              
              <div class="unlock-box" id="modalUnlockBox"></div>

              <div class="unlocked-details" id="modalUnlockedDetails">
                <div class="details-grid" style="background-color: rgba(170, 124, 17, 0.05); padding: 25px; border-radius: var(--border-radius); border: 1.5px solid var(--gold-antique);">
                  <div class="detail-item">
                    <label>Direct Phone Line</label>
                    <span id="unlockedPhone" style="color: var(--gold-bright); font-weight: 700;">+91 ••••• ••••• (Locked)</span>
                  </div>
                  <div class="detail-item">
                    <label>Regal Email Desk</label>
                    <span id="unlockedEmail" style="color: var(--gold-bright); font-weight: 700;">••••••••@•••••.com (Locked)</span>
                  </div>
                  <div class="detail-item" style="grid-column: span 2; border-bottom: none; padding-top: 10px;">
                    <label>Ancestral Residence</label>
                    <span id="unlockedAddress" style="font-weight: 700;">Ancestral Residence Protected</span>
                  </div>
                  <div class="detail-item" id="unlockedSocialsItem" style="grid-column: span 2; border-top: 1px solid rgba(170, 124, 17, 0.15); padding-top: 12px; display: none;">
                    <label>Social Accounts</label>
                    <div id="unlockedSocials" style="display: flex; gap: 20px; align-items: center; margin-top: 8px;"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 2: Partner Preferences Side-by-Side View -->
          <div id="modalTabPartnerPreferences" class="modal-tab-pane" style="display: none;">
            <div class="pref-compatibility-header" style="display: flex; align-items: center; justify-content: center; gap: 10px; background-color: var(--gold-light); border: 1px solid var(--gold-antique); padding: 12px; border-radius: var(--border-radius); margin-bottom: 25px;">
              <span style="font-size: 1.5rem;">👑</span>
              <strong style="color: var(--primary-color); font-size: 0.95rem;" id="prefCompatibilitySummaryText">Partner Preferences Compatibility</strong>
            </div>

            <div style="margin-bottom: 20px; display: flex; justify-content: space-between; font-weight: bold; font-family: var(--font-royal); font-size: 0.85rem; padding: 0 10px; color: var(--gold-bright); letter-spacing: 0.5px;">
              <span style="width: 160px;">Preference Rule</span>
              <span style="flex-grow: 1; min-width: 0; padding-left: 15px;">Requirement</span>
              <span style="flex-grow: 1; min-width: 0; padding-left: 15px;">Your Value</span>
              <span style="width: 60px; text-align: center;">Matches?</span>
            </div>

            <div class="pref-comparison-table" style="display: flex; flex-direction: column; gap: 12px;" id="prefComparisonTable"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  document.body.appendChild(modal);
};

// Global escape key listener to dismiss detailed modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeProfileDetailModal();
  }
});

window.openProfileDetailModal = function(id) {
  ensureProfileDetailModalExists();
  const modal = document.getElementById('profileDetailModal');
  if (!modal) return;

  const profiles = getAllProfiles();
  const profile = profiles.find(p => p.id === id);
  if (!profile) return;

  // Toggle Edit Profile button visibility based on whether they are viewing their own profile
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const editBtn = document.getElementById('modalEditProfileBtn');
  if (editBtn) {
    if (currentUser && currentUser.id === id) {
      editBtn.style.display = 'block';
    } else {
      editBtn.style.display = 'none';
    }
  }

  // Reset tab states to show "Detailed Profile" active by default
  switchModalTab('detailed');

  // Build dynamic content for detailed modal view inside a gorgeous Jharokha window frame
  document.getElementById('modalInitials').innerHTML = `
    <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
      <!-- Clipped frame block containing either the img or initials -->
      <div class="jharokha-frame" style="background: ${getAvatarGradient(profile.clan)}; width: 100%; height: 100%;">
        ${profile.img ? `<img src="${profile.img}" onclick="window.viewFullImage('${profile.img}')" style="width: 100%; height: 100%; object-fit: cover; display: block; cursor: zoom-in;" title="Click to view full image" alt="${profile.name}" />` : `<div class="profile-avatar-placeholder" style="font-size: 7rem; display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-white);">${profile.initials}</div>`}
      </div>
      
      <!-- Jharokha absolute border outline SVG overlay -->
      <svg class="jharokha-border" viewBox="0 0 100 125" preserveAspectRatio="none" style="z-index: 10; padding: 20px; pointer-events: none;">
        <path d="M 50,2 C 65,14 85,17 90,32 C 95,47 98,57 98,98 L 2,98 C 2,57 5,47 10,32 C 15,17 35,14 50,2 Z" fill="none" stroke="var(--gold-antique)" stroke-width="2" />
      </svg>
    </div>
  `;
  document.getElementById('modalName').textContent = profile.name;
  document.getElementById('modalCaste').textContent = `${profile.clan} Clan`;
  const modalStatus = getProfileOnlineStatus(profile);
  const modalBadgeColor = modalStatus.isOnline ? '#2ecc71' : (modalStatus.statusClass === 'status-recent' ? '#f39c12' : '#718096');
  const modalBadgeBg = modalStatus.isOnline ? 'rgba(46,204,113,0.15)' : (modalStatus.statusClass === 'status-recent' ? 'rgba(243,156,18,0.15)' : 'rgba(160,174,192,0.15)');
  const modalDotClass = modalStatus.isOnline ? 'pulse-green' : (modalStatus.statusClass === 'status-recent' ? 'pulse-amber' : '');
  
  document.getElementById('modalSubline').innerHTML = `
    ${profile.age} Yrs • ${profile.height} • ${profile.location.split(',')[0]}
    <span style="margin-left: 10px; display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; background: ${modalBadgeBg}; color: ${modalBadgeColor}; padding: 2px 8px; border-radius: 20px; font-weight: 600;">
      <span class="${modalDotClass}" style="background-color: ${modalBadgeColor}; width: 6px; height: 6px; border-radius: 50%; display: inline-block;"></span>
      ${modalStatus.formattedText}
    </span>
  `;
  
  // Stat boxes
  document.getElementById('statIncome').textContent = profile.income;
  document.getElementById('statRashi').textContent = profile.rashi ? profile.rashi.split(' (')[0] : 'Kanya';
  document.getElementById('statManglik').textContent = profile.manglik || 'Non-Manglik';
  
  // Bind AI affinity compatibility matching score inside modal stat box
  document.getElementById('statAiMatch').textContent = `${profile.aiScore || 92}% Match`;

  // Details
  document.getElementById('detailReligion').textContent = profile.religion || 'Hindu';
  document.getElementById('detailCaste').textContent = profile.clan || 'Rajput';
  document.getElementById('detailDOB').textContent = profile.dob || '1998-06-15';
  document.getElementById('detailPOB').textContent = profile.pob || profile.native || 'Udaipur, Rajasthan';
  document.getElementById('detailGotra').textContent = profile.gotra;
  document.getElementById('detailNative').textContent = profile.native;
  document.getElementById('detailEducation').textContent = profile.education;
  document.getElementById('detailOccupation').textContent = profile.occupation;
  document.getElementById('detailNakshatra').textContent = profile.nakshatra || 'Rohini';
  document.getElementById('detailFamilyType').textContent = `${profile.familyType || 'Traditional'} Values`;
  
  // Custom summaries
  let cleanBio = profile.about || '';
  if (cleanBio) {
    cleanBio = cleanBio.replace(/\[Social Links: [^\]]*\]/g, '').trim();
    cleanBio = cleanBio.replace(/\[Biodata Link: [^\]]*\]/g, '').trim();
    cleanBio = cleanBio.replace(/\[Interests: [^\]]*\]/g, '').trim();
    cleanBio = cleanBio.replace(/\[Chats: [^\n\r]*\]/g, '').trim();
    cleanBio = cleanBio.replace(/\[Last Seen: [^\]]*\]/g, '').trim();
  }
  document.getElementById('modalBio').textContent = cleanBio;
  document.getElementById('modalFamily').textContent = profile.familyDetails || 'Descent from a highly respected Rajput family in Rajasthan preserving traditional gotra and ancestral parameters.';
  document.getElementById('modalExpectations').textContent = profile.expectations || 'Seeking a well-educated partner from a noble Rajput family who values heritage, gotra compatibility, and lineage preservation.';

  // Build the Partner Preferences side-by-side comparison tables dynamically
  renderPartnerPreferencesComparison(profile);

  const unlockBox = document.getElementById('modalUnlockBox');
  const unlockedDetails = document.getElementById('modalUnlockedDetails');
  const socialsItem = document.getElementById('unlockedSocialsItem');

  const isOwnProfile = currentUser && currentUser.id === id;
  const isConnected = currentUser && typeof areProfilesConnected === 'function' && areProfilesConnected(currentUser, profile);

  if (isOwnProfile || isConnected) {
    if (unlockBox) {
      unlockBox.style.display = 'none';
      unlockBox.innerHTML = '';
    }
    if (unlockedDetails) unlockedDetails.classList.add('active');
    
    // Decrypt details directly
    document.getElementById('unlockedPhone').textContent = profile.phone || 'Not Specified';
    document.getElementById('unlockedEmail').textContent = profile.email || 'Not Specified';
    document.getElementById('unlockedAddress').textContent = profile.location ? `${profile.location}, India` : 'Rajasthan, India';
    
    const socials = getProfileSocials(profile);
    const biodataUrl = getProfileBiodata(profile);
    const socialsContainer = document.getElementById('unlockedSocials');
    
    if (socialsItem && socialsContainer) {
      if (socials.instagram || socials.facebook || biodataUrl) {
        socialsItem.style.display = 'block';
        const labelEl = socialsItem.querySelector('label');
        if (labelEl) {
          labelEl.textContent = (socials.instagram || socials.facebook) ? 'Socials & Documents' : 'Ancestral Documents';
        }
        
        let html = '';
        if (socials.instagram) {
          let url = socials.instagram;
          if (!url.startsWith('http')) {
            url = 'https://instagram.com/' + url.replace('@', '').trim();
          }
          html += `
            <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: var(--gold-bright); display: flex; align-items: center; gap: 8px; font-weight: 600; text-decoration: none; font-size: 0.85rem; background: rgba(255,255,255,0.06); padding: 6px 12px; border-radius: 4px; border: 1px solid rgba(170,124,17,0.25);">
              Instagram
            </a>
          `;
        }
        if (socials.facebook) {
          let url = socials.facebook;
          if (!url.startsWith('http')) {
            url = 'https://facebook.com/' + url.trim();
          }
          html += `
            <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: var(--gold-bright); display: flex; align-items: center; gap: 8px; font-weight: 600; text-decoration: none; font-size: 0.85rem; background: rgba(255,255,255,0.06); padding: 6px 12px; border-radius: 4px; border: 1px solid rgba(170,124,17,0.25);">
              Facebook
            </a>
          `;
        }
        if (biodataUrl) {
          html += `
            <button onclick="viewProfilePdf('${biodataUrl}', '${profile.name}')" class="btn btn-royal" style="color: var(--gold-bright); display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.85rem; background: rgba(255,255,255,0.06); padding: 6px 12px; border-radius: 4px; border: 1px solid rgba(170,124,17,0.25); cursor: pointer;">
              View Biodata (PDF)
            </button>
          `;
        }
        socialsContainer.innerHTML = html;
      } else {
        socialsItem.style.display = 'none';
      }
    }
  } else {
    // Strictly protect contact details before mutual acceptance
    if (unlockedDetails) unlockedDetails.classList.remove('active');
    if (socialsItem) socialsItem.style.display = 'none';

    // Mask phone, email, and address in DOM so inspection never leaks personal info
    const phoneEl = document.getElementById('unlockedPhone');
    if (phoneEl) phoneEl.textContent = '+91 ••••• ••••• (Locked)';
    const emailEl = document.getElementById('unlockedEmail');
    if (emailEl) emailEl.textContent = '••••••••@•••••.com (Locked)';
    const addrEl = document.getElementById('unlockedAddress');
    if (addrEl) addrEl.textContent = 'Ancestral Residence Protected';

    if (unlockBox) {
      unlockBox.style.display = 'block';

      if (!currentUser) {
        unlockBox.innerHTML = `
          <div style="text-align: center; padding: 20px 15px;">
            <div style="font-size: 1.6rem; margin-bottom: 6px;">🔒</div>
            <h4 style="color: var(--gold-bright); font-family: var(--font-royal); margin-bottom: 6px; font-size: 1.05rem;">Heritage Privacy Protected</h4>
            <p style="color: var(--text-muted); font-size: 0.84rem; max-width: 480px; margin: 0 auto 14px; line-height: 1.45;">
              Direct contact details (mobile phone and email) are strictly confidential. Log in to your royal account to express interest and connect.
            </p>
            <a href="login.html" class="btn btn-royal" style="display: inline-block; padding: 8px 22px; font-size: 0.84rem; font-weight: 600;">
              Login to Connect
            </a>
          </div>
        `;
      } else {
        const myInterests = getProfileInterests(currentUser);
        const theirInterests = getProfileInterests(profile);
        const isIncomingPending = theirInterests[currentUser.id] === 'sent' && myInterests[profile.id] !== 'accepted' && myInterests[profile.id] !== 'declined';
        const isOutgoingPending = myInterests[profile.id] === 'sent';

        if (isIncomingPending) {
          unlockBox.innerHTML = `
            <div style="text-align: center; padding: 18px 20px; background: rgba(39, 174, 96, 0.08); border: 1.5px solid rgba(39, 174, 96, 0.35); border-radius: 8px;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 1.3rem;">👑</span>
                <h4 style="color: #2ecc71; font-family: var(--font-royal); margin: 0; font-size: 1.05rem;">Match Interest Received!</h4>
              </div>
              <p style="color: var(--text-white); font-size: 0.84rem; max-width: 500px; margin: 0 auto 10px; line-height: 1.45;">
                <strong>${profile.name}</strong> has expressed noble match interest with your profile. Review their pedigree and background above.
              </p>
              <div style="font-size: 0.76rem; color: var(--gold-bright); margin-bottom: 12px;">
                🔒 Mobile number, email, and direct chat will unlock immediately upon acceptance.
              </div>
              <div style="display: flex; gap: 10px; justify-content: center; align-items: center; flex-wrap: wrap;">
                <button type="button" class="btn btn-royal" onclick="handleAcceptInterest('${profile.id}')" style="background: #27ae60; border-color: #27ae60; font-weight: 700; padding: 9px 22px; font-size: 0.85rem;">
                  👑 Accept Interest & Unlock Contact
                </button>
                <button type="button" class="btn btn-minimal" onclick="handleDeclineInterest('${profile.id}')" style="color: #fc8181; padding: 9px 18px; font-size: 0.85rem; border: 1px solid rgba(252, 129, 129, 0.35);">
                  ✕ Decline
                </button>
              </div>
            </div>
          `;
        } else if (isOutgoingPending) {
          unlockBox.innerHTML = `
            <div style="text-align: center; padding: 18px 20px; background: rgba(201, 162, 39, 0.08); border: 1.5px solid rgba(201, 162, 39, 0.3); border-radius: 8px;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 1.3rem;">⏳</span>
                <h4 style="color: var(--gold-bright); font-family: var(--font-royal); margin: 0; font-size: 1.05rem;">Match Interest Sent — Awaiting Response</h4>
              </div>
              <p style="color: var(--text-muted); font-size: 0.84rem; max-width: 500px; margin: 0 auto 10px; line-height: 1.45;">
                You have expressed match interest in connecting with <strong>${profile.name}</strong>. In compliance with privacy standards, their phone number and email will be securely revealed as soon as they accept your request.
              </p>
              <button type="button" class="btn btn-minimal" disabled style="opacity: 0.75; cursor: default; font-size: 0.82rem; padding: 8px 18px; border: 1px solid rgba(170,124,17,0.3);">
                ⏳ Awaiting Acceptance...
              </button>
            </div>
          `;
        } else {
          unlockBox.innerHTML = `
            <div style="text-align: center; padding: 18px 20px; background: rgba(0, 0, 0, 0.25); border: 1.5px solid rgba(170, 124, 17, 0.3); border-radius: 8px;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 1.3rem;">🔒</span>
                <h4 style="color: var(--gold-bright); font-family: var(--font-royal); margin: 0; font-size: 1.05rem;">Lineage Privacy Protected</h4>
              </div>
              <p style="color: var(--text-muted); font-size: 0.84rem; max-width: 500px; margin: 0 auto 12px; line-height: 1.45;">
                Contact information (mobile phone, email, and direct chat) is confidential and protected until mutual match interest is accepted.
              </p>
              <button type="button" class="btn btn-royal" onclick="handleSendInterest('${profile.id}')" style="padding: 9px 24px; font-size: 0.85rem; font-weight: 700;">
                👑 Send Royal Interest to Connect
              </button>
            </div>
          `;
        }
      }
    }
  }

  // Open modal
  modal.classList.add('active');
};

// Dynamic Scroll Reveal observer
function initScrollReveal() {
  // Elements that we want to slide up when scrolled into view
  const revealTargets = document.querySelectorAll(
    '.clans-grid, .trust-grid, .success-stories-grid, .pricing-grid, .caste-card, .trust-card, .success-card, .pricing-card, .cta-content, .about-heritage-preview'
  );
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
          observer.unobserve(entry.target); // Trigger only once
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    revealTargets.forEach(target => {
      target.classList.add('reveal-hidden');
      observer.observe(target);
    });
  } else {
    // Fallback if browser doesn't support IntersectionObserver
    revealTargets.forEach(target => {
      target.style.opacity = '1';
      target.style.transform = 'none';
    });
  }
}

// ----------------------------------------------------
// DYNAMIC 3-COLUMN DASHBOARD HELPERS
// ----------------------------------------------------

// Populate left profile card with current logged-in user data
function populateLeftUserCard(user) {
  const avatar = document.getElementById('userCardAvatar');
  const name = document.getElementById('userCardName');
  const idEl = document.getElementById('userCardId');
  const membership = document.getElementById('userCardMembership');
  const clan = document.getElementById('userCardClan');
  const gotra = document.getElementById('userCardGotra');
  const thikana = document.getElementById('userCardThikana');

  if (name) name.textContent = user.name || 'Noble Member';
  if (idEl) {
    const rawId = user.id || 'SRS100';
    idEl.textContent = 'SRS-' + (rawId.includes('-') ? rawId.split('-')[0].substring(0, 6).toUpperCase() : rawId.substring(0, 6).toUpperCase());
  }
  if (membership) membership.textContent = (user.tier || 'Starter') + ' Plan';
  if (clan) clan.textContent = user.clan || 'Rathore';
  if (gotra) gotra.textContent = user.gotra || 'Sandila';
  if (thikana) thikana.textContent = user.thikana || 'Jodhpur';

  if (avatar) {
    const resolvedUrl = resolveProfileImageUrl(user.profilePic);
    if (resolvedUrl && !user.profilePic.startsWith('mock_')) {
      avatar.innerHTML = `<img src="${resolvedUrl}" class="user-card-avatar-img" alt="Avatar" />`;
    } else {
      // Fallback to initials
      const initials = (user.name || 'N M').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      avatar.textContent = initials;
      avatar.style.background = getAvatarGradient(user.clan || 'Rathore');
    }
  }
}

// Populate right-side sidebar with real active & recently active matches of opposite gender
function populateOnlineSidebar(currentUser) {
  const onlineList = document.getElementById('onlineMatchesList');
  if (!onlineList) return;

  const allProfiles = getAllProfiles();
  // Filter for opposite gender matches
  const oppositeGender = getOppositeGender(currentUser.gender);
  const matches = allProfiles.filter(p => normalizeGender(p.gender) === oppositeGender && p.id !== currentUser.id);

  // Compute real status for each match
  const matchesWithStatus = matches.map(p => ({
    profile: p,
    status: getProfileOnlineStatus(p)
  }));

  // Sort candidates by real activity:
  // 1. Members currently "Online now" come first
  // 2. Members with real recent activity come next (ordered by latest timestamp descending)
  // 3. Members without recorded activity come last
  matchesWithStatus.sort((a, b) => {
    if (a.status.isOnline !== b.status.isOnline) {
      return a.status.isOnline ? -1 : 1;
    }
    return b.status.timestamp - a.status.timestamp;
  });

  // Update header count and active indicator dot
  const onlineCount = matchesWithStatus.filter(m => m.status.isOnline).length;
  const headerDot = document.querySelector('.online-sidebar-header .online-indicator-dot');
  if (headerDot) {
    if (onlineCount > 0) {
      headerDot.classList.remove('offline');
      headerDot.title = `${onlineCount} member${onlineCount === 1 ? '' : 's'} online now`;
    } else {
      headerDot.classList.add('offline');
      headerDot.title = 'No members currently online';
    }
  }

  // Display top 6 candidates
  const selected = matchesWithStatus.slice(0, 6);

  if (selected.length === 0) {
    onlineList.innerHTML = `<div style="padding: 16px; text-align: center; color: #718096; font-size: 0.85rem;">No matching members found.</div>`;
    return;
  }

  onlineList.innerHTML = selected.map(({ profile: p, status }) => {
    let avatarHtml = '';
    if (p.profilePic && !p.profilePic.startsWith('mock_')) {
      avatarHtml = `<img src="${p.profilePic}" alt="${p.name}" />`;
    } else if (p.img) {
      avatarHtml = `<img src="${p.img}" alt="${p.name}" />`;
    } else {
      avatarHtml = p.initials || (p.name ? p.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'NM');
    }

    const locationCity = p.location ? p.location.split(',')[0].trim() : 'Rajasthan';

    return `
      <div class="online-match-item" onclick="openProfileDetailModal('${p.id}')">
        <div class="online-match-avatar ${status.statusClass}" style="background: ${getAvatarGradient(p.clan)}">
          ${avatarHtml}
        </div>
        <div class="online-match-info">
          <div class="online-match-name">${p.name}</div>
          <div class="online-match-meta">${p.clan || 'Rajput'} • ${p.age || '24'} Yrs • ${locationCity}</div>
          <div class="online-match-status ${status.statusClass}">
            <span class="status-dot-mini ${status.statusClass}"></span>
            <span>${status.formattedText}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Open logged-in user profile preview in detailed modal
window.openUserProfilePreview = function() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) return;

  const mockProfile = {
    id: currentUser.id,
    name: currentUser.name,
    clan: currentUser.clan,
    gender: currentUser.gender,
    age: currentUser.dob ? (new Date().getFullYear() - new Date(currentUser.dob).getFullYear()) : 24,
    height: currentUser.height || '5 ft 8 in',
    location: currentUser.thikana || 'Jodhpur, Rajasthan',
    gotra: currentUser.gotra || 'Sandila',
    motherGotra: currentUser.motherGotra || 'Khangarot',
    thikana: currentUser.thikana || 'Jodhpur',
    phone: currentUser.phone || 'Contact locked',
    income: currentUser.income || '10 LPA',
    education: currentUser.education || 'B.Tech / MBA',
    occupation: currentUser.occupation || 'Engineer',
    maritalStatus: currentUser.maritalStatus || 'Never Married',
    bio: currentUser.about || 'A noble member of Shree Rajput Sagai Sambandh preserving ancestral values.',
    img: currentUser.profilePic,
    initials: currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
    aiScore: 100,
    isVerified: true
  };

  const modal = document.getElementById('profileDetailModal');
  if (!modal) return;

  // Populate basic modal fields
  document.getElementById('modalName').textContent = mockProfile.name;
  document.getElementById('modalCaste').textContent = mockProfile.clan + ' Clan';
  document.getElementById('modalSubline').textContent = `${mockProfile.age} Yrs • ${mockProfile.height} • ${mockProfile.location}`;
  document.getElementById('statIncome').textContent = mockProfile.income;
  document.getElementById('statRashi').textContent = 'Kanya (Virgo)';
  document.getElementById('statManglik').textContent = 'Non-Manglik';
  document.getElementById('statAiMatch').textContent = 'Your Profile';
  document.getElementById('modalBio').textContent = mockProfile.bio;

  // Populate detailed items
  document.getElementById('detailReligion').textContent = 'Hindu (Rajput)';
  document.getElementById('detailCaste').textContent = mockProfile.clan;
  document.getElementById('detailGotra').textContent = mockProfile.gotra;
  document.getElementById('detailMotherGotra').textContent = mockProfile.motherGotra;
  document.getElementById('detailThikana').textContent = mockProfile.thikana;
  document.getElementById('detailPhone').textContent = mockProfile.phone;
  document.getElementById('detailEducation').textContent = mockProfile.education;
  document.getElementById('detailOccupation').textContent = mockProfile.occupation;

  // Avatar Initials
  const modalInitials = document.getElementById('modalInitials');
  if (modalInitials) {
    if (mockProfile.img && !mockProfile.img.startsWith('mock_')) {
      modalInitials.innerHTML = `<img src="${mockProfile.img}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" alt="My Avatar" />`;
    } else {
      modalInitials.innerHTML = `<div class="profile-avatar-placeholder" style="font-size: 3rem; display: flex; align-items: center; justify-content: center; height: 100%; width:100%; background: ${getAvatarGradient(mockProfile.clan)}; color: var(--text-white); border-radius: 8px;">${mockProfile.initials}</div>`;
    }
  }

  // Open the modal
  // Open the modal
  modal.classList.add('active');
};

// Switch tabs inside Detailed Profile Modal
window.switchModalTab = function(tabName) {
  const tabDetailed = document.getElementById('modalTabDetailedProfile');
  const tabPref = document.getElementById('modalTabPartnerPreferences');
  const btnDetailed = document.getElementById('modalBtnDetailedProfile');
  const btnPref = document.getElementById('modalBtnPartnerPreferences');

  if (tabName === 'detailed') {
    if (tabDetailed) tabDetailed.style.display = 'block';
    if (tabPref) tabPref.style.display = 'none';
    if (btnDetailed) btnDetailed.classList.add('active');
    if (btnPref) btnPref.classList.remove('active');
  } else if (tabName === 'preferences') {
    if (tabDetailed) tabDetailed.style.display = 'none';
    if (tabPref) tabPref.style.display = 'block';
    if (btnDetailed) btnDetailed.classList.remove('active');
    if (btnPref) btnPref.classList.add('active');
  }
};

// Render side-by-side partner preference checklist inside profile modal
function renderPartnerPreferencesComparison(candidate) {
  const container = document.getElementById('prefComparisonTable');
  const summaryText = document.getElementById('prefCompatibilitySummaryText');
  if (!container) return;

  const currentUserRaw = localStorage.getItem('currentUser');
  const user = currentUserRaw ? JSON.parse(currentUserRaw) : {
    name: 'Noble Member',
    gender: 'Groom',
    clan: 'Rathore',
    gotra: 'Sandila',
    thikana: 'Jodhpur',
    dob: '2001-12-19',
    height: '5 ft 8 in',
    maritalStatus: 'Never Married',
    income: '10 LPA'
  };

  // Extract user age
  let userAge = 25;
  if (user.dob) {
    userAge = new Date().getFullYear() - new Date(user.dob).getFullYear();
  }

  // Define candidate preference parameters
  const prefMinAge = candidate.prefMinAge || 21;
  const prefMaxAge = candidate.prefMaxAge || 29;
  const prefCaste = candidate.prefCaste || 'Any Rajput Clan';
  const prefLocation = candidate.prefLocation || 'Rajasthan / Delhi-NCR';

  // Build check rules list
  const rules = [
    {
      label: 'Preferred Age',
      expected: `${prefMinAge} to ${prefMaxAge} Yrs`,
      userVal: `${userAge} Yrs`,
      isMatch: userAge >= prefMinAge && userAge <= prefMaxAge
    },
    {
      label: 'Preferred Height',
      expected: `5' 2" (157cm) to 6' 1" (185cm)`,
      userVal: user.height || '5 ft 8 in',
      isMatch: true // Standard match for demo
    },
    {
      label: 'Marital Status',
      expected: 'Never Married',
      userVal: user.maritalStatus || 'Never Married',
      isMatch: (user.maritalStatus || 'Never Married') === 'Never Married'
    },
    {
      label: 'Religion',
      expected: 'Hindu (Rajput)',
      userVal: 'Hindu (Rajput)',
      isMatch: true
    },
    {
      label: 'Clan / Caste',
      expected: prefCaste,
      userVal: `${user.clan} Clan`,
      isMatch: prefCaste === 'Any' || prefCaste === 'Any Rajput Clan' || prefCaste.toLowerCase().includes(user.clan.toLowerCase())
    },
    {
      label: 'Gotra Compatibility',
      expected: `Must NOT match: ${candidate.gotra}`,
      userVal: user.gotra || 'Sandila',
      isMatch: (user.gotra || 'Sandila').toLowerCase() !== (candidate.gotra || '').toLowerCase() // Prohibit Sagotra union
    },
    {
      label: 'Native Location',
      expected: prefLocation,
      userVal: user.thikana || 'Rajasthan',
      isMatch: true
    },
    {
      label: 'Annual Income',
      expected: 'INR 5 Lakhs to 30 Lakhs',
      userVal: user.income || '10 LPA',
      isMatch: true
    }
  ];

  // Count total matches
  const matchCount = rules.filter(r => r.isMatch).length;
  if (summaryText) {
    summaryText.textContent = `You match ${matchCount}/${rules.length} of her partner preferences`;
  }

  // Render rows
  container.innerHTML = rules.map(rule => {
    return `
      <div class="pref-comparison-row ${rule.isMatch ? 'matched' : 'mismatched'}">
        <div class="pref-label-col">${rule.label}</div>
        <div class="pref-expect-col">${rule.expected}</div>
        <div class="pref-user-col">${rule.userVal}</div>
        <div class="pref-status-col">
          <span class="${rule.isMatch ? 'pref-status-matched' : 'pref-status-mismatched'}">
            ${rule.isMatch ? '✓' : '⚠️'}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------
// PROFILE EDIT & AVATAR UPLOAD CONTROLLERS
// ----------------------------------------------------

// Handle avatar image selection and base64 caching/preview
window.handleEditAvatarChange = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 3 * 1024 * 1024) {
    showToast('Image file size must be less than 3MB!', 'gold');
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('editAvatarPreview');
    if (preview) {
      preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;" alt="Preview" />`;
    }
    window.tempAvatarData = e.target.result; // cache base64 for local preview fallback
    window.tempAvatarFile = file; // cache raw file for Supabase Storage uploads
  };
  reader.readAsDataURL(file);
};

// Global variables for edit modal biodata upload state
window.tempEditBiodataData = null;
window.tempEditBiodataFile = null;

// Handle edit profile biodata PDF attachment selection
window.handleEditBiodataPdfChange = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.type !== 'application/pdf') {
    showToast('Please select a valid PDF file.', 'gold');
    event.target.value = '';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('File size exceeds the 5MB limit.', 'gold');
    event.target.value = '';
    return;
  }

  const container = document.getElementById('editBiodataUploadContainer');
  const status = document.getElementById('editBiodataUploadStatus');
  if (status) {
    status.innerHTML = `
      <div style="font-size: 1.2rem; margin-bottom: 5px;">⏳</div>
      <div style="font-size: 0.9rem; color: var(--text-white); font-weight: 500;">Reading PDF...</div>
    `;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    window.tempEditBiodataData = e.target.result; // base64 cached
    window.tempEditBiodataFile = file; // raw file cached
    
    if (status) {
      status.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold-bright)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 10px; display: inline-block;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <div style="font-size: 0.9rem; font-weight: bold; color: var(--gold-bright); margin-bottom: 5px;">📄 ${file.name}</div>
        <div style="font-size: 0.75rem; color: #a2f2b7;">✓ Attached successfully (${(file.size / 1024 / 1024).toFixed(2)} MB)</div>
      `;
    }
    if (container) {
      container.style.borderColor = 'var(--gold-bright)';
      container.style.backgroundColor = 'rgba(43,138,62,0.04)';
    }
  };
  reader.onerror = function() {
    showToast('Failed to read PDF file.');
    if (status) {
      status.innerHTML = `
        <div style="font-size: 0.9rem; color: var(--text-white); font-weight: 500;">Error loading file. Click to retry.</div>
      `;
    }
  };
  reader.readAsDataURL(file);
};

// Toggle detailed modal into Edit Profile Form view
window.toggleEditProfileForm = function(show) {
  const viewContainer = document.getElementById('modalViewContainer');
  const editContainer = document.getElementById('modalEditContainer');
  const editBtn = document.getElementById('modalEditProfileBtn');

  if (show) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    // Toggle containers
    if (viewContainer) viewContainer.style.display = 'none';
    if (editContainer) editContainer.style.display = 'block';
    if (editBtn) editBtn.style.display = 'none';

    // Clear previous caches
    window.tempAvatarData = null;
    window.tempAvatarFile = null;
    window.tempEditBiodataData = null;
    window.tempEditBiodataFile = null;
    const picInput = document.getElementById('editProfilePicInput');
    if (picInput) picInput.value = '';
    const biodataInput = document.getElementById('editBiodataPdf');
    if (biodataInput) biodataInput.value = '';

    // Populate input fields
    document.getElementById('editName').value = currentUser.name || '';
    document.getElementById('editPhone').value = currentUser.phone || '';
    document.getElementById('editClan').value = currentUser.clan || 'Rathore';
    document.getElementById('editGotra').value = currentUser.gotra || '';
    document.getElementById('editMotherGotra').value = currentUser.motherGotra || '';
    document.getElementById('editThikana').value = currentUser.thikana || '';
    document.getElementById('editDOB').value = currentUser.dob || '1998-06-15';
    document.getElementById('editHeight').value = currentUser.height || '5 ft 8 in';
    document.getElementById('editEducation').value = currentUser.education || '';
    document.getElementById('editOccupation').value = currentUser.occupation || '';
    document.getElementById('editIncome').value = currentUser.income || '';
    document.getElementById('editMaritalStatus').value = currentUser.maritalStatus || 'Never Married';
    
    // Parse about block to strip fallback serialized data before rendering
    let cleanAboutText = currentUser.about || '';
    if (cleanAboutText) {
      const socialRegex = /\[Social Links: ([^\]]*)\]/;
      cleanAboutText = cleanAboutText.replace(socialRegex, '').trim();
      const biodataRegex = /\[Biodata Link: ([^\]]*)\]/;
      cleanAboutText = cleanAboutText.replace(biodataRegex, '').trim();
    }
    document.getElementById('editAbout').value = cleanAboutText;
    document.getElementById('editExpectations').value = currentUser.expectations || '';

    // Render avatar preview
    const preview = document.getElementById('editAvatarPreview');
    if (preview) {
      if (currentUser.profilePic && !currentUser.profilePic.startsWith('mock_')) {
        preview.innerHTML = `<img src="${currentUser.profilePic}" style="width: 100%; height: 100%; object-fit: cover;" alt="Avatar" />`;
      } else {
        const initials = (currentUser.name || 'N M').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        preview.textContent = initials;
        preview.style.background = getAvatarGradient(currentUser.clan || 'Rathore');
      }
    }

    // Render biodata attachment preview status if existing PDF is found
    const existingBiodataUrl = getProfileBiodata(currentUser);
    const biodataStatus = document.getElementById('editBiodataUploadStatus');
    const biodataContainer = document.getElementById('editBiodataUploadContainer');
    if (existingBiodataUrl && biodataStatus) {
      biodataStatus.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold-bright)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 10px; display: inline-block;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <div style="font-size: 0.9rem; font-weight: bold; color: var(--gold-bright); margin-bottom: 5px;">📄 Ancestral Biodata Attached</div>
        <div style="font-size: 0.8rem; margin-top: 5px; margin-bottom: 5px;">
          <a href="${existingBiodataUrl}" target="_blank" style="color: var(--text-white); text-decoration: underline; font-weight: 500;" onclick="event.stopPropagation();">Click here to View Uploaded PDF</a>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">Drag & Drop new PDF or click box to replace it</div>
      `;
      if (biodataContainer) {
        biodataContainer.style.borderColor = 'var(--gold-bright)';
      }
    } else if (biodataStatus) {
      // Reset back to upload prompt
      biodataStatus.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold-antique)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 10px; display: inline-block;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="12" y1="18" x2="12" y2="12"></line>
          <polyline points="9 15 12 12 15 15"></polyline>
        </svg>
        <div style="font-size: 0.9rem; font-weight: 500; color: var(--text-white); margin-bottom: 5px;">Drag & Drop Biodata PDF here or Click to browse</div>
        <div style="font-size: 0.75rem; color: var(--gold-bright);">PDF format only, max 5MB</div>
      `;
      if (biodataContainer) {
        biodataContainer.style.borderColor = 'rgba(201, 162, 39, 0.4)';
        biodataContainer.style.backgroundColor = 'rgba(255,255,255,0.02)';
      }
    }
  } else {
    // Return to default detailed view container
    if (viewContainer) viewContainer.style.display = 'block';
    if (editContainer) editContainer.style.display = 'none';
    if (editBtn) editBtn.style.display = 'block';
  }
};

// Handle submission of the profile editing form
window.handleProfileUpdateSubmit = async function(event) {
  event.preventDefault();

  const saveBtn = document.getElementById('saveProfileChangesBtn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Preserving Lineage...';
  }

  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    let profilePicUrl = currentUser.profilePic || '';

    // 1. Upload avatar portrait image file to Supabase Storage bucket
    if (window.tempAvatarFile && window.supabaseActive) {
      try {
        const file = window.tempAvatarFile;
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; // Upload directly under root of bucket

        const { data, error } = await window.supabaseClient.storage
          .from('profiles')
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (error) throw error;

        // Retrieve public URL
        const { data: { publicUrl } } = window.supabaseClient.storage
          .from('profiles')
          .getPublicUrl(filePath);

        profilePicUrl = publicUrl;
      } catch (err) {
        console.error("Avatar storage upload failed, fall back to base64 representation:", err);
        if (window.tempAvatarData) {
          profilePicUrl = window.tempAvatarData;
        }
      }
    } else if (window.tempAvatarData) {
      // Fallback base64 representation if offline
      profilePicUrl = window.tempAvatarData;
    }

    let biodataPdfUrl = getProfileBiodata(currentUser);

    // 1.5. Upload biodata PDF to Supabase Storage if active
    if (window.tempEditBiodataFile && window.supabaseActive) {
      try {
        const file = window.tempEditBiodataFile;
        const fileExt = 'pdf';
        const fileName = `${currentUser.id}_biodata_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; // Upload directly under root of bucket

        const { data, error } = await window.supabaseClient.storage
          .from('profiles')
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (error) throw error;

        // Retrieve public URL
        const { data: { publicUrl } } = window.supabaseClient.storage
          .from('profiles')
          .getPublicUrl(filePath);

        biodataPdfUrl = publicUrl;
      } catch (err) {
        console.error("Biodata Storage upload failed, fall back to base64 representation:", err);
        if (window.tempEditBiodataData) {
          biodataPdfUrl = window.tempEditBiodataData;
        }
      }
    } else if (window.tempEditBiodataData) {
      biodataPdfUrl = window.tempEditBiodataData;
    }

    // 2. Build updated profile object
    const updatedUser = {
      ...currentUser,
      name: document.getElementById('editName').value.trim(),
      phone: document.getElementById('editPhone').value.trim(),
      clan: document.getElementById('editClan').value,
      gotra: document.getElementById('editGotra').value.trim(),
      motherGotra: document.getElementById('editMotherGotra').value.trim(),
      thikana: document.getElementById('editThikana').value.trim(),
      dob: document.getElementById('editDOB').value,
      height: document.getElementById('editHeight').value.trim(),
      education: document.getElementById('editEducation').value.trim(),
      occupation: document.getElementById('editOccupation').value.trim(),
      income: document.getElementById('editIncome').value.trim(),
      maritalStatus: document.getElementById('editMaritalStatus').value,
      about: document.getElementById('editAbout').value.trim(),
      expectations: document.getElementById('editExpectations').value.trim(),
      biodataUrl: biodataPdfUrl,
      profilePic: profilePicUrl,
      initials: document.getElementById('editName').value.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    };

    // 3. Save updated user object locally to localStorage session
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    // 4. Update profiles table record in Supabase database
    if (window.supabaseActive) {
      const updatePayload = {
        name: updatedUser.name,
        phone: updatedUser.phone,
        clan: updatedUser.clan,
        gotra: updatedUser.gotra,
        motherGotra: updatedUser.motherGotra,
        thikana: updatedUser.thikana,
        dob: updatedUser.dob,
        height: updatedUser.height,
        education: updatedUser.education,
        occupation: updatedUser.occupation,
        income: updatedUser.income,
        maritalStatus: updatedUser.maritalStatus,
        about: updatedUser.about,
        expectations: updatedUser.expectations,
        profilePic: updatedUser.profilePic,
        biodataUrl: updatedUser.biodataUrl
      };

      let { error } = await window.supabaseClient
        .from('profiles')
        .update(updatePayload)
        .eq('id', currentUser.id);

      // Graceful fallback for schema caches: if columns don't exist in Supabase yet
      if (error && error.message && (error.message.includes("Could not find the 'facebook'") || error.message.includes("Could not find the 'instagram'") || error.message.includes("Could not find the 'biodataUrl'"))) {
        console.log("Supabase custom columns missing; serializing into 'about' text column as fallback...");
        delete updatePayload.instagram;
        delete updatePayload.facebook;
        delete updatePayload.biodataUrl;

        // Restore social fields if existing in user object
        const socials = getProfileSocials(updatedUser);
        const socialsObj = { instagram: socials.instagram, facebook: socials.facebook };
        const fallbackAbout = `${updatedUser.about} [Social Links: ${JSON.stringify(socialsObj)}] [Biodata Link: ${updatedUser.biodataUrl}]`.trim();
        updatePayload.about = fallbackAbout;

        const retryResult = await window.supabaseClient
          .from('profiles')
          .update(updatePayload)
          .eq('id', currentUser.id);
        error = retryResult.error;
      }

      if (error) {
        console.error("Supabase profile save error details:", error);
      }
    }

    showToast('Noble Rajput profile updated successfully!', 'gold');

    // Update left panel profile cards instantly
    populateLeftUserCard(updatedUser);

    // Hide edit container and close modal
    toggleEditProfileForm(false);
    const modal = document.getElementById('profileDetailModal');
    if (modal) modal.classList.remove('active');

    // Reload suggestions matching new age/location preferences
    setTimeout(() => {
      window.location.reload();
    }, 500);

  } catch (e) {
    console.error("Profile preservation exception details:", e);
    showToast('Profile preservation failed. Please check inputs.');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Profile Changes';
    }
  }
};

// Royal Notifications List rendering
window.renderNotifications = function() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const listContainer = document.getElementById('notificationList');
  const badge = document.getElementById('navNotificationBadge');
  const bellContainer = document.getElementById('navNotificationBell');
  const countPill = document.getElementById('notifHeaderCountPill');

  if (!currentUser) {
    if (badge) badge.style.display = 'none';
    if (bellContainer) bellContainer.classList.remove('has-unread');
    return;
  }

  // Ensure any previously seeded fake requests are cleaned up
  if (typeof cleanupMockNotifications === 'function') {
    cleanupMockNotifications(currentUser);
  }

  const allNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
  // Scope notifications to current user
  const userNotifications = allNotifications.filter(n => !n.recipientId || n.recipientId === currentUser.id);
  const myInterests = getProfileInterests(currentUser);
  const allProfiles = getAllProfiles();

  // Active pending requests: strictly valid ONLY if sender genuinely sent an interest to currentUser
  const pendingRequests = userNotifications.filter(n => {
    if (n.type !== 'interest_request') return false;
    const targetId = n.senderId || n.profileId;
    if (myInterests[targetId] === 'accepted' || myInterests[targetId] === 'declined') return false;
    const sender = allProfiles.find(p => p.id === targetId);
    if (!sender) return false;
    const sInterests = getProfileInterests(sender);
    return sInterests[currentUser.id] === 'sent';
  });

  // Other unread notifications (likes, shortlists, acceptances)
  const unreadOthers = userNotifications.filter(n => 
    n.type !== 'interest_request' && !n.read
  );

  const totalActiveCount = pendingRequests.length + unreadOthers.length;

  if (badge) {
    if (totalActiveCount > 0) {
      badge.textContent = totalActiveCount > 99 ? '99+' : totalActiveCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  if (bellContainer) {
    if (totalActiveCount > 0) {
      bellContainer.classList.add('has-unread');
    } else {
      bellContainer.classList.remove('has-unread');
    }
  }

  if (countPill) {
    countPill.textContent = `${pendingRequests.length} Pending ${pendingRequests.length === 1 ? 'Request' : 'Requests'}`;
  }

  if (!listContainer) return;

  // Filter valid items for list display
  const displayNotifications = userNotifications.filter(n => {
    if (n.type === 'interest_request') {
      const targetId = n.senderId || n.profileId;
      if (myInterests[targetId] === 'accepted' || myInterests[targetId] === 'declined') return true;
      const sender = allProfiles.find(p => p.id === targetId);
      if (!sender) return false;
      const sInterests = getProfileInterests(sender);
      return sInterests[currentUser.id] === 'sent';
    }
    return true;
  });

  if (displayNotifications.length === 0) {
    listContainer.innerHTML = `
      <div style="padding: 28px 15px; text-align: center; color: var(--text-muted); font-size: 0.85rem; line-height: 1.5;">
        <span style="font-size: 1.6rem; display: block; margin-bottom: 6px;">👑</span>
        No notifications yet.<br>
        <span style="color: var(--gold-bright); font-size: 0.78rem;">Your royal match desk is up to date!</span>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = displayNotifications.map(n => {
    const isInterestReq = n.type === 'interest_request';
    const isPending = isInterestReq && myInterests[n.senderId || n.profileId] !== 'accepted' && myInterests[n.senderId || n.profileId] !== 'declined';
    const targetId = n.profileId || n.senderId;
    const p = allProfiles.find(x => x.id === targetId);

    // Sender avatar
    let avatarHtml = '';
    const clanName = p ? p.clan : 'Rajput';
    const avatarGrad = getAvatarGradient(clanName);

    if (p && p.profilePic && !p.profilePic.startsWith('mock_')) {
      avatarHtml = `<img src="${p.profilePic}" alt="${n.senderName}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
    } else if (p && p.img) {
      avatarHtml = `<img src="${p.img}" alt="${n.senderName}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
    } else {
      const initials = p ? p.initials : (n.senderName ? n.senderName.split(' ').map(x=>x[0]).join('').substring(0,2).toUpperCase() : 'NM');
      avatarHtml = `<span style="color:var(--gold-bright); font-weight:bold; font-size:0.95rem;">${initials}</span>`;
    }

    if (isInterestReq) {
      if (isPending) {
        return `
          <div class="notif-card-item unread interest-item" style="padding: 14px 16px; border-bottom: 1.5px solid rgba(170,124,17,0.22); background: rgba(170,124,17,0.1);">
            <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px;">
              <div style="width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid var(--gold-antique); flex-shrink: 0; overflow: hidden; background: ${avatarGrad}; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                ${avatarHtml}
              </div>
              <div style="flex-grow: 1; min-width: 0;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
                  <strong style="color: var(--gold-bright); font-family: var(--font-royal); font-size: 0.94rem;">${n.senderName}</strong>
                  <span style="color: var(--text-muted); font-size: 0.68rem;">${n.timestamp || 'Just now'}</span>
                </div>
                <div style="font-size: 0.76rem; color: #E2E8F0; margin-bottom: 4px;">
                  ${p ? `${p.clan} Clan • ${p.age} Yrs • ${p.location ? p.location.split(',')[0] : 'Rajasthan'}` : 'Rajput Clan'}
                </div>
                <div style="font-size: 0.78rem; color: #2ecc71; font-weight: 600; margin-bottom: 2px;">
                  👑 Sent you a Royal Match Interest!
                </div>
                <div style="font-size: 0.7rem; color: #CBD5E0;">
                  🔒 Mobile & Email protected until accepted
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
              <button type="button" class="btn btn-outline" style="font-size: 0.75rem; padding: 5px 12px; border-radius: 6px;" onclick="openProfileDetailModal('${targetId}'); const dd=document.getElementById('navNotificationDropdown'); if(dd) dd.style.display='none';">
                👁️ View Profile
              </button>
              <button type="button" class="btn btn-royal" style="font-size: 0.75rem; padding: 5px 14px; border-radius: 6px; background: #27ae60; border-color: #27ae60; color: #FFFFFF;" onclick="handleAcceptInterest('${targetId}');">
                👑 Accept
              </button>
              <button type="button" class="btn btn-minimal" style="font-size: 0.75rem; padding: 5px 10px; color: #FC8181; border: 1px solid rgba(252, 129, 129, 0.35); border-radius: 6px;" onclick="handleDeclineInterest('${targetId}');">
                ✕ Decline
              </button>
            </div>
          </div>
        `;
      } else {
        const isAcc = myInterests[targetId] === 'accepted';
        return `
          <div class="notif-card-item" style="padding: 12px 16px; border-bottom: 1px solid rgba(170,124,17,0.12); opacity: 0.88;">
            <div style="display: flex; gap: 12px; align-items: center;">
              <div style="width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--gold-antique); flex-shrink: 0; overflow: hidden; background: ${avatarGrad}; display: flex; align-items: center; justify-content: center;">
                ${avatarHtml}
              </div>
              <div style="flex-grow: 1; min-width: 0;">
                <div style="color: var(--text-white); font-size: 0.82rem;">
                  <strong style="color: var(--gold-bright);">${n.senderName}</strong>: ${isAcc ? 'You accepted their Royal Match Interest' : 'Match interest was declined'}
                </div>
                <div style="color: var(--text-muted); font-size: 0.68rem; margin-top: 2px;">${n.timestamp}</div>
              </div>
              ${isAcc ? `
                <button type="button" class="btn btn-royal" style="font-size: 0.72rem; padding: 4px 10px; border-radius: 4px;" onclick="openOneOnOneChat('${targetId}'); const dd=document.getElementById('navNotificationDropdown'); if(dd) dd.style.display='none';">
                  💬 Chat
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }
    }

    if (n.type === 'profile_like') {
      return `
        <div class="notif-card-item" style="padding: 12px 16px; border-bottom: 1px solid rgba(170,124,17,0.15);">
          <div style="display: flex; gap: 12px; align-items: center;">
            <div style="width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--gold-antique); flex-shrink: 0; overflow: hidden; background: ${avatarGrad}; display: flex; align-items: center; justify-content: center;">
              ${avatarHtml}
            </div>
            <div style="flex-grow: 1; min-width: 0;">
              <div style="color: var(--text-white); font-size: 0.82rem; line-height: 1.35;">
                <strong style="color: var(--gold-bright);">${n.senderName || 'A noble member'}</strong> shortlisted and liked your royal profile ❤️
              </div>
              <div style="color: var(--text-muted); font-size: 0.68rem; margin-top: 2px;">${n.timestamp}</div>
            </div>
            <button type="button" class="btn btn-outline" style="font-size: 0.72rem; padding: 4px 10px; border-radius: 4px;" onclick="openProfileDetailModal('${targetId}'); const dd=document.getElementById('navNotificationDropdown'); if(dd) dd.style.display='none';">
              👁️ View
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div onclick="handleNotificationClick(${n.id}, '${targetId}')" class="notif-card-item" style="cursor: pointer;">
        <div style="color: var(--text-white); font-size: 0.82rem; line-height: 1.3; margin-bottom: 3px;">${n.message}</div>
        <div style="color: var(--text-muted); font-size: 0.7rem;">${n.timestamp}</div>
      </div>
    `;
  }).join('');
};

window.handleNotificationClick = function(notifId, profileId) {
  // Mark as read
  let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  const notif = notifications.find(n => n.id === notifId);
  notifications = notifications.map(n => n.id === notifId ? { ...n, read: true } : n);
  localStorage.setItem('notifications', JSON.stringify(notifications));
  
  // Render updates
  renderNotifications();

  // Close dropdown
  const dropdown = document.getElementById('navNotificationDropdown');
  if (dropdown) dropdown.style.display = 'none';

  if (!profileId) return;

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const profiles = getAllProfiles();
  const target = profiles.find(p => p.id === profileId);

  if (notif && notif.type === 'interest_request') {
    // Open profile modal so they can review profile before accepting
    openProfileDetailModal(profileId);
  } else if (currentUser && target && areProfilesConnected(currentUser, target)) {
    // If connected, open chat
    openOneOnOneChat(profileId);
  } else {
    openProfileDetailModal(profileId);
  }
};

window.markAllNotificationsAsRead = function(e) {
  if (e) e.stopPropagation();
  let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  notifications = notifications.map(n => ({ ...n, read: true }));
  localStorage.setItem('notifications', JSON.stringify(notifications));
  renderNotifications();
  showToast('All notifications marked as read', 'gold');
};

// Royal Page Entry / Page Navigation Notification Alert Banner
window.showPageEntryNotificationAlert = function(force = false) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) return;

  const now = Date.now();
  if (!force && window._lastPageAlertTime && (now - window._lastPageAlertTime < 3500)) {
    return;
  }
  window._lastPageAlertTime = now;

  const oldBanner = document.getElementById('royalPageAlertBanner');
  if (oldBanner) oldBanner.remove();

  // Ensure mock notifications are purged
  if (typeof cleanupMockNotifications === 'function') {
    cleanupMockNotifications(currentUser);
  }

  let allNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
  const userNotifs = allNotifications.filter(n => !n.recipientId || n.recipientId === currentUser.id);
  const myInterests = getProfileInterests(currentUser);
  const allProfiles = getAllProfiles();
  
  // Real pending requests only
  const pendingRequests = userNotifs.filter(n => {
    if (n.type !== 'interest_request') return false;
    const targetId = n.senderId || n.profileId;
    if (myInterests[targetId] === 'accepted' || myInterests[targetId] === 'declined') return false;
    const sender = allProfiles.find(p => p.id === targetId);
    if (!sender) return false;
    const sInterests = getProfileInterests(sender);
    return sInterests[currentUser.id] === 'sent';
  });
  
  const likesCount = userNotifs.filter(n => n.type === 'profile_like').length;
  const userName = currentUser.name ? currentUser.name.split(' ')[0] : 'Noble Member';

  // Do NOT pop up alert banner if there are NO pending requests and NO likes unless explicitly forced
  if (pendingRequests.length === 0 && likesCount === 0 && !force) {
    return;
  }

  const banner = document.createElement('div');
  banner.id = 'royalPageAlertBanner';
  banner.className = 'royal-page-alert-banner';

  let alertBodyText = '';
  let actionBtn = '';

  if (pendingRequests.length > 0) {
    alertBodyText = `Khammaghani, <strong>${userName}</strong>! You have <strong style="color:var(--gold-bright);">${pendingRequests.length} Royal Match ${pendingRequests.length === 1 ? 'Request' : 'Requests'}</strong> awaiting your response.`;
    if (likesCount > 0) {
      alertBodyText += ` You also have <strong>${likesCount}</strong> profile ${likesCount === 1 ? 'like' : 'likes'}.`;
    }
    actionBtn = `
      <button type="button" class="btn btn-royal" style="font-size: 0.78rem; padding: 6px 14px; background: #27ae60; border-color: #27ae60; font-weight: bold;" onclick="openNotificationDropdownDirectly()">
        🔔 View Requests (${pendingRequests.length})
      </button>
    `;
  } else if (likesCount > 0) {
    alertBodyText = `Khammaghani, <strong>${userName}</strong>! You have <strong>${likesCount}</strong> noble ${likesCount === 1 ? 'member' : 'members'} who shortlisted your royal profile.`;
    actionBtn = `
      <button type="button" class="btn btn-royal" style="font-size: 0.78rem; padding: 6px 14px;" onclick="openNotificationDropdownDirectly()">
        🔔 View Likes
      </button>
    `;
  } else {
    alertBodyText = `Khammaghani, <strong>${userName}</strong>! Your noble profile is active and verified. No pending match requests at this moment.`;
    actionBtn = `
      <button type="button" class="btn btn-royal" style="font-size: 0.78rem; padding: 6px 14px;" onclick="window.location.href='dashboard.html#matchesGrid'; dismissPageAlertBanner();">
        👑 Explore Matches
      </button>
    `;
  }

  banner.innerHTML = `
    <div class="royal-page-alert-header">
      <div class="royal-page-alert-title">
        <span>👑</span>
        <span>Royal Match Update</span>
      </div>
      <button class="royal-page-alert-close" onclick="dismissPageAlertBanner()" title="Dismiss">&times;</button>
    </div>
    <div class="royal-page-alert-body">
      ${alertBodyText}
    </div>
    <div class="royal-page-alert-actions">
      ${actionBtn}
      <button type="button" class="btn btn-minimal" style="font-size: 0.76rem; padding: 6px 10px;" onclick="dismissPageAlertBanner()">
        Dismiss
      </button>
    </div>
  `;

  document.body.appendChild(banner);

  if (window._pageAlertTimer) clearTimeout(window._pageAlertTimer);
  window._pageAlertTimer = setTimeout(() => {
    dismissPageAlertBanner();
  }, 7500);
};

window.dismissPageAlertBanner = function() {
  const banner = document.getElementById('royalPageAlertBanner');
  if (banner) {
    banner.classList.add('hide-anim');
    setTimeout(() => banner.remove(), 350);
  }
};

window.openNotificationDropdownDirectly = function() {
  dismissPageAlertBanner();
  const dropdown = document.getElementById('navNotificationDropdown');
  if (dropdown) {
    dropdown.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.location.href = 'dashboard.html';
  }
};

// Dynamic Modals for Chats Active and Interests Sent Click events
window.openChatsModal = function() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) return;
  const profiles = getAllProfiles();
  const activeMatches = profiles.filter(p => areProfilesConnected(currentUser, p));

  let listHtml = '';
  if (activeMatches.length === 0) {
    listHtml = `
      <div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 0.85rem; line-height: 1.5;">
        No active connections yet. <br>
        <span style="color: var(--gold-bright);">Send interest to compatible matches to unlock direct chats!</span>
      </div>
    `;
  } else {
    listHtml = activeMatches.map(p => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; border-bottom: 1px solid rgba(170,124,17,0.15); background: rgba(255,255,255,0.02); margin-bottom: 8px; border-radius: 4px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid var(--gold-antique); overflow: hidden; background: ${getAvatarGradient(p.clan)}; display: flex; align-items: center; justify-content: center;">
            ${p.img ? `<img src="${p.img}" style="width:100%; height:100%; object-fit:cover;" />` : `<span style="font-size:0.9rem; font-weight:bold; color:#fff;">${p.initials}</span>`}
          </div>
          <div style="text-align: left;">
            <div style="font-weight: bold; color: var(--text-white); font-size: 0.88rem;">${p.name}</div>
            <div style="font-size: 0.72rem; color: var(--gold-bright);">${p.clan} Clan • Gotra: ${p.gotra}</div>
          </div>
        </div>
        <button onclick="closeInterestsOrChatsModal(); openOneOnOneChat('${p.id}')" class="btn btn-royal" style="padding: 6px 12px; font-size: 0.75rem; background: var(--gold-gradient); color: var(--primary-color); border: none; font-weight: bold; border-radius: 4px;">
          Chat Now 💬
        </button>
      </div>
    `).join('');
  }

  showInterestsOrChatsModal('Active Connections (Chats)', listHtml);
};

window.openInterestsModal = function() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) return;
  const mySentInterests = getProfileInterests(currentUser);
  const sentIds = Object.keys(mySentInterests);
  const profiles = getAllProfiles();
  const interestedMatches = profiles.filter(p => sentIds.includes(p.id));

  let listHtml = '';
  if (interestedMatches.length === 0) {
    listHtml = `
      <div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 0.85rem;">
        You have not sent interests to any profiles yet.
      </div>
    `;
  } else {
    listHtml = interestedMatches.map(p => {
      const isAccepted = areProfilesConnected(currentUser, p);
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; border-bottom: 1px solid rgba(170,124,17,0.15); background: rgba(255,255,255,0.02); margin-bottom: 8px; border-radius: 4px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid var(--gold-antique); overflow: hidden; background: ${getAvatarGradient(p.clan)}; display: flex; align-items: center; justify-content: center;">
              ${p.img ? `<img src="${p.img}" style="width:100%; height:100%; object-fit:cover;" />` : `<span style="font-size:0.9rem; font-weight:bold; color:#fff;">${p.initials}</span>`}
            </div>
            <div style="text-align: left;">
              <div style="font-weight: bold; color: var(--text-white); font-size: 0.88rem;">${p.name}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${p.clan} Clan • Gotra: ${p.gotra}</div>
            </div>
          </div>
          <div>
            ${isAccepted ? `
              <button onclick="closeInterestsOrChatsModal(); openOneOnOneChat('${p.id}')" class="btn btn-royal" style="padding: 6px 12px; font-size: 0.75rem; background: var(--gold-gradient); color: var(--primary-color); border: none; font-weight: bold; border-radius: 4px;">
                Chat Now 💬
              </button>
            ` : `
              <span style="font-size: 0.72rem; color: var(--gold-bright); font-weight: 500; background: rgba(170,124,17,0.08); padding: 5px 10px; border-radius: 4px; border: 1px solid rgba(170,124,17,0.2); display: inline-block;">
                Pending Acceptance...
              </span>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  showInterestsOrChatsModal('Interests Sent', listHtml);
};

window.showInterestsOrChatsModal = function(title, contentHtml) {
  let modalOverlay = document.getElementById('interestsChatsModalOverlay');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'interestsChatsModalOverlay';
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    `;
    modalOverlay.onclick = function(e) {
      if (e.target === modalOverlay) closeInterestsOrChatsModal();
    };
    document.body.appendChild(modalOverlay);
  }

  modalOverlay.innerHTML = `
    <div style="background: var(--primary-dark); border: 2.5px solid var(--gold-antique); border-radius: var(--border-radius-lg); width: 90%; max-width: 480px; box-shadow: var(--shadow-royal); overflow: hidden; display: flex; flex-direction: column; max-height: 80vh;">
      <div style="padding: 15px 20px; background: rgba(0,0,0,0.2); border-bottom: 1.5px solid rgba(170,124,17,0.25); display: flex; justify-content: space-between; align-items: center;">
        <h3 style="font-family: var(--font-royal); color: var(--gold-bright); font-size: 1.15rem; margin: 0;">${title}</h3>
        <button onclick="closeInterestsOrChatsModal()" style="background: none; border: none; color: var(--gold-bright); font-size: 1.8rem; cursor: pointer; line-height: 1; padding: 0;">&times;</button>
      </div>
      <div style="padding: 20px; overflow-y: auto; flex: 1; font-family: var(--font-body);">
        ${contentHtml}
      </div>
    </div>
  `;
  modalOverlay.style.display = 'flex';
};

window.closeInterestsOrChatsModal = function() {
  const modalOverlay = document.getElementById('interestsChatsModalOverlay');
  if (modalOverlay) modalOverlay.style.display = 'none';
};

window.viewProfilePdf = function(pdfUrl, profileName) {
  const modal = document.getElementById('pdfViewerModal');
  const frame = document.getElementById('pdfViewerFrame');
  const title = document.getElementById('pdfViewerTitle');
  const downloadLink = document.getElementById('pdfDownloadLink');

  if (title) title.textContent = `${profileName}'s Ancestral Biodata`;
  if (downloadLink) {
    downloadLink.href = pdfUrl;
    downloadLink.download = `Biodata_${profileName.replace(/\s/g, '_')}.pdf`;
  }
  if (frame) frame.src = pdfUrl;
  if (modal) modal.classList.add('active');
};

window.closePdfViewer = function() {
  const modal = document.getElementById('pdfViewerModal');
  const frame = document.getElementById('pdfViewerFrame');
  if (modal) modal.classList.remove('active');
  if (frame) frame.src = '';
};

window.viewFullImage = function(imgUrl) {
  const modal = document.getElementById('imageLightboxModal');
  const img = document.getElementById('lightboxImage');
  if (img) img.src = imgUrl;
  if (modal) modal.classList.add('active');
};

window.closeImageLightbox = function() {
  const modal = document.getElementById('imageLightboxModal');
  const img = document.getElementById('lightboxImage');
  if (modal) modal.classList.remove('active');
  if (img) {
    setTimeout(() => {
      if (modal && !modal.classList.contains('active')) img.src = '';
    }, 400);
  }
};


