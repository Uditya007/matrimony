package com.sagaisambaandh.util

import com.sagaisambaandh.data.Profile
import com.sagaisambaandh.data.User
import java.util.regex.Pattern
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

data class ScoredProfile(
    val profile: Profile,
    val matchScore: Int, // 55 to 99
    val reasons: List<String>,
    val hasSagotraConflict: Boolean
)

data class AIMatchPreferences(
    var isGenericRequest: Boolean = false,
    var targetGender: String? = null,
    val targetClans: MutableList<String> = mutableListOf(),
    var ageMin: Int? = null,
    var ageMax: Int? = null,
    val targetLocations: MutableList<String> = mutableListOf(),
    val targetProfessions: MutableList<String> = mutableListOf(),
    val rawQuery: String = ""
)

object AIMatchmaker {
    private val clans = listOf(
        "rathore", "sisodia", "chauhan", "kachwaha", "kachawa", "bhati",
        "shekhawat", "tanwar", "panwar", "tomar", "solanki", "parmar",
        "parihar", "jadeja", "jhala", "hadda", "deora", "chundawat"
    )

    private val locations = listOf(
        "jaipur", "jodhpur", "udaipur", "bikaner", "ajmer", "sikar", "alwar",
        "jaisalmer", "barmer", "kota", "pali", "nagaur", "jhunjhunu", "rajasthan",
        "delhi", "ncr", "mumbai", "pune", "bangalore", "bengaluru", "hyderabad",
        "indore", "ahmedabad", "usa", "uk", "dubai", "canada"
    )

    private val historicalAlliances = mapOf(
        "rathore" to listOf("sisodia", "chauhan", "bhati", "kachwaha"),
        "sisodia" to listOf("rathore", "bhati", "chauhan", "jhala"),
        "chauhan" to listOf("rathore", "sisodia", "bhati", "kachwaha"),
        "kachwaha" to listOf("rathore", "sisodia", "chauhan", "shekhawat"),
        "bhati" to listOf("rathore", "sisodia", "chauhan"),
        "shekhawat" to listOf("rathore", "sisodia", "kachwaha", "bhati"),
        "tanwar" to listOf("rathore", "sisodia", "chauhan"),
        "panwar" to listOf("rathore", "sisodia", "chauhan")
    )

    private val professionGroups = listOf(
        "doctor" to listOf("doctor", "physician", "surgeon", "mbbs", "md", "ms", "dentist", "medical"),
        "engineer" to listOf("engineer", "software", "tech", "developer", "iit", "b.tech", "m.tech", "ai", "data", "coding"),
        "business" to listOf("business", "entrepreneur", "hotelier", "resorts", "founder", "startup", "real estate", "industrialist"),
        "civil_services" to listOf("ias", "ips", "ras", "irs", "civil service", "government", "govt", "officer", "bureaucrat"),
        "defence" to listOf("army", "navy", "air force", "defence", "military", "colonel", "captain", "major"),
        "management" to listOf("mba", "iim", "finance", "consultant", "banker", "analyst", "manager"),
        "finance" to listOf("ca", "chartered accountant", "audit", "tax", "cfa"),
        "heritage" to listOf("architect", "restoration", "art", "historian", "curator", "heritage"),
        "academic" to listOf("professor", "scholar", "lecturer", "researcher", "teacher")
    )

    fun parseQueryPreferences(queryText: String?, currentUser: User?): AIMatchPreferences {
        val q = (queryText ?: "").lowercase().trim()
        val prefs = AIMatchPreferences(rawQuery = queryText ?: "")

        val genericTriggers = listOf(
            "my type", "his type", "her type", "my preference", "his preference",
            "my match", "perfect match", "ideal match", "compatible match",
            "mere type", "mere hisab", "show match", "find match", "recommend match",
            "according to preference", "based on preference", "suggest match"
        )

        prefs.isGenericRequest = genericTriggers.any { q.contains(it) } || q.isEmpty()

        // Gender detection
        val brideWords = listOf("bride", "brides", "ladi", "ladki", "girl", "girls", "female", "woman", "women", "kanya", "she", "her")
        val groomWords = listOf("groom", "grooms", "banna", "ladka", "boy", "boys", "male", "man", "men", "var", "kunwar", "he", "his", "him")

        if (brideWords.any { containsWord(q, it) }) {
            prefs.targetGender = "Bride"
        } else if (groomWords.any { containsWord(q, it) }) {
            prefs.targetGender = "Groom"
        } else if (currentUser != null) {
            prefs.targetGender = if (currentUser.gender.equals("groom", ignoreCase = true)) "Bride" else "Groom"
        }

        // Clan extraction
        for (clan in clans) {
            if (containsWord(q, clan)) {
                prefs.targetClans.add(clan.replaceFirstChar { it.uppercase() })
            }
        }

        // Age range extraction
        val (minAge, maxAge) = extractAgeRange(q)
        if (minAge != null && maxAge != null) {
            prefs.ageMin = minAge
            prefs.ageMax = maxAge
        } else {
            prefs.ageMin = 21
            prefs.ageMax = 32
        }

        // Location extraction
        for (loc in locations) {
            if (containsWord(q, loc)) {
                prefs.targetLocations.add(loc.replaceFirstChar { it.uppercase() })
            }
        }
        if (prefs.targetLocations.isEmpty() && currentUser != null && currentUser.location.isNotEmpty()) {
            prefs.targetLocations.add(currentUser.location)
        }

        // Profession extraction
        for ((groupKey, terms) in professionGroups) {
            if (terms.any { containsWord(q, it) }) {
                prefs.targetProfessions.add(groupKey)
            }
        }

        return prefs
    }

