package com.sagaisambaandh.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBox
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Star
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
import com.sagaisambaandh.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyProfileView(
    session: SagaiSessionManager,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    val user = session.currentUser.value ?: return

    var nameInput by remember { mutableStateOf(user.name) }
    var clanInput by remember { mutableStateOf(user.clan) }
    var gotraInput by remember { mutableStateOf(user.gotra) }
    var motherGotraInput by remember { mutableStateOf(user.motherGotra) }
    var thikanaInput by remember { mutableStateOf(user.thikana) }
    var phoneInput by remember { mutableStateOf(user.phone) }
    var dobInput by remember { mutableStateOf(user.dob) }
    var educationInput by remember { mutableStateOf(user.education) }
    var occupationInput by remember { mutableStateOf(user.occupation) }
    var incomeInput by remember { mutableStateOf(user.income) }
    var heightInput by remember { mutableStateOf(user.height) }
    var maritalStatusInput by remember { mutableStateOf(user.maritalStatus) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DeepMaroon)
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Gold line separator
        Box(
            modifier = Modifier
                .width(40.dp)
                .height(4.dp)
                .background(LightGold.copy(alpha = 0.4f), shape = RoundedCornerShape(2.dp))
        )
        
        Spacer(modifier = Modifier.height(16.dp))

        // Title Header
        Text(
            text = "My Rajput Lineage Card",
            color = LightGold,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
            textAlign = TextAlign.Center
        )
        
        Text(
            text = "Keep your Gotra, Thikana, and Clan details audited and updated.",
            color = SandstoneIvory.copy(alpha = 0.7f),
            fontSize = 12.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 4.dp, bottom = 24.dp)
        )

        // Lineage Details Form Card
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.15f)),
            border = CardDefaults.outlinedCardBorder().copy(
                brush = Brush.linearGradient(listOf(RoyalGold.copy(alpha = 0.25f), RoyalGold.copy(alpha = 0.25f)))
            ),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Section Title: Personal Info
                Text(
                    text = "PERSONAL INFORMATION",
                    color = LightGold,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )

                OutlinedProfileField(label = "FULL NAME", value = nameInput, onValueChange = { nameInput = it })

                OutlinedProfileField(label = "PHONE NUMBER", value = phoneInput, onValueChange = { phoneInput = it })

                Row(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.weight(1f)) {
                        OutlinedProfileField(label = "DATE OF BIRTH", value = dobInput, onValueChange = { dobInput = it })
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        OutlinedProfileField(label = "HEIGHT", value = heightInput, onValueChange = { heightInput = it })
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
                Divider(color = RoyalGold.copy(alpha = 0.15f))
                Spacer(modifier = Modifier.height(8.dp))

                // Section Title: Heritage & Clan
                Text(
                    text = "HERITAGE & CLAN AUDIT",
                    color = LightGold,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )

                Row(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.weight(1f)) {
                        OutlinedProfileField(label = "RAJPUT CLAN", value = clanInput, onValueChange = { clanInput = it })
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        OutlinedProfileField(label = "THIKANA (SEAT)", value = thikanaInput, onValueChange = { thikanaInput = it })
                    }
                }

                Row(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.weight(1f)) {
                        OutlinedProfileField(label = "PATERNAL GOTRA", value = gotraInput, onValueChange = { gotraInput = it })
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        OutlinedProfileField(label = "MATERNAL GOTRA", value = motherGotraInput, onValueChange = { motherGotraInput = it })
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
                Divider(color = RoyalGold.copy(alpha = 0.15f))
                Spacer(modifier = Modifier.height(8.dp))

                // Section Title: Education & Professional
                Text(
                    text = "EDUCATION & CAREER",
                    color = LightGold,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )

                OutlinedProfileField(label = "HIGHEST EDUCATION", value = educationInput, onValueChange = { educationInput = it })

                OutlinedProfileField(label = "OCCUPATION / BUSINESS", value = occupationInput, onValueChange = { occupationInput = it })

                OutlinedProfileField(label = "ANNUAL INCOME", value = incomeInput, onValueChange = { incomeInput = it })

                Spacer(modifier = Modifier.height(16.dp))

                // Save Action
                Button(
                    onClick = {
                        val updated = user.copy(
                            name = nameInput,
                            clan = clanInput,
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
                        session.updateCurrentUser(updated)
                        onDismiss()
                    },
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = RoyalGold),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = DeepMaroon,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Save Profile Card",
                        color = DeepMaroon,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(40.dp))
    }
}

@Composable
fun OutlinedProfileField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = label,
            fontSize = 8.sp,
            color = SandstoneIvory.copy(alpha = 0.8f),
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 6.dp)
        )
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.Black,
                unfocusedTextColor = Color.Black,
                focusedContainerColor = CardBackground,
                unfocusedContainerColor = CardBackground,
                focusedBorderColor = RoyalGold,
                unfocusedBorderColor = Color.Gray.copy(alpha = 0.3f)
            )
        )
    }
}
