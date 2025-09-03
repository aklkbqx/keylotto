// frontend/utils/DateUtils.ts

export default class DATE_UTILS {

    // เดือนภาษาไทย
    private static thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    // เดือนภาษาไทยแบบย่อ
    private static thaiMonthsShort = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    // วันในสัปดาห์ภาษาไทย
    private static thaiWeekdays = [
        'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
    ];

    /**
     * แปลงข้อมูลวันที่จากหลายรูปแบบเป็น Date object
     * รองรับรูปแบบ PostgreSQL timestamp: "2025-06-22 17:42:07.825652+07"
     * แก้ไขปัญหา timezone offset ซ้ำซ้อน
     * 
     * @param dateInput - วันที่ที่ต้องการแปลง (string, Date, หรือ number)
     * @returns Date object หรือ null ถ้าแปลงไม่ได้
     */
    public static parseDate(dateInput: string | Date | number): Date | null {
        try {
            if (!dateInput) return null;

            // ถ้าเป็น Date object แล้วให้คืนค่าเลย
            if (dateInput instanceof Date) {
                return isNaN(dateInput.getTime()) ? null : dateInput;
            }

            // ถ้าเป็น timestamp number
            if (typeof dateInput === 'number') {
                const date = new Date(dateInput);
                return isNaN(date.getTime()) ? null : date;
            }

            // ถ้าเป็น string ให้พยายามแปลงในหลายรูปแบบ
            if (typeof dateInput === 'string') {
                const trimmed = dateInput.trim();

                // 1. รูปแบบ PostgreSQL: "2025-06-22 17:42:07.825652+07"
                if (trimmed.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
                    // ตรวจสอบว่ามี timezone offset หรือไม่
                    const hasOffset = trimmed.match(/([+-]\d{2}):?(\d{2})?$/);

                    if (hasOffset) {
                        // ถ้ามี offset ให้แปลงเป็น ISO format แต่ไม่ต้องเปลี่ยน offset
                        let isoString = trimmed.replace(' ', 'T');

                        // ถ้า offset เป็น +07 ให้เปลี่ยนเป็น +07:00
                        if (hasOffset[1] && !hasOffset[2]) {
                            isoString = isoString.replace(/([+-]\d{2})$/, '$1:00');
                        }

                        const date = new Date(isoString);
                        if (!isNaN(date.getTime())) return date;
                    } else {
                        // ถ้าไม่มี offset ให้ถือว่าเป็น local time
                        let isoString = trimmed.replace(' ', 'T');

                        // เพิ่ม timezone offset ของ Asia/Bangkok (+07:00)
                        isoString += '+07:00';

                        const date = new Date(isoString);
                        if (!isNaN(date.getTime())) return date;
                    }
                }

                // 2. รูปแบบ ISO 8601 standard: "2025-06-22T17:42:07.825652Z"
                if (trimmed.includes('T')) {
                    const date = new Date(trimmed);
                    if (!isNaN(date.getTime())) return date;
                }

                // 3. รูปแบบวันที่อย่างเดียว: "2025-06-22"
                if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // ถือว่าเป็นเวลา 00:00:00 ใน timezone ของไทย
                    const date = new Date(trimmed + 'T00:00:00+07:00');
                    if (!isNaN(date.getTime())) return date;
                }

                // 4. รูปแบบไทย: "DD/MM/YYYY"
                if (trimmed.includes('/')) {
                    const parts = trimmed.split('/');
                    if (parts.length === 3) {
                        const [day, month, year] = parts;
                        // สร้าง Date object โดยใช้ local time
                        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                        if (!isNaN(date.getTime())) return date;
                    }
                }

                // 5. ลองแปลงโดยตรงเป็นครั้งสุดท้าย
                const date = new Date(trimmed);
                if (!isNaN(date.getTime())) return date;
            }

            return null;
        } catch (error) {
            console.error('Error parsing date:', error, 'Input:', dateInput);
            return null;
        }
    }

    /**
     * รับ Date components ใน timezone ของไทยโดยไม่สร้าง Date object ใหม่
     */
    private static getThaiDateComponents(date: Date): {
        year: number;
        month: number;
        day: number;
        hours: number;
        minutes: number;
        seconds: number;
        weekday: number;
    } {
        // ใช้ Intl.DateTimeFormat เพื่อได้ค่าที่ถูกต้องใน timezone ของไทย
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            weekday: 'short',
            hour12: false
        });

        const parts = formatter.formatToParts(date);
        const getValue = (type: string) => parts.find(part => part.type === type)?.value || '0';

        // แปลง weekday string เป็น number (0-6)
        const weekdayMap: { [key: string]: number } = {
            'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
        };

        return {
            year: parseInt(getValue('year')),
            month: parseInt(getValue('month')) - 1, // JavaScript month เริ่มจาก 0
            day: parseInt(getValue('day')),
            hours: parseInt(getValue('hour')),
            minutes: parseInt(getValue('minute')),
            seconds: parseInt(getValue('second')),
            weekday: weekdayMap[getValue('weekday')] || 0
        };
    }

    /**
     * รับวันที่ปัจจุบันในโซนเวลาไทย
     */
    public static getThaiDate(): Date {
        return new Date();
    }

    /**
     * แสดงเวลาในรูปแบบ "เมื่อสักครู่", "5 นาทีที่แล้ว", "2 ชั่วโมงที่แล้ว", "3 วันที่แล้ว"
     */
    public static formatTimeAgo(dateInput: string | Date | number): string {
        if (!dateInput) return 'ไม่ระบุเวลา';

        try {
            const date = this.parseDate(dateInput);
            if (!date) return 'ไม่ระบุเวลา';

            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffMonths = Math.floor(diffDays / 30);
            const diffYears = Math.floor(diffDays / 365);

            if (diffMinutes < 1) {
                return 'เมื่อสักครู่';
            } else if (diffMinutes < 60) {
                return `${diffMinutes} นาทีที่แล้ว`;
            } else if (diffHours < 24) {
                return `${diffHours} ชั่วโมงที่แล้ว`;
            } else if (diffDays < 30) {
                return `${diffDays} วันที่แล้ว`;
            } else if (diffMonths < 12) {
                return `${diffMonths} เดือนที่แล้ว`;
            } else {
                return `${diffYears} ปีที่แล้ว`;
            }
        } catch (error) {
            console.error('Error formatting time ago:', error);
            return 'ไม่ระบุเวลา';
        }
    }

    /**
     * แสดงเวลาอย่างเดียว (ไม่มีวันที่) ในรูปแบบ HH:mm น. หรือ HH:mm:ss น.
     */
    public static formatTimeOnly(dateInput: string | Date | number, includeSeconds = false): string {
        try {
            const date = this.parseDate(dateInput);
            if (!date) return 'ไม่ระบุเวลา';

            const { hours, minutes, seconds } = this.getThaiDateComponents(date);

            const hoursStr = hours.toString().padStart(2, '0');
            const minutesStr = minutes.toString().padStart(2, '0');
            const secondsStr = seconds.toString().padStart(2, '0');

            if (includeSeconds) {
                return `${hoursStr}:${minutesStr}:${secondsStr} น.`;
            } else {
                return `${hoursStr}:${minutesStr} น.`;
            }
        } catch (error) {
            console.error('Error formatting time only:', error);
            return 'ไม่ระบุเวลา';
        }
    }

    /**
     * แสดงวันที่ในรูปแบบไทยที่อ่านง่าย
     */
    public static formatDateThai(dateInput: string | Date | number, shortMonth = false): string {
        try {
            const date = this.parseDate(dateInput);
            if (!date) return 'ไม่ระบุวันที่';

            const { year, month, day } = this.getThaiDateComponents(date);

            const monthName = shortMonth
                ? this.thaiMonthsShort[month]
                : this.thaiMonths[month];
            const buddhistYear = year + 543; // แปลงเป็นพุทธศักราช

            return `${day} ${monthName} ${buddhistYear}`;
        } catch (error) {
            console.error('Error formatting Thai date:', error);
            return 'ไม่ระบุวันที่';
        }
    }

    /**
     * แสดงวันที่และเวลาในรูปแบบไทย
     */
    public static formatDateTimeThai(
        dateInput: string | Date | number,
        shortMonth = false,
        includeSeconds = false
    ): string {
        try {
            const date = this.parseDate(dateInput);
            if (!date) return 'ไม่ระบุวันที่';

            const datePart = this.formatDateThai(date, shortMonth);
            const timePart = this.formatTimeOnly(date, includeSeconds);

            return `${datePart} ${timePart}`;
        } catch (error) {
            console.error('Error formatting Thai date time:', error);
            return 'ไม่ระบุวันที่';
        }
    }

    /**
     * แสดงวันที่และเวลาแบบเต็มพร้อมวันในสัปดาห์
     */
    public static formatFullThaiDateTime(dateInput: string | Date | number): string {
        try {
            const date = this.parseDate(dateInput);
            if (!date) return 'ไม่ระบุวันที่';

            const { weekday } = this.getThaiDateComponents(date);
            const weekdayName = this.thaiWeekdays[weekday];
            const datePart = this.formatDateThai(date);
            const timePart = this.formatTimeOnly(date);

            return `${weekdayName}ที่ ${datePart} เวลา ${timePart}`;
        } catch (error) {
            console.error('Error formatting full Thai date time:', error);
            return 'ไม่ระบุวันที่';
        }
    }

    /**
     * แสดงวันที่ในรูปแบบ dd/mm/พ.ศ.
     */
    public static formatDate(dateInput: string | Date | number): string {
        try {
            const date = this.parseDate(dateInput);
            if (!date) return 'ไม่ระบุวันที่';

            const { year, month, day } = this.getThaiDateComponents(date);

            const dayStr = day.toString().padStart(2, '0');
            const monthStr = (month + 1).toString().padStart(2, '0'); // เพิ่ม 1 เพราะ month เริ่มจาก 0
            const buddhistYear = year + 543;

            return `${dayStr}/${monthStr}/${buddhistYear}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'ไม่ระบุวันที่';
        }
    }

    /**
     * แสดงระยะเวลาในรูปแบบ ชั่วโมง นาที
     */
    public static formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        let result = '';

        if (hours > 0) {
            result += `${hours} ชั่วโมง `;
        }

        if (minutes > 0 || (hours > 0 && remainingSeconds > 0)) {
            result += `${minutes} นาที `;
        }

        if (remainingSeconds > 0 && hours === 0) {
            result += `${remainingSeconds} วินาที`;
        }

        return result.trim();
    }

    /**
     * แปลงวันที่เป็นรูปแบบ ISO string
     */
    public static toISOString(dateInput: string | Date | number): string | null {
        try {
            const date = this.parseDate(dateInput);
            if (!date) return null;
            return date.toISOString();
        } catch (error) {
            console.error('Error converting to ISO string:', error);
            return null;
        }
    }

    /**
     * ตรวจสอบว่าวันที่ที่ให้มาอยู่ในอดีตหรือไม่
     */
    public static isPast(dateInput: string | Date | number): boolean {
        try {
            const date = this.parseDate(dateInput);
            if (!date) return false;
            return date.getTime() < new Date().getTime();
        } catch (error) {
            console.error('Error checking if date is in past:', error);
            return false;
        }
    }

    /**
     * ตรวจสอบว่าวันที่ที่ให้มาอยู่ในอนาคตหรือไม่
     */
    public static isFuture(dateInput: string | Date | number): boolean {
        try {
            const date = this.parseDate(dateInput);
            if (!date) return false;
            return date.getTime() > new Date().getTime();
        } catch (error) {
            console.error('Error checking if date is in future:', error);
            return false;
        }
    }

    /**
     * ตรวจสอบว่าวันที่สองวันเป็นวันเดียวกันหรือไม่
     */
    public static isSameDay(dateInput1: string | Date | number, dateInput2: string | Date | number): boolean {
        try {
            const date1 = this.parseDate(dateInput1);
            const date2 = this.parseDate(dateInput2);

            if (!date1 || !date2) return false;

            return date1.getFullYear() === date2.getFullYear() &&
                date1.getMonth() === date2.getMonth() &&
                date1.getDate() === date2.getDate();
        } catch (error) {
            console.error('Error comparing dates:', error);
            return false;
        }
    }

    /**
     * รับวันที่และเวลาปัจจุบันในรูปแบบไทยสำหรับแสดงใน UI
     */
    public static formatCurrentThaiDateTime(): string {
        return this.formatFullThaiDateTime(new Date());
    }

    /**
     * ฟังก์ชันเดิมที่ใช้ในโค้ด เพื่อความเข้ากันได้กับโค้ดเดิม
     */
    public static formatTime(dateInput: string | Date | number): string {
        return this.formatTimeAgo(dateInput);
    }

    /**
     * แปลง PostgreSQL timestamp เป็น Date object
     */
    public static parsePgTimestamp(pgTimestamp: string | Date): Date | null {
        return this.parseDate(pgTimestamp);
    }

    /**
     * เพิ่มจำนวนวันให้กับ Date object
     */
    public static addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    /**
     * คืนค่า string 'YYYY-MM-DD' ของวันที่ในโซนเวลาไทย (หรือของ date ที่ส่งเข้า)
     */
    public static getThaiDateString(date?: Date): string {
        const d = date ? date : new Date();
        const { year, month, day } = this.getThaiDateComponents(d);

        const monthStr = (month + 1).toString().padStart(2, '0'); // เพิ่ม 1 เพราะ month เริ่มจาก 0
        const dayStr = day.toString().padStart(2, '0');

        return `${year}-${monthStr}-${dayStr}`;
    }

    // เพิ่มฟังก์ชันสำหรับ Timeline component
    public static formatDateDisplay(dateInput: string | Date | number): string {
        const date = this.parseDate(dateInput);
        if (!date) return 'ไม่ระบุวันที่';

        const components = this.getThaiDateComponents(date);
        return `${components.day} ${this.thaiMonths[components.month]} ${components.year + 543}`;
    }

    public static formatDateRange(startDate: string | Date | number, endDate: string | Date | number): string {
        const start = this.parseDate(startDate);
        const end = this.parseDate(endDate);

        if (!start || !end) return 'ไม่ระบุช่วงวันที่';

        const startComponents = this.getThaiDateComponents(start);
        const endComponents = this.getThaiDateComponents(end);

        // ถ้าเป็นเดือนและปีเดียวกัน
        if (startComponents.month === endComponents.month && startComponents.year === endComponents.year) {
            return `${startComponents.day}-${endComponents.day} ${this.thaiMonths[startComponents.month]} ${startComponents.year + 543}`;
        }

        // ถ้าเป็นปีเดียวกัน
        if (startComponents.year === endComponents.year) {
            return `${startComponents.day} ${this.thaiMonthsShort[startComponents.month]} - ${endComponents.day} ${this.thaiMonthsShort[endComponents.month]} ${startComponents.year + 543}`;
        }

        // ถ้าไม่ใช่ปีเดียวกัน
        return `${startComponents.day} ${this.thaiMonthsShort[startComponents.month]} ${startComponents.year + 543} - ${endComponents.day} ${this.thaiMonthsShort[endComponents.month]} ${endComponents.year + 543}`;
    }

    /**
     * Helper function สำหรับ debug - แสดงข้อมูล timezone
     */
    public static debugTimezone(dateInput: string | Date | number): void {
        const date = this.parseDate(dateInput);
        if (!date) {
            console.log('Invalid date input');
            return;
        }

        const components = this.getThaiDateComponents(date);

        console.log('=== Date Debug Info ===');
        console.log('Original input:', dateInput);
        console.log('Parsed Date object:', date);
        console.log('UTC string:', date.toUTCString());
        console.log('ISO string:', date.toISOString());
        console.log('Local string:', date.toString());
        console.log('Thai components:', components);
        console.log('formatDateTimeThai:', this.formatDateTimeThai(dateInput));
        console.log('formatTimeOnly:', this.formatTimeOnly(dateInput));
        console.log('=======================');
    }

    /**
     * คำนวณหมายเลขสัปดาห์ของปี
     */
    public static getWeekNumber(date: Date): number {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    /**
     * Format last seen time for online status
     */
    public static formatLastSeenTime = (statusLastUpdate: string | undefined): string => {
        if (!statusLastUpdate) return 'ไม่ทราบเวลา';

        try {
            const lastSeenDate = this.parseDate(statusLastUpdate);
            if (!lastSeenDate) return 'ไม่ทราบเวลา';

            const now = new Date();
            const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));

            if (diffInMinutes < 1) return 'เมื่อสักครู่';
            if (diffInMinutes < 60) return `${diffInMinutes} นาทีที่แล้ว`;

            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;

            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays < 7) return `${diffInDays} วันที่แล้ว`;

            // ใช้ toLocaleDateString สำหรับวันที่เก่า
            return lastSeenDate.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error parsing last seen date:', statusLastUpdate, error);
            return 'ไม่ทราบเวลา';
        }
    };

    /**
 * แปลงปีจากคริสต์ศักราชเป็นพุทธศักราช
 */
    public static gregorianToBuddhist(gregorianYear: number): number {
        return gregorianYear + 543;
    }

    /**
     * แปลงปีจากพุทธศักราชเป็นคริสต์ศักราช
     */
    public static buddhistToGregorian(buddhistYear: number): number {
        return buddhistYear - 543;
    }

    /**
    * แปลง Date เป็น YYYY-MM-DD format (สำหรับ API calls)
    */
    public static toISODateString(date: Date): string {
        const { year, month, day } = this.getThaiDateComponents(date);
        const monthStr = (month + 1).toString().padStart(2, '0');
        const dayStr = day.toString().padStart(2, '0');
        return `${year}-${monthStr}-${dayStr}`;
    }

    /**
     * ได้ปีพุทธศักราชปัจจุบัน
     */
    public static getCurrentBuddhistYear(): number {
        const currentYear = new Date().getFullYear();
        return this.gregorianToBuddhist(currentYear);
    }
    /**
     * หาวันแรกและวันสุดท้ายของเดือน
     */
    public static getMonthRange(date: Date): { start: Date; end: Date } {
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    /**
     * Check if date is today
     */
    public static isToday(dateInput: string | Date | number): boolean {
        const date = this.parseDate(dateInput);
        if (!date) return false;
        
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    /**
     * Check if date is yesterday
     */
    public static isYesterday(dateInput: string | Date | number): boolean {
        const date = this.parseDate(dateInput);
        if (!date) return false;
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date.toDateString() === yesterday.toDateString();
    }

    /**
     * Format date with custom format string
     */
    public static format(dateInput: string | Date | number, formatStr: string): string {
        const date = this.parseDate(dateInput);
        if (!date) return '';

        const pad = (n: number) => n.toString().padStart(2, '0');
        
        const replacements: Record<string, string> = {
            'YYYY': date.getFullYear().toString(),
            'MM': pad(date.getMonth() + 1),
            'DD': pad(date.getDate()),
            'HH': pad(date.getHours()),
            'mm': pad(date.getMinutes()),
            'ss': pad(date.getSeconds()),
            'MMM': date.toLocaleDateString('en', { month: 'short' }),
        };

        let result = formatStr;
        Object.entries(replacements).forEach(([key, value]) => {
            result = result.replace(new RegExp(key, 'g'), value);
        });

        return result;
    }

    /**
     * Get relative time (e.g., "2 hours ago")
     */
    public static getRelativeTime(dateInput: string | Date | number): string {
        const date = this.parseDate(dateInput);
        if (!date) return '';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'เมื่อสักครู่';
        if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
        if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
        if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
        
        return this.formatDateThai(date);
    }
}
