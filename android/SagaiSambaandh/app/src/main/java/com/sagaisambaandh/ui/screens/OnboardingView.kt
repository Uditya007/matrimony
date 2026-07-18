package com.sagaisambaandh.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.data.User
import com.sagaisambaandh.ui.theme.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OnboardingView(
    session: SagaiSessionManager,
    modifier: Modifier = Modifier
) {
    val currentUser = session.currentUser.value ?: return
    
    var gotraInput by remember { mutableStateOf(currentUser.gotra) }
    var motherGotraInput by remember { mutableStateOf(currentUser.motherGotra) }
    var thikanaInput by remember { mutableStateOf(currentUser.thikana) }
    var phoneInput by remember { mutableStateOf(currentUser.phone) }
    var dobInput by remember { mutableStateOf(currentUser.dob.ifEmpty { "19-10-1996" }) }
    var educationInput by remember { mutableStateOf(currentUser.education) }
    var occupationInput by remember { mutableStateOf(currentUser.occupation) }
    var incomeInput by remember { mutableStateOf(currentUser.income) }
    var heightInput by remember { mutableStateOf(currentUser.height.ifEmpty { "5 ft 8 in" }) }
    var selectedGender by remember { mutableStateOf(currentUser.gender.ifEmpty { "Groom" }) }
    var selectedClan by remember { mutableStateOf(currentUser.clan.ifEmpty { "Rathore" }) }
    
    var isSaving by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    
    val clans = listOf("Rathore", "Sisodia", "Chauhan", "Kachwaha", "Bhati", "Shekhawat")
    val heights = listOf("5 ft 0 in", "5 ft 2 in", "5 ft 4 in", "5 ft 6 in", "5 ft 8 in", "5 ft 10 in", "6 ft 0 in", "6 ft 2 in")
    
    var clanExpanded by remember { mutableStateOf(false) }
    var heightExpanded by remember { mutableStateOf(false) }

    val textFieldColors = TextFieldDefaults.colors(
        focusedTextColor = Color.Black,
        unfocusedTextColor = Color.Black,
        focusedContainerColor = CardBackground,
        unfocusedContainerColor = CardBackground,
        focusedPlaceholderColor = Color.Gray,
        unfocusedPlaceholderColor = Color.Gray,
        focusedIndicatorColor = RoyalGold,
        unfocusedIndicatorColor = Color.Transparent
    )

    fun saveProfile() {
        if (gotraInput.isEmpty() || motherGotraInput.isEmpty() || thikanaInput.isEmpty() || phoneInput.isEmpty()) {
            errorMessage = "Please fill in all lineage and contact details."
            return
        }
        
        isSaving = true
        errorMessage = null
        
        val updatedUser = User(
            id = currentUser.id,
            name = currentUser.name,
            email = currentUser.email,
            gender = selectedGender,
            clan = selectedClan,
            tier = currentUser.tier,
            shortlistedIds = currentUser.shortlistedIds,
            unlockedIds = currentUser.unlockedIds,
            gotra = gotraInput,
            motherGotra = motherGotraInput,
            thikana = thikanaInput,
            phone = phoneInput,
            dob = dobInput,
            education = educationInput,
            occupation = occupationInput,
            income = incomeInput,
            height = heightInput,
            maritalStatus = "Never Married",
            profilePic = currentUser.profilePic ?: (if (selectedGender == "Groom") "groom_ranveer" else "bride_aishwarya")
        )
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = OkHttpClient()
                val url = "https://afbrznllcfgfcjuinnlf.supabase.co"
                val apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
                
                val mediaType = "application/json; charset=utf-8".toMediaType()
                val profileJson = JSONObject().apply {
                    put("id", updatedUser.id)
                    put("name", updatedUser.name)
                    put("gender", updatedUser.gender)
                    put("clan", updatedUser.clan)
                    put("gotra", updatedUser.gotra)
                    put("motherGotra", updatedUser.motherGotra)
                    put("thikana", updatedUser.thikana)
                    put("phone", updatedUser.phone)
                    put("dob", updatedUser.dob)
                    put("education", updatedUser.education)
                    put("occupation", updatedUser.occupation)
                    put("income", updatedUser.income)
                    put("height", updatedUser.height)
                    put("profilePic", updatedUser.profilePic ?: "")
                }
                
                // Use POST with upsert preference header
                val request = Request.Builder()
                    .url("$url/rest/v1/profiles")
                    .addHeader("apikey", apiKey)
                    .addHeader("Authorization", "Bearer $apiKey")
                    .addHeader("Prefer", "resolution=merge-duplicates")
                    .post(profileJson.toString().toRequestBody(mediaType))
                    .build()
                
                client.newCall(request).execute()
                
                CoroutineScope(Dispatchers.Main).launch {
                    isSaving = false
                    session.login(updatedUser)
                }
            } catch (e: Exception) {
                e.printStackTrace()
                CoroutineScope(Dispatchers.Main).launch {
                    isSaving = false
                    session.login(updatedUser) // local fallback
                }
            }
        }
    }

    Scaffold(
        containerColor = DeepMaroon,
        modifier = modifier.fillMaxSize()
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(20.dp))
            Icon(
                imageVector = Icons.Default.Star,
                contentDescription = null,
                tint = RoyalGold,
                modifier = Modifier.size(54.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Complete Your Noble Profile",
                color = LightGold,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                textAlign = TextAlign.Center
            )
            Text(
                text = "Please provide your lineage and credentials to access matchmaking.",
                color = SandstoneIvory.copy(alpha = 0.7f),
                fontSize = 13.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
            )
            
            errorMessage?.let { err ->
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = err,
                    color = Color.Red,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .background(Color.Red.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                        .padding(12.dp)
                        .fillMaxWidth(),
                    textAlign = TextAlign.Center
                )
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DeepMaroon, RoundedCornerShape(16.dp))
                    .border(1.dp, RoyalGold.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Gender
                Column {
                    Text("Gender", color = LightGold, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(
                            onClick = { selectedGender = "Groom" },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (selectedGender == "Groom") RoyalGold else Color.Gray.copy(alpha = 0.2f)
                            )
                        ) {
                            Text("Groom (Kunwar)", color = if (selectedGender == "Groom") DeepMaroon else Color.White)
                        }
                        Button(
                            onClick = { selectedGender = "Bride" },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (selectedGender == "Bride") RoyalGold else Color.Gray.copy(alpha = 0.2f)
                            )
                        ) {
                            Text("Bride (Bannisa)", color = if (selectedGender == "Bride") DeepMaroon else Color.White)
                        }
                    }
                }
                
                // Clan
                Column {
                    Text("Clan / Kul", color = LightGold, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Box(modifier = Modifier.fillMaxWidth()) {
                        Button(
                            onClick = { clanExpanded = true },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.1f))
                        ) {
                            Text(selectedClan, color = Color.White)
                        }
                        DropdownMenu(
                            expanded = clanExpanded,
                            onDismissRequest = { clanExpanded = false }
                        ) {
                            clans.forEach { clan ->
                                DropdownMenuItem(
                                    text = { Text(clan) },
                                    onClick = {
                                        selectedClan = clan
                                        clanExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }
                
                // Father & Mother Gotra
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Father Gotra", color = LightGold, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        TextField(
                            value = gotraInput,
                            onValueChange = { gotraInput = it },
                            placeholder = { Text("e.g. Kashyap", color = Color.Gray) },
                            modifier = Modifier.fillMaxWidth(),
                            colors = textFieldColors
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Mother Gotra", color = LightGold, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        TextField(
                            value = motherGotraInput,
                            onValueChange = { motherGotraInput = it },
                            placeholder = { Text("e.g. Chauhan", color = Color.Gray) },
                            modifier = Modifier.fillMaxWidth(),
                            colors = textFieldColors
                        )
                    }
                }
                
                // Thikana & Phone
                Column {
                    Text("Native Thikana (Ancestral Place)", color = LightGold, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    TextField(
                        value = thikanaInput,
                        onValueChange = { thikanaInput = it },
                        placeholder = { Text("e.g. Rohet, Jodhpur", color = Color.Gray) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = textFieldColors
                    )
                }
                
                Column {
                    Text("Phone Number", color = LightGold, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    TextField(
                        value = phoneInput,
                        onValueChange = { phoneInput = it },
                        placeholder = { Text("e.g. +91 98765 43210", color = Color.Gray) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = textFieldColors
                    )
                }
                
                // Education & Occupation
                Column {
                    Text("Education / Qualification", color = LightGold, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    TextField(
                        value = educationInput,
                        onValueChange = { educationInput = it },
                        placeholder = { Text("e.g. MBA, B.Tech IIT", color = Color.Gray) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = textFieldColors
                    )
                }
                
                Column {
                    Text("Occupation / Profession", color = LightGold, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    TextField(
                        value = occupationInput,
                        onValueChange = { occupationInput = it },
                        placeholder = { Text("e.g. Software Engineer, Business", color = Color.Gray) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = textFieldColors
                    )
                }
                
                // Income & Height
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Annual Income", color = LightGold, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        TextField(
                            value = incomeInput,
                            onValueChange = { incomeInput = it },
                            placeholder = { Text("e.g. ₹15 Lakhs/Yr", color = Color.Gray) },
                            modifier = Modifier.fillMaxWidth(),
                            colors = textFieldColors
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Height", color = LightGold, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Box(modifier = Modifier.fillMaxWidth()) {
                            Button(
                                onClick = { heightExpanded = true },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.1f))
                            ) {
                                Text(heightInput, color = Color.White)
                            }
                            DropdownMenu(
                                expanded = heightExpanded,
                                onDismissRequest = { heightExpanded = false }
                            ) {
                                heights.forEach { h ->
                                    DropdownMenuItem(
                                        text = { Text(h) },
                                        onClick = {
                                            heightInput = h
                                            heightExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Button(
                onClick = { saveProfile() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                colors = ButtonDefaults.buttonColors(containerColor = RoyalGold),
                shape = RoundedCornerShape(12.dp),
                enabled = !isSaving
            ) {
                if (isSaving) {
                    CircularProgressIndicator(color = DeepMaroon, modifier = Modifier.size(24.dp))
                } else {
                    Text("Establish Lineage", color = DeepMaroon, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            }
            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}
