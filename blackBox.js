/* eslint-disable no-restricted-imports */
/* eslint-disable curly */
/* eslint-disable prettier/prettier */
// @ts-nocheck
import module from './maps.js';
let totalRequest = 0;

async function getDataAsync(url)
{
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    const response = await fetch(url,
    {
        method: 'GET',
        headers:
        {
            'Content-Type': 'application/json',
        },
        redirect: 'follow',
    });

    // При сетевой ошибке (мы оффлайн) из `fetch` вылетит эксцепшн.
    // Тут мы даём ему просто вылететь из функции дальше наверх.
    // Если же его нужно обработать, придётся обернуть в `try` и сам `fetch`:
    //
    // try {
    //     response = await fetch(url, {...});
    // } catch (error) {
    //     // Что-то делаем
    //     throw error;
    // }

    // Если мы тут, значит, запрос выполнился.
    // Но там может быть 404, 500, и т.д., поэтому проверяем ответ.
    if (response.ok)
    {
        return response.json();
    }

    // Пример кастомной ошибки (если нужно проставить какие-то поля
    // для внешнего кода). Можно выкинуть и сам `response`, смотря
    // какой у вас контракт. Главное перевести код в ветку `catch`.
    const error =
    {
        status: response.status,
        customError: 'wtfAsync',
    };
    throw error;
}

// Загрузка данных через промисы (то же самое что `getDataAsync`)
function getDataPromise(url)
{
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    return fetch(url,
    {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow',
    }).then(
        (response) =>
        {
            // Если мы тут, значит, запрос выполнился.
            // Но там может быть 404, 500, и т.д., поэтому проверяем ответ.
            if (response.ok)
            {
                return response.json();
            }
            // Пример кастомной ошибки (если нужно проставить какие-то поля
            // для внешнего кода). Можно зареджектить и сам `response`, смотря
            // какой у вас контракт. Главное перевести код в ветку `catch`.
            return Promise.reject({
                status: response.status,
                customError: 'wtfPromise',
            });
        },

        // При сетевой ошибке (мы оффлайн) из fetch вылетит эксцепшн,
        // и мы попадём в `onRejected` или в `.catch()` на промисе.
        // Если не добавить `onRejected` или `catch`, при ошибке будет
        // эксцепшн `Uncaught (in promise)`.
        (error) =>
        {
            // Если не вернуть `Promise.reject()`, для внешнего кода
            // промис будет зарезолвлен с `undefined`, и мы не попадём
            // в ветку `catch` для обработки ошибок, а скорее всего
            // получим другой эксцепшн, потому что у нас `undefined`
            // вместо данных, с которыми мы работаем.
            return Promise.reject(error);
        }
    );
}

// Две функции просто для примера, выберите с await или promise, какая нравится
const getData = getDataAsync; // || getDataPromise;

async function loadCountriesData(url = 'https://restcountries.com/v3.1/all?fields=name&fields=cca3&fields=area')
{
    let countries = [];
    try
    {
        // ПРОВЕРКА ОШИБКИ №1: ломаем этот урл, заменяя all на allolo,
        // получаем кастомную ошибку.
        countries = await getData(url);
    }
    catch (error)
    {
        console.log(`catch for getData check url ${url}. Start should be https://restcountries.com/v3.1/all`);
        console.error(error);
        throw error;
    }
    return countries.reduce((result, country) =>
    {
        result[country.cca3] = country;
        return result;
    }, {});
}

function getCountryByCode(code, countriesData)
{
    for (const [key, value] of Object.entries(countriesData))
    {
        if (code !== '' && code === value?.cca3)
        {
            return value.name.common;
        }
    }
    return '';
}
function getNameCountryInThePath(paths, countriesData)
{
    let path = '';
    module.setEndPoints(paths[0], paths[paths.length - 1]);
    for (let i = 0; i < paths.length; i++)
    {
        const country = getCountryByCode(paths[i], countriesData);
        if (i >= 1 && i <= paths.length - 1)
            module.markAsVisited([paths[i - 1], paths[i]]);

        if (i !== paths.length - 1)
            path += `${country} -> `;
        else
            path += country;
    }
    return path;
}
function nearbyBroder(borders, endCountry)
{
    for (let i = 0; i < borders.length; i++)
        if (borders[i] === endCountry)
            return endCountry;
    return null;
}

function findRoute(graph, startCountry, endCountry, countReq = 0, visited = new Set(), maxSteps = 10)
{
    if (startCountry === endCountry)
    {
        totalRequest = countReq;
        return [startCountry];
    }

    if (visited.has(startCountry) || maxSteps === 0)
    {
        return null;
    }

    visited.add(startCountry);

    const borders = graph[startCountry]?.borders || [];
    const endCountryNearbyBorder = nearbyBroder(borders, endCountry);
    if (endCountryNearbyBorder !== null)
    {
        totalRequest = countReq;
        return [startCountry, endCountry];
    }

    for (const neighbor of borders)
    {
        const result = findRoute(graph, neighbor, endCountry, countReq + 1, new Set(visited), maxSteps - 1);
        if (result !== null)
        {
            return [startCountry, ...result];
        }
    }

    return null;
}

async function calcPath(fromCode, toCode, countriesData)
{
    let paths = findRoute(countriesData, fromCode, toCode);
    console.log(totalRequest);
    if (paths === null) // is island or other continent
        paths = [fromCode, toCode];
    return getNameCountryInThePath(paths, countriesData);
}

function getCCA3ByNameCountry(from, to, countriesData)
{
    const cca3 = {
        from: '',
        to: '',
    };
    for (const [key, value] of Object.entries(countriesData))
    {
        if (cca3.from === '' && from === value?.name.common)
        {
            cca3.from = value.cca3;
        }
        if (cca3.to === '' && to === value?.name.common)
        {
            cca3.to = value.cca3;
        }
        if (cca3.to !== '' && cca3.from !== '')
            return cca3;
    }
    return cca3;
}

export { getCCA3ByNameCountry, calcPath, loadCountriesData, totalRequest };
