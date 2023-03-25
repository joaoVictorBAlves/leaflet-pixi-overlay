import { useEffect, useRef } from "react";
import Style from "./Map.module.css"
import "leaflet/dist/leaflet.css";
import "leaflet-pixi-overlay";
import * as d3 from "d3"
import "pixi.js";
import { Visibility } from "@mui/icons-material";
import { IconButton } from "@mui/material";

const Map = ({ data, coordinates = [0, 0], zoom = 10, minzoom = 0, maxZoom = 20, variable, type = "polygons", scaleMethod, scaleColor = [0xe5f5e0, 0xa1d99b, 0x31a354, 0x006d2c] }) => {
    let palete = []
    const mapContainerRef = useRef(null);
    let hidden = true;
    var map;
    // DEFINIÇÃO DAD ESCALAS
    const set = [];
    let mapScale = null;
    useEffect(() => {
        // CONJUNTO DO DOMÍNIO DA ESCALA
        data.features.forEach((feauture) => set.push(feauture.properties[variable]));
        // ESCOLHA DA PALETA DE CORES
        if (type === "polygons") {
            if (scaleColor === "Sequencial") {
                scaleColor = [0x96C7FF, 0x3693FF, 0x564BF, 0x063973];
                palete = ['#96C7FF', '#3693FF', '#0564BF', '#063973'];
            } else {
                scaleColor = [0xF73946, 0xFF6E77, 0x3693FF, 0x1564BF];
                palete = ['#F73946', '#FF6E77', '#3693FF', '#1564BF'];
            }
        }
        if (type === "markers") {
            if (scaleColor === "Sequencial") {
                scaleColor = ["baixo", "medioBaixo", "medioAlto", "alto"];
                palete = ['#96c7ff', '#3693ff', '#0564bf', '#063973'];
            } else {
                scaleColor = ["vermelho", "vermelhoMedio", "azul-medio", "azul"];
                palete = ['#f73946', '#ff6e77', '#3693ff', '#1564bf'];
            }
        }
        // ESCOLHA DO MODO DE ESCALA
        if (scaleMethod === "quantile")
            mapScale = d3.scaleQuantile()
                .domain(set.sort((a, b) => a - b))
                .range(scaleColor);
        else
            mapScale = d3.scaleQuantize()
                .domain([d3.min(set.sort((a, b) => a - b)), d3.max(set.sort((a, b) => a - b))])
                .range(scaleColor);
    }, [variable, scaleMethod, scaleColor]);
    // UPDATE STATES
    useEffect(() => {
        if (mapContainerRef.current) {
            const loader = new PIXI.loaders.Loader();
            // ADICIONANDO TEXTURAS PARA MARCADORES
            loader.add('marker', 'assets/azul.png');
            loader.add('baixo', 'assets/baixo.png');
            loader.add('medioBaixo', 'assets/medio-baixo.png');
            loader.add('medioAlto', 'assets/medio-alto.png');
            loader.add('alto', 'assets/alto.png');
            loader.add('vermelho', 'assets/vermelho.png');
            loader.add('vermelhoMedio', 'assets/vermelho-medio.png');
            loader.add('azulMedio', 'assets/azul-medio.png');
            loader.add('azul', 'assets/azul.png');
            loader.load((loader, resources) => {
                // CRIAR MAPA BASE
                map = L.map(mapContainerRef.current).setView(coordinates, zoom);
                // WHITE
                L.tileLayer('//stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
                    subdomains: 'abcd',
                    attribution: '',
                    minZoom: minzoom,
                    maxZoom: maxZoom
                }).addTo(map);
                map.attributionControl.setPosition('bottomright');
                map.zoomControl.setPosition('topleft');
                // CRIAÇÃO DAS LEGENDAS
                if (variable) {
                    const groupedValues = d3.group(set.sort((a, b) => a - b), value => mapScale(value));
                    const values = [];
                    groupedValues.forEach((group) => {
                        values.push(`${group[0]}${group[0] !== group[group.length - 1] ? ' - ' + group[group.length - 1] : ""}`)
                    });
                    console.log(values)
                    // CRIAÇÃO DAS LEGENDAS PARA CHOROPLETH
                    var legend = L.control({ position: 'bottomright' });
                    legend.onAdd = function (map) {
                        var div = L.DomUtil.create('div', `${Style.info} ${Style.legend}`),
                            grades = values
                        div.innerHTML += `
                            <h4>${type === "polygons" ? "Mapa Choropleth" : "Mapa de Marcadores"}</h4>
                            <p>${variable}</p>
                            <br />`;
                        // INTERVALO DE CADA COR
                        if (hidden === true) {
                            for (var i = 0; i < grades.length; i++) {
                                div.innerHTML +=
                                    '<i style="background:' + palete[i] + '; opacity:1;"></i> ' + grades[i] + '<br>'
                            }
                        }
                        return div;
                    };
                    legend.addTo(map);
                }
                // OBJETO COM AS TEXTURAS
                const markerTexture = {
                    marker: resources.marker.texture,
                    baixo: resources.baixo.texture,
                    medioBaixo: resources.medioBaixo.texture,
                    medioAlto: resources.medioAlto.texture,
                    alto: resources.alto.texture,
                    vermelho: resources.vermelho.texture,
                    vermelhoMedio: resources.vermelhoMedio.texture,
                    azulMedio: resources.azulMedio.texture,
                    azul: resources.azul.texture
                }
                // SOBREPOSIÇÃO DE GRÁFICOS
                const pixiOverlay = (() => {
                    let frame = null;
                    let firstDraw = true;
                    let prevZoom;
                    // LISTAGEM DOS GRÁFICOS
                    const polygonsByGeojson = [];
                    const polygonFeautures = [];
                    const markers = [];
                    // INSTANCIANDO POLÍGONOS
                    if (type === "polygons") {
                        data.features.forEach((feauture) => {
                            // NIVELAMENTO DAS PROPRIEDADES EM UMA LISTA SEPARADA
                            feauture.geometry.coordinates.forEach(polygon => {
                                polygonFeautures.push({
                                    type: "Feauture",
                                    properties: feauture.properties,
                                    geometry: {
                                        type: feauture.geometry.type,
                                        coordinates: polygon
                                    }
                                });
                                // ADICIONANDO OBJETO PIXI GRÁFICO EM UMA LISTA
                                polygonsByGeojson.push(new PIXI.Graphics());
                            });
                        });
                    }
                    // INSTANCIAÇÃO DO MARCADORES
                    if (type === "markers") {
                        data.features.forEach((marker) => {
                            // ESCALA DOS MARCADORES
                            const valor = marker.properties[variable];
                            const texture = variable ? markerTexture[mapScale(valor)] : markerTexture.marker;
                            // CRIAM E ADICIONAM O PIXI SPRITE NA LISTA DE MARCADORES COM AS COORDENADAS
                            const pixiMarker = new PIXI.Sprite(texture);
                            pixiMarker.popup = L.popup()
                                .setLatLng([marker.geometry.coordinates[0], marker.geometry.coordinates[1]])
                                .setContent(variable + ": " + `<strong>${marker.properties[variable]}</strong>`);
                            markers.push(pixiMarker);
                        });
                    }
                    // ADICIONANDO GRÁFICOS NO PIXI CONTAINER
                    const pixiContainer = new PIXI.Container();
                    if (type === "polygons") {
                        polygonsByGeojson.forEach((geo) => { geo.interactive = true });
                        pixiContainer.addChild(...polygonsByGeojson);
                    }
                    if (type === "markers") {
                        markers.forEach((geo) => { geo.interactive = true });
                        pixiContainer.addChild(...markers);
                    }
                    // INTERATIVIDADES NOS GRÁFICOS E NO CONTEINER
                    pixiContainer.interactive = true;
                    pixiContainer.buttonMode = true;
                    // DESENHOS DOS GRÁFICOS GERADOS
                    return L.pixiOverlay((utils) => {
                        if (frame) {
                            cancelAnimationFrame(frame);
                            frame = null;
                        }
                        // UTILITÁRIOS
                        let zoom = utils.getMap().getZoom();
                        let container = utils.getContainer();
                        let renderer = utils.getRenderer();
                        let project = utils.latLngToLayerPoint;
                        let scale = utils.getScale();
                        // QUANDO É O PRIMEIRO DESENHO
                        if (firstDraw) {
                            // INTERAÇÃO DE CLIQUE
                            utils.getMap().on('click', (e) => {
                                // DEFINIÇÕES DE CLIQUE
                                let interaction = utils.getRenderer().plugins.interaction;
                                let pointerEvent = e.originalEvent;
                                let pixiPoint = new PIXI.Point();
                                interaction.mapPositionToPoint(pixiPoint, pointerEvent.clientX, pointerEvent.clientY);
                                let target = interaction.hitTest(pixiPoint, container);
                                if (target && target.popup) {
                                    target.popup.openOn(map);
                                }
                            });
                            // DESENHO DOS MARCADORES 
                            if (type === "markers") {
                                data.features.forEach((marker, index) => {
                                    let markerCoord = project([marker.geometry.coordinates[0], marker.geometry.coordinates[1]]);
                                    markers[index].x = markerCoord.x;
                                    markers[index].y = markerCoord.y;
                                    markers[index].anchor.set(0.5, 1);
                                    markers[index].scale.set(0.09 / scale);
                                    markers[index].currentScale = 0.09 / scale;
                                });
                            }
                        }
                        // ATUALIZAÇÕES DE GRÁFICOS COM O ZOOM
                        if (firstDraw || prevZoom !== zoom) {
                            // DESENHO DO POLÍGONO
                            if (type === "polygons") {
                                polygonsByGeojson.forEach((polygon, i) => {
                                    // DEFINIÇÃO DE CORES PARA POLÍGONOS
                                    const valor = polygonFeautures[i].properties[variable];
                                    const color = variable ? mapScale(valor) : scaleColor[0];
                                    const alpha = 1;
                                    // DESENHO DO POLÍGONO USANDO PIXI.JS
                                    polygon.clear()
                                    polygon.lineStyle(1 / scale, 0x000000, 1);
                                    polygon.beginFill(color, alpha);
                                    polygonFeautures[i].geometry.coordinates.forEach((coords, index) => {
                                        if (polygonFeautures[i].geometry.type === "Polygon") {
                                            const point = project([coords[1], coords[0]]) // NA PRODUÇÃO INVERTER A ORDEM
                                            if (index == 0) polygon.moveTo(point.x, point.y);
                                            else polygon.lineTo(point.x, point.y);
                                        } else {
                                            coords.forEach((coord, index) => {
                                                const point = project([coord[1], coord[0]]) // NA PRODUÇÃO INVERTER A ORDEM
                                                if (index == 0) polygon.moveTo(point.x, point.y);
                                                else polygon.lineTo(point.x, point.y);
                                            });
                                        }
                                    })
                                    polygon.endFill();
                                });
                            }
                            // ATUALIZAÇÃO DE MARCADORES
                            if (type === "markers") {
                                markers.forEach((marker) => {
                                    marker.currentScale = marker.scale.x;
                                    marker.targetScale = 0.1 / scale;
                                });
                            }
                        }
                        // ANIMAÇÃO DO MARCADOR
                        const duration = 100;
                        let start;
                        const animate = (timestamp) => {
                            let progress;
                            if (start === null) start = timestamp;
                            progress = timestamp - start;
                            let lambda = progress / duration;
                            if (lambda > 1) lambda = 1;
                            lambda = lambda * (0.4 + lambda * (2.2 + lambda * -1.6));
                            if (type === "markers") {
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
    }, [mapContainerRef, data, variable, scaleMethod, scaleColor]);

    return (
        <div ref={mapContainerRef} id="map-container" className={Style.Map}>
        </div>
    );
}

export default Map;