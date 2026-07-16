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

  // Initialize mobile responsive menu drawer
  initMobileMenu();

  // Initialize native scroll reveal observers for elegant page scroll entries
  initScrollReveal();

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

// Stateful navbar updater
function updateNavigationState() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const authContainer = document.getElementById('navAuthButtons');
  
  if (!authContainer) return;

  let html = '';
  if (currentUser) {
    const tier = currentUser.tier || 'Starter';
    html = `
      <span style="font-size: 0.9rem; font-weight: 500; font-family: var(--font-royal); color: var(--primary-color); display: flex; align-items: center; gap: 8px;">
        Khammaghani, <strong style="color: var(--gold-antique);">${currentUser.name.split(' ')[0]}</strong>
        <span style="font-size: 0.7rem; font-family: var(--font-body); padding: 2px 10px; background-color: var(--gold-light); border: 1px solid var(--gold-antique); border-radius: 12px; color: var(--primary-color); font-weight: bold;">
          ${tier} Plan
        </span>
      </span>
      <a href="dashboard.html" class="btn btn-minimal">Dashboard</a>
      <button onclick="handleLogout()" class="btn btn-primary">Logout</button>
    `;
  } else {
    html = `
      <a href="login.html" class="btn btn-minimal" style="margin-right: 12px; font-weight: 600;">Log In</a>
      <a href="register.html" class="btn btn-royal" id="navSignUpBtn">Sign Up</a>
    `;
  }

  authContainer.innerHTML = html;

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

