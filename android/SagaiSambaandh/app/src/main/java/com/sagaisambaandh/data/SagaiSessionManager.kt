package com.sagaisambaandh.data

import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.State
class SagaiSessionManager {
    private val _currentUser = mutableStateOf<User?>(null)
    val currentUser: State<User?> = _currentUser

    private val _profiles = mutableStateOf<List<Profile>>(MockData.profiles)
    val profiles: State<List<Profile>> = _profiles

    private val _shortlistedIds = mutableStateOf<Set<String>>(emptySet())
    val shortlistedIds: State<Set<String>> = _shortlistedIds

    private val _unlockedIds = mutableStateOf<Set<String>>(emptySet())
    val unlockedIds: State<Set<String>> = _unlockedIds

    fun login(user: User) {
        _currentUser.value = user
        _shortlistedIds.value = user.shortlistedIds
        _unlockedIds.value = user.unlockedIds
    }

    fun logout() {
        _currentUser.value = null
        _shortlistedIds.value = emptySet()
        _unlockedIds.value = emptySet()
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
            _currentUser.value = user.copy(shortlistedIds = currentSet)
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
            _currentUser.value = user.copy(unlockedIds = currentSet)
        }
    }

    fun isUnlocked(id: String): Boolean {
        return _unlockedIds.value.contains(id)
    }

    fun upgradeTier(tier: String) {
        _currentUser.value?.let { user ->
            _currentUser.value = user.copy(tier = tier)
        }
    }
}
