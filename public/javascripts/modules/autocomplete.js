
//This function allows suggestions for the user to input their address data by
// using google api
function autocomplete(input, latInput, lngInput) {
    if(!input) return; //skip this function from running if there is no input on the page
    const dropdown = new google.maps.places.Autocomplete(input);
    //google listener method
    dropdown.addListener("place_changed", () =>{
        const place = dropdown.getPlace();
        //lat and longitude autocomplete via google maps api
        latInput.value = place.geometry.location.lat();
        lngInput.value = place.geometry.location.lng();
    });
    //This event listenr(via bling module) stop users from submitting the page if they
    //hit enter while on the form page
    input.on("keydown", (e) => {
        //code 13 is "enter" on keyboard
        if(e.keyCode === 13) e.preventDefault();
    });
}

export default autocomplete;