// Get combined profiles (Pre-seeded + registered users)
function getAllProfiles() {
  const seeds = window.SEED_PROFILES || [];
  
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

  return [...seeds, ...formattedLocals];
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
          email: 'royal@sagaisambaandh.com',
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
    if ((email === 'royal@sagaisambaandh.com' || email === 'royal@lifepartnerconnects.com') && password === 'royal123') {
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
      showToast('Invalid credentials. Try royal@sagaisambaandh.com / royal123', 'normal');
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
      clan: document.getElementById('regCaste').value,
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
      const clan = document.getElementById('regCaste').value;
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

function initDashboardPage() {
  const currentUser = checkAuth();
  if (!currentUser) return;

  // Handle Supabase OAuth redirection & async user loading
  if (window.supabaseActive) {
    // 1. Fetch active session to check if just logged in via Google OAuth
    window.supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const cachedUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!cachedUser || cachedUser.email !== session.user.email) {
          // New OAuth sign in session! Fetch user profile record
          const { data: profile } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            localStorage.setItem('currentUser', JSON.stringify(profile));
            // reload greeting and contents
            window.location.reload();
          } else {
            // OAuth succeeded but no profile details created yet, redirect to onboarding wizard
            const tempGoogleUser = {
              uid: session.user.id,
              name: session.user.user_metadata.full_name || 'Noble Member',
              email: session.user.email
            };
            localStorage.setItem('tempGoogleUser', JSON.stringify(tempGoogleUser));
            window.location.href = 'register.html';
          }
        }
      }
    });

    // 2. Load all matching profiles from database
    window.supabaseClient.from('profiles').select('*')
      .then(({ data, error }) => {
        if (!error && data) {
          window.firestoreUsers = data; // cache in memory to sync matches grid
          renderMatchesGrid();
          updateDashboardStats();
        } else if (error) {
          console.error("Error loading Supabase profiles:", error);
        }
      });
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
    if (currentUser.gender === 'Groom') {
      activeFilters.gender = 'Bride';
      document.getElementById('filterGender').value = 'Bride';
    } else if (currentUser.gender === 'Bride') {
      activeFilters.gender = 'Groom';
      document.getElementById('filterGender').value = 'Groom';
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

  const profiles = getAllProfiles();
  const shortlists = JSON.parse(localStorage.getItem('shortlisted')) || [];

  const filtered = profiles.filter(profile => {
    if (activeFilters.gender !== 'All' && profile.gender !== activeFilters.gender) return false;
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

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
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

// Generate Profile Card Markup
function createProfileCardHtml(profile, isDashboard = true) {
  const shortlists = JSON.parse(localStorage.getItem('shortlisted')) || [];
  const interests = JSON.parse(localStorage.getItem('interests')) || {};
  const isShortlisted = shortlists.includes(profile.id);
  const hasSentInterest = !!interests[profile.id];
  const isLoggedIn = !!localStorage.getItem('currentUser');

  // Business badges: Recently Active, Verified Shield, and AI score overlay
  const recentlyActiveBadge = profile.isRecentlyActive ? `<div class="badge-active" style="margin-top: 10px;"><span class="pulse-green"></span>Recently Active</div>` : '';
  
  // Rajput Circular Wax Seal Verification Badge
  const verifiedBadge = profile.isVerified ? `
    <div class="wax-seal-container" title="Lineage, Gotra & Family Verified">
      <div class="wax-seal-badge">
        <svg viewBox="0 0 24 24">
          <path d="M12 2L2 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5L12 2zm-1 15l-3-3 1.4-1.4 1.6 1.6 4.6-4.6 1.4 1.4-6 6z"/>
        </svg>
        <div class="wax-seal-ribbons"></div>
      </div>
      <span class="wax-seal-label">Lineage Verified</span>
    </div>
  ` : '';

  const aiScoreBadge = `<div class="ai-score-badge">✨ ${profile.aiScore || 92}% Match</div>`;

  // Privacy-first photo state (blurred/locked for non-logged-in homepage visitors)
  const isPhotoLocked = !isLoggedIn && !isDashboard;

  let imageAreaHtml = `
    <div class="jharokha-frame-container">
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

  return `
    <div class="profile-card" data-id="${profile.id}">
      ${imageAreaHtml}
      
      <div class="profile-card-body" style="padding-bottom: 15px;">
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
          <button onclick="handleSendInterest('${profile.id}')" class="btn btn-royal" style="font-size: 0.8rem;">
            ${hasSentInterest ? 'Interest Sent ✓' : 'Send Interest'}
          </button>
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

// Update dashboard stats
function updateDashboardStats() {
  const shortlists = JSON.parse(localStorage.getItem('shortlisted')) || [];
  const interests = JSON.parse(localStorage.getItem('interests')) || {};
  
  const shortCount = document.getElementById('statShortlistedCount');
  if (shortCount) shortCount.textContent = shortlists.length;

  const intCount = document.getElementById('statInterestsCount');
  if (intCount) intCount.textContent = Object.keys(interests).length;
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
window.handleSendInterest = function(id) {
  let interests = JSON.parse(localStorage.getItem('interests')) || {};
  
  if (interests[id]) {
    showToast('Interest already sent to this noble profile');
    return;
  }

  interests[id] = Date.now();
  localStorage.setItem('interests', JSON.stringify(interests));
  showToast('Royal Match Interest dispatched successfully!', 'gold');
  
  updateDashboardStats();
  renderMatchesGrid();
};

// ==========================================
// 5. PROFILE DETAIL MODAL HANDLER
// ==========================================
window.openProfileDetailModal = function(id) {
  const modal = document.getElementById('profileDetailModal');
  if (!modal) return;

  const profiles = getAllProfiles();
  const profile = profiles.find(p => p.id === id);
  if (!profile) return;

  // Build dynamic content for detailed modal view inside a gorgeous Jharokha window frame
  document.getElementById('modalInitials').innerHTML = `
    <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
      <!-- Clipped frame block containing either the img or initials -->
      <div class="jharokha-frame" style="background: ${getAvatarGradient(profile.clan)}; width: 100%; height: 100%;">
        ${profile.img ? `<img src="${profile.img}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="${profile.name}" />` : `<div class="profile-avatar-placeholder" style="font-size: 7rem; display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-white);">${profile.initials}</div>`}
      </div>
      
      <!-- Jharokha absolute border outline SVG overlay -->
      <svg class="jharokha-border" viewBox="0 0 100 125" preserveAspectRatio="none" style="z-index: 10; padding: 20px;">
        <path d="M 50,2 C 65,14 85,17 90,32 C 95,47 98,57 98,98 L 2,98 C 2,57 5,47 10,32 C 15,17 35,14 50,2 Z" fill="none" stroke="var(--gold-antique)" stroke-width="2" />
      </svg>
    </div>
  `;
  document.getElementById('modalName').textContent = profile.name;
  document.getElementById('modalCaste').textContent = `${profile.clan} Clan`;
  document.getElementById('modalSubline').textContent = `${profile.age} Yrs • ${profile.height} • ${profile.location.split(',')[0]}`;
  
  // Stat boxes
  document.getElementById('statIncome').textContent = profile.income;
  document.getElementById('statRashi').textContent = profile.rashi.split(' (')[0];
  document.getElementById('statManglik').textContent = profile.manglik;
  
  // Bind AI affinity compatibility matching score inside modal stat box
  document.getElementById('statAiMatch').textContent = `${profile.aiScore || 92}% Match`;

  // Details
  document.getElementById('detailReligion').textContent = profile.religion || 'Hindu';
  document.getElementById('detailCaste').textContent = profile.caste || 'Rajput';
  document.getElementById('detailDOB').textContent = profile.dob || '1998-06-15';
  document.getElementById('detailPOB').textContent = profile.pob || profile.native || 'Udaipur, Rajasthan';
  document.getElementById('detailGotra').textContent = profile.gotra;
  document.getElementById('detailNative').textContent = profile.native;
  document.getElementById('detailEducation').textContent = profile.education;
  document.getElementById('detailOccupation').textContent = profile.occupation;
  document.getElementById('detailNakshatra').textContent = profile.nakshatra;
  document.getElementById('detailFamilyType').textContent = `${profile.familyType} Values`;
  
  // Preferences
  document.getElementById('detailPrefAge').textContent = `${profile.prefMinAge || 21} - ${profile.prefMaxAge || 29} Years`;
  document.getElementById('detailPrefCaste').textContent = profile.prefCaste || 'Any';
  document.getElementById('detailPrefLocation').textContent = profile.prefLocation || 'Any';
  
  // Custom summaries
  document.getElementById('modalBio').textContent = profile.about;
  document.getElementById('modalFamily').textContent = profile.familyDetails;
  document.getElementById('modalExpectations').textContent = profile.expectations;

  // Reset Lock/Unlock state
  const unlockBox = document.getElementById('modalUnlockBox');
  const unlockedDetails = document.getElementById('modalUnlockedDetails');
  
  unlockBox.style.display = 'block';
  unlockedDetails.classList.remove('active');

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
      document.getElementById('unlockedPhone').textContent = `+91 9116${Math.floor(100000 + Math.random() * 900000)}`;
      document.getElementById('unlockedEmail').textContent = `${profile.name.toLowerCase().replace(/\s/g, '.')}@sagaisambaandh-member.com`;
      document.getElementById('unlockedAddress').textContent = `${profile.location}, India`;
      
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
