// Life Partner Connects - Central State Controller & Application Logic

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

  // Route-Specific Initializations
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';

  if (page === 'index.html' || page === '') {
    initHomepage();
  } else if (page === 'login.html') {
    initLoginPage();
  } else if (page === 'register.html') {
    initRegisterPage();
  } else if (page === 'dashboard.html') {
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
      <a href="login.html" class="btn btn-minimal" id="navLoginBtn">Login</a>
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
  const navLinks = document.querySelector('.nav-links');
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
  localStorage.removeItem('currentUser');
  showToast('Logged out successfully', 'gold');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
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
  const localUsers = JSON.parse(localStorage.getItem('users')) || [];
  
  // Format local users to match seed profiles schema
  const formattedLocals = localUsers.map(user => ({
    id: user.id || `U_${user.email}`,
    name: user.name,
    gender: user.gender,
    age: parseInt(user.age) || 25,
    height: user.height || "5'6\"",
    caste: user.caste,
    gotra: `${user.gotra || 'Not Specified'} (Father) / ${user.motherGotra || 'Not Specified'} (Mother)`,
    native: user.native || 'Rajasthan',
    rashi: user.rashi || 'Not Specified',
    nakshatra: user.nakshatra || 'Not Specified',
    manglik: user.manglik || 'Non-Manglik',
    education: user.education || 'Graduate',
    occupation: user.occupation || 'Professional',
    income: user.income ? `₹${user.income} Lakhs PA` : '₹12 Lakhs PA',
    location: user.location || 'Jaipur, Rajasthan',
    familyType: user.familyType || 'Traditional',
    familyDetails: user.familyDetails || 'Respectable family based in Rajasthan.',
    about: user.about || 'A simple and career-oriented individual.',
    expectations: user.expectations || 'An understanding partner.',
    initials: user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
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
}

// ==========================================
// 3. AUTH PAGE HANDLERS
// ==========================================
function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showToast('Please fill all fields');
      return;
    }

    // Standard static credentials for seed testing
    if (email === 'royal@lifepartnerconnects.com' && password === 'royal123') {
      const demoUser = {
        name: 'Kunwar Shivraj Singh',
        gender: 'Groom',
        email: email,
        caste: 'Rajput',
        age: 28,
        tier: 'Starter' // Default Starter Tier
      };
      localStorage.setItem('currentUser', JSON.stringify(demoUser));
      showToast('Khammaghani! Welcome to Life Partner Connects', 'gold');
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
      showToast('Invalid credentials. Try royal@rajgharana.com / royal123', 'normal');
    }
  });
}

