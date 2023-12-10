import module from './maps.js';

type CustomError = { status: number, customError: string};

interface INameCountry
{
    common:string;
    nativeName: Object;
}

interface ICountry
{
    area:number;
    cca3:string;
    name?: INameCountry;
    borders?: Array<string>;
}

let totalRequest: number = 0;

async function getDataAsync(url:string) :Promise<ICountry[]>
{
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    const response: Response = await fetch(url,
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
    const error:CustomError =
    {
        status: response.status,
        customError: 'wtfAsync',
    };
    throw error;
}

// Загрузка данных через промисы (то же самое что `getDataAsync`)
function getDataPromise(url:string) :Promise<ICountry[]>
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
            const error:CustomError =
            {
                status: response.status,
                customError: 'wtfPromise',
            };
            return Promise.reject(error);
        },

        // При сетевой ошибке (мы оффлайн) из fetch вылетит эксцепшн,
        // и мы попадём в `onRejected` или в `.catch()` на промисе.
        // Если не добавить `onRejected` или `catch`, при ошибке будет
        // эксцепшн `Uncaught (in promise)`.
        (error:unknown) =>
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
const getData = getDataAsync; // || getDataPromise;
async function loadCountriesData(url = 'https://restcountries.com/v3.1/all?fields=name&fields=cca3&fields=area'):Promise<{[key:string]:ICountry}>
{
    let countries: ICountry[] = [];
    try
    {
        // ПРОВЕРКА ОШИБКИ №1: ломаем этот урл, заменяя all на allolo,
        // получаем кастомную ошибку.
        countries = await getData(url);
    }
    catch (error:unknown)
    {
        console.log(`catch for getData check url ${url}. Start should be https://restcountries.com/v3.1/all`);
        console.error(error);
        throw error;
    }
    return countries.reduce<{ [key:string]: ICountry }>((result, country:ICountry) =>
    {
        result[country.cca3] = country;
        return result;
    },{});
}
