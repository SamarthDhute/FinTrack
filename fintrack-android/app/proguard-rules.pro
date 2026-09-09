# ==============================================================================
# FinTrack ProGuard & R8 Optimization Rules
# ==============================================================================

# --- General ---
-keepattributes SourceFile,LineNumberTable
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
-keepattributes RuntimeVisibleAnnotations,RuntimeVisibleParameterAnnotations

# --- FinTrack Data Models (Prevent obfuscation of serialized JSON fields) ---
-keep class com.fintrack.app.models.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# --- Retrofit 2 & OkHttp ---
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }

# --- Gson ---
-keep class com.google.gson.** { *; }
-dontwarn com.google.gson.**

# --- Google Play Services Auth ---
-keep class com.google.android.gms.auth.api.signin.** { *; }
-keep class com.google.android.gms.common.api.** { *; }
-keep class com.google.android.gms.common.** { *; }
-dontwarn com.google.android.gms.**

# --- AndroidX Biometric ---
-keep class androidx.biometric.** { *; }

# --- Material Components ---
-keep class com.google.android.material.** { *; }
