import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Binding var isGuestBypassed: Bool
    
    // Form fields state
    @State private var gotraInput: String = ""
    @State private var motherGotraInput: String = ""
    @State private var thikanaInput: String = ""
    @State private var phoneInput: String = ""
    @State private var selectedDobDate: Date = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: "1996-10-19") ?? Date()
    }()
    @State private var educationInput: String = ""
    @State private var occupationInput: String = ""
    @State private var incomeInput: String = ""
    @State private var heightInput: String = "5 ft 8 in"
    @State private var selectedGender: String = "Groom"
    @State private var selectedClan: String = "Rathore"
    @State private var profilePicInput: String = ""
    
    @State private var showingImagePicker: Bool = false
    @State private var inputImage: UIImage? = nil
    
    @State private var isSaving: Bool = false
    @State private var errorMessage: String? = nil
    
    let clans = ["Rathore", "Sisodia", "Chauhan", "Kachwaha", "Bhati", "Shekhawat"]
    let heights = ["5 ft 0 in", "5 ft 2 in", "5 ft 4 in", "5 ft 6 in", "5 ft 8 in", "5 ft 10 in", "6 ft 0 in", "6 ft 2 in"]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Back Button Row
                    HStack {
                        Button(action: {
                            withAnimation(.easeOut(duration: 0.4)) {
                                session.logout()
                            }
                        }) {
                            HStack(spacing: 6) {
                                Image(systemName: "arrow.left")
                                    .font(.system(size: 16, weight: .bold))
                                Text("Back to Login")
                                    .font(BrandFonts.bodyBold(size: 14))
                            }
                            .foregroundColor(.lightGold)
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            .background(Color.white.opacity(0.05))
                            .cornerRadius(8)
                        }
                        Spacer()
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 10)
                    
                    // Header Card
                    VStack(spacing: 8) {
                        Image(systemName: "crown.fill")
                            .font(.system(size: 40))
                            .foregroundColor(.royalGold)
                        
                        Text("Complete Your Noble Profile")
                            .font(BrandFonts.displayBold(size: 24))
                            .foregroundColor(.lightGold)
                            .multilineTextAlignment(.center)
                        
                        Text("Please provide your lineage and credentials to access matchmaking.")
                            .font(BrandFonts.body(size: 13))
                            .foregroundColor(.sandstoneIvory.opacity(0.8))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                    .padding(.vertical, 10)
                    
                    // Circular Avatar Picker
                    VStack(spacing: 8) {
                        Button(action: {
                            showingImagePicker = true
                        }) {
                            ZStack {
                                if !profilePicInput.isEmpty {
                                    if #available(iOS 15.0, *) {
                                        AsyncImage(url: URL(string: profilePicInput)) { image in
                                            image.resizable().scaledToFill()
                                        } placeholder: {
                                            ProgressView()
                                        }
                                        .frame(width: 100, height: 100)
                                        .clipShape(Circle())
                                    } else {
                                        Image("groom_ranveer")
                                            .resizable()
                                            .scaledToFill()
                                            .frame(width: 100, height: 100)
                                            .clipShape(Circle())
                                    }
                                } else {
                                    Circle()
                                        .fill(Color.white.opacity(0.1))
                                        .frame(width: 100, height: 100)
                                        .overlay(
                                            Image(systemName: "plus")
                                                .font(.system(size: 32, weight: .bold))
                                                .foregroundColor(.lightGold)
                                        )
                                }
                            }
                            .overlay(Circle().stroke(Color.royalGold, lineWidth: 2))
                        }
                        
                        Text("Tap to choose profile picture")
                            .font(BrandFonts.body(size: 11))
                            .foregroundColor(.lightGold.opacity(0.8))
                    }
                    .padding(.bottom, 10)
                    
                    if let err = errorMessage {
                        Text(err)
                            .font(BrandFonts.bodyBold(size: 13))
                            .foregroundColor(.red)
                            .multilineTextAlignment(.center)
                            .padding()
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(8)
                    }
                    
                    // Form Card
                    VStack(alignment: .leading, spacing: 20) {
                        // Gender Selection
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Gender")
                                .font(BrandFonts.bodyBold(size: 14))
                                .foregroundColor(.lightGold)
                            
                            Picker("Gender", selection: $selectedGender) {
                                Text("Groom (Kunwar)").tag("Groom")
                                Text("Bride (Bannisa)").tag("Bride")
                            }
                            .pickerStyle(SegmentedPickerStyle())
                        }
                        
                        // Clan Selection
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Clan / Kul")
                                .font(BrandFonts.bodyBold(size: 14))
                                .foregroundColor(.lightGold)
                            
                            Picker("Clan", selection: $selectedClan) {
                                ForEach(clans, id: \.self) { clan in
                                    Text(clan).tag(clan)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(8)
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(8)
                        }
                        
                        // Gotras
                        HStack(spacing: 16) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Father Gotra")
                                    .font(BrandFonts.bodyBold(size: 14))
                                    .foregroundColor(.lightGold)
                                TextField("e.g. Kashyap", text: $gotraInput)
                                    .padding(10)
                                    .background(Color.white.opacity(0.1))
                                    .cornerRadius(8)
                                    .foregroundColor(.white)
                            }
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Mother Gotra")
                                    .font(BrandFonts.bodyBold(size: 14))
                                    .foregroundColor(.lightGold)
                                TextField("e.g. Chauhan", text: $motherGotraInput)
                                    .padding(10)
                                    .background(Color.white.opacity(0.1))
                                    .cornerRadius(8)
                                    .foregroundColor(.white)
                            }
                        }
                        
                        // Thikana & Phone
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Thikana / Ancestral Origin")
                                .font(BrandFonts.bodyBold(size: 14))
                                .foregroundColor(.lightGold)
                            TextField("e.g. Rohet, Pali", text: $thikanaInput)
                                .padding(10)
                                .background(Color.white.opacity(0.1))
                                .cornerRadius(8)
                                .foregroundColor(.white)
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Phone Number")
                                .font(BrandFonts.bodyBold(size: 14))
                                .foregroundColor(.lightGold)
                            TextField("e.g. +91 98765 43210", text: $phoneInput)
                                .padding(10)
                                .background(Color.white.opacity(0.1))
                                .cornerRadius(8)
                                .foregroundColor(.white)
                                .keyboardType(.phonePad)
                        }
                        
                        // Date of Birth
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Date of Birth")
                                .font(BrandFonts.bodyBold(size: 14))
                                .foregroundColor(.lightGold)
                            
                            DatePicker("", selection: $selectedDobDate, displayedComponents: .date)
                                .datePickerStyle(CompactDatePickerStyle())
                                .labelsHidden()
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(6)
                                .background(Color.white.opacity(0.1))
                                .cornerRadius(8)
                        }
                        
                        // Education & Occupation
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Education Qualification")
                                .font(BrandFonts.bodyBold(size: 14))
                                .foregroundColor(.lightGold)
                            TextField("e.g. B.Tech, MBA", text: $educationInput)
                                .padding(10)
                                .background(Color.white.opacity(0.1))
                                .cornerRadius(8)
                                .foregroundColor(.white)
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Occupation / Profession")
                                .font(BrandFonts.bodyBold(size: 14))
                                .foregroundColor(.lightGold)
                            TextField("e.g. Business, Software Engineer", text: $occupationInput)
                                .padding(10)
                                .background(Color.white.opacity(0.1))
                                .cornerRadius(8)
                                .foregroundColor(.white)
                        }
                        
                        // Income & Height
                        HStack(spacing: 16) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Annual Income")
                                    .font(BrandFonts.bodyBold(size: 14))
                                    .foregroundColor(.lightGold)
                                TextField("e.g. 15 Lakhs+", text: $incomeInput)
                                    .padding(10)
                                    .background(Color.white.opacity(0.1))
                                    .cornerRadius(8)
                                    .foregroundColor(.white)
                            }
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Height")
                                    .font(BrandFonts.bodyBold(size: 14))
                                    .foregroundColor(.lightGold)
                                Picker("Height", selection: $heightInput) {
                                    ForEach(heights, id: \.self) { h in
                                        Text(h).tag(h)
                                    }
                                }
                                .pickerStyle(MenuPickerStyle())
                                .padding(8)
                                .background(Color.white.opacity(0.1))
                                .cornerRadius(8)
                            }
                        }
                    }
                    .padding(20)
                    .background(Color.deepMaroon)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.royalGold.opacity(0.2), lineWidth: 1.5))
                    .padding(.horizontal, 16)
                    
                    // Submit Button
                    Button(action: saveProfile) {
                        HStack {
                            if isSaving {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .deepMaroon))
                            } else {
                                Text("Establish Lineage")
                                    .font(BrandFonts.displayBold(size: 16))
                            }
                        }
                        .foregroundColor(.deepMaroon)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.royalGold)
                        .cornerRadius(12)
                        .shadow(color: Color.royalGold.opacity(0.3), radius: 6, x: 0, y: 3)
                    }
                    .disabled(isSaving)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 40)
                }
            }
            .background(Color.deepMaroon.edgesIgnoringSafeArea(.all))
            .navigationBarHidden(true)
        }
        .sheet(isPresented: $showingImagePicker, onDismiss: loadImage) {
            ImagePicker(image: $inputImage)
        }
        .onAppear {
            if let user = session.currentUser {
                selectedGender = user.gender
                selectedClan = user.clan
                gotraInput = user.gotra
                motherGotraInput = user.motherGotra
                thikanaInput = user.thikana
                phoneInput = user.phone
                
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd"
                if let parsedDate = formatter.date(from: user.dob) {
                    selectedDobDate = parsedDate
                }
                
                educationInput = user.education
                occupationInput = user.occupation
                incomeInput = user.income
                heightInput = user.height.isEmpty ? "5 ft 8 in" : user.height
                profilePicInput = user.profilePic ?? ""
            }
        }
    }
    
    private func loadImage() {
        guard let inputImage = inputImage else { return }
        uploadImage(inputImage)
    }
    
    private func uploadImage(_ image: UIImage) {
        guard let data = image.jpegData(compressionQuality: 0.8) else { return }
        guard let currentUser = session.currentUser else { return }
        
        isSaving = true
        errorMessage = nil
        
        let filename = "\(currentUser.email.replacingOccurrences(of: "@", with: "_").replacingOccurrences(of: ".", with: "_"))_avatar.jpg"
        guard let url = URL(string: "https://afbrznllcfgfcjuinnlf.supabase.co/storage/v1/object/avatars/\(filename)") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        let apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
        request.addValue(apiKey, forHTTPHeaderField: "apikey")
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.addValue("image/jpeg", forHTTPHeaderField: "Content-Type")
        request.addValue("true", forHTTPHeaderField: "x-upsert")
        request.httpBody = data
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                self.isSaving = false
                if let error = error {
                    self.errorMessage = "Upload failed: \(error.localizedDescription)"
                    return
                }
                
                if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                    self.profilePicInput = "https://afbrznllcfgfcjuinnlf.supabase.co/storage/v1/object/public/avatars/\(filename)"
                } else {
                    self.errorMessage = "Upload failed. Please try again."
                }
            }
        }.resume()
    }
    
    private func saveProfile() {
        guard !gotraInput.isEmpty, !motherGotraInput.isEmpty, !thikanaInput.isEmpty, !phoneInput.isEmpty else {
            errorMessage = "Please fill in all lineage and contact details."
            return
        }
        
        guard let currentUser = session.currentUser else { return }
        isSaving = true
        errorMessage = nil
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let formattedDob = formatter.string(from: selectedDobDate)
        
        let updatedUser = User(
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            gender: selectedGender,
            clan: selectedClan,
            tier: currentUser.tier,
            shortlistedIds: currentUser.shortlistedIds,
            unlockedIds: currentUser.unlockedIds,
            gotra: gotraInput,
            motherGotra: motherGotraInput,
            thikana: thikanaInput,
            phone: phoneInput,
            dob: formattedDob,
            education: educationInput,
            occupation: occupationInput,
            income: incomeInput,
            height: heightInput,
            maritalStatus: "Never Married",
            profilePic: profilePicInput.isEmpty ? (selectedGender == "Groom" ? "groom_ranveer" : "bride_aishwarya") : profilePicInput
        )
        
        // Save to Supabase (upsert/update if existing, insert if new)
        let isExistingUser = currentUser.id.contains("-") || !currentUser.id.contains("@")
        
        if isExistingUser {
            SupabaseClient.shared.updateProfile(user: updatedUser) { success in
                DispatchQueue.main.async {
                    self.isSaving = false
                    if success {
                        self.session.updateCurrentUser(updated: updatedUser)
                        self.isGuestBypassed = true
                    } else {
                        self.errorMessage = "Failed to update profile. Please try again."
                    }
                }
            }
        } else {
            SupabaseClient.shared.insertProfile(profile: updatedUser) { result in
                DispatchQueue.main.async {
                    self.isSaving = false
                    switch result {
                    case .success:
                        self.session.updateCurrentUser(updated: updatedUser)
                        self.isGuestBypassed = true
                    case .failure(let err):
                        print("Supabase profile save error: \(err.localizedDescription)")
                        self.errorMessage = "Failed to create profile: \(err.localizedDescription)"
                    }
                }
            }
        }
    }
}

// SwiftUI ImagePicker Controller wrapper
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Environment(\.presentationMode) var presentationMode

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        let parent: ImagePicker

        init(_ parent: ImagePicker) {
            self.parent = parent
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let uiImage = info[.originalImage] as? UIImage {
                parent.image = uiImage
            }
            parent.presentationMode.wrappedValue.dismiss()
        }
    }
}
