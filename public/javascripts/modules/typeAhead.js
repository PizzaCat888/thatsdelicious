import axios from "axios"; //library for fetching data
import dompurify from "dompurify";

function searchResultsHTML(stores) {
    return stores.map(store => {
        return `<a href="/store/${store.slug}" class="search__result"><strong>${store.name}</strong></a>`;
    }).join("")
}

function typeAhead(search) {
    if(!search) return; //if no search engine for w/e reason, don't run this;

    const searchInput = search.querySelector('input[name="search"]')
    const searchResults = search.querySelector(".search__results")

    //Bling syntax for addeventlistener
    searchInput.on("input", function() {
        //no value, quit it
        if(!this.value) {
            searchResults.style.display = 'none';
            return;
        }
        searchResults.style.display = 'block';
        

        axios
        .get(`/api/search?q=${this.value}`)
        .then(res => {
            if(res.data.length) {
                searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
                return
            }
            //tell user nothing came back
            searchResults.innerHTML = dompurify.sanitize( `<div class="search__result">No results for ${this.value} found!</div>`)
        })
        .catch(err => {
            console.error(err);
        })

    });

    //handle keyboard inputs
    searchInput.on("keyup", (e) => {
        //if they aren't pressing up, down, or enter, it won't matter
        if(![38, 40, 13].includes(e.keyCode)) {
            return; //stop
        }
        const activeClass = "search__result--active";
        const current = search.querySelector(`.${activeClass}`);
        const items = search.querySelectorAll(".search__result");
        let next = 0;
        if(e.keyCode === 40 && current) {
            next = current.nextElementSibling || items[0];
        } else if (e.keyCode === 40) {
            next = items[0];
        } else if (e.keyCode === 38 && current) {
            next = current.previousElementSibling || items[items.length - 1]
        } else if (e.keyCode === 38) {
            next = items[items.length - 1];
        } else if (e.keyCode === 13 && current.href) {
            window.location = current.href
            return; //stop function if you hit enter
        }
        if(current) {
            current.classList.remove(activeClass);
        }
        next.classList.add(activeClass)
    })
}

export default typeAhead;