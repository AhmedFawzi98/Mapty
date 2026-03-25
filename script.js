"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const cadenceFormRow = inputCadence.closest(".form__row");
const inputElevation = document.querySelector(".form__input--elevation");
const elevationFormRow = inputElevation.closest(".form__row");

class Workout {
    date = new Date();
    id = this.date.getTime().toString().slice(-10);

    constructor(distance, coords, duration) {
        this.distance = distance; //km
        this.coords = coords; //[lat, lng]
        this.duration = duration; //min
    }
}

class RunningWorkout extends Workout {
    constructor(distance, coords, duration, cadence) {
        super(distance, coords, duration);
        this.cadence = cadence;
    }

    get pace() {
        return this.duration / this.distance; // min/km
    }
}

class CyclingWorkout extends Workout {
    constructor(distance, coords, duration, elevationGain) {
        super(distance, coords, duration);
        this.elevationGain = elevationGain;
    }
    get speed() {
        return this.distance / (this.duration / 60); // km/hr
    }
}

class App {
    #workouts = [];
    #map;
    #mapEvent;
    #mapZoom = 13;
    #mapMaxZoom = 19;

    constructor() {
        this.#initalizeMap();
        this.#setupFormEventListeners();
    }

    async #initalizeMap() {
        try {
            const geolocationPosition =
                await this.#getGeoLocationPositionAsync();
            const { latitude, longitude } = geolocationPosition.coords;
            const coords = [latitude, longitude];
            this.#loadMap(coords);
        } catch (error) {
            alert(error.message);
        }
    }

    #getGeoLocationPositionAsync() {
        return new Promise((resolve, reject) => {
            window.navigator.geolocation.getCurrentPosition(
                (geolocationPosition) => resolve(geolocationPosition),
                (error) => reject(error),
            );
        });
    }

    #loadMap(coords) {
        this.#map = L.map("map").setView(coords, this.#mapZoom);
        this.#map.on("click", (mapEv) => {
            this.#mapEvent = mapEv;
            this.#showform();
        });

        L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
            maxZoom: this.#mapMaxZoom,
        }).addTo(this.#map);
    }

    #setupFormEventListeners() {
        form.addEventListener("submit", (submitEvent) => {
            submitEvent.preventDefault();
            this.#addNewWorkout();
        });

        inputType.addEventListener("change", this.#toggleFormFields);
    }

    #showform() {
        form.classList.remove("hidden");
        inputDistance.focus();
    }

    #addNewWorkout() {
        this.#createMarkerWithPopup();
        form.reset();
    }

    #createMarkerWithPopup() {
        const { lat, lng } = this.#mapEvent.latlng;
        const markerCoords = [lat, lng];
        const popUpOptions = {
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: "running-popup",
        };
        const popup = L.popup(popUpOptions);
        const popupContent = "workout";
        const marker = L.marker(markerCoords)
            .addTo(this.#map)
            .bindPopup(popup)
            .setPopupContent(popupContent)
            .openPopup();
    }

    #toggleFormFields() {
        elevationFormRow.classList.toggle("form__row--hidden");
        cadenceFormRow.classList.toggle("form__row--hidden");
    }
}

const app = new App();
