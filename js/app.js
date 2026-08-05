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
      <!-- Dynamic Royal Notification Bell -->
      <div class="notification-bell-container" id="navNotificationBell" style="position: relative; margin-right: 25px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.03); border: 1px solid rgba(170,124,17,0.2); transition: all 0.3s;" onmouseover="this.style.background='rgba(170,124,17,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--gold-antique);"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span class="notification-badge" id="navNotificationBadge" style="position: absolute; top: -2px; right: -2px; background: #C41E3A; color: white; border-radius: 50%; font-size: 0.65rem; width: 14px; height: 14px; display: none; align-items: center; justify-content: center; font-weight: bold; border: 1px solid var(--primary-dark);">0</span>
        
        <!-- Notification Dropdown -->
        <div class="notification-dropdown" id="navNotificationDropdown" style="display: none; position: absolute; top: 40px; right: 0; background: var(--primary-dark); border: 1.5px solid var(--gold-antique); border-radius: var(--border-radius); box-shadow: var(--shadow-royal); width: 290px; z-index: 1100; max-height: 350px; overflow-y: auto;">
          <div style="padding: 12px 15px; border-bottom: 1.5px solid rgba(170,124,17,0.25); font-weight: bold; color: var(--gold-bright); font-size: 0.85rem; font-family: var(--font-royal); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.15);">
            <span>Royal Notifications</span>
          </div>
          <div id="notificationList" style="padding: 5px 0;">
            <div style="padding: 20px 15px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">No notifications yet.</div>
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
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        
        // Clear unread indicator badge on click
        const badge = document.getElementById('navNotificationBadge');
        if (badge) {
          badge.style.display = 'none';
        }
        
        // Mark all as read when opening dropdown
        let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
        notifications = notifications.map(n => ({ ...n, read: true }));
        localStorage.setItem('notifications', JSON.stringify(notifications));
      });

      document.addEventListener('click', () => {
        dropdown.style.display = 'none';
      });
      
      // Render notifications
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

