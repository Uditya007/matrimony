/**
 * Kunwar AI Lineage Matchmaker Engine
 * Shree Rajput Sagai Sambandh
 * 
 * Natural language preference parsing, database deep search,
 * Sagotra compatibility verification, and royal AI match scoring.
 */

(function () {
  'use strict';

  const CLANS = [
    'rathore', 'sisodia', 'chauhan', 'kachwaha', 'kachawa', 'bhati',
    'shekhawat', 'tanwar', 'panwar', 'tomar', 'solanki', 'parmar',
    'parihar', 'jadeja', 'jhala', 'hadda', 'deora', 'chundawat'
  ];

  const LOCATIONS = [
    'jaipur', 'jodhpur', 'udaipur', 'bikaner', 'ajmer', 'sikar', 'alwar',
    'jaisalmer', 'barmer', 'kota', 'pali', 'nagaur', 'jhunjhunu', 'rajasthan',
    'delhi', 'ncr', 'mumbai', 'pune', 'bangalore', 'bengaluru', 'hyderabad',
    'indore', 'ahmedabad', 'usa', 'uk', 'dubai', 'canada'
  ];

  const PROFESSIONS = [
    { key: 'doctor', terms: ['doctor', 'physician', 'surgeon', 'mbbs', 'md', 'ms', 'dentist', 'medical'] },
    { key: 'engineer', terms: ['engineer', 'software', 'tech', 'developer', 'iit', 'b.tech', 'm.tech', 'ai', 'data', 'coding'] },
    { key: 'business', terms: ['business', 'entrepreneur', 'hotelier', 'resorts', 'founder', 'startup', 'real estate', 'industrialist'] },
    { key: 'civil_services', terms: ['ias', 'ips', 'ras', 'irs', 'civil service', 'government', 'govt', 'officer', 'bureaucrat'] },
    { key: 'defence', terms: ['army', 'navy', 'air force', 'defence', 'military', 'colonel', 'captain', 'major'] },
    { key: 'management', terms: ['mba', 'iim', 'finance', 'consultant', 'banker', 'analyst', 'manager'] },
    { key: 'finance', terms: ['ca', 'chartered accountant', 'audit', 'tax', 'cfa'] },
    { key: 'heritage', terms: ['architect', 'restoration', 'art', 'historian', 'curator', 'heritage'] },
    { key: 'academic', terms: ['professor', 'scholar', 'lecturer', 'researcher', 'teacher'] }
  ];

  const HISTORICAL_ALLIANCES = {
    'rathore': ['sisodia', 'chauhan', 'bhati', 'kachwaha'],
    'sisodia': ['rathore', 'bhati', 'chauhan', 'jhala'],
    'chauhan': ['rathore', 'sisodia', 'bhati', 'kachwaha'],
    'kachwaha': ['rathore', 'sisodia', 'chauhan', 'shekhawat'],
    'bhati': ['rathore', 'sisodia', 'chauhan'],
    'shekhawat': ['rathore', 'sisodia', 'kachwaha', 'bhati'],
    'tanwar': ['rathore', 'sisodia', 'chauhan'],
    'panwar': ['rathore', 'sisodia', 'chauhan']
  };

  const KunwarAIMatchmaker = {
    /**
     * Parses free-form text or user profile into structured search parameters
     */
    parseQueryPreferences(queryText, currentUser) {
      const q = (queryText || '').toLowerCase().trim();
      const prefs = {
        isGenericRequest: false,
        targetGender: null,
        targetClans: [],
        ageMin: null,
        ageMax: null,
        targetLocations: [],
        targetProfessions: [],
        rawQuery: queryText || ''
      };

      // 1. Detect if this is a generic "show my type of match / his type of match / according to preference" query
      const genericTriggers = [
        'my type', 'his type', 'her type', 'my preference', 'his preference',
        'my match', 'perfect match', 'ideal match', 'compatible match',
        'mere type', 'mere hisab', 'show match', 'find match', 'recommend match',
        'according to preference', 'based on preference', 'suggest match'
      ];
      prefs.isGenericRequest = genericTriggers.some(t => q.includes(t)) || q.length === 0;

      // 2. Gender extraction
      const brideWords = ['bride', 'brides', 'ladi', 'ladki', 'girl', 'girls', 'female', 'woman', 'women', 'kanya', 'she', 'her'];
      const groomWords = ['groom', 'grooms', 'banna', 'ladka', 'boy', 'boys', 'male', 'man', 'men', 'var', 'kunwar', 'he', 'his', 'him'];

      if (brideWords.some(w => new RegExp(`\\b${w}\\b`, 'i').test(q))) {
        prefs.targetGender = 'Bride';
      } else if (groomWords.some(w => new RegExp(`\\b${w}\\b`, 'i').test(q))) {
        prefs.targetGender = 'Groom';
      } else if (currentUser && currentUser.gender) {
        prefs.targetGender = currentUser.gender.toLowerCase() === 'groom' ? 'Bride' : 'Groom';
      }

      // 3. Clan extraction
      CLANS.forEach(clan => {
        if (new RegExp(`\\b${clan}\\b`, 'i').test(q)) {
          prefs.targetClans.push(clan.charAt(0).toUpperCase() + clan.slice(1));
        }
      });

      // If generic and user has prefCaste set
      if (prefs.targetClans.length === 0 && currentUser) {
        if (currentUser.prefCaste && currentUser.prefCaste !== 'Any') {
          prefs.targetClans.push(currentUser.prefCaste);
        }
      }

      // 4. Age range extraction
      // Examples: "between 23 and 27", "23 to 27", "23-27", "under 28", "above 24", "age 25"
      const betweenMatch = q.match(/between\s+(\d{2})\s*(?:and|to|-)\s*(\d{2})/i) ||
                           q.match(/(\d{2})\s*(?:to|-)\s*(\d{2})\s*(?:years?|yrs?|age)?/i);
      if (betweenMatch) {
        prefs.ageMin = parseInt(betweenMatch[1], 10);
        prefs.ageMax = parseInt(betweenMatch[2], 10);
      } else {
        const underMatch = q.match(/(?:under|below|less than)\s+(\d{2})/i);
        if (underMatch) {
          prefs.ageMin = 18;
          prefs.ageMax = parseInt(underMatch[1], 10);
        } else {
          const aboveMatch = q.match(/(?:above|older than|more than|minimum)\s+(\d{2})/i);
          if (aboveMatch) {
            prefs.ageMin = parseInt(aboveMatch[1], 10);
            prefs.ageMax = 45;
          } else {
            const singleAgeMatch = q.match(/(?:age\s+|around\s+|is\s+)?(\d{2})\s*(?:years?|yrs?|\b)/i);
            if (singleAgeMatch && parseInt(singleAgeMatch[1], 10) >= 18 && parseInt(singleAgeMatch[1], 10) <= 60) {
              const baseAge = parseInt(singleAgeMatch[1], 10);
              prefs.ageMin = Math.max(18, baseAge - 2);
              prefs.ageMax = baseAge + 2;
            }
          }
        }
      }

      // Fallback age to user profile if generic
      if (!prefs.ageMin && !prefs.ageMax && currentUser) {
        prefs.ageMin = parseInt(currentUser.prefMinAge, 10) || 21;
        prefs.ageMax = parseInt(currentUser.prefMaxAge, 10) || 29;
      }

      // 5. Location extraction
      LOCATIONS.forEach(loc => {
        if (new RegExp(`\\b${loc}\\b`, 'i').test(q)) {
          prefs.targetLocations.push(loc.charAt(0).toUpperCase() + loc.slice(1));
        }
      });
      if (prefs.targetLocations.length === 0 && currentUser && currentUser.prefLocation && currentUser.prefLocation !== 'Any') {
        prefs.targetLocations.push(currentUser.prefLocation);
      }

      // 6. Profession extraction
      PROFESSIONS.forEach(group => {
        if (group.terms.some(t => new RegExp(`\\b${t}\\b`, 'i').test(q))) {
          prefs.targetProfessions.push(group.key);
        }
      });

      return prefs;
    },

    /**
     * Executes AI Search across all profiles in database
     */
    searchDatabase(queryText, currentUser, customProfilesList) {
      const allProfiles = customProfilesList || (typeof getAllProfiles === 'function' ? getAllProfiles() : (window.SEED_PROFILES || []));
      const user = currentUser || (typeof checkAuth === 'function' ? null : null) || JSON.parse(localStorage.getItem('currentUser') || 'null');
      const prefs = this.parseQueryPreferences(queryText, user);

      const userPaternalGotra = user ? (user.gotra || '').split(' ')[0].trim().toLowerCase() : '';
      const userMaternalGotra = user ? (user.motherGotra || '').split(' ')[0].trim().toLowerCase() : '';
      const userClan = user ? (user.clan || user.caste || '').toLowerCase() : '';

      const scoredList = [];

      for (const p of allProfiles) {
        // 1. Exclude self
        if (user && (p.id === user.id || (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()))) {
          continue;
        }

        // 2. Gender check
        if (prefs.targetGender) {
          if ((p.gender || '').toLowerCase() !== prefs.targetGender.toLowerCase()) {
            continue;
          }
        }

        let score = 50; // Baseline
        const reasons = [];

        // 3. Gotra & Sagotra check (strict Rajput rule)
        const candidateGotra = (p.gotra || '').split(' ')[0].trim().toLowerCase();
        let hasSagotraConflict = false;
        if (userPaternalGotra && candidateGotra && candidateGotra === userPaternalGotra) {
          hasSagotraConflict = true;
        }
        if (userMaternalGotra && candidateGotra && candidateGotra === userMaternalGotra) {
          hasSagotraConflict = true;
        }

        if (hasSagotraConflict) {
          // Severely penalize sagotra union to respect traditional guidelines
          score -= 40;
          reasons.push('⚠️ Sagotra overlap detected');
        } else if (userPaternalGotra) {
          score += 10;
          reasons.push('🛡️ Sagotra-safe verified (Zero gotra conflict)');
        }

        // 4. Clan compatibility
        const candidateClan = (p.clan || p.caste || '').toLowerCase();
        if (prefs.targetClans.length > 0) {
          const matchClan = prefs.targetClans.some(c => c.toLowerCase() === candidateClan);
          if (matchClan) {
            score += 22;
            reasons.push(`🏰 Exact ${p.clan} Clan Match`);
          } else {
            score -= 5;
          }
        } else if (userClan) {
          // Check historical noble alliances
          const alliances = HISTORICAL_ALLIANCES[userClan] || [];
          if (alliances.includes(candidateClan)) {
            score += 15;
            reasons.push(`👑 Prestigious Alliance (${user.clan || 'Rajput'} + ${p.clan})`);
          } else {
            score += 5;
          }
        }

        // 5. Age compatibility
        const candidateAge = parseInt(p.age, 10) || 25;
        if (prefs.ageMin && prefs.ageMax) {
          if (candidateAge >= prefs.ageMin && candidateAge <= prefs.ageMax) {
            score += 16;
            reasons.push(`📅 Age ${candidateAge} aligns with ${prefs.ageMin}–${prefs.ageMax} target`);
          } else if (Math.abs(candidateAge - prefs.ageMin) <= 2 || Math.abs(candidateAge - prefs.ageMax) <= 2) {
            score += 8;
            reasons.push(`📅 Age ${candidateAge} is close to target range`);
          } else {
            score -= 10;
          }
        }

        // 6. Location compatibility
        const pLocation = `${p.location || ''} ${p.native || ''} ${p.thikana || ''}`.toLowerCase();
        if (prefs.targetLocations.length > 0) {
          const matchedLoc = prefs.targetLocations.find(loc => pLocation.includes(loc.toLowerCase()));
          if (matchedLoc) {
            score += 16;
            reasons.push(`📍 Located in ${matchedLoc}`);
          }
        } else if (user && user.location) {
          const userCity = user.location.split(',')[0].trim().toLowerCase();
          if (userCity && pLocation.includes(userCity)) {
            score += 10;
            reasons.push(`📍 Same Region (${user.location.split(',')[0]})`);
          }
        }

        // 7. Profession & Education alignment
        const pCareer = `${p.occupation || ''} ${p.education || ''}`.toLowerCase();
        if (prefs.targetProfessions.length > 0) {
          let careerMatched = false;
          for (const profKey of prefs.targetProfessions) {
            const group = PROFESSIONS.find(g => g.key === profKey);
            if (group && group.terms.some(t => pCareer.includes(t))) {
              score += 18;
              reasons.push(`💼 Professional match in ${group.key.replace('_', ' ').toUpperCase()}`);
              careerMatched = true;
              break;
            }
          }
          if (!careerMatched) score -= 5;
        } else {
          if (pCareer.includes('doctor') || pCareer.includes('iit') || pCareer.includes('iim') || pCareer.includes('ias') || pCareer.includes('architect') || pCareer.includes('engineer')) {
            score += 8;
            reasons.push(`🎓 High Pedigree Career (${(p.occupation || 'Professional').split(',')[0]})`);
          }
        }

        // 8. Lineage Verification & Activity bonus
        if (p.isVerified) {
          score += 6;
          reasons.push(`👑 Wax Seal Lineage Verified`);
        }
        if (p.isRecentlyActive) {
          score += 4;
        }

        // Final score normalization
        const finalScore = Math.max(55, Math.min(99, Math.round(score)));

        scoredList.push({
          profile: p,
          matchScore: finalScore,
          reasons: reasons.slice(0, 4),
          hasSagotraConflict: hasSagotraConflict
        });
      }

      // Sort by highest matchScore first, putting sagotra conflicts at bottom
      scoredList.sort((a, b) => {
        if (a.hasSagotraConflict !== b.hasSagotraConflict) {
          return a.hasSagotraConflict ? 1 : -1;
        }
        return b.matchScore - a.matchScore;
      });

      return {
        query: queryText,
        preferences: prefs,
        totalEvaluated: allProfiles.length,
        results: scoredList
      };
    },

    /**
     * Formats conversational HTML response for Chatbot with cards and actions
     */
    generateChatbotResponse(queryText, searchOutcome, currentUser) {
      const { preferences, results } = searchOutcome;
      const topMatches = results.filter(r => !r.hasSagotraConflict).slice(0, 3);

      if (topMatches.length === 0) {
        return `
          <div class="message-bubble" style="border-left: 3px solid #E53E3E;">
            <strong>👑 Kunwar AI Search Summary:</strong><br>
            I searched the entire lineage database for your request: <em>"${queryText}"</em>, but could not find matching profiles that strictly satisfy traditional Gotra and Clan guidelines.
            <br><br>
            💡 <em>Suggestion: Try expanding your age range or searching without specific location constraints.</em>
          </div>
        `;
      }

      let introText = '';
      if (preferences.isGenericRequest && currentUser) {
        introText = `Khammaghani <strong>${(currentUser.name || 'Noble Member').split(' ')[0]}</strong>! Based on your royal profile preferences (<em>${preferences.targetGender || 'Match'}, ${preferences.targetClans.join('/') || 'Compatible Clans'}, Age ${preferences.ageMin || 21}–${preferences.ageMax || 29}</em>), I evaluated our database and curated these top matches for you:`;
      } else {
        const criteriaParts = [];
        if (preferences.targetGender) criteriaParts.push(preferences.targetGender);
        if (preferences.targetClans.length > 0) criteriaParts.push(`${preferences.targetClans.join('/')} Clan`);
        if (preferences.ageMin && preferences.ageMax) criteriaParts.push(`Age ${preferences.ageMin}–${preferences.ageMax}`);
        if (preferences.targetLocations.length > 0) criteriaParts.push(preferences.targetLocations.join(', '));
        if (preferences.targetProfessions.length > 0) criteriaParts.push(preferences.targetProfessions.join(', '));

        const criteriaStr = criteriaParts.length > 0 ? criteriaParts.join(' • ') : 'your preferences';
        introText = `✨ <strong>Kunwar AI Match Search:</strong> Found <strong>${topMatches.length} noble matches</strong> matching <em>${criteriaStr}</em>:`;
      }

      let cardsHtml = topMatches.map((item, idx) => {
        const p = item.profile;
        const score = item.matchScore;
        const reasonsHtml = item.reasons.map(r => `<div style="font-size: 0.73rem; color: #E2E8F0; margin-bottom: 3px; display: flex; align-items: center; gap: 5px;"><span>${r}</span></div>`).join('');
        
        let photoHtml = '';
        if (p.profilePic || p.img) {
          photoHtml = `<img src="${p.profilePic || p.img}" alt="${p.name}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 1.5px solid #FCD34D;">`;
        } else {
          photoHtml = `
            <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #4A0D18, #6B1220); border: 1.5px solid #FCD34D; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #FCD34D; font-size: 0.95rem;">
              ${p.initials || 'NM'}
            </div>
          `;
        }

        return `
          <div class="chat-ai-match-card" style="background: rgba(40, 5, 12, 0.92); border: 1.5px solid rgba(212, 175, 55, 0.45); border-radius: 10px; padding: 12px; margin-top: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.35);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <div style="display: flex; gap: 10px; align-items: center;">
                ${photoHtml}
                <div>
                  <h4 style="margin: 0; font-family: var(--font-royal); color: #FCD34D; font-size: 0.95rem;">${p.name}</h4>
                  <div style="font-size: 0.74rem; color: #CBD5E0; margin-top: 2px;">
                    ${p.clan} Clan • ${p.age} Yrs • ${p.location ? p.location.split(',')[0] : 'Rajasthan'}
                  </div>
                </div>
              </div>
              <div style="background: linear-gradient(135deg, #E8C766 0%, #C9A227 100%); color: #1A050B; font-weight: 800; font-size: 0.72rem; padding: 3px 8px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap;">
                ✨ ${score}% Match
              </div>
            </div>

            <div style="background: rgba(0,0,0,0.35); border-radius: 6px; padding: 6px 8px; margin-bottom: 8px;">
              <div style="font-size: 0.72rem; color: #A0AEC0; margin-bottom: 2px;">
                <strong>Gotra:</strong> ${p.gotra || 'Not Specified'} • <strong>Career:</strong> ${(p.occupation || 'Professional').split(',')[0]}
              </div>
              <div style="margin-top: 5px; border-top: 1px solid rgba(212, 175, 55, 0.15); padding-top: 4px;">
                ${reasonsHtml}
              </div>
            </div>

            <div style="display: flex; gap: 6px;">
              <button onclick="openChatMatchDetails('${p.id}')" class="btn btn-outline" style="flex: 1; padding: 6px 10px; font-size: 0.75rem; border-radius: 4px;">
                👁️ View Details
              </button>
              <button onclick="handleSendInterest('${p.id}')" class="btn btn-royal" style="flex: 1; padding: 6px 10px; font-size: 0.75rem; border-radius: 4px;">
                💌 Send Interest
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Add a footer button to view these matches on the main Dashboard grid
      const dashboardActionHtml = `
        <div style="margin-top: 12px; text-align: center;">
          <button onclick="window.KunwarAIMatchmaker.applyToDashboardGrid('${encodeURIComponent(queryText)}')" class="btn btn-royal" style="width: 100%; font-size: 0.8rem; padding: 8px; background: var(--gold-gradient); color: #1A050B; font-weight: 700; border: none; border-radius: 6px;">
            🔍 Show All Matched Profiles on Dashboard
          </button>
        </div>
      `;

      return `
        <div class="message-bubble" style="padding: 10px 12px; max-width: 100%;">
          ${introText}
          ${cardsHtml}
          ${dashboardActionHtml}
        </div>
      `;
    },

    /**
     * Applies AI search results directly to the Dashboard Matches Grid
     */
    applyToDashboardGrid(encodedQuery) {
      const query = decodeURIComponent(encodedQuery || '');
      // Close chatbot window
      const chatWin = document.getElementById('royalChatbotWindow');
      if (chatWin) chatWin.classList.remove('active');

      // If not on dashboard.html, redirect there with parameter
      if (!document.getElementById('matchesGrid')) {
        sessionStorage.setItem('aiPendingQuery', query);
        window.location.href = 'dashboard.html';
        return;
      }

      // Execute on dashboard
      if (typeof window.executeAIMatchSearchOnDashboard === 'function') {
        window.executeAIMatchSearchOnDashboard(query);
      }
    }
  };

  // Expose globally
  window.KunwarAIMatchmaker = KunwarAIMatchmaker;
})();
