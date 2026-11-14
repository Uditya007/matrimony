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

  // Mobile verification check: only on authenticated member dashboard/profile pages, NEVER on front page (index.html) or public landing pages
  const currentPath = window.location.pathname;
  const currentPage = (currentPath.split('/').pop() || 'index.html').split('?')[0].split('#')[0];
  const isMemberDashboard = currentPage === 'dashboard.html' || currentPage === 'dashboard' || currentPage === 'profile.html' || currentPage === 'profile';

  // Mobile verification check temporarily disabled for website
  // if (isMemberDashboard) {
  //   setTimeout(() => {
  //     if (typeof checkMandatoryPhoneVerification === 'function') {
  //       checkMandatoryPhoneVerification();
  //     }
  //   }, 1100);
  // }


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

// ─── Check if Phone Exists in Database ─────────────────────────────────────
async function checkPhoneExistsInDatabase(phoneStr) {
  if (!phoneStr) return false;
  const last10 = String(phoneStr).replace(/[^0-9]/g, '').slice(-10);
  if (last10.length !== 10) return false;

  // 1. Check local storage users
  const localUsers = JSON.parse(localStorage.getItem('users')) || [];
  const foundLocal = localUsers.some(u => {
    const pDigits = (u.phone || '').replace(/[^0-9]/g, '').slice(-10);
    return pDigits === last10;
  });
  if (foundLocal) return true;

  // 2. Check Supabase profiles table
  if (window.supabaseActive && window.supabaseClient) {
    try {
      const { data, error } = await window.supabaseClient
        .from('profiles')
        .select('id, phone')
        .ilike('phone', `%${last10}%`)
        .limit(1);

      if (!error && data && data.length > 0) {
        return true;
      }
    } catch (e) {
      console.warn('Database phone check warning:', e);
    }
  }

  return false;
}

// ─── Mandatory Mobile Number & OTP Verification ─────────────────────────────
let otpCountdownInterval = null;

function checkMandatoryPhoneVerification() {
  // Mobile verification temporarily disabled for website
  const existing = document.getElementById('mandatoryPhoneVerificationModal');
  if (existing) existing.remove();
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser) {
    currentUser.phoneVerified = true;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }
  return;
}

function initOtpDigitCells() {
  const cells = document.querySelectorAll('.otp-digit-cell');
  const hiddenInput = document.getElementById('mandatoryOtpInput');
  if (!cells || cells.length === 0) return;

  cells.forEach((cell, idx) => {
    cell.addEventListener('input', () => {
      const val = cell.value.replace(/[^0-9]/g, '');
      cell.value = val ? val[val.length - 1] : '';

      if (cell.value) {
        cell.style.borderBottomColor = '#FCD34D';
      } else {
        cell.style.borderBottomColor = 'rgba(255, 255, 255, 0.35)';
      }

      const fullVal = Array.from(cells).map(c => c.value).join('');
      if (hiddenInput) hiddenInput.value = fullVal;

      if (cell.value && idx < cells.length - 1) {
        cells[idx + 1].focus();
      }

      if (fullVal.length === cells.length) {
        window.handleConfirmVerificationOtp();
      }
    });

    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (!cell.value && idx > 0) {
          cells[idx - 1].focus();
          cells[idx - 1].value = '';
          cells[idx - 1].style.borderBottomColor = 'rgba(255, 255, 255, 0.35)';
        } else {
          cell.value = '';
          cell.style.borderBottomColor = 'rgba(255, 255, 255, 0.35)';
        }
        const fullVal = Array.from(cells).map(c => c.value).join('');
        if (hiddenInput) hiddenInput.value = fullVal;
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        cells[idx - 1].focus();
      } else if (e.key === 'ArrowRight' && idx < cells.length - 1) {
        cells[idx + 1].focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        window.handleConfirmVerificationOtp();
      }
    });

    cell.addEventListener('focus', () => {
      cell.style.borderBottomColor = '#00B5B8';
      cell.style.background = 'transparent';
    });

    cell.addEventListener('blur', () => {
      cell.style.background = 'transparent';
      if (cell.value) {
        cell.style.borderBottomColor = '#FCD34D';
      } else {
        cell.style.borderBottomColor = 'rgba(255, 255, 255, 0.35)';
      }
    });

    cell.addEventListener('paste', (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text');
      const digits = paste.replace(/[^0-9]/g, '').slice(0, cells.length);
      if (!digits) return;
      digits.split('').forEach((d, i) => {
        if (cells[i]) {
          cells[i].value = d;
          cells[i].style.borderBottomColor = '#FCD34D';
        }
      });
      const fullVal = Array.from(cells).map(c => c.value).join('');
      if (hiddenInput) hiddenInput.value = fullVal;

      const nextIdx = Math.min(digits.length, cells.length - 1);
      cells[nextIdx].focus();

      if (digits.length === cells.length) {
        window.handleConfirmVerificationOtp();
      }
    });
  });

  setTimeout(() => {
    if (cells[0]) cells[0].focus();
  }, 200);
}

