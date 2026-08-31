export type Level = 'A1' | 'A2' | 'B1' | 'B2';

export interface Scenario {
    id: string;
    title: string;
    aiRole: string;
    level: Level;
    levelLabel: string;
    estimatedMinutes: number;
    isPremium: boolean;
    summary: string;
    tasks: string[];
    systemPrompt: string;

    // Kisa cumlelerin baglamsiz yanlis duyulmasini azaltmaya yardimci olur.
    transcriptionKeywords?: string[];
}

const LANGUAGE_RULE =
    'IMPORTANT: Always respond in English only, no matter what language the user speaks in. ' +
    'If the user speaks Turkish, Spanish, or any other language, gently continue the roleplay in English — never switch languages.';


const BEHAVIOR_RULES =
    'BEHAVIOR RULES: Stay in your role throughout the conversation — never switch into a teaching/grammar-lesson mode. ' +
    'Keep your responses short and natural so the user gets more speaking time than you. ' +
    "Don't ask a question every single turn — if the conversation is flowing, just respond naturally; " +
    "if the conversation stalls or the user goes quiet, ask a natural follow-up to keep it going. " +
    "If the user makes a language mistake, do not interrupt or correct them mid-conversation unless it critically " +
    "blocks understanding — corrections are handled separately after the session ends. " +
    'Adjust your vocabulary and sentence complexity to match the level mentioned above.';

const RAW_SCENARIOS: Scenario[] = [
    {
        id: '1',
        title: 'Taxi Ride',
        aiRole: 'Taxi Driver',
        level: 'A2',
        levelLabel: 'A2',
        estimatedMinutes: 7,
        isPremium: false,
        summary: 'You get into a taxi and chat with the driver about the route and the city.',
        tasks: [
            "Say where you're going",
            'Make small talk with the driver',
            'Ask a question about the city',
        ],
        systemPrompt:
            'You are a friendly taxi driver picking up a passenger. Ask where they are going, make small talk about the city, and encourage them to practice speaking naturally. Keep your English at an A2 level.',
        transcriptionKeywords: [
            'airport',
            'hotel',
            'downtown',
            'turn left',
            'turn right',
            'straight ahead',
            'traffic',
            'how much',
            'meter',
            'credit card',
            'cash',
            'address',
        ],
    },
    {
        id: '2',
        title: 'Coffee Shop',
        aiRole: 'Barista',
        level: 'A1',
        levelLabel: 'A1-A2',
        estimatedMinutes: 5,
        isPremium: false,
        summary: 'You order at a coffee shop, ask for a change to your order, and pay.',
        tasks: [
            'Place an order',
            'Ask to change your order',
            'Ask a question about payment',
        ],
        systemPrompt:
            'You are a barista at a coffee shop. Take the customer\'s order, offer suggestions, and handle payment questions. Keep your English simple, A1-A2 level.',
        transcriptionKeywords: [
            'hot coffee',
            'iced coffee',
            'latte',
            'cappuccino',
            'americano',
            'espresso',
            'oat milk',
            'almond milk',
            'to go',
            'for here',
            'extra shot',
            'receipt',
        ],
    },
    {
        id: '3',
        title: 'Talk to Professor',
        aiRole: 'Professor',
        level: 'B1',
        levelLabel: 'B1',
        estimatedMinutes: 7,
        isPremium: false,
        summary: "You talk to your professor after class and ask about a topic you didn't understand.",
        tasks: [
            'Ask a question about the lecture',
            'Ask for an explanation about a topic',
            'Explain a topic you missed',
        ],
        systemPrompt:
            'You are a university professor after class. Answer the student\'s questions patiently, explain concepts clearly, and ask follow-up questions to check understanding. B1 level English.',
        transcriptionKeywords: [
            'lecture',
            'assignment',
            'exam',
            'office hours',
            'syllabus',
            'extra credit',
            'deadline',
            'essay',
            'grade',
            'topic',
        ],
    },
    {
        id: '4',
        title: 'Football With Friends',
        aiRole: 'Friend / Teammate',
        level: 'B1',
        levelLabel: 'B1',
        estimatedMinutes: 6,
        isPremium: false,
        summary: 'You chat with a friend about a match, teams, and players.',
        tasks: [
            'Talk about your team',
            'Comment on a recent match',
            'Make a prediction',
        ],
        systemPrompt:
            'You are a friend chatting casually about football. Talk about teams, matches, and players, and ask the user for their opinions and predictions. B1 level English, casual tone.',
        transcriptionKeywords: [
            'match',
            'team',
            'player',
            'score',
            'goal',
            'penalty',
            'referee',
            'league',
            'championship',
            'coach',
        ],
    },
    {
        id: '5',
        title: 'Airport Check-in',
        aiRole: 'Airline Staff',
        level: 'A2',
        levelLabel: 'A2',
        estimatedMinutes: 6,
        isPremium: true,
        summary: 'You check in at the airport and specify your baggage and seat preference.',
        tasks: [
            'Check in',
            'Talk about your baggage',
            'State your seat preference',
        ],
        systemPrompt:
            'You are airline check-in staff at an airport counter. Guide the passenger through check-in, ask about baggage, and offer seat preferences. A2 level English.',
        transcriptionKeywords: [
            'passport',
            'boarding pass',
            'gate',
            'baggage',
            'carry-on',
            'window seat',
            'aisle seat',
            'check-in',
            'overweight',
            'connecting flight',
        ],
    },
    {
        id: '6',
        title: 'Job Interview',
        aiRole: 'Interviewer',
        level: 'B2',
        levelLabel: 'B1-B2',
        estimatedMinutes: 5,
        isPremium: true,
        summary: "You're in a job interview, introducing yourself and talking about your experience.",
        tasks: [
            'Introduce yourself',
            'Talk about your experience',
            'Talk about your strengths',
        ],
        systemPrompt:
            'You are a job interviewer. Ask the candidate to introduce themselves, ask about their experience and strengths, and follow up naturally like a real interview. B1-B2 level English.',
        transcriptionKeywords: [
            'experience',
            'strengths',
            'weaknesses',
            'resume',
            'salary',
            'availability',
            'team player',
            'previous job',
            'skills',
            'qualifications',
        ],
    },
];

function buildLearnerGoalsInstruction(tasks: string[]): string {
    return (
        'LEARNER GOALS FOR THIS SESSION (do not read these out loud or treat them as a checklist — ' +
        "weave them naturally into the conversation as it flows, over the course of the session, the way a real " +
        `person would): ${tasks.join('; ')}.`
    );
}

export const SCENARIOS: Scenario[] = RAW_SCENARIOS.map((s) => ({
    ...s,
    systemPrompt: `${s.systemPrompt} ${BEHAVIOR_RULES} ${buildLearnerGoalsInstruction(s.tasks)} ${LANGUAGE_RULE}`,
}));

export function getScenarioById(id: string): Scenario | undefined {
    return SCENARIOS.find((s) => s.id === id);
}