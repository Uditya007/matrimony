package com.sagaisambaandh.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
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

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(SandstoneIvory.copy(alpha = 0.15f))
    ) {
        // Logo banner
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
            Text(
                text = "Noble Login",
                color = RoyalMaroon,
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif
            )
            Text(
                text = "Access Rajasthan's Royal Matrimony",
                color = Color.Gray,
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 4.dp, bottom = 20.dp)
            )

            // Demo panel
            Card(
                shape = RoundedCornerShape(8.dp),
                colors = CardDefaults.cardColors(containerColor = RoyalGold.copy(alpha = 0.06f)),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = Brush.linearGradient(listOf(RoyalGold.copy(alpha = 0.3f), RoyalGold.copy(alpha = 0.3f)))
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 20.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "NOBLE ACCESS DEMO:",
                        color = RoyalMaroon,
                        fontWeight = FontWeight.Bold,
                        fontSize = 9.sp,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Email: royal@sagaisambaandh.com",
                        color = InkBrown,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp
                    )
                    Text(
                        text = "Password: rajputana",
                        color = InkBrown,
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
                        color = Color.Gray,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                    OutlinedTextField(
                        value = emailInput,
                        onValueChange = { emailInput = it },
                        placeholder = { Text("e.g. kunwar.rathore@gmail.com") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
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
                        color = Color.Gray,
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
                    textAlign = TextAlign.Center
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Action
            Button(
                onClick = {
                    if (emailInput == "royal@sagaisambaandh.com" && passwordInput == "rajputana") {
                        val demoUser = User(
                            id = "U1",
                            name = "Ranveer Singh",
                            email = "royal@sagaisambaandh.com",
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
                colors = ButtonDefaults.buttonColors(containerColor = RoyalMaroon)
            ) {
                Text(
                    text = "Enter Sanctuary",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Redirect
            Row(
                modifier = Modifier
                    .clickable(onClick = onNavigateToRegister)
                    .padding(8.dp),
                horizontalArrangement = Arrangement.Center
            ) {
                Text(text = "Already have a lineage record? ", color = Color.Gray, fontSize = 12.sp)
                Text(text = "Sign Up here", color = RoyalMaroon, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
        }
    }
}
