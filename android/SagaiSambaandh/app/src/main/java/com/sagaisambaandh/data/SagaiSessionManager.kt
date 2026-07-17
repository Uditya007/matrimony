package com.sagaisambaandh.data

import android.content.Context
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.State
import org.json.JSONArray
import org.json.JSONObject

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

    init {
        // Load persisted user session from SharedPreferences
        val savedUserJson = sharedPrefs.getString("saved_user", null)
        if (savedUserJson != null) {
            try {
                val user = deserializeUser(savedUserJson)
                _currentUser.value = user
                _shortlistedIds.value = user.shortlistedIds
                _unlockedIds.value = user.unlockedIds
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun login(user: User) {
        _currentUser.value = user
        _shortlistedIds.value = user.shortlistedIds
        _unlockedIds.value = user.unlockedIds
        
        try {
            val userJson = serializeUser(user)
            sharedPrefs.edit().putString("saved_user", userJson).apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun logout() {
        _currentUser.value = null
        _shortlistedIds.value = emptySet()
        _unlockedIds.value = emptySet()
        
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

    // Search filters state
    private val _searchGender = mutableStateOf<String>("Bride")
    val searchGender: State<String> = _searchGender

    private val _searchClan = mutableStateOf<String>("All Clans")
    val searchClan: State<String> = _searchClan

    fun setSearchFilters(gender: String, clan: String) {
        _searchGender.value = gender
        _searchClan.value = clan
    }

    fun updateCurrentUser(updated: User) {
        _currentUser.value = updated
        try {
            sharedPrefs.edit().putString("saved_user", serializeUser(updated)).apply()
        } catch (e: Exception) {
            e.printStackTrace()
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
            profilePic = obj.optString("profilePic", "").takeIf { it.isNotEmpty() }
        )
    }
}
