// @ts-nocheck
/* global am5, am5map, am5geodata_worldLow, am5themes_Animated */

import 'https://cdn.amcharts.com/lib/5/index.js';
import 'https://cdn.amcharts.com/lib/5/map.js';
import 'https://cdn.amcharts.com/lib/5/geodata/worldLow.js';
import 'https://cdn.amcharts.com/lib/5/themes/Animated.js';
import cca3to2Map from '/cca3to2.js';

const empty = (...vars):void => {
    console.error('am5 is not initialized yet');
};

const module = {
    setEndPoints: empty,
    markAsVisited: empty,
};

// См. https://www.amcharts.com/demos/map-timeline/
am5.ready(() => {
    // Вообще так делать нехорошо. Куда поставить div, какая у него высота
    // и всё такое прочее должно решать приложение, а не модуль карты.
    const mapNode:HTMLDivElement = document.createElement('div');
    mapNode.id = 'maps';
    mapNode.style.height = '500px';
    mapNode.style.marginTop = '20px';
    document.querySelector('#output').parentNode.appendChild(mapNode);

    const root:unknown = am5.Root.new('maps');

    // eslint-disable-next-line camelcase
    root.setThemes([am5themes_Animated.new(root)]);

    const chart : unknown = root.container.children.push(
        am5map.MapChart.new(root, {
            projection: am5map.geoNaturalEarth1(),
        })
    );

    chart.set(
        'zoomControl',
        am5map.ZoomControl.new(root, {
            x: am5.p0,
            centerX: am5.p0,
            y: am5.p0,
            centerY: am5.p0,
        })
    );

    const polygonSeries = chart.series.push(
        am5map.MapPolygonSeries.new(root, {
            // eslint-disable-next-line camelcase
            geoJSON: am5geodata_worldLow,
            exclude: ['AQ'],
            fill: root.interfaceColors.get('stroke'),
        })
    );

    polygonSeries.mapPolygons.template.setAll({
        tooltipText: '{name}',
        interactive: true,
    });

    chart.appear(1000, 100);

    // ХЗ как в API am5 сбросить все закрашенные полигоны, так что храним их тут
    let markedDataItems = {};
    const resetAllMarks = () => {
        Object.keys(markedDataItems).forEach((mapCode) => {
            const dataItem = polygonSeries.getDataItemById(mapCode);
            dataItem.get('mapPolygon').remove('fill');
        });
        markedDataItems = [];
    };

    const fill = (countryCodes, colorName) => {
        countryCodes.forEach((cca3) => {
            const mapCode = cca3to2Map[cca3];
            if (markedDataItems[mapCode]) {
                return;
            }
            const dataItem = polygonSeries.getDataItemById(mapCode);
            if (dataItem) {
                markedDataItems[mapCode] = true;
                dataItem.get('mapPolygon').set('fill', root.interfaceColors.get(colorName));
            }
        });
    };

    module.setEndPoints = (from:string, to:string):void => {
        resetAllMarks();
        fill([from, to], 'primaryButtonHover');
    };

    module.markAsVisited = (countryCodes:Array<string>):void => {
        fill(countryCodes, 'positive');
    };
});

export default module;
