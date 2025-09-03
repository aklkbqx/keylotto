import React, { useCallback, useState } from "react";
import { Image, View, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { z } from "zod";
import Container from "@/libs/components/Container";
import Text from "@/libs/components/Text";
import TextInput from "@/libs/components/TextInput";
import { useAuth } from "@/libs/providers/AuthProvider";
import { useToast } from "@/libs/providers/ToastProvider";
import useSpecialFont from "@/libs/hooks/useSpecialFont";
import tw from "@/libs/constants/twrnc";
import { useTheme } from "@/libs/providers/ThemeProvider";
import { router } from "expo-router";

// Zod schema for login validation
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "กรุณากรอกอีเมล")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "รูปแบบอีเมลไม่ถูกต้อง"),
  password: z
    .string()
    .min(1, "กรุณากรอกรหัสผ่าน")
    .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const { fontFamily: astrologyFont } = useSpecialFont('astrology');
  const { palette } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const onSubmit = useCallback(async () => {
    // Clear previous errors
    setErrors({});

    // Zod validation
    try {
      const validatedData = loginSchema.parse({ email, password });

      setIsSubmitting(true);
      try {
        const result = await login(validatedData.email, validatedData.password);

        if (result.success) {
          showToast("success", "สำเร็จ!", "เข้าสู่ระบบสำเร็จ");
          if (result.data?.role == "admin") {
            router.replace("/admin/dashboard");
          } else {
            router.replace("/user/home");
          }

        } else {
          showToast("error", "เข้าสู่ระบบไม่สำเร็จ", result.message || "กรุณาลองใหม่อีกครั้ง");
        }
      } catch (error) {
        showToast("error", "ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        console.error("Login error:", error);
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.issues.forEach((err) => {
          if (err.path[0] === 'email') {
            fieldErrors.email = err.message;
          } else if (err.path[0] === 'password') {
            fieldErrors.password = err.message;
          }
        });
        setErrors(fieldErrors);

        // Show first error in toast
        const firstError = error.issues[0];
        showToast("error", "ข้อมูลไม่ถูกต้อง", firstError.message);
      }
    }
  }, [email, password, login, showToast]);

  const handleGuestLogin = useCallback(() => {
    // TODO: Implement guest login logic
    console.log("Guest login");
  }, []);

  const handleGoogleLogin = useCallback(() => {
    // TODO: Implement Google login logic
    console.log("Google login");
  }, []);

  return (
    <Container safeArea backgroundColor="#000" scroll={false} padding={0}>
      <View style={tw`px-6 pt-15`}>
        {/* Logo Section */}
        <View style={tw`items-center mb-12`}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={{ width: 300, height: 120, resizeMode: 'contain', marginBottom: 8 }}
          />
          <Text
            size="lg"
            weight="regular"
            color={String(tw.color('white'))}
            style={[tw`tracking-[4px] text-center`, { fontFamily: astrologyFont }]}
          >
            ASTROLOGY
          </Text>
        </View>

        {/* Form Section */}
        <View style={tw`mb-6`}>
          <View style={tw`mb-4`}>
            <TextInput
              placeholder="อีเมล"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                // Clear error when user starts typing
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: undefined }));
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon={<Ionicons name="mail" size={20} color={String(tw.color('gray-400'))} style={tw`mr-2`} />}
              containerStyle={tw`rounded-full`}
              fieldStyle={{ color: String(tw.color('white')) }}
              placeholderColor={String(tw.color('gray-400'))}
              backgroundColor={String(tw.color('stone-600/50'))}
              borderColor={errors.email ? String(tw.color('red-500')) : "transparent"}
              error={!!errors.email}
              errorMessage={errors.email}
              required
            />
          </View>

          <View style={tw`mb-6`}>
            <TextInput
              placeholder="รหัสผ่าน"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                // Clear error when user starts typing
                if (errors.password) {
                  setErrors(prev => ({ ...prev, password: undefined }));
                }
              }}
              secureTextEntry
              autoComplete="password"
              leftIcon={<Ionicons name="lock-closed" size={20} color={String(tw.color('gray-400'))} style={tw`mr-2`} />}
              containerStyle={tw`rounded-full`}
              fieldStyle={{ color: String(tw.color('white')) }}
              placeholderColor={String(tw.color('gray-400'))}
              backgroundColor={String(tw.color('stone-600/50'))}
              borderColor={errors.password ? String(tw.color('red-500')) : "transparent"}
              error={!!errors.password}
              errorMessage={errors.password}
              required
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={onSubmit}
            disabled={isSubmitting || isLoading}
            style={[
              tw`bg-white rounded-full py-4 mb-6`,
              (isSubmitting || isLoading) && tw`opacity-70`
            ]}
          >
            <Text
              size="base"
              weight="semibold"
              color="#000"
              style={tw`text-center`}
            >
              {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={tw`flex-row items-center mb-6`}>
          <View style={tw`flex-1 h-px bg-gray-600`} />
          <View style={tw`w-2 h-2 rounded-full bg-gray-600`} />
          <Text size="sm" color={String(tw.color('gray-400'))} style={tw`mx-4`}>
            ลงชื่อเข้าใช้
          </Text>
          <View style={tw`w-2 h-2 rounded-full bg-gray-600`} />
          <View style={tw`flex-1 h-px bg-gray-600`} />
        </View>

        {/* Guest Login Button */}
        <TouchableOpacity
          onPress={handleGuestLogin}
          style={tw`bg-transparent border border-gray-600 rounded-full py-3 mb-4`}
        >
          <Text
            size="base"
            weight="regular"
            color={String(tw.color('white'))}
            style={tw`text-center`}
          >
            กดลองใช้งาน
          </Text>
        </TouchableOpacity>

        {/* Google Login Button */}
        <TouchableOpacity
          onPress={handleGoogleLogin}
          style={tw`bg-stone-200 rounded-full py-1 mb-6 flex-row items-center justify-center`}
        >
          <Text
            size="lg"
            weight="bold"
            style={tw`text-center`}
          >
            <Text size={"3xl"} style={{ color: '#4285F4' }}>G</Text>
            <Text size={"3xl"} style={{ color: '#EA4335' }}>o</Text>
            <Text size={"3xl"} style={{ color: '#FBBC05' }}>o</Text>
            <Text size={"3xl"} style={{ color: '#4285F4' }}>g</Text>
            <Text size={"3xl"} style={{ color: '#34A853' }}>l</Text>
            <Text size={"3xl"} style={{ color: '#EA4335' }}>e</Text>
          </Text>
        </TouchableOpacity>

        <View style={tw`flex-row gap-1 justify-center items-center`}>
          <Text>หากยังไม่มีบัญชี</Text>
          <TouchableOpacity onPress={() => router.replace("/register")} style={tw`flex-row justify-center`}>
            <Text color={palette.primary}>สมัครสมาชิก</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Container>
  );
}


