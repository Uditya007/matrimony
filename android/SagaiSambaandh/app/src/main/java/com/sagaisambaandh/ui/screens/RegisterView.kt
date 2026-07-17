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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterView(
    session: SagaiSessionManager,
    onNavigateToLogin: () -> Unit,
    modifier: Modifier = Modifier
) {
    var step by remember { mutableStateOf(1) }

    // Step 1 values
    var nameInput by remember { mutableStateOf("") }
    var emailInput by remember { mutableStateOf("") }
    var genderInput by remember { mutableStateOf("Bride") }

    // Step 2 values
    var selectedClan by remember { mutableStateOf("Rathore") }
    var gotraInput by remember { mutableStateOf("") }
    var thikanaInput by remember { mutableStateOf("") }
    var clanExpanded by remember { mutableStateOf(false) }

    // Step 3 values
    var educationInput by remember { mutableStateOf("") }
    var occupationInput by remember { mutableStateOf("") }

    val clansOptions = listOf("Rathore", "Sisodia", "Chauhan", "Kachwaha", "Bhati", "Shekhawat", "Panwar", "Tanwar", "Hada", "Sodha")

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(SandstoneIvory.copy(alpha = 0.15f))
    ) {
        // Banner
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(DeepMaroon, RoyalMaroon)
                    )
                )
                .height(110.dp),
            contentAlignment = Alignment.BottomCenter
        ) {
            PalaceDivider(fillColor = SandstoneIvory)
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
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

            // Step Content
            when (step) {
                1 -> {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "Noble Registration",
                            color = RoyalMaroon,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Serif
                        )
                        Text(
                            text = "Create your premium matrimonial lineage record",
                            color = Color.Gray,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 4.dp, bottom = 20.dp)
                        )

                        // Name
                        Text(text = "FULL NAME (KUNWAR/BANNISA)", fontSize = 8.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = nameInput,
                            onValueChange = { nameInput = it },
                            placeholder = { Text("e.g. Vikramaditya Singh") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp, bottom = 16.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = CardBackground,
                                unfocusedContainerColor = CardBackground,
                                focusedBorderColor = RoyalGold,
                                unfocusedBorderColor = Color.Gray.copy(alpha = 0.3f)
                            )
                        )

                        // Email
                        Text(text = "ROYAL CONTACT EMAIL", fontSize = 8.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = emailInput,
                            onValueChange = { emailInput = it },
                            placeholder = { Text("e.g. contact@clan.com") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp, bottom = 16.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = CardBackground,
                                unfocusedContainerColor = CardBackground,
                                focusedBorderColor = RoyalGold,
                                unfocusedBorderColor = Color.Gray.copy(alpha = 0.3f)
                            )
                        )

                        // Gender Segment
                        Text(text = "GENDER", fontSize = 8.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
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
                            colors = ButtonDefaults.buttonColors(containerColor = RoyalMaroon)
                        ) {
                            Text(text = "Continue to Lineage", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        Row(
                            modifier = Modifier
                                .clickable(onClick = onNavigateToLogin)
                                .align(Alignment.CenterHorizontally)
                                .padding(8.dp)
                        ) {
                            Text(text = "Already have a lineage record? ", color = Color.Gray, fontSize = 12.sp)
                            Text(text = "Log In here", color = RoyalMaroon, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }
                2 -> {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "Noble Lineage & Gotra",
                            color = RoyalMaroon,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Serif
                        )
                        Text(
                            text = "Enter ancestral thikana details for verification",
                            color = Color.Gray,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 4.dp, bottom = 20.dp)
                        )

                        // Clan Selection
                        Text(text = "RAJPUT CLAN", fontSize = 8.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp, bottom = 16.dp)
                                .background(CardBackground, shape = RoundedCornerShape(8.dp))
                                .border(1.dp, Color.Gray.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                .clickable { clanExpanded = true }
                                .padding(12.dp)
                        ) {
                            Text(text = selectedClan, color = InkBrown, fontSize = 14.sp, fontWeight = FontWeight.Medium)
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
                        Text(text = "GOTRA (ANCESTRAL RISHI)", fontSize = 8.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = gotraInput,
                            onValueChange = { gotraInput = it },
                            placeholder = { Text("e.g. Gautam / Atri / Vatsa") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp, bottom = 16.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = CardBackground,
                                unfocusedContainerColor = CardBackground,
                                focusedBorderColor = RoyalGold,
                                unfocusedBorderColor = Color.Gray.copy(alpha = 0.3f)
                            )
                        )

                        // Thikana
                        Text(text = "THIKANA (NOBLE ESTATE / NATIVE VILLAGE)", fontSize = 8.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = thikanaInput,
                            onValueChange = { thikanaInput = it },
                            placeholder = { Text("e.g. Rohet (Jodhpur)") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp, bottom = 20.dp),
                            colors = OutlinedTextFieldDefaults.colors(
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
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = RoyalMaroon),
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
                                colors = ButtonDefaults.buttonColors(containerColor = RoyalMaroon),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(44.dp)
                            ) {
                                Text(text = "Continue", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
                3 -> {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "Professional Details",
                            color = RoyalMaroon,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Serif
                        )
                        Text(
                            text = "Complete noble credentials to record profile",
                            color = Color.Gray,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 4.dp, bottom = 20.dp)
                        )

                        // Education
                        Text(text = "HIGHEST DEGREE / EDUCATION", fontSize = 8.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = educationInput,
                            onValueChange = { educationInput = it },
                            placeholder = { Text("e.g. MBA - IIM Ahmedabad") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp, bottom = 16.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = CardBackground,
                                unfocusedContainerColor = CardBackground,
                                focusedBorderColor = RoyalGold,
                                unfocusedBorderColor = Color.Gray.copy(alpha = 0.3f)
                            )
                        )

                        // Occupation
                        Text(text = "OCCUPATION / PROFESSION", fontSize = 8.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = occupationInput,
                            onValueChange = { occupationInput = it },
                            placeholder = { Text("e.g. Co-Founder, resorts venture") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp, bottom = 20.dp),
                            colors = OutlinedTextFieldDefaults.colors(
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
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = RoyalMaroon),
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
                                        id = "U${(10..99).random()}",
                                        name = nameInput.ifEmpty { "Kunwar" },
                                        email = emailInput.ifEmpty { "noble@clan.com" },
                                        gender = if (genderInput == "Bride") "Bride" else "Groom",
                                        clan = selectedClan,
                                        tier = "Starter"
                                    )
                                    session.login(newUser)
                                },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = RoyalMaroon),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(44.dp)
                            ) {
                                Text(text = "Complete Seal", fontWeight = FontWeight.Bold)
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
    val color = if (active) RoyalMaroon else Color.Gray.copy(alpha = 0.3f)
    val text = if (active) Color.White else Color.Gray

    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .size(24.dp)
            .background(color, shape = CircleShape)
    ) {
        Text(
            text = "$stepNum",
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
