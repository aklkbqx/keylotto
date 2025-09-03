import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, View, Animated, Easing } from 'react-native';
import { Link, router } from 'expo-router';
import Container from '@/libs/components/Container';
import Text from '@/libs/components/Text';
import Button from '@/libs/components/Button';
import tw from '@/libs/constants/twrnc';
import { useTheme } from '@/libs/providers/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { Asset } from 'expo-asset';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WelcomeScreen = () => {
    const { palette } = useTheme();
    const insets = useSafeAreaInsets();

    // Background images 01-04
    const bgImages = useMemo(() => [
        require('@/assets/images/bg-image/01.png'),
        require('@/assets/images/bg-image/02.png'),
        require('@/assets/images/bg-image/03.png'),
        require('@/assets/images/bg-image/04.png'),
    ], []);

    // Preloaded URIs and simple index for crossfade via expo-image
    const [imageUris, setImageUris] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const mountedRef = useRef(true);
    const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        mountedRef.current = true;
        const loadAssets = async () => {
            try {
                const assets = await Asset.loadAsync(bgImages);
                const uris = assets.map(a => a.localUri ?? a.uri);
                if (mountedRef.current) {
                    setImageUris(uris);
                }
            } catch (e) {
                // noop
            }
        };
        loadAssets();

        return () => {
            mountedRef.current = false;
            if (cycleRef.current) clearInterval(cycleRef.current);
        };
    }, [bgImages]);

    useEffect(() => {
        if (!imageUris.length) return;
        if (cycleRef.current) clearInterval(cycleRef.current);
        cycleRef.current = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % imageUris.length);
        }, 5000);
        return () => {
            if (cycleRef.current) clearInterval(cycleRef.current);
        };
    }, [imageUris]);

    // Subtle random drift (RN Animated)
    const tx = useRef(new Animated.Value(0)).current;
    const ty = useRef(new Animated.Value(0)).current;

    const driftOnce = () => {
        const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
        const targetX = randomRange(-15, 15);
        const targetY = randomRange(-15, 15);
        const duration = Math.round(randomRange(6000, 10000));

        Animated.parallel([
            Animated.timing(tx, { toValue: targetX, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(ty, { toValue: targetY, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]).start(() => {
            if (mountedRef.current) driftOnce();
        });
    };

    useEffect(() => {
        mountedRef.current = true;
        driftOnce();
        return () => {
            mountedRef.current = false;
            tx.stopAnimation();
            ty.stopAnimation();
        };
    }, []);

    // Animated styles
    const driftStyle = {
        transform: [
            { translateX: tx },
            { translateY: ty },
            { scale: 1.08 },
        ],
    } as any;

    return (
        <Container center gap={24} safeArea={false} variant="fullscreen" padding={0}
            style={tw`p-0 m-0`}
            contentContainerStyle={tw`p-0 m-0`}
        >
            <LinearGradient
                colors={[String(tw.color("black/50")), String(tw.color("black"))]}
                style={[tw`absolute z-5`, { left: 0, right: 0, top: -insets.top, bottom: -insets.bottom }]}
            />
            <View style={tw`items-center gap-6 flex-1 relative`}>
                {/* Crossfading background (expo-image handles transition) */}
                {imageUris.length > 0 && (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            tw`absolute z-2`,
                            { left: 0, right: 0, top: -insets.top, bottom: -insets.bottom },
                            driftStyle,
                        ]}
                    >
                        <ExpoImage
                            source={{ uri: imageUris[currentIndex] }}
                            contentFit="cover"
                            transition={1000}
                            recyclingKey={String(currentIndex)}
                            cachePolicy="memory-disk"
                            style={tw`absolute inset-0 w-full h-full`}
                        />
                    </Animated.View>
                )}

                <View style={tw`z-50 px-4`}>
                    <View style={tw`flex-col items-center justify-center flex-1`}>
                        <Image
                            source={require('@/assets/images/logo.png')}
                            resizeMode="contain"
                            style={[{ width: 200, height: 200 }, tw``]}
                        />

                        <View style={tw`items-center gap-2`}>
                            <Text size="lg" color={String(tw.color('gray-300'))} align="center">
                                คู่มือโหราศาสตร์และความหมายแห่งวันของคุณ
                            </Text>
                        </View>
                    </View>

                    <View style={tw`flex-row justify-center w-full flex-1 items-end`}>
                        <View style={tw`gap-4 mt-4 flex-1`}>
                            <Button
                                variant="gradient"
                                rounded
                                onPress={() => router.push('/(auth)/login')}
                            >
                                เข้าสู่ระบบ
                            </Button>
                            <Button
                                variant="outline"
                                rounded
                                onPress={() => router.push('/(auth)/register')}
                            >
                                สมัครสมาชิก
                            </Button>
                        </View>
                    </View>

                    <View style={tw`mt-8 items-center gap-2 pb-20`}>
                        <Text size="sm" color={String(tw.color('gray-400'))}>
                            ดำเนินการต่อหมายถึงคุณยอมรับ
                        </Text>
                        <View style={tw`flex-row gap-2`}>
                            <Link href="https://example.com/terms" asChild>
                                <Text weight="semibold" color={palette.primary}>ข้อตกลงการใช้งาน</Text>
                            </Link>
                            <Text color={String(tw.color('gray-500'))}>•</Text>
                            <Link href="https://example.com/privacy" asChild>
                                <Text weight="semibold" color={palette.primary}>นโยบายความเป็นส่วนตัว</Text>
                            </Link>
                        </View>
                    </View>
                </View>
            </View>
        </Container>
    );
};

export default WelcomeScreen;