// WhatsApp Notification trigger on profile registration
async function notifyAdminNewRegistration(profile) {
  try {
    const openwaUrl = localStorage.getItem('openwa_api_url') || 'http://localhost:2785';
    const openwaKey = localStorage.getItem('openwa_api_key') || 'owa_k1_21f959a8005ca7d9941383be23e1dc8104fa8622c26c080b043b860d6bc7fb50';
    const openwaSession = localStorage.getItem('openwa_session_id') || 'default';
    const openwaPhone = localStorage.getItem('openwa_admin_phone') || '917665941949';

    if (openwaUrl && openwaKey && openwaPhone) {
      // Format number to include @c.us if not present
      let chatId = openwaPhone.trim();
      if (!chatId.endsWith('@c.us') && !chatId.endsWith('@g.us')) {
        chatId = `${chatId.replace(/[^0-9]/g, '')}@c.us`;
      }

      const text = `👑 *New Profile Registered* 👑\n\n` +
                   `• *Name:* ${profile.name}\n` +
                   `• *Gender:* ${profile.gender}\n` +
                   `• *Clan:* ${profile.clan}\n` +
                   `• *Gotra:* ${profile.gotra || 'Not specified'}\n` +
                   `• *Location:* ${profile.location || 'Not specified'}\n` +
                   `• *Phone:* ${profile.phone || 'Not specified'}\n` +
                   `• *Email:* ${profile.email || 'Not specified'}\n\n` +
                   `📅 _Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}_`;

      const endpoint = `${openwaUrl.replace(/\/$/, '')}/api/sessions/${openwaSession}/messages/send-text`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': openwaKey
        },
        body: JSON.stringify({
          chatId: chatId,
          text: text
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log("WhatsApp registration notification sent via OpenWA successfully for:", profile.name);
      return;
    }

    // Fallback to webhook configuration
    const webhookUrl = localStorage.getItem('whatsapp_registration_webhook');
    if (webhookUrl) {
      const payload = {
        event: 'new_registration',
        name: profile.name,
        gender: profile.gender,
        clan: profile.clan,
        gotra: profile.gotra || 'Not specified',
        location: profile.location || 'Not specified',
        phone: profile.phone || 'Not specified',
        email: profile.email || 'Not specified',
        timestamp: new Date().toISOString()
      };

      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      console.log("WhatsApp registration notification sent via Webhook successfully for:", profile.name);
      return;
    }

    console.log("WhatsApp Notification: Neither OpenWA nor Webhook is configured.\n" +
                "To use OpenWA, set the following keys in your browser console:\n" +
                "localStorage.setItem('openwa_api_url', 'http://your-server-ip:2785');\n" +
                "localStorage.setItem('openwa_api_key', 'YOUR-API-KEY');\n" +
                "localStorage.setItem('openwa_session_id', 'YOUR-SESSION-ID');\n" +
                "localStorage.setItem('openwa_admin_phone', 'YOUR-PHONE-NUMBER');");
  } catch (error) {
    console.error("Failed to notify WhatsApp webhook/OpenWA gateway:", error);
  }
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
  
  const formattedLocals = localUsers.map(user => ({
    id: user.id || `U_${user.email}`,
    name: user.name || "Noble Member",
    img: user.profilePic || '',
    profilePic: user.profilePic || '',
    gender: user.gender || "Groom",
    age: parseInt(user.age) || 25,
    dob: user.dob || "1998-06-15",
    religion: user.religion || "Hindu",
    caste: user.caste || "Rajput",
    height: user.height || "5'6\"",
    clan: user.clan || "Rathore",
    gotra: `${user.gotra || 'Not Specified'} (Father) / ${user.motherGotra || 'Not Specified'} (Mother)`,
    native: user.pob || user.native || 'Rajasthan',
    rashi: user.rashi || 'Not Specified',
    nakshatra: user.nakshatra || 'Not Specified',
    manglik: user.manglik || 'Non-Manglik',
    education: user.education || 'Graduate',
    occupation: user.occupation || 'Professional',
    income: user.income ? (user.income.includes('Lakhs') ? user.income : `₹${user.income} Lakhs PA`) : '₹12 Lakhs PA',
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
    isRecentlyActive: true,
    isVerified: true,
    aiScore: 92,
    tier: user.tier || 'Starter'
  }));

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
  if (profile.about) {
    const match = profile.about.match(/\[Last Seen: ([^\]]*)\]/);
    if (match) return match[1];
  }
  // Generate a realistic stable timestamp based on the profile's ID
  const hash = profile.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const minutesAgo = (hash % 120) + 15; // stable value between 15 and 135 minutes ago
  const date = new Date(Date.now() - minutesAgo * 60 * 1000);
  return date.toISOString();
}

function formatLastSeen(isoString) {
  if (!isoString) return 'Offline';
  const lastSeenDate = new Date(isoString);
  const now = new Date();
  const diffMs = now - lastSeenDate;
  const diffMins = Math.floor(diffMs / 1000 / 60);
  
  if (diffMins < 2) {
    return 'Online now';
  } else if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  } else {
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    }
  }
}

async function updateMyLastSeen() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser || !window.supabaseClient) return;
  
  try {
    const { data: profile, error } = await window.supabaseClient
      .from('profiles')
      .select('about')
      .eq('id', currentUser.id)
      .maybeSingle();
      
    if (profile) {
      let about = profile.about || '';
      const nowIso = new Date().toISOString();
      if (about.includes('[Last Seen:')) {
        about = about.replace(/\[Last Seen: [^\]]*\]/g, `[Last Seen: ${nowIso}]`);
      } else {
        about = `${about} [Last Seen: ${nowIso}]`.trim();
      }
      
      await window.supabaseClient
        .from('profiles')
        .update({ about })
        .eq('id', currentUser.id);
    }
  } catch (err) {
    console.error("Last seen update error:", err);
  }
}

