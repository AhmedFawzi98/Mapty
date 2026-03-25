"use strict";

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

        containerWorkouts.addEventListener("click", (clickEvent) => {
            const workoutLi = clickEvent.target.closest(".workout");
            if (!workoutLi) return;
            this.#moveToWorkoutCoords(workoutLi.dataset.id);
        });
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

        this.#workouts.unshift(workout);

        this.#createMarkerWithPopup(workout);

        this.#renderWorkout(workout);

        this.#closeForm();
    }

    #isValidInputData(type, ...numericInputs) {
        if (type !== "running" && type !== "cycling") return false;
        return numericInputs.every(
            (numericInput) => Number.isFinite(numericInput) && numericInput > 0,
        );
    }

    #createMarkerWithPopup(workout) {
        const popUpOptions = {
            maxWidth: 300,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`,
        };
        const popup = L.popup(popUpOptions);
        const popupContent = `${workout.type} ${workout.distance} km for ${workout.duration} min - on ${this.#formatDate(workout.date)}`;
        const marker = L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(popup)
            .setPopupContent(popupContent)
            .openPopup();
    }

    #renderWorkout(workout) {
        const isCycling = workout.type === "cycling";

        const html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
                      <h2 class="workout__title">${workout.type} on ${this.#formatDate(workout.date)}</h2>
                      <div class="workout__details">
                        <span class="workout__icon">${isCycling ? "🚴‍♀️" : "🏃‍♂️"}</span>
                        <span class="workout__value">${workout.distance}</span>
                        <span class="workout__unit">km</span>
                      </div>
                      <div class="workout__details">
                            <span class="workout__icon">⏱</span>
                            <span class="workout__value">${workout.duration}</span>
                            <span class="workout__unit">min</span>
                      </div>
                      <div class="workout__details">
                            <span class="workout__icon">⚡️</span>
                            <span class="workout__value">${isCycling ? workout.speed.toFixed(2) : workout.pace.toFixed(2)}</span>
                            <span class="workout__unit">${isCycling ? "km/hr" : "min/km"}</span>
                      </div>
                      <div class="workout__details">
                            <span class="workout__icon">${isCycling ? "⛰" : "🦶🏼"}</span>
                            <span class="workout__value">${isCycling ? workout.elevationGain : workout.cadence}</span>
                            <span class="workout__unit">${isCycling ? "m" : "spm"}</span>
                      </div>
        `;

        containerWorkouts.insertAdjacentHTML("afterbegin", html);
    }

    #moveToWorkoutCoords(workoutId) {
        const workout = this.#workouts.find(
            (workout) => workout.id === workoutId,
        );
        this.#map.setView(workout.coords, this.#mapZoom, {
            animate: true,
            pan: {
                duration: 1,
            },
        });
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

    #formatDate(date) {
        return new Intl.DateTimeFormat("en-US", {
            day: "numeric",
            month: "long",
        }).format(date);
    }
}

const app = new App();
