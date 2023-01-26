import { useEffect, useRef, useState } from "react";
import L from "leaflet"
import "leaflet-pixi-overlay/L.PixiOverlay";
import "leaflet/dist/leaflet.css";
import Style from "../../styles/Map.module.css"
// Hooks
import useCreateMarkers from "../../hooks/useCreateMarkers";
import useCreatePolygon from "../../hooks/useCreatePolygon";

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
function findMaxValueMarker(data, property) {
    if (!data || !property) return;
    var arr = data.map(feauture => parseFloat(feauture[property]));
    var maxValue = Math.max(...arr);
    return maxValue;
}
function findMinValueMarker(data, property) {
    if (!data || !property) return;
    var arr = data.map(feauture => parseFloat(feauture[property]));
    var minValue = Math.min(...arr);
    return minValue;
}

const Map = ({ data = undefined, dataMarkers = undefined, choroplethScaleVar = undefined, markersScaleVar = undefined }) => {
    const [choropletScale, setchoropletScale] = useState(choroplethScaleVar !== undefined ? (findMaxValue(data, choroplethScaleVar) - findMinValue(data, choroplethScaleVar)) / 3.0 : undefined);
    const [factorScaleMarkers, setfactorScaleMarkers] = useState(((findMaxValueMarker(dataMarkers, markersScaleVar) - findMinValueMarker(dataMarkers, markersScaleVar)) / 3.0));
    const [makersScale, setMakersScale] = useState((markersScaleVar || factorScaleMarkers > 0) ? factorScaleMarkers : undefined);
    const mapContainerRef = useRef(null);

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
            if (data !== undefined)
                useCreatePolygon(data, map, choropletScale)
            if (dataMarkers != undefined)
                useCreateMarkers(dataMarkers, map, makersScale);

            return () => {
                map.remove();
            }
        }
    }, [mapContainerRef, data, dataMarkers, choroplethScaleVar, markersScaleVar]);

    return (
        <div ref={mapContainerRef} id="map-container" className={Style.Map} style={{ marginTop: 50 }}>
        </div>
    );
}

export default Map;
