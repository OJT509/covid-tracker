export interface CountryDataModel {
    country: string;
    code: string;
    confirmed: number;
    recovered: number;
    critical: number;
    deaths: number;
    latitude: number;
    longitude: number;
    lastChange: Date;
    lastUpdate: Date;
}