function areProfilesConnected(profileA, profileB) {
  if (!profileA || !profileB) return false;
  
  const interestsA = getProfileInterests(profileA);
  const interestsB = getProfileInterests(profileB);
  
  return (interestsA[profileB.id] === 'sent' || interestsA[profileB.id] === 'accepted' ||
          interestsB[profileA.id] === 'sent' || interestsB[profileA.id] === 'accepted');
}

function checkIncomingInterests() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) return;
  
  const profiles = getAllProfiles();
  let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  let updated = false;
  
  for (const p of profiles) {
    if (p.id === currentUser.id) continue;
    const incomingInterests = getProfileInterests(p);
    
    if ((incomingInterests[currentUser.id] === 'sent' || incomingInterests[currentUser.id] === 'accepted')) {
      const notifKey = `interest_from_${p.id}`;
      const alreadyNotified = notifications.some(n => n.notifKey === notifKey);
      
      if (!alreadyNotified) {
        const newNotif = {
          id: Date.now() + Math.random(),
          notifKey: notifKey,
          message: `${p.name} sent you a Match Interest! Chat is now unlocked.`,
          profileId: p.id,
          timestamp: 'Just now',
          read: false
        };
        notifications.unshift(newNotif);
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
  const hasSentInterest = mySentInterests[profile.id] === 'sent' || mySentInterests[profile.id] === 'accepted';
  const isAccepted = areProfilesConnected(currentUser, profile);
  const isLoggedIn = !!localStorage.getItem('currentUser');

  // Business badges: Dynamic Last Seen status with green/amber pulse indicators
  const lastSeenIso = getProfileLastSeen(profile);
  const lastSeenText = formatLastSeen(lastSeenIso);
  const isOnline = lastSeenText === 'Online now';
  
  const recentlyActiveBadge = `
    <div class="badge-active" style="margin-top: 10px; display: inline-flex; align-items: center; gap: 5px;">
      <span class="${isOnline ? 'pulse-green' : 'pulse-amber'}" style="background-color: ${isOnline ? '#2ecc71' : '#f39c12'}; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
      Active ${lastSeenText}
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

  const aiScoreBadge = `<div class="ai-score-badge">✨ ${profile.aiScore || 92}% Match</div>`;

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
  } else if (hasSentInterest) {
    interestBtnHtml = `
      <button class="btn btn-royal" style="font-size: 0.8rem; opacity: 0.7; pointer-events: none;" disabled>
        Interest Sent ✓
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
  if (mySentInterests[id]) {
    showToast('Interest already sent to this noble profile');
    return;
  }

  // 1. Mark as accepted immediately in currentUser's local interests mapping to unlock chat instantly
  mySentInterests[id] = 'accepted';
  currentUser.about = setProfileInterestsInAbout(currentUser.about, mySentInterests);
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  // Trigger standard toast notification
  const profiles = getAllProfiles();
  const targetProfile = profiles.find(p => p.id === id);
  const profileName = targetProfile ? targetProfile.name : 'Match';
  showToast(`Royal Match Interest to ${profileName} sent! Chat is now unlocked!`, 'gold');

  // Save notification to localStorage (local to sender)
  let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  const newNotif = {
    id: Date.now(),
    message: `${profileName} accepted your Royal Interest! Click to chat.`,
    profileId: id,
    timestamp: 'Just now',
    read: false
  };
  notifications.unshift(newNotif);
  localStorage.setItem('notifications', JSON.stringify(notifications));

  // Refresh notification badge & list
  if (typeof renderNotifications === 'function') {
    renderNotifications();
  }

  // Sync updated about field (containing new interest) to Supabase profiles database row for currentUser
  if (window.supabaseActive) {
    const { error } = await window.supabaseClient
      .from('profiles')
      .update({ about: currentUser.about })
      .eq('id', currentUser.id);
      
    if (error) {
      console.error("Error syncing sent interest to Supabase:", error);
    }
  }

  updateDashboardStats();
  renderMatchesGrid();
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

window.openProfileDetailModal = function(id) {
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
  const modalLastSeenIso = getProfileLastSeen(profile);
  const modalLastSeenText = formatLastSeen(modalLastSeenIso);
  const modalIsOnline = modalLastSeenText === 'Online now';
  document.getElementById('modalSubline').innerHTML = `
    ${profile.age} Yrs • ${profile.height} • ${profile.location.split(',')[0]}
    <span style="margin-left: 10px; display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; background: rgba(${modalIsOnline ? '46,204,113' : '243,156,18'}, 0.15); color: ${modalIsOnline ? '#2ecc71' : '#f39c12'}; padding: 2px 8px; border-radius: 20px; font-weight: 600;">
      <span class="${modalIsOnline ? 'pulse-green' : 'pulse-amber'}" style="background-color: ${modalIsOnline ? '#2ecc71' : '#f39c12'}; width: 6px; height: 6px; border-radius: 50%; display: inline-block;"></span>
      Active ${modalLastSeenText}
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
    if (unlockBox) unlockBox.style.display = 'none';
    if (unlockedDetails) unlockedDetails.classList.add('active');
    
    // Decrypt details directly
    document.getElementById('unlockedPhone').textContent = profile.phone || 'Not Specified';
    document.getElementById('unlockedEmail').textContent = profile.email || 'Not Specified';
    document.getElementById('unlockedAddress').textContent = `${profile.location || 'Not Specified'}`;
    
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
    if (unlockBox) unlockBox.style.display = 'block';
    if (unlockedDetails) unlockedDetails.classList.remove('active');
    if (socialsItem) socialsItem.style.display = 'none';
  }

  // Trigger click event for Unlock contact details
  const unlockBtn = document.getElementById('unlockContactBtn');
  unlockBtn.onclick = function() {
    // Intercept contact access for Starter Plan users to enforce royal paywall!
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userTier = currentUser ? currentUser.tier || 'Starter' : 'Starter';

    if (userTier === 'Starter') {
      document.getElementById('paywallModal').classList.add('active');
      showToast('Starter plan does not permit contact details access!', 'gold');
      return;
    }

    unlockBtn.innerHTML = 'Securing Lineage...';
    setTimeout(() => {
      unlockBox.style.display = 'none';
      unlockedDetails.classList.add('active');
      
      // Simulate authentic details based on seed data
      document.getElementById('unlockedPhone').textContent = profile.phone || `+91 9116${Math.floor(100000 + Math.random() * 900000)}`;
      document.getElementById('unlockedEmail').textContent = profile.email || `${profile.name.toLowerCase().replace(/\s/g, '.')}@sagaisambaandh-member.com`;
      document.getElementById('unlockedAddress').textContent = `${profile.location}, India`;
      
      // Render socials and biodata documents if profile has them
      const socials = getProfileSocials(profile);
      const biodataUrl = getProfileBiodata(profile);
      const socialsContainer = document.getElementById('unlockedSocials');
      if (socialsItem && socialsContainer) {
        if (socials.instagram || socials.facebook || biodataUrl) {
          socialsItem.style.display = 'block';
          // Update the label dynamically
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
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="color: var(--gold-antique);"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
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
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="color: var(--gold-antique);"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
                Facebook
              </a>
            `;
          }
          if (biodataUrl) {
            html += `
              <button onclick="viewProfilePdf('${biodataUrl}', '${profile.name}')" class="btn btn-royal" style="color: var(--gold-bright); display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.85rem; background: rgba(255,255,255,0.06); padding: 6px 12px; border-radius: 4px; border: 1px solid rgba(170,124,17,0.25); cursor: pointer;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--gold-antique);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                View Biodata (PDF)
              </button>
            `;
          }
          socialsContainer.innerHTML = html;
        } else {
          socialsItem.style.display = 'none';
        }
      }
      
      showToast('Lineage details decrypted successfully!', 'gold');
    }, 1200);
  };

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
    if (user.profilePic && !user.profilePic.startsWith('mock_') && (user.profilePic.startsWith('http') || user.profilePic.startsWith('/') || user.profilePic.startsWith('data:'))) {
      avatar.innerHTML = `<img src="${user.profilePic}" class="user-card-avatar-img" alt="Avatar" />`;
    } else {
      // Fallback to initials
      const initials = (user.name || 'N M').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      avatar.textContent = initials;
      avatar.style.background = getAvatarGradient(user.clan || 'Rathore');
    }
  }
}

