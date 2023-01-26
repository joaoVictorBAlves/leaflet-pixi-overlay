import "leaflet-pixi-overlay/L.PixiOverlay";
import "pixi.js";
import * as d3 from "d3"

const useCreatePolygon = (data, map, escala = undefined) => {
    // POLÍGONOS
    var firstDraw = true;
    var pixiContainer = new PIXI.Graphics();

    var pixiOverlay = L.pixiOverlay((utils) => {
        var container = utils.getContainer();
        var renderer = utils.getRenderer();
        var project = utils.latLngToLayerPoint;
        var colorScale = d3.scaleLinear()
            .domain([0, 33, 66, 100])
            .range(["#D2DFFF", "#7D96E8", "#577DE8", "#295FFF"]);

        if (firstDraw) {
            var geojson = data

            const drawPoly = (color, alpha) => {
                return (poly, properties) => {
                    var shape = new PIXI.Polygon(poly[0].map(function (point) {
                        var proj = project([point[1], point[0]]);
                        return new PIXI.Point(proj.x, proj.y);
                    }));
                    var pixiPolygon = new PIXI.Graphics();
                    pixiPolygon.beginFill(color, alpha);
                    pixiPolygon.drawShape(shape);
                    pixiPolygon.lineStyle(0.5, 0x000000);
                    pixiPolygon.drawShape(shape);
                    container.addChild(pixiPolygon);

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
                    // Add click event for the polygon
                    pixiPolygon.interactive = true;
                    pixiPolygon.buttonMode = true;
                    pixiPolygon.on("pointerdown", function () {
                        var valor = properties.V007
                        if (valor < escalaSocial) {
                            console.log(properties.NM_BAIRRO, "Baixa")
                        } else if (valor > escalaSocial && valor < escalaSocial * 2) {
                            console.log(properties.NM_BAIRRO, "Média baixa")
                        } else if (valor > escalaSocial * 2 && valor < escalaSocial * 3) {
                            console.log(properties.NM_BAIRRO, "Média")
                        } else if (valor > escalaSocial * 3) {
                            console.log(properties.NM_BAIRRO, "Alta")
                        }
                    });
                };
            }
            geojson.features.forEach(function (feature, index) {
                var alpha, color;
                var valor = feature.properties.V007
                var tint;
                if (escala !== undefined) {
                    if (valor < escala) {
                        tint = d3.color(colorScale(0)).rgb();
                    } else if (valor > escala && valor < escala * 2) {
                        tint = d3.color(colorScale(33)).rgb();
                    } else if (valor > escala * 2 && valor < escala * 3) {
                        tint = d3.color(colorScale(66)).rgb();
                    } else if (valor > escala * 3) {
                        tint = d3.color(colorScale(100)).rgb();
                    }
                } else {
                    tint = d3.color(colorScale(100)).rgb();
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