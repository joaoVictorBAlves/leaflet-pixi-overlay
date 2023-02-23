import { useEffect, useRef, useState } from "react";
import L from "leaflet"
import "leaflet-pixi-overlay";
import "leaflet/dist/leaflet.css";
import "pixi.js";
import * as d3 from "d3"
import Style from "./Map.module.css"

const Map = ({ data, coordenates = [0, 0], zoom = 10, minzoom = 1, maxZoom = 20, dataMakers, choroplethVariable, makerVariable, route }) => {
    // STATES
    var scaleColor = d3.scaleLinear()
        .domain([0, 33, 66, 100])
        .range(["#D2DFFF", "#7D96E8", "#577DE8", "#295FFF"]);

    const mapContainerRef = useRef(null);
    var map;
    // UPDATE STATES
    useEffect(() => {
        if (mapContainerRef.current) {
            var loader = new PIXI.loaders.Loader();
            loader.add('marker', 'assets/default.png');
            loader.add('red', 'assets/red.png');
            loader.add('orange', 'assets/orange.png');
            loader.add('yellow', 'assets/yellow.png');
            loader.add('green', 'assets/green.png');
            loader.load(function (loader, resources) {
                // CRIACAO DO MAPA
                map = L.map(mapContainerRef.current).setView(coordenates, zoom);
                L.tileLayer('//stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
                    subdomains: 'abcd',
                    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
                    minZoom: minzoom,
                    maxZoom: maxZoom
                }).addTo(map);
                map.attributionControl.setPosition('bottomleft');
                map.zoomControl.setPosition('bottomright');
                // GRAPHICS OVERLAY
                var markerTexture = {
                    marker: resources.marker.texture,
                    red: resources.red.texture,
                    orange: resources.orange.texture,
                    yellow: resources.yellow.texture,
                    green: resources.green.texture
                }
                var pixiOverlay = (function () {
                    var frame = null;
                    var firstDraw = true;
                    var prevZoom;
                    // INSTANCIANDO POLÍGONOS
                    if (data) {
                        var polygonsByGeojson = [] // Agrupa 
                        var polygonFeautures = [] // Agrupa as feautures de forma nivelada tanto Polygons quanto MultiPolygons
                        data.features.forEach((feauture) => {
                            if (feauture.geometry.type === "Polygon") {
                                feauture.geometry.coordinates.forEach(polygon => {
                                    var obj = {
                                        type: "Feauture",
                                        properties: feauture.properties,
                                        geometry: {
                                            type: feauture.geometry.type,
                                            coordinates: polygon
                                        }
                                    }
                                    polygonFeautures.push(obj)
                                    polygonsByGeojson.push(new PIXI.Graphics());
                                });
                            } else if (feauture.geometry.type === "MultiPolygon") {
                                feauture.geometry.coordinates.forEach(polygon => {
                                    var obj = {
                                        type: "Feauture",
                                        properties: feauture.properties,
                                        geometry: {
                                            type: feauture.geometry.type,
                                            coordinates: polygon
                                        }
                                    }
                                    polygonFeautures.push(obj)
                                    polygonsByGeojson.push(new PIXI.Graphics());
                                })
                            }
                        })
                    }
                    // INSTANCIAÇÃO DO MARCADORES
                    if (dataMakers) {
                        var markers = []
                        if (makerVariable) {
                            // ESCALA DOS MARCADORES
                            var values = dataMakers.features.map(feauture => feauture.properties[makerVariable])
                            var max = Math.max.apply(Math, values);
                            var min = Math.min.apply(Math, values);
                            var scaleValue = (max - min) / 3.0
                        }
                        dataMakers.features.forEach((marker) => {
                            var texture = markerTexture.marker
                            if (makerVariable) {
                                var valor = marker.properties[makerVariable]
                                if (valor < scaleValue) {
                                    texture = markerTexture.red
                                } else if (valor > scaleValue && valor < scaleValue * 2) {
                                    texture = markerTexture.orange
                                } else if (valor > scaleValue * 2 && valor < scaleValue * 3) {
                                    texture = markerTexture.yellow
                                } else if (valor > scaleValue * 3) {
                                    texture = markerTexture.green
                                }
                            }
                            var pixiMarker = new PIXI.Sprite(texture);
                            pixiMarker.popup = L.popup()
                                .setLatLng([marker.geometry.coordinates[1], marker.geometry.coordinates[0]])
                                .setContent('<b>Hello world!</b><br>I am a marker.');
                            markers.push(pixiMarker)
                        });
                    }
                    // ADICIONANDO GRÁFICOS NO PIXI CONTAINER
                    var pixiContainer = new PIXI.Container();
                    if (data) {
                        polygonsByGeojson.forEach((geo) => { geo.interactive = true });
                        pixiContainer.addChild(...polygonsByGeojson);
                    }
                    if (dataMakers) {
                        markers.forEach((geo) => { geo.interactive = true });
                        pixiContainer.addChild(...markers);
                    }
                    pixiContainer.interactive = true;
                    pixiContainer.buttonMode = true;
                    // DESENHOS DOS GRÁFICOS GERADOS
                    return L.pixiOverlay(function (utils) {
                        if (frame) {
                            cancelAnimationFrame(frame);
                            frame = null;
                        }
                        var zoom = utils.getMap().getZoom();
                        var container = utils.getContainer();
                        var renderer = utils.getRenderer();
                        var project = utils.latLngToLayerPoint;
                        var scale = utils.getScale();

                        if (firstDraw) {
                            utils.getMap().on('click', function (e) {
                                var interaction = utils.getRenderer().plugins.interaction;
                                var pointerEvent = e.originalEvent;
                                var pixiPoint = new PIXI.Point();
                                interaction.mapPositionToPoint(pixiPoint, pointerEvent.clientX, pointerEvent.clientY);
                                var target = interaction.hitTest(pixiPoint, container);
                                if (target && target.popup) {
                                    target.popup.openOn(map);
                                }
                            });
                            // DEFINIÇÕES DO MARCADORES 
                            if (dataMakers) {
                                dataMakers.features.forEach((marker, index) => {
                                    var markerCoord = project([marker.geometry.coordinates[1], marker.geometry.coordinates[0]]);
                                    markers[index].x = markerCoord.x;
                                    markers[index].y = markerCoord.y;
                                    markers[index].anchor.set(0.5, 1);
                                    markers[index].scale.set(0.08 / scale);
                                    markers[index].currentScale = 0.08 / scale
                                });
                            }
                        }
                        // ATUALIZAÇÕES DE GRÁFICOS
                        if (firstDraw || prevZoom !== zoom) {
                            if (data) {
                                if (choroplethVariable) {
                                    // CRIAÇÃO DA ESCALA DA PROPRIEDADE
                                    var values = polygonFeautures.map(feauture => feauture.properties[choroplethVariable]);
                                    var max = Math.max.apply(Math, values);
                                    var min = Math.min.apply(Math, values);
                                    var scaleValue = (max - min) / 3.0
                                }
                                polygonsByGeojson.forEach((polygon, i) => {
                                    var color = 0x3388ff;
                                    var alpha = 0.5
                                    // DESENHO DO CHOROPLETH
                                    if (choroplethVariable) {
                                        var valor = polygonFeautures[i].properties[choroplethVariable]
                                        var tint;
                                        if (valor < scaleValue) {
                                            tint = d3.color(scaleColor(0)).rgb();
                                        } else if (valor > scaleValue && valor < scaleValue * 2) {
                                            tint = d3.color(scaleColor(33)).rgb();
                                        } else if (valor > scaleValue * 2 && valor < scaleValue * 3) {
                                            tint = d3.color(scaleColor(66)).rgb();
                                        } else if (valor > scaleValue * 3) {
                                            tint = d3.color(scaleColor(100)).rgb();
                                        }
                                        color = 256 * (tint.r * 256 + tint.g) + tint.b;
                                        alpha = 0.8
                                    }
                                    // DESENHO DO POLÍGONO
                                    polygon.clear()
                                    polygon.lineStyle(1 / scale, 0x000000, 1);
                                    polygon.beginFill(color, alpha);
                                    polygonFeautures[i].geometry.coordinates.forEach(function (coords, index) {
                                        if (polygonFeautures[i].geometry.type === "Polygon") {
                                            var point = project([coords[1], coords[0]])
                                            if (index == 0) polygon.moveTo(point.x, point.y);
                                            else polygon.lineTo(point.x, point.y);
                                        } else {
                                            coords.forEach((coord, index) => {
                                                var point = project([coord[1], coord[0]])
                                                if (index == 0) polygon.moveTo(point.x, point.y);
                                                else polygon.lineTo(point.x, point.y);
                                            });
                                        }
                                    })
                                    polygon.endFill();
                                    polygon.on("pointerdown", () => {
                                        var latLon = polygonFeautures[i].geometry.coordinates[0];
                                        if (polygonFeautures[i].geometry.coordinates[0].length > 2)
                                            latLon = polygonFeautures[i].geometry.coordinates[0][0];
                                        polygon.popup = L.popup()
                                            .setLatLng([latLon[1], latLon[0]])
                                            .setContent(`Bairro ${polygonFeautures[i].properties[choroplethVariable]}`)
                                    });
                                });
                                console.log(values)
                            }
                            if (dataMakers) {
                                markers.forEach((marker) => {
                                    marker.currentScale = marker.scale.x;
                                    marker.targetScale = 0.1 / scale;
                                });
                            }
                        }
                        // ANIMAÇÃO DO MARCADOR
                        var duration = 100;
                        var start;
                        function animate(timestamp) {
                            var progress;
                            if (start === null) start = timestamp;
                            progress = timestamp - start;
                            var lambda = progress / duration;
                            if (lambda > 1) lambda = 1;
                            lambda = lambda * (0.4 + lambda * (2.2 + lambda * -1.6));
                            if (dataMakers) {
                                markers.forEach((marker) => {
                                    marker.scale.set(marker.currentScale + lambda * (marker.targetScale - marker.currentScale));
                                });
                            }
                            renderer.render(container);
                            if (progress < duration) {
                                frame = requestAnimationFrame(animate);
                            }
                        }
                        // OUTRAS CONFIGURAÇÕES
                        if (!firstDraw && prevZoom !== zoom) {
                            start = null;
                            frame = requestAnimationFrame(animate);
                        }
                        firstDraw = false;
                        prevZoom = zoom;
                        renderer.render(container);
                    }, pixiContainer);
                })();
                pixiOverlay.addTo(map);
            });
        }
        return () => {
            map.remove();
        }
    }, [mapContainerRef, data, choroplethVariable, makerVariable]);

    return (
        <div ref={mapContainerRef} id="map-container" className={Style.Map}>
        </div>
    );
}

export default Map;