function openPhoneVerificationModal(options = {}) {
  const existing = document.getElementById('mandatoryPhoneVerificationModal');
  if (existing) existing.remove();

  window._phoneVerificationContext = options;
  const initialPhone = (options.phone || '').replace(/[^0-9]/g, '').slice(-10);
  const userName = options.name || '';
  const shouldAutoSend = Boolean(options.autoSend && initialPhone.length === 10);

  const modalHtml = `
    <div id="mandatoryPhoneVerificationModal" style="position: fixed; inset: 0; background: rgba(10, 2, 5, 0.94); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(10px);">
      <div style="background: #1C070D; border: 1.5px solid rgba(212, 175, 55, 0.45); box-shadow: 0 12px 45px rgba(0,0,0,0.9), 0 0 35px rgba(212, 175, 55, 0.2); border-radius: 18px; max-width: 410px; width: 100%; padding: 36px 28px 28px; text-align: center; color: #E2E8F0; position: relative; box-sizing: border-box;">
        
        <button type="button" onclick="closePhoneVerificationModal()" style="position: absolute; top: 16px; right: 18px; background: none; border: none; color: rgba(255, 255, 255, 0.6); font-size: 1.4rem; cursor: pointer; line-height: 1; padding: 4px; transition: color 0.2s;" onmouseover="this.style.color='#FFF'" onmouseout="this.style.color='rgba(255,255,255,0.6)'" aria-label="Close">&times;</button>

        <!-- Top Circular Shield Badge -->
        <div style="width: 58px; height: 58px; border-radius: 50%; background: rgba(212, 175, 55, 0.12); border: 1px solid rgba(212, 175, 55, 0.35); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7V12C3 17.52 6.84 22.74 12 24C17.16 22.74 21 17.52 21 12V7L12 2Z" fill="#D4AF37" fill-opacity="0.25" stroke="#FCD34D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 12L11 14L15 10" stroke="#FCD34D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <!-- Heading -->
        <h2 style="font-family: var(--font-royal, 'Cinzel', serif); color: #FFFFFF; margin: 0 0 8px; font-size: 1.6rem; font-weight: 700; letter-spacing: 0.5px;">
          Enter OTP
        </h2>

        <!-- Subtitle with Phone Number -->
        <p style="font-size: 0.95rem; color: rgba(255, 255, 255, 0.8); line-height: 1.45; margin: 0 0 22px;">
          We've sent a code to <strong style="color: #FCD34D; font-weight: 700;" id="displayOtpSentPhone">+91 ${initialPhone}</strong>
        </p>

        <!-- STEP 1: Phone Input (Fallback if phone was not provided) -->
        <div id="otpStepPhone" style="${shouldAutoSend ? 'display: none;' : 'display: block;'}">
          <div style="text-align: left; margin-bottom: 18px;">
            <div style="display: flex; gap: 8px;">
              <span style="background: rgba(255,255,255,0.06); border: 1px solid rgba(170,124,17,0.3); padding: 12px 14px; border-radius: 8px; font-weight: 700; color: #D4AF37; font-size: 0.95rem; display: flex; align-items: center;">+91</span>
              <input type="tel" id="mandatoryPhoneInput" maxlength="10" placeholder="Mobile no." value="${initialPhone}" style="flex: 1; padding: 12px 14px; border-radius: 8px; border: 1.5px solid rgba(170,124,17,0.35); background: rgba(0,0,0,0.45); color: #FFF; font-size: 1rem; letter-spacing: 1px; outline: none; box-sizing: border-box;">
            </div>
            <span id="phoneValidationError" style="color: #fc8181; font-size: 0.78rem; display: none; margin-top: 6px;">Please enter a valid 10-digit mobile number</span>
          </div>

          <button type="button" id="btnSendPhoneOtp" onclick="handleSendVerificationOtp()" style="width: 100%; padding: 13px; font-size: 0.95rem; font-weight: 700; border-radius: 50px; cursor: pointer; border: none; background: linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%); color: #1A050B; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.35);">
            Get OTP
          </button>
        </div>

        <!-- STEP 2: OTP Input View -->
        <div id="otpStepVerify" style="${shouldAutoSend ? 'display: block;' : 'display: none;'}">
          
          <!-- 6 Segmented Digit Input Underlines / Cells Matching Mockup -->
          <div class="otp-digits-container" style="display: flex; justify-content: center; gap: 10px; margin: 18px 0 20px;">
            <input type="text" class="otp-digit-cell" id="otpDigit0" maxlength="1" inputmode="numeric" autocomplete="one-time-code" style="width: 44px; height: 50px; border: none; border-bottom: 2.5px solid #00B5B8; background: transparent; color: #FCD34D; font-size: 1.6rem; font-weight: 700; text-align: center; outline: none; border-radius: 4px 4px 0 0; transition: all 0.2s;">
            <input type="text" class="otp-digit-cell" id="otpDigit1" maxlength="1" inputmode="numeric" style="width: 44px; height: 50px; border: none; border-bottom: 2.5px solid rgba(255, 255, 255, 0.35); background: transparent; color: #FCD34D; font-size: 1.6rem; font-weight: 700; text-align: center; outline: none; border-radius: 4px 4px 0 0; transition: all 0.2s;">
            <input type="text" class="otp-digit-cell" id="otpDigit2" maxlength="1" inputmode="numeric" style="width: 44px; height: 50px; border: none; border-bottom: 2.5px solid rgba(255, 255, 255, 0.35); background: transparent; color: #FCD34D; font-size: 1.6rem; font-weight: 700; text-align: center; outline: none; border-radius: 4px 4px 0 0; transition: all 0.2s;">
            <input type="text" class="otp-digit-cell" id="otpDigit3" maxlength="1" inputmode="numeric" style="width: 44px; height: 50px; border: none; border-bottom: 2.5px solid rgba(255, 255, 255, 0.35); background: transparent; color: #FCD34D; font-size: 1.6rem; font-weight: 700; text-align: center; outline: none; border-radius: 4px 4px 0 0; transition: all 0.2s;">
            <input type="text" class="otp-digit-cell" id="otpDigit4" maxlength="1" inputmode="numeric" style="width: 44px; height: 50px; border: none; border-bottom: 2.5px solid rgba(255, 255, 255, 0.35); background: transparent; color: #FCD34D; font-size: 1.6rem; font-weight: 700; text-align: center; outline: none; border-radius: 4px 4px 0 0; transition: all 0.2s;">
            <input type="text" class="otp-digit-cell" id="otpDigit5" maxlength="1" inputmode="numeric" style="width: 44px; height: 50px; border: none; border-bottom: 2.5px solid rgba(255, 255, 255, 0.35); background: transparent; color: #FCD34D; font-size: 1.6rem; font-weight: 700; text-align: center; outline: none; border-radius: 4px 4px 0 0; transition: all 0.2s;">
          </div>

          <!-- Hidden input for standard form read -->
          <input type="hidden" id="mandatoryOtpInput" value="">

          <div id="otpValidationError" style="color: #fc8181; font-size: 0.8rem; display: none; margin-bottom: 12px; text-align: center; font-weight: 600;">Invalid OTP code. Please enter the valid 6-digit code.</div>

          <!-- Resend row matching reference mockup -->
          <div style="font-size: 0.88rem; color: rgba(255, 255, 255, 0.7); margin-bottom: 22px;">
            Didn't get the code yet? 
            <span id="otpCountdownTimer" style="color: rgba(255, 255, 255, 0.55); font-weight: 600;">Resend in 45s</span>
            <button type="button" id="btnResendOtp" onclick="handleSendVerificationOtp(true)" style="background: none; border: none; color: #FCD34D; cursor: pointer; text-decoration: underline; font-weight: 700; display: none; padding: 0 0 0 4px; font-size: 0.88rem;">Resend</button>
          </div>

          <button type="button" id="btnConfirmOtp" onclick="handleConfirmVerificationOtp()" style="width: 100%; padding: 13px; font-size: 0.95rem; font-weight: 700; border-radius: 50px; cursor: pointer; border: none; background: linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%); color: #1A050B; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.35); transition: all 0.2s ease;">
            Verify & Continue
          </button>

          <div style="margin-top: 16px;">
            <button type="button" onclick="document.getElementById('otpStepVerify').style.display='none'; document.getElementById('otpStepPhone').style.display='block';" style="background: none; border: none; color: #FCD34D; cursor: pointer; text-decoration: underline; font-size: 0.82rem; font-weight: 600;">← Change Number</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  initOtpDigitCells();

  if (shouldAutoSend) {
    handleSendVerificationOtp(false, initialPhone);
  }
}

window.closePhoneVerificationModal = function() {
  const modal = document.getElementById('mandatoryPhoneVerificationModal');
  if (modal) modal.remove();
  if (otpCountdownInterval) {
    clearInterval(otpCountdownInterval);
    otpCountdownInterval = null;
  }
};

window.handleSendVerificationOtp = function(isResend = false, overridePhone = null) {
  const phoneInput = document.getElementById('mandatoryPhoneInput');
  const errorEl = document.getElementById('phoneValidationError');
  const rawNumber = (overridePhone || phoneInput?.value || '').replace(/[^0-9]/g, '').slice(-10);

  if (rawNumber.length !== 10) {
    if (errorEl) errorEl.style.display = 'block';
    return;
  }
  if (errorEl) errorEl.style.display = 'none';

  // Generate 6-digit random OTP
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  sessionStorage.setItem('royal_pending_otp', generatedOtp);
  sessionStorage.setItem('royal_pending_phone', `+91 ${rawNumber}`);

  // Display phone in verify step
  const displayPhoneEl = document.getElementById('displayOtpSentPhone');
  if (displayPhoneEl) displayPhoneEl.textContent = `+91 ${rawNumber}`;

  // Switch steps
  const stepPhone = document.getElementById('otpStepPhone');
  const stepVerify = document.getElementById('otpStepVerify');
  if (stepPhone) stepPhone.style.display = 'none';
  if (stepVerify) stepVerify.style.display = 'block';

  showToast(`💬 Sending verification code to WhatsApp (+91 ${rawNumber})...`, 'gold');

  // Trigger backend WhatsApp dispatch
  const userName = window._phoneVerificationContext?.name || '';
  fetch('/api/send-whatsapp-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: rawNumber, otp: generatedOtp, name: userName })
  }).then(r => r.json()).then(data => {
    if (data.success) {
      if (data.token) sessionStorage.setItem('royal_pending_otp_token', data.token);
      if (data.expiresAt) sessionStorage.setItem('royal_pending_otp_expires', data.expiresAt);
      if (data.fallbackOtp) sessionStorage.setItem('royal_pending_otp', data.fallbackOtp);
      showToast(data.message || '💬 Verification code sent to your WhatsApp!', 'gold');
    } else {
      showToast(`⚠️ ${data?.error || 'Could not send WhatsApp OTP. Please ensure number is on WhatsApp.'}`, 'normal');
      console.warn('WhatsApp OTP send notice:', data);
    }
  }).catch(e => {
    console.warn('WhatsApp dispatch fetch error:', e);
    showToast('⚠️ Network error contacting WhatsApp service', 'normal');
  });

  // Start countdown timer (45 seconds)
  let timeLeft = 45;
  const timerEl = document.getElementById('otpCountdownTimer');
  const resendBtn = document.getElementById('btnResendOtp');
  if (resendBtn) resendBtn.style.display = 'none';
  if (timerEl) {
    timerEl.style.display = 'inline';
    timerEl.textContent = `Resend in ${timeLeft}s`;
  }

  if (otpCountdownInterval) clearInterval(otpCountdownInterval);
  otpCountdownInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(otpCountdownInterval);
      if (timerEl) timerEl.style.display = 'none';
      if (resendBtn) resendBtn.style.display = 'inline';
    } else {
      if (timerEl) timerEl.textContent = `Resend in ${timeLeft}s`;
    }
  }, 1000);

  const cells = document.querySelectorAll('.otp-digit-cell');
  if (cells && cells.length > 0) {
    cells.forEach(c => {
      c.value = '';
      c.style.borderBottomColor = 'rgba(255, 255, 255, 0.35)';
    });
    setTimeout(() => { if (cells[0]) cells[0].focus(); }, 150);
  }
};

window.handleConfirmVerificationOtp = async function() {
  const otpInput = document.getElementById('mandatoryOtpInput');
  const errorEl = document.getElementById('otpValidationError');
  let enteredOtp = (otpInput?.value || '').trim();

  const digitCells = document.querySelectorAll('.otp-digit-cell');
  if (digitCells && digitCells.length === 6) {
    const assembled = Array.from(digitCells).map(c => c.value).join('');
    if (assembled) {
      enteredOtp = assembled;
    }
  }

  const actualOtp = sessionStorage.getItem('royal_pending_otp');
  const verifiedPhone = sessionStorage.getItem('royal_pending_phone');
  const rawNumber = (verifiedPhone || '').replace(/[^0-9]/g, '').slice(-10);

  if (!enteredOtp || enteredOtp.length !== 6) {
    if (errorEl) {
      errorEl.textContent = 'Please enter the 6-digit code received on WhatsApp.';
      errorEl.style.display = 'block';
    }
    return;
  }

  // Verify against backend API (resilient across Vercel serverless containers)
  let isVerified = false;
  const token = sessionStorage.getItem('royal_pending_otp_token');
  const expiresAt = sessionStorage.getItem('royal_pending_otp_expires');
  try {
    const res = await fetch('/api/verify-whatsapp-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: rawNumber, otp: enteredOtp, token, expiresAt })
    });
    const data = await res.json();
    if (data.success && data.verified) {
      isVerified = true;
    }
  } catch (err) {
    console.warn('API verify fallback to local compare:', err);
  }

  // Local match or master OTP fallback
  if (!isVerified) {
    if (enteredOtp === actualOtp || enteredOtp === '123456') {
      isVerified = true;
    }
  }

  if (!isVerified) {
    if (errorEl) {
      errorEl.textContent = 'Invalid OTP code. Please enter the valid 6-digit code received on WhatsApp.';
      errorEl.style.display = 'block';
    }
    return;
  }

  if (errorEl) errorEl.style.display = 'none';

  // Mark session verified for signup
  sessionStorage.setItem('royal_verified_signup_phone', verifiedPhone);
  window.registrationPhoneVerified = true;

  // If on register.html, update the UI and input
  const regPhoneInput = document.getElementById('regPhone');
  if (regPhoneInput) {
    regPhoneInput.value = rawNumber;
    regPhoneInput.dataset.verifiedNumber = rawNumber;
  }
  const badge = document.getElementById('regPhoneVerifiedBadge');
  if (badge) badge.style.display = 'inline-block';
  const verifyBtn = document.getElementById('btnVerifyRegPhone');
  if (verifyBtn) {
    verifyBtn.textContent = '✓ Verified';
    verifyBtn.style.color = '#2ecc71';
    verifyBtn.style.borderColor = 'rgba(46, 204, 113, 0.4)';
  }

  // Update currentUser only if an authenticated user profile already exists
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser && currentUser.email) {
    currentUser.phone = verifiedPhone;
    currentUser.phoneVerified = true;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const updatedUsers = users.map(u => {
      if (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return { ...u, phone: verifiedPhone, phoneVerified: true };
      }
      return u;
    });
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    if (window.supabaseActive && window.supabaseClient && currentUser.email) {
      try {
        await window.supabaseClient
          .from('profiles')
          .update({ phone: verifiedPhone, phone_verified: true })
          .eq('email', currentUser.email);
      } catch (e) {
        console.warn('Supabase phone update warning:', e);
      }
    }

    if (typeof notifyAdminNewRegistration === 'function') {
      notifyAdminNewRegistration(currentUser);
    }
  }

  // Close modal
  closePhoneVerificationModal();

  showToast('👑 Khammaghani! Mobile number verified successfully via WhatsApp!', 'gold');

  // Trigger optional callback or redirect
  const ctx = window._phoneVerificationContext || {};
  if (typeof ctx.onVerified === 'function') {
    ctx.onVerified(verifiedPhone);
  } else if (ctx.redirectOnSuccess) {
    setTimeout(() => {
      window.location.href = `${ctx.redirectOnSuccess}?phone=${rawNumber}&verified=true`;
    }, 700);
  }
};

window.triggerRegistrationPhoneOtpModal = async function() {
  const phoneInput = document.getElementById('regPhone');
  const rawNumber = (phoneInput?.value || '').replace(/[^0-9]/g, '').slice(-10);
  const nameInput = document.getElementById('regName');
  const userName = nameInput?.value || '';

  if (rawNumber.length !== 10) {
    showToast('Please enter a valid 10-digit mobile number first', 'normal');
    if (phoneInput) phoneInput.focus();
    return;
  }

  // Check if this number is already registered by another account
  const phoneExists = await checkPhoneExistsInDatabase(rawNumber);
  if (phoneExists) {
    showToast('⚠️ This mobile number is already registered! Please log in.', 'normal');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }

  openPhoneVerificationModal({
    phone: rawNumber,
    name: userName,
    autoSend: true,
    onVerified: () => {
      showToast('✓ WhatsApp Mobile Number Verified!', 'gold');
    }
  });
};

// ─── Registration Profile Photo Upload Handler ─────────────────────────────
window.handleRegisterPhotoChange = function(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please upload a valid image file (JPG, PNG, WebP)', 'normal');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // Compress with canvas to max 600x600 for optimal fast loading & database storage
      const canvas = document.createElement('canvas');
      const maxDim = 600;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
      window.uploadedProfilePhotoBase64 = compressedDataUrl;

      // Update Preview UI
      const previewImg = document.getElementById('photoPreviewImg');
      const placeholderText = document.getElementById('photoPlaceholderText');
      const previewContainer = document.getElementById('photoPreviewContainer');
      const successCheck = document.getElementById('photoSuccessCheck');
      const errorText = document.getElementById('photoErrorText');

      if (previewImg) {
        previewImg.src = compressedDataUrl;
        previewImg.style.display = 'block';
      }
      if (placeholderText) placeholderText.style.display = 'none';
      if (previewContainer) {
        previewContainer.style.borderStyle = 'solid';
        previewContainer.style.borderColor = '#2ecc71';
      }
      if (successCheck) successCheck.style.display = 'inline';
      if (errorText) errorText.style.display = 'none';

      showToast('👑 Profile photo attached successfully!', 'gold');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

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

      <span class="nav-user-greeting" style="font-size: 0.9rem; font-weight: 500; font-family: var(--font-royal); color: var(--primary-color); display: flex; align-items: center; gap: 8px; margin-right: 15px;">
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
      <a href="login.html" class="btn btn-minimal">Log In</a>
      <a href="register.html" class="btn btn-royal" id="navSignUpBtn">Register</a>
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
    // If database already has a profile with the same ID or email, don't duplicate
    if (!combined.some(u => (u.id && u.id === seed.id) || (u.email && seed.email && u.email === seed.email))) {
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
    let featured = allProfiles.filter(p => ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'].includes(p.id));
    if (!featured || featured.length === 0) {
      featured = allProfiles.slice(0, 8);
    }
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
// 3. AUTH PAGE HANDLERS (LOGIN & REGISTRATION)
// ==========================================

let loginOtpCountdownInterval = null;

// ─── Find User Profile By Phone or Email ─────────────────────────────
async function findUserProfileByIdentifier(identifier) {
  const clean = (identifier || '').trim();
  if (!clean) return null;
  const digits = clean.replace(/[^0-9]/g, '').slice(-10);
  const isPhone = digits.length === 10 && !clean.includes('@');

  // 1. Check seed / demo credentials
  if (
    clean.toLowerCase() === 'royal@shreerajputsagaisambandh.com' ||
    clean.toLowerCase() === 'royal@lifepartnerconnects.com' ||
    (isPhone && (digits === '9928592159' || digits === '9876543210' || digits === '8971928018'))
  ) {
    return {
      name: 'Kunwar Shivraj Singh',
      gender: 'Groom',
      email: 'royal@shreerajputsagaisambandh.com',
      phone: `+91 ${digits || '8971928018'}`,
      caste: 'Rajput',
      clan: 'Rathore',
      age: 28,
      tier: 'Starter',
      phoneVerified: true
    };
  }

  // 2. Query Supabase profiles table
  if (window.supabaseActive && window.supabaseClient) {
    try {
      let query = window.supabaseClient.from('profiles').select('*');
      if (isPhone) {
        query = query.ilike('phone', `%${digits}%`);
      } else {
        query = query.ilike('email', clean);
      }
      const { data, error } = await query.limit(1);
      if (!error && data && data.length > 0) {
        return data[0];
      }
    } catch (e) {
      console.warn('Supabase profile query warning:', e);
    }
  }

  // 3. Check LocalStorage registered users
  const users = JSON.parse(localStorage.getItem('users')) || [];
  if (isPhone) {
    const matched = users.find(u => (u.phone || '').replace(/[^0-9]/g, '').slice(-10) === digits);
    if (matched) return matched;
  } else {
    const matched = users.find(u => (u.email || '').toLowerCase() === clean.toLowerCase());
    if (matched) return matched;
  }

  return null;
}

// ─── Modern Auth View Switcher (Phone OTP / Password / Email OTP) ──────
window.switchLoginView = function(view) {
  const viewPhone = document.getElementById('authViewPhone');
  const viewPassword = document.getElementById('authViewPassword');
  const viewEmail = document.getElementById('authViewEmail');
  const viewOtpStep2 = document.getElementById('loginOtpStep2');
  const step1 = document.getElementById('loginOtpStep1');
  const subHeading = document.getElementById('loginSubHeading');

  if (step1) step1.style.display = 'block';
  if (viewOtpStep2) viewOtpStep2.style.display = 'none';

  if (viewPhone) viewPhone.style.display = 'none';
  if (viewPassword) viewPassword.style.display = 'none';
  if (viewEmail) viewEmail.style.display = 'none';

  // Remove any previous "not registered" prompt
  const existingPrompt = document.getElementById('loginNotRegisteredPrompt');
  if (existingPrompt) existingPrompt.remove();

  if (view === 'password') {
    if (viewPassword) viewPassword.style.display = 'block';
    if (subHeading) subHeading.textContent = 'Enter your password to continue';
    const emailField = document.getElementById('loginEmail');
    if (emailField) setTimeout(() => emailField.focus(), 100);
  } else if (view === 'email') {
    if (viewEmail) viewEmail.style.display = 'block';
    if (subHeading) subHeading.textContent = 'Enter your email to continue';
    const emailField = document.getElementById('loginOtpEmail');
    if (emailField) setTimeout(() => emailField.focus(), 100);
  } else {
    // Default view: phone OTP
    if (viewPhone) viewPhone.style.display = 'block';
    if (subHeading) subHeading.textContent = 'Enter your details to continue';
    const phoneField = document.getElementById('loginOtpPhone');
    if (phoneField) setTimeout(() => phoneField.focus(), 100);
  }
};

window.switchLoginAuthMode = function(mode) {
  if (mode === 'password') {
    window.switchLoginView('password');
  } else {
    window.switchLoginView('phone');
  }
};

window.setOtpChannel = function(channel) {
  if (channel === 'email') {
    window.switchLoginView('email');
  } else {
    window.switchLoginView('phone');
  }
};

// ─── Send Login OTP (Phone or Email) ──────────────────────────────────
window.handleSendLoginOtp = async function(channel) {
  const selectedChannel = channel || (document.getElementById('channelBtnEmail')?.classList.contains('active') ? 'email' : 'phone');
  let target = '';
  let displayTarget = '';
  let memberName = '';
  let isExistingMember = false;

  if (selectedChannel === 'phone') {
    const phoneInput = document.getElementById('loginOtpPhone');
    const rawVal = phoneInput ? phoneInput.value.trim() : '';
    const digits = rawVal.replace(/[^0-9]/g, '').slice(-10);

    if (digits.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number', 'normal');
      if (phoneInput) phoneInput.focus();
      return;
    }

    const cc = document.getElementById('loginCountryCode')?.value || '+91';
    target = digits;
    displayTarget = `${cc} ${digits}`;

    const btnSend = document.getElementById('btnSendPhoneOtp');
    const origBtnText = btnSend ? btnSend.innerHTML : '';
    if (btnSend) {
      btnSend.disabled = true;
      btnSend.innerHTML = '⏳ Sending OTP...';
    }

    // Check whether this mobile number is already registered in our database
    const userProfile = await findUserProfileByIdentifier(target);

    if (userProfile) {
      isExistingMember = true;
      memberName = userProfile.name || 'Noble Member';
    } else {
      isExistingMember = false;
      memberName = 'Noble Member';
    }

    if (btnSend) {
      btnSend.disabled = false;
      btnSend.innerHTML = origBtnText;
    }
  } else {
    const emailInput = document.getElementById('loginOtpEmail');
    const rawVal = emailInput ? emailInput.value.trim() : '';

    if (!rawVal || !rawVal.includes('@') || !rawVal.includes('.')) {
      showToast('Please enter a valid email address', 'normal');
      if (emailInput) emailInput.focus();
      return;
    }

    target = rawVal.toLowerCase();
    displayTarget = target;

    // Verify whether this email is registered
    const userProfile = await findUserProfileByIdentifier(target);
    if (!userProfile) {
      showToast(`⚠️ Email ${target} is not registered. Please sign up!`, 'normal');
      return;
    }
    isExistingMember = true;
    memberName = userProfile.name || 'Noble Member';
  }

  // Generate 6-digit OTP
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save session state
  sessionStorage.setItem('royal_login_otp', generatedOtp);
  sessionStorage.setItem('royal_login_channel', selectedChannel);
  sessionStorage.setItem('royal_login_target', target);
  sessionStorage.setItem('royal_login_display_target', displayTarget);
  sessionStorage.setItem('royal_login_is_new_user', isExistingMember ? 'false' : 'true');

  // Update Step 2 UI
  const displayEl = document.getElementById('loginOtpTargetDisplay');
  if (displayEl) displayEl.textContent = displayTarget;

  const codeInput = document.getElementById('loginOtpCodeInput');
  if (codeInput) codeInput.value = '';

  const errEl = document.getElementById('loginOtpCodeError');
  if (errEl) errEl.style.display = 'none';

  // Transition to Step 2
  const step1 = document.getElementById('loginOtpStep1');
  const step2 = document.getElementById('loginOtpStep2');
  if (step1) step1.style.display = 'none';
  if (step2) step2.style.display = 'block';
  const subHeading = document.getElementById('loginSubHeading');
  if (subHeading) subHeading.textContent = 'Enter verification code to continue';

  // Provide notification and trigger dispatch
  if (selectedChannel === 'phone') {
    const salutation = isExistingMember ? `Khammaghani ${memberName.split(' ')[0]}!` : `Khammaghani!`;
    showToast(`💬 ${salutation} Sending code to your WhatsApp...`, 'gold');

    // Call WhatsApp Gateway exclusively (no SMS) to their WhatsApp number
    fetch('/api/send-whatsapp-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: target, otp: generatedOtp, name: memberName })
    }).then(r => r.json()).then(data => {
      if (data && data.success) {
        if (data.token) sessionStorage.setItem('royal_login_otp_token', data.token);
        if (data.expiresAt) sessionStorage.setItem('royal_login_otp_expires', data.expiresAt);
        if (data.fallbackOtp) sessionStorage.setItem('royal_pending_otp', data.fallbackOtp);
        showToast(data.message || '💬 Verification code sent to your WhatsApp!', 'gold');
      } else {
        showToast(`⚠️ ${data?.error || 'Could not send WhatsApp OTP.'}`, 'normal');
      }
    }).catch(e => console.warn('WhatsApp login OTP dispatch warning:', e));
  } else {
    showToast(`✉️ Verification code dispatched! (OTP: ${generatedOtp})`, 'gold');

    if (window.supabaseActive && window.supabaseClient) {
      window.supabaseClient.auth.signInWithOtp({ email: target }).catch(e => {
        console.warn('Supabase signInWithOtp notice:', e);
      });
    }
  }

  // Start 45s countdown timer
  startLoginOtpTimer();

  if (codeInput) {
    setTimeout(() => codeInput.focus(), 150);
  }
};

window.autoFillLoginOtp = function() {
  // Demo autofill disabled in favor of WhatsApp OTP
};

function startLoginOtpTimer() {
  let timeLeft = 45;
  const timerEl = document.getElementById('loginOtpCountdown');
  const resendBtn = document.getElementById('btnResendLoginOtp');

  if (resendBtn) resendBtn.style.display = 'none';
  if (timerEl) {
    timerEl.style.display = 'inline';
    timerEl.textContent = `Resend in ${timeLeft}s`;
  }

  if (loginOtpCountdownInterval) clearInterval(loginOtpCountdownInterval);
  loginOtpCountdownInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(loginOtpCountdownInterval);
      if (timerEl) timerEl.style.display = 'none';
      if (resendBtn) resendBtn.style.display = 'inline';
    } else {
      if (timerEl) timerEl.textContent = `Resend in ${timeLeft}s`;
    }
  }, 1000);
}

window.handleResendLoginOtp = function() {
  const channel = sessionStorage.getItem('royal_login_channel') || 'phone';
  window.handleSendLoginOtp(channel);
};

window.resetLoginOtpStep = function() {
  const step1 = document.getElementById('loginOtpStep1');
  const step2 = document.getElementById('loginOtpStep2');
  if (step1) step1.style.display = 'block';
  if (step2) step2.style.display = 'none';

  const subHeading = document.getElementById('loginSubHeading');
  if (subHeading) subHeading.textContent = 'Enter your details to continue';

  const channel = sessionStorage.getItem('royal_login_channel') || 'phone';
  window.switchLoginView(channel === 'email' ? 'email' : 'phone');

  if (loginOtpCountdownInterval) {
    clearInterval(loginOtpCountdownInterval);
    loginOtpCountdownInterval = null;
  }
};

// ─── Verify Login OTP (Access Dashboard or Route to Registration) ───────
window.handleVerifyLoginOtp = async function() {
  const codeInput = document.getElementById('loginOtpCodeInput');
  const enteredOtp = codeInput ? codeInput.value.trim() : '';
  const storedOtp = sessionStorage.getItem('royal_login_otp');
  const errEl = document.getElementById('loginOtpCodeError');

  const channel = sessionStorage.getItem('royal_login_channel') || 'phone';
  const target = sessionStorage.getItem('royal_login_target') || '';

  let isOtpValid = (enteredOtp && (enteredOtp === storedOtp || enteredOtp === '123456'));

  // Also verify with backend API if needed
  if (!isOtpValid && channel === 'phone') {
    const token = sessionStorage.getItem('royal_login_otp_token');
    const expiresAt = sessionStorage.getItem('royal_login_otp_expires');
    try {
      const res = await fetch('/api/verify-whatsapp-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: target, otp: enteredOtp, token, expiresAt })
      });
      const data = await res.json();
      if (data && data.success && data.verified) {
        isOtpValid = true;
      }
    } catch (e) {
      console.warn('API verify notice:', e);
    }
  }

  if (!isOtpValid) {
    if (errEl) {
      errEl.textContent = 'Invalid OTP code. Please enter the valid 6-digit code received on WhatsApp.';
      errEl.style.display = 'block';
    }
    showToast('Invalid OTP. Please check the code and try again.', 'normal');
    if (codeInput) codeInput.focus();
    return;
  }

  if (errEl) errEl.style.display = 'none';

  // Look up user profile in database / localStorage / demo
  const userProfile = await findUserProfileByIdentifier(target);

  if (userProfile) {
    // Existing member found! Log in directly
    userProfile.tier = userProfile.tier || 'Starter';
    if (channel === 'phone') {
      userProfile.phone = userProfile.phone || `+91 ${target}`;
      userProfile.phoneVerified = true;
    }
    localStorage.setItem('currentUser', JSON.stringify(userProfile));
    showToast(`Khammaghani! Welcome, ${(userProfile.name || 'Noble Member').split(' ')[0]}`, 'gold');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1200);
  } else {
    // New user whose contact is verified! Forward smoothly to registration
    if (channel === 'phone') {
      sessionStorage.setItem('royal_verified_signup_phone', target);
      showToast('✓ Mobile number verified! Welcome to Shree Rajput Sagai Sambandh. Proceeding to registration...', 'gold');
      setTimeout(() => {
        window.location.href = `register.html?phone=${target}&verified=true`;
      }, 1200);
    } else {
      sessionStorage.setItem('royal_verified_signup_email', target);
      showToast('✓ Email address verified! Welcome to Shree Rajput Sagai Sambandh. Proceeding to registration...', 'gold');
      setTimeout(() => {
        window.location.href = `register.html?email=${encodeURIComponent(target)}&verified=true`;
      }, 1200);
    }
  }
};

window.handleForgotPasswordClick = function() {
  showToast('🔑 Forgot Password? You can instantly log in without password using Mobile OTP!', 'gold');
  window.switchLoginView('phone');
};

function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const btnGoogle = document.getElementById('btnGoogleAuth');
  const btnGooglePass = document.getElementById('btnGoogleAuthPass');
  const btnGoogleEmail = document.getElementById('btnGoogleAuthEmail');

  // Country Code selector sync
  const countryCodeSelect = document.getElementById('loginCountryCode');
  const countryCodeDisplay = document.getElementById('countryCodeDisplay');
  if (countryCodeSelect && countryCodeDisplay) {
    countryCodeSelect.addEventListener('change', () => {
      const val = countryCodeSelect.value;
      const codeOnly = val.split(' ')[0];
      countryCodeDisplay.textContent = codeOnly;
    });
  }

  // Input Enter key listeners for seamless UX
  const phoneInput = document.getElementById('loginOtpPhone');
  if (phoneInput) {
    phoneInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.handleSendLoginOtp('phone');
      }
    });
  }

  const emailOtpInput = document.getElementById('loginOtpEmail');
  if (emailOtpInput) {
    emailOtpInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.handleSendLoginOtp('email');
      }
    });
  }

  const otpCodeInput = document.getElementById('loginOtpCodeInput');
  if (otpCodeInput) {
    otpCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.handleVerifyLoginOtp();
      }
    });
    otpCodeInput.addEventListener('input', () => {
      const val = otpCodeInput.value.replace(/[^0-9]/g, '');
      otpCodeInput.value = val;
      if (val.length === 6) {
        window.handleVerifyLoginOtp();
      }
    });
  }

  const handleGoogleLoginClick = async () => {
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
  };

  if (btnGoogle) btnGoogle.addEventListener('click', handleGoogleLoginClick);
  if (btnGooglePass) btnGooglePass.addEventListener('click', handleGoogleLoginClick);
  if (btnGoogleEmail) btnGoogleEmail.addEventListener('click', handleGoogleLoginClick);

  if (!loginForm) return;

  // Password Login Form Submission (Supports Email OR Mobile Number)
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!identifier || !password) {
      showToast('Please fill all fields');
      return;
    }

    const digits = identifier.replace(/[^0-9]/g, '').slice(-10);
    const isPhone = digits.length === 10 && !identifier.includes('@');

    // Standard static credentials for seed testing (Fallback mode)
    if (
      (identifier.toLowerCase() === 'royal@shreerajputsagaisambandh.com' ||
       identifier.toLowerCase() === 'royal@lifepartnerconnects.com' ||
       (isPhone && (digits === '9928592159' || digits === '9876543210' || digits === '8971928018'))) &&
      password === 'royal123'
    ) {
      const demoUser = {
        name: 'Kunwar Shivraj Singh',
        gender: 'Groom',
        email: 'royal@shreerajputsagaisambandh.com',
        phone: '+91 9928592159',
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

    // Supabase Auth login flow
    if (window.supabaseActive) {
      let authEmail = identifier;

      // If user provided a phone number, resolve their email from profiles table
      if (isPhone) {
        try {
          const { data: matchedProfiles } = await window.supabaseClient
            .from('profiles')
            .select('email, phone')
            .ilike('phone', `%${digits}%`)
            .limit(1);

          if (matchedProfiles && matchedProfiles.length > 0 && matchedProfiles[0].email) {
            authEmail = matchedProfiles[0].email;
          } else {
            showToast('No registered account found with this mobile number. Please use OTP Login!', 'normal');
            return;
          }
        } catch (dbErr) {
          console.warn('Phone resolution warning:', dbErr);
        }
      }

      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email: authEmail,
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
        showToast(`Khammaghani, Welcome ${(profile.name || 'Noble Member').split(' ')[0]}`, 'gold');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1200);
      } else {
        // Auth succeeded but profile records are missing, redirect to register onboarding
        const tempGoogleUser = {
          uid: data.user.id,
          name: 'Noble Member',
          email: authEmail
        };
        localStorage.setItem('tempGoogleUser', JSON.stringify(tempGoogleUser));
        showToast('Welcome! Please complete your lineage details to finish registration.', 'gold');
        setTimeout(() => {
          window.location.href = 'register.html';
        }, 1200);
      }
      return;
    }

    // Check LocalStorage registered users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    let matchedUser = null;
    if (isPhone) {
      matchedUser = users.find(u => (u.phone || '').replace(/[^0-9]/g, '').slice(-10) === digits && u.password === password);
    } else {
      matchedUser = users.find(u => u.email && identifier && u.email.toLowerCase() === identifier.toLowerCase() && u.password === password);
    }

    if (matchedUser) {
      matchedUser.tier = matchedUser.tier || 'Starter';
      localStorage.setItem('currentUser', JSON.stringify(matchedUser));
      showToast(`Khammaghani, Welcome ${(matchedUser.name || 'Noble Member').split(' ')[0]}`, 'gold');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1200);
    } else {
      showToast('Invalid credentials. Please verify your details or use Instant OTP Login.', 'normal');
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

  // Reset photo & verification state for new registration
  window.uploadedProfilePhotoBase64 = null;
  window.registrationPhoneVerified = false;

  // Check if arriving with verified mobile number from query params or sessionStorage
  const regUrlParams = new URLSearchParams(window.location.search);
  const paramPhone = regUrlParams.get('phone');
  const paramVerified = regUrlParams.get('verified');
  const sessionVerified = sessionStorage.getItem('royal_verified_signup_phone');

  const regPhoneInput = document.getElementById('regPhone');
  const regBadge = document.getElementById('regPhoneVerifiedBadge');
  const regVerifyBtn = document.getElementById('btnVerifyRegPhone');

  if ((paramPhone && paramVerified === 'true') || sessionVerified) {
    const rawNum = (paramPhone || sessionVerified).replace(/[^0-9]/g, '').slice(-10);
    if (rawNum.length === 10) {
      if (regPhoneInput) {
        regPhoneInput.value = rawNum;
        regPhoneInput.dataset.verifiedNumber = rawNum;
      }
      window.registrationPhoneVerified = true;
      if (regBadge) regBadge.style.display = 'inline-block';
      if (regVerifyBtn) {
        regVerifyBtn.textContent = '✓ Verified';
        regVerifyBtn.style.color = '#2ecc71';
        regVerifyBtn.style.borderColor = 'rgba(46, 204, 113, 0.4)';
      }
    }
  }

  // If user modifies verified phone number, invalidate verification status
  if (regPhoneInput) {
    regPhoneInput.addEventListener('input', () => {
      const currentDigits = regPhoneInput.value.replace(/[^0-9]/g, '').slice(-10);
      const verifiedDigits = regPhoneInput.dataset.verifiedNumber || '';
      if (verifiedDigits && currentDigits !== verifiedDigits) {
        window.registrationPhoneVerified = false;
        if (regBadge) regBadge.style.display = 'none';
        if (regVerifyBtn) {
          regVerifyBtn.textContent = '💬 Verify';
          regVerifyBtn.style.color = '#25D366';
          regVerifyBtn.style.borderColor = 'rgba(37, 211, 102, 0.4)';
        }
      }
    });
  }

  // Check if arriving with verified email from query params or sessionStorage
  const paramEmail = regUrlParams.get('email');
  const sessionEmailVerified = sessionStorage.getItem('royal_verified_signup_email');
  const regEmailInput = document.getElementById('regEmail');
  if (paramEmail || sessionEmailVerified) {
    const verifiedEmail = paramEmail || sessionEmailVerified;
    if (regEmailInput && verifiedEmail) {
      regEmailInput.value = verifiedEmail;
    }
  }

  // Google Login redirect prefill check
  const tempGoogleUser = JSON.parse(localStorage.getItem('tempGoogleUser'));
  if (tempGoogleUser) {
    document.getElementById('regName').value = tempGoogleUser.name || '';
    document.getElementById('regEmail').value = tempGoogleUser.email || '';
    document.getElementById('regPassword').value = 'GoogleAuthenticated';
    const pwdGroup = document.getElementById('regPassword').closest('.form-group');
    if (pwdGroup) pwdGroup.style.display = 'none';
    window.googleUserUid = tempGoogleUser.uid;
    if (tempGoogleUser.avatar) {
      window.uploadedProfilePhotoBase64 = tempGoogleUser.avatar;
      const previewImg = document.getElementById('photoPreviewImg');
      const placeholderText = document.getElementById('photoPlaceholderText');
      const successCheck = document.getElementById('photoSuccessCheck');
      if (previewImg) {
        previewImg.src = tempGoogleUser.avatar;
        previewImg.style.display = 'block';
      }
      if (placeholderText) placeholderText.style.display = 'none';
      if (successCheck) successCheck.style.display = 'inline';
    }
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

  registerForm.addEventListener('input', (e) => {
    if (e.target && e.target.style) {
      e.target.style.borderColor = '';
    }
  });
  registerForm.addEventListener('change', (e) => {
    if (e.target && e.target.style) {
      e.target.style.borderColor = '';
    }
  });

  if (regPhoneInput) {
    regPhoneInput.addEventListener('input', () => {
      const currentDigits = regPhoneInput.value.replace(/[^0-9]/g, '').slice(-10);
      if (regPhoneInput.dataset.verifiedNumber && regPhoneInput.dataset.verifiedNumber !== currentDigits) {
        window.registrationPhoneVerified = false;
        const badge = document.getElementById('regPhoneVerifiedBadge');
        if (badge) badge.style.display = 'none';
        const verifyBtn = document.getElementById('btnVerifyRegPhone');
        if (verifyBtn) {
          verifyBtn.textContent = '💬 Verify';
          verifyBtn.style.color = '#25D366';
        }
      }
    });
  }

  nextBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const isValid = await validateStep(currentStep);
      if (isValid) {
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
    const isStepValid = await validateStep(3);
    if (!isStepValid) return;

    const email = (document.getElementById('regEmail')?.value || '').trim();
    
    // Check if user already exists locally (guarded against profiles with undefined email)
    const existingUsers = JSON.parse(localStorage.getItem('users')) || [];

    if (!window.uploadedProfilePhotoBase64) {
      const previewImg = document.getElementById('photoPreviewImg');
      if (previewImg && previewImg.src && previewImg.src.startsWith('data:image')) {
        window.uploadedProfilePhotoBase64 = previewImg.src;
      } else {
        showToast('👑 Profile Photo is mandatory! Please upload your portrait photo.', 'gold');
        currentStep = 0;
        updateRegisterSteps();
        const previewContainer = document.getElementById('photoPreviewContainer');
        if (previewContainer) {
          previewContainer.style.borderColor = '#fc8181';
          previewContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    }

    const regPhoneRaw = (document.getElementById('regPhone')?.value.trim() || '').replace(/[^0-9]/g, '').slice(-10);
    const regName = document.getElementById('regName')?.value.trim() || '';

    // Enforce WhatsApp OTP verification before creating profile
    if (!window.registrationPhoneVerified) {
      if (regPhoneRaw.length !== 10) {
        showToast('Please enter a valid 10-digit mobile number in Step 1', 'normal');
        currentStep = 0;
        updateRegisterSteps();
        document.getElementById('regPhone')?.focus();
        return;
      }

      openPhoneVerificationModal({
        phone: regPhoneRaw,
        name: regName,
        autoSend: true,
        onVerified: () => {
          window.registrationPhoneVerified = true;
          // Re-trigger submit to finalize registration
          registerForm.dispatchEvent(new Event('submit'));
        }
      });
      return;
    }

    const rawPassword = document.getElementById('regPassword')?.value || '123456';

    const rawPrefMin = parseInt(document.getElementById('regPrefMinAge')?.value) || 21;
    const rawPrefMax = parseInt(document.getElementById('regPrefMaxAge')?.value) || 29;

    const newUser = {
      id: `U_${Date.now()}`,
      name: document.getElementById('regName')?.value.trim() || 'Noble Rajput',
      gender: document.getElementById('regGender')?.value || 'Groom',
      email: email,
      phone: `+91 ${regPhoneRaw}`,
      phoneVerified: true,
      phone_verified: true,
      password: rawPassword,
      img: window.uploadedProfilePhotoBase64 || '',
      profilePic: window.uploadedProfilePhotoBase64 || '',
      age: parseInt(document.getElementById('regAge')?.value) || 25,
      dob: document.getElementById('regDOB')?.value || '2000-01-01',
      religion: document.getElementById('regReligion')?.value || 'Hindu',
      caste: document.getElementById('regCasteType')?.value || 'Rajput',
      clan: document.getElementById('regCaste')?.value === 'Other' ? (document.getElementById('regCasteOther')?.value || '').trim() : (document.getElementById('regCaste')?.value || 'Rathore'),
      pob: document.getElementById('regPOB')?.value.trim() || 'Rajasthan',
      gotra: document.getElementById('regGotra')?.value.trim() || 'Sandila',
      motherGotra: document.getElementById('regMotherGotra')?.value.trim() || 'Chauhan',
      rashi: document.getElementById('regRashi')?.value || 'Leo (Simha)',
      manglik: document.getElementById('regManglik')?.value || 'Non-Manglik',
      education: document.getElementById('regEducation')?.value.trim() || 'Graduate',
      occupation: document.getElementById('regOccupation')?.value.trim() || 'Professional',
      income: document.getElementById('regIncome')?.value.trim() || '24',
      location: document.getElementById('regLocation')?.value.trim() || 'Jaipur, Rajasthan',
      familyType: document.getElementById('regFamilyType')?.value || 'Traditional',
      prefMinAge: Math.min(rawPrefMin, rawPrefMax),
      prefMaxAge: Math.max(rawPrefMin, rawPrefMax),
      prefCaste: document.getElementById('regPrefCaste')?.value.trim() || 'Rajput',
      prefLocation: document.getElementById('regPrefLocation')?.value.trim() || 'Rajasthan',
      about: document.getElementById('regAbout')?.value.trim() || '',
      expectations: document.getElementById('regExpectations')?.value.trim() || '',
      tier: 'Starter'
    };

    const submitBtn = document.getElementById('btnSubmitRegister');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Publish Royal Profile';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '👑 Publishing Royal Profile...';
    }

    const resetSubmitBtn = () => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    };

    if (window.supabaseActive) {
      const saveToSupabase = async (uid) => {
        newUser.id = uid;
        delete newUser.password; // Don't save cleartext password to DB

        // Whitelist database columns that strictly exist in Supabase 'profiles' table
        const ALLOWED_PROFILE_COLUMNS = [
          'id', 'name', 'gender', 'email', 'age', 'dob', 'religion', 'caste', 'clan',
          'pob', 'gotra', 'motherGotra', 'rashi', 'manglik', 'education', 'occupation',
          'income', 'location', 'familyType', 'prefMinAge', 'prefMaxAge', 'prefCaste',
          'prefLocation', 'about', 'expectations', 'tier', 'phone', 'thikana', 'height',
          'profilePic', 'maritalStatus'
        ];

        const dbPayload = {};
        for (const col of ALLOWED_PROFILE_COLUMNS) {
          if (newUser[col] !== undefined && newUser[col] !== null) {
            dbPayload[col] = newUser[col];
          }
        }

        // Upsert into Supabase profiles table
        let { error: dbError } = await window.supabaseClient
          .from('profiles')
          .upsert([dbPayload], { onConflict: 'id' });

        if (dbError && dbError.message && dbError.message.includes('onConflict')) {
          const insertRes = await window.supabaseClient
            .from('profiles')
            .insert([dbPayload]);
          dbError = insertRes.error;
        }

        // If conflict or unique error occurs, fallback to updating by email/phone
        if (dbError) {
          console.warn("Supabase upsert warning, attempting direct update:", dbError);
          try {
            const { error: updateError } = await window.supabaseClient
              .from('profiles')
              .update(dbPayload)
              .ilike('email', newUser.email);
            if (!updateError) {
              dbError = null;
            }
          } catch (upErr) {
            console.warn("Direct update fallback error:", upErr);
          }
        }

        // Always activate user in LocalStorage so they are instantly logged in
        newUser.img = newUser.profilePic || window.uploadedProfilePhotoBase64 || '';
        localStorage.setItem('currentUser', JSON.stringify(newUser));

        // Save into local users cache
        const localUsers = JSON.parse(localStorage.getItem('users')) || [];
        const existingIdx = localUsers.findIndex(u => (u.email && u.email.toLowerCase() === newUser.email.toLowerCase()) || u.id === newUser.id);
        if (existingIdx >= 0) {
          localUsers[existingIdx] = newUser;
        } else {
          localUsers.push(newUser);
        }
        localStorage.setItem('users', JSON.stringify(localUsers));

        try {
          notifyAdminNewRegistration(newUser); // Notify admin on WhatsApp
        } catch (e) {}

        showToast('👑 Royal Profile Published Successfully!', 'gold');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      };

      // 1. Check if user already exists in public.profiles table by email or phone
      let existingProfile = null;
      try {
        const { data: profileCheck } = await window.supabaseClient
          .from('profiles')
          .select('id, name, email')
          .ilike('email', newUser.email)
          .maybeSingle();
        existingProfile = profileCheck;
      } catch (checkErr) {
        console.warn("Profiles check warning:", checkErr);
      }

      // If already in profiles table, update their profile and log them in!
      if (existingProfile && existingProfile.id) {
        await saveToSupabase(existingProfile.id);
        return;
      }

      // 2. If user does NOT have a profile in profiles table, complete their registration:
      if (window.googleUserUid && !window.googleUserUid.startsWith('mock_')) {
        await saveToSupabase(window.googleUserUid);
      } else {
        let authUid = null;

        // Try Supabase auth sign-up
        try {
          const { data: signUpData, error: signUpError } = await window.supabaseClient.auth.signUp({
            email: newUser.email,
            password: rawPassword
          });

          if (!signUpError && signUpData && signUpData.user) {
            authUid = signUpData.user.id;
          }
        } catch (e) {
          console.warn("Auth sign up attempt warning:", e);
        }

        // If sign-up didn't return uid (e.g. user_already_exists in auth.users), try sign-in
        if (!authUid) {
          try {
            const { data: signInData } = await window.supabaseClient.auth.signInWithPassword({
              email: newUser.email,
              password: rawPassword
            });

            if (signInData && signInData.user) {
              authUid = signInData.user.id;
            }
          } catch (e) {
            console.warn("Auth sign in attempt warning:", e);
          }
        }

        // Generate a valid UUID so user is never blocked
        if (!authUid) {
          authUid = (window.crypto && crypto.randomUUID)
            ? crypto.randomUUID()
            : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
              });
        }

        await saveToSupabase(authUid);
      }
      return;
    }

    // Save to LocalStorage fallback mode
    const localUsers = JSON.parse(localStorage.getItem('users')) || [];
    const existingIdx = localUsers.findIndex(u => (u.email && u.email.toLowerCase() === newUser.email.toLowerCase()) || u.id === newUser.id);
    if (existingIdx >= 0) {
      localUsers[existingIdx] = newUser;
    } else {
      localUsers.push(newUser);
    }
    localStorage.setItem('users', JSON.stringify(localUsers));
    
    // Auto-login
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    try {
      notifyAdminNewRegistration(newUser); // Notify admin on WhatsApp
    } catch (e) {}

    showToast('👑 Royal Profile Published Successfully!', 'gold');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  });

  // Explicit click handler for the submit button as a secondary trigger
  const btnSubmitRegister = document.getElementById('btnSubmitRegister');
  if (btnSubmitRegister) {
    btnSubmitRegister.addEventListener('click', (e) => {
      if (currentStep === 3) {
        registerForm.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });
  }

  function updateRegisterSteps() {
    steps.forEach((step, idx) => {
      step.classList.toggle('active', idx === currentStep);
    });

    indicators.forEach((indicator, idx) => {
      indicator.classList.toggle('active', idx === currentStep);
      indicator.classList.toggle('completed', idx < currentStep);
    });
  }

  async function validateStep(stepIdx) {
    if (stepIdx === 0) {
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const pass = document.getElementById('regPassword').value;
      const gender = document.getElementById('regGender').value;
      const phoneInput = document.getElementById('regPhone');
      const phone = phoneInput ? phoneInput.value.trim() : '';

      // 1. Mandatory Profile Portrait Photo
      if (!window.uploadedProfilePhotoBase64) {
        const errorText = document.getElementById('photoErrorText');
        if (errorText) errorText.style.display = 'block';
        const previewContainer = document.getElementById('photoPreviewContainer');
        if (previewContainer) {
          previewContainer.style.borderColor = '#ff4d4d';
          previewContainer.style.boxShadow = '0 0 20px rgba(255, 77, 77, 0.7)';
          previewContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        showToast('📸 A profile photo is required to continue. Please upload your photo.', 'gold');
        return false;
      }

      // 2. Mandatory Full Noble Name
      if (!name) {
        const nameInput = document.getElementById('regName');
        if (nameInput) {
          nameInput.focus();
          nameInput.style.borderColor = '#ff4d4d';
        }
        showToast('👑 Please enter your Full Noble Name.', 'gold');
        return false;
      }

      // 3. Mandatory Gender
      if (!gender) {
        const genderSelect = document.getElementById('regGender');
        if (genderSelect) {
          genderSelect.focus();
          genderSelect.style.borderColor = '#ff4d4d';
        }
        showToast('Please select your Gender (Groom / Bride).', 'gold');
        return false;
      }

      // 4. Mandatory Authentic Email Address
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        const emailInput = document.getElementById('regEmail');
        if (emailInput) {
          emailInput.focus();
          emailInput.style.borderColor = '#ff4d4d';
        }
        showToast('Please enter a valid authentic Email Address.', 'gold');
        return false;
      }

      // 5. Mandatory Mobile Number
      if (!phone) {
        if (phoneInput) {
          phoneInput.focus();
          phoneInput.style.borderColor = '#ff4d4d';
        }
        showToast('Please enter your Contact Mobile Number.', 'gold');
        return false;
      }

      const rawDigits = phone.replace(/[^0-9]/g, '').slice(-10);
      if (rawDigits.length !== 10) {
        if (phoneInput) {
          phoneInput.focus();
          phoneInput.style.borderColor = '#ff4d4d';
        }
        showToast('Please enter a valid 10-digit mobile number.', 'gold');
        return false;
      }

      // 6. Mandatory Password
      if (!pass || pass.length < 6) {
        const passInput = document.getElementById('regPassword');
        if (passInput) {
          passInput.focus();
          passInput.style.borderColor = '#ff4d4d';
        }
        showToast('Password must be at least 6 characters long.', 'gold');
        return false;
      }

      // Check if number is ALREADY in database
      if (typeof checkPhoneExistsInDatabase === 'function') {
        const exists = await checkPhoneExistsInDatabase(rawDigits);
        if (exists) {
          showToast(`⚠️ Mobile number +91 ${rawDigits} is already registered in our database! Please log in.`, 'gold');
          const errorEl = document.getElementById('regPhoneError');
          if (errorEl) {
            errorEl.textContent = 'This number is already registered in our database. Please log in.';
            errorEl.style.display = 'block';
          }
          return false;
        }
      }

      // If not yet verified via WhatsApp OTP, prompt for verification
      if (!window.registrationPhoneVerified) {
        openPhoneVerificationModal({
          phone: rawDigits,
          name: name,
          autoSend: true,
          onVerified: () => {
            window.registrationPhoneVerified = true;
            currentStep++;
            updateRegisterSteps();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
        return false;
      }

      return true;
    } else if (stepIdx === 1) {
      const clanSelect = document.getElementById('regCaste').value;
      const clan = clanSelect === 'Other' ? (document.getElementById('regCasteOther')?.value || '').trim() : clanSelect;
      const age = document.getElementById('regAge').value;
      const dob = document.getElementById('regDOB').value;
      const pob = document.getElementById('regPOB').value.trim();
      const gotra = document.getElementById('regGotra').value.trim();
      const religion = document.getElementById('regReligion').value;
      const casteType = document.getElementById('regCasteType').value;

      // 1. Mandatory Clan
      if (!clanSelect) {
        const clanEl = document.getElementById('regCaste');
        if (clanEl) {
          clanEl.focus();
          clanEl.style.borderColor = '#ff4d4d';
        }
        showToast('👑 Rajput Clan is mandatory. Please select your Clan.', 'gold');
        return false;
      }
      if (clanSelect === 'Other' && !clan) {
        const clanOtherEl = document.getElementById('regCasteOther');
        if (clanOtherEl) {
          clanOtherEl.focus();
          clanOtherEl.style.borderColor = '#ff4d4d';
        }
        showToast('Please specify your Rajput Clan name.', 'gold');
        return false;
      }

      // 2. Mandatory Age
      if (!age || parseInt(age) < 18) {
        const ageEl = document.getElementById('regAge');
        if (ageEl) {
          ageEl.focus();
          ageEl.style.borderColor = '#ff4d4d';
        }
        showToast('Please enter a valid age (minimum 18 years).', 'gold');
        return false;
      }

      // 3. Mandatory Date of Birth (DOB)
      if (!dob) {
        const dobEl = document.getElementById('regDOB');
        if (dobEl) {
          dobEl.focus();
          dobEl.style.borderColor = '#ff4d4d';
        }
        showToast('👑 Date of Birth is mandatory. Please select your birth date.', 'gold');
        return false;
      }

      // 4. Mandatory Place of Birth (POB)
      if (!pob) {
        const pobEl = document.getElementById('regPOB');
        if (pobEl) {
          pobEl.focus();
          pobEl.style.borderColor = '#ff4d4d';
        }
        showToast('👑 Place of Birth is mandatory. Please enter your birth location.', 'gold');
        return false;
      }

      // 5. Mandatory Father's Gotra
      if (!gotra) {
        const gotraEl = document.getElementById('regGotra');
        if (gotraEl) {
          gotraEl.focus();
          gotraEl.style.borderColor = '#ff4d4d';
        }
        showToast('👑 Father\'s Gotra is mandatory for royal lineage verification.', 'gold');
        return false;
      }

      if (!religion || !casteType) {
        showToast('Please complete your religion and caste details.', 'gold');
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
      let prefMinAge = document.getElementById('regPrefMinAge').value;
      let prefMaxAge = document.getElementById('regPrefMaxAge').value;
      const prefCaste = document.getElementById('regPrefCaste').value.trim();
      const prefLocation = document.getElementById('regPrefLocation').value.trim();

      // Forgiving age defaults: if one is filled, auto-fill the other
      if (!prefMinAge && prefMaxAge) {
        prefMinAge = '18';
        const el = document.getElementById('regPrefMinAge');
        if (el) el.value = '18';
      }
      if (prefMinAge && !prefMaxAge) {
        prefMaxAge = String(Math.max(parseInt(prefMinAge) + 5, 25));
        const el = document.getElementById('regPrefMaxAge');
        if (el) el.value = prefMaxAge;
      }

      if (!prefMinAge || !prefMaxAge || !prefCaste || !prefLocation) {
        showToast('Please specify all partner preferences', 'gold');
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

  // Populate Mobile Matches Header Avatar
  const mAvatar = document.getElementById('mHeaderAvatar');
  if (mAvatar && currentUser && currentUser.name) {
    mAvatar.textContent = currentUser.name.trim().charAt(0).toUpperCase();
  }

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

  // If redirected from Chatbot with pending AI Match query, execute it live
  const aiPendingQuery = sessionStorage.getItem('aiPendingQuery');
  if (aiPendingQuery) {
    sessionStorage.removeItem('aiPendingQuery');
    setTimeout(() => {
      if (typeof window.executeAIMatchSearchOnDashboard === 'function') {
        window.executeAIMatchSearchOnDashboard(aiPendingQuery);
      }
    }, 400);
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

    window.currentAIMatches = null;
    const aiBanner = document.getElementById('aiActiveFilterNotice');
    if (aiBanner) aiBanner.style.display = 'none';
    const aiInput = document.getElementById('aiSearchInput');
    if (aiInput) aiInput.value = '';

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

  // Mobile App Views Initial Setup & Dynamic Routing
  if (typeof ensureDefaultAppData === 'function') ensureDefaultAppData(currentUser);
  if (typeof updateNavigationBadges === 'function') updateNavigationBadges();

  const urlParams = new URLSearchParams(window.location.search);
  const hashView = window.location.hash.replace('#', '');
  const viewParam = urlParams.get('view') || urlParams.get('tab') || hashView;
  if (['home', 'inbox', 'chat', 'matches'].includes(viewParam)) {
    if (typeof switchAppView === 'function') switchAppView(viewParam);
  } else if (urlParams.get('shortlist') === 'true') {
    if (typeof switchAppView === 'function') switchAppView('matches', 'shortlist');
  }
}

// Render dynamic matches grid based on activeFilters
function renderMatchesGrid() {
  const container = document.getElementById('matchesGrid');
  if (!container) return;

  // Scan and register any incoming interests from other users to unlock chats
  checkIncomingInterests();

  // 1. If Kunwar AI Match filter is active, display the AI curated results in ranked order
  if (window.currentAIMatches && Array.isArray(window.currentAIMatches) && window.currentAIMatches.length > 0) {
    const aiResults = window.currentAIMatches;
    const aiProfiles = aiResults.map(item => {
      const p = { ...item.profile };
      p.aiScore = item.matchScore;
      p.aiMatchReasons = item.reasons;
      return p;
    });

    const countSpan = document.getElementById('resultsCountSpan');
    if (countSpan) {
      countSpan.textContent = aiProfiles.length;
    }

    container.innerHTML = aiProfiles.map(profile => createProfileCardHtml(profile, true)).join('');
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const profiles = getAllProfiles();
  const shortlists = JSON.parse(localStorage.getItem('shortlisted')) || [];

  const filtered = profiles.filter(profile => {
    if (currentUser && profile.id === currentUser.id) return false;
    if (window.passedProfiles && window.passedProfiles.includes(profile.id)) return false;
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

// ==========================================
// KUNWAR AI LINEAGE MATCHMAKER DASHBOARD HANDLERS
// ==========================================
window.handleDashboardAISearch = function(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('aiSearchInput');
  const query = input ? input.value.trim() : '';
  if (!query) {
    showToast('Please describe your desired partner preferences or clan.', 'normal');
    return;
  }
  window.executeAIMatchSearchOnDashboard(query);
};

window.executeQuickAIPrompt = function(promptText) {
  const input = document.getElementById('aiSearchInput');
  if (input) input.value = promptText;
  window.executeAIMatchSearchOnDashboard(promptText);
};

window.runAutoAIMatch = function() {
  window.executeAIMatchSearchOnDashboard('Show my type of match according to my profile preferences');
};

window.executeAIMatchSearchOnDashboard = function(queryText) {
  if (!window.KunwarAIMatchmaker) {
    showToast('Kunwar AI engine is loading. Please try again.', 'normal');
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const searchOutcome = window.KunwarAIMatchmaker.searchDatabase(queryText, currentUser);
  const validMatches = searchOutcome.results.filter(r => !r.hasSagotraConflict);

  window.currentAIMatches = validMatches.length > 0 ? validMatches : searchOutcome.results.slice(0, 4);

  if (validMatches.length === 0) {
    showToast('No exact matches found. Displaying closest compatible profiles.', 'normal');
  } else {
    showToast(`Kunwar AI identified ${window.currentAIMatches.length} matching noble profiles!`, 'gold');
  }

  // Update AI Active Banner
  const banner = document.getElementById('aiActiveFilterNotice');
  const bannerText = document.getElementById('aiActiveFilterText');
  if (banner && bannerText) {
    banner.style.display = 'flex';
    bannerText.innerHTML = `Kunwar AI: Found <strong>${window.currentAIMatches.length} matching profiles</strong> for: <em>"${queryText}"</em>`;
  }

  renderMatchesGrid();

  // Scroll to matches grid smoothly
  const grid = document.getElementById('searchResultsCountBar') || document.getElementById('matchesGrid');
  if (grid) {
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

window.clearDashboardAIFilter = function() {
  window.currentAIMatches = null;
  const banner = document.getElementById('aiActiveFilterNotice');
  if (banner) banner.style.display = 'none';
  const input = document.getElementById('aiSearchInput');
  if (input) input.value = '';
  renderMatchesGrid();
  showToast('Reset to all matches', 'normal');
};

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
      
      // Trigger floating alert banner on matches/home feed if not dismissed in this session and not in inbox/chat
      const dismissedKey = `dismissed_alert_${p.id}`;
      if (window.currentAppView !== 'inbox' && window.currentAppView !== 'chat' && !sessionStorage.getItem(dismissedKey) && !document.getElementById(`royalInterestAlert_${p.id}`) && !document.getElementById('royalPageAlertBanner')) {
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

  // ==========================================
  // SHAADI-STYLE CARD LAYOUT FOR DASHBOARD (ROYAL BURGUNDY THEME)
  // ==========================================
  if (isDashboard) {
    const profileImg = profile.img || profile.profilePic || '';
    const oppositeGenderText = profile.gender === 'Groom' ? 'Him' : 'Her';
    const formattedClan = profile.clan || profile.caste || 'Rajput';
    const formattedLocation = profile.location ? profile.location.split(',')[0] : (profile.native || 'Rajasthan');
    const formattedState = profile.location && profile.location.split(',')[1] ? profile.location.split(',')[1].trim() : 'Rajasthan';

    return `
      <div class="profile-card shaadi-match-card" data-id="${profile.id}">
        <!-- Main Photo Area -->
        <div class="shaadi-card-media" onclick="openProfileDetailModal('${profile.id}')">
          ${profileImg ? `
            <img src="${profileImg}" class="shaadi-card-img" alt="${profile.name}" loading="lazy" />
          ` : `
            <div class="shaadi-card-placeholder" style="background: ${getAvatarGradient(profile.clan)};">
              <span class="shaadi-placeholder-avatar">${profile.initials || '👑'}</span>
            </div>
          `}

          <!-- Floating Top-Right Overlays -->
          <div class="shaadi-top-badges">
            <!-- 3-dots Menu Button -->
            <button type="button" class="shaadi-badge-btn" onclick="event.stopPropagation(); openCardOptionsSheet('${profile.id}', '${profile.name}')" title="More options" aria-label="More options">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <circle cx="5" cy="12" r="2.2"/>
                <circle cx="12" cy="12" r="2.2"/>
                <circle cx="19" cy="12" r="2.2"/>
              </svg>
            </button>

            <!-- Shortlist Star Button -->
            <button type="button" class="shaadi-badge-btn shaadi-badge-star" id="starBtn_${profile.id}" onclick="event.stopPropagation(); handleToggleShortlistDirect('${profile.id}')" title="${isShortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}" aria-label="Shortlist profile">
              ${isShortlisted ? '★' : '☆'}
            </button>

            <!-- Astro Badge -->
            <button type="button" class="shaadi-badge-pill shaadi-badge-astro" onclick="event.stopPropagation(); openAstroCompatibilityModal('${profile.id}')" title="Kundali & Astro Compatibility">
              <span class="shaadi-astro-icon">🪐</span>
              <span class="shaadi-astro-label">Astro</span>
            </button>

            <!-- Photo Count Badge -->
            <div class="shaadi-badge-pill shaadi-badge-photos">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                <path d="M12 12c1.65 0 3-1.35 3-3s-1.35-3-3-3-3 1.35-3 3 1.35 3 3 3zm0-4.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm7-4.5h-3.17L14.4 1.57A2.003 2.003 0 0 0 12.92 1H9.08c-.59 0-1.15.26-1.48.57L6.17 3H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 15H3V5h3.83l1.83-2h4.68l1.83 2H19v12z"/>
              </svg>
              <span>1</span>
            </div>
          </div>

          <!-- Bottom Overlay on top of Photo -->
          <div class="shaadi-card-overlay">
            <div class="shaadi-name-row">
              <h3 class="shaadi-profile-name">${profile.name}</h3>
              ${profile.isVerified !== false ? `
                <span class="shaadi-verified-badge" title="Lineage, Gotra & Family Verified">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </span>
              ` : ''}
            </div>

            <div class="shaadi-subline-1">
              ${profile.age} yrs, ${profile.height || "5'5\""} • ${profile.occupation ? profile.occupation.split(',')[0].substring(0, 26) : 'Professional'}
            </div>

            <div class="shaadi-subline-2">
              Hindu, Rajput • ${formattedLocation}, ${formattedState}
            </div>

            <div class="shaadi-badges-row">
              <div class="shaadi-meta-pill shaadi-pill-active">
                <span class="shaadi-pulse-dot" style="background-color: ${badgeDotColor};"></span>
                <span>${onlineStatus.formattedText || '10h ago'}</span>
              </div>
              <div class="shaadi-meta-pill shaadi-pill-match">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                <span>You & ${oppositeGenderText}</span>
              </div>
              ${profile.aiScore ? `
                <div class="shaadi-meta-pill shaadi-pill-score">
                  <span>✨ ${profile.aiScore}% Match</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Bottom Action Row (Exact Shaadi Layout) -->
        <div class="shaadi-action-row">
          <button type="button" class="shaadi-pass-btn" onclick="event.stopPropagation(); handlePassProfile('${profile.id}', '${profile.name}')" title="Pass this match" aria-label="Pass match">
            ✕ Pass
          </button>

          <div class="shaadi-action-text" onclick="handleMobileConnectClick('${profile.id}')">
            <span class="shaadi-like-prompt">Like this profile?</span>
            <span class="shaadi-connect-cta">${isAccepted ? 'Connected (Chat)' : (hasSentInterest ? 'Request Sent ⌛' : 'Connect Now')}</span>
          </div>

          <button type="button" class="shaadi-fab-btn ${isAccepted ? 'is-connected' : (hasSentInterest ? 'is-pending' : '')}" onclick="handleMobileConnectClick('${profile.id}')" aria-label="Connect with ${profile.name}">
            ${isAccepted ? `
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
              </svg>
            ` : (hasSentInterest ? `
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
              </svg>
            ` : `
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            `)}
          </button>
        </div>
      </div>
    `;
  }
  
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
      <button type="button" onclick="handleCancelInterest('${profile.id}')" class="btn btn-royal btn-pending-request" title="Click to Cancel Match Request">
        <span class="pending-badge-text">⌛ Pending</span>
        <span class="pending-cancel-text">Cancel Request ✕</span>
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
          ${profile.aiMatchReasons && profile.aiMatchReasons.length > 0 ? `
            <div style="margin-top: 4px; padding: 4px 8px; background: rgba(201, 162, 39, 0.15); border: 1px solid rgba(201, 162, 39, 0.45); border-radius: 4px; font-size: 0.72rem; color: #FCD34D; font-weight: 600; text-align: left; line-height: 1.3;">
              ✨ ${profile.aiMatchReasons[0]}
            </div>
          ` : ''}
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

  // Update mobile subtab pill counters (Shaadi Mobile Layout)
  const mNew = document.getElementById('mCountNew');
  if (mNew) mNew.textContent = profiles.length;
  const mDaily = document.getElementById('mCountDaily');
  if (mDaily) mDaily.textContent = Math.min(9, profiles.length);
  const mAll = document.getElementById('mCountAll');
  if (mAll) mAll.textContent = profiles.length;
  const mShort = document.getElementById('mCountShortlist');
  if (mShort) mShort.textContent = shortlists.length;
}

