package com.sagaisambaandh.data

data class Profile(
    val id: String,
    val name: String,
    val age: Int,
    val gender: String, // "Bride" or "Groom"
    val clan: String,
    val gotra: String,
    val kul: String,
    val thikana: String,
    val location: String,
    val height: String,
    val occupation: String,
    val education: String,
    val income: String,
    val isVerified: Boolean,
    val img: String? = null // local resource identifier
)

data class Clan(
    val name: String,
    val origin: String,
    val dynasty: String,
    val history: String
)

data class User(
    val id: String,
    val name: String,
    val email: String,
    val gender: String,
    val clan: String,
    val tier: String = "Starter", // "Starter", "Silver", "Gold"
    val shortlistedIds: Set<String> = emptySet(),
    val unlockedIds: Set<String> = emptySet()
)
