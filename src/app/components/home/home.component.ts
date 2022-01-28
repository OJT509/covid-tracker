import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { CovidDataService } from 'src/app/services/covid-data-service';
import { CountryModel } from 'src/app/shared/models/country-model';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit {
  public tableData: any;
  public originalWorldData: any;
  public searchData: CountryModel[];
  public originalSearchData: CountryModel[];

  worldTotalSubscription: Subscription;
  countrySubscription: Subscription;
  countryCodeSubscription: Subscription;
  lastUpdate: string;
  worldMap: L.Map;
  defaultLatitude: number = 48.8566;
  defaultLongitude: number = 2.3522;
  defaultZoom: number = 3;
  currentLocation: string;
  displayedTableColumns: string[] = ['confirmed', 'critical', 'deaths', 'recovered'];
  searchControl = new FormControl();

  constructor(private dataService: CovidDataService, public dialog: MatDialog) { }

  async ngOnInit(): Promise<void> {
    this.worldTotalSubscription = this.dataService.getWorldTotal().subscribe(data => {
      this.tableData = this.originalWorldData = data;
      this.lastUpdate = this.getDate(this.tableData[0].lastUpdate);
      this.setTimeout(this.worldTotalSubscription, 6000);
    }, _ => {
      this.showErrorMessage("World data requests are currently limited, please try again later");
    });

    //Can't forkjoin request as limited by API plan, so wait here for 2s until can re-request.
    await new Promise(f => setTimeout(f, 1700));

    this.countrySubscription = this.dataService.getAllCountries().subscribe(data => {
      data.forEach((location, index) => {
        if (!(location.latitude || location.longitude || location.alpha2code)) {
          data.splice(index, 1);
        }
      });

      this.searchData = this.originalSearchData = data;
      this.setMapMarkers(this.searchData);
      this.setTimeout(this.countrySubscription, 6000);
    }, _ => {
      this.showErrorMessage("Search data requests are currently limited, please try again later");
    });
  }

  showErrorMessage(message: string): void {
    this.dialog.open(ErrorDialogComponent, { width: '500px', height: '300px', data: message });
  }

  applyFilter(event: any): void {
    const keyPressed = event.target.value.toLowerCase();
    this.searchData = this.searchData.filter((option: { name: string; }) => option.name.toLowerCase().includes(keyPressed));
  }

  setTimeout(subscription: Subscription, time: number): void {
    setTimeout(() => {
      subscription.unsubscribe();
    }, time);
  }

  countryPicked(alpha2code: string): void {
    const countryCode = alpha2code.toLowerCase();
    this.countryCodeSubscription = this.dataService.getCountryByCode(countryCode).subscribe(data => {
      this.tableData = data;
      this.currentLocation = this.tableData[0].country;
      let latitude = this.tableData[0].latitude;
      let longitude = this.tableData[0].longitude;

      this.lastUpdate = this.getDate(this.tableData[0].lastUpdate);
      this.worldMap.remove();
      this.drawMap(latitude, longitude, 6);
      this.drawMarkers(latitude, longitude, this.currentLocation, true);
      this.drawHeat(latitude, longitude, this.tableData[0].confirmed, 70000);

      this.setTimeout(this.countryCodeSubscription, 10000);
    }, _ => {
      this.showErrorMessage("Country data requests are currently limited, please try again later");
    });
  }

  drawMap(latitude: number, longitude: number, zoom: number): void {
    this.worldMap = L.map('map').setView([latitude, longitude], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.worldMap);
  }

  drawMarkers(latitude: number, longitude: number, name: string, openPopup?: boolean): void {
    let marker = L.marker([latitude, longitude], {
      icon: L.icon({
        iconSize: [25, 41],
        iconAnchor: [13, 41],
        iconUrl: 'assets/marker-icon.png',
        shadowUrl: 'assets/marker-shadow.png',
      })
    }).addTo(this.worldMap);
    openPopup ? marker.bindPopup(`<strong>${name}</strong>`).openPopup() : marker.bindPopup(`<strong>${name}</strong>`);
  }

  drawHeat(latitude: number, longitude: number, confirmed: number, focusRadius: number): void {
    let color;
    let fillColor;

    if (confirmed < 100000) {
      color = "#44ff00";
      fillColor = "green";
    }
    else if (confirmed > 100000 && confirmed < 1000000) {
      color = "orange";
      fillColor = "#ffb700";
    }
    else {
      color = "red";
      fillColor = "#f03";
    }

    L.circle([latitude, longitude], {
      color: color,
      fillColor: fillColor,
      fillOpacity: 0.5,
      radius: focusRadius
    }).addTo(this.worldMap);
  }

  setMapMarkers(data: CountryModel[]): void {
    this.drawMap(this.defaultLatitude, this.defaultLongitude, this.defaultZoom);

    data.forEach(element => {
      this.drawMarkers(element.latitude, element.longitude, element.name);
    });
  }

  getDate(date: Date): string {
    if (date) {
      let lastUpdate = new Date(date).toUTCString();
      return lastUpdate = lastUpdate.split(' ').slice(1, 5).join(' ');
    }
    return "not specified";
  }

  displayFn(country: any): any {
    if (country) {
      return country.name;
    }
    return;
  }

  resetSearch() {
    this.searchControl.reset();
    this.tableData = this.originalWorldData;
    this.searchData = this.originalSearchData;
    this.worldMap.remove();
    this.setMapMarkers(this.searchData);
  }

  ngOnDestroy(): void {
    this.worldTotalSubscription.unsubscribe();
    this.countrySubscription.unsubscribe();
    this.countryCodeSubscription.unsubscribe();
  }
}