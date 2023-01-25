import { useEffect, useRef, useState } from "react";
import L, { point, polygon } from "leaflet"
import "leaflet-pixi-overlay/L.PixiOverlay";
import "pixi.js";
import "leaflet/dist/leaflet.css";
import * as d3 from "d3"
import Style from "../../styles/Map.module.css"
import data from "../../data/mapa-social-caucaia.json"
import marker_stress from "../../data/stress_markers.json";
import { makeStyles } from "@mui/material";

function findMaxValue(data, property) {
    if (!data || !data.features || !property) return;
    var arr = data.features.map(feauture => feauture.properties[property]);
    var maxValue = Math.max(...arr);
    return maxValue;
}

function findMinValue(data, property) {
    if (!data || !data.features || !property) return;
    var arr = data.features.map(feauture => feauture.properties[property]);
    var minValue = Math.min(...arr);
    return minValue;
}

const Map = () => {
    const [escalaSocial, setEscalaSocial] = useState((findMaxValue(data, "V005") - findMinValue(data, "V005")) / 3.0);
    const mapContainerRef = useRef(null);

    function getRandom(min, max) {
        return min + Math.random() * (max - min);
    }

    useEffect(() => {
        if (mapContainerRef.current) {
            // MAPA
            const map = L.map(mapContainerRef.current).setView([-3.73224, -38.75], 11); // Chicago origins
            const mapTiles = '//stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png';
            const osmCPLink = '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
            const mapCPLink = '<a href="http://maps.stamen.com/toner">Stamen Design</a>';
            L.tileLayer(mapTiles, {
                attribution: `${osmCPLink} | ${mapCPLink}`,
                detectRetina: false,
                minZoom: 4,
                maxZoom: 18,
                noWrap: false,
                subdomains: 'abc'
            }).addTo(map);

            // MARCADORES
            /*
                var markersLatLng = marker_stress.map((marker) => [marker.latitude, marker.longitude]);
                var markersLatLng = []
                var markerCount = 100000;
                var markers = [];
                // Gera as coordenadas randomicas
                for (let index = 0; index < markerCount; index++) {
                    markersLatLng.push([getRandom(48.7, 49), getRandom(2.2, 2.8)]);
                }
                // Carregando marcadores
                var loader = new PIXI.loaders.Loader();
                loader.add('marker', './assets/red.png');
                loader.load(function (loader, resources) {
                    var pixiContainer = new PIXI.Container();
                    var markerTexture = resources.marker.texture;
                    for (var i = 0; i < markerCount; i++) {
                        markers[i] = new PIXI.Sprite(markerTexture);
                        markers[i].anchor.set(0.5, 1);
                        pixiContainer.addChild(markers[i]);
                    }

                    var firstDraw = true;
                    var prevZoom;

                    var pixiOverlay = L.pixiOverlay(function (utils) {
                        var zoom = utils.getMap().getZoom();
                        var container = utils.getContainer();
                        var renderer = utils.getRenderer();
                        var project = utils.latLngToLayerPoint;
                        var scale = utils.getScale();

                        for (var i = 0; i < markerCount; i++) {
                            if (firstDraw) {
                                var markerCoords = project(markersLatLng[i]);
                                markers[i].x = markerCoords.x;
                                markers[i].y = markerCoords.y;
                            }
                        }

                        if (firstDraw || prevZoom !== zoom) {
                            for (var i = 0; i < markerCount; i++) {
                                markers[i].scale.set(0.03 / scale);
                            }
                        }

                        firstDraw = false;
                        prevZoom = zoom;
                        renderer.render(container);
                    }, pixiContainer);
                    pixiOverlay.addTo(map);
                });
            */

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
                                var valor = properties.V005
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
                        var valor = feature.properties.V005
                        var tint;

                        if (valor < escalaSocial) {
                            tint = d3.color(colorScale(0)).rgb();
                        } else if (valor > escalaSocial && valor < escalaSocial * 2) {
                            tint = d3.color(colorScale(33)).rgb();
                        } else if (valor > escalaSocial * 2 && valor < escalaSocial * 3) {
                            tint = d3.color(colorScale(66)).rgb();
                        } else if (valor > escalaSocial * 3) {
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
            pixiOverlay.addTo(map)

            return () => {
                map.remove();
            }
        }
    }, [mapContainerRef]);

    return (
        <div ref={mapContainerRef} id="map-container" className={Style.Map} style={{ marginTop: 50 }}>
        </div>
    );
}

export default Map;
