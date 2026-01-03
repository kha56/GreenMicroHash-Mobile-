import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff, Cpu, Lock, Mail, ArrowRight } from "lucide-react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    if (data.session) {
      setIsLoading(false);
      router.replace("/");
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email address first.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert(
        "Password Reset",
        "Check your email for a password reset link.",
      );
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        "Missing Information",
        "Please enter both email and password.",
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);

    if (data.user && !data.session) {
      Alert.alert(
        "Check Your Email",
        "Please check your email to confirm your account.",
      );
    } else if (data.session) {
      router.replace("/");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gmh-dark">
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-center">
          {/* Logo & Branding */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-2xl bg-gmh-lime/20 items-center justify-center mb-4">
              <Cpu size={40} color="#84CC16" />
            </View>
            <Text className="text-white text-2xl font-bold mb-1">
              GreenMicroHash
            </Text>
            <Text className="text-gmh-slate text-sm">
              Bitcoin Mining Dashboard
            </Text>
          </View>
          {/* Welcome Text */}
          <View className="mb-8">
            <Text className="text-white text-xl font-semibold mb-1">
              Welcome back
            </Text>
            <Text className="text-gmh-slate text-sm">
              Sign in to monitor your mining operations
            </Text>
          </View>
          {/* Login Form */}
          <View className="gap-4">
            {/* Email Input */}
            <View>
              <Text className="text-gmh-slate text-xs mb-2 ml-1">Email</Text>
              <View className="flex-row items-center bg-gmh-card border border-gmh-border rounded-xl px-4">
                <Mail size={18} color="#64748B" />
                <TextInput
                  className="flex-1 text-white py-4 px-3"
                  placeholder="Enter your email"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password Input */}
            <View>
              <Text className="text-gmh-slate text-xs mb-2 ml-1">Password</Text>
              <View className="flex-row items-center bg-gmh-card border border-gmh-border rounded-xl px-4">
                <Lock size={18} color="#64748B" />
                <TextInput
                  className="flex-1 text-white py-4 px-3"
                  placeholder="Enter your password"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#64748B" />
                  ) : (
                    <Eye size={18} color="#64748B" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {error && (
              <View className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                <Text className="text-red-400 text-sm text-center">
                  {error}
                </Text>
              </View>
            )}

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              className="self-end"
            >
              <Text className="text-gmh-lime text-sm">Forgot password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading || !email || !password}
              className={`flex-row items-center justify-center rounded-xl py-4 mt-2 ${
                isLoading || !email || !password
                  ? "bg-gmh-lime/50"
                  : "bg-gmh-lime"
              }`}
            >
              {isLoading ? (
                <Text className="text-gmh-dark font-bold text-base">
                  Signing in...
                </Text>
              ) : (
                <>
                  <Text className="text-gmh-dark font-bold text-base mr-2">
                    Sign In
                  </Text>
                  <ArrowRight size={18} color="#0A0A0B" />
                </>
              )}
            </TouchableOpacity>
          </View>
          {/* Sign Up Link */}

          {/* Bottom Spacer */}
          <View className="h-8" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
