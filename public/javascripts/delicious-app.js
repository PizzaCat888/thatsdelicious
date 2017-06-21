import '../sass/style.scss';

import { $, $$ } from './modules/bling';
//bling makes our javascript look like jquery, but its DOM manipulation simplified
import autocomplete from "./modules/autocomplete";
import typeAhead from "./modules/typeAhead";
import makeMap from "./modules/map";
import ajaxHeart from "./modules/heart"

//Our form in the add store page has longitude first,
// this is because mongoDB and google maps does location in their own ways
autocomplete($("#address"), $("#lat"), $("#lng"));

typeAhead($(".search")) // CSS class search

makeMap($("#map"));

const heartForms = $$("form.heart") //$$ is query selector all
heartForms.on("submit", ajaxHeart)