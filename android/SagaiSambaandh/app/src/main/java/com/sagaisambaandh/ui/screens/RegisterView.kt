package com.sagaisambaandh.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.material.icons.filled.Shield
import androidx.compose.foundation.Image
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.data.User
import com.sagaisambaandh.ui.components.PalaceDivider
import com.sagaisambaandh.ui.theme.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterView(
    session: SagaiSessionManager,
    onNavigateToLogin: () -> Unit,
    modifier: Modifier = Modifier
) {
    var step by remember { mutableIntStateOf(1) }

    // Step 1 values
    var nameInput by remember { mutableStateOf("") }
    var emailInput by remember { mutableStateOf("") }
    var passwordInput by remember { mutableStateOf("") }
    var phoneInput by remember { mutableStateOf("") }
    var dobInput by remember { mutableStateOf("") }
    var genderInput by remember { mutableStateOf("Bride") }

    // Step 2 values
    var selectedClan by remember { mutableStateOf("Rathore") }
    var gotraInput by remember { mutableStateOf("") }
    var motherGotraInput by remember { mutableStateOf("") }
    var thikanaInput by remember { mutableStateOf("") }
    var clanExpanded by remember { mutableStateOf(false) }

    // Step 3 values
    var educationInput by remember { mutableStateOf("") }
    var occupationInput by remember { mutableStateOf("") }
    var incomeInput by remember { mutableStateOf("") }
    var heightInput by remember { mutableStateOf("") }
    var maritalStatusInput by remember { mutableStateOf("Never Married") }

    val clansOptions = listOf("Rathore", "Sisodia", "Chauhan", "Kachwaha", "Bhati", "Shekhawat", "Panwar", "Tanwar", "Hada", "Sodha")

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

        Spacer(modifier = Modifier.height(24.dp))

        // Step Indicators
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 20.dp)
        ) {
            StepCircle(stepNum = 1, activeStep = step)
            StepLine(active = step > 1)
            StepCircle(stepNum = 2, activeStep = step)
            StepLine(active = step > 2)
            StepCircle(stepNum = 3, activeStep = step)
        }

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
                // Step Content
                when (step) {
                    1 -> {
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Text(
                                text = "Noble Registration",
                                color = LightGold,
                                fontSize = 26.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Serif
                            )
                            Text(
                                text = "Create your premium matrimonial lineage record",
                                color = SandstoneIvory.copy(alpha = 0.7f),
                                fontSize = 12.sp,
                                modifier = Modifier.padding(top = 4.dp, bottom = 20.dp)
                            )

                            // Name
                            Text(text = "FULL NAME (KUNWAR/BANNISA)", fontSize = 8.sp, color = SandstoneIvory.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
                            OutlinedTextField(
                                value = nameInput,
                                onValueChange = { nameInput = it },
                                placeholder = { Text("e.g. Vikramaditya Singh") },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 6.dp, bottom = 16.dp),
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

                            // Email
                            Text(text = "ROYAL CONTACT EMAIL", fontSize = 8.sp, color = SandstoneIvory.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
                            OutlinedTextField(
                                value = emailInput,
                                onValueChange = { emailInput = it },
                                placeholder = { Text("e.g. contact@clan.com") },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 6.dp, bottom = 16.dp),
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

                            // Password
                            Text(text = "PASSWORD", fontSize = 8.sp, color = SandstoneIvory.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
                            OutlinedTextField(
                                value = passwordInput,
                                onValueChange = { passwordInput = it },
                                placeholder = { Text("Enter a secure password") },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 6.dp, bottom = 16.dp),
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

                            // Phone Number
                            Text(text = "MOBILE PHONE NUMBER", fontSize = 8.sp, color = SandstoneIvory.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
                            OutlinedTextField(
                                value = phoneInput,
                                onValueChange = { phoneInput = it },
                                placeholder = { Text("e.g. +91 9928592159") },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 6.dp, bottom = 16.dp),
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

                            // Date of Birth
                            Text(text = "DATE OF BIRTH", fontSize = 8.sp, color = SandstoneIvory.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
                            OutlinedTextField(
                                value = dobInput,
                                onValueChange = { dobInput = it },
                                placeholder = { Text("e.g. DD-MM-YYYY") },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 6.dp, bottom = 16.dp),
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

                            // Gender Segment
                            Text(text = "GENDER", fontSize = 8.sp, color = SandstoneIvory.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 6.dp, bottom = 20.dp)
                                    .background(RoyalGold.copy(alpha = 0.1f), shape = RoundedCornerShape(8.dp))
                                    .padding(4.dp)
                            ) {
                                Box(
                                    contentAlignment = Alignment.Center,
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(32.dp)
                                        .background(
                                            if (genderInput == "Bride") CardBackground else Color.Transparent,
                                            shape = RoundedCornerShape(6.dp)
                                        )
                                        .clickable { genderInput = "Bride" }
                                ) {
                                    Text(text = "Noble Bride (Ladi)", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = RoyalMaroon)
                                }
                                Box(
                                    contentAlignment = Alignment.Center,
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(32.dp)
                                        .background(
                                            if (genderInput == "Groom") CardBackground else Color.Transparent,
                                            shape = RoundedCornerShape(6.dp)
                                        )
                                        .clickable { genderInput = "Groom" }
                                ) {
                                    Text(text = "Noble Groom (Lada)", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = RoyalMaroon)
                                }
                            }

                            Button(
                                onClick = { step = 2 },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = RoyalGold)
                            ) {
                                Text(text = "Continue to Lineage", color = DeepMaroon, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }

                            Spacer(modifier = Modifier.height(16.dp))
                            Row(
                                modifier = Modifier
                                    .clickable(onClick = onNavigateToLogin)
                                    .align(Alignment.CenterHorizontally)
                                    .padding(8.dp)
                            ) {
                                Text(text = "Already have a lineage record? ", color = SandstoneIvory.copy(alpha = 0.6f), fontSize = 12.sp)
                                Text(text = "Log In here", color = LightGold, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }
                    2 -> {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "Noble Lineage & Gotra",
                            color = LightGold,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Serif
                        )
                        Text(
                            text = "Enter ancestral thikana details for verification",
                            color = SandstoneIvory.copy(alpha = 0.7f),
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 4.dp, bottom = 20.dp)
                        )

                        // Clan Selection
                        Text(text = "RAJPUT CLAN", fontSize = 8.sp, color = SandstoneIvory.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp, bottom = 16.dp)
                                .background(CardBackground, shape = RoundedCornerShape(8.dp))
                                .border(1.dp, Color.Gray.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                .clickable { clanExpanded = true }
                                .padding(12.dp)
                        ) {
                            Text(text = selectedClan, color = Color.Black, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            DropdownMenu(
                                expanded = clanExpanded,
                                onDismissRequest = { clanExpanded = false }
                            ) {
                                clansOptions.forEach { clan ->
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

                        // Gotra
                        Text(text = "GOTRA (ANCESTRAL RISHI)", fontSize = 8.sp, color = SandstoneIvory.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = gotraInput,
                            onValueChange = { gotraInput = it },
                            placeholder = { Text("e.g. Gautam / Atri / Vatsa") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp, bottom = 16.dp),
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

                        // Mother's Gotra
                        Text(text = "MOTHER'S GOTRA", fontSize = 8.sp, color = SandstoneIvory.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = motherGotraInput,
                            onValueChange = { motherGotraInput = it },
                            placeholder = { Text("e.g. Kashyap / Vyas / Gautam") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp, bottom = 16.dp),
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

                        // Thikana
                        Text(text = "THIKANA (NOBLE ESTATE / NATIVE VILLAGE)", fontSize = 8.sp, color = SandstoneIvory.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = thikanaInput,
                            onValueChange = { thikanaInput = it },
                            placeholder = { Text("e.g. Rohet (Jodhpur)") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp, bottom = 20.dp),
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

                        Row(modifier = Modifier.fillMaxWidth()) {
                            OutlinedButton(
                                onClick = { step = 1 },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = LightGold),
                                border = ButtonDefaults.outlinedButtonBorder().copy(
                                    brush = Brush.linearGradient(listOf(LightGold, LightGold))
                                ),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(44.dp)
                            ) {
                                Text(text = "Back", fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.width(16.dp))
                            Button(
                                onClick = { step = 3 },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = RoyalGold),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(44.dp)
                            ) {
                                Text(text = "Continue", color = DeepMaroon, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
                3 -> {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "Professional Details",
                            color = LightGold,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Serif
                        )
                        Text(
                            text = "Complete noble credentials to record profile",
                            color = SandstoneIvory.copy(alpha = 0.7f),
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 4.dp, bottom = 20.dp)
                        )

                        // Education
                        Text(text = "HIGHEST DEGREE / EDUCATION", fontSize = 8.sp, color = SandstoneIvory.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = educationInput,
                            onValueChange = { educationInput = it },
                            placeholder = { Text("e.g. MBA - IIM Ahmedabad") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp, bottom = 16.dp),
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

                        // Occupation
                        Text(text = "OCCUPATION / PROFESSION", fontSize = 8.sp, color = SandstoneIvory.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = occupationInput,
                            onValueChange = { occupationInput = it },
                            placeholder = { Text("e.g. Co-Founder, resorts venture") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp, bottom = 16.dp),
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

                        // Annual Income
                        Text(text = "ANNUAL INCOME", fontSize = 8.sp, color = SandstoneIvory.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = incomeInput,
                            onValueChange = { incomeInput = it },
                            placeholder = { Text("e.g. 15-20 Lakhs per annum") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp, bottom = 16.dp),
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

                        // Height
                        Text(text = "HEIGHT", fontSize = 8.sp, color = SandstoneIvory.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = heightInput,
                            onValueChange = { heightInput = it },
                            placeholder = { Text("e.g. 5 ft 8 in / 173 cm") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp, bottom = 16.dp),
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

                        // Marital Status
                        Text(text = "MARITAL STATUS", fontSize = 8.sp, color = SandstoneIvory.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = maritalStatusInput,
                            onValueChange = { maritalStatusInput = it },
                            placeholder = { Text("e.g. Never Married / Divorced") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp, bottom = 20.dp),
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

                        Row(modifier = Modifier.fillMaxWidth()) {
                            OutlinedButton(
                                onClick = { step = 2 },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = LightGold),
                                border = ButtonDefaults.outlinedButtonBorder().copy(
                                    brush = Brush.linearGradient(listOf(LightGold, LightGold))
                                ),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(44.dp)
                            ) {
                                Text(text = "Back", fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.width(16.dp))
                            Button(
                                onClick = {
                                    val newUser = User(
                                        id = "U${(100..999).random()}",
                                        name = nameInput.ifEmpty { "Kunwar" },
                                        email = emailInput.ifEmpty { "noble@clan.com" },
                                        gender = if (genderInput == "Bride") "Bride" else "Groom",
                                        clan = selectedClan,
                                        tier = "Starter",
                                        gotra = gotraInput,
                                        motherGotra = motherGotraInput,
                                        thikana = thikanaInput,
                                        phone = phoneInput,
                                        dob = dobInput,
                                        education = educationInput,
                                        occupation = occupationInput,
                                        income = incomeInput,
                                        height = heightInput,
                                        maritalStatus = maritalStatusInput
                                    )
                                    registerUserInSupabase(newUser, passwordInput.ifEmpty { "12345" }) { success, registeredUser ->
                                        CoroutineScope(Dispatchers.Main).launch {
                                            session.login(registeredUser)
                                        }
                                    }
                                },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = RoyalGold),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(44.dp)
                            ) {
                                Text(text = "Complete Seal", color = DeepMaroon, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
}


@Composable
fun StepCircle(stepNum: Int, activeStep: Int) {
    val active = activeStep >= stepNum
    val color = if (active) RoyalGold else SandstoneIvory.copy(alpha = 0.3f)
    val text = if (active) DeepMaroon else SandstoneIvory.copy(alpha = 0.6f)
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .size(24.dp)
            .background(color, shape = RoundedCornerShape(12.dp))
    ) {
        Text(
            text = stepNum.toString(),
            color = text,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun StepLine(active: Boolean) {
    val color = if (active) RoyalMaroon else Color.Gray.copy(alpha = 0.2f)
    Box(
        modifier = Modifier
            .width(36.dp)
            .height(3.dp)
            .background(color)
    )
}

fun registerUserInSupabase(user: User, passwordVal: String, onComplete: (Boolean, User) -> Unit) {
    CoroutineScope(Dispatchers.IO).launch {
        try {
            val client = OkHttpClient()
            val mediaType = "application/json; charset=utf-8".toMediaType()
            val url = "https://afbrznllcfgfcjuinnlf.supabase.co"
            val apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"

            val authJson = JSONObject().apply {
                put("email", user.email)
                put("password", passwordVal)
            }
            val authRequest = Request.Builder()
                .url("$url/auth/v1/signup")
                .addHeader("apikey", apiKey)
                .post(authJson.toString().toRequestBody(mediaType))
                .build()

            val authResponse = client.newCall(authRequest).execute()
            val authBody = authResponse.body?.string() ?: ""
            if (!authResponse.isSuccessful) {
                onComplete(false, user)
                return@launch
            }

            val authObj = JSONObject(authBody)
            val userObj = authObj.optJSONObject("user")
            val uid = userObj?.optString("id") ?: "U${(100..999).random()}"

            val profileWithUid = user.copy(id = uid)
            val profileJson = JSONObject().apply {
                put("id", profileWithUid.id)
                put("name", profileWithUid.name)
                put("email", profileWithUid.email)
                put("gender", profileWithUid.gender)
                put("clan", profileWithUid.clan)
                put("tier", profileWithUid.tier)
                put("gotra", profileWithUid.gotra)
                put("motherGotra", profileWithUid.motherGotra)
                put("thikana", profileWithUid.thikana)
                put("phone", profileWithUid.phone)
                put("dob", profileWithUid.dob)
                put("education", profileWithUid.education)
                put("occupation", profileWithUid.occupation)
                put("income", profileWithUid.income)
                put("height", profileWithUid.height)
                put("maritalStatus", profileWithUid.maritalStatus)
                put("profilePic", profileWithUid.profilePic ?: "")
            }

            val dbRequest = Request.Builder()
                .url("$url/rest/v1/profiles")
                .addHeader("apikey", apiKey)
                .addHeader("Authorization", "Bearer $apiKey")
                .addHeader("Content-Type", "application/json")
                .post(profileJson.toString().toRequestBody(mediaType))
                .build()

            val dbResponse = client.newCall(dbRequest).execute()
            if (dbResponse.isSuccessful) {
                onComplete(true, profileWithUid)
            } else {
                onComplete(false, profileWithUid)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            onComplete(false, user)
        }
    }
}
