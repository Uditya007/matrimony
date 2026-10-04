import SwiftUI

struct PartnerPreferencesView: View {
    @EnvironmentObject var session: SagaiSessionManager
    @Environment(\.presentationMode) var presentationMode
    
    @Binding var selectedTab: Int
    
    @State private var lookingForGender: String = "Bride"
    @State private var selectedClan: String = "All Clans"
    @State private var minAge: Double = 22
    @State private var maxAge: Double = 32
    @State private var preferredLocation: String = "Anywhere"
    @State private var manglikPref: String = "Doesn't Matter"
    @State private var isSavedSuccessfully: Bool = false
    
    private let clansOptions = ["All Clans", "Rathore", "Sisodia", "Chauhan", "Kachwaha", "Bhati", "Shekhawat"]
    private let locationOptions = ["Anywhere", "Rajasthan (Jaipur / Jodhpur / Udaipur)", "Delhi NCR", "Gujarat", "Madhya Pradesh", "Abroad / NRI"]
    private let manglikOptions = ["Doesn't Matter", "Non-Manglik", "Anshik Manglik", "Manglik Only"]
    
    var body: some View {
        NavigationView {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 22) {
                    // Header Subtitle
                    Text("Set your royal lineage and personal criteria. Profiles matching your traditional gotra and preference parameters will be prioritized.")
                        .font(BrandFonts.body(size: 13))
                        .foregroundColor(Color.appTextSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 16)
                        .padding(.top, 8)
                    
                    // 1. Seeking Gender
                    VStack(alignment: .leading, spacing: 10) {
                        Text("LOOKING FOR")
                            .font(BrandFonts.label(size: 11, weight: .bold))
                            .foregroundColor(Color.appTextSecondary)
                            .tracking(0.8)
                        
                        Picker("Looking For", selection: $lookingForGender) {
                            Text("Kunwar (Groom)").tag("Groom")
                            Text("Bannisa (Bride)").tag("Bride")
                        }
                        .pickerStyle(SegmentedPickerStyle())
                    }
                    .padding(16)
                    .background(Color.white)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.appBorder, lineWidth: 1))
                    
