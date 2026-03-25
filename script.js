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

let map, mapEvent;
function getGeoLocationPositionAsync() {
    return new Promise((resolve, reject) => {
        window.navigator.geolocation.getCurrentPosition(
            (geolocationPosition) => resolve(geolocationPosition),
            (error) => reject(error),
        );
    });
}

function loadMap(coords) {
    const zoom = 13;
    map = L.map("map").setView(coords, zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        maxZoom: 19,
    }).addTo(map);

    map.on("click", (mapEv) => {
        mapEvent = mapEv;
        form.classList.remove("hidden");
        inputDistance.focus();
    });
}

async function init() {
    try {
        const geolocationPosition = await getGeoLocationPositionAsync();
        const { latitude, longitude } = geolocationPosition.coords;
        const coords = [latitude, longitude];
        loadMap(coords);
    } catch (error) {
        alert(error.message);
    }
}

init();
