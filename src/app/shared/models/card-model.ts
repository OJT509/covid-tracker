export interface Card {
    cardDetails: CardDetails[]
}

export interface CardDetails {
    icon: string,
    title: string,
    description: string,
    link: string | null;
}