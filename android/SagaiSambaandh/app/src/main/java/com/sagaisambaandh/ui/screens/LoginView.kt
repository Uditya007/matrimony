package com.sagaisambaandh.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Public
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.border
import androidx.compose.foundation.Image
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.layout.ContentScale
import com.sagaisambaandh.R
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.data.User
import com.sagaisambaandh.ui.components.PalaceDivider
import com.sagaisambaandh.ui.theme.*
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.ui.platform.LocalContext
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginView(
    session: SagaiSessionManager,
    onNavigateToRegister: () -> Unit,
    modifier: Modifier = Modifier
) {
    var emailInput by remember { mutableStateOf("") }
    var passwordInput by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val context = LocalContext.current
    val gso = remember {
        GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .requestIdToken("946288819563-rt41sphrfcb745blh88se09n5e55p52g.apps.googleusercontent.com")
            .build()
    }
    val googleSignInClient = remember { GoogleSignIn.getClient(context, gso) }

    val googleSignInLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(ApiException::class.java)
            val email = account?.email ?: "noble@gmail.com"
            val displayName = account?.displayName ?: "Ranveer Singh"
            val photoUrl = account?.photoUrl?.toString() ?: ""
            
            // Perform lookup on a background thread to check if they already exist in Supabase
            CoroutineScope(Dispatchers.IO).launch {
                var dbId = java.util.UUID.randomUUID().toString()
                var gotra = ""
                var motherGotra = ""
                var thikana = ""
                var phone = ""
                var dob = ""
                var education = ""
                var occupation = ""
                var income = ""
                var height = ""
                var gender = "Groom"
                var clan = "Rathore"
                var pic = photoUrl.ifEmpty { "groom_ranveer" }
                
                try {
                    val client = OkHttpClient()
                    val url = "https://afbrznllcfgfcjuinnlf.supabase.co"
                    val apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
                    
                    val request = Request.Builder()
                        .url("$url/rest/v1/profiles?email=eq.$email&select=*")
                        .addHeader("apikey", apiKey)
                        .addHeader("Authorization", "Bearer $apiKey")
                        .build()
                    
                    val response = client.newCall(request).execute()
                    val body = response.body?.string() ?: ""
                    if (response.isSuccessful && body.isNotEmpty()) {
                        val arr = JSONArray(body)
                        if (arr.length() > 0) {
                            val obj = arr.getJSONObject(0)
                            dbId = obj.optString("id", java.util.UUID.randomUUID().toString())
                            gotra = obj.optString("gotra", "")
                            motherGotra = obj.optString("motherGotra", "")
                            thikana = obj.optString("thikana", "")
                            phone = obj.optString("phone", "")
                            dob = obj.optString("dob", "")
                            education = obj.optString("education", "")
                            occupation = obj.optString("occupation", "")
                            income = obj.optString("income", "")
                            height = obj.optString("height", "")
                            gender = obj.optString("gender", "Groom")
                            clan = obj.optString("clan", "Rathore")
                            pic = obj.optString("profilePic", pic)
                        }
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                
                val googleUser = User(
                    id = dbId,
                    name = displayName,
                    email = email,
                    gender = gender,
                    clan = clan,
                    tier = "Starter",
                    shortlistedIds = emptySet(),
                    unlockedIds = emptySet(),
                    gotra = gotra,
                    motherGotra = motherGotra,
                    thikana = thikana,
                    phone = phone,
                    dob = dob,
                    education = education,
                    occupation = occupation,
                    income = income,
                    height = height,
                    maritalStatus = "Never Married",
                    profilePic = pic
                )
                
                CoroutineScope(Dispatchers.Main).launch {
                    session.login(googleUser)
                }
            }
        } catch (e: ApiException) {
            e.printStackTrace()
            errorMessage = "Google login failed: ${e.localizedMessage}"
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DeepMaroon)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(20.dp))

        // Large Floating Medallion Logo
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.size(160.dp)
        ) {
            // Outer Gold Rings
            Box(
                modifier = Modifier
                    .size(150.dp)
                    .border(1.dp, RoyalGold.copy(alpha = 0.4f), shape = CircleShape)
            )
            Box(
                modifier = Modifier
                    .size(140.dp)
                    .border(
                        width = 2.5.dp,
                        brush = Brush.linearGradient(listOf(RoyalGold, LightGold, RoyalGold)),
                        shape = CircleShape
                    )
            )

            // Logo Image
            Image(
                painter = painterResource(id = R.drawable.logo),
                contentDescription = "Sagai Sambaandh Logo",
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .size(125.dp)
                    .clip(CircleShape)
                    .background(Color.White, shape = CircleShape)
                    .border(1.dp, RoyalGold.copy(alpha = 0.2f), shape = CircleShape)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Titles
        Text(
            text = "SHREE RAJPUT",
            color = LightGold,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 4.sp
        )

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = "Sagai Sambaandh",
            color = Color.White,
            fontSize = 30.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = "Access Rajasthan's Royal Matrimony",
            color = SandstoneIvory.copy(alpha = 0.7f),
            fontSize = 12.sp,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(28.dp))

        // Form Card Container
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.15f)),
            border = CardDefaults.outlinedCardBorder().copy(
                brush = Brush.linearGradient(listOf(RoyalGold.copy(alpha = 0.25f), RoyalGold.copy(alpha = 0.25f)))
            ),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                // Demo panel
                Card(
                    shape = RoundedCornerShape(8.dp),
                    colors = CardDefaults.cardColors(containerColor = DeepMaroon),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = Brush.linearGradient(listOf(RoyalGold.copy(alpha = 0.3f), RoyalGold.copy(alpha = 0.3f)))
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 20.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "NOBLE ACCESS DEMO:",
                            color = LightGold,
                            fontWeight = FontWeight.Bold,
                            fontSize = 9.sp,
                            letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Username: 12345",
                            color = SandstoneIvory,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp
                        )
                        Text(
                            text = "Password: 12345",
                            color = SandstoneIvory,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp
                        )
                    }
                }

                // Forms
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Email
                    Column {
                        Text(
                            text = "ROYAL CREDENTIALS (EMAIL)",
                            fontSize = 8.sp,
                            color = SandstoneIvory.copy(alpha = 0.8f),
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(bottom = 6.dp)
                        )
                        OutlinedTextField(
                            value = emailInput,
                            onValueChange = { emailInput = it },
                            placeholder = { Text("e.g. royal@sagaisambaandh.com") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.Black,
                                unfocusedTextColor = Color.Black,
                                focusedPlaceholderColor = Color.Gray,
                                unfocusedPlaceholderColor = Color.Gray,
                                focusedContainerColor = CardBackground,
                                unfocusedContainerColor = CardBackground,
                                focusedBorderColor = RoyalGold,
                                unfocusedBorderColor = Color.Gray.copy(alpha = 0.3f)
                            )
                        )
                    }

                    // Password
                    Column {
                        Text(
                            text = "PASSWORD",
                            fontSize = 8.sp,
                            color = SandstoneIvory.copy(alpha = 0.8f),
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(bottom = 6.dp)
                        )
                        OutlinedTextField(
                            value = passwordInput,
                            onValueChange = { passwordInput = it },
                            placeholder = { Text("••••••••") },
                            visualTransformation = PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.Black,
                                unfocusedTextColor = Color.Black,
                                focusedPlaceholderColor = Color.Gray,
                                unfocusedPlaceholderColor = Color.Gray,
                                focusedContainerColor = CardBackground,
                                unfocusedContainerColor = CardBackground,
                                focusedBorderColor = RoyalGold,
                                unfocusedBorderColor = Color.Gray.copy(alpha = 0.3f)
                            )
                        )
                    }
                }

                if (errorMessage != null) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = errorMessage!!,
                        color = Color.Red,
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Action
                Button(
                    onClick = {
                        if (emailInput == "12345" && passwordInput == "12345") {
                            val demoUser = User(
                                id = "U1",
                                name = "Ranveer Singh",
                                email = "12345",
                                gender = "Groom",
                                clan = "Rathore",
                                tier = "Silver",
                                shortlistedIds = setOf("P2", "P8"),
                                unlockedIds = setOf("P2")
                            )
                            session.login(demoUser)
                        } else {
                            errorMessage = "Invalid credentials. Please use the demo credentials provided."
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = RoyalGold)
                ) {
                    Text(
                        text = "Enter Sanctuary",
                        color = DeepMaroon,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }

                // Divider
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Divider(modifier = Modifier.weight(1f), color = Color.Gray.copy(alpha = 0.3f))
                    Text(
                        text = "OR",
                        color = Color.Gray,
                        fontSize = 10.sp,
                        modifier = Modifier.padding(horizontal = 8.dp)
                    )
                    Divider(modifier = Modifier.weight(1f), color = Color.Gray.copy(alpha = 0.3f))
                }

                // Google button
                Button(
                    onClick = {
                        googleSignInClient.signOut().addOnCompleteListener {
                            googleSignInLauncher.launch(googleSignInClient.signInIntent)
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, RoyalGold.copy(alpha = 0.5f), RoundedCornerShape(8.dp)),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White)
                ) {
                    Icon(
                        imageVector = Icons.Default.Public,
                        contentDescription = "Google Logo",
                        tint = DeepMaroon,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Continue with Google",
                        color = DeepMaroon,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Redirect
                Row(
                    modifier = Modifier
                        .clickable(onClick = onNavigateToRegister)
                        .align(Alignment.CenterHorizontally)
                        .padding(8.dp),
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(text = "Already have a lineage record? ", color = SandstoneIvory.copy(alpha = 0.6f), fontSize = 12.sp)
                    Text(text = "Sign Up here", color = LightGold, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }
    }
}
