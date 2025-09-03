import React, { useCallback, useState } from "react";
import { Image, View, TouchableOpacity } from "react-native";
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

// Zod schema for register validation
const registerSchema = z.object({
  firstname: z
    .string()
    .min(1, "กรุณากรอกชื่อ")
    .min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  lastname: z
    .string()
    .min(1, "กรุณากรอกนามสกุล")
    .min(2, "นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร"),
  email: z
    .string()
    .min(1, "กรุณากรอกอีเมล")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "รูปแบบอีเมลไม่ถูกต้อง"),
  password: z
    .string()
    .min(1, "กรุณากรอกรหัสผ่าน")
    .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  confirmPassword: z
    .string()
    .min(1, "กรุณายืนยันรหัสผ่าน"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

export default function RegisterScreen() {
  const { register, isLoading } = useAuth();
  const { showToast } = useToast();
  const { fontFamily: astrologyFont } = useSpecialFont('astrology');
  const { palette } = useTheme();
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    firstname?: string;
    lastname?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const onSubmit = useCallback(async () => {
    // Clear previous errors
    setErrors({});

    // Zod validation
    try {
      const validatedData = registerSchema.parse({
        firstname,
        lastname,
        email,
        password,
        confirmPassword,
      });
      
      setIsSubmitting(true);
      try {
        const result = await register(
          validatedData.firstname,
          validatedData.lastname,
          validatedData.email,
          validatedData.password
        );
        
        if (result.success) {
          showToast("success", "สำเร็จ!", "สมัครสมาชิกสำเร็จ");
          router.replace("/user/home");
        } else {
          showToast("error", "สมัครสมาชิกไม่สำเร็จ", result.message || "กรุณาลองใหม่อีกครั้ง");
        }
      } catch (error) {
        showToast("error", "ข้อผิดพลาด", "เกิดข้อผิดพลาดในการสมัครสมาชิก");
        console.error("Register error:", error);
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: typeof errors = {};
        error.issues.forEach((err) => {
          const field = err.path[0] as keyof typeof errors;
          if (field) {
            fieldErrors[field] = err.message;
          }
        });
        setErrors(fieldErrors);
        
        // Show first error in toast
        const firstError = error.issues[0];
        showToast("error", "ข้อมูลไม่ถูกต้อง", firstError.message);
      }
    }
  }, [firstname, lastname, email, password, confirmPassword, register, showToast]);

  const handleGoogleRegister = useCallback(() => {
    // TODO: Implement Google register logic
    console.log("Google register");
  }, []);

  return (
    <Container safeArea backgroundColor="#000" scroll={true} padding={0}>
      <View style={tw`px-6 pt-10 pb-10`}>
        {/* Logo Section */}
        <View style={tw`items-center mb-8`}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={{ width: 250, height: 100, resizeMode: 'contain', marginBottom: 8 }}
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

        <Text
          size="2xl"
          weight="semibold"
          color={String(tw.color('white'))}
          style={tw`text-center mb-6`}
        >
          สมัครสมาชิก
        </Text>

        {/* Form Section */}
        <View style={tw`mb-6`}>
          {/* First Name */}
          <View style={tw`mb-4`}>
            <TextInput
              placeholder="ชื่อ"
              value={firstname}
              onChangeText={setFirstname}
              autoCapitalize="words"
              leftIcon={<Ionicons name="person" size={20} color={String(tw.color('gray-400'))} style={tw`mr-2`} />}
              containerStyle={tw`rounded-full`}
              fieldStyle={{ color: String(tw.color('white')) }}
              placeholderColor={String(tw.color('gray-400'))}
              backgroundColor={String(tw.color('stone-600/50'))}
              borderColor="transparent"
            />
          </View>

          {/* Last Name */}
          <View style={tw`mb-4`}>
            <TextInput
              placeholder="นามสกุล"
              value={lastname}
              onChangeText={setLastname}
              autoCapitalize="words"
              leftIcon={<Ionicons name="person" size={20} color={String(tw.color('gray-400'))} style={tw`mr-2`} />}
              containerStyle={tw`rounded-full`}
              fieldStyle={{ color: String(tw.color('white')) }}
              placeholderColor={String(tw.color('gray-400'))}
              backgroundColor={String(tw.color('stone-600/50'))}
              borderColor="transparent"
            />
          </View>

          {/* Email */}
          <View style={tw`mb-4`}>
            <TextInput
              placeholder="อีเมล"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon={<Ionicons name="mail" size={20} color={String(tw.color('gray-400'))} style={tw`mr-2`} />}
              containerStyle={tw`rounded-full`}
              fieldStyle={{ color: String(tw.color('white')) }}
              placeholderColor={String(tw.color('gray-400'))}
              backgroundColor={String(tw.color('stone-600/50'))}
              borderColor="transparent"
            />
          </View>

          {/* Password */}
          <View style={tw`mb-4`}>
            <TextInput
              placeholder="รหัสผ่าน"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              leftIcon={<Ionicons name="lock-closed" size={20} color={String(tw.color('gray-400'))} style={tw`mr-2`} />}
              containerStyle={tw`rounded-full`}
              fieldStyle={{ color: String(tw.color('white')) }}
              placeholderColor={String(tw.color('gray-400'))}
              backgroundColor={String(tw.color('stone-600/50'))}
              borderColor="transparent"
            />
          </View>

          {/* Confirm Password */}
          <View style={tw`mb-6`}>
            <TextInput
              placeholder="ยืนยันรหัสผ่าน"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              leftIcon={<Ionicons name="lock-closed" size={20} color={String(tw.color('gray-400'))} style={tw`mr-2`} />}
              containerStyle={tw`rounded-full`}
              fieldStyle={{ color: String(tw.color('white')) }}
              placeholderColor={String(tw.color('gray-400'))}
              backgroundColor={String(tw.color('stone-600/50'))}
              borderColor="transparent"
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            onPress={onSubmit}
            disabled={isLoading}
            style={tw`bg-white rounded-full py-4 mb-6`}
          >
            <Text
              size="base"
              weight="semibold"
              color="#000"
              style={tw`text-center`}
            >
              {isLoading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={tw`flex-row items-center mb-6`}>
          <View style={tw`flex-1 h-px bg-gray-600`} />
          <View style={tw`w-2 h-2 rounded-full bg-gray-600`} />
          <Text size="sm" color={String(tw.color('gray-400'))} style={tw`mx-4`}>
            หรือสมัครด้วย
          </Text>
          <View style={tw`w-2 h-2 rounded-full bg-gray-600`} />
          <View style={tw`flex-1 h-px bg-gray-600`} />
        </View>

        {/* Google Register Button */}
        <TouchableOpacity
          onPress={handleGoogleRegister}
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
          <Text>มีบัญชีอยู่แล้ว?</Text>
          <TouchableOpacity onPress={() => router.replace("/login")} style={tw`flex-row justify-center`}>
            <Text color={palette.primary}>เข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Container>
  );
}


