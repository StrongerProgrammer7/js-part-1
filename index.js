/* eslint-disable prettier/prettier */
/* eslint-disable no-restricted-imports */
// @ts-nocheck
// TS
/*
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
*/

import { getCCA3ByNameCountry, calcPath, loadCountriesData, totalRequest } from './blackBox.js';

const form = document.getElementById('form');
const fromCountry = document.getElementById('fromCountry');
const toCountry = document.getElementById('toCountry');
const countriesList = document.getElementById('countriesList');
const submit = document.getElementById('submit');
const output = document.getElementById('output');

function managmentControl(disbled, ...controls)
{
    for (let i = 0; i < controls.length; i++)
    {
        controls[i].disabled = disbled;
    }
}
(async () =>
{
    managmentControl(true, fromCountry, toCountry, submit);
    output.textContent = 'Loading…';
    let countriesData = {};
    try
    {
        // ПРОВЕРКА ОШИБКИ №2: Ставим тут брейкпоинт и, когда дойдёт
        // до него, переходим в оффлайн-режим. Получаем эксцепшн из `fetch`.
        countriesData = await loadCountriesData(
            'https://restcountries.com/v3.1/all?fields=name&fields=cca3&fields=area&fields=borders'
        );
    }
    catch (error)
    {
        // console.log('catch for loadCountriesData');
        // console.error(error);
        output.textContent = `Something went wrong. Check url or connect with Internet.`;
        return;
    }
    output.textContent = '';

    // Заполняем список стран для подсказки в инпутах
    Object.keys(countriesData)
        .sort((a, b) => countriesData[b].area - countriesData[a].area)
        .forEach((code) =>
        {
            const option = document.createElement('option');
            option.value = countriesData[code].name.common;
            countriesList.appendChild(option);
        });

    // console.log(countriesData);

    managmentControl(false, fromCountry, toCountry, submit);
    form.addEventListener('submit', async (event) =>
    {
        event.preventDefault();
        try
        {
            output.textContent = 'Loading…';

            managmentControl(true, fromCountry, toCountry, submit);

            const from = fromCountry.value;
            const to = toCountry.value;
            const cca3 = getCCA3ByNameCountry(from, to, countriesData);

            const path = await calcPath(cca3.from, cca3.to, countriesData);
            if (path === null)
            {
                output.textContent = `Path include island(or another continent) ${from} -> ${to}`;
            }
            else
            {
                output.textContent = `${path}\nCount requests: ${totalRequest}`;
            }
            totalRequest = 0;
            managmentControl(false, fromCountry, toCountry, submit);
            /* const infoFrom = await getData(
                `https://restcountries.com/v3.1/alpha/${cca3.from}?fields=name&fields=borders&fields=area`
            );*/
        }
        catch (error)
        {
            output.textContent = 'Get error with work data, look console (F12)->Tab:Console';
            console.log('Error in submit form, check url and data');
            console.error(error);
        }
    });
})();
