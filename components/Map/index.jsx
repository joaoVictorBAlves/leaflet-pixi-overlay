import { useEffect, useRef, useState } from "react";
import "leaflet-pixi-overlay";
import * as PIXI from 'pixi.js';
import "leaflet/dist/leaflet.css";
import Style from "../../styles/Map.module.css"
import data from "../../data/mapa-social-caucaia.json"

const Map = () => {
    const [escalaSocial, setEscalaSocial] = useState(data.escalas.maiorV005 / 5.0);
    const mapContainerRef = useRef(null);

    const onEachFeature = (place, layer) => {
        layer.options.fillOpacity = 1
        layer.options.color = "#000"
        layer.options.weight = 0.5
        const valor = place.properties.V005
        const nome = place.properties.NM_BAIRRO
        if (valor < escalaSocial) {
            layer.options.fillColor = "#C1EAF3"
            layer.bindPopup(nome + "| " + valor.toFixed(2) + " | Renda baixa")
        } else if (valor > escalaSocial && valor < (escalaSocial * 2)) {
            layer.options.fillColor = "#79E0DF"
            layer.bindPopup(nome + "| " + valor.toFixed(2) + " | Renda média baixa")
        } else if (valor > (escalaSocial * 2) && valor < (escalaSocial * 3)) {
            layer.options.fillColor = "#54C7C1"
            layer.bindPopup(nome + "| " + valor.toFixed(2) + " | Renda média alto")
        } else if (valor > (escalaSocial * 3) && valor < (escalaSocial * 4)) {
            layer.options.fillColor = "#54C7C1"
            layer.bindPopup(nome + "| " + valor.toFixed(2) + " | Renda média alto")
        } else {
            layer.options.fillColor = "#02A199"
            layer.bindPopup(nome + "| " + valor.toFixed(2) + " | Renda alta")
        }
    }

    useEffect(() => {
        const map = L.map(mapContainerRef.current).setView([51.509, -0.08], 10); // Chicago origins
        const mapTiles = '//stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png';
        const osmCPLink = '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
        const mapCPLink = '<a href="http://maps.stamen.com/toner">Stamen Design</a>';
        L.tileLayer(mapTiles, {
            attribution: `${osmCPLink} | ${mapCPLink}`,
            detectRetina: false,
            maxZoom: 25,
            minZoom: 1,
            noWrap: false,
            subdomains: 'abc'
        }).addTo(map);

        const mapa_social = L.geoJSON(data, {
            onEachFeature: onEachFeature
        });
        mapa_social.addTo(map);

        var polygonLatLngs = [
            [51.509, -0.08],
            [51.503, -0.06],
            [51.51, -0.047],
            [51.509, -0.08]
        ];
        var projectedPolygon;
        var triangle = new PIXI.Graphics();

        var pixiContainer = new PIXI.Container();
        pixiContainer.addChild(triangle);

        var firstDraw = true;
        var prevZoom;

        var pixiOverlay = L.pixiOverlay(function (utils) {
            var zoom = utils.getMap().getZoom();
            var container = utils.getContainer();
            var renderer = utils.getRenderer();
            var project = utils.latLngToLayerPoint;
            var scale = utils.getScale();

            if (firstDraw) {
                projectedPolygon = polygonLatLngs.map(function (coords) { return project(coords); });
            }
            if (firstDraw || prevZoom !== zoom) {
                triangle.clear();
                triangle.lineStyle(3 / scale, 0x3388ff, 1);
                triangle.beginFill(0x3388ff, 0.2);
                projectedPolygon.forEach(function (coords, index) {
                    if (index == 0) triangle.moveTo(coords.x, coords.y);
                    else triangle.lineTo(coords.x, coords.y);
                });
                triangle.endFill();
            }
            firstDraw = false;
            prevZoom = zoom;
            renderer.render(container);
        }, pixiContainer);
        pixiOverlay.addTo(map);

        return () => {
            map.remove();
        }
    }, [mapContainerRef]);

    return (
        <div ref={mapContainerRef} id="map-container" className={Style.Map} style={{ marginTop: 50 }}>
        </div>
    );
}

export default Map;