                    // 2. Preferred Clan
                    VStack(alignment: .leading, spacing: 10) {
                        Text("PREFERRED CLAN (KUL)")
                            .font(BrandFonts.label(size: 11, weight: .bold))
                            .foregroundColor(Color.appTextSecondary)
                            .tracking(0.8)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(clansOptions, id: \.self) { clan in
                                    Button(action: {
                                        selectedClan = clan
                                    }) {
                                        Text(clan)
                                            .font(BrandFonts.body(size: 13, weight: selectedClan == clan ? .bold : .medium))
                                            .foregroundColor(selectedClan == clan ? .white : Color.appTextPrimary)
                                            .padding(.horizontal, 16)
                                            .padding(.vertical, 8)
                                            .background(
                                                selectedClan == clan
                                                    ? LinearGradient(colors: [Color.appPrimary, Color.appSecondary], startPoint: .leading, endPoint: .trailing)
                                                    : LinearGradient(colors: [Color.appCardBackground, Color.appCardBackground], startPoint: .leading, endPoint: .trailing)
                                            )
                                            .clipShape(Capsule())
                                    }
                                }
                            }
                        }
                    }
                    .padding(16)
                    .background(Color.white)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.appBorder, lineWidth: 1))
                    
                    // 3. Age Range
                    VStack(alignment: .leading, spacing: 14) {
                        HStack {
                            Text("AGE RANGE")
                                .font(BrandFonts.label(size: 11, weight: .bold))
                                .foregroundColor(Color.appTextSecondary)
                                .tracking(0.8)
                            Spacer()
                            Text("\(Int(minAge)) yrs - \(Int(maxAge)) yrs")
                                .font(BrandFonts.bodyBold(size: 13))
                                .foregroundColor(Color.appPrimary)
                        }
                        
                        VStack(spacing: 8) {
                            HStack {
                                Text("Min: \(Int(minAge))")
                                    .font(BrandFonts.label(size: 11))
                                    .foregroundColor(Color.appTextMuted)
                                Slider(value: $minAge, in: 18...45, step: 1)
                                    .accentColor(Color.appPrimary)
                            }
                            
                            HStack {
                                Text("Max: \(Int(maxAge))")
                                    .font(BrandFonts.label(size: 11))
                                    .foregroundColor(Color.appTextMuted)
                                Slider(value: $maxAge, in: 21...60, step: 1)
                                    .accentColor(Color.appSecondary)
                            }
                        }
                    }
                    .padding(16)
                    .background(Color.white)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.appBorder, lineWidth: 1))
                    
                    // 4. Preferred Location
                    VStack(alignment: .leading, spacing: 10) {
                        Text("PREFERRED LOCATION")
                            .font(BrandFonts.label(size: 11, weight: .bold))
                            .foregroundColor(Color.appTextSecondary)
                            .tracking(0.8)
                        
                        ForEach(locationOptions, id: \.self) { loc in
                            Button(action: { preferredLocation = loc }) {
                                HStack {
                                    Text(loc)
                                        .font(BrandFonts.body(size: 13.5))
                                        .foregroundColor(Color.appTextPrimary)
                                    Spacer()
                                    if preferredLocation == loc {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(Color.appPrimary)
                                    } else {
                                        Image(systemName: "circle")
                                            .foregroundColor(Color.appTextMuted)
                                    }
                                }
                                .padding(.vertical, 4)
                            }
                            if loc != locationOptions.last {
                                Divider()
                            }
                        }
                    }
                    .padding(16)
                    .background(Color.white)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.appBorder, lineWidth: 1))
                    
                    // 5. Manglik Preference
                    VStack(alignment: .leading, spacing: 10) {
                        Text("MANGLIK DOSHA PREFERENCE")
                            .font(BrandFonts.label(size: 11, weight: .bold))
                            .foregroundColor(Color.appTextSecondary)
                            .tracking(0.8)
                        
                        Picker("Manglik", selection: $manglikPref) {
                            ForEach(manglikOptions, id: \.self) { opt in
                                Text(opt).tag(opt)
                            }
                        }
                        .pickerStyle(SegmentedPickerStyle())
                    }
                    .padding(16)
                    .background(Color.white)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.appBorder, lineWidth: 1))
                    
                    // Save Button
                    Button(action: savePreferences) {
                        HStack(spacing: 8) {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.system(size: 15))
                            Text(isSavedSuccessfully ? "Preferences Saved!" : "Save & Find Royal Matches")
                                .font(BrandFonts.bodyBold(size: 15))
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(
                            LinearGradient(
                                colors: [Color.appPrimary, Color.appSecondary],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(26)
                        .shadow(color: Color.appPrimary.opacity(0.3), radius: 8, y: 4)
                    }
                    .padding(.top, 10)
                    .padding(.bottom, 24)
                }
                .padding(.horizontal, 20)
            }
            .background(Color.appSurfaceElevated.edgesIgnoringSafeArea(.all))
            .navigationBarTitle("Partner Preferences", displayMode: .inline)
            .navigationBarItems(
                leading: Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                }
                .foregroundColor(Color.appTextPrimary),
                trailing: Button("Save") {
                    savePreferences()
                }
                .font(BrandFonts.bodyBold(size: 15))
                .foregroundColor(Color.appPrimary)
            )
            .onAppear(perform: loadCurrentPreferences)
        }
    }
    
    private func loadCurrentPreferences() {
        lookingForGender = session.searchGender
        selectedClan = session.searchClan
        if let userId = session.currentUser?.id {
            if let savedLoc = UserDefaults.standard.string(forKey: "pref_loc_\(userId)") {
                preferredLocation = savedLoc
            }
            if let savedManglik = UserDefaults.standard.string(forKey: "pref_manglik_\(userId)") {
                manglikPref = savedManglik
            }
        }
    }
    
    private func savePreferences() {
        session.setLookingForGender(lookingForGender)
        session.searchClan = selectedClan
        
        if let userId = session.currentUser?.id {
            UserDefaults.standard.set(preferredLocation, forKey: "pref_loc_\(userId)")
            UserDefaults.standard.set(manglikPref, forKey: "pref_manglik_\(userId)")
            UserDefaults.standard.set(minAge, forKey: "pref_min_age_\(userId)")
            UserDefaults.standard.set(maxAge, forKey: "pref_max_age_\(userId)")
        }
        
        isSavedSuccessfully = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            presentationMode.wrappedValue.dismiss()
            selectedTab = 1 // Switch to Matches / Discover tab to immediately show tailored profiles
        }
    }
}
