package com.sagaisambaandh.ui.screens

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.data.User
import com.sagaisambaandh.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream
import java.io.InputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyProfileView(
    session: SagaiSessionManager,
    onNavigateToPremium: () -> Unit = {},
    onViewBiodata: () -> Unit = {},
    onDismiss: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val user = session.currentUser.value

    var name by remember(user) { mutableStateOf(user?.name ?: "") }
    var clan by remember(user) { mutableStateOf(user?.clan?.ifEmpty { "Rathore" } ?: "Rathore") }
    var gotra by remember(user) { mutableStateOf(user?.gotra ?: "") }
    var motherGotra by remember(user) { mutableStateOf(user?.motherGotra ?: "") }
    var thikana by remember(user) { mutableStateOf(user?.thikana ?: "") }
    var phone by remember(user) { mutableStateOf(user?.phone ?: "") }
    var dob by remember(user) { mutableStateOf(user?.dob ?: "") }
    var education by remember(user) { mutableStateOf(user?.education ?: "") }
    var occupation by remember(user) { mutableStateOf(user?.occupation ?: "") }
    var income by remember(user) { mutableStateOf(user?.income ?: "") }
    var height by remember(user) { mutableStateOf(user?.height ?: "") }
    var maritalStatus by remember(user) { mutableStateOf(user?.maritalStatus?.ifEmpty { "Never Married" } ?: "Never Married") }

    var location by remember(user) { mutableStateOf(user?.thikana ?: "") }
    var rashi by remember { mutableStateOf("Select Rashi") }
    var manglik by remember { mutableStateOf("Non-Manglik") }
    var expectations by remember { mutableStateOf("") }
    var instagram by remember { mutableStateOf("") }
    var facebook by remember { mutableStateOf("") }
    var biodataUrl by remember { mutableStateOf("") }
    var about by remember(user) { mutableStateOf(user?.about ?: "") }
    var gender by remember(user) { mutableStateOf(user?.gender?.ifEmpty { "Groom" } ?: "Groom") }
    var lookingFor by remember { mutableStateOf(session.searchGender.value) }

    var isSaving by remember { mutableStateOf(false) }
    var showSavedToast by remember { mutableStateOf(false) }
    var toastMessage by remember { mutableStateOf("") }
    var showLogoutDialog by remember { mutableStateOf(false) }

    val clansOptions = listOf(
        "Rathore", "Sisodia", "Chauhan", "Kachwaha", "Bhati", "Shekhawat",
        "Panwar", "Tanwar", "Hada", "Sodha", "Parihar", "Tomar", "Jhala", "Solanki"
    )
    val manglikOptions = listOf("Non-Manglik", "Manglik", "Anshik Manglik")
    val maritalOptions = listOf("Never Married", "Separated", "Divorced", "Widowed")
    val genderOptions = listOf("Groom", "Bride")
    val rashiOptions = listOf(
        "Select Rashi", "Mesh (Aries)", "Vrishabh (Taurus)", "Mithun (Gemini)",
        "Kark (Cancer)", "Singh (Leo)", "Kanya (Virgo)", "Tula (Libra)",
        "Vrishchik (Scorpio)", "Dhanu (Sagittarius)", "Makar (Capricorn)",
        "Kumbh (Aquarius)", "Meen (Pisces)"
    )

    // Gallery Photo Picker
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null && user != null) {
            try {
                val inputStream: InputStream? = context.contentResolver.openInputStream(uri)
                val originalBitmap = BitmapFactory.decodeStream(inputStream)
                if (originalBitmap != null) {
                    val maxDim = 600
                    val ratio = Math.min(maxDim.toFloat() / originalBitmap.width, maxDim.toFloat() / originalBitmap.height)
                    val targetWidth = (originalBitmap.width * Math.min(1.0f, ratio)).toInt()
                    val targetHeight = (originalBitmap.height * Math.min(1.0f, ratio)).toInt()
                    val resizedBitmap = Bitmap.createScaledBitmap(originalBitmap, targetWidth, targetHeight, true)

                    val outputStream = ByteArrayOutputStream()
                    resizedBitmap.compress(Bitmap.CompressFormat.JPEG, 75, outputStream)
                    val byteArray = outputStream.toByteArray()
                    val base64String = "data:image/jpeg;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP)

                    val updatedUser = user.copy(profilePic = base64String)
                    session.updateCurrentUser(updatedUser)
                    session.updateProfile(updatedUser) { success ->
                        toastMessage = if (success) "Profile picture updated from Gallery!" else "Photo updated locally"
                        showSavedToast = true
                        coroutineScope.launch {
                            delay(2500)
                            showSavedToast = false
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun saveProfile() {
        if (user == null) return
        isSaving = true
        session.setLookingForGender(lookingFor)

        val updated = user.copy(
            name = name.trim(),
            gender = gender,
            clan = clan,
            gotra = gotra.trim(),
            motherGotra = motherGotra.trim(),
            thikana = thikana.trim(),
            phone = phone.trim(),
            dob = dob.trim(),
            education = education.trim(),
            occupation = occupation.trim(),
            income = income.trim(),
            height = height.trim(),
            maritalStatus = maritalStatus,
            about = about
        )

        session.updateCurrentUser(updated)
        session.updateProfile(updated) { success ->
            isSaving = false
            toastMessage = if (success) "Profile & Preferences Saved Successfully!" else "Profile Saved Locally"
            showSavedToast = true
            coroutineScope.launch {
                delay(2500)
                showSavedToast = false
            }
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFFF9FAFB)) // Clean elevated surface
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Top Custom Header Bar (Clean White)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                if (onDismiss != null) {
                    Text(
                        text = "Close",
                        color = AppPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.clickable { onDismiss() }
                    )
                } else {
                    Spacer(modifier = Modifier.width(40.dp))
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.AccountCircle,
                        contentDescription = "Profile",
                        tint = AppPrimary,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "My Profile",
                        color = Color(0xFF1B1B1E),
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif
                    )
                }

                // Save button
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .background(Brush.horizontalGradient(listOf(AppPrimary, AppSecondary)))
                        .clickable(enabled = !isSaving) { saveProfile() }
                        .padding(horizontal = 14.dp, vertical = 7.dp)
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(
                            color = Color.White,
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = "Save",
                                tint = Color.White,
                                modifier = Modifier.size(12.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Save",
                                color = Color.White,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            Divider(color = Color(0xFFE5E7EB), thickness = 1.dp)

            // Scrollable Profile Form
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp)
            ) {
                // 1. Hero Profile Header Card with Direct Phone Gallery Photo Picker
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = Brush.linearGradient(listOf(Color(0xFFE5E7EB), Color(0xFFE5E7EB))),
                        width = 1.dp
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 20.dp, horizontal = 16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(contentAlignment = Alignment.BottomEnd) {
                            // Avatar
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier
                                    .size(96.dp)
                                    .clip(CircleShape)
                                    .border(2.5.dp, RoyalGold, CircleShape)
                                    .clickable { galleryLauncher.launch("image/*") }
                            ) {
                                val pic = user?.profilePic
                                if (!pic.isNullOrEmpty()) {
                                    val imageUrl = if (pic.startsWith("data:") || pic.startsWith("http")) pic else "https://shreerajputsagaisambandh.com/images/$pic.png"
                                    AsyncImage(
                                        model = imageUrl,
                                        contentDescription = "Profile Photo",
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                } else {
                                    Box(
                                        contentAlignment = Alignment.Center,
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .background(Color(0xFFF3F4F6))
                                    ) {
                                        Text(
                                            text = user?.name?.take(1) ?: "M",
                                            color = AppPrimary,
                                            fontSize = 32.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }

                            // Camera badge
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier
                                    .size(30.dp)
                                    .clip(CircleShape)
                                    .background(Brush.linearGradient(listOf(AppPrimary, AppSecondary)))
                                    .border(2.dp, Color.White, CircleShape)
                                    .clickable { galleryLauncher.launch("image/*") }
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CameraAlt,
                                    contentDescription = "Camera",
                                    tint = Color.White,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }

                        // Name & Identity
                        Text(
                            text = if (user?.name.isNullOrEmpty()) "Rajput Member" else user!!.name,
                            color = Color(0xFF1B1B1E),
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Serif
                        )

                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            if (!user?.clan.isNullOrEmpty()) {
                                Text(
                                    text = user!!.clan,
                                    color = AppPrimary,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            if (!user?.gotra.isNullOrEmpty()) {
                                Text(
                                    text = "•  ${user!!.gotra} Gotra",
                                    color = Color(0xFF6B7280),
                                    fontSize = 13.sp
                                )
                            }
                        }

                        // Change photo button
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(AppPrimary.copy(alpha = 0.08f))
                                .clickable { galleryLauncher.launch("image/*") }
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.AddPhotoAlternate,
                                    contentDescription = null,
                                    tint = AppPrimary,
                                    modifier = Modifier.size(13.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Change Photo from Phone Gallery",
                                    color = AppPrimary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        // Badges Row
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            // Verified Badge
                            Row(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(VerifiedBlue.copy(alpha = 0.1f))
                                    .padding(horizontal = 10.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Verified,
                                    contentDescription = "Verified",
                                    tint = VerifiedBlue,
                                    modifier = Modifier.size(11.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "Verified Profile",
                                    color = VerifiedBlue,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            // Tier Badge
                            Row(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(StarGold.copy(alpha = 0.12f))
                                    .padding(horizontal = 10.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.WorkspacePremium,
                                    contentDescription = "Tier",
                                    tint = StarGold,
                                    modifier = Modifier.size(11.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = user?.tier ?: "Starter",
                                    color = StarGold,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                // 2. Partner Preferences Showcase & Quick Editor
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = Brush.linearGradient(listOf(Color(0xFFE5E7EB), Color(0xFFE5E7EB))),
                        width = 1.dp
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Favorite,
                                    contentDescription = null,
                                    tint = AppPrimary,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "PARTNER PREFERENCES",
                                    color = Color(0xFF1B1B1E),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 0.8.sp
                                )
                            }
                        }

                        Text(
                            text = "Criteria used to recommend brides and grooms in Discover:",
                            color = Color(0xFF6B7280),
                            fontSize = 12.sp
                        )

                        // Quick Looking For Switcher
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = "LOOKING FOR IN DISCOVER",
                                color = Color(0xFF6B7280),
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold
                            )

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(Color(0xFFF3F4F6))
                                    .padding(3.dp),
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                listOf("Bride" to "👰 Vadhu (Bride)", "Groom" to "🤵 Var (Groom)").forEach { (valKey, label) ->
                                    val isSelected = lookingFor.equals(valKey, ignoreCase = true)
                                    Box(
                                        contentAlignment = Alignment.Center,
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(if (isSelected) Color.White else Color.Transparent)
                                            .clickable {
                                                lookingFor = valKey
                                                session.setLookingForGender(valKey)
                                            }
                                            .padding(vertical = 8.dp)
                                    ) {
                                        Text(
                                            text = label,
                                            color = if (isSelected) Color(0xFF1B1B1E) else Color(0xFF6B7280),
                                            fontSize = 12.sp,
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                        )
                                    }
                                }
                            }
                        }

                        // Preferences Badges
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            PreferenceBadge(title = "Seeking", value = lookingFor, modifier = Modifier.weight(1f))
                            PreferenceBadge(title = "Clan", value = session.searchClan.value, modifier = Modifier.weight(1f))
                            PreferenceBadge(title = "Status", value = "Verified Only", modifier = Modifier.weight(1f))
                        }
                    }
                }

                // 3. Lineage & Identity Section
                SectionContainer(
                    title = "राजपूत कुल एवं गोत्र (LINEAGE & GOTRA)",
                    icon = Icons.Default.Shield
                ) {
                    WhiteProfileTextField(label = "FULL NAME", value = name, onValueChange = { name = it }, placeholder = "e.g. Kunwar Ranvijay Singh")

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(modifier = Modifier.weight(1f)) {
                            DropdownProfileSelector(
                                label = "MY GENDER",
                                selected = gender,
                                options = genderOptions,
                                onSelect = {
                                    gender = it
                                    lookingFor = if (it.equals("Groom", ignoreCase = true)) "Bride" else "Groom"
                                    session.setLookingForGender(lookingFor)
                                }
                            )
                        }

                        Box(modifier = Modifier.weight(1f)) {
                            DropdownProfileSelector(
                                label = "RAJPUT CLAN",
                                selected = clan,
                                options = clansOptions,
                                onSelect = { clan = it }
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(modifier = Modifier.weight(1f)) {
                            WhiteProfileTextField(label = "PATERNAL GOTRA (पिता का गोत्र)", value = gotra, onValueChange = { gotra = it }, placeholder = "e.g. Kashyap")
                        }
                        Box(modifier = Modifier.weight(1f)) {
                            WhiteProfileTextField(label = "MATERNAL GOTRA (माता का गोत्र)", value = motherGotra, onValueChange = { motherGotra = it }, placeholder = "e.g. Shandilya")
                        }
                    }

                    WhiteProfileTextField(label = "THIKANA / NATIVE HOUSE (ठिकाना)", value = thikana, onValueChange = { thikana = it }, placeholder = "e.g. Rohet Garh, Pali")

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(modifier = Modifier.weight(1f)) {
                            WhiteProfileTextField(label = "DATE OF BIRTH (DD/MM/YYYY)", value = dob, onValueChange = { dob = it }, placeholder = "15/08/1996")
                        }
                        Box(modifier = Modifier.weight(1f)) {
                            WhiteProfileTextField(label = "NATIVE PLACE / BIRTHPLACE", value = location, onValueChange = { location = it }, placeholder = "e.g. Jodhpur, Rajasthan")
                        }
                    }
                }

                // 4. Astrological & Physical Attributes Section
                SectionContainer(
                    title = "कुंडली एवं नक्षत्र (ASTROLOGY & ATTRIBUTES)",
                    icon = Icons.Default.AutoAwesome
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(modifier = Modifier.weight(1f)) {
                            WhiteProfileTextField(label = "HEIGHT", value = height, onValueChange = { height = it }, placeholder = "e.g. 5' 11\"")
                        }
                        Box(modifier = Modifier.weight(1f)) {
                            DropdownProfileSelector(
                                label = "ZODIAC / RASHI (राशि)",
                                selected = rashi,
                                options = rashiOptions,
                                onSelect = { rashi = it }
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(modifier = Modifier.weight(1f)) {
                            DropdownProfileSelector(
                                label = "MANGLIK STATUS",
                                selected = manglik,
                                options = manglikOptions,
                                onSelect = { manglik = it }
                            )
                        }
                        Box(modifier = Modifier.weight(1f)) {
                            DropdownProfileSelector(
                                label = "MARITAL STATUS",
                                selected = maritalStatus,
                                options = maritalOptions,
                                onSelect = { maritalStatus = it }
                            )
                        }
                    }
                }

                // 5. Professional & Contact Details Section
                SectionContainer(
                    title = "शिक्षा एवं व्यवसाय (PROFESSION & CONTACT)",
                    icon = Icons.Default.Work
                ) {
                    WhiteProfileTextField(label = "EDUCATIONAL QUALIFICATIONS", value = education, onValueChange = { education = it }, placeholder = "e.g. B.Tech (IIT), MBA")
                    WhiteProfileTextField(label = "OCCUPATION / DESIGNATION", value = occupation, onValueChange = { occupation = it }, placeholder = "e.g. VP Operations / Civil Services")

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(modifier = Modifier.weight(1f)) {
                            WhiteProfileTextField(label = "ANNUAL INCOME", value = income, onValueChange = { income = it }, placeholder = "e.g. 24 LPA")
                        }
                        Box(modifier = Modifier.weight(1f)) {
                            WhiteProfileTextField(label = "MOBILE NUMBER", value = phone, onValueChange = { phone = it }, placeholder = "+91 9876543210")
                        }
                    }
                }

                // 6. Socials & Biodata Link Section
                SectionContainer(
                    title = "सामाजिक संपर्क एवं बायोडाटा (SOCIALS & BIODATA)",
                    icon = Icons.Default.Link
                ) {
                    WhiteProfileTextField(label = "INSTAGRAM PROFILE / HANDLE", value = instagram, onValueChange = { instagram = it }, placeholder = "@ranvijay_singh")
                    WhiteProfileTextField(label = "FACEBOOK PROFILE LINK", value = facebook, onValueChange = { facebook = it }, placeholder = "https://facebook.com/...")
                    WhiteProfileTextField(label = "BIODATA DOCUMENT / DRIVE LINK", value = biodataUrl, onValueChange = { biodataUrl = it }, placeholder = "https://drive.google.com/...")
                }

                // 7. Bio & Alignment Expectations Section (WHITE BACKGROUND BOXES - NO BLACK BOXES!)
                SectionContainer(
                    title = "परिचय एवं अपेक्षाएं (BIO & EXPECTATIONS)",
                    icon = Icons.Default.FormatQuote
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = "ABOUT ME (संक्षिप्त परिचय)",
                            color = Color(0xFF6B7280),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold
                        )
                        OutlinedTextField(
                            value = about,
                            onValueChange = { about = it },
                            placeholder = { Text("Write about your noble Rajput background, values, and lifestyle...", color = Color.Gray, fontSize = 13.sp) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(95.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color(0xFF1B1B1E),
                                unfocusedTextColor = Color(0xFF1B1B1E),
                                focusedContainerColor = Color.White,
                                unfocusedContainerColor = Color.White,
                                focusedBorderColor = AppPrimary,
                                unfocusedBorderColor = Color(0xFFE5E7EB)
                            )
                        )
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = "PARTNER EXPECTATIONS (जीवनसाथी से अपेक्षाएं)",
                            color = Color(0xFF6B7280),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold
                        )
                        OutlinedTextField(
                            value = expectations,
                            onValueChange = { expectations = it },
                            placeholder = { Text("Describe ideal partner attributes, clan considerations...", color = Color.Gray, fontSize = 13.sp) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(95.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color(0xFF1B1B1E),
                                unfocusedTextColor = Color(0xFF1B1B1E),
                                focusedContainerColor = Color.White,
                                unfocusedContainerColor = Color.White,
                                focusedBorderColor = AppPrimary,
                                unfocusedBorderColor = Color(0xFFE5E7EB)
                            )
                        )
                    }
                }

                // 8. Save Changes Button (Hero Gradient)
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(Brush.horizontalGradient(listOf(AppPrimary, AppSecondary)))
                        .clickable(enabled = !isSaving) { saveProfile() }
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    } else {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Save All Profile Changes",
                                color = Color.White,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // 9. Quick Actions Footer (Biodata, Plans, Logout)
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // View Biodata Button
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .weight(1f)
                                .height(44.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color.White)
                                .border(1.dp, Color(0xFFE5E7EB), RoundedCornerShape(10.dp))
                                .clickable { onViewBiodata() }
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Description,
                                    contentDescription = null,
                                    tint = Color(0xFF1B1B1E),
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "View Biodata",
                                    color = Color(0xFF1B1B1E),
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        // Upgrade to Premium Button
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .weight(1f)
                                .height(44.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(StarGold.copy(alpha = 0.12f))
                                .border(1.dp, StarGold.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                                .clickable { onNavigateToPremium() }
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.WorkspacePremium,
                                    contentDescription = null,
                                    tint = StarGold,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Royal Plans",
                                    color = StarGold,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    // Log Out Button
                    Text(
                        text = "Log Out",
                        color = DislikeRed,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier
                            .clickable { showLogoutDialog = true }
                            .padding(vertical = 8.dp)
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))
            }
        }

        // Floating Success Notification Toast
        AnimatedVisibility(
            visible = showSavedToast,
            enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
            exit = slideOutVertically(targetOffsetY = { it }) + fadeOut(),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 24.dp, start = 20.dp, end = 20.dp)
        ) {
            Row(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Brush.horizontalGradient(listOf(AppPrimary, AppSecondary)))
                    .padding(horizontal = 22.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Verified,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = toastMessage,
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Logout Alert Dialog
        if (showLogoutDialog) {
            AlertDialog(
                onDismissRequest = { showLogoutDialog = false },
                title = { Text("Log Out", fontWeight = FontWeight.Bold) },
                text = { Text("Are you sure you want to log out from Sagai Sambaandh?") },
                confirmButton = {
                    TextButton(onClick = {
                        showLogoutDialog = false
                        session.logout()
                    }) {
                        Text("Log Out", color = DislikeRed, fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showLogoutDialog = false }) {
                        Text("Cancel", color = Color.Gray)
                    }
                },
                containerColor = Color.White,
                shape = RoundedCornerShape(16.dp)
            )
        }
    }
}

@Composable
fun SectionContainer(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = Brush.linearGradient(listOf(Color(0xFFE5E7EB), Color(0xFFE5E7EB))),
            width = 1.dp
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = AppPrimary,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = title,
                    color = Color(0xFF1B1B1E),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.6.sp
                )
            }
            content()
        }
    }
}

