import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CountryModel } from '../shared/models/country-model';
import { WorldTotalModel } from '../shared/models/world-total-model';
import { CountryDataModel } from '../shared/models/country-data-model';

@Injectable({
  providedIn: 'root'
})

export class CovidDataService {

  private endpoint = 'https://covid-19-data.p.rapidapi.com';

  constructor(private http: HttpClient) { }

  getHeaders() {
    return {
      headers: new HttpHeaders({
        'x-rapidapi-host': 'covid-19-data.p.rapidapi.com',
        'x-rapidapi-key': 'YOUR_KEY_HERE'
      })
    };
  }

  getAllCountries(): Observable<CountryModel[]> {
    let url = this.endpoint + '/help/countries';
    return this.http.get<CountryModel[]>(url, this.getHeaders());
  }

  getCountryByCode(countryCode: string): Observable<CountryDataModel[]> {
    let url = this.endpoint + `/country/code?code=${countryCode}`;
    return this.http.get<CountryDataModel[]>(url, this.getHeaders());
  }

  getWorldTotal(): Observable<WorldTotalModel[]> {
    let url = this.endpoint + '/totals';
    return this.http.get<WorldTotalModel[]>(url, this.getHeaders());
  }
}