function initRegisterPage() {
  const steps = document.querySelectorAll('.register-step-panel');
  const indicators = document.querySelectorAll('.progress-step');
  const nextBtns = document.querySelectorAll('.btn-next');
  const prevBtns = document.querySelectorAll('.btn-prev');
  const registerForm = document.getElementById('registerForm');
  let currentStep = 0;

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

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    const email = document.getElementById('regEmail').value.trim();
    
    // Check if user already exists
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
      age: document.getElementById('regAge').value,
      height: "5'7\"",
      caste: document.getElementById('regCaste').value,
      gotra: document.getElementById('regGotra').value.trim(),
      motherGotra: document.getElementById('regMotherGotra').value.trim(),
      rashi: document.getElementById('regRashi').value,
      manglik: document.getElementById('regManglik').value,
      education: document.getElementById('regEducation').value.trim(),
      occupation: document.getElementById('regOccupation').value.trim(),
      income: document.getElementById('regIncome').value.trim(),
      location: document.getElementById('regLocation').value.trim(),
      familyType: document.getElementById('regFamilyType').value,
      about: document.getElementById('regAbout').value.trim(),
      expectations: document.getElementById('regExpectations').value.trim(),
      tier: 'Starter' // Default to Starter Tier on registration
    };

    // Save to LocalStorage
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
      const caste = document.getElementById('regCaste').value;
      const gotra = document.getElementById('regGotra').value.trim();
      const age = document.getElementById('regAge').value;

      if (!caste || !gotra || !age) {
        showToast('Please provide Caste, Father\'s Gotra, and Age');
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

function getAvatarGradient(caste) {
  switch (caste) {
    case 'Rajput':
      return 'linear-gradient(135deg, #3A0209 0%, #5C0612 40%, #E05A12 100%)';
    case 'Brahmin':
      return 'linear-gradient(135deg, #3A0209 0%, #5C0612 40%, #E5A800 100%)';
    case 'Maheshwari':
      return 'linear-gradient(135deg, #3A0209 0%, #5C0612 40%, #0F4C81 100%)';
    case 'Oswal':
      return 'linear-gradient(135deg, #3A0209 0%, #5C0612 40%, #C41E3A 100%)';
    case 'Baniya':
      return 'linear-gradient(135deg, #3A0209 0%, #5C0612 40%, #0D6646 100%)';
    default:
      return 'linear-gradient(135deg, #3A0209 0%, #5C0612 100%)';
  }
}

// Generate Profile Card Markup
function createProfileCardHtml(profile, isDashboard = true) {
  const shortlists = JSON.parse(localStorage.getItem('shortlisted')) || [];
  const interests = JSON.parse(localStorage.getItem('interests')) || {};
  const isShortlisted = shortlists.includes(profile.id);
  const hasSentInterest = !!interests[profile.id];

  // Business badges: Recently Active, Verified Shield, and AI score overlay
  const recentlyActiveBadge = profile.isRecentlyActive ? `<div class="badge-active"><span class="pulse-green"></span>Recently Active</div>` : '';
  const verifiedBadge = profile.isVerified ? `<div class="badge-verified">✓ Verified</div>` : '';
  const aiScoreBadge = `<div class="ai-score-badge">✨ ${profile.aiScore || 92}% Match</div>`;

  return `
    <div class="profile-card" data-id="${profile.id}">
      <div class="profile-card-image" style="background: ${getAvatarGradient(profile.caste)};">
        ${profile.img ? `<img src="${profile.img}" class="profile-card-img" alt="${profile.name}" />` : `<div class="profile-avatar-placeholder">${profile.initials}</div>`}
        <span class="profile-gender-badge ${profile.gender === 'Groom' ? 'badge-groom' : 'badge-bride'}">${profile.gender}</span>
        ${aiScoreBadge}
        <div class="profile-details-preview">
          <h4>${profile.name}</h4>
          <span class="profile-caste-tag">${profile.caste} Caste • ${profile.age} Yrs</span>
        </div>
      </div>
      
      <div class="profile-card-body" style="padding-bottom: 15px;">
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
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
            <strong style="color: var(--gold-antique); font-size: 0.75rem; text-transform: uppercase;">Gotra:</strong>
            <span style="font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${profile.gotra.split(' (')[0]}</span>
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
          <a href="login.html" class="btn btn-royal" style="width: 100%; font-size: 0.8rem;">Connect with ${profile.gender === 'Groom' ? 'Him' : 'Her'}</a>
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

  // Build dynamic content for detailed modal view
  document.getElementById('modalInitials').innerHTML = profile.img ? `<img src="${profile.img}" alt="${profile.name}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<div class="profile-avatar-placeholder" style="font-size: 7rem; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${getAvatarGradient(profile.caste)};">${profile.initials}</div>`;
  document.getElementById('modalName').textContent = profile.name;
  document.getElementById('modalCaste').textContent = `${profile.caste} Caste`;
  document.getElementById('modalSubline').textContent = `${profile.age} Yrs • ${profile.height} • ${profile.location.split(',')[0]}`;
  
  // Stat boxes
  document.getElementById('statIncome').textContent = profile.income;
  document.getElementById('statRashi').textContent = profile.rashi.split(' (')[0];
  document.getElementById('statManglik').textContent = profile.manglik;
  
  // Bind AI affinity compatibility matching score inside modal stat box
  document.getElementById('statAiMatch').textContent = `${profile.aiScore || 92}% Match`;

  // Details
  document.getElementById('detailGotra').textContent = profile.gotra;
  document.getElementById('detailNative').textContent = profile.native;
  document.getElementById('detailEducation').textContent = profile.education;
  document.getElementById('detailOccupation').textContent = profile.occupation;
  document.getElementById('detailNakshatra').textContent = profile.nakshatra;
  document.getElementById('detailFamilyType').textContent = `${profile.familyType} Values`;
  
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
      document.getElementById('unlockedEmail').textContent = `${profile.name.toLowerCase().replace(/\s/g, '.')}@gharana-member.com`;
      document.getElementById('unlockedAddress').textContent = `${profile.location}, India`;
      
      showToast('Lineage details decrypted successfully!', 'gold');
    }, 1200);
  };

  // Open modal
  modal.classList.add('active');
};