@Composable
fun WhiteProfileTextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String = ""
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Text(
            text = label,
            color = Color(0xFF6B7280),
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold
        )
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder, color = Color.Gray.copy(alpha = 0.7f), fontSize = 13.sp) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(10.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color(0xFF1B1B1E),
                unfocusedTextColor = Color(0xFF1B1B1E),
                focusedContainerColor = Color(0xFFF9FAFB),
                unfocusedContainerColor = Color(0xFFF9FAFB),
                focusedBorderColor = AppPrimary,
                unfocusedBorderColor = Color(0xFFE5E7EB)
            )
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DropdownProfileSelector(
    label: String,
    selected: String,
    options: List<String>,
    onSelect: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Text(
            text = label,
            color = Color(0xFF6B7280),
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold
        )

        ExposedDropdownMenuBox(
            expanded = expanded,
            onExpandedChange = { expanded = !expanded }
        ) {
            Box(
                modifier = Modifier
                    .menuAnchor()
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color(0xFFF9FAFB))
                    .border(1.dp, Color(0xFFE5E7EB), RoundedCornerShape(10.dp))
                    .padding(horizontal = 14.dp, vertical = 14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = selected,
                        color = Color(0xFF1B1B1E),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Icon(
                        imageVector = Icons.Default.ArrowDropDown,
                        contentDescription = "Dropdown",
                        tint = Color.Gray
                    )
                }
            }

            ExposedDropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false },
                modifier = Modifier.background(Color.White)
            ) {
                options.forEach { opt ->
                    DropdownMenuItem(
                        text = { Text(opt, color = Color(0xFF1B1B1E), fontSize = 13.sp) },
                        onClick = {
                            onSelect(opt)
                            expanded = false
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun PreferenceBadge(
    title: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(Color(0xFFF3F4F6))
            .padding(vertical = 7.dp, horizontal = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        Text(
            text = title,
            color = Color(0xFF9CA3AF),
            fontSize = 8.sp
        )
        Text(
            text = value,
            color = Color(0xFF1B1B1E),
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            maxLines = 1
        )
    }
}
