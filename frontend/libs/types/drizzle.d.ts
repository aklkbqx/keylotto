// frontend/libs/types/drizzle.d.ts
// Generated from backend/drizzle/schema.ts

// =================================
// ENUMS
// =================================

export type UserAccountStatusEnum = 'active' | 'suspended' | 'deleted' | 'banned';
export type UserRoleEnum = 'admin' | 'user';

export type SubscriptionProvider = 'apple' | 'google';
export type SubscriptionStatus = 'active' | 'grace' | 'paused' | 'canceled' | 'expired';

export type TimeSlotType = 'major' | 'detailed';
export type LunarPhase = 'waxing' | 'waning';
export type GroomingType = 'hair' | 'nail';

// =================================
// TYPE DEFINITIONS (JSON column shapes)
// =================================

export interface AccountStatusType {
    readonly status: UserAccountStatusEnum;
    readonly reason?: string;
    readonly actionAt?: string;
    readonly lastStatusChange: string;
}

export interface UserSettingsProps {
    notificationSetting: {
        notificationsEnabled: boolean;
        soundEnabled: boolean;
        vibrationEnabled: boolean;
    };
}

// Backward-compat for existing frontend usage
export type NotificationSettings = {
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
}
export interface UserSettingsType {
    notification: NotificationSettings;
}

export interface ReferenceNotificationType {
    id: number;
    tablename: string;
}

export interface LunarInfoProps {
    lunarDate?: string;
    moonPhase?: string;
    thaiMonth?: string;
    isHolyDay?: boolean;
}

export interface AuspiciousTimeWindow {
    startTime: string;
    endTime: string;
    category: 'money' | 'negotiation' | 'travel' | 'meeting' | 'avoid';
    score: number;
    description: string;
}

export interface DailyLuckNumbers {
    mainNumbers: number[];
    carPlate: {
        primary: number;
        secondary: number;
    };
    houseFloor: {
        power: number;
        luck: number;
    };
}

export interface DailyDirections {
    win: string;
    luck: string;
    forbidden: string;
}

export interface TarotMeaningsProps {
    upright?: {
        general?: string;
        love?: string;
        career?: string;
        finance?: string;
    };
    reversed?: {
        general?: string;
        love?: string;
        career?: string;
        finance?: string;
    };
}

export interface CardsDrawnItemProps { cardId: number; reversed: boolean }

export interface JournalAttachmentsProps { images?: string[]; files?: string[] }

export interface TimeSlotMeaning {
    description: string;
    activity?: string;
    caution?: string;
}

export interface SuitableDay {
    rank: number;
    dayId: number;
}

export interface NegotiationAdvice {
    probability: string;
    recommendation: string;
}

// =================================
// TABLE ROW INTERFACES
// =================================

export interface User {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    phoneNumber?: string;
    birthDate?: string;
    birthTime?: string;
    passwordHash?: string;
    profileImage: string;
    role: UserRoleEnum;
    accountStatus: AccountStatusType;
    createdAt?: string;
    updatedAt?: string;
}

export interface DeviceToken {
    id: number;
    userId: number;
    expoPushToken: string;
    deviceInfo?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Backward-compat alias
export type DevicePushToken = DeviceToken;

export interface UserSettings {
    id: number;
    userId: number;
    settings: UserSettingsProps;
    createdAt?: string;
    updatedAt?: string;
}

export interface Notification {
    id: number;
    userId: number;
    reference?: ReferenceNotificationType | number | null;
    title: string;
    message: string;
    iconName: string;
    isRead: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CalendarDay {
    id: number;
    date: string;
    lunarInfo?: LunarInfoProps | null;
    auspiciousWindows?: AuspiciousTimeWindow[] | null;
    dailyNumbers?: DailyLuckNumbers | null;
    dailyDirections?: DailyDirections | null;
    runeStoneId?: number | null;
    fortuneDescription?: string | null;
    zodiacInfo?: string | null;
    lunarPhaseAdvice?: NegotiationAdvice[] | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface TarotCard {
    id: number;
    slug: string;
    cardName: string;
    imageUrl?: string | null;
    arcana?: string | null;
    suit?: string | null;
    number?: number | null;
    meanings?: TarotMeaningsProps | null;
    createdAt?: string;
    updatedAt?: string | null;
}

export interface TarotReading {
    id: number;
    userId: number;
    cardsDrawn: CardsDrawnItemProps[];
    spreadType: string;
    seed?: string | null;
    isPremium: boolean;
    interpretation?: string | null;
    summary?: string | null;
    createdAt?: string;
    updatedAt?: string | null;
}

export interface JournalEntry {
    id: number;
    userId: number;
    title: string;
    content: string;
    mood?: string | null;
    tags?: string[] | null;
    attachments?: JournalAttachmentsProps | null;
    isPrivate: boolean;
    createdAt?: string;
    updatedAt?: string | null;
}

export interface Subscription {
    id: number;
    userId: number;
    provider: SubscriptionProvider;
    productId: string;
    originalTransactionId?: string | null;
    purchaseToken?: string | null;
    status: SubscriptionStatus;
    startedAt?: string | null;
    expiresAt?: string | null;
    graceEndsAt?: string | null;
    canceledAt?: string | null;
    latestReceipt?: string | null;
    createdAt?: string;
    updatedAt?: string | null;
}

export interface WeekDay {
    id: number;
    nameTh: string;
    nameEn: string;
    powerFloor: number;
    luckFloor: number;
}

export interface Direction {
    id: number;
    nameTh: string;
    nameEn: string;
}

export interface DailyDirection {
    id: number;
    dayId: number;
    winDirection: number;
    luckDirection: number;
    forbiddenDirection: number;
}

export interface TimeSlot {
    id: number;
    type: TimeSlotType;
    startTime: string;
    endTime: string;
    slotNumber?: number | null;
    meaning?: TimeSlotMeaning | null;
}

export interface CarPlateNumber {
    id: number;
    dayId: number;
    primaryNumber: number;
    secondaryNumber: number;
}

export interface HouseNumber {
    id: number;
    numberSum: number;
    suitableDays: SuitableDay[];
    description?: string | null;
}

export interface LunarPhaseRow {
    id: number;
    phase: LunarPhase;
    dayNumber: number;
    timeSlot1?: NegotiationAdvice | null;
    timeSlot2?: NegotiationAdvice | null;
    timeSlot3?: NegotiationAdvice | null;
    timeSlot4?: NegotiationAdvice | null;
    timeSlot5?: NegotiationAdvice | null;
}

export interface RuneStone {
    id: number;
    name: string;
    nameTh: string;
    prediction: string;
    category?: string | null;
    sequence: number;
}

export interface ZodiacAnimal {
    id: number;
    animalId: number;
    nameTh: string;
    nameEn: string;
    incompatibleWith?: number[] | null;
    compatibleWith?: number[] | null;
}

export interface BirthTimeCompatibility {
    id: number;
    timeRangeStart: string;
    timeRangeEnd: string;
    compatibleWith?: string[] | null;
    incompatibleWith?: string[] | null;
}

export interface GroomingCalendar {
    id: number;
    type: GroomingType;
    forbiddenDays: number[];
    recommendedDays: number[];
}

export interface IncompatiblePersonTime {
    id: number;
    dayId: number;
    incompatibleTimes: number[];
}