// Populate right-side sidebar with online matches of opposite gender
function populateOnlineSidebar(currentUser) {
  const onlineList = document.getElementById('onlineMatchesList');
  if (!onlineList) return;

  const allProfiles = getAllProfiles();
  // Filter for opposite gender matches
  const oppositeGender = getOppositeGender(currentUser.gender);
  const matches = allProfiles.filter(p => normalizeGender(p.gender) === oppositeGender && p.id !== currentUser.id);

  // Take 6 random candidates
  const shuffled = [...matches].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 6);

  onlineList.innerHTML = selected.map(p => {
    let avatarHtml = '';
    if (p.profilePic && !p.profilePic.startsWith('mock_')) {
      avatarHtml = `<img src="${p.profilePic}" alt="${p.name}" />`;
    } else if (p.img) {
      avatarHtml = `<img src="${p.img}" alt="${p.name}" />`;
    } else {
      avatarHtml = p.initials || p.name[0];
    }

    return `
      <div class="online-match-item" onclick="openProfileDetailModal('${p.id}')">
        <div class="online-match-avatar" style="background: ${getAvatarGradient(p.clan)}">
          ${avatarHtml}
        </div>
        <div class="online-match-info">
          <div class="online-match-name">${p.name}</div>
          <div class="online-match-meta">${p.clan} • ${p.age || '24'} Yrs • ${p.location ? p.location.split(',')[0] : 'Rajasthan'}</div>
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
  const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  const listContainer = document.getElementById('notificationList');
  const badge = document.getElementById('navNotificationBadge');

  if (!listContainer) return;

  const unreadCount = notifications.filter(n => !n.read).length;
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  if (notifications.length === 0) {
    listContainer.innerHTML = `
      <div style="padding: 20px 15px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">No notifications yet.</div>
    `;
    return;
  }

  listContainer.innerHTML = notifications.map(n => `
    <div onclick="handleNotificationClick(${n.id}, '${n.profileId}')" style="padding: 10px 15px; border-bottom: 1px solid rgba(170,124,17,0.1); cursor: pointer; background: ${n.read ? 'transparent' : 'rgba(170,124,17,0.06)'}; transition: background 0.2s; text-align: left;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='${n.read ? 'transparent' : 'rgba(170,124,17,0.06)'}'">
      <div style="color: var(--text-white); font-size: 0.82rem; line-height: 1.3; margin-bottom: 3px;">${n.message}</div>
      <div style="color: var(--text-muted); font-size: 0.7rem;">${n.timestamp}</div>
    </div>
  `).join('');
};

window.handleNotificationClick = function(notifId, profileId) {
  // Mark as read
  let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  notifications = notifications.map(n => n.id === notifId ? { ...n, read: true } : n);
  localStorage.setItem('notifications', JSON.stringify(notifications));
  
  // Render updates
  renderNotifications();

  // Close dropdown
  const dropdown = document.getElementById('navNotificationDropdown');
  if (dropdown) dropdown.style.display = 'none';

  // Open chat!
  openOneOnOneChat(profileId);
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


