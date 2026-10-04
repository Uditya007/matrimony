package com.sagaisambaandh.data

import android.content.Context
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.State
import org.json.JSONArray
import org.json.JSONObject
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class SagaiSessionManager(private val context: Context) {
    private val sharedPrefs = context.getSharedPreferences("sagai_prefs", Context.MODE_PRIVATE)

    private val _currentUser = mutableStateOf<User?>(null)
    val currentUser: State<User?> = _currentUser

    private val _profiles = mutableStateOf<List<Profile>>(MockData.profiles)
    val profiles: State<List<Profile>> = _profiles

    private val _shortlistedIds = mutableStateOf<Set<String>>(emptySet())
    val shortlistedIds: State<Set<String>> = _shortlistedIds

    private val _unlockedIds = mutableStateOf<Set<String>>(emptySet())
    val unlockedIds: State<Set<String>> = _unlockedIds

    var isNewlyRegistered = mutableStateOf(false)

    private val _notificationsList = mutableStateOf<List<RoyalNotification>>(emptyList())
    val notificationsList: State<List<RoyalNotification>> = _notificationsList

    private val _connectionsList = mutableStateOf<List<ConnectionRecord>>(emptyList())
    val connectionsList: State<List<ConnectionRecord>> = _connectionsList

    private val _searchGender = mutableStateOf<String>("Bride")
    val searchGender: State<String> = _searchGender

    private val _searchClan = mutableStateOf<String>("All Clans")
    val searchClan: State<String> = _searchClan

    private var connectionPollingJob: kotlinx.coroutines.Job? = null

    init {
        // Load persisted user session from SharedPreferences
        val savedUserJson = sharedPrefs.getString("saved_user", null)
        if (savedUserJson != null) {
            try {
                val user = deserializeUser(savedUserJson)
                _currentUser.value = user
                _shortlistedIds.value = user.shortlistedIds
                _unlockedIds.value = user.unlockedIds
                updateSearchGenderForUser(user)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        } else {
            val guestPref = sharedPrefs.getString("search_gender_pref_guest", null)
            if (!guestPref.isNullOrEmpty()) {
                _searchGender.value = guestPref
            }
        }
        
        fetchSupabaseProfiles()
        _currentUser.value?.let {
            startConnectionPolling()
        }
    }

    fun updateSearchGenderForUser(user: User) {
        val savedPref = sharedPrefs.getString("search_gender_pref_${user.id}", null)
        if (!savedPref.isNullOrEmpty()) {
            _searchGender.value = savedPref
        } else {
            if (user.gender.lowercase() == "groom") {
                _searchGender.value = "Bride"
            } else if (user.gender.lowercase() == "bride") {
                _searchGender.value = "Groom"
            }
        }
    }

    fun setLookingForGender(gender: String) {
        _searchGender.value = gender
        val userId = _currentUser.value?.id
        if (userId != null) {
            sharedPrefs.edit().putString("search_gender_pref_$userId", gender).apply()
        } else {
            sharedPrefs.edit().putString("search_gender_pref_guest", gender).apply()
        }
    }

    fun login(user: User, isNew: Boolean = false) {
        this.isNewlyRegistered.value = isNew
        _currentUser.value = user
        _shortlistedIds.value = user.shortlistedIds
        _unlockedIds.value = user.unlockedIds
        updateSearchGenderForUser(user)
        
        try {
            val userJson = serializeUser(user)
            sharedPrefs.edit().putString("saved_user", userJson).apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        startConnectionPolling()
    }

    fun logout() {
        _currentUser.value = null
        _shortlistedIds.value = emptySet()
        _unlockedIds.value = emptySet()
        _notificationsList.value = emptyList()
        _connectionsList.value = emptyList()
        stopConnectionPolling()
        sharedPrefs.edit().remove("saved_user").apply()
    }

    fun toggleShortlist(id: String) {
        val currentSet = _shortlistedIds.value.toMutableSet()
        if (currentSet.contains(id)) {
            currentSet.remove(id)
        } else {
            currentSet.add(id)
        }
        _shortlistedIds.value = currentSet
        
        _currentUser.value?.let { user ->
            val updated = user.copy(shortlistedIds = currentSet)
            _currentUser.value = updated
            try {
                sharedPrefs.edit().putString("saved_user", serializeUser(updated)).apply()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun isShortlisted(id: String): Boolean {
        return _shortlistedIds.value.contains(id)
    }

    fun unlockProfile(id: String) {
        val currentSet = _unlockedIds.value.toMutableSet()
        currentSet.add(id)
        _unlockedIds.value = currentSet
        
        _currentUser.value?.let { user ->
            val updated = user.copy(unlockedIds = currentSet)
            _currentUser.value = updated
            try {
                sharedPrefs.edit().putString("saved_user", serializeUser(updated)).apply()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun isUnlocked(id: String): Boolean {
        return _unlockedIds.value.contains(id)
    }

    fun upgradeTier(tier: String) {
        _currentUser.value?.let { user ->
            val updated = user.copy(tier = tier)
            _currentUser.value = updated
            try {
                sharedPrefs.edit().putString("saved_user", serializeUser(updated)).apply()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun setSearchFilters(gender: String, clan: String) {
        setLookingForGender(gender)
        _searchClan.value = clan
    }

    fun updateCurrentUser(updated: User) {
        _currentUser.value = updated
        updateSearchGenderForUser(updated)
        try {
            sharedPrefs.edit().putString("saved_user", serializeUser(updated)).apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun areConnected(profileId: String): Boolean {
        val user = _currentUser.value ?: return false
        val conn = _connectionsList.value.firstOrNull {
            (it.sender_id == user.id && it.receiver_id == profileId && it.status == "accepted") ||
            (it.sender_id == profileId && it.receiver_id == user.id && it.status == "accepted")
        }
        if (conn != null) return true
        
        val pattern = java.util.regex.Pattern.compile("\\[Interests: ([^\n\r]*)\\]")
        val matcher = pattern.matcher(user.about ?: "")
        if (matcher.find()) {
            try {
                val obj = JSONObject(matcher.group(1)?.trim() ?: "")
                if (obj.optString(profileId) == "accepted") return true
            } catch (e: Exception) {}
        }
        return false
    }

    fun refreshProfiles(onComplete: (() -> Unit)? = null) {
        fetchSupabaseProfiles(onComplete)
    }

    fun refreshCurrentUserAbout() {
        val userId = _currentUser.value?.id ?: return
        fetchProfileAbout(userId) { about ->
            if (about != null) {
                _currentUser.value?.let { user ->
                    val updated = user.copy(about = about)
                    _currentUser.value = updated
                    try {
                        sharedPrefs.edit().putString("saved_user", serializeUser(updated)).apply()
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
        }
    }

    // Manual JSON serialization helpers
    private fun serializeUser(user: User): String {
        val obj = JSONObject()
        obj.put("id", user.id)
        obj.put("name", user.name)
        obj.put("email", user.email)
        obj.put("gender", user.gender)
        obj.put("clan", user.clan)
        obj.put("tier", user.tier)
        obj.put("gotra", user.gotra)
        obj.put("motherGotra", user.motherGotra)
        obj.put("thikana", user.thikana)
        obj.put("phone", user.phone)
        obj.put("dob", user.dob)
        obj.put("education", user.education)
        obj.put("occupation", user.occupation)
        obj.put("income", user.income)
        obj.put("height", user.height)
        obj.put("maritalStatus", user.maritalStatus)
        obj.put("profilePic", user.profilePic ?: "")
        obj.put("about", user.about ?: "")
        
        val shortArray = JSONArray(user.shortlistedIds.toList())
        val unlockArray = JSONArray(user.unlockedIds.toList())
        obj.put("shortlistedIds", shortArray)
        obj.put("unlockedIds", unlockArray)
        return obj.toString()
    }

    private fun deserializeUser(jsonStr: String): User {
        val obj = JSONObject(jsonStr)
        val shortList = mutableSetOf<String>()
        val shortArray = obj.optJSONArray("shortlistedIds")
        if (shortArray != null) {
            for (i in 0 until shortArray.length()) {
                shortList.add(shortArray.getString(i))
            }
        }
        
        val unlockList = mutableSetOf<String>()
        val unlockArray = obj.optJSONArray("unlockedIds")
        if (unlockArray != null) {
            for (i in 0 until unlockArray.length()) {
                unlockList.add(unlockArray.getString(i))
            }
        }
        
        return User(
            id = obj.getString("id"),
            name = obj.getString("name"),
            email = obj.getString("email"),
            gender = obj.getString("gender"),
            clan = obj.getString("clan"),
            tier = obj.optString("tier", "Starter"),
            shortlistedIds = shortList,
            unlockedIds = unlockList,
            gotra = obj.optString("gotra", ""),
            motherGotra = obj.optString("motherGotra", ""),
            thikana = obj.optString("thikana", ""),
            phone = obj.optString("phone", ""),
            dob = obj.optString("dob", ""),
            education = obj.optString("education", ""),
            occupation = obj.optString("occupation", ""),
            income = obj.optString("income", ""),
            height = obj.optString("height", ""),
            maritalStatus = obj.optString("maritalStatus", "Never Married"),
            profilePic = obj.optString("profilePic", "").takeIf { it.isNotEmpty() },
            about = obj.optString("about", "")
        )
    }

    private fun fetchSupabaseProfiles(onComplete: (() -> Unit)? = null) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = OkHttpClient()
                val url = "https://afbrznllcfgfcjuinnlf.supabase.co"
                val apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
                val request = Request.Builder()
                    .url("$url/rest/v1/profiles?select=*")
                    .addHeader("apikey", apiKey)
                    .addHeader("Authorization", "Bearer $apiKey")
                    .build()
                
                val response = client.newCall(request).execute()
                val body = response.body?.string() ?: ""
                if (response.isSuccessful && body.isNotEmpty()) {
                    val rows = JSONArray(body)
                    val liveList = mutableListOf<Profile>()
                    for (i in 0 until rows.length()) {
                        val obj = rows.getJSONObject(i)
                        val id = obj.optString("id", "")
                        val name = obj.optString("name", "Member")
                        val gender = obj.optString("gender", "Groom")
                        val clan = obj.optString("clan", "Rathore")
                        val gotra = obj.optString("gotra", "")
                        val thikana = obj.optString("thikana", "")
                        val height = obj.optString("height", "5 ft 8 in")
                        val education = obj.optString("education", "")
                        val occupation = obj.optString("occupation", "")
                        val income = obj.optString("income", "")
                        val profilePic = obj.optString("profilePic", "")
                        val about = obj.optString("about", "")
                        
                        var ageVal = 25
                        val dobStr = obj.optString("dob", "")
                        if (dobStr.isNotEmpty()) {
                            val parts = dobStr.split("-")
                            if (parts.size >= 3) {
                                parts[2].toIntOrNull()?.let { year ->
                                    ageVal = 2026 - year
                                }
                            }
                        }
                        
                        liveList.add(
                            Profile(
                                id = id,
                                name = name,
                                age = ageVal,
                                gender = gender,
                                clan = clan,
                                gotra = gotra,
                                kul = clan,
                                thikana = thikana,
                                location = thikana,
                                height = height,
                                occupation = occupation,
                                education = education,
                                income = income,
                                isVerified = true,
                                img = profilePic.ifEmpty { "groom_ranveer" },
                                about = about
                            )
                        )
                    }
                    
                    if (liveList.isNotEmpty()) {
                        CoroutineScope(Dispatchers.Main).launch {
                            _profiles.value = liveList + MockData.profiles.filter { mock ->
                                liveList.none { it.id == mock.id }
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                CoroutineScope(Dispatchers.Main).launch {
                    onComplete?.invoke()
                }
            }
        }
    }

    fun sendConnection(senderId: String, receiverId: String, onComplete: ((Boolean) -> Unit)? = null) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = OkHttpClient()
                val mediaType = "application/json; charset=utf-8".toMediaType()
                val url = "https://afbrznllcfgfcjuinnlf.supabase.co"
                val apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
                
                // Delete existing to avoid duplicates
                val delReq = Request.Builder()
                    .url("$url/rest/v1/connections?or=(and(sender_id.eq.$senderId,receiver_id.eq.$receiverId),and(sender_id.eq.$receiverId,receiver_id.eq.$senderId))")
                    .addHeader("apikey", apiKey)
                    .addHeader("Authorization", "Bearer $apiKey")
                    .delete()
                    .build()
                client.newCall(delReq).execute()
                
                val json = JSONObject().apply {
                    put("sender_id", senderId)
                    put("receiver_id", receiverId)
                    put("status", "pending")
                }
                val insReq = Request.Builder()
                    .url("$url/rest/v1/connections")
                    .addHeader("apikey", apiKey)
                    .addHeader("Authorization", "Bearer $apiKey")
                    .addHeader("Prefer", "return=minimal")
                    .post(json.toString().toRequestBody(mediaType))
                    .build()
                val resp = client.newCall(insReq).execute()
                
                // Also update sender [Interests: ...] tag
                fetchProfileAbout(senderId) { curAbout ->
                    val cleanAbout = curAbout ?: ""
                    var interestsObj = JSONObject()
                    val p = java.util.regex.Pattern.compile("\\[Interests: ([^\n\r]*)\\]")
                    val m = p.matcher(cleanAbout)
                    if (m.find()) {
                        try { interestsObj = JSONObject(m.group(1)?.trim() ?: "") } catch (e: Exception) {}
                    }
                    interestsObj.put(receiverId, "pending")
                    val newAbout = cleanAbout.replace(Regex("\\[Interests: [^\n\r]*\\]"), "").trim() + "\n[Interests: ${interestsObj}]"
                    _currentUser.value?.let { u ->
                        updateProfile(u.copy(about = newAbout)) {}
                    }
                }
                
                fetchConnectionsAndGenerateNotifications(senderId)
                CoroutineScope(Dispatchers.Main).launch {
                    onComplete?.invoke(resp.isSuccessful)
                }
            } catch (e: Exception) {
                e.printStackTrace()
                CoroutineScope(Dispatchers.Main).launch {
                    onComplete?.invoke(false)
                }
            }
        }
    }

    fun updateConnection(senderId: String, receiverId: String, status: String, onComplete: ((Boolean) -> Unit)? = null) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = OkHttpClient()
                val mediaType = "application/json; charset=utf-8".toMediaType()
                val url = "https://afbrznllcfgfcjuinnlf.supabase.co"
                val apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
                
                val json = JSONObject().apply {
                    put("status", status)
                }
                val patchReq = Request.Builder()
                    .url("$url/rest/v1/connections?sender_id.eq.$senderId&receiver_id.eq.$receiverId")
                    .addHeader("apikey", apiKey)
                    .addHeader("Authorization", "Bearer $apiKey")
                    .patch(json.toString().toRequestBody(mediaType))
                    .build()
                val resp = client.newCall(patchReq).execute()
                
                // Update receiver [Interests]
                fetchProfileAbout(receiverId) { curAbout ->
                    val cleanAbout = curAbout ?: ""
                    var interestsObj = JSONObject()
                    val p = java.util.regex.Pattern.compile("\\[Interests: ([^\n\r]*)\\]")
                    val m = p.matcher(cleanAbout)
                    if (m.find()) {
                        try { interestsObj = JSONObject(m.group(1)?.trim() ?: "") } catch (e: Exception) {}
                    }
                    interestsObj.put(senderId, status)
                    val newAbout = cleanAbout.replace(Regex("\\[Interests: [^\n\r]*\\]"), "").trim() + "\n[Interests: ${interestsObj}]"
                    _currentUser.value?.let { u ->
                        if (u.id == receiverId) {
                            updateProfile(u.copy(about = newAbout)) {}
                        }
                    }
                }
                
                _currentUser.value?.id?.let {
                    fetchConnectionsAndGenerateNotifications(it)
                }
                CoroutineScope(Dispatchers.Main).launch {
                    onComplete?.invoke(resp.isSuccessful)
                }
            } catch (e: Exception) {
                e.printStackTrace()
                CoroutineScope(Dispatchers.Main).launch {
                    onComplete?.invoke(false)
                }
            }
        }
    }

    fun sendMessage(fromUser: User, toProfile: Profile, text: String, onComplete: ((Boolean) -> Unit)? = null) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                fetchProfileAbout(fromUser.id) { senderAbout ->
                    val chatsObj = getProfileChats(senderAbout)
                    val partnerChatArray = chatsObj.optJSONArray(toProfile.id) ?: JSONArray()
                    val newMsgObj = JSONObject().apply {
                        put("s", fromUser.id)
                        put("t", text)
                        put("time", System.currentTimeMillis().toDouble())
                    }
                    partnerChatArray.put(newMsgObj)
                    chatsObj.put(toProfile.id, partnerChatArray)
                    val updatedAbout = setProfileChatsInAbout(senderAbout, chatsObj)
                    updateProfile(fromUser.copy(about = updatedAbout)) { success ->
                        if (success) {
                            _currentUser.value = fromUser.copy(about = updatedAbout)
                            try {
                                sharedPrefs.edit().putString("saved_user", serializeUser(_currentUser.value!!)).apply()
                            } catch (e: Exception) {}
                        }
                        CoroutineScope(Dispatchers.Main).launch {
                            onComplete?.invoke(success)
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                CoroutineScope(Dispatchers.Main).launch {
                    onComplete?.invoke(false)
                }
            }
        }
    }

    fun sendTelegramNotification(text: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = OkHttpClient()
                val mediaType = "application/json; charset=utf-8".toMediaType()
                val tgToken = "8830114400:AAHA6xhuANxZjYu0iie-sAF67A2jRxy_i7U"
                val tgChatId = "5124029961"
                
                val json = JSONObject().apply {
                    put("chat_id", tgChatId)
                    put("text", text)
                    put("parse_mode", "Markdown")
                }
                
                val request = Request.Builder()
                    .url("https://api.telegram.org/bot$tgToken/sendMessage")
                    .post(json.toString().toRequestBody(mediaType))
                    .build()
                    
                client.newCall(request).execute()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun notifyAdminNewRegistration(profile: User) {
        val text = "👑 *New Profile Registered (Android)* 👑\n\n" +
                   "• *Name:* ${profile.name}\n" +
                   "• *Gender:* ${profile.gender}\n" +
                   "• *Clan:* ${profile.clan}\n" +
                   "• *Gotra:* ${profile.gotra}\n" +
                   "• *Location:* ${profile.thikana}\n" +
                   "• *Phone:* ${profile.phone}\n" +
                   "• *Email:* ${profile.email}"
        sendTelegramNotification(text)
    }

    fun notifyAdminInterestSent(fromUser: User, toProfile: Profile) {
        val formatter = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault())
        val dateString = formatter.format(java.util.Date())
        val text = "💌 *Interest Request Sent (Android)* 💌\n\n" +
                   "• *From:* ${fromUser.name} _(${fromUser.clan} Clan)_\n" +
                   "• *To:* ${toProfile.name} _(${toProfile.clan} Clan)_\n\n" +
                   "📅 _Time: $dateString_"
        sendTelegramNotification(text)
    }

    fun notifyAdminChatOpened(fromUser: User, toProfile: Profile?) {
        val formatter = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault())
        val dateString = formatter.format(java.util.Date())
        val toName = toProfile?.name ?: "Matchmaker Bot"
        val toClan = toProfile?.let { " _(${it.clan} Clan)_" } ?: ""
        val text = "💬 *Chat Opened (Android)* 💬\n\n" +
                   "• *From:* ${fromUser.name} _(${fromUser.clan} Clan)_\n" +
                   "• *To:* $toName$toClan\n\n" +
                   "📅 _Time: $dateString_"
        sendTelegramNotification(text)
    }

    // Parse Chats from profile about string
    fun getProfileChats(aboutText: String?): JSONObject {
        if (aboutText.isNullOrEmpty()) return JSONObject()
        val pattern = java.util.regex.Pattern.compile("\\[Chats: ([^\n\r]*)\\]")
        val matcher = pattern.matcher(aboutText)
        if (matcher.find()) {
            val jsonString = matcher.group(1)?.trim() ?: ""
            try {
                return JSONObject(jsonString)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        return JSONObject()
    }

    // Serialize and embed Chats into profile about string
    fun setProfileChatsInAbout(aboutText: String?, chatsObj: JSONObject): String {
        var cleanAbout = aboutText ?: ""
        cleanAbout = cleanAbout.replace(Regex("\\[Chats: [^\n\r]*\\]"), "").trim()
        val jsonString = chatsObj.toString()
        return if (cleanAbout.isEmpty()) {
            "[Chats: $jsonString]"
        } else {
            "$cleanAbout\n[Chats: $jsonString]"
        }
    }

    // Merge two conversations and sort chronologically
    fun getCombinedConversation(userAbout: String?, userId: String, profileAbout: String?, profileId: String): List<SupabaseMessage> {
        val chatsA = getProfileChats(userAbout)
        val chatsB = getProfileChats(profileAbout)
        
        val listA = chatsA.optJSONArray(profileId) ?: JSONArray()
        val listB = chatsB.optJSONArray(userId) ?: JSONArray()
        
        val combined = mutableListOf<JSONObject>()
        for (i in 0 until listA.length()) {
            combined.add(listA.getJSONObject(i))
        }
        for (i in 0 until listB.length()) {
            combined.add(listB.getJSONObject(i))
        }
        
        val unique = mutableListOf<JSONObject>()
        val seen = mutableSetOf<String>()
        for (msg in combined) {
            val s = msg.optString("s")
            val t = msg.optString("t")
            val time = msg.optDouble("time", 0.0)
            val key = "${s}_${t}_${time}"
            if (!seen.contains(key)) {
                seen.add(key)
                unique.add(msg)
            }
        }
        
        unique.sortBy { it.optDouble("time", 0.0) }
        return unique.map { obj ->
            val s = obj.optString("s")
            val t = obj.optString("t")
            val time = obj.optDouble("time", 0.0)
            SupabaseMessage(
                id = "${s}_${time}",
                senderId = s,
                text = t,
                time = time
            )
        }
    }

    fun getLastMessage(userAbout: String?, userId: String, profileAbout: String?, profileId: String): SupabaseMessage? {
        val list = getCombinedConversation(userAbout, userId, profileAbout, profileId)
        return list.lastOrNull()
    }

    fun fetchProfileAbout(profileId: String, onComplete: (String?) -> Unit) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = OkHttpClient()
                val url = "https://afbrznllcfgfcjuinnlf.supabase.co"
                val apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
                val request = Request.Builder()
                    .url("$url/rest/v1/profiles?id=eq.$profileId&select=about")
                    .addHeader("apikey", apiKey)
                    .addHeader("Authorization", "Bearer $apiKey")
                    .build()
                
                val response = client.newCall(request).execute()
                val body = response.body?.string() ?: ""
                if (response.isSuccessful && body.isNotEmpty()) {
                    val rows = JSONArray(body)
                    if (rows.length() > 0) {
                        val first = rows.getJSONObject(0)
                        val about = first.optString("about", "")
                        onComplete(about)
                        return@launch
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
            onComplete(null)
        }
    }

    fun updateProfile(user: User, onComplete: (Boolean) -> Unit) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = OkHttpClient()
                val mediaType = "application/json; charset=utf-8".toMediaType()
                val url = "https://afbrznllcfgfcjuinnlf.supabase.co"
                val apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
                
                val fields = JSONObject().apply {
                    put("name", user.name)
                    put("clan", user.clan)
                    put("gotra", user.gotra)
                    put("motherGotra", user.motherGotra)
                    put("thikana", user.thikana)
                    put("phone", user.phone)
                    put("dob", user.dob)
                    put("profilePic", user.profilePic ?: "")
                    put("about", user.about ?: "")
                }
                
                val request = Request.Builder()
                    .url("$url/rest/v1/profiles?id=eq.${user.id}")
                    .addHeader("apikey", apiKey)
                    .addHeader("Authorization", "Bearer $apiKey")
                    .patch(fields.toString().toRequestBody(mediaType))
                    .build()
                
                val response = client.newCall(request).execute()
                onComplete(response.isSuccessful)
            } catch (e: Exception) {
                e.printStackTrace()
                onComplete(false)
            }
        }
    }

    fun startConnectionPolling() {
        connectionPollingJob?.cancel()
        val userId = _currentUser.value?.id ?: return
        connectionPollingJob = CoroutineScope(Dispatchers.IO).launch {
            while (true) {
                fetchConnectionsAndGenerateNotifications(userId)
                kotlinx.coroutines.delay(6000)
            }
        }
    }

    fun stopConnectionPolling() {
        connectionPollingJob?.cancel()
        connectionPollingJob = null
    }

    fun fetchConnectionsAndGenerateNotifications(userId: String) {
        try {
            val client = OkHttpClient()
            val url = "https://afbrznllcfgfcjuinnlf.supabase.co"
            val apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
            
            val request = Request.Builder()
                .url("$url/rest/v1/connections?or=(sender_id.eq.$userId,receiver_id.eq.$userId)")
                .addHeader("apikey", apiKey)
                .addHeader("Authorization", "Bearer $apiKey")
                .build()
            
            val response = client.newCall(request).execute()
            val body = response.body?.string() ?: ""
            if (response.isSuccessful && body.isNotEmpty()) {
                val records = JSONArray(body)
                val list = mutableListOf<RoyalNotification>()
                val connList = mutableListOf<ConnectionRecord>()
                for (i in 0 until records.length()) {
                    val record = records.getJSONObject(i)
                    val senderId = record.optString("sender_id", "")
                    val receiverId = record.optString("receiver_id", "")
                    val status = record.optString("status", "")
                    connList.add(ConnectionRecord(senderId, receiverId, status))
                    
                    if (receiverId == userId && status == "pending") {
                        val senderProfile = profiles.value.firstOrNull { it.id == senderId }
                        val senderName = senderProfile?.name ?: "Noble Member"
                        list.add(RoyalNotification(
                            id = "${senderId}_pending",
                            notifKey = "interest_from_$senderId",
                            message = "$senderName sent you a Royal Match Interest! Accept to reveal mobile number.",
                            profileId = senderId,
                            timestamp = "Just now",
                            read = false
                        ))
                    } else if (status == "accepted") {
                        val otherId = if (senderId == userId) receiverId else senderId
                        val otherProfile = profiles.value.firstOrNull { it.id == otherId }
                        val otherName = otherProfile?.name ?: "Noble Member"
                        list.add(RoyalNotification(
                            id = "${otherId}_accepted",
                            notifKey = "accepted_from_$otherId",
                            message = "$otherName connected with you! Contact details & chat are unlocked.",
                            profileId = otherId,
                            timestamp = "Just now",
                            read = false
                        ))
                    }
                }
                
                CoroutineScope(Dispatchers.Main).launch {
                    _connectionsList.value = connList
                    _notificationsList.value = list
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

data class RoyalNotification(
    val id: String,
    val notifKey: String,
    val message: String,
    val profileId: String,
    val timestamp: String,
    val read: Boolean
)
