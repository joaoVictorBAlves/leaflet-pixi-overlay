import { Container, Typography } from "@mui/material";
import dynamic from "next/dynamic";
const Map = dynamic(() => import("../components/Map"), {
  ssr: false
});

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const Home = () => {
  return (
    <Container>
      <Typography
        variant="h5"
        component="h1"
        align="center"
        style={{ paddingTop: 20 }}
        children={"Mapas usando leaflet.PIXI.Overlay"}
      />
      <Map />
    </Container>
  );
}

export default Home