/** MakerLab product catalogue. Add a new entry here and create a matching MDX page at
 *  src/pages/makerlab/projects/[slug]/index.mdx — no other code changes needed. */

export type Technology = 'Arduino' | 'ESP32' | 'Raspberry Pi' | 'IoT' | 'Embedded Systems' | 'Robotics' | 'Automation' | 'AI & Vision';
export type Branch = 'EEE' | 'ECE' | 'CSE' | 'Mechanical' | 'All';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Project {
  slug: string;
  title: string;
  tagline: string;
  technology: Technology;
  branch: Branch[];
  difficulty: Difficulty;
  price: string;
  gumroadUrl: string;
  featured: boolean;
  tags: string[];
  description: string;
  components: string[];
  /** true = page is published and visible in listings */
  published: boolean;
}

export const projects: Project[] = [
  {
    slug: 'esp32-smart-energy-meter',
    title: 'ESP32 Smart Energy Meter',
    tagline: 'Measure, log and visualise real-time power consumption over Wi-Fi',
    technology: 'ESP32',
    branch: ['EEE', 'ECE'],
    difficulty: 'Intermediate',
    price: '₹299',
    gumroadUrl: 'https://ohmetry.gumroad.com/l/esp32-energy-meter',
    featured: true,
    tags: ['ESP32', 'IoT', 'Energy monitoring', 'Final year project', 'Smart meter'],
    description: 'A complete ESP32-based energy monitoring system that measures voltage, current, real power, apparent power, power factor and energy consumption. Data is served over Wi-Fi to a simple web dashboard and can be logged to Google Sheets via IFTTT.',
    components: ['ESP32 DevKit', 'ZMPT101B voltage sensor', 'ACS712 current sensor', '0.96" OLED display', 'AMS1117 3.3 V regulator', 'Resistors and capacitors', 'Breadboard and jumper wires'],
    published: true,
  },
  {
    slug: 'iot-smart-irrigation-system',
    title: 'IoT Smart Irrigation System',
    tagline: 'Automate field irrigation based on soil moisture with remote override',
    technology: 'IoT',
    branch: ['EEE', 'ECE', 'Mechanical'],
    difficulty: 'Beginner',
    price: '₹249',
    gumroadUrl: 'https://ohmetry.gumroad.com/l/iot-irrigation',
    featured: true,
    tags: ['IoT', 'ESP8266', 'Agriculture', 'Automation', 'Final year project'],
    description: 'An ESP8266-based smart irrigation controller that reads soil moisture, temperature and humidity, switches a relay to drive a water pump, and sends alerts via Telegram. A Blynk dashboard provides remote monitoring and manual override from any smartphone.',
    components: ['ESP8266 NodeMCU', 'Capacitive soil moisture sensor', 'DHT22 temperature/humidity sensor', '5 V relay module', 'Mini submersible pump', 'Power supply module', 'Jumper wires and enclosure'],
    published: true,
  },
  {
    slug: 'rfid-attendance-system',
    title: 'RFID Attendance System',
    tagline: 'Contactless student attendance logging with Excel export',
    technology: 'Arduino',
    branch: ['ECE', 'CSE', 'EEE'],
    difficulty: 'Beginner',
    price: '₹199',
    gumroadUrl: 'https://ohmetry.gumroad.com/l/rfid-attendance',
    featured: false,
    tags: ['Arduino', 'RFID', 'Attendance', 'Final year project', 'College project'],
    description: 'An Arduino Uno system using the RC522 RFID reader to log student attendance by card scan. Records are stored on a microSD card in CSV format for direct import into Excel. A 16×2 LCD shows the student name and timestamp on each scan.',
    components: ['Arduino Uno', 'MFRC522 RFID reader', 'RFID cards/fobs (set of 10)', '16×2 I2C LCD', 'MicroSD card module', 'DS3231 RTC module', 'Buzzer', 'Jumper wires'],
    published: true,
  },
  {
    slug: 'raspberry-pi-ai-object-detection',
    title: 'Raspberry Pi AI Object Detection',
    tagline: 'Real-time object detection on the edge using TensorFlow Lite',
    technology: 'AI & Vision',
    branch: ['CSE', 'ECE'],
    difficulty: 'Advanced',
    price: '₹399',
    gumroadUrl: 'https://ohmetry.gumroad.com/l/rpi-object-detection',
    featured: true,
    tags: ['Raspberry Pi', 'AI', 'Computer vision', 'TensorFlow', 'Final year project'],
    description: 'A Raspberry Pi 4 system running TensorFlow Lite to detect and classify objects in real time from a USB camera or Pi Camera. The package covers model selection, Python inference pipeline, bounding-box overlay, frame-rate optimisation and an optional MQTT alert on detection.',
    components: ['Raspberry Pi 4 (2 GB or 4 GB)', 'Pi Camera v2 or USB webcam', '32 GB microSD card (Class 10)', 'Official Pi power supply', 'Heatsink and fan case', '7" HDMI touchscreen (optional)'],
    published: true,
  },
  {
    slug: 'arduino-pid-line-following-robot',
    title: 'Arduino PID Line Following Robot',
    tagline: 'Smooth, high-speed line tracking using a PID controller',
    technology: 'Robotics',
    branch: ['ECE', 'Mechanical', 'EEE'],
    difficulty: 'Intermediate',
    price: '₹299',
    gumroadUrl: 'https://ohmetry.gumroad.com/l/pid-line-robot',
    featured: false,
    tags: ['Arduino', 'Robotics', 'PID', 'Line follower', 'Final year project'],
    description: 'A two-wheeled line-following robot using an Arduino Nano, IR sensor array and L298N motor driver. The PID controller (tunable Kp, Ki, Kd) gives smooth tracking at higher speeds than a simple bang-bang controller. Package includes chassis design guidelines, sensor calibration procedure and tuning guide.',
    components: ['Arduino Nano', '5-channel IR sensor array (TCRT5000)', 'L298N dual motor driver', '2× DC gear motors with wheels', 'Chassis (acrylic or 3D-printed, drawings included)', 'Li-Po 7.4 V battery', 'On/off switch', 'Jumper wires'],
    published: true,
  },
];

export const publishedProjects = projects.filter((p) => p.published);
export const featuredProjects = publishedProjects.filter((p) => p.featured);

export const technologies: Technology[] = ['Arduino', 'ESP32', 'Raspberry Pi', 'IoT', 'Embedded Systems', 'Robotics', 'Automation', 'AI & Vision'];
export const branches: Branch[] = ['EEE', 'ECE', 'CSE', 'Mechanical'];
export const difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];
