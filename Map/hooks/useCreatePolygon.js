import "leaflet-pixi-overlay/L.PixiOverlay";
import "pixi.js";
import * as d3 from "d3"

const useCreatePolygon = (data, map, escala = undefined, escalaVar = undefined, pixiContainer) => {
    // POLÍGONOS
    var firstDraw = true;
    var pixiOverlay = L.pixiOverlay((utils) => {
        var container = utils.getContainer();
        var renderer = utils.getRenderer();
        var project = utils.latLngToLayerPoint;
        var colorescala = d3.scaleLinear()
            .domain([0, 33, 66, 100])
            .range(["#D2DFFF", "#7D96E8", "#577DE8", "#295FFF"]);
        PIXI.utils.clearTextureCache();

        container.interactive = true;
        container.buttonMode = true;

        const drawPoly = (color, alpha) => {
            return (poly, properties) => {
                var pixiPolygon = new PIXI.Graphics();
                var shape = new PIXI.Polygon(poly[0].map(function (point) {
                    var proj = project([point[1], point[0]]);
                    return new PIXI.Point(proj.x, proj.y);
                }));
                pixiPolygon.beginFill(color, alpha);
                pixiPolygon.drawShape(shape);
                pixiPolygon.lineStyle(0.5, 0x000000);
                pixiPolygon.drawShape(shape);
                // pixiPolygon.popup = L.popup().setLatLng([pixiPolygon.y, pixiPolygon.x]).setContent('I am a polygon.');

                if (poly.length > 1) {
                    for (var i = 1; i < poly.length; i++) {
                        var hole = new PIXI.Polygon(poly[i].map(function (point) {
                            var proj = project([point[1], point[0]]);
                            return new PIXI.Point(proj.x, proj.y);
                        }));
                        pixiPolygon.drawShape(hole);
                        pixiPolygon.lineStyle(0.5, 0x000000);
                        pixiPolygon.drawShape(hole);
                        pixiPolygon.addHole();
                    }
                }
                // OnClick
                pixiPolygon.interactive = true;
                pixiPolygon.cursor = 'pointer';
                pixiPolygon.on('tap', onClick);
                function onClick() {
                    console.log(pixiPolygon)
                    console.log(`${properties.NM_BAIRRO} [${escalaVar}]: ${properties[escalaVar]}`)
                }
                container.addChild(pixiPolygon);
            };
        }

        if (firstDraw) {
            var geojson = data
            geojson.features.forEach(function (feature, index) {
                var alpha, color;
                var tint = d3.color(colorescala(100)).rgb();;
                if (feature.properties[escalaVar] !== undefined) {
                    var valor = feature.properties[escalaVar]
                }
                if (escala !== undefined) {
                    if (valor < escala) {
                        tint = d3.color(colorescala(0)).rgb();
                    } else if (valor > escala && valor < escala * 2) {
                        tint = d3.color(colorescala(33)).rgb();
                    } else if (valor > escala * 2 && valor < escala * 3) {
                        tint = d3.color(colorescala(66)).rgb();
                    } else if (valor > escala * 3) {
                        tint = d3.color(colorescala(100)).rgb();
                    }
                }

                color = 256 * (tint.r * 256 + tint.g) + tint.b;
                alpha = 0.5;
                if (feature.geometry === null) return;

                if (feature.geometry.type === 'Polygon') {
                    drawPoly(color, alpha)(feature.geometry.coordinates, feature.properties);
                } else if (feature.geometry.type == 'MultiPolygon') {
                    feature.geometry.coordinates.forEach(drawPoly(color, alpha));
                }
            });
        }
        firstDraw = false;
        renderer.render(container);
    }, pixiContainer);
    pixiOverlay.addTo(map);
}

export default useCreatePolygon;