    fun searchDatabase(
        queryText: String?,
        currentUser: User?,
        allProfiles: List<Profile>
    ): List<ScoredProfile> {
        val prefs = parseQueryPreferences(queryText, currentUser)

        val userPaternalGotra = currentUser?.gotra?.split(" ")?.firstOrNull()?.trim()?.lowercase().orEmpty()
        val userMaternalGotra = currentUser?.motherGotra?.split(" ")?.firstOrNull()?.trim()?.lowercase().orEmpty()
        val userClan = currentUser?.clan?.lowercase().orEmpty()

        val scoredList = mutableListOf<ScoredProfile>()

        for (p in allProfiles) {
            // Exclude self
            if (currentUser != null && (p.id == currentUser.id || (currentUser.email.isNotEmpty() && currentUser.email.equals(p.name, ignoreCase = true)))) {
                continue
            }

            // Gender check
            prefs.targetGender?.let { targetGender ->
                if (!p.gender.equals(targetGender, ignoreCase = true)) {
                    return@let
                }
            }
            if (prefs.targetGender != null && !p.gender.equals(prefs.targetGender, ignoreCase = true)) {
                continue
            }

            var score = 50 // Baseline
            val reasons = mutableListOf<String>()

            // Gotra & Sagotra check
            val candidateGotra = p.gotra.split(" ").firstOrNull()?.trim()?.lowercase().orEmpty()
            var hasSagotraConflict = false
            if (userPaternalGotra.isNotEmpty() && candidateGotra.isNotEmpty() && candidateGotra == userPaternalGotra) {
                hasSagotraConflict = true
            }
            if (userMaternalGotra.isNotEmpty() && candidateGotra.isNotEmpty() && candidateGotra == userMaternalGotra) {
                hasSagotraConflict = true
            }

            if (hasSagotraConflict) {
                score -= 40
                reasons.add("⚠️ Sagotra overlap detected")
            } else if (userPaternalGotra.isNotEmpty()) {
                score += 10
                reasons.add("🛡️ Sagotra-safe verified (Zero gotra conflict)")
            }

            // Clan compatibility
            val candidateClan = p.clan.lowercase()
            if (prefs.targetClans.isNotEmpty()) {
                val matchClan = prefs.targetClans.any { it.equals(candidateClan, ignoreCase = true) }
                if (matchClan) {
                    score += 22
                    reasons.add("🏰 Exact ${p.clan} Clan Match")
                } else {
                    score -= 5
                }
            } else if (userClan.isNotEmpty()) {
                val alliances = historicalAlliances[userClan].orEmpty()
                if (alliances.contains(candidateClan)) {
                    score += 15
                    reasons.add("👑 Prestigious Alliance (${currentUser?.clan ?: "Rajput"} + ${p.clan})")
                } else {
                    score += 5
                }
            }

            // Age compatibility
            val candidateAge = p.age
            val ageMin = prefs.ageMin
            val ageMax = prefs.ageMax
            if (ageMin != null && ageMax != null) {
                if (candidateAge in ageMin..ageMax) {
                    score += 16
                    reasons.add("📅 Age $candidateAge aligns with $ageMin–$ageMax target")
                } else if (abs(candidateAge - ageMin) <= 2 || abs(candidateAge - ageMax) <= 2) {
                    score += 8
                    reasons.add("📅 Age $candidateAge is close to target range")
                } else {
                    score -= 10
                }
            }

            // Location compatibility
            val pLocation = "${p.location} ${p.thikana}".lowercase()
            if (prefs.targetLocations.isNotEmpty()) {
                val matchedLoc = prefs.targetLocations.firstOrNull { pLocation.contains(it.lowercase()) }
                if (matchedLoc != null) {
                    score += 16
                    reasons.add("📍 Located in $matchedLoc")
                }
            } else if (currentUser != null && currentUser.location.isNotEmpty()) {
                val userCity = currentUser.location.split(",").firstOrNull()?.trim()?.lowercase().orEmpty()
                if (userCity.isNotEmpty() && pLocation.contains(userCity)) {
                    score += 10
                    reasons.add("📍 Same Region (${userCity.replaceFirstChar { it.uppercase() }})")
                }
            }

            // Profession compatibility
            val pCareer = "${p.occupation} ${p.education}".lowercase()
            if (prefs.targetProfessions.isNotEmpty()) {
                var careerMatched = false
                for (profKey in prefs.targetProfessions) {
                    val group = professionGroups.firstOrNull { it.first == profKey }
                    if (group != null && group.second.any { pCareer.contains(it) }) {
                        score += 18
                        val label = group.first.replace('_', ' ').replaceFirstChar { it.uppercase() }
                        reasons.add("💼 Match in $label")
                        careerMatched = true
                        break
                    }
                }
                if (!careerMatched) score -= 5
            } else {
                if (pCareer.contains("doctor") || pCareer.contains("iit") || pCareer.contains("iim") ||
                    pCareer.contains("ias") || pCareer.contains("architect") || pCareer.contains("engineer")
                ) {
                    score += 8
                    val occFirst = p.occupation.split(",").firstOrNull() ?: "Professional"
                    reasons.add("🎓 High Pedigree Career ($occFirst)")
                }
            }

            // Verification bonus
            if (p.isVerified) {
                score += 6
                reasons.add("👑 Wax Seal Lineage Verified")
            }

            val finalScore = max(55, min(99, score))
            scoredList.add(
                ScoredProfile(
                    profile = p,
                    matchScore = finalScore,
                    reasons = reasons.take(4),
                    hasSagotraConflict = hasSagotraConflict
                )
            )
        }

        // Sort highest matchScore first, placing sagotra conflicts at the bottom
        scoredList.sortWith { a, b ->
            if (a.hasSagotraConflict != b.hasSagotraConflict) {
                if (a.hasSagotraConflict) 1 else -1
            } else {
                b.matchScore.compareTo(a.matchScore)
            }
        }

        return scoredList
    }

