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
    type = "running";
    constructor(distance, coords, duration, cadence) {
        super(distance, coords, duration);
        this.cadence = cadence;
    }

    get pace() {
        return this.duration / this.distance; // min/km
    }
}

class CyclingWorkout extends Workout {
    type = "cycling";
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
            this.#Openform();
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

    #addNewWorkout() {
        const type = inputType.value;
        const distance = Number(inputDistance.value);
        const duration = Number(inputDuration.value);
        const { lat, lng } = this.#mapEvent.latlng;
        const coords = [lat, lng];
        let workout;
        if (type === "running") {
            const cadence = Number(inputCadence.value);
            const isValid = this.#isValidInputData(
                type,
                distance,
                duration,
                cadence,
            );
            if (!isValid) {
                return alert("invalid input.");
            }

            workout = new RunningWorkout(distance, coords, duration, cadence);
        } else if (type === "cycling") {
            const elevationGain = Number(inputElevation.value);
            const isValid = this.#isValidInputData(
                type,
                distance,
                duration,
                elevationGain,
            );

            if (!isValid) {
                return alert("invalid input.");
            }

            workout = new CyclingWorkout(
                distance,
                coords,
                duration,
                elevationGain,
            );
        }

        this.#workouts.push(workout);

        this.#createMarkerWithPopup(workout, type);

        //render workout in the list

        this.#closeForm();
    }

    #isValidInputData(type, ...numericInputs) {
        if (type !== "running" && type !== "cycling") return false;
        return numericInputs.every(
            (numericInput) => Number.isFinite(numericInput) && numericInput > 0,
        );
    }

    #createMarkerWithPopup(workout) {
        const formattedWorkoutDate = new Intl.DateTimeFormat("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(workout.date);

        const popUpOptions = {
            maxWidth: 300,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`,
        };
        const popup = L.popup(popUpOptions);
        const popupContent = `${workout.type} ${workout.distance} km for ${workout.duration} min - on ${formattedWorkoutDate}`;
        const marker = L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(popup)
            .setPopupContent(popupContent)
            .openPopup();
    }

    #Openform() {
        form.classList.remove("hidden");
        inputDistance.focus();
    }

    #closeForm() {
        form.reset();
        form.classList.add("hidden");
    }

    #toggleFormFields() {
        elevationFormRow.classList.toggle("form__row--hidden");
        cadenceFormRow.classList.toggle("form__row--hidden");
    }
}

const app = new App();
