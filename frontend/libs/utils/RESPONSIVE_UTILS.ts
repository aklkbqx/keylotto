// utils/responsive.ts
import { Dimensions, Platform, ScaledSize } from 'react-native';

// Get initial dimensions
let { width, height } = Dimensions.get('window');

// Breakpoints สำหรับ responsive design
const BREAKPOINTS = {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
    wide: 1440
} as const;

// Base dimensions (iPhone 14 Pro)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

// Listen for dimension changes
Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
    width = window.width;
    height = window.height;
});

export default class RESPONSIVE_UTILS {
    // Get current screen info
    static getScreenInfo() {
        return {
            width,
            height,
            isPortrait: height > width,
            isLandscape: width > height,
            aspectRatio: width / height,
            platform: Platform.OS
        };
    }

    // Get current width and height
    static getWidth(): number {
        return width;
    }

    static getHeight(): number {
        return height;
    }

    // Determine device type
    static getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
        if (Platform.OS === 'web') {
            if (width >= BREAKPOINTS.desktop) return 'desktop';
            if (width >= BREAKPOINTS.tablet) return 'tablet';
            return 'mobile';
        }

        if (width >= BREAKPOINTS.tablet) return 'tablet';
        return 'mobile';
    }

    // Check if device is specific type
    static isMobile(): boolean {
        return this.getDeviceType() === 'mobile';
    }

    static isTablet(): boolean {
        return this.getDeviceType() === 'tablet';
    }

    static isDesktop(): boolean {
        return this.getDeviceType() === 'desktop';
    }

    // Scale based on width
    static scale(size: number): number {
        const deviceType = this.getDeviceType();
        
        // ลด scaling ratio สำหรับ desktop เพื่อไม่ให้ขนาดใหญ่เกินไป
        if (deviceType === 'desktop') {
            return size; // ไม่ scale สำหรับ desktop
        }
        
        const scaleRatio = width / BASE_WIDTH;
        return Math.round(size * scaleRatio);
    }

    // Scale based on height  
    static scaleHeight(size: number): number {
        const scaleRatio = height / BASE_HEIGHT;
        return Math.round(size * scaleRatio);
    }

    // Font scaling with limits
    static fontSize(size: number): number {
        const deviceType = this.getDeviceType();
        
        // สำหรับ desktop ใช้ขนาดฟอนต์ตามที่กำหนดไว้โดยไม่ scale
        if (deviceType === 'desktop') {
            return Math.max(12, size);
        }
        
        const scaled = this.scale(size);
        return Math.max(12, Math.min(scaled, size * 1.3));
    }

    // Responsive spacing
    static spacing(size: number): number {
        const deviceType = this.getDeviceType();
        
        // สำหรับ desktop ลด spacing ลงเล็กน้อยเพื่อใช้พื้นที่ได้มากขึ้น
        if (deviceType === 'desktop') {
            return Math.max(4, size * 0.8);
        }
        
        return this.scale(size);
    }

    // Grid system
    static width(percentage: number): number {
        return (width * percentage) / 100;
    }

    static height(percentage: number): number {
        return (height * percentage) / 100;
    }

    // Responsive values
    static responsive<T>(values: {
        mobile: T;
        tablet?: T;
        desktop?: T;
    }): T {
        const deviceType = this.getDeviceType();

        switch (deviceType) {
            case 'desktop':
                return values.desktop ?? values.tablet ?? values.mobile;
            case 'tablet':
                return values.tablet ?? values.mobile;
            default:
                return values.mobile;
        }
    }

    // Responsive numbers
    static responsiveNumber(values: {
        mobile: number;
        tablet?: number;
        desktop?: number;
    }): number {
        return this.responsive(values);
    }

    // Responsive strings (for styles)
    static responsiveString(values: {
        mobile: string;
        tablet?: string;
        desktop?: string;
    }): string {
        return this.responsive(values);
    }

    // Layout helpers for admin
    static getAdminLayout() {
        const deviceType = this.getDeviceType();

        return {
            deviceType,
            showSidebar: deviceType !== 'mobile',
            columns: this.responsive({
                mobile: 1,
                tablet: 2,
                desktop: 3
            }),
            cardWidth: this.responsive({
                mobile: this.width(100) - this.spacing(32),
                tablet: this.width(48),
                desktop: this.width(31)
            }),
            chartHeight: this.responsive({
                mobile: this.height(25),
                tablet: this.height(30),
                desktop: this.height(35)
            }),
            sidebarWidth: this.responsive({
                mobile: 0,
                tablet: 240,
                desktop: 280
            })
        };
    }

    // Grid layout helpers
    static getGridLayout(columns: {
        mobile: number;
        tablet?: number;
        desktop?: number;
    }) {
        const cols = this.responsive(columns);
        const gap = this.spacing(16);
        const padding = this.spacing(24);
        const availableWidth = width - (padding * 2) - (gap * (cols - 1));
        const cardWidth = availableWidth / cols;

        return {
            columns: cols,
            gap,
            padding,
            cardWidth: Math.max(cardWidth, 200) // Minimum card width
        };
    }

    // Responsive padding
    static padding(horizontal: number = 24, vertical: number = 16) {
        return {
            paddingHorizontal: this.spacing(horizontal),
            paddingVertical: this.spacing(vertical)
        };
    }

    // Responsive margin
    static margin(horizontal: number = 0, vertical: number = 0) {
        return {
            marginHorizontal: this.spacing(horizontal),
            marginVertical: this.spacing(vertical)
        };
    }

    // Responsive border radius
    static borderRadius(size: number): number {
        return this.responsive({
            mobile: size,
            tablet: size * 1.2,
            desktop: size * 1.5
        });
    }

    // Responsive shadow
    static shadow(level: 'sm' | 'md' | 'lg' = 'md') {
        const shadows = {
            sm: {
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2
            },
            md: {
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 4
            },
            lg: {
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 8
            }
        };

        return shadows[level];
    }

    // Responsive flex direction
    static flexDirection(): 'row' | 'column' {
        return this.responsive({
            mobile: 'column',
            tablet: 'row',
            desktop: 'row'
        });
    }

    // Responsive justify content
    static justifyContent(): 'flex-start' | 'center' | 'space-between' {
        return this.responsive({
            mobile: 'flex-start',
            tablet: 'space-between',
            desktop: 'space-between'
        });
    }

    // Responsive align items
    static alignItems(): 'flex-start' | 'center' | 'stretch' {
        return this.responsive({
            mobile: 'stretch',
            tablet: 'center',
            desktop: 'center'
        });
    }

    // Responsive text alignment
    static textAlign(): 'left' | 'center' | 'right' {
        return this.responsive({
            mobile: 'left',
            tablet: 'center',
            desktop: 'center'
        });
    }

    // Responsive container width
    static containerWidth(): number {
        return this.responsive({
            mobile: this.width(100),
            tablet: this.width(90),
            desktop: this.width(80)
        });
    }

    // Responsive modal width
    static modalWidth(): number {
        return this.responsive({
            mobile: this.width(95),
            tablet: this.width(70),
            desktop: this.width(50)
        });
    }

    // Responsive image size
    static imageSize(baseSize: number): number {
        return this.responsive({
            mobile: baseSize,
            tablet: baseSize * 1.2,
            desktop: baseSize * 1.5
        });
    }

    // Responsive icon size
    static iconSize(baseSize: number): number {
        return this.responsive({
            mobile: baseSize,
            tablet: baseSize * 1.1,
            desktop: baseSize * 1.2
        });
    }

    // Responsive button size
    static buttonSize(): { height: number; paddingHorizontal: number } {
        return {
            height: this.responsive({
                mobile: 44,
                tablet: 48,
                desktop: 52
            }),
            paddingHorizontal: this.responsive({
                mobile: 16,
                tablet: 20,
                desktop: 24
            })
        };
    }

    // Responsive input height
    static inputHeight(): number {
        return this.responsive({
            mobile: 44,
            tablet: 48,
            desktop: 52
        });
    }

    // Responsive card height
    static cardHeight(): number {
        return this.responsive({
            mobile: 200,
            tablet: 220,
            desktop: 240
        });
    }

    // Responsive list item height
    static listItemHeight(): number {
        return this.responsive({
            mobile: 60,
            tablet: 70,
            desktop: 80
        });
    }

    // Responsive header height
    static headerHeight(): number {
        return this.responsive({
            mobile: 56,
            tablet: 64,
            desktop: 72
        });
    }

    // Responsive tab bar height
    static tabBarHeight(): number {
        return this.responsive({
            mobile: 60,
            tablet: 70,
            desktop: 80
        });
    }

    // Responsive bottom sheet height
    static bottomSheetHeight(): number {
        return this.responsive({
            mobile: this.height(50),
            tablet: this.height(40),
            desktop: this.height(30)
        });
    }

    // Responsive drawer width
    static drawerWidth(): number {
        return this.responsive({
            mobile: this.width(80),
            tablet: 300,
            desktop: 350
        });
    }

    // Responsive search bar height
    static searchBarHeight(): number {
        return this.responsive({
            mobile: 44,
            tablet: 48,
            desktop: 52
        });
    }

    // Responsive filter bar height
    static filterBarHeight(): number {
        return this.responsive({
            mobile: 80,
            tablet: 60,
            desktop: 60
        });
    }

    // Responsive floating action button size
    static fabSize(): number {
        return this.responsive({
            mobile: 56,
            tablet: 64,
            desktop: 72
        });
    }

    // Responsive floating action button position
    static fabPosition(): { bottom: number; right: number } {
        return {
            bottom: this.responsive({
                mobile: 20,
                tablet: 30,
                desktop: 40
            }),
            right: this.responsive({
                mobile: 20,
                tablet: 30,
                desktop: 40
            })
        };
    }
}

export const r = RESPONSIVE_UTILS;