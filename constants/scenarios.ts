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
}

export const SCENARIOS: Scenario[] = [
    {
        id: '1',
        title: 'Taxi Ride',
        aiRole: 'Taxi Driver',
        level: 'A2',
        levelLabel: 'A2',
        estimatedMinutes: 7,
        isPremium: false,
        summary: 'Bir taksiye biniyorsun, sürücüyle güzergah ve şehir hakkında sohbet ediyorsun.',
        tasks: [
            'Gideceğin yeri söyle',
            'Sürücüyle small talk yap',
            'Şehir hakkında bir soru sor',
        ],
        systemPrompt:
            'You are a friendly taxi driver picking up a passenger. Ask where they are going, make small talk about the city, and encourage them to practice speaking naturally. Keep your English at an A2 level.',
    },
    {
        id: '2',
        title: 'Coffee Shop',
        aiRole: 'Barista',
        level: 'A1',
        levelLabel: 'A1-A2',
        estimatedMinutes: 5,
        isPremium: false,
        summary: 'Bir kafede sipariş veriyorsun, değişiklik istiyorsun ve ödeme yapıyorsun.',
        tasks: [
            'Sipariş ver',
            'Siparişinde değişiklik iste',
            'Ödeme hakkında soru sor',
        ],
        systemPrompt:
            'You are a barista at a coffee shop. Take the customer\'s order, offer suggestions, and handle payment questions. Keep your English simple, A1-A2 level.',
    },
    {
        id: '3',
        title: 'Talk to Professor',
        aiRole: 'Professor',
        level: 'B1',
        levelLabel: 'B1',
        estimatedMinutes: 8,
        isPremium: true,
        summary: 'Bir dersten sonra hocanla konuşuyorsun, anlamadığın bir konuyu soruyorsun.',
        tasks: [
            'Derste bir soru sor',
            'Bir konu hakkında açıklama iste',
            'Kaçırdığın bir konuyu anlat',
        ],
        systemPrompt:
            'You are a university professor after class. Answer the student\'s questions patiently, explain concepts clearly, and ask follow-up questions to check understanding. B1 level English.',
    },
    {
        id: '4',
        title: 'Football With Friends',
        aiRole: 'Friend / Teammate',
        level: 'B1',
        levelLabel: 'B1',
        estimatedMinutes: 6,
        isPremium: true,
        summary: 'Arkadaşınla maç, takım ve oyuncular hakkında sohbet ediyorsun.',
        tasks: [
            'Takımından bahset',
            'Son bir maçı yorumla',
            'Bir tahmin yap',
        ],
        systemPrompt:
            'You are a friend chatting casually about football. Talk about teams, matches, and players, and ask the user for their opinions and predictions. B1 level English, casual tone.',
    },
    {
        id: '5',
        title: 'Airport Check-in',
        aiRole: 'Airline Staff',
        level: 'A2',
        levelLabel: 'A2',
        estimatedMinutes: 6,
        isPremium: false,
        summary: 'Havaalanında check-in yaptırıyorsun, bagaj ve koltuk tercihini belirtiyorsun.',
        tasks: [
            'Check-in yaptır',
            'Bagaj hakkında konuş',
            'Koltuk tercihini belirt',
        ],
        systemPrompt:
            'You are airline check-in staff at an airport counter. Guide the passenger through check-in, ask about baggage, and offer seat preferences. A2 level English.',
    },
    {
        id: '6',
        title: 'Job Interview',
        aiRole: 'Interviewer',
        level: 'B2',
        levelLabel: 'B1-B2',
        estimatedMinutes: 10,
        isPremium: true,
        summary: 'Bir iş görüşmesindesin, kendini tanıtıyor ve deneyimlerinden bahsediyorsun.',
        tasks: [
            'Kendini tanıt',
            'Deneyimlerinden bahset',
            'Güçlü yönlerini anlat',
        ],
        systemPrompt:
            'You are a job interviewer. Ask the candidate to introduce themselves, ask about their experience and strengths, and follow up naturally like a real interview. B1-B2 level English.',
    },
];

export function getScenarioById(id: string): Scenario | undefined {
    return SCENARIOS.find((s) => s.id === id);
}