    private fun containsWord(text: String, word: String): Boolean {
        val pattern = Pattern.compile("\\b${Pattern.quote(word)}\\b", Pattern.CASE_INSENSITIVE)
        return pattern.matcher(text).find()
    }

    private fun extractAgeRange(text: String): Pair<Int?, Int?> {
        val rangeMatcher = Pattern.compile("(\\d{2})\\s*(?:to|-|and)\\s*(\\d{2})", Pattern.CASE_INSENSITIVE).matcher(text)
        if (rangeMatcher.find()) {
            val minA = rangeMatcher.group(1)?.toIntOrNull()
            val maxA = rangeMatcher.group(2)?.toIntOrNull()
            if (minA != null && maxA != null) return Pair(minA, maxA)
        }

        val underMatcher = Pattern.compile("(?:under|below|less than)\\s+(\\d{2})", Pattern.CASE_INSENSITIVE).matcher(text)
        if (underMatcher.find()) {
            val maxA = underMatcher.group(1)?.toIntOrNull()
            if (maxA != null) return Pair(18, maxA)
        }

        val aboveMatcher = Pattern.compile("(?:above|older than|more than)\\s+(\\d{2})", Pattern.CASE_INSENSITIVE).matcher(text)
        if (aboveMatcher.find()) {
            val minA = aboveMatcher.group(1)?.toIntOrNull()
            if (minA != null) return Pair(minA, 45)
        }

        val singleMatcher = Pattern.compile("(?:age\\s+|around\\s+)?(\\d{2})\\s*(?:years|yrs)?", Pattern.CASE_INSENSITIVE).matcher(text)
        if (singleMatcher.find()) {
            val age = singleMatcher.group(1)?.toIntOrNull()
            if (age != null && age in 18..60) {
                return Pair(max(18, age - 2), age + 2)
            }
        }

        return Pair(null, null)
    }
}
