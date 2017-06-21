import axios from "axios";
import {$} from "./bling";

function ajaxHeart(e) {
    e.preventDefault(); //stop from submitting
    axios.post(this.action).then(res => {
        const isHearted = this.heart.classList.toggle("heart__button--hearted") //this refers to the form tag and heart refers to the name in our store form mixin
        $('.heart-count').textContent = res.data.hearts.length
        if(isHearted) {
            this.heart.classList.add("heart__button--float"); //enables css animation
            setTimeout(() => this.heart.classList.remove("heart__button--float"), 2500)
        }
}).catch(console.error)
}

export default ajaxHeart