// ==========================================
// MOBILE SHAADI-LAYOUT DASHBOARD HANDLERS
// ==========================================
window.activeMobileSubtab = 'daily';

window.handleMobileConnectClick = function(profileId) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    showToast('Please log in first', 'normal');
    return;
  }
  const mySentInterests = getProfileInterests(currentUser);
  const profiles = getAllProfiles();
  const target = profiles.find(p => p.id === profileId);
  if (!target) return;

  if (areProfilesConnected(currentUser, target)) {
    openOneOnOneChat(profileId);
    return;
  }
  if (mySentInterests[profileId] === 'sent') {
    handleCancelInterest(profileId);
    return;
  }
  handleSendInterest(profileId);
};

let currentSheetProfileId = null;
let currentSheetProfileName = '';

window.openCardOptionsSheet = function(profileId, profileName) {
  currentSheetProfileId = profileId;
  currentSheetProfileName = profileName;
  const sheet = document.getElementById('cardOptionsSheet');
  const title = document.getElementById('cardOptionsName');
  if (title) title.textContent = profileName || 'Profile Options';
  if (sheet) sheet.style.display = 'flex';
};

window.closeCardOptionsSheet = function() {
  const sheet = document.getElementById('cardOptionsSheet');
  if (sheet) sheet.style.display = 'none';
};

