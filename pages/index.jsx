import { Container, TextField, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import data from "../data/mapa-social-caucaia.json"
import data_markers from "../data/evasao-escolar-caucaia-em-2019.json";
const Map = dynamic(() => import("../components/Map"), {
  ssr: false
});

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { useState } from "react";

const Home = () => {
  const [choroplethVar, setChoropletVar] = useState("V005");
  const [makersVar, setMakersVar] = useState("index");

  return (
    <Container>
      <Typography
        variant="h5"
        component="h1"
        align="center"
        style={{ paddingTop: 20 }}
        children={"Mapas usando leaflet.PIXI.Overlay"}
      />
      
      <Map
        data={data}
        dataMarkers={data_markers}
        choropleth={true}
        choroplethScaleVar={choroplethVar}
        markersScaleVar={makersVar}
      />
    </Container>
  );
}

export default Home