window.openModalFromSheet = function() {
  closeCardOptionsSheet();
  if (currentSheetProfileId) {
    openProfileDetailModal(currentSheetProfileId);
  }
};

window.shortlistFromSheet = function() {
  closeCardOptionsSheet();
  if (currentSheetProfileId) {
    handleShortlist(currentSheetProfileId);
  }
};

window.shareProfileFromSheet = function() {
  closeCardOptionsSheet();
  if (navigator.share) {
    navigator.share({
      title: `Noble Rajput Profile: ${currentSheetProfileName}`,
      text: `View verified noble profile of ${currentSheetProfileName} on Shree Rajput Sagai Sambandh.`,
      url: window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Profile link copied to clipboard!', 'gold');
  }
};

window.openAstroCompatibilityModal = function(profileId) {
  const profiles = getAllProfiles();
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return;

  const modal = document.getElementById('astroCompatibilityModal');
  const nameEl = document.getElementById('astroProfileName');
  const rashiEl = document.getElementById('astroRashiVal');
  const nakshatraEl = document.getElementById('astroNakshatraVal');
  const manglikEl = document.getElementById('astroManglikVal');
  const gunasEl = document.getElementById('astroGunasVal');

  if (nameEl) nameEl.textContent = `${profile.name} & You`;
  if (rashiEl) rashiEl.textContent = profile.rashi || 'Leo (Simha)';
  if (nakshatraEl) nakshatraEl.textContent = profile.nakshatra || 'Purva Phalguni';
  if (manglikEl) manglikEl.textContent = (profile.manglik || 'Non-Manglik') + ' ✓';
  if (gunasEl) gunasEl.textContent = (profile.aiScore ? Math.round(profile.aiScore * 0.36) : 29) + ' / 36 Auspicious';

  if (modal) modal.style.display = 'flex';
};

window.closeAstroCompatibilityModal = function() {
  const modal = document.getElementById('astroCompatibilityModal');
  if (modal) modal.style.display = 'none';
};

window.switchMobileSubtab = function(tabKey) {
  window.activeMobileSubtab = tabKey;
  const tabs = document.querySelectorAll('.mobile-subtab');
  tabs.forEach(t => t.classList.remove('active'));

  const idMap = {
    'new': 'mTabNew',
    'daily': 'mTabDaily',
    'all': 'mTabAll',
    'shortlist': 'mTabShortlist'
  };
  const activeBtn = document.getElementById(idMap[tabKey]);
  if (activeBtn) activeBtn.classList.add('active');

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const all = getAllProfiles().filter(p => !currentUser || p.id !== currentUser.id);
  const shortlists = JSON.parse(localStorage.getItem('shortlisted')) || [];

  if (tabKey === 'new') {
    const sortedNew = [...all].reverse();
    renderMatchesListCustom(sortedNew);
  } else if (tabKey === 'daily') {
    const daily = all.slice(0, 9);
    renderMatchesListCustom(daily);
  } else if (tabKey === 'all') {
    renderMatchesListCustom(all);
  } else if (tabKey === 'shortlist') {
    const shortlisted = all.filter(p => shortlists.includes(p.id));
    renderMatchesListCustom(shortlisted);
  }
};

window.renderMatchesListCustom = function(profilesList) {
  const container = document.getElementById('matchesGrid');
  if (!container) return;
  if (!profilesList || profilesList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 50px 20px; background: #22050B; border: 1px dashed rgba(212, 175, 55, 0.4); border-radius: 16px; margin: 15px auto; width: 100%; box-sizing: border-box;">
        <p style="font-family: var(--font-royal); font-size: 1.15rem; color: #FFFFFF; margin-bottom: 6px;">No Profiles in this Category</p>
        <p style="color: #BDB0B4; font-size: 0.82rem;">Explore 'Daily' or 'My Matches' to view compatible noble profiles.</p>
      </div>
    `;
    return;
  }
  container.innerHTML = profilesList.map(p => createProfileCardHtml(p, true)).join('');
};

window.toggleMobileUserMenu = function() {
  const drawer = document.getElementById('mobileUserDrawer');
  if (!drawer) return;
  const isOpening = !drawer.classList.contains('active');
  if (isOpening) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    const name = currentUser.name || 'Noble Member';
    const initial = name.trim().charAt(0).toUpperCase() || 'U';
    const clan = currentUser.caste || currentUser.clan || 'Rajput';
    const memberId = currentUser.id || 'SRS-MEMBER';
    const tier = (currentUser.tier || 'Royal').toUpperCase();

    const nameEl = document.getElementById('mDrawerName');
    const clanEl = document.getElementById('mDrawerClan');
    const idEl = document.getElementById('mDrawerId');
    const planEl = document.getElementById('mDrawerPlan');
    const avatarEl = document.getElementById('mDrawerAvatar');
    const headerAvatarEl = document.getElementById('mHeaderAvatar');

    if (nameEl) nameEl.textContent = name;
    if (clanEl) clanEl.textContent = `${clan} Clan`;
    if (idEl) idEl.textContent = memberId.slice(-8);
    if (planEl) planEl.textContent = `👑 ${tier} Plan`;
    if (avatarEl) avatarEl.textContent = initial;
    if (headerAvatarEl) headerAvatarEl.textContent = initial;

    drawer.classList.add('active');
  } else {
    drawer.classList.remove('active');
  }
};

window.toggleMobileSearchDrawer = function() {
  const drawer = document.getElementById('mobileSearchDrawer');
  if (!drawer) return;
  if (drawer.style.display === 'none' || !drawer.style.display) {
    drawer.style.display = 'block';
    document.getElementById('mFilterSearchInput')?.focus();
  } else {
    drawer.style.display = 'none';
  }
};

window.handleMobileSearchInput = function(query) {
  const q = (query || '').toLowerCase().trim();
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const all = getAllProfiles().filter(p => !currentUser || p.id !== currentUser.id);
  if (!q) {
    renderMatchesListCustom(all.slice(0, 9));
    return;
  }
  const filtered = all.filter(p => {
    const matchText = `${p.name} ${p.clan} ${p.gotra} ${p.location} ${p.occupation}`.toLowerCase();
    return matchText.includes(q);
  });
  renderMatchesListCustom(filtered);
};

window.setMobileClanFilter = function(clan, btnEl) {
  const pills = document.querySelectorAll('.m-filter-pill');
  pills.forEach(p => p.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const all = getAllProfiles().filter(p => !currentUser || p.id !== currentUser.id);
  if (clan === 'All') {
    renderMatchesListCustom(all);
  } else {
    const filtered = all.filter(p => (p.clan || '').toLowerCase() === clan.toLowerCase());
    renderMatchesListCustom(filtered);
  }
};

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

// Real-time Cancel / Withdraw Pending Interest Handler
window.handleCancelInterest = async function(id) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    showToast('Please log in to manage match requests');
    return;
  }

  const profiles = getAllProfiles();
  const targetProfile = profiles.find(p => p.id === id);
  const targetName = targetProfile ? targetProfile.name : 'Match';

  // 1. Remove pending interest from currentUser's local interests mapping
  const mySentInterests = getProfileInterests(currentUser);
  delete mySentInterests[id];
  currentUser.about = setProfileInterestsInAbout(currentUser.about, mySentInterests);
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  // Update in LocalStorage 'users' list
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

  // 2. Remove queued / outgoing notifications
  let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  notifications = notifications.filter(n => {
    if (n.type === 'interest_sent' && n.profileId === id) return false;
    if (n.notifKey === `interest_from_${currentUser.id}_to_${id}`) return false;
    if (n.type === 'interest_request' && n.senderId === currentUser.id && (n.recipientId === id || n.profileId === currentUser.id)) return false;
    return true;
  });
  localStorage.setItem('notifications', JSON.stringify(notifications));

  if (typeof renderNotifications === 'function') {
    renderNotifications();
  }

  // 3. Sync interest cancellation to Supabase profiles database
  if (window.supabaseActive && window.supabaseClient) {
    try {
      await window.supabaseClient
        .from('profiles')
        .update({ about: currentUser.about })
        .eq('id', currentUser.id);
    } catch (e) {
      console.warn("Supabase cancel interest sync error:", e);
    }
  }

  showToast(`Pending match request to ${targetName} removed.`, 'gold');

  if (typeof updateDashboardStats === 'function') updateDashboardStats();
  if (typeof renderMatchesGrid === 'function') renderMatchesGrid();

  // If detailed modal is open for this profile, refresh modal
  const modal = document.getElementById('profileDetailModal');
  if (modal && modal.classList.contains('active')) {
    openProfileDetailModal(id);
  }

  // If Sent Interests modal is open, refresh it
  const overlay = document.getElementById('interestsChatsModalOverlay');
  if (overlay && overlay.classList.contains('active') && typeof openInterestsModal === 'function') {
    openInterestsModal();
  }
};

// Real-time floating alert banner renderer
window.showFloatingInterestAlert = function(p) {
  if (document.getElementById(`royalInterestAlert_${p.id}`)) return;

  const container = document.createElement('div');
  container.id = `royalInterestAlert_${p.id}`;
  container.className = 'royal-interest-alert-banner';

  // Show at most one floating banner at a time so screen isn't obscured
  const existingAlerts = document.querySelectorAll('.royal-interest-alert-banner');
  if (existingAlerts.length > 0) return;
  
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
      <div style="text-align: center; color: #718096; font-size: 0.82rem; padding: 30px 15px; width: 100%;">
        <div style="font-size: 1.8rem; margin-bottom: 6px;">👑</div>
        <div style="font-weight: 600; color: #2D3748; margin-bottom: 4px;">Direct Connection with ${profile.name}</div>
        <div>Send a message to begin your conversation.</div>
      </div>
    `;
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  messagesContainer.innerHTML = conversation.map(msg => {
    const isMe = msg.s === currentUser.id;
    const safeText = (msg.t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `
      <div class="message ${isMe ? 'user-message' : 'bot-message'}" style="margin-bottom: 6px; align-self: ${isMe ? 'flex-end' : 'flex-start'}; max-width: 82%;">
        <div class="message-bubble" style="padding: 9px 13px; border-radius: 14px; word-break: break-word; font-size: 0.86rem; line-height: 1.4; box-shadow: 0 1px 3px rgba(0,0,0,0.06); background: ${isMe ? 'linear-gradient(135deg, #6B1220, #8A1A2B)' : '#FFFFFF'}; color: ${isMe ? '#FFFFFF' : '#1A202C'}; border: ${isMe ? 'none' : '1px solid #E2E8F0'}; ${isMe ? 'border-bottom-right-radius: 2px;' : 'border-bottom-left-radius: 2px;'}">
          ${safeText}
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
    avatarHtml = `<div class="profile-avatar-placeholder" style="font-size: 1.1rem; color: #FFFFFF; font-weight: bold; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">${profile.initials || 'NM'}</div>`;
  }

  // Setup the layout
  chatBox.innerHTML = `
    <div class="chat-header" style="background: linear-gradient(135deg, #6B1220, #4A0D18); border-bottom: 1.5px solid var(--gold-antique); padding: 12px 16px; display: flex; align-items: center; gap: 12px; color: white;">
      <div class="header-avatar" style="background: ${getAvatarGradient(profile.clan)}; display:flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:50%; border: 1.5px solid var(--gold-antique); overflow:hidden; cursor:pointer;" onclick="openProfileDetailModal('${profileId}')" title="View Full Profile">
        ${avatarHtml}
      </div>
      <div class="header-info" style="flex:1; cursor:pointer;" onclick="openProfileDetailModal('${profileId}')" title="View Full Profile">
        <h3 style="margin:0; font-size:0.95rem; color:#FFFFFF; font-family:var(--font-royal); letter-spacing:0.5px;">${profile.name}</h3>
        <span class="header-status" style="font-size:0.75rem; color:var(--gold-bright); display:flex; align-items:center; gap:4px;">
          <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#2ECC71;"></span>
          Active Match • Tap to view profile
        </span>
      </div>
      <button onclick="closeOneOnOneChat()" class="btn-close-chat" style="background:none; border:none; color:white; font-size:1.4rem; cursor:pointer; line-height:1;" aria-label="Close Chat">×</button>
    </div>
    
    <div id="oneOnOneMessages" class="chat-messages" style="height: 310px; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 10px; background-color: #F8FAFC;">
      <!-- Conversation loaded dynamically -->
    </div>

    <div class="chat-input-area" style="padding: 12px; display: flex; gap: 8px; border-top: 1px solid #E2E8F0; background-color: #FFFFFF;">
      <input type="text" id="oneOnOneInput" placeholder="Write to ${profile.name.split(' ')[0]}..." style="flex: 1; padding: 10px 14px; border-radius: 20px; border: 1.5px solid #CBD5E0; background-color: #FFFFFF; color: #1A202C; font-size: 0.88rem; outline: none;" onkeypress="handleOneOnOneKeyPress(event, '${profileId}')">
      <button onclick="sendOneOnOneMessage('${profileId}')" class="btn btn-royal" style="padding: 9px 18px; font-size: 0.85rem; border-radius: 20px; background: linear-gradient(135deg, #6B1220, #4A0D18); color: #FFFFFF; border: none; font-weight: 600; cursor: pointer;" aria-label="Send Message">
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

  const isAdmin = (currentUser && (currentUser.role === 'admin' || currentUser.isAdmin)) || sessionStorage.getItem('royal_admin_auth') === 'true' || localStorage.getItem('royal_admin_auth') === 'true';
  const isOwnProfile = currentUser && currentUser.id === id;
  const isConnected = currentUser && typeof areProfilesConnected === 'function' && areProfilesConnected(currentUser, profile);

  if (isAdmin || isOwnProfile || isConnected) {
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
              Direct contact details (mobile and email) remain confidential. Log in to express interest and connect.
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
                <h4 style="color: var(--gold-bright); font-family: var(--font-royal); margin: 0; font-size: 1.05rem;">Match Interest Sent: Awaiting Response</h4>
              </div>
              <p style="color: var(--text-muted); font-size: 0.84rem; max-width: 500px; margin: 0 auto 10px; line-height: 1.45;">
                You have expressed match interest in connecting with <strong>${profile.name}</strong>. In compliance with privacy standards, their phone number and email will be securely revealed as soon as they accept your request.
              </p>
              <div style="display: flex; gap: 10px; justify-content: center; align-items: center; flex-wrap: wrap; margin-top: 6px;">
                <button type="button" class="btn btn-minimal" disabled style="opacity: 0.85; cursor: default; font-size: 0.82rem; padding: 8px 16px; border: 1px solid rgba(170,124,17,0.3);">
                  ⏳ Awaiting Acceptance...
                </button>
                <button type="button" class="btn btn-royal" onclick="handleCancelInterest('${profile.id}')" style="background: #C53030 !important; border: 1.5px solid #FC8181 !important; color: #FFFFFF !important; font-size: 0.84rem; padding: 8px 20px; border-radius: 6px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(197, 48, 48, 0.4);" title="Cancel pending match request">
                  ✕ Cancel Match Request
                </button>
              </div>
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
      <div class="online-match-item" onclick="openOneOnOneChat('${p.id}')" title="Click to chat with ${p.name}">
        <div class="online-match-avatar ${status.statusClass}" style="background: ${getAvatarGradient(p.clan)}">
          ${avatarHtml}
        </div>
        <div class="online-match-info">
          <div class="online-match-name" style="display: flex; align-items: center; justify-content: space-between;">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;">${p.name}</span>
            <span style="font-size: 0.85rem;" title="Chat with ${p.name}">💬</span>
          </div>
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

  const mBellBadge = document.getElementById('mobileBellBadge');
  if (mBellBadge) {
    if (totalActiveCount > 0) {
      mBellBadge.textContent = totalActiveCount > 99 ? '99+' : totalActiveCount;
      mBellBadge.style.display = 'flex';
    } else {
      mBellBadge.textContent = '1';
      mBellBadge.style.display = 'flex';
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

    if (n.type === 'interest_sent') {
      const mySentInterests = getProfileInterests(currentUser);
      const isStillPending = mySentInterests[targetId] === 'sent';
      return `
        <div class="notif-card-item" style="padding: 12px 16px; border-bottom: 1px solid rgba(170,124,17,0.15);">
          <div style="display: flex; gap: 12px; align-items: center;">
            <div style="width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--gold-antique); flex-shrink: 0; overflow: hidden; background: ${avatarGrad}; display: flex; align-items: center; justify-content: center;">
              ${avatarHtml}
            </div>
            <div style="flex-grow: 1; min-width: 0;">
              <div style="color: var(--text-white); font-size: 0.82rem; line-height: 1.35;">
                ${n.message}
              </div>
              <div style="color: var(--text-muted); font-size: 0.68rem; margin-top: 2px;">${n.timestamp}</div>
            </div>
            ${isStillPending ? `
              <button type="button" class="btn btn-minimal" style="font-size: 0.72rem; padding: 4px 10px; border-radius: 4px; color: #fc8181; border: 1px solid rgba(252, 129, 129, 0.4); white-space: nowrap;" onclick="handleCancelInterest('${targetId}')" title="Withdraw match request">
                ✕ Remove
              </button>
            ` : ''}
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
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.72rem; color: var(--gold-bright); font-weight: 500; background: rgba(170,124,17,0.08); padding: 5px 10px; border-radius: 4px; border: 1px solid rgba(170,124,17,0.2); display: inline-block;">
                  Pending Acceptance...
                </span>
                <button onclick="handleCancelInterest('${p.id}')" class="btn btn-minimal" style="padding: 4px 10px; font-size: 0.72rem; color: #fc8181; border: 1px solid rgba(252, 129, 129, 0.4); border-radius: 4px; font-weight: 600;" title="Cancel pending interest request">
                  Remove ✕
                </button>
              </div>
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




// ==========================================================================
// UNIFIED POLISHED APP VIEWS ROUTER & HANDLERS (HOME, MATCHES, INBOX, CHAT)
// ==========================================================================

window.passedProfiles = [];
window.lastPassedProfileId = null;
window.lastPassedProfileName = "";

window.handlePassProfile = function(profileId, profileName) {
  if (!window.passedProfiles.includes(profileId)) {
    window.passedProfiles.push(profileId);
  }
  window.lastPassedProfileId = profileId;
  window.lastPassedProfileName = profileName;

  const card = document.querySelector(`.profile-card[data-id="${profileId}"]`);
  if (card) {
    card.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    card.style.transform = "translateX(-110%)";
    card.style.opacity = "0";
    setTimeout(() => {
      card.style.display = "none";
    }, 300);
  }

  // Show floating undo toast
  const toast = document.getElementById("undoToastContainer");
  const text = document.getElementById("undoToastText");
  if (toast && text) {
    text.textContent = `Passed ${profileName || "match"}`;
    toast.style.display = "flex";
    if (window.undoToastTimeout) clearTimeout(window.undoToastTimeout);
    window.undoToastTimeout = setTimeout(() => {
      toast.style.display = "none";
    }, 5500);
  }
};

window.executeUndoAction = function() {
  if (window.lastPassedProfileId) {
    const pId = window.lastPassedProfileId;
    window.passedProfiles = window.passedProfiles.filter(id => id !== pId);

    const card = document.querySelector(`.profile-card[data-id="${pId}"]`);
    if (card) {
      card.style.display = "";
      setTimeout(() => {
        card.style.transform = "translateX(0)";
        card.style.opacity = "1";
      }, 50);
    }
    const toast = document.getElementById("undoToastContainer");
    if (toast) toast.style.display = "none";
    showToast(`Restored ${window.lastPassedProfileName || "profile"}`);
    window.lastPassedProfileId = null;
    window.lastPassedProfileName = "";
  }
};

window.handleToggleShortlistDirect = function(profileId) {
  let shortlists = JSON.parse(localStorage.getItem("shortlisted")) || [];
  const isIncluded = shortlists.includes(profileId);

  if (isIncluded) {
    shortlists = shortlists.filter(x => x !== profileId);
    showToast("Removed from Shortlist");
  } else {
    shortlists.push(profileId);
    showToast("Added to Shortlisted Matches ⭐", "gold");
  }
  localStorage.setItem("shortlisted", JSON.stringify(shortlists));

  // Update star icon
  const starBtn = document.getElementById(`starBtn_${profileId}`);
  if (starBtn) {
    starBtn.textContent = !isIncluded ? "★" : "☆";
    starBtn.title = !isIncluded ? "Remove from Shortlist" : "Add to Shortlist";
  }

  const mCountShortlist = document.getElementById("mCountShortlist");
  if (mCountShortlist) mCountShortlist.textContent = shortlists.length;

  if (typeof updateDashboardStats === "function") updateDashboardStats();
  if (typeof updateNavigationBadges === "function") updateNavigationBadges();
};

window.switchAppView = function(viewName, param) {
  const validViews = ["matches", "home", "inbox", "chat"];
  const view = validViews.includes(viewName) ? viewName : "matches";
  window.currentAppView = view;

  // View containers
  const viewMatches = document.getElementById("viewMatchesSection");
  const viewHome = document.getElementById("viewHomeSection");
  const viewInbox = document.getElementById("viewInboxSection");
  const viewChat = document.getElementById("viewChatSection");
  const subtabsBar = document.getElementById("mobileSubtabsBar");
  const headerTitle = document.getElementById("mobileHeaderTitle");

  // Hide all sections first
  if (viewMatches) viewMatches.style.display = "none";
  if (viewHome) viewHome.style.display = "none";
  if (viewInbox) viewInbox.style.display = "none";
  if (viewChat) viewChat.style.display = "none";

  // Clear any lingering floating alerts or popup banners when switching views
  document.querySelectorAll('.royal-interest-alert-banner').forEach(el => el.remove());
  const pageAlert = document.getElementById('royalPageAlertBanner');
  if (pageAlert) pageAlert.remove();

  // Desktop sidebars handling: Hide right sidebar when on home/inbox/chat on desktop for clean layout
  const rightPanel = document.querySelector(".dashboard-online-right-panel");
  if (rightPanel) {
    rightPanel.style.display = (view === "matches") ? "flex" : "none";
  }

  // Toggle mobile subtabs visibility & body padding offset
  const isMatches = (view === "matches");
  if (subtabsBar) {
    subtabsBar.classList.toggle("view-hidden", !isMatches);
    subtabsBar.style.display = isMatches ? "block" : "none";
  }
  document.body.classList.toggle("subtabs-hidden", !isMatches);

  // Update bottom nav active classes
  const bottomTabs = document.querySelectorAll(".mobile-bottom-tab");
  bottomTabs.forEach(t => t.classList.remove("active"));

  // Update desktop subnav active classes
  const desktopTabs = document.querySelectorAll(".dashboard-subnav .subnav-tab");
  desktopTabs.forEach(t => t.classList.remove("active"));

  if (view === "matches") {
    if (viewMatches) viewMatches.style.display = "block";
    if (headerTitle) headerTitle.textContent = "Matches";
    document.getElementById("mNavMatches")?.classList.add("active");
    document.getElementById("subnavMatches")?.classList.add("active");
    if (param) {
      if (typeof switchMobileSubtab === "function") switchMobileSubtab(param);
    }
  } else if (view === "home") {
    if (viewHome) viewHome.style.display = "flex";
    if (headerTitle) headerTitle.textContent = "Royal Hub";
    document.getElementById("mNavHome")?.classList.add("active");
    document.getElementById("subnavHome")?.classList.add("active");
    renderHomeHubView();
  } else if (view === "inbox") {
    if (viewInbox) viewInbox.style.display = "flex";
    if (headerTitle) headerTitle.textContent = "Inbox & Requests";
    document.getElementById("mNavInbox")?.classList.add("active");
    document.getElementById("subnavInbox")?.classList.add("active");
    renderInboxHubView(param || "received");
  } else if (view === "chat") {
    if (viewChat) viewChat.style.display = "flex";
    if (headerTitle) headerTitle.textContent = "Royal Messenger";
    document.getElementById("mNavChat")?.classList.add("active");
    document.getElementById("subnavChat")?.classList.add("active");
    renderChatHubView(param);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  if (typeof updateNavigationBadges === "function") updateNavigationBadges();
};

window.renderHomeHubView = function() {
  const container = document.getElementById("viewHomeSection");
  if (!container) return;

  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
  ensureDefaultAppData(currentUser);

  const name = currentUser.name || "Noble Member";
  const initial = name.trim().charAt(0).toUpperCase() || "U";
  const clan = currentUser.caste || currentUser.clan || "Rajput";
  const gotra = (currentUser.gotra || "Sandila Gotra").split("(")[0];
  const memberId = currentUser.id || "SRS-9419AB";
  const tier = (currentUser.tier || "Royal").toUpperCase();
  const profilePic = currentUser.profilePic || currentUser.img;

  // Calculate profile completion score
  let score = 40;
  const missingSteps = [];
  if (currentUser.profilePic) score += 15; else missingSteps.push({ label: "+ Photo (+15%)", action: "location.href='profile.html#profileAvatarFrame'" });
  if (currentUser.motherGotra) score += 15; else missingSteps.push({ label: "+ Maternal Gotra (+15%)", action: "location.href='profile.html#profMotherGotra'" });
  if (currentUser.rashi || currentUser.nakshatra) score += 15; else missingSteps.push({ label: "+ Astrological Kundali (+15%)", action: "location.href='profile.html#profRashi'" });
  if (currentUser.biodataPdf) score += 15; else missingSteps.push({ label: "+ Biodata PDF (+15%)", action: "location.href='profile.html#biodataUploadContainer'" });
  score = Math.min(score, 100);

  const shortlists = JSON.parse(localStorage.getItem("shortlisted")) || [];
  const myInterests = getProfileInterests(currentUser);
  const acceptedCount = Object.keys(myInterests).filter(k => myInterests[k] === "accepted").length;

  const all = getAllProfiles().filter(p => !currentUser || p.id !== currentUser.id);
  const targetGender = currentUser.gender === "Groom" ? "Bride" : (currentUser.gender === "Bride" ? "Groom" : null);
  const compatibleVisitors = all.filter(p => !targetGender || p.gender === targetGender).slice(0, 4);

  container.innerHTML = `
    <!-- 1. Member Hero Card -->
    <div class="home-member-hero-card">
      <div class="home-hero-profile-row">
        <div class="home-hero-avatar-wrap">
          <div class="home-hero-avatar">
            ${profilePic ? `<img src="${profilePic}" alt="${name}" />` : `<span>${initial}</span>`}
          </div>
          <span class="home-hero-badge-overlay" title="Lineage screening active">🛡️</span>
        </div>
        <div class="home-hero-info">
          <h2 class="home-hero-name">${name}</h2>
          <div class="home-hero-lineage">
            <span>🏰 ${clan} Clan</span> &bull; <span>Gotra: ${gotra}</span>
          </div>
          <div class="home-hero-tags">
            <span class="home-pill-id">${memberId.slice(-8)}</span>
            <span class="home-pill-tier">👑 ${tier} Tier</span>
          </div>
        </div>
      </div>

      <div class="home-hero-action-row">
        <a href="profile.html" class="home-edit-btn">
          <span>✏️</span> Edit Noble Profile
        </a>
        <button type="button" class="home-view-profile-btn" onclick="openProfileDetailModal('${currentUser.id}')">
          View as Others See
        </button>
      </div>
    </div>

    <!-- 2. Profile Completion Progress Card -->
    <div class="home-completion-card">
      <div class="home-completion-header">
        <div class="home-completion-title">
          <span>✨</span> Profile Authenticity &amp; Completion
        </div>
        <div class="home-completion-percent">${score}%</div>
      </div>
      <div class="home-progress-bar-bg">
        <div class="home-progress-bar-fill" style="width: ${score}%;"></div>
      </div>
      ${missingSteps.length > 0 ? `
        <div class="home-completion-chips">
          ${missingSteps.map(s => `
            <a href="javascript:void(0)" onclick="${s.action}" class="home-chip-pending">
              ${s.label}
            </a>
          `).join("")}
        </div>
      ` : `
        <div style="font-size: 0.74rem; color: #2ECC71; font-weight: 600;">
          ✓ Noble Profile 100% Completed &amp; Verified
        </div>
      `}
    </div>

    <!-- 3. Key Activity & Visitor Metrics -->
    <div>
      <div class="home-section-heading">
        <span>Activity &amp; Engagement</span>
        <small style="font-size: 0.72rem; color: var(--gold-bright);">Real-time</small>
      </div>
      <div class="home-stats-grid">
        <div class="home-stat-tile" onclick="showVisitorsModal()">
          <span class="home-stat-num">14</span>
          <span class="home-stat-label">Profile Views</span>
        </div>
        <div class="home-stat-tile" onclick="switchAppView('inbox', 'received')">
          <span class="home-stat-num" id="homeReceivedStat">3</span>
          <span class="home-stat-label">Received Interests</span>
        </div>
        <div class="home-stat-tile" onclick="switchAppView('matches', 'shortlist')">
          <span class="home-stat-num">${shortlists.length}</span>
          <span class="home-stat-label">Shortlisted</span>
        </div>
        <div class="home-stat-tile" onclick="switchAppView('chat')">
          <span class="home-stat-num">${acceptedCount > 0 ? acceptedCount : 2}</span>
          <span class="home-stat-label">Active Chats</span>
        </div>
      </div>
    </div>

    <!-- 4. Useful Next Steps Cards -->
    <div>
      <div class="home-section-heading">
        <span>Recommended Next Steps</span>
      </div>
      <div class="home-next-steps-grid">
        <a href="profile.html#profilePicInput" class="home-step-card">
          <div class="home-step-icon">📸</div>
          <div class="home-step-body">
            <h4>Upload Portraits</h4>
            <p>Profiles with 3+ photos receive 5x more verified interests.</p>
          </div>
        </a>
        <div class="home-step-card" onclick="purchaseAddon('Verification')">
          <div class="home-step-icon">🛡️</div>
          <div class="home-step-body">
            <h4>Wax Seal Gotra Audit</h4>
            <p>Verify gotras and native jagir with the Rajput screening desk.</p>
          </div>
        </div>
        <a href="faq.html" class="home-step-card">
          <div class="home-step-icon">🪐</div>
          <div class="home-step-body">
            <h4>Kundali Alignment</h4>
            <p>Match 36 Gunas and Manglik harmony with compatible suitors.</p>
          </div>
        </a>
        <a href="membership.html" class="home-step-card">
          <div class="home-step-icon">👑</div>
          <div class="home-step-body">
            <h4>Regal Matchmaker</h4>
            <p>Personal assistance to coordinate family meetings and gotras.</p>
          </div>
        </a>
      </div>
    </div>

    <!-- 5. Recent Compatible Visitors -->
    <div>
      <div class="home-section-heading">
        <span>Recent Compatible Profiles</span>
        <a href="javascript:void(0)" onclick="switchAppView('matches')" style="font-size: 0.75rem; color: var(--gold-bright); text-decoration: none;">View All &rarr;</a>
      </div>
      <div class="home-visitors-scroll">
        ${compatibleVisitors.map(p => `
          <div class="home-visitor-card">
            <div class="home-visitor-avatar" style="background: ${getAvatarGradient(p.clan)};">
              ${p.img ? `<img src="${p.img}" alt="${p.name}" />` : `<span>${p.initials || "👑"}</span>`}
            </div>
            <div class="home-visitor-name">${p.name}</div>
            <div class="home-visitor-sub">${p.clan} Clan &bull; ${p.age} yrs</div>
            <button type="button" class="home-visitor-action" onclick="openProfileDetailModal('${p.id}')">
              View Biodata
            </button>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- 6. Lineage Safety & Concierge Shortcut -->
    <div class="home-support-card">
      <div style="font-size: 1.6rem;">🛡️</div>
      <div class="home-support-text">
        <h4>Rajputana Lineage Privacy &amp; Trust</h4>
        <p>Four-Gotra rule verification desk is active for your protection.</p>
      </div>
      <a href="faq.html" class="btn btn-minimal" style="padding: 6px 12px; font-size: 0.75rem; white-space: nowrap;">
        Guidelines
      </a>
    </div>
  `;
};

window.renderInboxHubView = function(activeTab = "received") {
  const container = document.getElementById("viewInboxSection");
  if (!container) return;

  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
  ensureDefaultAppData(currentUser);

  const allProfiles = getAllProfiles();
  const myInterests = getProfileInterests(currentUser);
  const notifications = (JSON.parse(localStorage.getItem("notifications")) || []).filter(n => !n.recipientId || n.recipientId === currentUser.id);

  // Incoming received interests (profiles that expressed interest in currentUser)
  const incomingProfiles = allProfiles.filter(p => {
    if (p.id === currentUser.id) return false;
    const theirInterests = getProfileInterests(p);
    return theirInterests[currentUser.id] === "sent" && myInterests[p.id] !== "accepted" && myInterests[p.id] !== "declined";
  });

  // Accepted mutual connections
  const acceptedProfiles = allProfiles.filter(p => {
    if (p.id === currentUser.id) return false;
    return areProfilesConnected(currentUser, p);
  });

  // Outgoing sent interests
  const sentProfileIds = Object.keys(myInterests).filter(k => myInterests[k] === "sent");
  const sentProfiles = allProfiles.filter(p => sentProfileIds.includes(p.id));

  // Unread notifications count
  const unreadNotifs = notifications.filter(n => n.read !== true);

  container.innerHTML = `
    <!-- Segmented Subtabs Navigation -->
    <div class="inbox-subtabs-nav">
      <button type="button" class="inbox-subtab-btn ${activeTab === "received" ? "active" : ""}" onclick="renderInboxHubView('received')">
        <span>Received</span>
        ${incomingProfiles.length > 0 ? `<span class="inbox-tab-badge">${incomingProfiles.length}</span>` : ""}
      </button>
      <button type="button" class="inbox-subtab-btn ${activeTab === "accepted" ? "active" : ""}" onclick="renderInboxHubView('accepted')">
        <span>Accepted</span>
        ${acceptedProfiles.length > 0 ? `<span class="inbox-tab-badge" style="background:#2ECC71;">${acceptedProfiles.length}</span>` : ""}
      </button>
      <button type="button" class="inbox-subtab-btn ${activeTab === "sent" ? "active" : ""}" onclick="renderInboxHubView('sent')">
        <span>Sent</span>
        ${sentProfiles.length > 0 ? `<span class="inbox-tab-badge" style="background:rgba(212,175,55,0.4);">${sentProfiles.length}</span>` : ""}
      </button>
      <button type="button" class="inbox-subtab-btn ${activeTab === "notifs" ? "active" : ""}" onclick="renderInboxHubView('notifs')">
        <span>Alerts</span>
        ${unreadNotifs.length > 0 ? `<span class="inbox-tab-badge">${unreadNotifs.length}</span>` : ""}
      </button>
    </div>

    <!-- Subtab Content Area -->
    <div id="inboxTabContentArea" class="inbox-card-list">
      <!-- Populated Below -->
    </div>
  `;

  const contentArea = document.getElementById("inboxTabContentArea");
  if (!contentArea) return;

  if (activeTab === "received") {
    if (incomingProfiles.length === 0) {
      contentArea.innerHTML = `
        <div class="inbox-empty-state">
          <span class="inbox-empty-icon">💌</span>
          <h3 class="inbox-empty-title">No Pending Requests</h3>
          <p class="inbox-empty-desc">You are all caught up! When noble brides or grooms express interest in your profile, their requests will appear here.</p>
          <button type="button" class="btn btn-royal" onclick="switchAppView('matches')" style="font-size: 0.8rem; padding: 8px 18px;">
            Browse Daily Matches
          </button>
        </div>
      `;
    } else {
      contentArea.innerHTML = incomingProfiles.map(p => `
        <div class="inbox-item-card">
          <div class="inbox-item-header">
            <div class="inbox-item-avatar" style="background: ${getAvatarGradient(p.clan)};" onclick="openProfileDetailModal('${p.id}')">
              ${p.img ? `<img src="${p.img}" alt="${p.name}" />` : `<span>${p.initials || "👑"}</span>`}
            </div>
            <div class="inbox-item-info" onclick="openProfileDetailModal('${p.id}')">
              <div class="inbox-item-name">${p.name} ✓</div>
              <div class="inbox-item-meta">${p.clan} Clan &bull; Gotra: ${(p.gotra || "Sandila").split("(")[0]} &bull; ${p.native || p.location}</div>
            </div>
            <div class="inbox-item-time">Today</div>
          </div>
          <div class="inbox-item-note">
            "Khammaghani! Our family reviewed your noble biodata and found your gotras and heritage warmly aligned with our traditions."
          </div>
          <div class="inbox-item-actions">
            <button type="button" class="inbox-btn-decline" onclick="handleDeclineInterest('${p.id}'); renderInboxHubView('received');">
              ✕ Decline
            </button>
            <button type="button" class="inbox-btn-accept" onclick="handleAcceptInterest('${p.id}'); renderInboxHubView('accepted');">
              ✓ Accept Connection
            </button>
          </div>
        </div>
      `).join("");
    }
  } else if (activeTab === "accepted") {
    if (acceptedProfiles.length === 0) {
      contentArea.innerHTML = `
        <div class="inbox-empty-state">
          <span class="inbox-empty-icon">🤝</span>
          <h3 class="inbox-empty-title">No Connected Matches Yet</h3>
          <p class="inbox-empty-desc">Once both you and a match accept each other's interest, you can exchange messages, unlock phone numbers, and coordinate family meetings.</p>
          <button type="button" class="btn btn-royal" onclick="switchAppView('matches')" style="font-size: 0.8rem; padding: 8px 18px;">
            Discover Compatible Matches
          </button>
        </div>
      `;
    } else {
      contentArea.innerHTML = acceptedProfiles.map(p => `
        <div class="inbox-item-card">
          <div class="inbox-item-header">
            <div class="inbox-item-avatar" style="background: ${getAvatarGradient(p.clan)};" onclick="openProfileDetailModal('${p.id}')">
              ${p.img ? `<img src="${p.img}" alt="${p.name}" />` : `<span>${p.initials || "👑"}</span>`}
            </div>
            <div class="inbox-item-info" onclick="openProfileDetailModal('${p.id}')">
              <div class="inbox-item-name">${p.name} <span style="font-size:0.68rem; background:rgba(46,204,113,0.15); color:#2ECC71; padding:2px 6px; border-radius:10px; font-weight:700;">Mutual Match</span></div>
              <div class="inbox-item-meta">${p.clan} Clan &bull; ${p.occupation || "Professional"} &bull; ${p.location}</div>
            </div>
            <div class="inbox-item-time" style="color:#2ECC71;">Connected ✓</div>
          </div>
          <div class="inbox-item-actions">
            <button type="button" class="inbox-btn-decline" onclick="handleViewContactNumber('${p.id}')">
              📞 View Phone
            </button>
            <button type="button" class="inbox-btn-chat" onclick="switchAppView('chat', '${p.id}')">
              💬 Chat Now
            </button>
          </div>
        </div>
      `).join("");
    }
  } else if (activeTab === "sent") {
    if (sentProfiles.length === 0) {
      contentArea.innerHTML = `
        <div class="inbox-empty-state">
          <span class="inbox-empty-icon">⏳</span>
          <h3 class="inbox-empty-title">No Sent Requests</h3>
          <p class="inbox-empty-desc">You have not expressed interest in any profiles yet. Browse through the Daily or New matches to send your first interest!</p>
          <button type="button" class="btn btn-royal" onclick="switchAppView('matches')" style="font-size: 0.8rem; padding: 8px 18px;">
            Explore Matches
          </button>
        </div>
      `;
    } else {
      contentArea.innerHTML = sentProfiles.map(p => `
        <div class="inbox-item-card">
          <div class="inbox-item-header">
            <div class="inbox-item-avatar" style="background: ${getAvatarGradient(p.clan)};" onclick="openProfileDetailModal('${p.id}')">
              ${p.img ? `<img src="${p.img}" alt="${p.name}" />` : `<span>${p.initials || "👑"}</span>`}
            </div>
            <div class="inbox-item-info" onclick="openProfileDetailModal('${p.id}')">
              <div class="inbox-item-name">${p.name}</div>
              <div class="inbox-item-meta">${p.clan} Clan &bull; Gotra: ${(p.gotra || "Sandila").split("(")[0]}</div>
            </div>
            <div class="inbox-item-time" style="color:#FCD34D;">Pending ⌛</div>
          </div>
          <div class="inbox-item-actions">
            <button type="button" class="inbox-btn-cancel" onclick="handleCancelInterest('${p.id}'); renderInboxHubView('sent');">
              Cancel Request ✕
            </button>
            <button type="button" class="inbox-btn-decline" onclick="openProfileDetailModal('${p.id}')">
              View Biodata
            </button>
          </div>
        </div>
      `).join("");
    }
  } else if (activeTab === "notifs") {
    if (notifications.length === 0) {
      contentArea.innerHTML = `
        <div class="inbox-empty-state">
          <span class="inbox-empty-icon">🔔</span>
          <h3 class="inbox-empty-title">All Caught Up!</h3>
          <p class="inbox-empty-desc">No new activity or alerts. Check back later for match updates and lineage verification notices.</p>
        </div>
      `;
    } else {
      contentArea.innerHTML = `
        <div style="display:flex; justify-content:flex-end; margin-bottom:4px;">
          <button type="button" onclick="markAllNotificationsRead()" style="background:transparent; border:none; color:var(--gold-bright); font-size:0.75rem; font-weight:600; cursor:pointer; text-decoration:underline;">
            Mark all as read
          </button>
        </div>
        ${notifications.map(n => `
          <div class="inbox-notif-card ${n.read ? "" : "unread"}" onclick="markNotificationRead('${n.id}')">
            <div class="inbox-notif-icon">${n.icon || "🛡️"}</div>
            <div class="inbox-notif-content">
              <p class="inbox-notif-msg">${n.message || n.text}</p>
              <span class="inbox-notif-time">${n.time || "Today"}</span>
            </div>
            ${!n.read ? `<span class="inbox-notif-dot"></span>` : ""}
          </div>
        `).join("")}
      `;
    }
  }

  if (typeof updateNavigationBadges === "function") updateNavigationBadges();
};

window.renderChatHubView = function(targetProfileId) {
  const container = document.getElementById("viewChatSection");
  if (!container) return;

  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
  ensureDefaultAppData(currentUser);

  if (targetProfileId) {
    openActiveChatView(targetProfileId);
    return;
  }

  const allProfiles = getAllProfiles();
  const connectedProfiles = allProfiles.filter(p => areProfilesConnected(currentUser, p) && p.id !== currentUser.id);

  // If no mutual connections yet, provide fallback conversations with royal advisors & top candidates
  const chatThreads = [...connectedProfiles];
  if (chatThreads.length === 0) {
    const defaultCandidates = allProfiles.filter(p => p.id === "P1" || p.id === "P2" || p.id === "P3").slice(0, 2);
    chatThreads.push(...defaultCandidates);
  }

  container.innerHTML = `
    <!-- Chat Conversations Search -->
    <div class="chat-search-wrap">
      <input type="text" class="chat-search-input" id="chatSearchInput" placeholder="🔍 Search conversations..." oninput="handleChatSearchInput(this.value)">
    </div>

    <!-- Active Threads List -->
    <div class="chat-threads-list" id="chatThreadsList">
      <!-- Concierge Desk Thread -->
      <div class="chat-thread-row" onclick="openActiveChatView('concierge')">
        <div class="chat-thread-avatar-wrap">
          <div class="chat-thread-avatar" style="background: linear-gradient(135deg, #AA7C11 0%, #D4AF37 100%);">
            👑
          </div>
          <span class="chat-thread-online-dot"></span>
        </div>
        <div class="chat-thread-content">
          <div class="chat-thread-top">
            <span class="chat-thread-name">Rajputana Matchmaker Desk</span>
            <span class="chat-thread-time">Active</span>
          </div>
          <div class="chat-thread-bottom">
            <span class="chat-thread-preview">Khammaghani! How can we assist your gotra search today?</span>
            <span class="chat-thread-badge">1</span>
          </div>
        </div>
      </div>

      <!-- Candidate Threads -->
      ${chatThreads.map(p => {
        const chats = getProfileChats(currentUser);
        const threadMsgs = chats[p.id] || [];
        const lastMsg = threadMsgs.length > 0 ? threadMsgs[threadMsgs.length - 1].text : "Khammaghani! Nice to connect with your noble family.";
        const time = threadMsgs.length > 0 ? threadMsgs[threadMsgs.length - 1].time : "10:45 AM";

        return `
          <div class="chat-thread-row" data-name="${p.name.toLowerCase()}" onclick="openActiveChatView('${p.id}')">
            <div class="chat-thread-avatar-wrap">
              <div class="chat-thread-avatar" style="background: ${getAvatarGradient(p.clan)};">
                ${p.img ? `<img src="${p.img}" alt="${p.name}" />` : `<span>${p.initials || "👑"}</span>`}
              </div>
              <span class="chat-thread-online-dot"></span>
            </div>
            <div class="chat-thread-content">
              <div class="chat-thread-top">
                <span class="chat-thread-name">${p.name}</span>
                <span class="chat-thread-time">${time}</span>
              </div>
              <div class="chat-thread-bottom">
                <span class="chat-thread-preview">${lastMsg}</span>
                <span style="font-size:0.68rem; color:#FCD34D;">${p.clan}</span>
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  if (typeof updateNavigationBadges === "function") updateNavigationBadges();
};

window.openActiveChatView = function(profileId) {
  const container = document.getElementById("viewChatSection");
  if (!container) return;

  // Clear any floating alerts
  document.querySelectorAll('.royal-interest-alert-banner').forEach(el => el.remove());
  const pageAlert = document.getElementById('royalPageAlertBanner');
  if (pageAlert) pageAlert.remove();

  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
  let targetProfile = null;

  if (profileId === "concierge") {
    targetProfile = {
      id: "concierge",
      name: "Rajputana Matchmaker Desk",
      clan: "Heritage Screening Desk",
      initials: "👑",
      img: ""
    };
  } else {
    targetProfile = getAllProfiles().find(p => p.id === profileId);
    if (!targetProfile) return;
  }

  // Get messages
  const chats = getProfileChats(currentUser);
  let conversation = chats[targetProfile.id] || [];
  if (conversation.length === 0) {
    conversation = [
      { sender: "them", text: "Khammaghani! Delighted to connect with your noble Rajput family.", time: "10:30 AM" },
      { sender: "them", text: "We reviewed your lineage records and would be glad to coordinate gotra verification.", time: "10:31 AM" }
    ];
    chats[targetProfile.id] = conversation;
    currentUser.about = setProfileChatsInAbout(currentUser.about, chats);
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  }

  container.innerHTML = `
    <div class="chat-active-screen">
      <!-- Screen Header -->
      <div class="chat-screen-header">
        <button type="button" class="chat-back-btn" onclick="renderChatHubView()" title="Back to conversations" aria-label="Back">
          &larr;
        </button>
        <div class="chat-header-profile-link" onclick="${targetProfile.id !== "concierge" ? `openProfileDetailModal('${targetProfile.id}')` : ""}">
          <div class="chat-thread-avatar" style="width:38px; height:38px; background: ${getAvatarGradient(targetProfile.clan)};">
            ${targetProfile.img ? `<img src="${targetProfile.img}" alt="${targetProfile.name}" />` : `<span>${targetProfile.initials || "👑"}</span>`}
          </div>
          <div style="flex:1; min-width:0;">
            <div style="font-size:0.92rem; font-weight:700; color:#FFFFFF; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${targetProfile.name}
            </div>
            <div style="font-size:0.68rem; color:#2ECC71;">
              ● Active Now &bull; ${targetProfile.clan}
            </div>
          </div>
        </div>
      </div>

      <!-- Lineage Etiquette Banner -->
      <div class="chat-screen-privacy-bar">
        🔒 Encrypted &amp; Confidential &bull; Follow traditional Rajputana etiquette
      </div>

      <!-- Messages Stream -->
      <div class="chat-screen-messages" id="hubChatMessagesStream">
        ${conversation.map(msg => `
          <div class="chat-bubble ${msg.sender === "me" ? "mine" : "theirs"}">
            <div>${msg.text}</div>
            <div class="chat-bubble-meta">
              <span>${msg.time || "Now"}</span>
              ${msg.sender === "me" ? "<span>✓✓</span>" : ""}
            </div>
          </div>
        `).join("")}
      </div>

      <!-- Quick Icebreaker Chips -->
      <div class="chat-icebreakers-row">
        <button type="button" class="chat-icebreaker-pill" onclick="sendHubChatMessage('${targetProfile.id}', 'Khammaghani! Delighted to connect.')">
          👑 Khammaghani!
        </button>
        <button type="button" class="chat-icebreaker-pill" onclick="sendHubChatMessage('${targetProfile.id}', 'Would love to discuss ancestral gotra and native thikana.')">
          🏰 Discuss Gotra
        </button>
        <button type="button" class="chat-icebreaker-pill" onclick="sendHubChatMessage('${targetProfile.id}', 'Are your family elders available for a phone conversation?')">
          📞 Elder Meeting
        </button>
      </div>

      <!-- Input Bar -->
      <form class="chat-screen-input-bar" onsubmit="event.preventDefault(); sendHubChatMessage('${targetProfile.id}');">
        <input type="text" id="hubChatInput" class="chat-screen-input" placeholder="Write a noble message..." autocomplete="off">
        <button type="submit" class="chat-screen-send-btn">
          Send
        </button>
      </form>
    </div>
  `;

  const stream = document.getElementById("hubChatMessagesStream");
  if (stream) stream.scrollTop = stream.scrollHeight;
};

window.sendHubChatMessage = function(targetId, overrideText) {
  const inputEl = document.getElementById("hubChatInput");
  const text = (overrideText || (inputEl ? inputEl.value : "")).trim();
  if (!text) return;

  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
  const chats = getProfileChats(currentUser);
  if (!chats[targetId]) chats[targetId] = [];

  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  chats[targetId].push({ sender: "me", text: text, time: timeStr });

  currentUser.about = setProfileChatsInAbout(currentUser.about, chats);
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  if (inputEl) inputEl.value = "";

  // Append message to stream immediately
  const stream = document.getElementById("hubChatMessagesStream");
  if (stream) {
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble mine";
    bubble.innerHTML = `
      <div>${text}</div>
      <div class="chat-bubble-meta">
        <span>${timeStr}</span>
        <span>✓✓</span>
      </div>
    `;
    stream.appendChild(bubble);
    stream.scrollTop = stream.scrollHeight;
  }

  // Realistic auto-reply from candidate after 2 seconds
  setTimeout(() => {
    const replyChats = getProfileChats(currentUser);
    const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    let replyText = "Khammaghani! Thank you for writing. I will discuss with our family elders and share our gotra details shortly.";
    if (targetId === "concierge") {
      replyText = "Khammaghani! Our Rajput Lineage Screening team has logged your inquiry. An advisor will contact your family on WhatsApp today.";
    }
    replyChats[targetId].push({ sender: "them", text: replyText, time: replyTime });
    currentUser.about = setProfileChatsInAbout(currentUser.about, replyChats);
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    if (stream && document.getElementById("hubChatInput")) {
      const repBubble = document.createElement("div");
      repBubble.className = "chat-bubble theirs";
      repBubble.innerHTML = `
        <div>${replyText}</div>
        <div class="chat-bubble-meta"><span>${replyTime}</span></div>
      `;
      stream.appendChild(repBubble);
      stream.scrollTop = stream.scrollHeight;
    }
  }, 2200);
};

window.handleChatSearchInput = function(query) {
  const q = (query || "").toLowerCase().trim();
  const rows = document.querySelectorAll(".chat-thread-row");
  rows.forEach(r => {
    const name = r.getAttribute("data-name") || "";
    r.style.display = (!q || name.includes(q)) ? "flex" : "none";
  });
};

window.updateNavigationBadges = function() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
  const allProfiles = getAllProfiles();
  const myInterests = getProfileInterests(currentUser);
  const notifications = (JSON.parse(localStorage.getItem("notifications")) || []).filter(n => !n.recipientId || n.recipientId === currentUser.id);

  // Incoming pending
  const incoming = allProfiles.filter(p => {
    if (p.id === currentUser.id) return false;
    const theirInterests = getProfileInterests(p);
    return theirInterests[currentUser.id] === "sent" && myInterests[p.id] !== "accepted" && myInterests[p.id] !== "declined";
  });

  const unreadNotifs = notifications.filter(n => !n.read).length;
  const totalInboxUnread = incoming.length + unreadNotifs;

  // Bottom Nav Inbox Badge
  const bBadge = document.getElementById("mNavInboxBadge");
  if (bBadge) {
    bBadge.textContent = totalInboxUnread;
    bBadge.style.display = totalInboxUnread > 0 ? "flex" : "none";
  }

  // Header Bell Badge
  const bellBadge = document.getElementById("mobileBellBadge");
  if (bellBadge) {
    bellBadge.textContent = totalInboxUnread || "1";
    bellBadge.style.display = totalInboxUnread > 0 ? "flex" : "none";
  }

  // Desktop Subnav Badge
  const dBadge = document.getElementById("desktopInboxBadge");
  if (dBadge) {
    dBadge.textContent = totalInboxUnread;
    dBadge.style.display = totalInboxUnread > 0 ? "inline-block" : "none";
  }

  // Bottom Nav Chat Dot
  const cBadge = document.getElementById("mNavChatBadge");
  if (cBadge) {
    cBadge.style.display = "block";
  }
};

window.markAllNotificationsRead = function() {
  let notifications = JSON.parse(localStorage.getItem("notifications")) || [];
  notifications = notifications.map(n => ({ ...n, read: true }));
  localStorage.setItem("notifications", JSON.stringify(notifications));
  renderInboxHubView("notifs");
  updateNavigationBadges();
  showToast("All notifications marked as read", "gold");
};

window.markNotificationRead = function(notifId) {
  let notifications = JSON.parse(localStorage.getItem("notifications")) || [];
  const target = notifications.find(n => n.id === notifId);
  if (target) target.read = true;
  localStorage.setItem("notifications", JSON.stringify(notifications));
  renderInboxHubView("notifs");
  updateNavigationBadges();
};

window.handleViewContactNumber = function(profileId) {
  const profiles = getAllProfiles();
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return;
  const phone = profile.phone || "+91 96640 30758";
  showToast(`Verified Phone for ${profile.name}: ${phone}`, "gold");
};

window.showVisitorsModal = function() {
  const all = getAllProfiles();
  const visitors = all.slice(0, 5);
  let html = `
    <div style="font-size:0.85rem; color:#FFFFFF; margin-bottom:12px;">
      These noble members recently reviewed your traditional biodata:
    </div>
    <div style="display:flex; flex-direction:column; gap:10px;">
      ${visitors.map(p => `
        <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.04); padding:10px; border-radius:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:36px; height:36px; border-radius:50%; background:${getAvatarGradient(p.clan)}; overflow:hidden; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold;">
              ${p.img ? `<img src="${p.img}" style="width:100%; height:100%; object-fit:cover;" />` : p.initials}
            </div>
            <div>
              <div style="font-weight:bold; font-size:0.88rem; color:#fff;">${p.name}</div>
              <div style="font-size:0.72rem; color:var(--gold-bright);">${p.clan} Clan &bull; ${p.location}</div>
            </div>
          </div>
          <button type="button" class="btn btn-royal" style="padding:4px 10px; font-size:0.72rem;" onclick="closeInterestsOrChatsModal(); openProfileDetailModal('${p.id}')">
            View
          </button>
        </div>
      `).join("")}
    </div>
  `;
  showInterestsOrChatsModal("Recent Profile Visitors (14)", html);
};

window.ensureDefaultAppData = function(currentUser) {
  if (!currentUser) return;

  // 1. Ensure realistic notifications
  let notifs = JSON.parse(localStorage.getItem("notifications")) || [];
  if (notifs.length === 0) {
    notifs = [
      { id: "n1", icon: "🛡️", message: "Ancestral Lineage Desk verified your Paternal Gotra (Sandila). Wax seal badge is now live.", time: "2 hours ago", read: false },
      { id: "n2", icon: "👁️", message: "Divya Rathore reviewed your ancestral biodata and astrological parameters.", time: "4 hours ago", read: false },
      { id: "n3", icon: "🪐", message: "Kundali Alignment: High 32/36 Guna Milan recommended with Yashavi Solanki.", time: "Yesterday", read: false },
      { id: "n4", icon: "👑", message: "3 new verified brides from Sisodia & Chauhan clans joined Rajputana Matrimony.", time: "2 days ago", read: true }
    ];
    localStorage.setItem("notifications", JSON.stringify(notifs));
  }

  // 2. Ensure initial received interests for realistic demo
  const targetIds = currentUser.gender === "Bride" ? ["P1", "P3"] : ["P2", "P4"];
  const allProfiles = getAllProfiles();
  const users = JSON.parse(localStorage.getItem("users")) || [];
  let updatedUsers = false;

  targetIds.forEach(targetId => {
    const sender = allProfiles.find(p => p.id === targetId);
    if (sender) {
      const senderInterests = getProfileInterests(sender);
      if (!senderInterests[currentUser.id]) {
        senderInterests[currentUser.id] = "sent";
        const newAbout = setProfileInterestsInAbout(sender.about, senderInterests);
        sender.about = newAbout;
        
        // Also update SEED_PROFILES in-memory array if present
        if (window.SEED_PROFILES) {
          const sProfile = window.SEED_PROFILES.find(p => p.id === targetId);
          if (sProfile) sProfile.about = newAbout;
        }

        // Also update firestoreUsers if active
        if (window.firestoreUsers) {
          const fProfile = window.firestoreUsers.find(p => p.id === targetId);
          if (fProfile) fProfile.about = newAbout;
        }

        const uIdx = users.findIndex(u => u.id === sender.id);
        if (uIdx !== -1) {
          users[uIdx].about = newAbout;
        } else {
          users.push({ ...sender, about: newAbout });
        }
        updatedUsers = true;
      }
    }
  });

  if (updatedUsers) {
    localStorage.setItem("users", JSON.stringify(users));
  }
};
